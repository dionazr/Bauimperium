import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../server';
import { io } from '../../server';
import { authenticate } from '../../middleware/auth';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { logger } from '../../config/logger';

const router = Router();

// GET /messages/:projectId - Get messages for a project
router.get('/:projectId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        client: true,
        assignments: { select: { craftsmanId: true } },
      },
    });
    if (!project) throw new NotFoundError('Project');

    // Verify user is part of the project
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        clientProfile: true,
        craftsmanProfile: true,
      },
    });

    const isClient = user?.clientProfile?.id === project.clientId;
    const isCraftsman = project.assignments.some((a) => a.craftsmanId === user?.craftsmanProfile?.id);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    if (!isClient && !isCraftsman && !isAdmin) {
      throw new ForbiddenError('Not part of this project');
    }

    const messages = await prisma.message.findMany({
      where: { projectId: req.params.projectId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ data: messages });
  } catch (error) {
    next(error);
  }
});

// POST /messages/:projectId - Send a message
router.post('/:projectId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, messageType, mediaUrl, receiverId } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        client: true,
        assignments: { include: { craftsman: true } },
      },
    });
    if (!project) throw new NotFoundError('Project');

    // Determine the receiver
    let receiverIdFinal = receiverId;
    if (!receiverIdFinal) {
      // Auto-determine: send to the other party
      const projectParticipantIds = [
        project.client.userId,
        ...project.assignments.map((a) => a.craftsman.userId),
      ];
      receiverIdFinal = projectParticipantIds.find((id) => id !== req.user!.userId);
    }

    if (!receiverIdFinal) {
      throw new NotFoundError('Receiver');
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.userId,
        receiverId: receiverIdFinal,
        projectId: req.params.projectId,
        content,
        messageType: messageType || 'TEXT',
        mediaUrl,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
      },
    });

    // Emit via Socket.IO
    io.to(`project:${req.params.projectId}`).emit('message:new', message);
    io.to(`user:${receiverIdFinal}`).emit('message:new', message);

    // Create notification
    await prisma.notification.create({
      data: {
        userId: receiverIdFinal,
        type: 'NEW_MESSAGE',
        title: 'Neue Nachricht',
        body: content.substring(0, 100),
        data: { messageId: message.id, projectId: req.params.projectId },
      },
    });

    res.status(201).json({ data: message });
  } catch (error) {
    next(error);
  }
});

export { router as messageRouter };
