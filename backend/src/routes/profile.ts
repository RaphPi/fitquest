// S14 — Export PDF "fiche de personnage" via Puppeteer (Chromium headless).
//
// POST (et non GET) : le front rend déjà l'avatar ET les icônes de trophées en pixel art
// sur <canvas> ; il les exporte en PNG (toDataURL) et les envoie dans le body. On évite
// ainsi de dupliquer la logique de sprites côté serveur, pour un rendu fidèle au jeu.
// Le themeId actif vient aussi du front (le thème vit dans le store, pas en BDD).
import { Router } from 'express';
import puppeteer from 'puppeteer';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { xpRequiredForLevel } from '../lib/xp';
import {
  buildCharacterSheetHtml,
  type CharacterSheetData,
  type SeriesPoint,
  type MeasurementStat,
} from '../profile/characterSheet';

const router = Router();

// data:image/png en base64 uniquement (anti-injection : pas de SVG/data arbitraire).
const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
const VALID_THEMES = ['void_rpg', 'forest_warrior', 'solar_blaze'];

/** Valide un PNG data URL (taille bornée pour éviter les abus). */
function validPng(v: unknown): v is string {
  return typeof v === 'string' && v.length < 2_000_000 && PNG_DATA_URL.test(v);
}

/** Construit une stat de mensuration : dernière valeur + variation depuis la 1re mesure. */
function buildMeasurement(
  label: string,
  unit: string,
  values: (number | null)[],
): MeasurementStat | null {
  const known = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (known.length === 0) return null;
  const latest = known[known.length - 1];
  const delta = known.length > 1 ? Math.round((latest - known[0]) * 10) / 10 : null;
  return { label, latest, delta, unit };
}

// POST /api/v1/profile/pdf — génère et renvoie la fiche de personnage en PDF.
router.post('/pdf', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const body = (req.body ?? {}) as {
    avatarPng?: unknown;
    themeId?: unknown;
    iconMap?: unknown;
  };

  const avatarPng = validPng(body.avatarPng) ? body.avatarPng : null;
  const themeId =
    typeof body.themeId === 'string' && VALID_THEMES.includes(body.themeId) ? body.themeId : 'void_rpg';

  // iconMap : { "iconType__rarity": pngDataUrl } fourni par le front.
  const iconMap: Record<string, string> = {};
  if (body.iconMap && typeof body.iconMap === 'object') {
    for (const [k, v] of Object.entries(body.iconMap as Record<string, unknown>)) {
      if (validPng(v)) iconMap[k] = v;
    }
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    const [totalWorkouts, programsCreated, lastLog, userBadges, metrics] = await Promise.all([
      prisma.workoutLog.count({ where: { userId } }),
      prisma.program.count({ where: { createdBy: userId } }),
      prisma.workoutLog.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
        select: { sessionName: true, date: true },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        include: { badge: true },
      }),
      prisma.bodyMetric.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        select: { date: true, weightKg: true, waistCm: true, chestCm: true, bicepCm: true, thighCm: true },
      }),
    ]);

    const weightSeries: SeriesPoint[] = metrics
      .filter((m) => m.weightKg !== null && Number.isFinite(m.weightKg))
      .map((m) => ({ date: m.date, value: m.weightKg as number }));

    const measurements = [
      buildMeasurement('Poids', 'kg', metrics.map((m) => m.weightKg)),
      buildMeasurement('Tour de taille', 'cm', metrics.map((m) => m.waistCm)),
      buildMeasurement('Poitrine', 'cm', metrics.map((m) => m.chestCm)),
      buildMeasurement('Biceps', 'cm', metrics.map((m) => m.bicepCm)),
      buildMeasurement('Cuisse', 'cm', metrics.map((m) => m.thighCm)),
    ].filter((m): m is MeasurementStat => m !== null);

    const data: CharacterSheetData = {
      username: user.username,
      themeId,
      avatarStage: user.avatarStage,
      level: user.level,
      totalXP: user.totalXP,
      currentXP: user.currentXP,
      xpRequired: xpRequiredForLevel(user.level),
      streak: user.streak,
      createdAt: user.createdAt,
      totalWorkouts,
      programsCreated,
      lastWorkout: lastLog ? { sessionName: lastLog.sessionName, date: lastLog.date } : null,
      badges: userBadges.map((ub) => ({
        nameFr: ub.badge.nameFr,
        rarity: ub.badge.rarity,
        iconPng: iconMap[`${ub.badge.iconType}__${ub.badge.rarity}`] ?? null,
        unlockedAt: ub.unlockedAt,
      })),
      avatarPng,
      weightSeries,
      measurements,
    };

    const html = buildCharacterSheetHtml(data);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `fitquest-fiche-${user.username}-${dateStr}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(pdf));
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error('[profile/pdf]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
    }
  }
});

export default router;
