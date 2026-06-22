// S14 — Génération du HTML "fiche de personnage RPG" pour l'export PDF (Puppeteer).
// Le HTML est autonome (CSS inline) : il est chargé tel quel par Chromium headless.
// Police arcade VT323 chargée via Google Fonts (comme l'app) — le conteneur a Internet ;
// fallback gracieux sinon. Icônes (avatar + badges) fournies en PNG par le front
// (rendu pixel art fidèle) ; le logo est un SVG inline.
// Palettes de thème/paliers dupliquées volontairement depuis le front (3 constantes).

export type ThemeId = 'void_rpg' | 'forest_warrior' | 'solar_blaze';

interface ThemeTokens {
  bgMain: string;
  bgCard: string;
  bgShield: string;
  border: string;
  accent: string;
  accentSoft: string;
  textPrimary: string;
  textSecondary: string;
}

const THEMES: Record<ThemeId, ThemeTokens> = {
  void_rpg: {
    bgMain: '#0a0a0f', bgCard: '#0f1117', bgShield: '#0d0b1e', border: '#1e2030',
    accent: '#6366f1', accentSoft: '#a78bfa',
    textPrimary: '#f1f5f9', textSecondary: '#94a3b8',
  },
  forest_warrior: {
    bgMain: '#0d1f0f', bgCard: '#10260f', bgShield: '#0a1a0a', border: '#1a3020',
    accent: '#22c55e', accentSoft: '#4ade80',
    textPrimary: '#f1f5f9', textSecondary: '#94a3b8',
  },
  solar_blaze: {
    bgMain: '#1a0f00', bgCard: '#241608', bgShield: '#140b00', border: '#2e1f00',
    accent: '#f59e0b', accentSoft: '#fbbf24',
    textPrimary: '#f1f5f9', textSecondary: '#94a3b8',
  },
};

// Paliers (couleurs) alignés sur frontend/src/lib/levelTier.ts.
const TIERS = [
  { name: 'Bronze', color: 'rgb(168,120,80)', light: 'rgb(205,155,115)' },
  { name: 'Argent', color: 'rgb(192,204,218)', light: 'rgb(221,229,240)' },
  { name: 'Or', color: 'rgb(234,179,8)', light: 'rgb(253,224,71)' },
  { name: 'Émeraude', color: 'rgb(16,185,129)', light: 'rgb(110,227,160)' },
  { name: 'Diamant', color: 'rgb(34,211,238)', light: 'rgb(165,243,252)' },
];
const STAGE_NAMES = ['Apprenti', 'Aguerri', 'Vétéran', 'Champion', 'Légende'];

