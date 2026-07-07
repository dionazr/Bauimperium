import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../server';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { uploadMultiple } from '../../middleware/upload';
import { AppError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { logger } from '../../config/logger';

const router = Router();

// Validation Schemas
const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    budgetMin: z.number().positive().optional(),
    budgetMax: z.number().positive().optional(),
    budgetType: z.enum(['FIXED', 'HOURLY', 'ESTIMATE', 'NEGOTIABLE']).optional(),
    squareMeters: z.number().positive().optional(),
    startDatePreferred: z.string().optional(),
    endDatePreferred: z.string().optional(),
    isUrgent: z.boolean().optional(),
    isFinancingRequired: z.boolean().optional(),
    address: z.object({
      street: z.string(),
      houseNumber: z.string(),
      city: z.string(),
      postalCode: z.string(),
      state: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    specifications: z.array(z.object({
      key: z.string(),
      value: z.string(),
      unit: z.string().optional(),
      isRequired: z.boolean().optional(),
    })).optional(),
  }),
});

const updateProjectSchema = createProjectSchema.partial();

// GET /projects - List projects
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = { status: 'PUBLISHED' };

    // Filter by category
    if (req.query.categoryId) {
      where.categoryId = req.query.categoryId;
    }

    // Filter by location
    if (req.query.city) {
      where.address = { city: { contains: req.query.city as string, mode: 'insensitive' } };
    }

    // Filter by budget range
    if (req.query.budgetMin) {
      where.budgetMin = { gte: parseFloat(req.query.budgetMin as string) };
    }
    if (req.query.budgetMax) {
      where.budgetMax = { lte: parseFloat(req.query.budgetMax as string) };
    }

    // If user is craftsman, show invited projects too
    if (req.user) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });

      if (user?.role === 'CRAFTSMAN') {
        // For craftsmen, also include their invited/assigned projects
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          category: true,
          address: true,
          media: true,
          _count: { select: { applications: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      data: projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /projects/my - Get client's own projects
router.get('/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { role: true, clientProfile: { select: { id: true } }, craftsmanProfile: { select: { id: true } } },
    });

    let where: any = {};

    if (user?.role === 'CLIENT' && user.clientProfile) {
      where.clientId = user.clientProfile.id;
    } else if (user?.role === 'CRAFTSMAN' && user.craftsmanProfile) {
      where.assignments = { some: { craftsmanId: user.craftsmanProfile.id } };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        category: true,
        address: true,
        media: true,
        milestones: true,
        assignments: {
          include: {
            craftsman: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        _count: { select: { applications: true, messages: true } },
      },
    });

    res.json({ data: projects });
  } catch (error) {
    next(error);
  }
});

