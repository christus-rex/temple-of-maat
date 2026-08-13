import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const baselinePath = path.join(root, 'scripts', 'v5-release-baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const strictBaseline = process.argv.includes('--release-baseline');
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

if (strictBaseline) {
  if (version.version !== baseline.version) fail(`Release baseline expects version ${baseline.version}, found ${version.version}`);
  for (const [type, expected] of Object.entries(baseline.embeddedImages)) {
    if (imageCounts[type] !== expected) fail(`Release baseline expects ${expected} embedded ${type} images, found ${imageCounts[type]}`);
  }
  for (const [relativePath, expectedHash] of Object.entries(baseline.files)) {
    const actualHash = sha256(relativePath);
    if (actualHash !== expectedHash) fail(`Release baseline hash mismatch for ${relativePath}: ${actualHash}`);
  }
}

console.log(`Validated Temple ${version.version}: ${chambers.length} chambers, ${scripts.length} inline scripts, ${imageCounts.png} PNG and ${imageCounts.webp} WebP payloads${strictBaseline ? ', exact release baseline' : ''}.`);
