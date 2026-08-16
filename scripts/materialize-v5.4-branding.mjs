import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = process.cwd();
const sourceDir = path.join(root, '.brand-source', 'v5.4');
const brandingDir = path.join(root, 'assets', 'branding');
const expectedSha256 = '8b669c4237f7839e6180386a3b53408bedde4c7eaa6d4417e69836a9f8d9aaf0';

const parts = fs.readdirSync(sourceDir)
  .filter((name) => /^logo\.part\d+\.b64$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (parts.length !== 10) {
  throw new Error(`Expected 10 canonical logo source parts; found ${parts.length}`);
}

const encoded = parts.map((name) => fs.readFileSync(path.join(sourceDir, name), 'utf8').trim()).join('');
const source = Buffer.from(encoded, 'base64');
const digest = crypto.createHash('sha256').update(source).digest('hex');
if (digest !== expectedSha256) {
  throw new Error(`Canonical logo checksum mismatch: ${digest}`);
}
if (source.subarray(0, 4).toString('ascii') !== 'RIFF' || source.subarray(8, 12).toString('ascii') !== 'WEBP') {
  throw new Error('Canonical logo source is not a WEBP RIFF image');
}

fs.mkdirSync(brandingDir, { recursive: true });

const canonicalVersioned = path.join(brandingDir, 'temple-global-logo-v5.4.webp');
const canonicalCompat = path.join(brandingDir, 'temple-global-logo.webp');
fs.writeFileSync(canonicalVersioned, source);
fs.writeFileSync(canonicalCompat, source);

const metadata = await sharp(source).metadata();
if (metadata.width !== 448 || metadata.height !== 448) {
  throw new Error(`Unexpected canonical logo dimensions: ${metadata.width}x${metadata.height}`);
}

// App/header derivatives are technical crops of the approved uploaded artwork only.
// No alternate/generated emblem is introduced. The crop removes the lower wordmark
// so the sacred mark remains legible at launcher and navigation sizes.
const markCrop = { left: 0, top: 0, width: 448, height: 345 };
const navy = { r: 7, g: 16, b: 25, alpha: 1 };

await sharp(source)
  .extract(markCrop)
  .resize({ width: 640, withoutEnlargement: false })
  .webp({ quality: 86 })
  .toFile(path.join(brandingDir, 'temple-brand-mark-v5.4.webp'));

async function writeIcon(size, output, safe = false) {
  const inner = safe ? Math.round(size * 0.76) : Math.round(size * 0.92);
  const mark = await sharp(source)
    .extract(markCrop)
    .resize({ width: inner, height: inner, fit: 'contain', background: navy })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: navy }
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);
}

await writeIcon(192, path.join(root, 'icon-192.png'));
await writeIcon(512, path.join(root, 'icon-512.png'));
await writeIcon(512, path.join(root, 'icon-maskable-512.png'), true);
await writeIcon(180, path.join(root, 'apple-touch-icon.png'));

await writeIcon(192, path.join(brandingDir, 'temple-app-icon-192-v5.4.png'));
await writeIcon(512, path.join(brandingDir, 'temple-app-icon-512-v5.4.png'));
await writeIcon(512, path.join(brandingDir, 'temple-app-icon-maskable-512-v5.4.png'), true);
await writeIcon(180, path.join(brandingDir, 'temple-app-icon-180-v5.4.png'));

console.log(JSON.stringify({
  ok: true,
  sourceParts: parts.length,
  sourceBytes: source.length,
  sourceSha256: digest,
  sourceDimensions: `${metadata.width}x${metadata.height}`,
  canonical: 'assets/branding/temple-global-logo-v5.4.webp',
  compatibility: 'assets/branding/temple-global-logo.webp',
  brandMark: 'assets/branding/temple-brand-mark-v5.4.webp',
  icons: [
    'icon-192.png',
    'icon-512.png',
    'icon-maskable-512.png',
    'apple-touch-icon.png',
    'assets/branding/temple-app-icon-192-v5.4.png',
    'assets/branding/temple-app-icon-512-v5.4.png',
    'assets/branding/temple-app-icon-maskable-512-v5.4.png',
    'assets/branding/temple-app-icon-180-v5.4.png'
  ]
}, null, 2));
