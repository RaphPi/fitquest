// S14 — Génération du HTML "fiche de personnage RPG" pour l'export PDF (Puppeteer).
// Le HTML est autonome (CSS inline) : il est chargé tel quel par Chromium headless.
// Palette de thème dupliquée volontairement depuis le front (frontend/src/lib/theme.ts)
// et les paliers (frontend/src/lib/levelTier.ts) — petite duplication assumée plutôt
// qu'un module partagé front/back pour 3 constantes.

export type ThemeId = 'void_rpg' | 'forest_warrior' | 'solar_blaze';

interface ThemeTokens {
  bgMain: string;
  bgCard: string;
  bgShield: string;
  border: string;
  accent: string;
  accentSoft: string;
  xp: string;
  textPrimary: string;
  textSecondary: string;
}

const THEMES: Record<ThemeId, ThemeTokens> = {
  void_rpg: {
    bgMain: '#0a0a0f', bgCard: '#0f1117', bgShield: '#0d0b1e', border: '#1e2030',
    accent: '#6366f1', accentSoft: '#a78bfa', xp: '#f59e0b',
    textPrimary: '#f1f5f9', textSecondary: '#94a3b8',
  },
  forest_warrior: {
    bgMain: '#0d1f0f', bgCard: '#10260f', bgShield: '#0a1a0a', border: '#1a3020',
    accent: '#22c55e', accentSoft: '#4ade80', xp: '#f59e0b',
    textPrimary: '#f1f5f9', textSecondary: '#94a3b8',
  },
  solar_blaze: {
    bgMain: '#1a0f00', bgCard: '#241608', bgShield: '#140b00', border: '#2e1f00',
    accent: '#f59e0b', accentSoft: '#fbbf24', xp: '#f59e0b',
    textPrimary: '#f1f5f9', textSecondary: '#94a3b8',
  },
};

// Paliers (seuils + couleurs) alignés sur frontend/src/lib/levelTier.ts.
const TIER_MIN_LEVELS = [1, 10, 20, 35, 50];
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

// Couleurs de rareté des trophées (alignées sur frontend/src/lib/badgeIcons.ts dans l'esprit).
const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  rare: '#38bdf8',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

// iconType (cf. schema Badge) → emoji décoratif pour la fiche PDF.
const ICON_EMOJI: Record<string, string> = {
  boots: '👢', medal: '🏅', crown: '👑', flame: '🔥', calendar: '📅',
  star: '⭐', helm: '🪖', crystal: '💎', scroll: '📜',
};

const CLASS_LABELS = ['Guerrier', 'Archer', 'Mage', 'Chevalier'];

