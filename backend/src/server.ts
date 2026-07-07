import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './api/routes/auth';
import { projectRouter } from './api/routes/projects';
import { craftsmanRouter } from './api/routes/craftsmen';
import { offerRouter } from './api/routes/offers';
import { escrowRouter } from './api/routes/escrow';
import { invoiceRouter } from './api/routes/invoices';
import { subscriptionRouter } from './api/routes/subscriptions';
import { reviewRouter } from './api/routes/reviews';
import { messageRouter } from './api/routes/messages';
import { aiRouter } from './api/routes/ai';
import { materialRouter } from './api/routes/materials';
import { adminRouter } from './api/routes/admin';
import { webhookRouter } from './api/routes/webhooks';
import { logger } from './config/logger';

const app = express();
const httpServer = createServer(app);

// Initialize Prisma
export const prisma = new PrismaClient();

// Socket.IO for real-time messaging & notifications
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(morgan('combined', { stream: { write: (msg: string) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
    uptime: process.uptime(),
  });
});

// API Routes
const apiPrefix = `/api/${config.apiVersion}`;
app.use(`${apiPrefix}/auth`, authRouter);
app.use(`${apiPrefix}/projects`, projectRouter);
app.use(`${apiPrefix}/craftsmen`, craftsmanRouter);
app.use(`${apiPrefix}/offers`, offerRouter);
app.use(`${apiPrefix}/escrow`, escrowRouter);
app.use(`${apiPrefix}/invoices`, invoiceRouter);
app.use(`${apiPrefix}/subscriptions`, subscriptionRouter);
app.use(`${apiPrefix}/reviews`, reviewRouter);
app.use(`${apiPrefix}/messages`, messageRouter);
app.use(`${apiPrefix}/ai`, aiRouter);
app.use(`${apiPrefix}/materials`, materialRouter);
app.use(`${apiPrefix}/admin`, adminRouter);
app.use(`${apiPrefix}/webhooks`, webhookRouter);

// Error Handler
app.use(errorHandler);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join:project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    logger.debug(`Socket ${socket.id} joined project ${projectId}`);
  });

  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.debug(`Socket ${socket.id} joined user ${userId}`);
  });

  socket.on('leave:project', (projectId: string) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = config.port;

httpServer.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════╗
║        BAUIMPERIUM - API SERVER               ║
║━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━║
║  Environment: ${config.nodeEnv.padEnd(28)}║
║  Port:        ${String(PORT).padEnd(28)}║
║  Version:     ${config.apiVersion.padEnd(28)}║
║  Database:    Connected                       ║
╚═══════════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
