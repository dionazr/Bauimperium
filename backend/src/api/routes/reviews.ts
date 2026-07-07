import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../server';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler';

const router = Router();

// POST /reviews - Create a review
router.post('/', authenticate, authorize('CLIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, craftsmanId, rating, title, description, categories } = req.body;

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!clientProfile) throw new NotFoundError('Client profile');

    // Verify project belongs to client and is completed
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.clientId !== clientProfile.id) {
      throw new ForbiddenError('Not your project');
    }
    if (project.status !== 'COMPLETED') {
      throw new AppError(400, 'Project must be completed to leave a review');
    }

    // Check for existing review
    const existing = await prisma.review.findUnique({
      where: { projectId_craftsmanId: { projectId, craftsmanId } },
    });
    if (existing) throw new AppError(409, 'Review already exists');

    const review = await prisma.review.create({
      data: {
        projectId,
        authorId: clientProfile.id,
        craftsmanId,
        rating,
        title,
        description,
        categories: categories || null,
        isVerified: true,
      },
      include: {
        author: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.status(201).json({ data: review, message: 'Bewertung abgegeben' });
  } catch (error) {
    next(error);
  }
});

// POST /reviews/:id/respond - Craftsman responds to review
router.post('/:id/respond', authenticate, authorize('CRAFTSMAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { response } = req.body;
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: { craftsman: true },
    });
    if (!review) throw new NotFoundError('Review');
    if (review.craftsman.userId !== req.user!.userId) throw new ForbiddenError('Not your review');

    await prisma.review.update({
      where: { id: req.params.id },
      data: { response, respondedAt: new Date() },
    });

    res.json({ message: 'Antwort gespeichert' });
  } catch (error) {
    next(error);
  }
});

export { router as reviewRouter };
