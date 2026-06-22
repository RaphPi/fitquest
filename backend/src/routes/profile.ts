// S14 — Export PDF "fiche de personnage" via Puppeteer (Chromium headless).
//
// POST (et non GET) : le front rend déjà l'avatar pixel art sur <canvas> ; il l'exporte
// en PNG (toDataURL) et l'envoie dans le body. On évite ainsi de dupliquer toute la
// logique de sprites côté serveur, pour un rendu 100 % fidèle au jeu.
import { Router } from 'express';
import puppeteer from 'puppeteer';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { xpRequiredForLevel } from '../lib/xp';
import { buildCharacterSheetHtml, type CharacterSheetData } from '../profile/characterSheet';

const router = Router();

// data:image/png en base64 uniquement (anti-injection : pas de SVG/data arbitraire).
const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

// POST /api/v1/profile/pdf — génère et renvoie la fiche de personnage en PDF.
router.post('/pdf', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  // Avatar PNG optionnel (fourni par le front). Validé strictement, sinon ignoré.
  const rawAvatar = (req.body as { avatarPng?: unknown })?.avatarPng;
  const avatarPng =
    typeof rawAvatar === 'string' && PNG_DATA_URL.test(rawAvatar) ? rawAvatar : null;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' });
      return;
    }

    const [totalWorkouts, programsCreated, lastLog, userBadges] = await Promise.all([
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
    ]);

    const data: CharacterSheetData = {
      username: user.username,
      themeId: user.themeId,
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
        iconType: ub.badge.iconType,
        unlockedAt: ub.unlockedAt,
      })),
      avatarPng,
    };

    const html = buildCharacterSheetHtml(data);

    // executablePath : Chromium système (cf. Dockerfile : apk add chromium).
    // En dev hors conteneur, PUPPETEER_EXECUTABLE_PATH peut être vide → puppeteer
    // tentera son propre Chromium (à fournir manuellement si besoin).
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