export interface CharacterSheetData {
  username: string;
  themeId: string;
  avatarStage: number;     // 0..3 (classe)
  level: number;
  totalXP: number;
  currentXP: number;
  xpRequired: number;      // XP requis pour le niveau courant
  streak: number;
  createdAt: Date;
  totalWorkouts: number;
  programsCreated: number;
  lastWorkout: { sessionName: string; date: Date } | null;
  badges: { nameFr: string; rarity: string; iconType: string; unlockedAt: Date }[];
  avatarPng: string | null; // data:image/png;base64,...
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function buildCharacterSheetHtml(data: CharacterSheetData): string {
  const themeId = (data.themeId in THEMES ? data.themeId : 'void_rpg') as ThemeId;
  const th = THEMES[themeId];
  const ti = tierIndex(data.level);
  const tier = TIERS[ti];
  const stageName = STAGE_NAMES[ti];
  const className = CLASS_LABELS[data.avatarStage] ?? CLASS_LABELS[0];
  const xpPct = data.xpRequired > 0
    ? Math.min(100, Math.round((data.currentXP / data.xpRequired) * 100))
    : 0;

  const statCard = (label: string, value: string) => `
    <div class="stat">
      <div class="stat-value">${esc(value)}</div>
      <div class="stat-label">${esc(label)}</div>
    </div>`;

  const stats = [
    statCard('Séances totales', String(data.totalWorkouts)),
    statCard('Série en cours', `${data.streak} 🔥`),
    statCard('XP total', data.totalXP.toLocaleString('fr-FR')),
    statCard('Programmes créés', String(data.programsCreated)),
  ].join('');

  const lastWorkoutHtml = data.lastWorkout
    ? `<span class="hero-meta">Dernière séance : <b>${esc(data.lastWorkout.sessionName)}</b> · ${fmtDate(data.lastWorkout.date)}</span>`
    : `<span class="hero-meta">Aucune séance enregistrée pour l'instant.</span>`;

  const badgesHtml = data.badges.length
    ? data.badges.map((b) => {
        const c = RARITY_COLORS[b.rarity] ?? RARITY_COLORS.common;
        const emoji = ICON_EMOJI[b.iconType] ?? '🏆';
        return `
          <div class="badge" style="border-color:${c};box-shadow:0 0 12px -4px ${c}">
            <div class="badge-icon" style="background:radial-gradient(circle at 50% 35%, ${c}33, transparent 70%)">${emoji}</div>
            <div class="badge-name" style="color:${c}">${esc(b.nameFr)}</div>
            <div class="badge-date">${fmtDate(b.unlockedAt)}</div>
          </div>`;
      }).join('')
    : `<p class="empty">Aucun trophée débloqué pour l'instant. Lance une séance pour commencer ta légende !</p>`;

  const avatarHtml = data.avatarPng
    ? `<img class="avatar" src="${data.avatarPng}" alt="Avatar" />`
    : `<div class="avatar avatar-fallback">🗡️</div>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 210mm; min-height: 297mm;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: ${th.textPrimary};
    background: ${th.bgMain};
    background-image:
      radial-gradient(circle at 18% 12%, ${tier.color}22, transparent 42%),
      radial-gradient(circle at 85% 90%, ${th.accent}22, transparent 45%);
    padding: 16mm 14mm;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet {
    border: 2px solid ${th.border};
    border-radius: 18px;
    background: ${th.bgCard};
    box-shadow: inset 0 0 60px ${tier.color}11;
    overflow: hidden;
  }
  .topbar { height: 6px; background: linear-gradient(90deg, ${tier.color}, ${tier.light}); }
  .title {
    text-align: center; padding: 16px 0 6px;
    letter-spacing: 7px; font-size: 12px; text-transform: uppercase;
    color: ${th.textSecondary};
  }
  .title b { color: ${th.accentSoft}; }
  .hero {
    display: flex; gap: 28px; align-items: center;
    padding: 8px 32px 24px; border-bottom: 1px solid ${th.border};
  }
  .avatar {
    width: 130px; height: 195px;
    image-rendering: pixelated;
    filter: drop-shadow(0 0 10px ${tier.color}88);
  }
  .avatar-fallback {
    display: flex; align-items: center; justify-content: center;
    font-size: 90px;
  }
  .hero-info { flex: 1; min-width: 0; }
  .hero-name { font-size: 34px; font-weight: 800; line-height: 1.1; }
  .hero-class {
    margin-top: 4px; font-size: 14px; letter-spacing: 1px;
    color: ${tier.color}; font-weight: 700;
  }
  .hero-class .sep { color: ${th.textSecondary}; margin: 0 8px; }
  .level-row { display: flex; align-items: center; gap: 14px; margin: 16px 0 8px; }
  .level-badge {
    width: 58px; height: 58px; border-radius: 50%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: ${th.bgShield}; border: 2px solid ${tier.color};
    box-shadow: 0 0 14px ${tier.color}66;
  }
  .level-badge .lvl-label { font-size: 8px; letter-spacing: 1px; color: ${th.textSecondary}; }
  .level-badge .lvl-num { font-size: 22px; font-weight: 800; color: ${tier.light}; line-height: 1; }
  .xp-wrap { flex: 1; }
  .xp-meta { display: flex; justify-content: space-between; font-size: 11px; color: ${th.textSecondary}; margin-bottom: 4px; }
  .xp-bar { height: 14px; border-radius: 8px; background: ${th.bgShield}; border: 1px solid ${th.border}; overflow: hidden; }
  .xp-fill { height: 100%; width: ${xpPct}%; background: linear-gradient(90deg, ${tier.color}, ${tier.light}); }
  .hero-meta { display: block; margin-top: 10px; font-size: 12px; color: ${th.textSecondary}; }
  .hero-meta b { color: ${th.textPrimary}; }

  .section-title {
    padding: 22px 32px 10px; font-size: 12px; letter-spacing: 4px;
    text-transform: uppercase; color: ${th.textSecondary};
  }
  .stats {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
    padding: 0 32px;
  }
  .stat {
    background: ${th.bgShield}; border: 1px solid ${th.border}; border-radius: 12px;
    padding: 16px 10px; text-align: center;
  }
  .stat-value { font-size: 26px; font-weight: 800; color: ${th.accentSoft}; }
  .stat-label { margin-top: 4px; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: ${th.textSecondary}; }

  .badges { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 0 32px 28px; }
  .badge { background: ${th.bgShield}; border: 1.5px solid; border-radius: 12px; padding: 14px 8px; text-align: center; }
  .badge-icon {
    width: 46px; height: 46px; margin: 0 auto 8px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: 26px;
  }
  .badge-name { font-size: 11px; font-weight: 700; line-height: 1.2; }
  .badge-date { margin-top: 4px; font-size: 9px; color: ${th.textSecondary}; }
  .empty { padding: 0 32px 28px; font-size: 13px; font-style: italic; color: ${th.textSecondary}; }

  .footer {
    border-top: 1px solid ${th.border};
    padding: 14px 32px; display: flex; justify-content: space-between;
    font-size: 10px; letter-spacing: 1px; color: ${th.textSecondary};
  }
  .footer .brand { color: ${th.accentSoft}; font-weight: 700; }
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
        <div class="hero-class">
          ${esc(className)}<span class="sep">·</span>${esc(stageName)} <span class="sep">·</span>${esc(tier.name)}
        </div>
        <div class="level-row">
          <div class="level-badge">
            <span class="lvl-label">NIV</span>
            <span class="lvl-num">${data.level}</span>
          </div>
          <div class="xp-wrap">
            <div class="xp-meta">
              <span>XP du niveau ${data.level}</span>
              <span>${data.currentXP.toLocaleString('fr-FR')} / ${data.xpRequired.toLocaleString('fr-FR')}</span>
            </div>
            <div class="xp-bar"><div class="xp-fill"></div></div>
          </div>
        </div>
        ${lastWorkoutHtml}
      </div>
    </div>

    <div class="section-title">Statistiques</div>
    <div class="stats">${stats}</div>

    <div class="section-title">Trophées débloqués (${data.badges.length})</div>
    ${data.badges.length ? `<div class="badges">${badgesHtml}</div>` : badgesHtml}

    <div class="footer">
      <span>Héros enrôlé le ${fmtDate(data.createdAt)}</span>
      <span class="brand">⚔ FitQuest</span>
    </div>
  </div>
</body>
</html>`;
}
