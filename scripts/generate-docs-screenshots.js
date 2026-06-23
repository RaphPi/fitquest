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

// Ordre des sections tel qu'il apparaît dans les fichiers Markdown (les <h2>).
// Doit rester aligné avec les placeholders ![](docs/screenshots/xxx.png).
const SECTION_FILES = [
  'dashboard.png',
  'programs.png',
  'workouts.png',
  'body.png',
  'profile.png',
  'settings.png',
  'gamification.png',
];

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

    // --- Page d'aide ---
    await page.goto(`${BASE_URL}/help`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('h2');

    const sections = await page.$$('h2');
    if (sections.length < SECTION_FILES.length) {
      throw new Error(
        `Attendu ${SECTION_FILES.length} sections <h2>, trouvé ${sections.length}. ` +
          'La page /help a-t-elle bien chargé le Markdown ?',
      );
    }

    for (let i = 0; i < SECTION_FILES.length; i += 1) {
      const handle = sections[i];
      await handle.evaluate((el) =>
        el.scrollIntoView({ block: 'start', behavior: 'instant' }),
      );
      // Laisse le temps au scroll / lazy-render de se stabiliser.
      await new Promise((resolve) => setTimeout(resolve, 300));

      const filePath = path.join(OUTPUT_DIR, SECTION_FILES[i]);
      await page.screenshot({ path: filePath });
      console.log(`✓ ${SECTION_FILES[i]}`);
    }
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
