import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import { UPLOAD_DIR } from '../lib/upload';

const router = Router();

// Toutes les routes admin exigent une authentification ET le rôle ADMIN.
router.use(requireAuth, requireAdmin);

// GET /api/v1/admin/users — liste tous les utilisateurs
router.get('/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, username: true, email: true, role: true,
        level: true, lastWorkout: true, createdAt: true, totalXP: true,
      },
    });
    res.json({ users });
  } catch (e) {
    console.error('[admin/users GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/v1/admin/stats — métriques globales de l'instance
router.get('/stats', async (_req, res) => {
  try {
    const [userCount, workoutCount, programCount] = await Promise.all([
      prisma.user.count(),
      prisma.workoutLog.count(),
      prisma.program.count(),
    ]);
    res.json({
      userCount,
      workoutCount,
      programCount,
      version: process.env.APP_VERSION ?? 'dev',
    });
  } catch (e) {
    console.error('[admin/stats GET]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/v1/admin/users/:id — supprime un utilisateur
router.delete('/users/:id', async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    if (id === req.userId) {
      res.status(400).json({ error: 'Impossible de supprimer son propre compte' });
      return;
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
        return;
      }
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    console.error('[admin/users DELETE]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/v1/admin/users/:id/role — change le rôle d'un utilisateur
router.patch('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body as { role?: string };

  if (role !== 'USER' && role !== 'ADMIN') {
    res.status(400).json({ error: "role doit valoir 'USER' ou 'ADMIN'" });
    return;
  }

  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    // Refuser la rétrogradation du dernier ADMIN.
    if (target.role === 'ADMIN' && role === 'USER') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        res.status(400).json({ error: 'Impossible de rétrograder le dernier administrateur' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true, username: true, email: true, role: true,
        level: true, lastWorkout: true, createdAt: true, totalXP: true,
      },
    });
    res.json({ user });
  } catch (e) {
    console.error('[admin/users/:id/role PATCH]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/v1/admin/reset-data — efface les données de progression de TOUS les
// utilisateurs (logs, mesures, badges, photos + fichiers). Comptes et programmes intacts.
router.post('/reset-data', async (_req, res) => {
  try {
    // Récupérer les fichiers photos avant de supprimer les lignes.
    const photos = await prisma.bodyPhoto.findMany({ select: { filePath: true } });

    await prisma.$transaction([
      prisma.completedSet.deleteMany(),
      prisma.workoutLog.deleteMany(),
      prisma.bodyMetric.deleteMany(),
      prisma.userBadge.deleteMany(),
      prisma.bodyPhoto.deleteMany(),
    ]);

    // Supprimer les fichiers disque (best-effort, non bloquant).
    await Promise.all(
      photos.map((p) =>
        fs.unlink(path.resolve(UPLOAD_DIR, path.basename(p.filePath))).catch(() => {}),
      ),
    );

    res.json({ ok: true, photosDeleted: photos.length });
  } catch (e) {
    console.error('[admin/reset-data POST]', e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
