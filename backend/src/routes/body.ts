import { Router, type Request, type Response, type NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { detectBadges } from '../lib/badges';
import { upload, UPLOAD_DIR } from '../lib/upload';

const router = Router();

/** Construit l'URL publique d'une photo à partir du nom de fichier stocké. */
function photoToUrl(filePath: string): string {
  return `/api/v1/body/photos/file/${path.basename(filePath)}`;
}

/**
 * Wrapper multer avec gestion d'erreur inline.
 * Express ne transmet pas les erreurs multer au handler async sans ça.
 */
function multerSingle(field: string): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    upload.single(field)(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        res.status(400).json({ error: `Erreur fichier : ${err.message}` });
      } else if (err instanceof Error) {
        res.status(400).json({ error: err.message });
      } else {
        next();
      }
    });
  };
}

const MAX_CUSTOM_METRICS = 10;

interface CustomMetricInput {
  name: string;
  value: number;
  unit: string;
}

interface MetricBody {
  weightKg?: number | null;
  bodyFatPct?: number | null;
  waistCm?: number | null;
  chestCm?: number | null;
  bicepCm?: number | null;
  thighCm?: number | null;
  customMetrics?: CustomMetricInput[];
}

function hasAnyMeasurement(body: MetricBody): boolean {
  const { weightKg, bodyFatPct, waistCm, chestCm, bicepCm, thighCm, customMetrics } = body;
  return [weightKg, bodyFatPct, waistCm, chestCm, bicepCm, thighCm].some((v) => v != null)
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
        bodyFatPct: body.bodyFatPct ?? null,
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
        ...('bodyFatPct' in body ? { bodyFatPct: body.bodyFatPct } : {}),
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

// ─── Photos de progression ───────────────────────────────────────────────────

// GET /api/v1/body/photos/file/:filename — sert le fichier (ownership check anti-traversal)
router.get('/photos/file/:filename', requireAuth, async (req: AuthRequest, res) => {
  const filename = path.basename(req.params.filename);
  try {
    const photo = await prisma.bodyPhoto.findFirst({
      where: { userId: req.userId!, filePath: filename },
    });
    if (!photo) {
      res.status(404).json({ error: 'Photo introuvable.' });
      return;
    }
    const absPath = path.resolve(UPLOAD_DIR, filename);
    res.sendFile(absPath);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/v1/body/photos — liste triée date desc
router.get('/photos', requireAuth, async (req: AuthRequest, res) => {
  try {
    const photos = await prisma.bodyPhoto.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });
    res.json({
      photos: photos.map((p) => ({
        id: p.id,
        userId: p.userId,
        date: p.date.toISOString(),
        type: p.type,
        note: p.note,
        url: photoToUrl(p.filePath),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/v1/body/photos — upload + crée BodyPhoto + badge Photographe
router.post('/photos', requireAuth, multerSingle('photo'), async (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Aucun fichier image fourni (champ "photo").' });
    return;
  }
  const { note, type } = req.body as { note?: string; type?: string };

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { level: true, streak: true },
    });
    if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }

    const photo = await prisma.bodyPhoto.create({
      data: {
        userId: req.userId!,
        filePath: req.file.filename,
        type: type ?? 'other',
        note: note ?? null,
      },
    });

    const newBadges = await detectBadges(req.userId!, user.level, user.streak);
    res.status(201).json({
      photo: {
        id: photo.id,
        userId: photo.userId,
        date: photo.date.toISOString(),
        type: photo.type,
        note: photo.note,
        url: photoToUrl(photo.filePath),
      },
      newBadges,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/v1/body/photos/:id — supprime la ligne ET le fichier disque
router.delete('/photos/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const photo = await prisma.bodyPhoto.findUnique({ where: { id } });
    if (!photo || photo.userId !== req.userId!) {
      res.status(404).json({ error: 'Photo introuvable.' });
      return;
    }
    await prisma.bodyPhoto.delete({ where: { id } });
    try {
      await fs.unlink(path.resolve(UPLOAD_DIR, path.basename(photo.filePath)));
    } catch {
      // Fichier déjà absent — pas bloquant
    }
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
