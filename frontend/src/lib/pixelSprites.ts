// FitQuest — sprites pixel art du mode séance (Sprint 6).
// Données encodées en grilles de caractères + palette, rendues sur <canvas>.
// (À terme remplaçables par de vrais sprite sheets PNG via packs — cf. mockups.)

export interface Sprite {
  grid: string[];
  pal: Record<string, string>;
}

export type BossKey = 'golem' | 'demon' | 'spectre';
export type WeaponKey = 'epee' | 'hache' | 'lance';

export interface BossDef {
  name: string;
  sprite: Sprite;
  cracks: [number, number][];
}

export const BOSSES: Record<BossKey, BossDef> = {
  golem: {
    name: 'GOLEM DE PIERRE',
    sprite: {
      grid: [
        '......HH..HH......',
        '.....HhH..HhH.....',
        '....#sH....Hs#....',
        '...#SSSssssSSS#...',
        '..#SSSSSSSSSSSS#..',
        '..#SSSSSSSSSSSS#..',
        '.#SSKKKSSSSKKKSS#.',
        '.#SKEEKSSSSKEEKS#.',
        '.#SKEEKSSSSKEEKS#.',
        '.#SSKKKSSSSKKKSS#.',
        '.#SSSSSSooSSSSSS#.',
        '..#SSSSoooSSSSS#..',
        '..#SSSdFFFFdSSS#..',
        '...#SSFmFFmFSS#...',
        '...#sSFFFFFFSs#...',
        '....#ssdddss#.....',
        '.....#sd..ds#.....',
        '......##....##....',
      ],
      pal: { '#': '#0c0a12', S: '#5d5870', s: '#3c384a', K: '#120f1a', E: '#ff5a5a', o: '#3c384a', F: '#e9e6f2', m: '#0c0a12', H: '#2a2433', h: '#4a4256', d: '#46415a' },
    },
    cracks: [[8, 5], [7, 6], [9, 7], [6, 10], [10, 11], [8, 12], [5, 8], [11, 8], [7, 13], [9, 14], [8, 9], [6, 5], [11, 12]],
  },
  demon: {
    name: 'DÉMON DES BRAISES',
    sprite: {
      grid: [
        '.H.............H.',
        'HH.............HH',
        '.HH...........HH.',
        '..HH.........HH..',
        '...HH.......HH...',
        '...#DDDDDDDDD#...',
        '..#DDDDDDDDDDD#..',
        '..#DDDDDDDDDDD#..',
        '.#DDEEDDDDDEEDD#.',
        '.#DDEEDDDDDEEDD#.',
        '.#DDDDDDDDDDDDD#.',
        '..#DDDDDDDDDDD#..',
        '..#DDDmmmmmDDD#..',
        '..#DDmFmFmFmDD#..',
        '...#DDmmmmmDD#...',
        '...#dDDDDDDDd#...',
        '....#dDDDDDd#....',
        '.....#ddddd#.....',
      ],
      pal: { '#': '#1a0a08', D: '#8f2f28', d: '#5a1a16', l: '#c0463a', E: '#ffd24a', H: '#e8dab2', h: '#b59a68', F: '#fff3e0', m: '#240a08' },
    },
    cracks: [[8, 6], [7, 8], [10, 9], [6, 11], [11, 7], [8, 10], [5, 9], [12, 12], [9, 13], [7, 15], [8, 7], [10, 11], [6, 8]],
  },
  spectre: {
    name: 'SPECTRE DU VIDE',
    sprite: {
      grid: [
        '.....#######.....',
        '...##BBBBBBB##...',
        '..#BBBBBBBBBBB#..',
        '.#BBBBBBBBBBBBB#.',
        '.#BBBBBBBBBBBBB#.',
        '#BBBBBBBBBBBBBBB#',
        '#BBKKKBBBBBKKKBB#',
        '#BBKEKBBBBBKEKBB#',
        '#BBKKKBBBBBKKKBB#',
        '#BBBBBBBoBBBBBBB#',
        '.#BBBBBoooBBBBB#.',
        '.#BBBBBoooBBBBB#.',
        '..#BBBBBBBBBBB#..',
        '..#BFBFBFBFBFB#..',
        '...#BBBBBBBBB#...',
        '....#BFBFBF#.....',
        '.....#BBBBB#.....',
        '......#####......',
      ],
      pal: { '#': '#0a0814', B: '#c8c0e0', b: '#8f86a8', K: '#0e0a1e', E: '#7dd3fc', o: '#0e0a1e', F: '#e8e2f6' },
    },
    cracks: [[8, 3], [6, 5], [10, 6], [8, 9], [5, 11], [11, 11], [7, 13], [9, 14], [8, 15], [6, 7], [10, 8], [8, 4], [11, 12]],
  },
};

