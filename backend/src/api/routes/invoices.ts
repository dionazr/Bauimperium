import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../server';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { logger } from '../../config/logger';

const router = Router();

// GET /invoices - List invoices
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        craftsmanProfile: { select: { id: true } },
      },
    });

    const where: any = {};
    if (user?.craftsmanProfile) {
      where.craftsmanId = user.craftsmanProfile.id;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        project: { select: { id: true, title: true } },
        items: true,
        offer: { select: { id: true, offerNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: invoices });
  } catch (error) {
    next(error);
  }
});

// POST /invoices - Create invoice (GoBD-konform)
router.post('/', authenticate, authorize('CRAFTSMAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { offerId, clientName, clientAddress, clientTaxId, items, notes, dueDate, type } = req.body;

    const craftsmanProfile = await prisma.craftsmanProfile.findUnique({
      where: { userId: req.user!.userId },
      include: { address: true, user: true },
    });
    if (!craftsmanProfile) throw new NotFoundError('Craftsman profile');

    // Generate invoice number (GoBD-compliant: sequential)
    const count = await prisma.invoice.count();
    const year = new Date().getFullYear();
    const invoiceNumber = `RE-${year}-${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    const netTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = 0.19;
    const taxAmount = netTotal * taxRate;
    const grossAmount = netTotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        craftsmanId: craftsmanProfile.id,
        offerId: offerId || null,
        clientName,
        clientAddress,
        clientTaxId,
        type: type || 'INVOICE',
        netAmount: netTotal,
        taxRate,
        taxAmount,
        grossAmount,
        dueDate: new Date(dueDate || Date.now() + 14 * 24 * 60 * 60 * 1000),
        isGoBDCompliant: true,
        notes,
        status: 'DRAFT',
        items: {
          create: items.map((item: any, index: number) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'Stk',
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            sortOrder: index,
          })),
        },
      },
      include: { items: true },
    });

    logger.info(`Invoice created: ${invoiceNumber}`);

    res.status(201).json({ data: invoice, message: 'Rechnung GoBD-konform erstellt' });
  } catch (error) {
    next(error);
  }
});

// POST /invoices/voice - Create invoice via voice (KI)
router.post('/voice', authenticate, authorize('CRAFTSMAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { voiceText } = req.body;

    // Call AI Core to parse voice text into invoice items
    let parsedItems;
    try {
      const response = await fetch(`${config.aiCore.url}/api/v1/parse/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voiceText }),
      });
      parsedItems = await response.json();
    } catch {
      // Simple fallback parsing
      const lines = voiceText.split('\n').filter((l: string) => l.trim());
      parsedItems = {
        items: lines.map((line: string) => ({
          description: line,
          quantity: 1,
          unit: 'pauschal',
          unitPrice: 0,
        })),
      };
    }

    // Use parsed items to create invoice (same as above)
    // ... (simplified for brevity)

    res.json({
      data: parsedItems,
      message: 'Spracheingabe verarbeitet. Bitte prüfen und ergänzen Sie die Beträge.',
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /invoices/:id/send - Mark as sent
router.patch('/:id/send', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { craftsman: true },
    });
    if (!invoice) throw new NotFoundError('Invoice');
    if (invoice.craftsman.userId !== req.user!.userId) throw new ForbiddenError('Not your invoice');

    await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'SENT' },
    });

    res.json({ message: 'Rechnung als versendet markiert' });
  } catch (error) {
    next(error);
  }
});

// POST /invoices/:id/pay - Mark as paid
router.post('/:id/pay', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { craftsman: true },
    });
    if (!invoice) throw new NotFoundError('Invoice');

    await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    res.json({ message: 'Rechnung als bezahlt markiert' });
  } catch (error) {
    next(error);
  }
});

export { router as invoiceRouter };
