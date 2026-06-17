// FitQuest 7E — sprites pixel art de l'avatar (grilles de chars + palette, rendus <canvas>).
// Même esprit que lib/pixelSprites.ts (boss) et lib/badgeIcons.ts (badges).
//
// Direction artistique « hybride » (validée) :
//   - Chaque CLASSE garde sa propre identité chromatique (corps + coiffe + arme) → on
//     reconnaît un guerrier / archer / mage / chevalier.
//   - Le PALIER (Bronze→Diamant, cf. lib/levelTier.ts) s'exprime par des accessoires
//     teintés qui s'ACCUMULENT avec le stade : trim d'épaule + gemme (≥2), cape (≥3),
//     pauldrons (≥4), couronne (≥5). Plus l'aura/halo ambiants gérés en CSS dans Avatar.tsx.
//
// Grille 16×24. Clés communes : '.' transparent · '#' contour · S/s peau · E yeux ·
// H cheveux · A/B/C armure-tissu (foncé/moyen/clair) · M/L métal · W bois/cuir.
// Les overlays de stade utilisent une palette TIER dédiée : T (foncé) U (moyen) V (clair) L (éclat).

import type { AvatarClassKey } from '@/lib/avatar';
import type { LevelTier } from '@/lib/levelTier';

type Pal = Record<string, string>;

/** Corps générique partagé (même squelette pour les 4 classes, teinté par la palette). */
const BODY: string[] = [
  '................', // 0
  '................', // 1
  '.....#SSSS#.....', // 2  front
  '.....SEssES.....', // 3  yeux
  '.....SSSSSS.....', // 4
  '......SSSS......', // 5
  '......#SS#......', // 6  cou
  '....AABBBBAA....', // 7  épaules
  '...ABBBBBBBBA...', // 8  torse
  '...ABBCCCCBBA...', // 9
  '...ABBCCCCBBA...', // 10
  '...SABBBBBBAS...', // 11 bras
  '...S#BBBBBB#S...', // 12
  '....AABBBBAA....', // 13
  '.....A####A.....', // 14 ceinture
  '.....WW..WW.....', // 15 cuisses
  '.....WW..WW.....', // 16
  '.....BB..BB.....', // 17 tibias
  '.....BB..BB.....', // 18
  '.....MM..MM.....', // 19 bottes
  '....#MM..MM#....', // 20
  '................', // 21
  '................', // 22
  '................', // 23
];

/** Coiffe par classe (dessinée par-dessus la tête, rows 0-4). */
const HEADGEAR: Record<AvatarClassKey, string[]> = {
  warrior: [
    '................',
    '.....MMMMMM.....',
    '....MMLLLLMM....',
    '....M......M....',
  ],
  archer: [
    '.......AA.......',
    '......ABBA......',
    '.....ABBBBA.....',
    '.....A....A.....',
  ],
  mage: [
    '.......AA.......',
    '......ABBA......',
    '.....ABBBBA.....',
    '....ABBBBBBA....',
  ],
  knight: [
    '.....MMMMMM.....',
    '....MMMMMMMM....',
    '....MMEEEEMM....',
    '....MMMMMMMM....',
  ],
};

/** Arme par classe (dessinée par-dessus le corps). */
const WEAPON: Record<AvatarClassKey, string[]> = {
  // Épée tenue à droite, lame vers le haut.
  warrior: [
    '................',
    '................',
    '.............ML.',
    '.............ML.',
    '.............ML.',
    '.............ML.',
    '.............ML.',
    '.............ML.',
    '.............ML.',
    '.............ML.',
    '............#MM#',
    '.............WW.',
    '.............WW.',
    '.............#W#',
  ],
  // Arc en croissant à gauche.
  archer: [
    '................',
    '................',
    '................',
    '..W.............',
    '.W..............',
    'W...............',
    'W...............',
    'W...............',
    'W...............',
    'W...............',
    '.W..............',
    '..W.............',
  ],
  // Bâton à droite, orbe lumineuse en tête.
  mage: [
    '................',
    '.............LL.',
    '............LMML',
    '.............LL.',
    '.............W..',
    '.............W..',
    '.............W..',
    '.............W..',
    '.............W..',
    '.............W..',
    '.............W..',
    '.............W..',
    '.............W..',
    '.............W..',
  ],
  // Épée à droite + bouclier à gauche.
  knight: [
    '................',
    '................',
    '.............ML.',
    '.MMM.........ML.',
    '.MLM.........ML.',
    '.MMM.........ML.',
    '.MLM.........ML.',
    '.MMM.........ML.',
    '..M..........ML.',
    '.............ML.',
    '............#MM#',
    '.............WW.',
    '.............WW.',
    '.............#W#',
  ],
};

