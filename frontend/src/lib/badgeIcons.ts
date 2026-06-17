// FitQuest — icônes de badges en pixel art programmatique (Sprint 7D).
// Même esprit que lib/pixelSprites.ts : grilles de chars + palette, rendues sur <canvas>.
// La FORME vient de l'iconType ; la TEINTE vient de la RARETÉ (palette cohérente avec
// lib/levelTier.ts : bronze / argent / or / diamant mappés common/rare/epic/legendary).

import type { BadgeRarity } from '@/types';

// Clés de palette partagées par toutes les grilles :
//   '#' = contour (toujours sombre) · D = ton foncé · M = ton moyen · L = reflet clair.
type IconPalette = { '#': string; D: string; M: string; L: string };

const RARITY_PALETTE: Record<BadgeRarity, IconPalette> = {
  // common → bronze
  common: { '#': '#0b0a12', D: '#6b4a28', M: '#a87850', L: '#d6a878' },
  // rare → argent
  rare: { '#': '#0b0a12', D: '#6f7a8c', M: '#bcc7d6', L: '#e9eff8' },
  // epic → or (cohérent avec --xp)
  epic: { '#': '#0b0a12', D: '#a35a09', M: '#eab308', L: '#fde68a' },
  // legendary → diamant / cyan (cohérent avec le palier Diamant)
  legendary: { '#': '#0b0a12', D: '#0e7490', M: '#22d3ee', L: '#bdf3fb' },
};

// Palette grisée pour les badges verrouillés (silhouette assombrie).
const LOCKED_PALETTE: IconPalette = { '#': '#14151d', D: '#262832', M: '#3a3d4b', L: '#4c5061' };

/** Métadonnées d'affichage par rareté (vitrine + bannière de déblocage). */
export const RARITY_META: Record<BadgeRarity, { fr: string; en: string; color: string; glow: string; order: number }> = {
  common: { fr: 'Commun', en: 'Common', color: 'rgba(205, 155, 115, 1)', glow: 'rgba(168, 120, 80, 0.55)', order: 0 },
  rare: { fr: 'Rare', en: 'Rare', color: 'rgba(188, 199, 214, 1)', glow: 'rgba(120, 145, 180, 0.55)', order: 1 },
  epic: { fr: 'Épique', en: 'Epic', color: 'rgba(234, 179, 8, 1)', glow: 'rgba(234, 179, 8, 0.6)', order: 2 },
  legendary: { fr: 'Légendaire', en: 'Legendary', color: 'rgba(34, 211, 238, 1)', glow: 'rgba(34, 211, 238, 0.65)', order: 3 },
};

// ─── Grilles 13×13 (cols 0-12). '.' = transparent. ───
const ICONS: Record<string, string[]> = {
  boots: [
    '.............',
    '...####......',
    '..#MMMM#.....',
    '..#MLLM#.....',
    '..#MMMM#.....',
    '..#MMMM#.....',
    '..#MMMM#.....',
    '..#MMMM####..',
    '..#MMMMMMMM#.',
    '..#MMMMMMMM#.',
    '..#DDDDDDDD#.',
    '..#DDDDDDDD#.',
    '...########..',
  ],
  medal: [
    '...#.....#...',
    '...#L...L#...',
    '...#L...L#...',
    '....#L.L#....',
    '....#L.L#....',
    '.....###.....',
    '...#######...',
    '..#MMMMMMM#..',
    '.#MMMLLLMMM#.',
    '.#MMLLLLLMM#.',
    '.#MMMLLLMMM#.',
    '..#MMMMMMM#..',
    '...#######...',
  ],
  crown: [
    '.............',
    '.............',
    '#...#...#...#',
    '#L.L#L.L#L.L#',
    '#LLLLLLLLLLL#',
    '#MMMMMMMMMMM#',
    '#MLMMMLMMMLM#',
    '#MMMMMMMMMMM#',
    '#MMMMMMMMMMM#',
    '.###########.',
    '.............',
    '.............',
    '.............',
  ],
  flame: [
    '......#......',
    '......L......',
    '.....#L#.....',
    '.....#L#.....',
    '....#LLL#....',
    '....#MLM#....',
    '...#MMLMM#...',
    '...#MMLMM#...',
    '..#MMMLMMM#..',
    '..#MMLLLMM#..',
    '..#MMMMMMM#..',
    '...#MMMMM#...',
    '....#####....',
  ],
  calendar: [
    '.............',
    '...#.....#...',
    '...#.....#...',
    '.###########.',
    '.#MMMMMMMMM#.',
    '.#LMLMLMLML#.',
    '.#MMMMMMMMM#.',
    '.#MLMLMLMLM#.',
    '.#MMMMMMMMM#.',
    '.#LMLMLMLML#.',
    '.###########.',
    '.............',
    '.............',
  ],
  star: [
    '......#......',
    '......#......',
    '.....#M#.....',
    '.....#L#.....',
    '.###########.',
    '..#MLLLLLM#..',
    '...#MLLLM#...',
    '...#MMLMM#...',
    '..#MM#.#MM#..',
    '..#M#...#M#..',
    '..##.....##..',
    '.............',
    '.............',
  ],
  helm: [
    '.............',
    '...######....',
    '..#MMMMMM#...',
    '.#MMMMMMMM#..',
    '.#MLLLLLLM#..',
    '.#M######M#..',
    '.#M#....#M#..',
    '.#MMMMMMMM#..',
    '.#M######M#..',
    '.#MM#..#MM#..',
    '.#MMMMMMMM#..',
    '..#MMMMMM#...',
    '...######....',
  ],
  crystal: [
    '.............',
    '...#######...',
    '..#MLLLLLM#..',
    '.#MMLLLLLMM#.',
    '#MMMLLLLLMMM#',
    '.#MMMLLLMMM#.',
    '..#MMMLMMM#..',
    '...#MMLMM#...',
    '....#MLM#....',
    '.....#M#.....',
    '......#......',
    '.............',
    '.............',
  ],
  scroll: [
    '.............',
    '..#######....',
    '.#LLLLLLL#...',
    '.#MLLLLLM#...',
    '##LLLLLLL##..',
    '#MLLLLLLLM#..',
    '#MLLLLLLLM#..',
    '##LLLLLLL##..',
    '.#MLLLLLM#...',
    '.#LLLLLLL#...',
    '..#######....',
    '.............',
    '.............',
  ],
  // Appareil photo pixel art : corps + viseur + objectif centré
  camera: [
    '.............',
    '.....###.....',
    '.###########.',
    '.#MMMMMMMMM#.',
    '.#M#######M#.',
    '.#M#MLLLM#M#.',
    '.#M#MLLLM#M#.',
    '.#M#MLLLM#M#.',
    '.#M#######M#.',
    '.#MMMMMMMMM#.',
    '.###########.',
    '.............',
    '.............',
  ],
};

const FALLBACK = 'medal';

/**
 * Dessine l'icône d'un badge sur un canvas, teintée par rareté.
 * @param locked silhouette grisée + assombrie pour les badges non obtenus.
 */
export function renderBadgeIcon(
  canvas: HTMLCanvasElement,
  iconType: string,
  rarity: BadgeRarity,
  scale: number,
  locked = false,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const grid = ICONS[iconType] ?? ICONS[FALLBACK];
  const pal = locked ? LOCKED_PALETTE : RARITY_PALETTE[rarity];
  const w = grid[0].length;
  const h = grid.length;
  canvas.width = w * scale;
  canvas.height = h * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x] as keyof IconPalette;
      if (c === ('.' as keyof IconPalette) || c === (' ' as keyof IconPalette)) continue;
      const col = pal[c];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}