// POST /projects - Create a new project
router.post('/', authenticate, authorize('CLIENT'), uploadMultiple('media', 10), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title, description, categoryId, budgetMin, budgetMax,
      budgetType, squareMeters, startDatePreferred, endDatePreferred,
      isUrgent, isFinancingRequired, address, specifications, voiceNoteUrl,
    } = req.body;

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!clientProfile) {
      throw new NotFoundError('Client profile');
    }

    // Create address if provided
    let addressId: string | undefined;
    if (address) {
      const newAddress = await prisma.address.create({ data: address });
      addressId = newAddress.id;
    }

    // Create project in transaction
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          clientId: clientProfile.id,
          title,
          description,
          voiceNoteUrl,
          categoryId,
          addressId,
          budgetMin: budgetMin ? parseFloat(budgetMin) : null,
          budgetMax: budgetMax ? parseFloat(budgetMax) : null,
          budgetType: budgetType || 'FIXED',
          squareMeters: squareMeters ? parseFloat(squareMeters) : null,
          startDatePreferred: startDatePreferred ? new Date(startDatePreferred) : null,
          endDatePreferred: endDatePreferred ? new Date(endDatePreferred) : null,
          isUrgent: isUrgent === 'true',
          isFinancingRequired: isFinancingRequired === 'true',
          status: 'DRAFT',
        },
      });

      // Create specifications
      if (specifications) {
        const specs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
        for (const spec of specs) {
          await tx.projectSpecification.create({
            data: {
              projectId: newProject.id,
              key: spec.key,
              value: spec.value,
              unit: spec.unit,
              isRequired: spec.isRequired ?? true,
            },
          });
        }
      }

      // Handle media files
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (const file of files) {
          await tx.projectMedia.create({
            data: {
              projectId: newProject.id,
              type: file.mimetype.startsWith('video') ? 'VIDEO_3D' : 'IMAGE',
              url: `/uploads/${file.filename}`,
              fileName: file.originalname,
              fileSize: file.size,
              mimeType: file.mimetype,
            },
          });
        }
      }

      return tx.project.findUnique({
        where: { id: newProject.id },
        include: {
          category: true,
          address: true,
          specifications: true,
          media: true,
        },
      });
    });

    logger.info(`Project created: ${project?.title} (${project?.id})`);

    // Trigger AI analysis asynchronously
    try {
      const response = await fetch(`${config.aiCore.url}/api/v1/analyze/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, title, description }),
      });
      const aiResult = await response.json();
      await prisma.aIAnalysis.create({
        data: {
          projectId: project.id,
          rawInput: description || title,
          rawInputType: 'TEXT',
          confidence: aiResult.confidence,
          resultSpecs: aiResult.specifications,
          estimatedCosts: aiResult.estimatedCosts,
          estimatedDuration: aiResult.estimatedDuration,
          dinNormReferences: aiResult.dinNorms,
        },
      });
      logger.info(`AI analysis completed for project ${project.id}`);
    } catch (aiError) {
      logger.warn({ err: aiError }, `AI analysis failed for project ${project.id}, will retry`);
    }

    res.status(201).json({ data: project, message: 'Project created successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /projects/:id - Get project details
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          include: {
            user: { select: { firstName: true, lastName: true, createdAt: true } },
          },
        },
        category: true,
        address: true,
        specifications: { orderBy: { sortOrder: 'asc' } },
        media: true,
        aiAnalysis: true,
        milestones: { orderBy: { phaseNumber: 'asc' } },
        assignments: {
          include: {
            craftsman: {
              include: {
                user: { select: { firstName: true, lastName: true } },
                craftsmanCategories: { include: { category: true } },
              },
            },
          },
        },
        applications: {
          include: {
            craftsman: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        escrowAccounts: true,
        reviews: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    res.json({ data: project });
  } catch (error) {
    next(error);
  }
});

// PATCH /projects/:id - Update project
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.client.userId !== req.user!.userId) {
      throw new ForbiddenError('Not your project');
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        category: true,
        address: true,
        specifications: true,
      },
    });

    res.json({ data: updated, message: 'Project updated' });
  } catch (error) {
    next(error);
  }
});

// POST /projects/:id/publish - Publish project
router.post('/:id/publish', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { client: true },
    });

    if (!project) throw new NotFoundError('Project');
    if (project.client.userId !== req.user!.userId) throw new ForbiddenError('Not your project');
    if (project.status !== 'DRAFT') throw new AppError(400, 'Project is not in draft status');

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'PUBLISHED' },
    });

    logger.info(`Project published: ${updated.id}`);

    // Notify matching craftsmen
    notifyMatchingCraftsmen(project.id);

    res.json({ data: updated, message: 'Project published' });
  } catch (error) {
    next(error);
  }
});

// POST /projects/:id/apply - Craftsman applies to project
router.post('/:id/apply', authenticate, authorize('CRAFTSMAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, proposedPrice, proposedStartDate, proposedEndDate } = req.body;

    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!craftsmanProfile) throw new NotFoundError('Craftsman profile');

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) throw new NotFoundError('Project');
    if (project.status !== 'PUBLISHED') throw new AppError(400, 'Project is not accepting applications');

    const existing = await prisma.projectApplication.findUnique({
      where: { projectId_craftsmanId: { projectId: project.id, craftsmanId: craftsmanProfile.id } },
    });
    if (existing) throw new AppError(409, 'Already applied to this project');

    const application = await prisma.projectApplication.create({
      data: {
        projectId: project.id,
        craftsmanId: craftsmanProfile.id,
        message,
        proposedPrice: proposedPrice ? parseFloat(proposedPrice) : null,
        proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : null,
        proposedEndDate: proposedEndDate ? new Date(proposedEndDate) : null,
      },
      include: {
        craftsman: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: project.client.userId,
        type: 'NEW_OFFER',
        title: 'Neue Bewerbung',
        body: `${craftsmanProfile.companyName} hat sich auf Ihr Projekt beworben`,
        data: { applicationId: application.id, projectId: project.id },
      },
    });

    res.status(201).json({ data: application });
  } catch (error) {
    next(error);
  }
});

// Helper: Notify matching craftsmen about new project
async function notifyMatchingCraftsmen(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { address: true, category: true },
    });
    if (!project) return;

    // Find craftsmen matching category and service area
    const matchingCraftsmen = await prisma.craftsmanCategory.findMany({
      where: {
        categoryId: project.categoryId,
        craftsman: {
          isActive: true,
          verificationStatus: 'VERIFIED',
          isPremium: true,
        },
      },
      include: {
        craftsman: {
          include: { user: { select: { id: true } } },
        },
      },
      take: 50,
    });

    // Create notifications
    const notifications = matchingCraftsmen.map((mc) => ({
      userId: mc.craftsman.user.id,
      type: 'NEW_PROJECT' as const,
      title: 'Neues Projekt verfügbar',
      body: `${project.title} - Budget: €${project.budgetMin} bis €${project.budgetMax}`,
      data: { projectId: project.id },
    }));

    for (const notif of notifications) {
      await prisma.notification.create({ data: notif });
    }

    logger.info(`Notified ${notifications.length} craftsmen about project ${projectId}`);
  } catch (error) {
    logger.error({ err: error }, 'Failed to notify craftsmen');
  }
}

export { router as projectRouter };
