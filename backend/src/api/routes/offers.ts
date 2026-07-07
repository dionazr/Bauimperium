import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../server';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AppError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { logger } from '../../config/logger';

const router = Router();

const createOfferSchema = z.object({
  body: z.object({
    projectId: z.string(),
    title: z.string().min(3),
    description: z.string().optional(),
    totalAmount: z.number().positive(),
    taxRate: z.number().min(0).max(1).default(0.19),
    validUntil: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    paymentTerms: z.string().optional(),
    warrantyMonths: z.number().int().positive().default(60),
    items: z.array(z.object({
      description: z.string(),
      quantity: z.number().positive(),
      unit: z.string().default('Stk'),
      unitPrice: z.number().positive(),
      category: z.string().optional(),
    })).min(1),
  }),
});

// GET /offers - List offers for current craftsman
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        craftsmanProfile: { select: { id: true } },
        clientProfile: { select: { id: true } },
      },
    });

    let where: any = {};

    if (user?.craftsmanProfile) {
      where.craftsmanId = user.craftsmanProfile.id;
    } else if (user?.clientProfile) {
      where.project = { clientId: user.clientProfile.id };
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, title: true, status: true } },
        items: true,
        craftsman: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    res.json({ data: offers });
  } catch (error) {
    next(error);
  }
});

