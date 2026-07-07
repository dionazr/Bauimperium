import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { logger } from '../../config/logger';

const router = Router();

// POST /webhooks/stripe - Stripe webhook handler
router.post('/stripe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;

    // In production: verify webhook signature
    // const event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);

    const event = req.body;
    logger.info(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        logger.info(`Payment succeeded: ${event.data.object.id}`);
        break;

      case 'payment_intent.payment_failed':
        // Handle failed payment
        logger.warn(`Payment failed: ${event.data.object.id}`);
        break;

      case 'account.updated':
        // Handle Stripe Connect account updates
        break;

      default:
        logger.debug(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error({ err: error }, 'Stripe webhook error');
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

// POST /webhooks/ai-core - AI Core completion webhook
router.post('/ai-core', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, status, result } = req.body;

    logger.info(`AI Core task ${taskId} completed with status ${status}`);

    // Handle different AI task completions
    if (status === 'completed') {
      // Process AI results...
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export { router as webhookRouter };
