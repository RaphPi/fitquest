// S14 — Export PDF "fiche de personnage" via Puppeteer (Chromium headless).
//
// POST (et non GET) : le front rend l'avatar ET les icônes de trophées en pixel art
// (PNG dans le body), envoie le themeId actif (le thème vit dans le store, pas en BDD)
// et les options d'inclusion (évolution / photos / trophées).
import { Router } from 'express';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import puppeteer from 'puppeteer';
import { prisma } from '../lib/prisma';
import { requireAuth, type AuthRequest } from '../middleware/requireAuth';
import { UPLOAD_DIR } from '../lib/upload';
import { xpRequiredForLevel } from '../lib/xp';
import {
  buildCharacterSheetHtml,
  SERIES_PALETTE,
  type CharacterSheetData,
  type MetricGroup,
  type MetricSeries,
  type SeriesPoint,
  type ProgressPhoto,
} from '../profile/characterSheet';

const router = Router();

const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
const VALID_THEMES = ['void_rpg', 'forest_warrior', 'solar_blaze'];

function validPng(v: unknown): v is string {
  return typeof v === 'string' && v.length < 2_000_000 && PNG_DATA_URL.test(v);
}

/** Construit une MetricSeries depuis des relevés datés (latest + delta 1er→dernier). */
function toSeries(name: string, color: string, points: SeriesPoint[]): MetricSeries | null {
  if (points.length === 0) return null;
  const sorted = points.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
  const latest = sorted[sorted.length - 1].value;
  const delta = sorted.length > 1 ? Math.round((latest - sorted[0].value) * 10) / 10 : null;
  return { name, color, points: sorted, latest, delta };
}

interface CustomMetricRow { name?: unknown; value?: unknown; unit?: unknown; }

/** Lit une photo du disque et la renvoie en data URL base64 (null si absente). */
function photoDataUrl(filePath: string): string | null {
  const safe = path.basename(filePath); // anti-traversal
  const abs = path.resolve(UPLOAD_DIR, safe);
  if (!existsSync(abs)) return null;
  const ext = path.extname(safe).slice(1).toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${readFileSync(abs).toString('base64')}`;
}

// POST /api/v1/profile/pdf — génère et renvoie la fiche de personnage en PDF.
router.post('/pdf', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const body = (req.body ?? {}) as Record<string, unknown>;

  const avatarPng = validPng(body.avatarPng) ? (body.avatarPng as string) : null;
  const themeId =
    typeof body.themeId === 'string' && VALID_THEMES.includes(body.themeId) ? body.themeId : 'void_rpg';

  // Options d'inclusion (défaut : évolution + trophées ON, photos OFF).
  const includeEvolution = body.includeEvolution !== false;
  const includePhotos = body.includePhotos === true;
  const includeBadges = body.includeBadges !== false;

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

    const [totalWorkouts, programsCreated, lastLog, userBadges, metrics, photoRows] = await Promise.all([
      prisma.workoutLog.count({ where: { userId } }),
      prisma.program.count({ where: { createdBy: userId } }),
      prisma.workoutLog.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
        select: { sessionName: true, date: true },
      }),
      includeBadges
        ? prisma.userBadge.findMany({ where: { userId }, orderBy: { unlockedAt: 'desc' }, include: { badge: true } })
        : Promise.resolve([]),
      includeEvolution
        ? prisma.bodyMetric.findMany({
            where: { userId },
            orderBy: { date: 'asc' },
            select: {
              date: true, weightKg: true, waistCm: true, chestCm: true, bicepCm: true, thighCm: true,
              customMetrics: true,
            },
          })
        : Promise.resolve([]),
      includePhotos
        ? prisma.bodyPhoto.findMany({ where: { userId }, orderBy: { date: 'asc' }, select: { date: true, filePath: true } })
        : Promise.resolve([]),
    ]);

    // ── Construction des groupes de métriques par unité ──
    const seriesList: MetricSeries[] = [];
    const push = (name: string, unit: string, getter: (m: (typeof metrics)[number]) => number | null) => {
      const points: SeriesPoint[] = metrics
        .map((m) => ({ date: m.date, v: getter(m) }))
        .filter((p): p is { date: Date; v: number } => p.v !== null && Number.isFinite(p.v))
        .map((p) => ({ date: p.date, value: p.v }));
      const s = toSeries(name, '', points);
      if (s) { (s as MetricSeries & { unit: string }).unit = unit; seriesList.push(s); }
    };

    // Standards
    push('Poids', 'kg', (m) => m.weightKg);
    push('Tour de taille', 'cm', (m) => m.waistCm);
    push('Poitrine', 'cm', (m) => m.chestCm);
    push('Biceps', 'cm', (m) => m.bicepCm);
    push('Cuisse', 'cm', (m) => m.thighCm);

    // Customs : regroupés par (nom + unité)
    const customMap = new Map<string, { name: string; unit: string; points: SeriesPoint[] }>();
    for (const m of metrics) {
      const arr = Array.isArray(m.customMetrics) ? (m.customMetrics as CustomMetricRow[]) : [];
      for (const c of arr) {
        if (typeof c?.name !== 'string' || typeof c?.value !== 'number' || !Number.isFinite(c.value)) continue;
        const unit = typeof c.unit === 'string' ? c.unit : '';
        const key = `${c.name}__${unit}`;
        if (!customMap.has(key)) customMap.set(key, { name: c.name, unit, points: [] });
        customMap.get(key)!.points.push({ date: m.date, value: c.value });
      }
    }
    for (const { name, unit, points } of customMap.values()) {
      const s = toSeries(name, '', points);
      if (s) { (s as MetricSeries & { unit: string }).unit = unit; seriesList.push(s); }
    }

    // Regroupement par unité (ordre : kg, cm, puis autres) + attribution des couleurs.
    const byUnit = new Map<string, MetricSeries[]>();
    for (const s of seriesList) {
      const unit = (s as MetricSeries & { unit: string }).unit || '—';
      if (!byUnit.has(unit)) byUnit.set(unit, []);
      byUnit.get(unit)!.push(s);
    }
    const unitOrder = (u: string) => (u === 'kg' ? 0 : u === 'cm' ? 1 : 2);
    const metricGroups: MetricGroup[] = [...byUnit.entries()]
      .sort((a, b) => unitOrder(a[0]) - unitOrder(b[0]) || a[0].localeCompare(b[0]))
      .map(([unit, series]) => ({
        unit,
        series: series.map((s, i) => ({ ...s, color: SERIES_PALETTE[i % SERIES_PALETTE.length] })),
      }));

    // ── Photos avant / après (1re + dernière par date) ──
    const photos: ProgressPhoto[] = [];
    if (photoRows.length > 0) {
      const picks = photoRows.length === 1 ? [photoRows[0]] : [photoRows[0], photoRows[photoRows.length - 1]];
      for (const p of picks) {
        const dataUrl = photoDataUrl(p.filePath);
        if (dataUrl) photos.push({ dataUrl, date: p.date });
      }
    }

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
      avatarPng,
      metricGroups,
      photos,
      badges: userBadges.map((ub) => ({
        nameFr: ub.badge.nameFr,
        rarity: ub.badge.rarity,
        iconPng: iconMap[`${ub.badge.iconType}__${ub.badge.rarity}`] ?? null,
        unlockedAt: ub.unlockedAt,
      })),
      showBadges: includeBadges,
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