// POST /offers - Create offer (AI-generiert oder manuell)
router.post('/', authenticate, authorize('CRAFTSMAN'), validate(createOfferSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      projectId, title, description, totalAmount, taxRate,
      validUntil, startDate, endDate, paymentTerms, warrantyMonths, items,
    } = req.body;

    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!craftsmanProfile) throw new NotFoundError('Craftsman profile');

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { assignments: true },
    });
    if (!project) throw new NotFoundError('Project');

    // Auto-generate offer number
    const count = await prisma.offer.count();
    const offerNumber = `ANGEBOT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const netAmount = totalAmount / (1 + taxRate);
    const taxAmount = totalAmount - netAmount;

    const offer = await prisma.offer.create({
      data: {
        projectId,
        craftsmanId: craftsmanProfile.id,
        offerNumber,
        title,
        description,
        totalAmount,
        taxRate,
        netAmount,
        taxAmount,
        grossAmount: totalAmount,
        validUntil: new Date(validUntil),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        paymentTerms,
        warrantyMonths,
        status: 'DRAFT',
        items: {
          create: items.map((item: any, index: number) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            category: item.category,
            sortOrder: index,
          })),
        },
      },
      include: { items: true },
    });

    logger.info(`Offer created: ${offer.offerNumber}`);

    res.status(201).json({ data: offer, message: 'Angebot erstellt' });
  } catch (error) {
    next(error);
  }
});

// POST /offers/ai-generate - KI-Angebotserstellung
router.post('/ai-generate', authenticate, authorize('CRAFTSMAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, voiceNote } = req.body;

    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!craftsmanProfile) throw new NotFoundError('Craftsman profile');

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { specifications: true, aiAnalysis: true },
    });
    if (!project) throw new NotFoundError('Project');

    // Call AI Core for offer generation
    let aiOfferData;
    try {
      const response = await fetch(`${config.aiCore.url}/api/v1/generate/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: project.title,
          description: project.description,
          specifications: project.specifications,
          aiAnalysis: project.aiAnalysis,
          voiceNote,
          craftsmanInfo: {
            companyName: craftsmanProfile.companyName,
            ratePerHour: craftsmanProfile.craftsmanCategories[0]?.ratePerHour,
          },
        }),
      });
      aiOfferData = await response.json();
    } catch (aiError) {
      logger.warn('AI core unavailable, using fallback calculation');
      // Fallback: Simple calculation based on project specs
      aiOfferData = {
        items: [
          { description: `${project.title} - Arbeitsleistung`, quantity: 1, unit: 'pauschal', unitPrice: parseFloat(project.budgetMin || '5000') },
          { description: 'Materialkosten (geschätzt)', quantity: 1, unit: 'pauschal', unitPrice: parseFloat(project.budgetMin || '3000') * 0.6 },
          { description: 'Nebenkosten (Entsorgung, Anfahrten)', quantity: 1, unit: 'pauschal', unitPrice: 500 },
        ],
        totalAmount: 0, // Will be calculated
        confidence: 0.5,
      };
      // Calculate total
      aiOfferData.totalAmount = aiOfferData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    }

    // Create offer from AI data
    const count = await prisma.offer.count();
    const offerNumber = `ANGEBOT-AI-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const taxRate = 0.19;
    const netAmount = aiOfferData.totalAmount / (1 + taxRate);
    const taxAmount = aiOfferData.totalAmount - netAmount;

    const offer = await prisma.offer.create({
      data: {
        projectId: project.id,
        craftsmanId: craftsmanProfile.id,
        offerNumber,
        title: `KI-Angebot: ${project.title}`,
        description: 'Automatisch generiertes Angebot basierend auf KI-Analyse',
        totalAmount: aiOfferData.totalAmount,
        taxRate,
        netAmount,
        taxAmount,
        grossAmount: aiOfferData.totalAmount,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        isAiGenerated: true,
        aiConfidence: aiOfferData.confidence || 0.5,
        items: {
          create: aiOfferData.items.map((item: any, index: number) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            sortOrder: index,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({
      data: offer,
      message: 'KI-Angebot wurde erstellt. Bitte prüfen und ggf. anpassen.',
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /offers/:id/send - Send offer to client
router.patch('/:id/send', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: { craftsman: true, project: { include: { client: { include: { user: true } } } } },
    });
    if (!offer) throw new NotFoundError('Offer');
    if (offer.craftsman.userId !== req.user!.userId) throw new ForbiddenError('Not your offer');
    if (offer.status !== 'DRAFT') throw new AppError(400, 'Offer is not in draft status');

    const updated = await prisma.offer.update({
      where: { id: req.params.id },
      data: { status: 'SENT' },
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: offer.project.client.user.id,
        type: 'NEW_OFFER',
        title: 'Neues Angebot',
        body: `Angebot ${offer.offerNumber} von ${offer.craftsman.companyName} für ${offer.project.title}`,
        data: { offerId: offer.id, projectId: offer.project.id },
      },
    });

    res.json({ data: updated, message: 'Angebot wurde versendet' });
  } catch (error) {
    next(error);
  }
});

// POST /offers/:id/accept - Client accepts offer
router.post('/:id/accept', authenticate, authorize('CLIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: {
        project: { include: { client: true } },
        craftsman: true,
      },
    });
    if (!offer) throw new NotFoundError('Offer');
    if (offer.status !== 'SENT' && offer.status !== 'VIEWED') throw new AppError(400, 'Offer cannot be accepted');

    await prisma.$transaction(async (tx) => {
      // Update offer
      await tx.offer.update({
        where: { id: offer.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      // Update project
      await tx.project.update({
        where: { id: offer.projectId },
        data: { status: 'IN_OFFER_PHASE' },
      });

      // Create assignment
      await tx.projectAssignment.create({
        data: {
          projectId: offer.projectId,
          craftsmanId: offer.craftsmanId,
          offerId: offer.id,
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Create milestones (e.g., 4 phases)
      const phases = [
        { name: 'Planung & Vorbereitung', percentage: 0.15 },
        { name: 'Rohbau & Grundstruktur', percentage: 0.35 },
        { name: 'Ausbau & Installationen', percentage: 0.35 },
        { name: 'Endabnahme & Übergabe', percentage: 0.15 },
      ];

      for (let i = 0; i < phases.length; i++) {
        await tx.milestone.create({
          data: {
            projectId: offer.projectId,
            name: phases[i].name,
            phaseNumber: i + 1,
            amount: parseFloat(offer.totalAmount.toString()) * phases[i].percentage,
            percentage: phases[i].percentage * 100,
            status: i === 0 ? 'PENDING' : 'PENDING',
          },
        });
      }
    });

    // Notify craftsman
    await prisma.notification.create({
      data: {
        userId: offer.craftsman.userId,
        type: 'OFFER_ACCEPTED',
        title: 'Angebot wurde angenommen!',
        body: `Ihr Angebot ${offer.offerNumber} für ${offer.project.title} wurde akzeptiert.`,
        data: { offerId: offer.id, projectId: offer.projectId },
      },
    });

    logger.info(`Offer ${offer.offerNumber} accepted`);

    res.json({ message: 'Angebot angenommen. Bitte hinterlegen Sie die Anzahlung auf dem Treuhandkonto.' });
  } catch (error) {
    next(error);
  }
});

// POST /offers/:id/reject
router.post('/:id/reject', authenticate, authorize('CLIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: { project: true, craftsman: true },
    });
    if (!offer) throw new NotFoundError('Offer');

    await prisma.offer.update({
      where: { id: offer.id },
      data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: reason },
    });

    await prisma.notification.create({
      data: {
        userId: offer.craftsman.userId,
        type: 'OFFER_REJECTED',
        title: 'Angebot abgelehnt',
        body: `Ihr Angebot für ${offer.project.title} wurde abgelehnt.`,
        data: { offerId: offer.id, projectId: offer.projectId },
      },
    });

    res.json({ message: 'Angebot abgelehnt' });
  } catch (error) {
    next(error);
  }
});

export { router as offerRouter };
