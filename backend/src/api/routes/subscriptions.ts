import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../server';
import { authenticate, authorize } from '../../middleware/auth';
import { NotFoundError } from '../../middleware/errorHandler';
import { logger } from '../../config/logger';

const router = Router();

// GET /subscriptions/plans - List available plans
router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ data: plans });
  } catch (error) {
    next(error);
  }
});

// POST /subscriptions/subscribe - Subscribe to a plan
router.post('/subscribe', authenticate, authorize('CRAFTSMAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.body;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundError('Plan');

    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { subscription: { include: { plan: true } } },
    });
    if (!craftsmanProfile) throw new NotFoundError('Craftsman profile');

    // Cancel existing subscription if any
    if (craftsmanProfile.subscription) {
      await prisma.subscription.update({
        where: { id: craftsmanProfile.subscription.id },
        data: { status: 'CANCELED', cancelledAt: new Date() },
      });
    }

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        craftsmanId: craftsmanProfile.id,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialEndsAt: plan.priceMonthly > 0 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
      },
      include: { plan: true },
    });

    // Update craftsman premium status
    await prisma.craftsmanProfile.update({
      where: { id: craftsmanProfile.id },
      data: {
        isPremium: plan.priceMonthly > 0,
        premiumSince: plan.priceMonthly > 0 ? new Date() : null,
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        monthlySubscriptionId: subscription.id,
      },
    });

    logger.info(`Craftsman ${craftsmanProfile.companyName} subscribed to ${plan.nameDe}`);

    res.status(201).json({
      data: subscription,
      message: `Abonnement für ${plan.nameDe} aktiviert. ${plan.priceMonthly > 0 ? '14 Tage kostenlos testen.' : 'Kostenloser Plan aktiv.'}`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /subscriptions/my - Get current subscription
router.get('/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    });
    if (!craftsmanProfile) {
      res.json({ data: null });
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        craftsmanId: craftsmanProfile.id,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
        invoices: { orderBy: { createdAt: 'desc' }, take: 6 },
      },
    });

    res.json({ data: subscription });
  } catch (error) {
    next(error);
  }
});

// POST /subscriptions/cancel - Cancel subscription
router.post('/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { subscription: true },
    });
    if (!craftsmanProfile || !craftsmanProfile.subscription) {
      throw new NotFoundError('Active subscription');
    }

    await prisma.subscription.update({
      where: { id: craftsmanProfile.subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
        status: 'CANCELED',
      },
    });

    await prisma.craftsmanProfile.update({
      where: { id: craftsmanProfile.id },
      data: { isPremium: false },
    });

    res.json({ message: 'Abonnement wurde gekündigt. Läuft bis zum Ende des Abrechnungszeitraums.' });
  } catch (error) {
    next(error);
  }
});

export { router as subscriptionRouter };
