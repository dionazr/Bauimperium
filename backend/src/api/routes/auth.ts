import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../server';
import { config } from '../../config';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError, ConflictError, NotFoundError, UnauthorizedError } from '../../middleware/errorHandler';
import { logger } from '../../config/logger';

const router = Router();

// Validation Schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
    role: z.enum(['CLIENT', 'CRAFTSMAN']),
    companyName: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

// POST /auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone, role, companyName } = req.body;

    // Check existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role,
          isVerified: false,
        },
      });

      if (role === 'CLIENT') {
        await tx.clientProfile.create({
          data: {
            userId: newUser.id,
            companyName: companyName || null,
          },
        });
      } else if (role === 'CRAFTSMAN') {
        await tx.craftsmanProfile.create({
          data: {
            userId: newUser.id,
            companyName: companyName || `${lastName} GmbH`,
            onboardingStep: 0,
          },
        });
      }

      return newUser;
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    logger.info(`New user registered: ${email} (${role})`);

    res.status(201).json({
      message: 'Registration successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Track login attempt
    await prisma.loginAttempt.create({
      data: {
        email,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        success: false,
      },
    });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update login attempt
    await prisma.loginAttempt.updateMany({
      where: { email, success: false },
      data: { success: true, userId: user.id },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const newAccessToken = generateAccessToken(storedToken.user);
    const newRefreshToken = await generateRefreshToken(storedToken.user.id);

    res.json({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken, userId: req.user!.userId },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        clientProfile: { include: { address: true } },
        craftsmanProfile: {
          include: {
            address: true,
            craftsmanCategories: { include: { category: true } },
            subscription: { include: { plan: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({ data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

// Helper Functions
function generateAccessToken(user: any): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
}

async function generateRefreshToken(userId: string): Promise<string> {
  const token = uuidv4();
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + config.jwt.refreshExpiryMs),
    },
  });
  return token;
}

function sanitizeUser(user: any) {
  const { passwordHash, twoFactorSecret, ...safeUser } = user;
  return safeUser;
}

export { router as authRouter };
