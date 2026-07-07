import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../server';
import { authenticate } from '../../middleware/auth';
import { NotFoundError } from '../../middleware/errorHandler';

const router = Router();

// GET /materials/suppliers - List material suppliers
router.get('/suppliers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const suppliers = await prisma.materialSupplier.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
    });

    res.json({ data: suppliers });
  } catch (error) {
    next(error);
  }
});

// GET /materials/products - List products with optional filter
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: any = { isActive: true };

    if (req.query.supplierId) where.supplierId = req.query.supplierId;
    if (req.query.category) where.category = req.query.category;
    if (req.query.search) where.name = { contains: req.query.search as string, mode: 'insensitive' };

    const products = await prisma.materialProduct.findMany({
      where,
      include: { supplier: { select: { name: true, logoUrl: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({ data: products });
  } catch (error) {
    next(error);
  }
});

// POST /materials/order - Place a material order
router.post('/order', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, supplierId, items, deliveryDate, deliveryAddress, notes } = req.body;

    const count = await prisma.materialOrder.count();
    const orderNumber = `BST-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const commissionRate = 0.05;
    const platformFee = totalAmount * commissionRate;

    const order = await prisma.materialOrder.create({
      data: {
        projectId,
        supplierId,
        orderNumber,
        totalAmount,
        platformFee,
        status: 'PENDING',
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryAddress,
        notes,
        items: {
          create: items.map((item: any, index: number) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            category: item.category,
            createdAt: new Date(),
          })),
        },
      },
      include: { items: true, supplier: { select: { name: true } } },
    });

    res.status(201).json({
      data: order,
      message: `Bestellung ${orderNumber} aufgegeben. Provision: €${platformFee.toFixed(2)} (${(commissionRate * 100)}%)`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /materials/orders - List my orders
router.get('/orders', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.materialOrder.findMany({
      include: {
        supplier: { select: { name: true, logoUrl: true } },
        items: true,
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ data: orders });
  } catch (error) {
    next(error);
  }
});

export { router as materialRouter };
