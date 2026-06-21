import { Router } from 'express';
import path from 'path';
import { existsSync } from 'fs';
import archiver from 'archiver';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { UPLOAD_DIR } from '../lib/upload';

const router = Router();

/** Sérialise un objet en buffer JSON indenté (UTF-8) pour ajout à l'archive. */
function jsonBuffer(data: unknown): Buffer {
  return Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/v1/export/me — export RGPD : ZIP de toutes les données de l'user courant.
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  try {
    // ── Collecte des données (avant d'ouvrir le stream, pour pouvoir renvoyer une 404/500 JSON) ──
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    // profile.json — sans le hash de mot de passe
    const { passwordHash: _passwordHash, ...profile } = user;

    const [workouts, metrics, userBadges, programs, photos] = await Promise.all([
      prisma.workoutLog.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        include: { completedSets: true },
      }),
      prisma.bodyMetric.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        include: { badge: true },
      }),
      prisma.program.findMany({
        where: { createdBy: userId },
        include: { sessions: { include: { exercises: true } } },
      }),
      prisma.bodyPhoto.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
    ]);

    // ── Préparation du stream ZIP ──
    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `fitquest-${user.username}-${dateStr}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });

    // Erreur de stream : si les headers sont déjà partis, on ne peut que couper la connexion.
    archive.on('error', (err) => {
      console.error('Erreur archive export:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erreur lors de la génération de l’archive' });
      } else {
        res.destroy(err);
      }
    });

    archive.pipe(res);

    // ── Fichiers JSON ──
    archive.append(jsonBuffer(profile), { name: 'profile.json' });
    archive.append(jsonBuffer(workouts), { name: 'workouts.json' });
    archive.append(jsonBuffer(metrics), { name: 'metrics.json' });
    archive.append(jsonBuffer(userBadges), { name: 'badges.json' });
    archive.append(jsonBuffer(programs), { name: 'programs.json' });

    // photos.json — métadonnées uniquement (date, type, note, nom de fichier)
    const photosMeta = photos.map((p) => ({
      id: p.id,
      date: p.date.toISOString(),
      type: p.type,
      note: p.note,
      filename: path.basename(p.filePath),
    }));
    archive.append(jsonBuffer(photosMeta), { name: 'photos.json' });

    // ── Fichiers image (dossier photos/) — absence non bloquante ──
    for (const p of photos) {
      const safeName = path.basename(p.filePath); // anti-traversal
      const absPath = path.resolve(UPLOAD_DIR, safeName);
      if (existsSync(absPath)) {
        archive.file(absPath, { name: `photos/${safeName}` });
      }
    }

    await archive.finalize();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

export default router;