/** Overlays de stade (palette TIER). Accumulés selon le stade courant (1..5). */
// ≥2 : trim d'épaule + gemme de torse.
const TRIM: string[] = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '...U........U...',
  '................',
  '.......VV.......',
  '.......UU.......',
];
// ≥3 : cape (col d'épaule teint + drapés latéraux).
const CAPE: string[] = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..TUUUUUUUUT....',
  '..U..........U..',
  '..U..........U..',
  '..T..........T..',
];
// ≥4 : pauldrons + pointes.
const PAULDRONS: string[] = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '..V..........V..',
  '..VU........UV..',
  '..UU........UU..',
];
const CLASS_PAL: Record<AvatarClassKey, Pal> = {
  warrior: { '#': '#1a0f12', S: '#e8b890', s: '#bd8557', E: '#241016', H: '#7a3326', A: '#7a232e', B: '#b23a44', C: '#e07a72', M: '#9aa3b5', L: '#eaf0fb', W: '#6b4a22' },
  archer:  { '#': '#0e1a12', S: '#e8b890', s: '#bd8557', E: '#14241a', H: '#3a2a18', A: '#2f5d35', B: '#3f8a4a', C: '#7cc77d', M: '#bfa15a', L: '#eedb9a', W: '#6b4a22' },
  mage:    { '#': '#120a1e', S: '#e8b890', s: '#bd8557', E: '#7dd3fc', H: '#caa9d8', A: '#3a2a6a', B: '#5d4aa8', C: '#9a8fe0', M: '#f59e0b', L: '#fde68a', W: '#6b4a22' },
  knight:  { '#': '#0c1018', S: '#e8b890', s: '#bd8557', E: '#2a3550', H: '#8a93a5', A: '#3a4456', B: '#6b7689', C: '#b3bdcd', M: '#9aa3b5', L: '#eaf0fb', W: '#6b4a22' },
};

/** Parse une couleur rgba()/#hex en {r,g,b}. */
function parseColor(c: string): { r: number; g: number; b: number } {
  const m = c.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  const h = c.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function clamp(n: number) { return Math.max(0, Math.min(255, Math.round(n))); }
function shade(c: string, f: number): string {
  const { r, g, b } = parseColor(c);
  if (f >= 0) return `rgb(${clamp(r + (255 - r) * f)},${clamp(g + (255 - g) * f)},${clamp(b + (255 - b) * f)})`;
  const k = 1 + f;
  return `rgb(${clamp(r * k)},${clamp(g * k)},${clamp(b * k)})`;
}

/** Palette TIER dérivée de la couleur de palier (pour les overlays de stade). */
function tierPalette(tier: LevelTier): Pal {
  return { '#': '#0b0a12', T: shade(tier.color, -0.45), U: tier.color, V: shade(tier.color, 0.4), L: '#ffffff' };
}

function drawGrid(ctx: CanvasRenderingContext2D, grid: string[], pal: Pal, scale: number): void {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

export const AVATAR_GRID_W = 16;
export const AVATAR_GRID_H = 24;

interface RenderOpts {
  classKey: AvatarClassKey;
  /** Stade 1..5 (= palier+1). Ignoré en mode bare. */
  stage: number;
  /** Palier courant (teinte des accessoires). Optionnel en mode bare. */
  tier?: LevelTier;
  scale: number;
  /** Sélecteur : corps+coiffe+arme de la classe, sans accessoires de stade. */
  bare?: boolean;
}

/** Dessine l'avatar pixel (corps + classe + accessoires de stade) sur un canvas. */
export function renderAvatarSprite(canvas: HTMLCanvasElement, opts: RenderOpts): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { classKey, stage, tier, scale, bare } = opts;
  canvas.width = AVATAR_GRID_W * scale;
  canvas.height = AVATAR_GRID_H * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cpal = CLASS_PAL[classKey];
  const tpal = tier ? tierPalette(tier) : tierPalette({ color: 'rgba(160,160,170,1)' } as LevelTier);

  // Cape derrière le corps (stade ≥ 3).
  if (!bare && stage >= 3) drawGrid(ctx, CAPE, tpal, scale);

  // Corps + coiffe + arme (palette de classe).
  drawGrid(ctx, BODY, cpal, scale);
  drawGrid(ctx, HEADGEAR[classKey], cpal, scale);
  drawGrid(ctx, WEAPON[classKey], cpal, scale);

  if (!bare) {
    if (stage >= 2) drawGrid(ctx, TRIM, tpal, scale);
    if (stage >= 4) drawGrid(ctx, PAULDRONS, tpal, scale);
  }
}
