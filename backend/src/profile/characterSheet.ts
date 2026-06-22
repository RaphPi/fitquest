// S14 — Génération du HTML "fiche de personnage RPG" pour l'export PDF (Puppeteer).
// HTML autonome (CSS inline), chargé tel quel par Chromium headless.
// Police arcade VT323 via Google Fonts (comme l'app). Icônes (avatar + badges) et
// photos fournies/intégrées en images ; logo SVG inline.
// Palettes thème/paliers dupliquées volontairement depuis le front (quelques constantes).

export type ThemeId = 'void_rpg' | 'forest_warrior' | 'solar_blaze';

interface ThemeTokens {
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
    bgCard: '#0f1117', bgShield: '#0d0b1e', border: '#1e2030',
    accent: '#6366f1', accentSoft: '#a78bfa', textPrimary: '#f1f5f9', textSecondary: '#94a3b8',
  },
  forest_warrior: {
    bgCard: '#10260f', bgShield: '#0a1a0a', border: '#1a3020',
    accent: '#22c55e', accentSoft: '#4ade80', textPrimary: '#f1f5f9', textSecondary: '#94a3b8',
  },
  solar_blaze: {
    bgCard: '#241608', bgShield: '#140b00', border: '#2e1f00',
    accent: '#f59e0b', accentSoft: '#fbbf24', textPrimary: '#f1f5f9', textSecondary: '#94a3b8',
  },
};

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
  common: '#94a3b8', rare: '#38bdf8', epic: '#a855f7', legendary: '#f59e0b',
};

// Palette de couleurs des courbes (lisibles sur fond sombre, indépendantes du thème).
export const SERIES_PALETTE = [
  '#a78bfa', '#38bdf8', '#4ade80', '#fbbf24', '#f472b6',
  '#22d3ee', '#fb923c', '#a3e635', '#e879f9', '#60a5fa',
];

const CLASS_LABELS = ['Guerrier', 'Archer', 'Mage', 'Chevalier'];

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
export interface MetricSeries {
  name: string;
  color: string;
  points: SeriesPoint[];
  latest: number;
  delta: number | null; // variation depuis le 1er relevé (null si un seul point)
}
export interface MetricGroup { unit: string; series: MetricSeries[]; }
export interface ProgressPhoto { dataUrl: string; date: Date; }

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
  avatarPng: string | null;
  metricGroups: MetricGroup[];
  photos: ProgressPhoto[];
  badges: { nameFr: string; rarity: string; iconPng: string | null; unlockedAt: Date }[];
  showBadges: boolean;
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

/** Courbe lissée (Catmull-Rom → Bézier cubique) passant par tous les points.
 *  Les points de contrôle sont bornés à [yTop, yBot] pour éviter que l'overshoot
 *  du lissage ne sorte du cadre sur les variations brusques. */
