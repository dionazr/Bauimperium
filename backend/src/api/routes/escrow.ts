import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../server';
import { authenticate } from '../../middleware/auth';
import { AppError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { config } from '../../config';
import { logger } from '../../config/logger';

const router = Router();

// POST /escrow/fund - Fund escrow account for accepted offer
router.post('/fund', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, offerId } = req.body;

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!clientProfile) throw new NotFoundError('Client profile');

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true },
    });
    if (!project) throw new NotFoundError('Project');
    if (project.clientId !== clientProfile.id) throw new ForbiddenError('Not your project');

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { items: true },
    });
    if (!offer) throw new NotFoundError('Offer');

    // Phase 1 amount (first milestone)
    const firstMilestone = await prisma.milestone.findFirst({
      where: { projectId, phaseNumber: 1 },
    });
    if (!firstMilestone) throw new NotFoundError('First milestone');

    const platformFee = parseFloat(offer.totalAmount.toString()) * config.fees.clientPercentage;
    const phaseAmount = parseFloat(firstMilestone.amount.toString());

    // Create escrow account with Stripe (simulated)
    // In production: Create Stripe PaymentIntent or Transfer
    const stripePaymentIntentId = `pi_simulated_${Date.now()}`;

    const escrowAccount = await prisma.escrowAccount.create({
      data: {
        projectId: project.id,
        clientId: clientProfile.id,
        offerId: offer.id,
        stripePaymentIntentId,
        totalAmount: offer.totalAmount,
        remainingAmount: offer.totalAmount,
        platformFee,
        status: 'PENDING_FUNDING',
        transactions: {
          create: {
            type: 'DEPOSIT',
            amount: phaseAmount,
            stripePaymentId: stripePaymentIntentId,
            milestoneId: firstMilestone.id,
            description: `Anzahlung Phase 1: ${firstMilestone.name}`,
            status: 'PENDING',
          },
        },
      },
      include: { transactions: true },
    });

    // Update milestone
    await prisma.milestone.update({
      where: { id: firstMilestone.id },
      data: { escrowAccountId: escrowAccount.id, status: 'PENDING' },
    });

    logger.info(`Escrow account created: ${escrowAccount.id} for project ${projectId}`);

    res.status(201).json({
      data: escrowAccount,
      message: 'Treuhandkonto wurde eröffnet. Bitte überweisen Sie den Betrag auf das untenstehende Konto.',
      paymentInfo: {
        amount: phaseAmount,
        purpose: `Projekt ${project.title} - Phase 1`,
        bankDetails: {
          bank: 'Bauimperium Treuhand GmbH',
          iban: 'DE12 3456 7890 1234 5678 90',
          bic: 'BAIMDEXX',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /escrow/:id/release - Release milestone payment
router.post('/:id/release', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { milestoneId } = req.body;

    const escrow = await prisma.escrowAccount.findUnique({
      where: { id: req.params.id },
      include: { project: { include: { client: true } } },
    });
    if (!escrow) throw new NotFoundError('Escrow account');

    // Verify client
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!clientProfile || escrow.clientId !== clientProfile.id) {
      throw new ForbiddenError('Not authorized to release funds');
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { escrowAccount: true },
    });
    if (!milestone) throw new NotFoundError('Milestone');
    if (milestone.status !== 'VERIFIED' && milestone.status !== 'APPROVED') {
      throw new AppError(400, 'Milestone must be verified first');
    }

    // Release funds
    await prisma.$transaction(async (tx) => {
      // Update milestone
      await tx.milestone.update({
        where: { id: milestone.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      // Update escrow
      const releasedAmount = parseFloat(escrow.releasedAmount.toString()) + parseFloat(milestone.amount.toString());
      const remainingAmount = parseFloat(escrow.totalAmount.toString()) - releasedAmount;

      await tx.escrowAccount.update({
        where: { id: escrow.id },
        data: {
          releasedAmount,
          remainingAmount,
          status: remainingAmount <= 0 ? 'COMPLETED' : 'PARTIALLY_RELEASED',
          completedAt: remainingAmount <= 0 ? new Date() : null,
        },
      });

      // Create transaction record
      await tx.escrowTransaction.create({
        data: {
          escrowAccountId: escrow.id,
          type: 'MILESTONE_RELEASE',
          amount: milestone.amount,
          milestoneId: milestone.id,
          description: `Freigabe Phase ${milestone.phaseNumber}: ${milestone.name}`,
          status: 'COMPLETED',
          executedAt: new Date(),
        },
      });

      // If completed, update project
      if (remainingAmount <= 0) {
        await tx.project.update({
          where: { id: escrow.projectId },
          data: { status: 'COMPLETED' },
        });
      }
    });

    // Notify craftsman
    const assignment = await prisma.projectAssignment.findFirst({
      where: { projectId: escrow.projectId, status: 'ACCEPTED' },
      include: { craftsman: { include: { user: true } } },
    });

    if (assignment) {
      await prisma.notification.create({
        data: {
          userId: assignment.craftsman.user.id,
          type: 'MILESTONE_RELEASED',
          title: 'Zahlung freigegeben',
          body: `Phase ${milestone.phaseNumber} (${milestone.name}) wurde freigegeben: €${milestone.amount}`,
          data: { escrowId: escrow.id, milestoneId: milestone.id },
        },
      });
    }

    logger.info(`Milestone ${milestoneId} released from escrow ${escrow.id}`);

    res.json({ message: `Phase ${milestone.phaseNumber} freigegeben. €${milestone.amount} wurde überwiesen.` });
  } catch (error) {
    next(error);
  }
});

// POST /escrow/:id/dispute - Open dispute
router.post('/:id/dispute', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { milestoneId, reason } = req.body;

    const escrow = await prisma.escrowAccount.findUnique({
      where: { id: req.params.id },
    });
    if (!escrow) throw new NotFoundError('Escrow account');

    await prisma.escrowAccount.update({
      where: { id: escrow.id },
      data: { status: 'DISPUTED' },
    });

    if (milestoneId) {
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status: 'DISPUTED' },
      });
    }

    // Notify admin
    const admins = await prisma.adminProfile.findMany({
      include: { user: { select: { id: true } } },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.user.id,
          type: 'SYSTEM',
          title: 'Streitfall eröffnet',
          body: `Escrow ${escrow.id}: ${reason || 'Kein Grund angegeben'}`,
          data: { escrowId: escrow.id, milestoneId },
        },
      });
    }

    logger.warn(`Dispute opened on escrow ${escrow.id}: ${reason}`);

    res.json({
      message: 'Streitfall wurde eröffnet. Ein Schlichter wird sich binnen 24h melden.',
    });
  } catch (error) {
    next(error);
  }
});

// GET /escrow/my - Get my escrow accounts
router.get('/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        clientProfile: { select: { id: true } },
        craftsmanProfile: { select: { id: true } },
      },
    });

    let where: any = {};

    if (user?.clientProfile) {
      where.clientId = user.clientProfile.id;
    } else if (user?.craftsmanProfile) {
      where.project = {
        assignments: { some: { craftsmanId: user.craftsmanProfile.id } },
      };
    }

    const accounts = await prisma.escrowAccount.findMany({
      where,
      include: {
        project: { select: { id: true, title: true } },
        milestones: { orderBy: { phaseNumber: 'asc' } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: accounts });
  } catch (error) {
    next(error);
  }
});

export { router as escrowRouter };
