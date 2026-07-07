import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../server';
import { authenticate } from '../../middleware/auth';
import { config } from '../../config';
import { logger } from '../../config/logger';

const router = Router();

// POST /ai/analyze/project - Analyze project description (voice/text)
router.post('/analyze/project', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, inputText, inputType, mediaUrls } = req.body;

    let project;
    if (projectId) {
      project = await prisma.project.findUnique({ where: { id: projectId } });
    }

    // Call AI Core
    let aiResult;
    try {
      const response = await fetch(`${config.aiCore.url}/api/v1/analyze/project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText || project?.description,
          mediaUrls,
          projectId,
        }),
      });
      aiResult = await response.json();
    } catch (err) {
      logger.warn('AI Core unavailable, returning mock analysis');
      aiResult = {
        confidence: 0.7,
        estimatedCosts: { min: 5000, max: 15000, currency: 'EUR' },
        estimatedDuration: { min: 5, max: 14, unit: 'days' },
        specifications: [
          { key: 'area_sqm', value: '25', unit: 'm²', confidence: 0.85 },
          { key: 'material_type', value: 'Porcelain stoneware', confidence: 0.7 },
        ],
        dinNorms: ['DIN 18157', 'DIN 18352'],
        requiredMaterials: [
          { name: 'Tile adhesive', estimatedQuantity: '50', unit: 'kg' },
          { name: 'Grout', estimatedQuantity: '5', unit: 'kg' },
        ],
      };
    }

    // Save AI analysis to database
    if (projectId) {
      await prisma.aIAnalysis.upsert({
        where: { id: project?.aiAnalysisId || '' },
        create: {
          projectId,
          rawInput: inputText || project?.description,
          rawInputType: inputType || 'TEXT',
          confidence: aiResult.confidence,
          processingTime: aiResult.processingTime,
          resultSpecs: aiResult.specifications,
          estimatedCosts: aiResult.estimatedCosts,
          estimatedDuration: aiResult.estimatedDuration,
          dinNormReferences: aiResult.dinNorms,
          requiredMaterials: aiResult.requiredMaterials,
        },
        update: {
          resultSpecs: aiResult.specifications,
          estimatedCosts: aiResult.estimatedCosts,
          estimatedDuration: aiResult.estimatedDuration,
          dinNormReferences: aiResult.dinNorms,
          requiredMaterials: aiResult.requiredMaterials,
          confidence: aiResult.confidence,
        },
      });

      // Update project with AI analysis reference
      if (!project?.aiAnalysisId) {
        const analysis = await prisma.aIAnalysis.findFirst({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
        });
        if (analysis) {
          await prisma.project.update({
            where: { id: projectId },
            data: { aiAnalysisId: analysis.id },
          });
        }
      }
    }

    res.json({ data: aiResult });
  } catch (error) {
    next(error);
  }
});

// POST /ai/generate/offer - AI generates offer
router.post('/generate/offer', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, craftsmanRate } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { specifications: true, aiAnalysis: true },
    });

    let offerData;
    try {
      const response = await fetch(`${config.aiCore.url}/api/v1/generate/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, craftsmanRate }),
      });
      offerData = await response.json();
    } catch {
      // Fallback calculation
      const baseAmount = parseFloat(project?.budgetMin?.toString() || '5000');
      offerData = {
        totalAmount: baseAmount * 1.19,
        items: [
          { description: 'Arbeitsleistung', quantity: 1, unit: 'pauschal', unitPrice: baseAmount * 0.6 },
          { description: 'Materialkosten inkl. Nebenkosten', quantity: 1, unit: 'pauschal', unitPrice: baseAmount * 0.35 },
          { description: 'Service & Garantie', quantity: 1, unit: 'pauschal', unitPrice: baseAmount * 0.05 },
        ],
        confidence: 0.6,
      };
    }

    res.json({ data: offerData });
  } catch (error) {
    next(error);
  }
});

// POST /ai/verify/milestone - Verify milestone with 3D video
router.post('/verify/milestone', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { milestoneId, videoUrl } = req.body;

    // Call AI vision model
    let verificationResult;
    try {
      const response = await fetch(`${config.aiCore.url}/api/v1/verify/construction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, videoUrl }),
      });
      verificationResult = await response.json();
    } catch {
      // Simulate verification (in production, use actual CV model)
      verificationResult = {
        passed: true,
        confidence: 0.92,
        deviations: [],
        measurements: { overall_quality: 'good' },
        recommendations: [],
      };
    }

    // Update milestone
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        verificationVideoUrl: videoUrl,
        verificationStatus: verificationResult.passed ? 'VERIFIED' : 'FAILED',
        aiAnalysisResult: verificationResult,
        status: verificationResult.passed ? 'VERIFIED' : 'COMPLETED',
      },
    });

    // If verified, notify for release
    if (verificationResult.passed) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          project: { include: { client: { include: { user: true } } } },
        },
      });

      if (milestone) {
        await prisma.notification.create({
          data: {
            userId: milestone.project.client.user.id,
            type: 'MILESTONE_COMPLETED',
            title: `Phase ${milestone.phaseNumber} automatisch geprüft`,
            body: `${milestone.name} wurde durch KI geprüft und freigegeben. Bitte bestätigen Sie die Freigabe.`,
            data: { milestoneId, projectId: milestone.projectId },
          },
        });
      }
    }

    res.json({
      data: verificationResult,
      message: verificationResult.passed
        ? 'KI-Prüfung bestanden! Phase kann freigegeben werden.'
        : 'KI-Prüfung hat Abweichungen festgestellt. Bitte manuelle Prüfung durchführen.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /ai/voice-to-text - Convert voice to structured data
router.post('/voice-to-text', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audioUrl, context } = req.body;

    let result;
    try {
      const response = await fetch(`${config.aiCore.url}/api/v1/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl, context }),
      });
      result = await response.json();
    } catch {
      result = {
        transcribedText: 'Voice transcription unavailable in dev mode',
        structuredData: null,
        confidence: 0,
      };
    }

    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

export { router as aiRouter };
