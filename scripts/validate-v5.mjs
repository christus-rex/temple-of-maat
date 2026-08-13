import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const baselinePath = path.join(root, 'scripts', 'v5-release-baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const strictBaseline = process.argv.includes('--release-baseline');
const verifyRelease = process.argv.includes('--release');
const textExtensions = new Set(['.html', '.json', '.js', '.md', '.webmanifest']);

function fail(message) {
  throw new Error(message);
}

function filePath(relativePath) {
  return path.join(root, ...relativePath.split('/'));
}

function normalizedBytes(relativePath) {
  const bytes = fs.readFileSync(filePath(relativePath));
  if (!textExtensions.has(path.extname(relativePath).toLowerCase())) return bytes;
  return Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
}

function sha256(relativePath) {
  return crypto.createHash('sha256').update(normalizedBytes(relativePath)).digest('hex').toUpperCase();
}

function rawSha256(relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath(relativePath))).digest('hex').toLowerCase();
}

function imageDimensions(type, bytes) {
  if (type === 'png') {
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) fail('Invalid PNG asset');
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length < 30 || bytes.subarray(0, 4).toString('ascii') !== 'RIFF' || bytes.subarray(8, 12).toString('ascii') !== 'WEBP') fail('Invalid WebP asset');
  const format = bytes.subarray(12, 16).toString('ascii');
  if (format === 'VP8X') return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  if (format === 'VP8 ') {
    if (!bytes.subarray(23, 26).equals(Buffer.from([157, 1, 42]))) fail('Invalid lossy WebP asset');
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (format === 'VP8L') {
    if (bytes[20] !== 47) fail('Invalid lossless WebP asset');
    return {
      width: 1 + ((bytes[21] | (bytes[22] << 8)) & 0x3fff),
      height: 1 + (((bytes[22] >> 6) | (bytes[23] << 2) | (bytes[24] << 10)) & 0x3fff)
    };
  }
  fail(`Unsupported WebP format ${format}`);
}

for (const relativePath of Object.keys(baseline.files)) {
  if (!fs.existsSync(filePath(relativePath))) fail(`Missing required v5 file: ${relativePath}`);
}

const version = JSON.parse(fs.readFileSync(filePath('version.json'), 'utf8'));
if (!/^5\./.test(String(version.version))) fail(`Expected a v5 release, found ${version.version}`);

const manifest = JSON.parse(fs.readFileSync(filePath('manifest.webmanifest'), 'utf8'));
if (manifest.start_url !== './' || manifest.scope !== './') fail('Manifest must retain GitHub Pages-safe ./ start_url and scope');
for (const icon of manifest.icons || []) {
  const relativePath = String(icon.src || '').replace(/^\.\//, '');
  if (!relativePath || !fs.existsSync(filePath(relativePath))) fail(`Manifest references a missing icon: ${icon.src}`);
}

const chamberData = JSON.parse(fs.readFileSync(filePath('chambers.json'), 'utf8'));
const chambers = chamberData.chambers;
if (!Array.isArray(chambers) || chambers.length !== baseline.chambers) fail(`Expected ${baseline.chambers} chambers, found ${chambers?.length}`);
const ids = new Set(chambers.map((chamber) => chamber.id));
if (ids.size !== chambers.length) fail('Chamber IDs are not unique');

const serviceWorker = fs.readFileSync(filePath('sw.js'), 'utf8');
if (!serviceWorker.includes('temple-maat-pwa-v5')) fail('Service worker cache namespace is not v5');
const serviceWorkerAssets = [...serviceWorker.matchAll(/['"]\.\/([^'"]+)['"]/g)].map((match) => match[1]);
for (const relativePath of serviceWorkerAssets) {
  if (!fs.existsSync(filePath(relativePath))) fail(`Service worker references a missing asset: ${relativePath}`);
}

const html = fs.readFileSync(filePath('index.html'), 'utf8');
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
for (const [index, match] of scripts.entries()) {
  const attributes = match[1];
  if (/\bsrc\s*=/.test(attributes) || /application\/ld\+json|importmap/i.test(attributes)) continue;
  try {
    new vm.Script(match[2], { filename: `index.html:inline-script-${index}` });
  } catch (error) {
    fail(`Inline script ${index} does not parse: ${error.message}`);
  }
}

const embeddedImages = [...html.matchAll(/data:image\/(png|webp);base64,([A-Za-z0-9+/=]+)/gi)];
const imageCounts = { png: 0, webp: 0 };
for (const match of embeddedImages) {
  const type = match[1].toLowerCase();
  const bytes = Buffer.from(match[2], 'base64');
  const validPng = type === 'png' && bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const validWebp = type === 'webp' && bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!validPng && !validWebp) fail(`Invalid embedded ${type} image at index ${imageCounts.png + imageCounts.webp}`);
  imageCounts[type] += 1;
}

