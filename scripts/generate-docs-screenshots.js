/**
 * generate-docs-screenshots.js
 *
 * Génère les captures d'écran de la documentation utilisateur (page /help).
 * Script Node.js standalone — exécuter depuis la racine du repo :
 *
 *   node scripts/generate-docs-screenshots.js
 *
 * Prérequis :
 *   - L'app front tourne (Vite) sur SCREENSHOTS_BASE_URL.
 *   - Un fichier .env.screenshots existe (voir .env.screenshots.example).
 *   - Puppeteer est installé dans backend/node_modules.
 *
 * Les captures sont enregistrées dans frontend/public/docs/screenshots/
 * sous des noms qui correspondent aux placeholders ![](docs/screenshots/xxx.png)
 * insérés dans help.fr.md / help.en.md.
 */

const path = require('path');
const fs = require('fs');

// Résolution robuste : sur l'hôte les modules vivent dans backend/node_modules ;
// dans le conteneur backend ils sont résolus normalement (WORKDIR /app).
function loadModule(name) {
  try {
    return require(`../backend/node_modules/${name}`);
  } catch {
    return require(name);
  }
}

const puppeteer = loadModule('puppeteer');

// Charge les variables d'environnement depuis .env.screenshots (à la racine).
// Sans effet si le fichier est absent (cas conteneur où l'env est passé via -e).
loadModule('dotenv').config({
  path: path.resolve(__dirname, '..', '.env.screenshots'),
});

const BASE_URL = process.env.SCREENSHOTS_BASE_URL || 'http://localhost:5173';
const EMAIL = process.env.SCREENSHOTS_EMAIL;
const PASSWORD = process.env.SCREENSHOTS_PASSWORD;
const EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH;

// Dossier de sortie : surchargeable via SCREENSHOTS_OUT_DIR (utile en conteneur,
// où l'on monte le dossier public de l'hôte sur un point de montage dédié).
const OUTPUT_DIR =
  process.env.SCREENSHOTS_OUT_DIR ||
  path.resolve(__dirname, '..', 'frontend', 'public', 'docs', 'screenshots');

// Chaque capture illustre l'écran RÉEL de l'app correspondant à une section de
// l'aide. Les noms de fichiers doivent rester alignés avec les placeholders
// ![](docs/screenshots/xxx.png) insérés dans help.fr.md / help.en.md.
// Pages atteignables par simple navigation. (La section « Séances » /
// workouts.png est un cas à part : l'écran de combat n'existe que pendant une
// séance, on le génère via captureWorkout ci-dessous.)
const PAGES = [
  { file: 'dashboard.png', path: '/' },
  { file: 'programs.png', path: '/workout' },
  { file: 'body.png', path: '/body' },
  { file: 'profile.png', path: '/profile' },
  { file: 'settings.png', path: '/settings' },
  { file: 'gamification.png', path: '/trophees' },
];

// Capture l'écran de combat (séance en cours). On reproduit le parcours UI :
// liste des programmes → ouvrir le 1er programme → lancer la séance. Les
// sélecteurs ciblent les icônes Lucide (lucide-chevron-right / lucide-swords),
// indépendants de la langue. `start()` est purement client (aucune donnée créée
// côté serveur tant qu'on ne valide pas la séance).
async function captureWorkout(page, baseUrl, outDir) {
  await page.goto(`${baseUrl}/workout`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('button:has(svg.lucide-chevron-right)', { timeout: 15000 });
  await page.click('button:has(svg.lucide-chevron-right)');
  await page.waitForSelector('button:has(svg.lucide-swords)', { timeout: 15000 });
  await page.click('button:has(svg.lucide-swords)');
  await page.waitForFunction(() => window.location.pathname === '/workout/active', {
    timeout: 15000,
  });
  // Laisse le temps au rendu du canvas (boss pixel art) et des animations.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.screenshot({ path: path.join(outDir, 'workouts.png') });
  console.log('✓ workouts.png  (/workout/active)');
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'SCREENSHOTS_EMAIL et SCREENSHOTS_PASSWORD doivent être définis dans .env.screenshots',
    );
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

    // --- Connexion ---
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[autocomplete="username"]');
    await page.type('input[autocomplete="username"]', EMAIL);
    await page.type('input[type="password"]', PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]'),
    ]);

    // --- Capture de chaque écran réel ---
    for (const { file, path: route } of PAGES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2' });
      // Laisse le temps aux rendus asynchrones (graphes Recharts, canvas pixel
      // art, requêtes de données) de se stabiliser avant la capture.
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Capture du viewport (haut de page) : un cadrage propre et lisible de
      // l'écran tel qu'il s'affiche au chargement.
      await page.screenshot({ path: path.join(OUTPUT_DIR, file) });
      console.log(`✓ ${file}  (${route})`);
    }

    // Écran de combat (section « Séances »).
    await captureWorkout(page, BASE_URL, OUTPUT_DIR);
  } finally {
    await browser.close();
  }
}

main()
  .then(() => {
    console.log('Captures générées avec succès.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Échec de la génération des captures :', err.message);
    process.exit(1);
  });