function tierIndex(level: number): number {
  if (level < 10) return 0;
  if (level < 20) return 1;
  if (level < 35) return 2;
  if (level < 50) return 3;
  return 4;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  rare: '#38bdf8',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const CLASS_LABELS = ['Guerrier', 'Archer', 'Mage', 'Chevalier'];

// Logo FitQuest (bouclier + épée), repris de frontend/src/assets/logo/fitquest-icon.svg.
const LOGO_SVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset="0.5" stop-color="#a78bfa"/><stop offset="1" stop-color="#6366f1"/></linearGradient>
  </defs>
  <path d="M32 4 L56 13 L56 31 C56 47 43 55 32 60 C21 55 8 47 8 31 L8 13 Z" fill="#0d0b1e" stroke="url(#sg)" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M32 13 L35.5 38 L32 42 L28.5 38 Z" fill="url(#bg)"/>
  <path d="M32 13 L28.5 38 L32 36 Z" fill="#f1f5f9" opacity="0.6"/>
  <rect x="25" y="37" width="14" height="3.5" rx="1.75" fill="#f59e0b"/>
  <rect x="23.5" y="36.5" width="2" height="4.5" rx="1" fill="#d97706"/>
  <rect x="38.5" y="36.5" width="2" height="4.5" rx="1" fill="#d97706"/>
  <rect x="30" y="40" width="4" height="9" rx="1.5" fill="#92400e"/>
  <ellipse cx="32" cy="50.5" rx="3.5" ry="2" fill="#f59e0b"/>
</svg>`;

export interface SeriesPoint { date: Date; value: number; }

export interface MeasurementStat {
  label: string;
  latest: number;
  delta: number | null; // variation depuis la 1re mesure (null si une seule)
  unit: string;
}

export interface CharacterSheetData {
  username: string;
  themeId: string;
  avatarStage: number;
  level: number;
  totalXP: number;
  currentXP: number;
  xpRequired: number;
  streak: number;
  createdAt: Date;
  totalWorkouts: number;
  programsCreated: number;
  lastWorkout: { sessionName: string; date: Date } | null;
  badges: { nameFr: string; rarity: string; iconPng: string | null; unlockedAt: Date }[];
  avatarPng: string | null;
  weightSeries: SeriesPoint[];
  measurements: MeasurementStat[];
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Mini line chart SVG (poids). Renvoie '' si moins de 2 points. */
function buildWeightChartSvg(series: SeriesPoint[], color: string, grid: string): string {
  if (series.length < 2) return '';
  const W = 360, H = 120, padL = 6, padR = 6, padT = 14, padB = 14;
  const values = series.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i: number) => padL + (innerW * i) / (series.length - 1);
  const y = (v: number) => padT + innerH * (1 - (v - min) / (max - min));

  const pts = series.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${padL},${(padT + innerH).toFixed(1)} ${pts} ${(padL + innerW).toFixed(1)},${(padT + innerH).toFixed(1)}`;
  const dots = series
    .map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="2.5" fill="${color}"/>`)
    .join('');

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="none" style="display:block">
    <polyline points="${area}" fill="${color}22" stroke="none"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <text x="${padL}" y="10" fill="${grid}" font-size="11">${fmtNum(max)} kg</text>
    <text x="${padL}" y="${H - 2}" fill="${grid}" font-size="11">${fmtNum(min)} kg</text>
  </svg>`;
}

export function buildCharacterSheetHtml(data: CharacterSheetData): string {
  const themeId = (data.themeId in THEMES ? data.themeId : 'void_rpg') as ThemeId;
  const th = THEMES[themeId];
  const ti = tierIndex(data.level);
  const tier = TIERS[ti];
  const stageName = STAGE_NAMES[ti];
  const className = CLASS_LABELS[data.avatarStage] ?? CLASS_LABELS[0];
  const xpPct = data.xpRequired > 0 ? Math.min(100, Math.round((data.currentXP / data.xpRequired) * 100)) : 0;

  const statCard = (label: string, value: string) => `
    <div class="stat">
      <div class="stat-value">${esc(value)}</div>
      <div class="stat-label">${esc(label)}</div>
    </div>`;

  const stats = [
    statCard('Séances totales', String(data.totalWorkouts)),
    statCard('Série en cours', `${data.streak} j`),
    statCard('XP total', data.totalXP.toLocaleString('fr-FR')),
    statCard('Programmes créés', String(data.programsCreated)),
  ].join('');

  const lastWorkoutHtml = data.lastWorkout
    ? `<span class="hero-meta">Dernière séance : <b>${esc(data.lastWorkout.sessionName)}</b> · ${fmtDate(data.lastWorkout.date)}</span>`
    : `<span class="hero-meta">Aucune séance enregistrée pour l'instant.</span>`;

  const badgesHtml = data.badges.length
    ? data.badges.map((b) => {
        const c = RARITY_COLORS[b.rarity] ?? RARITY_COLORS.common;
        const icon = b.iconPng
          ? `<img class="badge-img" src="${b.iconPng}" alt="" />`
          : `<div class="badge-img"></div>`;
        return `
          <div class="badge" style="border-color:${c};box-shadow:0 0 12px -4px ${c}">
            <div class="badge-icon" style="background:radial-gradient(circle at 50% 35%, ${c}33, transparent 70%)">${icon}</div>
            <div class="badge-name" style="color:${c}">${esc(b.nameFr)}</div>
            <div class="badge-date">${fmtDate(b.unlockedAt)}</div>
          </div>`;
      }).join('')
    : `<p class="empty">Aucun trophée débloqué pour l'instant. Lance une séance pour commencer ta légende !</p>`;

  const avatarHtml = data.avatarPng
    ? `<img class="avatar" src="${data.avatarPng}" alt="Avatar" />`
    : `<div class="avatar avatar-fallback">${LOGO_SVG}</div>`;

  // ── Section Évolution (poids + mensurations) ──
  const weightSvg = buildWeightChartSvg(data.weightSeries, tier.color, th.textSecondary);
  const hasEvolution = weightSvg !== '' || data.measurements.length > 0;

  const measurementChips = data.measurements.map((m) => {
    const deltaHtml = m.delta === null
      ? ''
      : `<span class="mes-delta" style="color:${m.delta < 0 ? '#22c55e' : m.delta > 0 ? '#f59e0b' : th.textSecondary}">${m.delta > 0 ? '+' : ''}${fmtNum(m.delta)}</span>`;
    return `
      <div class="mes">
        <div class="mes-label">${esc(m.label)}</div>
        <div class="mes-value">${fmtNum(m.latest)}<span class="mes-unit">${esc(m.unit)}</span> ${deltaHtml}</div>
      </div>`;
  }).join('');

  const evolutionHtml = hasEvolution ? `
    <div class="section-title">Évolution physique</div>
    <div class="evolution">
      <div class="chart-box">
        <div class="chart-title">Poids</div>
        ${weightSvg || `<p class="chart-empty">Pas encore assez de relevés de poids.</p>`}
      </div>
      <div class="mes-grid">
        ${measurementChips || `<p class="chart-empty">Aucune mensuration enregistrée.</p>`}
      </div>
    </div>` : '';

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=VT323&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --display: 'VT323', 'Courier New', monospace; --body: 'Inter', system-ui, sans-serif; }
  body {
    width: 210mm; min-height: 297mm;
    font-family: var(--body);
    color: ${th.textPrimary};
    background: #ffffff;
    padding: 12mm;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet {
    border: 2px solid ${th.border};
    border-radius: 18px;
    background: ${th.bgCard};
    background-image:
      radial-gradient(circle at 18% 10%, ${tier.color}26, transparent 42%),
      radial-gradient(circle at 85% 92%, ${th.accent}26, transparent 45%);
    box-shadow: inset 0 0 60px ${tier.color}14;
    overflow: hidden;
  }
  .topbar { height: 6px; background: linear-gradient(90deg, ${tier.color}, ${tier.light}); }
  .title {
    text-align: center; padding: 12px 0 4px;
    font-family: var(--display); letter-spacing: 6px; font-size: 22px; text-transform: uppercase;
    color: ${th.textSecondary};
  }
  .title b { color: ${th.accentSoft}; }
  .hero { display: flex; gap: 26px; align-items: center; padding: 6px 30px 18px; border-bottom: 1px solid ${th.border}; }
  .avatar { width: 120px; height: 180px; image-rendering: pixelated; filter: drop-shadow(0 0 10px ${tier.color}88); }
  .avatar-fallback { display: flex; align-items: center; justify-content: center; }
  .avatar-fallback svg { width: 96px; height: 96px; }
  .hero-info { flex: 1; min-width: 0; }
  .hero-name { font-family: var(--display); font-size: 46px; line-height: 1; }
  .hero-class { margin-top: 4px; font-size: 13px; letter-spacing: 1px; color: ${tier.color}; font-weight: 700; }
  .hero-class .sep { color: ${th.textSecondary}; margin: 0 8px; }
  .level-row { display: flex; align-items: center; gap: 14px; margin: 14px 0 8px; }
  .level-badge {
    width: 56px; height: 56px; border-radius: 50%; flex-direction: column;
    display: flex; align-items: center; justify-content: center;
    background: ${th.bgShield}; border: 2px solid ${tier.color}; box-shadow: 0 0 14px ${tier.color}66;
  }
  .level-badge .lvl-label { font-size: 8px; letter-spacing: 1px; color: ${th.textSecondary}; }
  .level-badge .lvl-num { font-family: var(--display); font-size: 30px; color: ${tier.light}; line-height: 0.9; }
  .xp-wrap { flex: 1; }
  .xp-meta { display: flex; justify-content: space-between; font-size: 11px; color: ${th.textSecondary}; margin-bottom: 4px; }
  .xp-bar { height: 14px; border-radius: 8px; background: ${th.bgShield}; border: 1px solid ${th.border}; overflow: hidden; }
  .xp-fill { height: 100%; width: ${xpPct}%; background: linear-gradient(90deg, ${tier.color}, ${tier.light}); }
  .hero-meta { display: block; margin-top: 10px; font-size: 12px; color: ${th.textSecondary}; }
  .hero-meta b { color: ${th.textPrimary}; }

  .section-title { padding: 18px 30px 8px; font-family: var(--display); font-size: 17px; letter-spacing: 3px; text-transform: uppercase; color: ${th.textSecondary}; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 0 30px; }
  .stat { background: ${th.bgShield}; border: 1px solid ${th.border}; border-radius: 12px; padding: 12px 8px; text-align: center; }
  .stat-value { font-family: var(--display); font-size: 36px; line-height: 0.9; color: ${th.accentSoft}; }
  .stat-label { margin-top: 6px; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: ${th.textSecondary}; }

  .evolution { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; padding: 0 30px; align-items: stretch; }
  .chart-box, .mes-grid { background: ${th.bgShield}; border: 1px solid ${th.border}; border-radius: 12px; padding: 12px 14px; }
  .chart-title { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: ${th.textSecondary}; margin-bottom: 4px; }
  .chart-empty { font-size: 11px; font-style: italic; color: ${th.textSecondary}; padding: 8px 0; }
  .mes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; align-content: center; }
  .mes-label { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: ${th.textSecondary}; }
  .mes-value { font-family: var(--display); font-size: 24px; line-height: 1; color: ${th.textPrimary}; }
  .mes-unit { font-size: 11px; color: ${th.textSecondary}; margin-left: 2px; }
  .mes-delta { font-family: var(--body); font-size: 11px; font-weight: 700; margin-left: 4px; }

  .badges { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 0 30px 22px; }
  .badge { background: ${th.bgShield}; border: 1.5px solid; border-radius: 12px; padding: 12px 8px; text-align: center; }
  .badge-icon { width: 48px; height: 48px; margin: 0 auto 8px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .badge-img { width: 39px; height: 39px; image-rendering: pixelated; }
  .badge-name { font-size: 11px; font-weight: 700; line-height: 1.2; }
  .badge-date { margin-top: 4px; font-size: 9px; color: ${th.textSecondary}; }
  .empty { padding: 0 30px 22px; font-size: 13px; font-style: italic; color: ${th.textSecondary}; }

  .footer { border-top: 1px solid ${th.border}; padding: 12px 30px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; letter-spacing: 1px; color: ${th.textSecondary}; }
  .footer .brand { display: flex; align-items: center; gap: 7px; color: ${th.accentSoft}; font-weight: 700; }
  .footer .brand svg { width: 18px; height: 18px; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="topbar"></div>
    <div class="title">Fiche de personnage · <b>FitQuest</b></div>

    <div class="hero">
      ${avatarHtml}
      <div class="hero-info">
        <div class="hero-name">${esc(data.username)}</div>
        <div class="hero-class">${esc(className)}<span class="sep">·</span>${esc(stageName)}<span class="sep">·</span>${esc(tier.name)}</div>
        <div class="level-row">
          <div class="level-badge"><span class="lvl-label">NIV</span><span class="lvl-num">${data.level}</span></div>
          <div class="xp-wrap">
            <div class="xp-meta"><span>XP du niveau ${data.level}</span><span>${data.currentXP.toLocaleString('fr-FR')} / ${data.xpRequired.toLocaleString('fr-FR')}</span></div>
            <div class="xp-bar"><div class="xp-fill"></div></div>
          </div>
        </div>
        ${lastWorkoutHtml}
      </div>
    </div>

    <div class="section-title">Statistiques</div>
    <div class="stats">${stats}</div>

    ${evolutionHtml}

    <div class="section-title">Trophées débloqués (${data.badges.length})</div>
    ${data.badges.length ? `<div class="badges">${badgesHtml}</div>` : badgesHtml}

    <div class="footer">
      <span>Héros enrôlé le ${fmtDate(data.createdAt)}</span>
      <span class="brand">${LOGO_SVG} FitQuest</span>
    </div>
  </div>
</body>
</html>`;
}
