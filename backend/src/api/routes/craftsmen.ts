import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../server';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth';
import { AppError, NotFoundError } from '../../middleware/errorHandler';
import { logger } from '../../config/logger';

const router = Router();

// GET /craftsmen - List all craftsmen
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      verificationStatus: 'VERIFIED',
    };

    // Filter by category
    if (req.query.categoryId) {
      where.craftsmanCategories = {
        some: { categoryId: req.query.categoryId },
      };
    }

    // Filter by location
    if (req.query.city) {
      where.serviceAreas = {
        some: {
          address: { city: { contains: req.query.city as string, mode: 'insensitive' } },
        },
      };
    }

    // Filter by premium
    if (req.query.isPremium === 'true') {
      where.isPremium = true;
    }

    const [craftsmen, total] = await Promise.all([
      prisma.craftsmanProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPremium: 'desc' }, { creditRating: 'desc' }],
        include: {
          user: {
            select: { firstName: true, lastName: true, avatarUrl: true, createdAt: true },
          },
          address: true,
          craftsmanCategories: {
            include: { category: true },
            where: { isPrimary: true },
          },
          craftsmanReviews: {
            select: { rating: true },
          },
          workPhotos: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { projects: true, craftsmanReviews: true } },
        },
      }),
      prisma.craftsmanProfile.count({ where }),
    ]);

    // Calculate average rating for each craftsman
    const craftsmenWithRating = craftsmen.map((c) => {
      const ratings = c.craftsmanReviews.map((r) => r.rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        ...c,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length,
        craftsmanReviews: undefined,
      };
    });

    res.json({
      data: craftsmenWithRating,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

// GET /craftsmen/:id - Get craftsman profile
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const craftsman = await prisma.craftsmanProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true, createdAt: true },
        },
        address: true,
        craftsmanCategories: { include: { category: true } },
        craftsmanSkills: true,
        craftsmanCertificates: {
          where: { verified: true },
        },
        serviceAreas: { include: { address: true } },
        workPhotos: { orderBy: { createdAt: 'desc' }, take: 20 },
        craftsmanReviews: {
          include: {
            project: { select: { title: true } },
            author: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { projects: true, craftsmanReviews: true } },
      },
    });

    if (!craftsman) {
      throw new NotFoundError('Craftsman');
    }

    // Calculate average rating
    const ratings = craftsman.craftsmanReviews.map((r) => r.rating);
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    res.json({
      data: {
        ...craftsman,
        averageRating: Math.round(avgRating * 10) / 10,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /craftsmen/me/profile - Get own craftsman profile
router.get('/me/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        address: true,
        craftsmanCategories: { include: { category: true } },
        craftsmanSkills: true,
        craftsmanCertificates: true,
        serviceAreas: { include: { address: true } },
        subscription: { include: { plan: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    if (!profile) {
      throw new NotFoundError('Craftsman profile');
    }

    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});

// PATCH /craftsmen/me/profile - Update own craftsman profile
router.patch('/me/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!craftsmanProfile) throw new NotFoundError('Craftsman profile');

    const allowedFields = [
      'companyName', 'companyLegalForm', 'description', 'website',
      'foundedYear', 'employeeCount', 'annualRevenue', 'logoUrl',
      'coverImageUrl',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updated = await prisma.craftsmanProfile.update({
      where: { id: craftsmanProfile.id },
      data: updateData,
    });

    res.json({ data: updated, message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
});

// POST /craftsmen/me/categories - Add categories
router.post('/me/categories', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!craftsmanProfile) throw new NotFoundError('Craftsman profile');

    const { categoryId, experienceYears, isPrimary, ratePerHour } = req.body;

    const existing = await prisma.craftsmanCategory.findUnique({
      where: { craftsmanId_categoryId: { craftsmanId: craftsmanProfile.id, categoryId } },
    });
    if (existing) throw new AppError(409, 'Category already added');

    const category = await prisma.craftsmanCategory.create({
      data: {
        craftsmanId: craftsmanProfile.id,
        categoryId,
        experienceYears,
        isPrimary: isPrimary || false,
        ratePerHour: ratePerHour ? parseFloat(ratePerHour) : null,
      },
      include: { category: true },
    });

    res.status(201).json({ data: category });
  } catch (error) {
    next(error);
  }
});

// POST /craftsmen/me/availability - Set availability
router.post('/me/availability', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!craftsmanProfile) throw new NotFoundError('Craftsman profile');

    const { availability } = req.body; // Array of { dayOfWeek, startTime, endTime, isAvailable }

    // Delete existing and recreate
    await prisma.availability.deleteMany({
      where: { craftsmanId: craftsmanProfile.id },
    });

    const created = await prisma.availability.createMany({
      data: availability.map((a: any) => ({
        craftsmanId: craftsmanProfile.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isAvailable: a.isAvailable ?? true,
      })),
    });

    res.json({ data: created, message: 'Availability updated' });
  } catch (error) {
    next(error);
  }
});

export { router as craftsmanRouter };