const WPAL: Record<string, string> = { '#': '#0c0a12', M: '#b9c2d6', L: '#e6ecf7', m: '#6b7280', G: '#8b5a2b', W: '#5b3a1c' };
const LANCE_PAL: Record<string, string> = { '#': '#0c0a12', M: '#cbd5e6', L: '#eef3fb', W: '#6b4a22' };

export interface WeaponDef {
  name: string;
  sprite: Sprite;
  scale: number;
}

export const WEAPONS: Record<WeaponKey, WeaponDef> = {
  epee: {
    name: 'ÉPÉE',
    scale: 7,
    sprite: {
      grid: ['...#...', '..#M#..', '..#M#..', '..#L#..', '..#M#..', '..#L#..', '..#M#..', '.#GGG#.', '..#W#..', '..#W#..', '..#G#..'],
      pal: WPAL,
    },
  },
  hache: {
    name: 'HACHE',
    scale: 6,
    sprite: {
      grid: ['...#L#...', '..#MWL#..', '.#MMMWLL#', '#MMMMMWL#', '#MMMMMWL#', '.#MMMWLL#', '..#MWL#..', '...#W#...', '...#W#...', '...#W#...', '...#W#...', '..#mWm#..', '...##....'],
      pal: WPAL,
    },
  },
  lance: {
    name: 'LANCE',
    scale: 6,
    sprite: {
      grid: ['..#..', '..#..', '.#L#.', '#MLM#', '.#L#.', '.#L#.', '..#..', '..W..', '..W..', '..W..', '..W..', '..W..', '..W..', '..W..', '.#W#.', '..#..'],
      pal: LANCE_PAL,
    },
  },
};

export const SHIELD: Sprite = {
  grid: ['.########.', '#GGGGGGGG#', '#GIIIIIIG#', '#GIllIIIG#', '#GIICCIIG#', '#GIICCIIG#', '#GIlIIIIG#', '.#GIIIIG#.', '..#GIIG#..', '...#GG#...', '....##....'],
  pal: { '#': '#0c0a12', G: '#8b5a2b', I: '#9aa3b5', C: '#f59e0b', l: '#cdd4e2' },
};

// ─── Forge (écran de repos) : enclume + marteau pixel ───
export const ANVIL: Sprite = {
  grid: [
    '...########....',
    '..#MMMMMMMM#...',
    '#MMMMMMMMMMMM#.',
    '#MMMMMMMMMMMM##',
    '.#mmmmmmmmmm#..',
    '....#MMMM#.....',
    '....#MMMM#.....',
    '...#mmmmmm#....',
    '..#MMMMMMMM#...',
    '.#PPPPPPPPPP#..',
    '.#PPPPPPPPPP#..',
    '.#mmmmmmmmmm#..',
  ],
  pal: { '#': '#08070c', M: '#4a505e', m: '#2c303a', P: '#3a3f4b' },
};

export const HAMMER: Sprite = {
  grid: [
    '.######..',
    '#HHHHHH#.',
    '#HHHHHH#.',
    '#HHHHHH#.',
    '.##WW##..',
    '...WW....',
    '...WW....',
    '...WW....',
    '...WW....',
    '..#WW#...',
  ],
  pal: { '#': '#08070c', H: '#6b7280', W: '#8b5a2b' },
};

/** Dessine un sprite (grille + palette) sur un canvas, à l'échelle indiquée. */
export function drawSprite(canvas: HTMLCanvasElement, sprite: Sprite, scale: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = sprite.grid[0].length;
  const h = sprite.grid.length;
  canvas.width = w * scale;
  canvas.height = h * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < h; y++) {
    const row = sprite.grid[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === ' ' || c === '.') continue;
      const col = sprite.pal[c];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
}

/** Dessine le boss avec dégradation (fissures + teinte de blessure) selon la fraction de PV. */
export function renderBoss(canvas: HTMLCanvasElement, key: BossKey, hpFrac: number, scale: number): void {
  const boss = BOSSES[key];
  drawSprite(canvas, boss.sprite, scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dmg = 1 - Math.max(0, Math.min(1, hpFrac));
  const n = Math.floor(dmg * boss.cracks.length);
  ctx.fillStyle = 'rgba(0,0,0,.85)';
  for (let i = 0; i < n; i++) {
    const [x, y] = boss.cracks[i];
    ctx.fillRect(x * scale, y * scale, Math.max(1, scale * 0.7), scale);
    ctx.fillRect(x * scale, (y + 1) * scale, Math.max(1, scale * 0.5), scale);
  }
  if (dmg > 0) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(190,30,30,${(dmg * 0.3).toFixed(2)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(0,0,0,${(dmg * 0.18).toFixed(2)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }
}
