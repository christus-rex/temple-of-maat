import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  throw new Error('This one-time asset generator requires the sharp package. Install sharp or expose it through NODE_PATH.');
}

const root = process.cwd();
const htmlPath = path.join(root, 'index.html');
const manifestPath = path.join(root, 'scripts', 'v5.1-asset-manifest.json');
const displayRoot = path.join(root, 'assets', 'display');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const seals = manifest.assets.filter((asset) => asset.category === 'seal');
const heroes = manifest.assets.filter((asset) => asset.category === 'hero');
const displayAssets = [...heroes, ...seals];
const previousDisplayBySource = new Map(displayAssets.map((asset) => [asset.path, asset.display?.path]).filter((entry) => entry[1]));
const previousDisplayPaths = new Set(previousDisplayBySource.values());

if (seals.length !== 72 || heroes.length !== 72) throw new Error(`Expected 72 heroes and 72 seals, found ${heroes.length} and ${seals.length}`);
fs.mkdirSync(displayRoot, { recursive: true });

for (const asset of displayAssets) {
  const sourcePath = path.join(root, ...asset.path.split('/'));
  const existingDisplayPath = asset.display?.path ? path.join(root, ...asset.display.path.split('/')) : null;
  if (asset.category === 'seal' && existingDisplayPath && fs.existsSync(existingDisplayPath)) {
    const existingBytes = fs.readFileSync(existingDisplayPath);
    const existingHash = crypto.createHash('sha256').update(existingBytes).digest('hex');
    if (existingHash === asset.display.sha256) continue;
  }
  const pipeline = sharp(sourcePath).resize(
    asset.category === 'seal' ? { width: 512, height: 512, fit: 'contain', withoutEnlargement: true } : { width: 512, withoutEnlargement: true }
  );
  const webp = await pipeline.webp(asset.category === 'seal' ? { lossless: true, effort: 6 } : { quality: 84, effort: 4 }).toBuffer();
  const metadata = await sharp(webp).metadata();
  const sha256 = crypto.createHash('sha256').update(webp).digest('hex');
  const relativePath = `assets/display/${sha256}.webp`;
  const outputPath = path.join(root, ...relativePath.split('/'));
  if (!fs.existsSync(outputPath)) fs.writeFileSync(outputPath, webp);

  asset.display = {
    path: relativePath,
    sha256,
    bytes: webp.length,
    width: metadata.width,
    height: metadata.height
  };
}

const currentDisplayPaths = new Set(displayAssets.map((asset) => asset.display.path));
for (const entry of fs.readdirSync(displayRoot, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const relativePath = `assets/display/${entry.name}`;
  if (currentDisplayPaths.has(relativePath)) continue;
  const stalePath = path.resolve(displayRoot, entry.name);
  if (!stalePath.startsWith(`${path.resolve(displayRoot)}${path.sep}`)) throw new Error(`Refusing to remove unsafe path: ${relativePath}`);
  fs.unlinkSync(stalePath);
}

manifest.displayAssets = {
  purpose: 'high-quality 512px WebP hero and lossless seal renditions for low-memory page display',
  count: displayAssets.length,
  heroes: heroes.length,
  seals: seals.length,
  fullResolutionDownloadsPreserved: true
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

let html = fs.readFileSync(htmlPath, 'utf8');
for (const hero of heroes) {
  const fullReference = `./${hero.path}`;
  const previousReference = previousDisplayBySource.has(hero.path) ? `./${previousDisplayBySource.get(hero.path)}` : null;
  const displayReference = `./${hero.display.path}`;
  if (previousReference && html.includes(previousReference)) html = html.replaceAll(previousReference, displayReference);
  else if (html.includes(fullReference)) html = html.replaceAll(fullReference, displayReference);
  else if (!html.includes(displayReference)) throw new Error(`Could not find hero reference for ${hero.path}`);
}

const sealDisplayMap = Object.fromEntries(seals.map((seal, index) => [String(index + 1).padStart(2, '0'), `./${seal.display.path}`]));
const fullHeroMap = Object.fromEntries(heroes.map((hero, index) => [String(index + 1).padStart(2, '0'), `./${hero.path}`]));
const displayDeclaration = `const PREBUILT_SEAL_DISPLAY_PNGS = ${JSON.stringify(sealDisplayMap)};`;
const heroDeclaration = `window.TEMPLE_FULL_HERO_IMAGES = ${JSON.stringify(fullHeroMap)};`;
const fullDeclaration = /const PREBUILT_SEAL_PNGS = \{[^;]+\};/;
if (!fullDeclaration.test(html)) throw new Error('Could not find the full-resolution seal map');

if (/const PREBUILT_SEAL_DISPLAY_PNGS = \{[^;]+\};/.test(html)) html = html.replace(/const PREBUILT_SEAL_DISPLAY_PNGS = \{[^;]+\};/, displayDeclaration);
else html = html.replace(fullDeclaration, (match) => `${match}\n  ${displayDeclaration}`);

if (/window\.TEMPLE_FULL_HERO_IMAGES = \{[^;]+\};/.test(html)) html = html.replace(/window\.TEMPLE_FULL_HERO_IMAGES = \{[^;]+\};/, heroDeclaration);
else html = html.replace(displayDeclaration, `${displayDeclaration}\n  ${heroDeclaration}`);

fs.writeFileSync(htmlPath, html);
console.log(`Created ${heroes.length} hero and ${seals.length} seal display assets; full-resolution sources remain unchanged.`);