const releaseBaseline = strictBaseline || (verifyRelease && version.version === baseline.version);
if (releaseBaseline) {
  if (version.version !== baseline.version) fail(`Release baseline expects version ${baseline.version}, found ${version.version}`);
  for (const [type, expected] of Object.entries(baseline.embeddedImages)) {
    if (imageCounts[type] !== expected) fail(`Release baseline expects ${expected} embedded ${type} images, found ${imageCounts[type]}`);
  }
  for (const [relativePath, expectedHash] of Object.entries(baseline.files)) {
    const actualHash = sha256(relativePath);
    if (actualHash !== expectedHash) fail(`Release baseline hash mismatch for ${relativePath}: ${actualHash}`);
  }
}

let externalAssetSummary = '';
if (version.version === '5.1.0') {
  const assetManifestPath = 'scripts/v5.1-asset-manifest.json';
  if (!fs.existsSync(filePath(assetManifestPath))) fail('Missing v5.1 asset manifest');
  const assetManifest = JSON.parse(fs.readFileSync(filePath(assetManifestPath), 'utf8'));
  if (!Array.isArray(assetManifest.assets) || assetManifest.assets.length !== 149) fail(`Expected 149 v5.1 assets, found ${assetManifest.assets?.length}`);
  if (embeddedImages.length !== 0) fail(`v5.1 must not retain embedded image payloads; found ${embeddedImages.length}`);
  if ((html.match(/loading:"lazy",decoding:"async"/g) || []).length !== 6) fail('React image loading declarations are not optimized');
  if ((html.match(/loading:"eager",decoding:"async"/g) || []).length !== 1) fail('The primary hero image declaration is not optimized');
  if ((html.match(/decoding:"async"/g) || []).length !== 7) fail('Unexpected duplicate or missing async image decoding declarations');
  if ((html.match(/img\.loading='lazy'; img\.decoding='async';/g) || []).length !== 1) fail('Prebuilt seal images are not lazy-loaded');
  if ((html.match(/alt="\$\{escapeHtml\(info\.name\)\}" loading="lazy" decoding="async"/g) || []).length !== 1) fail('Codex hero thumbnails are not lazy-loaded');
  if ((html.match(/alt="Seal of \$\{escapeHtml\(info\.name\)\}" loading="lazy" decoding="async"/g) || []).length !== 2) fail('Seal-library thumbnails are not lazy-loaded');

  const categoryCounts = { hero: 0, seal: 0, support: 0 };
  const manifestPaths = new Set();
  const displayPaths = new Set();
  for (const asset of assetManifest.assets) {
    if (!/^assets\/embedded\/[a-f0-9]{64}\.(png|webp)$/.test(asset.path)) fail(`Unsafe or invalid asset path: ${asset.path}`);
    if (manifestPaths.has(asset.path)) fail(`Duplicate asset path in manifest: ${asset.path}`);
    manifestPaths.add(asset.path);
    if (!fs.existsSync(filePath(asset.path))) fail(`Missing external asset: ${asset.path}`);
    if (rawSha256(asset.path) !== asset.sha256) fail(`Asset hash mismatch: ${asset.path}`);
    const bytes = fs.readFileSync(filePath(asset.path));
    const size = imageDimensions(asset.type, bytes);
    if (size.width !== asset.width || size.height !== asset.height || bytes.length !== asset.bytes) fail(`Asset metadata mismatch: ${asset.path}`);
    if (!(asset.category in categoryCounts)) fail(`Unknown asset category: ${asset.category}`);
    categoryCounts[asset.category] += 1;
    if (asset.category === 'seal' || asset.category === 'hero') {
      const display = asset.display;
      if (!display || !/^assets\/display\/[a-f0-9]{64}\.webp$/.test(display.path)) fail(`Missing or invalid display rendition for ${asset.path}`);
      if (displayPaths.has(display.path)) fail(`Duplicate display asset: ${display.path}`);
      displayPaths.add(display.path);
      if (!fs.existsSync(filePath(display.path))) fail(`Missing display asset: ${display.path}`);
      if (rawSha256(display.path) !== display.sha256) fail(`Display asset hash mismatch: ${display.path}`);
      const displayBytes = fs.readFileSync(filePath(display.path));
      const displaySize = imageDimensions('webp', displayBytes);
      if (displaySize.width !== display.width || displaySize.height !== display.height || display.width !== 512 || display.bytes !== displayBytes.length) fail(`Display asset metadata mismatch: ${display.path}`);
      if (asset.category === 'seal' && display.height !== 512) fail(`Seal display asset is not square: ${display.path}`);
    }
  }

  const expectedCategories = { hero: 72, seal: 72, support: 5 };
  for (const [category, expected] of Object.entries(expectedCategories)) {
    if (categoryCounts[category] !== expected) fail(`Expected ${expected} ${category} assets, found ${categoryCounts[category]}`);
  }

  const referencedPaths = [...html.matchAll(/\.\/(assets\/embedded\/[a-f0-9]{64}\.(?:png|webp))/g)].map((match) => match[1]);
  if (referencedPaths.length !== manifestPaths.size || new Set(referencedPaths).size !== manifestPaths.size) fail('External asset references are missing or duplicated in index.html');
  for (const relativePath of referencedPaths) {
    if (!manifestPaths.has(relativePath)) fail(`index.html references an untracked asset: ${relativePath}`);
  }
  const referencedDisplayPaths = [...html.matchAll(/\.\/(assets\/display\/[a-f0-9]{64}\.webp)/g)].map((match) => match[1]);
  if (displayPaths.size !== 144 || referencedDisplayPaths.length !== 144 || new Set(referencedDisplayPaths).size !== 144) fail('Expected 144 unique hero and seal display references');
  for (const relativePath of referencedDisplayPaths) {
    if (!displayPaths.has(relativePath)) fail(`index.html references an untracked display asset: ${relativePath}`);
  }
  if (!html.includes('const url=PREBUILT_SEAL_PNGS[num]')) fail('Seal downloads are not using full-resolution source assets');
  if (!html.includes('const data=PREBUILT_SEAL_DISPLAY_PNGS[num]')) fail('Visible seal plates are not using display renditions');
  if (!html.includes('window.TEMPLE_FULL_HERO_IMAGES?.[info.num] || info.imgSrc')) fail('Collectible exports are not using full-resolution hero assets');
  if (!serviceWorker.includes('temple-maat-pwa-v5.1')) fail('Service worker cache namespace is not v5.1');
  if (!serviceWorker.includes("fetch('./scripts/v5.1-asset-manifest.json'")) fail('Service worker does not load the v5.1 display-asset manifest for offline caching');
  if (!serviceWorker.includes("asset.category === 'support'") || !serviceWorker.includes("asset.display?.path")) fail('Service worker does not preserve complete offline display imagery');
  externalAssetSummary = `, ${categoryCounts.hero} heroes, ${categoryCounts.seal} seals, ${categoryCounts.support} support images`;
} else if (verifyRelease && !releaseBaseline) {
  fail(`No release validator is defined for version ${version.version}`);
}

console.log(`Validated Temple ${version.version}: ${chambers.length} chambers, ${scripts.length} inline scripts, ${imageCounts.png} PNG and ${imageCounts.webp} WebP payloads${externalAssetSummary}${releaseBaseline ? ', exact release baseline' : ''}.`);
