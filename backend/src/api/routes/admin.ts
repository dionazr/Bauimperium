import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../server';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError, NotFoundError } from '../../middleware/errorHandler';
import { logger } from '../../config/logger';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

// GET /admin/dashboard - Admin dashboard stats
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalCraftsmen,
      totalClients,
      totalProjects,
      activeProjects,
      completedProjects,
      totalEscrowVolume,
      totalRevenue,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.craftsmanProfile.count(),
      prisma.clientProfile.count(),
      prisma.project.count(),
      prisma.project.count({ where: { status: { in: ['PUBLISHED', 'IN_OFFER_PHASE', 'IN_EXECUTION'] } } }),
      prisma.project.count({ where: { status: 'COMPLETED' } }),
      prisma.escrowAccount.aggregate({ _sum: { totalAmount: true } }),
      prisma.escrowAccount.aggregate({ _sum: { platformFee: true } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true } }),
    ]);

    res.json({
      data: {
        overview: {
          totalUsers,
          totalCraftsmen,
          totalClients,
          totalProjects,
          activeProjects,
          completedProjects,
          completionRate: totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : 0,
        },
        financials: {
          totalEscrowVolume: totalEscrowVolume._sum.totalAmount || 0,
          totalRevenue: totalRevenue._sum.platformFee || 0,
          pendingDisputes: await prisma.escrowAccount.count({ where: { status: 'DISPUTED' } }),
        },
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /admin/users - List all users
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.role) where.role = req.query.role;
    if (req.query.search) {
      where.OR = [
        { email: { contains: req.query.search as string, mode: 'insensitive' } },
        { firstName: { contains: req.query.search as string, mode: 'insensitive' } },
        { lastName: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true,
          isVerified: true, isActive: true, createdAt: true,
          clientProfile: { select: { kycStatus: true } },
          craftsmanProfile: { select: { verificationStatus: true, isPremium: true, companyName: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

// PATCH /admin/users/:id/toggle-status
router.patch('/users/:id/toggle-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
    });

    logger.info(`User ${updated.email} status toggled to ${updated.isActive}`);

    res.json({ data: { id: updated.id, isActive: updated.isActive }, message: `User ${updated.isActive ? 'aktiviert' : 'deaktiviert'}` });
  } catch (error) {
    next(error);
  }
});

// GET /admin/disputes - List all disputes
router.get('/disputes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const disputes = await prisma.escrowAccount.findMany({
      where: { status: 'DISPUTED' },
      include: {
        project: { select: { id: true, title: true } },
        client: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        milestones: { where: { status: 'DISPUTED' } },
      },
    });

    res.json({ data: disputes });
  } catch (error) {
    next(error);
  }
});

// GET /admin/verifications - Pending verifications
router.get('/verifications', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const pendingVerifications = await prisma.craftsmanProfile.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        craftsmanCertificates: true,
        craftsmanCategories: { include: { category: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ data: pendingVerifications });
  } catch (error) {
    next(error);
  }
});

// POST /admin/verifications/:id/verify
router.post('/verifications/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body; // VERIFIED or REJECTED

    const craftsman = await prisma.craftsmanProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!craftsman) throw new NotFoundError('Craftsman');

    await prisma.craftsmanProfile.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: status,
        isVerified: status === 'VERIFIED',
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: craftsman.user.id,
        type: 'VERIFICATION_STATUS',
        title: status === 'VERIFIED' ? 'Verifizierung erfolgreich' : 'Verifizierung abgelehnt',
        body: status === 'VERIFIED'
          ? 'Ihr Profil wurde erfolgreich verifiziert. Sie können jetzt Projekte annehmen.'
          : `Ihre Verifizierung wurde abgelehnt. Grund: ${notes || 'Bitte kontaktieren Sie den Support.'}`,
      },
    });

    logger.info(`Craftsman ${craftsman.companyName} verification: ${status}`);

    res.json({ message: `Verifizierung ${status === 'VERIFIED' ? 'bestätigt' : 'abgelehnt'}` });
  } catch (error) {
    next(error);
  }
});

export { router as adminRouter };
