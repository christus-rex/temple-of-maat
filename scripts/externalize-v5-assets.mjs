import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlPath = path.join(root, 'index.html');
const outputRoot = path.join(root, 'assets', 'embedded');
const manifestPath = path.join(root, 'scripts', 'v5.1-asset-manifest.json');
const shouldWrite = process.argv.includes('--write');
const html = fs.readFileSync(htmlPath, 'utf8');
const dataUrlPattern = /data:image\/(png|webp);base64,([A-Za-z0-9+/=]+)/gi;
const assets = [];
const uniqueAssets = new Map();

function fail(message) {
  throw new Error(message);
}

function dimensions(type, bytes) {
  if (type === 'png') {
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) fail('Invalid PNG payload');
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  if (bytes.length < 30 || bytes.subarray(0, 4).toString('ascii') !== 'RIFF' || bytes.subarray(8, 12).toString('ascii') !== 'WEBP') fail('Invalid WebP payload');
  const format = bytes.subarray(12, 16).toString('ascii');
  if (format === 'VP8X') {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3)
    };
  }
  if (format === 'VP8 ') {
    if (!bytes.subarray(23, 26).equals(Buffer.from([157, 1, 42]))) fail('Invalid lossy WebP frame');
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff
    };
  }
  if (format === 'VP8L') {
    if (bytes[20] !== 47) fail('Invalid lossless WebP frame');
    return {
      width: 1 + ((bytes[21] | (bytes[22] << 8)) & 0x3fff),
      height: 1 + (((bytes[22] >> 6) | (bytes[23] << 2) | (bytes[24] << 10)) & 0x3fff)
    };
  }
  fail(`Unsupported WebP format ${format}`);
}

let match;
while ((match = dataUrlPattern.exec(html))) {
  const type = match[1].toLowerCase();
  const bytes = Buffer.from(match[2], 'base64');
  const before = html[match.index - 1];
  const after = html[dataUrlPattern.lastIndex];
  if (!['\'', '"', '`'].includes(before) || after !== before) fail(`Embedded image ${assets.length + 1} is not a standalone string value`);

  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const relativePath = `assets/embedded/${sha256}.${type}`;
  const size = dimensions(type, bytes);
  const category = type === 'png' ? 'seal' : size.width === 700 ? 'hero' : 'support';
  const asset = {
    occurrence: assets.length + 1,
    type,
    path: relativePath,
    sha256,
    bytes: bytes.length,
    category,
    ...size
  };
  assets.push(asset);
  if (!uniqueAssets.has(relativePath)) uniqueAssets.set(relativePath, { ...asset, bytesBuffer: bytes });
}

if (!assets.length) fail('No embedded images found in index.html');

const counts = assets.reduce((result, asset) => {
  result[asset.type] = (result[asset.type] || 0) + 1;
  return result;
}, {});
const dimensionCounts = assets.reduce((result, asset) => {
  const key = `${asset.type} ${asset.width}x${asset.height}`;
  result[key] = (result[key] || 0) + 1;
  return result;
}, {});
const categoryCounts = assets.reduce((result, asset) => {
  result[asset.category] = (result[asset.category] || 0) + 1;
  return result;
}, {});
if (categoryCounts.hero !== 72 || categoryCounts.seal !== 72 || categoryCounts.support !== 5) {
  fail(`Expected 72 heroes, 72 seals, and 5 support images; found ${JSON.stringify(categoryCounts)}`);
}

if (shouldWrite) {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const [relativePath, asset] of uniqueAssets) {
    const outputPath = path.join(root, ...relativePath.split('/'));
    if (fs.existsSync(outputPath)) {
      const existingHash = crypto.createHash('sha256').update(fs.readFileSync(outputPath)).digest('hex');
      if (existingHash !== asset.sha256) fail(`Existing asset does not match ${relativePath}`);
    } else {
      fs.writeFileSync(outputPath, asset.bytesBuffer);
    }
  }

  let assetIndex = 0;
  const rewrittenHtml = html.replace(dataUrlPattern, () => `./${assets[assetIndex++].path}`);
  if (assetIndex !== assets.length) fail('Not every embedded image was replaced');
  fs.writeFileSync(htmlPath, rewrittenHtml);

  const manifest = {
    version: '5.1.0',
    source: 'Temple v5.0.0 exact release baseline',
    occurrences: assets.length,
    uniqueAssets: uniqueAssets.size,
    counts,
    categories: categoryCounts,
    dimensions: dimensionCounts,
    assets
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(JSON.stringify({
  mode: shouldWrite ? 'write' : 'report',
  occurrences: assets.length,
  uniqueAssets: uniqueAssets.size,
  counts,
  categories: categoryCounts,
  dimensions: dimensionCounts,
  embeddedBytes: assets.reduce((total, asset) => total + asset.bytes, 0)
}, null, 2));
