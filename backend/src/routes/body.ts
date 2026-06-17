import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { detectBadges } from '../lib/badges';

const router = Router();

const MAX_CUSTOM_METRICS = 10;

interface CustomMetricInput {
  name: string;
  value: number;
  unit: string;
}

interface MetricBody {
  weightKg?: number | null;
  waistCm?: number | null;
  chestCm?: number | null;
  bicepCm?: number | null;
  thighCm?: number | null;
  customMetrics?: CustomMetricInput[];
}

function hasAnyMeasurement(body: MetricBody): boolean {
  const { weightKg, waistCm, chestCm, bicepCm, thighCm, customMetrics } = body;
  return [weightKg, waistCm, chestCm, bicepCm, thighCm].some((v) => v != null)
    || (Array.isArray(customMetrics) && customMetrics.length > 0);
}

// GET /api/v1/body/metrics — liste triée par date desc
router.get('/metrics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const metrics = await prisma.bodyMetric.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });
    res.json({ metrics });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/v1/body/metrics — crée un relevé + déclenche badge Sculpteur
router.post('/metrics', requireAuth, async (req: AuthRequest, res) => {
  const body = req.body as MetricBody;

  if (!hasAnyMeasurement(body)) {
    res.status(400).json({ error: 'Au moins un champ de mesure est requis.' });
    return;
  }
  if (body.customMetrics && body.customMetrics.length > MAX_CUSTOM_METRICS) {
    res.status(400).json({ error: `Maximum ${MAX_CUSTOM_METRICS} métriques custom par relevé.` });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { level: true, streak: true },
    });
    if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }

    const metric = await prisma.bodyMetric.create({
      data: {
        userId: req.userId!,
        weightKg: body.weightKg ?? null,
        waistCm: body.waistCm ?? null,
        chestCm: body.chestCm ?? null,
        bicepCm: body.bicepCm ?? null,
        thighCm: body.thighCm ?? null,
        customMetrics: body.customMetrics != null
          ? (body.customMetrics as unknown as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });

    const newBadges = await detectBadges(req.userId!, user.level, user.streak);
    res.status(201).json({ metric, newBadges });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/v1/body/metrics/:id — mise à jour partielle (vérif appartenance)
router.patch('/metrics/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const body = req.body as MetricBody;

  if (body.customMetrics && body.customMetrics.length > MAX_CUSTOM_METRICS) {
    res.status(400).json({ error: `Maximum ${MAX_CUSTOM_METRICS} métriques custom par relevé.` });
    return;
  }

  try {
    const existing = await prisma.bodyMetric.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId!) {
      res.status(404).json({ error: 'Relevé introuvable.' });
      return;
    }

    const metric = await prisma.bodyMetric.update({
      where: { id },
      data: {
        ...('weightKg' in body ? { weightKg: body.weightKg } : {}),
        ...('waistCm' in body ? { waistCm: body.waistCm } : {}),
        ...('chestCm' in body ? { chestCm: body.chestCm } : {}),
        ...('bicepCm' in body ? { bicepCm: body.bicepCm } : {}),
        ...('thighCm' in body ? { thighCm: body.thighCm } : {}),
        ...('customMetrics' in body
          ? { customMetrics: (body.customMetrics as unknown as Prisma.InputJsonValue) }
          : {}),
      },
    });
    res.json({ metric });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/v1/body/metrics/:id — supprime un relevé (vérif appartenance)
router.delete('/metrics/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.bodyMetric.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId!) {
      res.status(404).json({ error: 'Relevé introuvable.' });
      return;
    }
    await prisma.bodyMetric.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