function smoothPath(pts: { x: number; y: number }[], yTop: number, yBot: number): string {
  if (pts.length < 2) return '';
  const clampY = (y: number) => Math.max(yTop, Math.min(yBot, y));
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clampY(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Graphe multi-lignes pour un groupe d'unité (axe X = temps, axe Y = valeurs de l'unité). */
function buildGroupChartSvg(group: MetricGroup, gridColor: string): string {
  const all = group.series.flatMap((s) => s.points);
  if (all.length === 0) return '';
  const times = all.map((p) => p.date.getTime());
  let tMin = Math.min(...times), tMax = Math.max(...times);
  if (tMin === tMax) { tMin -= 1; tMax += 1; }
  const vals = all.map((p) => p.value);
  let vMin = Math.min(...vals), vMax = Math.max(...vals);
  if (vMin === vMax) { vMin -= 1; vMax += 1; }
  else { const m = (vMax - vMin) * 0.15; vMin -= m; vMax += m; } // marge verticale (headroom)

  const W = 340, H = 104, padL = 6, padR = 6, padT = 13, padB = 9;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (t: number) => padL + (innerW * (t - tMin)) / (tMax - tMin);
  const y = (v: number) => padT + innerH * (1 - (v - vMin) / (vMax - vMin));

  const lines = group.series.map((s) => {
    const pts = s.points
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((p) => ({ x: x(p.date.getTime()), y: y(p.value) }));
    const dots = pts
      .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.2" fill="${s.color}"/>`)
      .join('');
    const path = pts.length > 1
      ? `<path d="${smoothPath(pts, padT, padT + innerH)}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
      : '';
    return path + dots;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="none" style="display:block;overflow:hidden">
    ${lines}
    <text x="${padL}" y="10" fill="${gridColor}" font-size="10">${fmtNum(vMax)} ${esc(group.unit)}</text>
    <text x="${padL}" y="${H - 1}" fill="${gridColor}" font-size="10">${fmtNum(vMin)} ${esc(group.unit)}</text>
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
    <div class="stat"><div class="stat-value">${esc(value)}</div><div class="stat-label">${esc(label)}</div></div>`;
  const stats = [
    statCard('Séances totales', String(data.totalWorkouts)),
    statCard('Série en cours', `${data.streak} j`),
    statCard('XP total', data.totalXP.toLocaleString('fr-FR')),
    statCard('Programmes créés', String(data.programsCreated)),
  ].join('');

  const lastWorkoutHtml = data.lastWorkout
    ? `<span class="hero-meta">Dernière séance : <b>${esc(data.lastWorkout.sessionName)}</b> · ${fmtDate(data.lastWorkout.date)}</span>`
    : `<span class="hero-meta">Aucune séance enregistrée pour l'instant.</span>`;

  // ── Évolution physique : un graphe par unité + légende alignée ──
  const evolutionHtml = data.metricGroups.length ? `
    <div class="section-title">Évolution physique</div>
    <div class="evolution">
      ${data.metricGroups.map((g) => {
        const legend = g.series.map((s) => {
          const deltaHtml = s.delta === null
            ? '<span class="lg-delta"></span>'
            : `<span class="lg-delta" style="color:${s.delta < 0 ? '#22c55e' : s.delta > 0 ? '#f59e0b' : th.textSecondary}">${s.delta > 0 ? '+' : ''}${fmtNum(s.delta)}</span>`;
          return `
            <span class="lg-name"><i style="background:${s.color}"></i>${esc(s.name)}</span>
            <span class="lg-val">${fmtNum(s.latest)} ${esc(g.unit)}</span>
            ${deltaHtml}`;
        }).join('');
        return `
          <div class="metric-card">
            <div class="mc-title">Unité : ${esc(g.unit)}</div>
            ${buildGroupChartSvg(g, th.textSecondary)}
            <div class="legend">${legend}</div>
          </div>`;
      }).join('')}
    </div>` : '';

  // ── Photos avant / après ──
  const photosHtml = data.photos.length ? `
    <div class="section-title">Progression photo</div>
    <div class="photos">
      ${data.photos.map((p, i) => `
        <div class="photo">
          <img src="${p.dataUrl}" alt="" />
          <div class="cap">${i === 0 ? 'Avant' : 'Après'} · ${fmtDate(p.date)}</div>
        </div>`).join('')}
    </div>` : '';

  // ── Trophées ──
  const badgesInner = data.badges.length
    ? `<div class="badges">${data.badges.map((b) => {
        const c = RARITY_COLORS[b.rarity] ?? RARITY_COLORS.common;
        const icon = b.iconPng ? `<img class="badge-img" src="${b.iconPng}" alt="" />` : `<div class="badge-img"></div>`;
        return `
          <div class="badge" style="border-color:${c};box-shadow:0 0 12px -4px ${c}">
            <div class="badge-icon" style="background:radial-gradient(circle at 50% 35%, ${c}33, transparent 70%)">${icon}</div>
            <div class="badge-name" style="color:${c}">${esc(b.nameFr)}</div>
            <div class="badge-date">${fmtDate(b.unlockedAt)}</div>
          </div>`;
      }).join('')}</div>`
    : `<p class="empty">Aucun trophée débloqué pour l'instant. Lance une séance pour commencer ta légende !</p>`;
  const badgesHtml = data.showBadges
    ? `<div class="section-title">Trophées débloqués (${data.badges.length})</div>${badgesInner}`
    : '';

  const avatarHtml = data.avatarPng
    ? `<img class="avatar" src="${data.avatarPng}" alt="Avatar" />`
    : `<div class="avatar avatar-fallback">${LOGO_SVG}</div>`;

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
  body { width: 210mm; min-height: 297mm; font-family: var(--body); color: ${th.textPrimary}; background: #fff; padding: 9mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { border: 2px solid ${th.border}; border-radius: 18px; background: ${th.bgCard};
    background-image: radial-gradient(circle at 18% 10%, ${tier.color}26, transparent 42%), radial-gradient(circle at 85% 92%, ${th.accent}26, transparent 45%);
    box-shadow: inset 0 0 60px ${tier.color}14; overflow: hidden; }
  .topbar { height: 6px; background: linear-gradient(90deg, ${tier.color}, ${tier.light}); }
  .title { text-align: center; padding: 9px 0 3px; font-family: var(--display); letter-spacing: 6px; font-size: 19px; text-transform: uppercase; color: ${th.textSecondary}; }
  .title b { color: ${th.accentSoft}; }
  .hero { display: flex; gap: 22px; align-items: center; padding: 4px 28px 12px; border-bottom: 1px solid ${th.border}; }
  .avatar { width: 104px; height: 156px; image-rendering: pixelated; filter: drop-shadow(0 0 10px ${tier.color}88); }
  .avatar-fallback { display: flex; align-items: center; justify-content: center; }
  .avatar-fallback svg { width: 84px; height: 84px; }
  .hero-info { flex: 1; min-width: 0; }
  .hero-name { font-family: var(--display); font-size: 38px; line-height: 1; }
  .hero-class { margin-top: 3px; font-size: 13px; letter-spacing: 1px; color: ${tier.color}; font-weight: 700; }
  .hero-class .sep { color: ${th.textSecondary}; margin: 0 8px; }
  .level-row { display: flex; align-items: center; gap: 14px; margin: 10px 0 6px; }
  .level-badge { width: 50px; height: 50px; border-radius: 50%; flex-direction: column; display: flex; align-items: center; justify-content: center; background: ${th.bgShield}; border: 2px solid ${tier.color}; box-shadow: 0 0 14px ${tier.color}66; }
  .level-badge .lvl-label { font-size: 8px; letter-spacing: 1px; color: ${th.textSecondary}; }
  .level-badge .lvl-num { font-family: var(--display); font-size: 26px; color: ${tier.light}; line-height: 0.9; }
  .xp-wrap { flex: 1; }
  .xp-meta { display: flex; justify-content: space-between; font-size: 11px; color: ${th.textSecondary}; margin-bottom: 4px; }
  .xp-bar { height: 13px; border-radius: 8px; background: ${th.bgShield}; border: 1px solid ${th.border}; overflow: hidden; }
  .xp-fill { height: 100%; width: ${xpPct}%; background: linear-gradient(90deg, ${tier.color}, ${tier.light}); }
  .hero-meta { display: block; margin-top: 7px; font-size: 12px; color: ${th.textSecondary}; }
  .hero-meta b { color: ${th.textPrimary}; }

  .section-title { padding: 11px 28px 5px; font-family: var(--display); font-size: 15px; letter-spacing: 3px; text-transform: uppercase; color: ${th.textSecondary}; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 0 28px; }
  .stat { background: ${th.bgShield}; border: 1px solid ${th.border}; border-radius: 12px; padding: 9px 6px; text-align: center; }
  .stat-value { font-family: var(--display); font-size: 30px; line-height: 0.9; color: ${th.accentSoft}; }
  .stat-label { margin-top: 5px; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: ${th.textSecondary}; }

  .evolution { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; padding: 0 28px; }
  .metric-card { background: ${th.bgShield}; border: 1px solid ${th.border}; border-radius: 12px; padding: 9px 12px; }
  .mc-title { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: ${th.textSecondary}; margin-bottom: 3px; }
  .legend { display: grid; grid-template-columns: 1fr auto auto; gap: 2px 12px; margin-top: 5px; font-size: 11px; align-items: baseline; }
  .lg-name { color: ${th.textPrimary}; display: flex; align-items: center; gap: 6px; }
  .lg-name i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
  .lg-val { font-family: var(--display); font-size: 14px; text-align: right; color: ${th.textPrimary}; }
  .lg-delta { font-weight: 700; text-align: right; min-width: 30px; }

  .photos { display: flex; gap: 16px; padding: 0 28px; }
  .photo { flex: 1; text-align: center; }
  .photo img { width: 100%; max-height: 150px; object-fit: contain; border: 1px solid ${th.border}; border-radius: 10px; background: ${th.bgShield}; }
  .photo .cap { margin-top: 5px; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: ${th.textSecondary}; }

  .badges { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 0 28px; }
  .badge { background: ${th.bgShield}; border: 1.5px solid; border-radius: 12px; padding: 8px 6px; text-align: center; }
  .badge-icon { width: 40px; height: 40px; margin: 0 auto 6px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .badge-img { width: 32px; height: 32px; image-rendering: pixelated; }
  .badge-name { font-size: 11px; font-weight: 700; line-height: 1.2; }
  .badge-date { margin-top: 3px; font-size: 9px; color: ${th.textSecondary}; }
  .empty { padding: 0 28px; font-size: 13px; font-style: italic; color: ${th.textSecondary}; }

  .footer { margin-top: 12px; border-top: 1px solid ${th.border}; padding: 9px 28px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; letter-spacing: 1px; color: ${th.textSecondary}; }
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
    ${photosHtml}
    ${badgesHtml}

    <div class="footer">
      <span>Héros enrôlé le ${fmtDate(data.createdAt)}</span>
      <span class="brand">${LOGO_SVG} FitQuest</span>
    </div>
  </div>
</body>
</html>`;
}
