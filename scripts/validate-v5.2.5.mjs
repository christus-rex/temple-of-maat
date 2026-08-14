import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };
const atLeast = (actual, minimum) => {
  const left = String(actual).split('.').map(Number);
  const right = String(minimum).split('.').map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const a = left[index] || 0;
    const b = right[index] || 0;
    if (a !== b) return a > b;
  }
  return true;
};

const version = JSON.parse(fs.readFileSync(file('version.json'), 'utf8'));
if (!atLeast(version.version, '5.2.5')) fail(`Living Temple invariants require Temple >= 5.2.5, found ${version.version}`);

const required = [
  'scripts/v5.2.4-living-codex.js',
  'scripts/v5.2.5-living-temple.js',
  'scripts/v5.2.5-media-vault.js',
  'styles/v5.2.5-living-temple.css',
  'assets/audio/maat-forty-two-declarations.json',
  'scripts/v5.3-threshold.js',
  'sw.js'
];
required.forEach((relative) => {
  if (!fs.existsSync(file(relative))) fail(`Missing v5.2.5 release file: ${relative}`);
});

const livingCodex = fs.readFileSync(file('scripts/v5.2.4-living-codex.js'), 'utf8');
const livingTemple = fs.readFileSync(file('scripts/v5.2.5-living-temple.js'), 'utf8');
const mediaVault = fs.readFileSync(file('scripts/v5.2.5-media-vault.js'), 'utf8');
const css = fs.readFileSync(file('styles/v5.2.5-living-temple.css'), 'utf8');
const threshold = fs.readFileSync(file('scripts/v5.3-threshold.js'), 'utf8');
const sw = fs.readFileSync(file('sw.js'), 'utf8');
const audioMeta = JSON.parse(fs.readFileSync(file('assets/audio/maat-forty-two-declarations.json'), 'utf8'));

for (const [name, source] of [
  ['Living Codex', livingCodex],
  ['Living Temple', livingTemple],
  ['Media Vault', mediaVault],
  ['Threshold', threshold]
]) {
  try { new vm.Script(source, { filename: name }); }
  catch (error) { fail(`${name} JavaScript does not parse: ${error.message}`); }
}

// Carry forward the v5.2.4 source-integrity invariants.
const rawMatch = livingCodex.match(/const RAW = `([\s\S]*?)`;/);
if (!rawMatch) fail('Living Codex 72-record source table is missing');
const rows = rawMatch[1].trim().split('\n');
if (rows.length !== 72) fail(`Expected 72 Living Codex records, found ${rows.length}`);
const codexRecords = rows.map((row, index) => {
  const fields = row.split('|');
  if (fields.length !== 15) fail(`Living Codex record ${index + 1} has ${fields.length} fields instead of 15`);
  return { id: fields[0], hebrew: fields[1], angel: fields[5], daemon: fields[10], strength: fields[11] };
});
for (let index = 0; index < 72; index += 1) {
  const expected = String(index + 1).padStart(2, '0');
  if (codexRecords[index].id !== expected) fail(`Expected Codex record ${expected}, found ${codexRecords[index].id}`);
  if (!codexRecords[index].hebrew || !codexRecords[index].angel || !codexRecords[index].daemon) fail(`Codex record ${expected} is incomplete`);
}
const strengthCounts = codexRecords.reduce((counts, item) => {
  counts[item.strength] = (counts[item.strength] || 0) + 1;
  return counts;
}, {});
const expectedStrengths = { 'Single exact': 24, 'Double match': 32, 'Triple lock': 13, 'Tetrad exact': 3 };
for (const [strength, expected] of Object.entries(expectedStrengths)) {
  if (strengthCounts[strength] !== expected) fail(`Expected ${expected} ${strength} records, found ${strengthCounts[strength] || 0}`);
}
const tetrads = codexRecords.filter((item) => item.strength === 'Tetrad exact').map((item) => item.id).join(',');
if (tetrads !== '13,37,42') fail(`Expected tetrad-exact records 13,37,42, found ${tetrads}`);
for (const selector of ['.tm2-wallpaper', '.tm2-parental-download', '.tm2-plate-download']) {
  if (!livingCodex.includes(selector)) fail(`Living Codex collectible relay disappeared: ${selector}`);
}
for (const marker of [
  'Reversal, not gematria, creates the 72.',
  'numerical correspondences, not claims of historical or metaphysical identity',
  'Hebrew triplet · Layer B',
  'Gematria twin · later analytical layer',
  'Temple chamber layer'
]) {
  if (!livingCodex.includes(marker)) fail(`Living Codex provenance marker missing: ${marker}`);
}

for (const marker of [
  "const STATE_KEY = 'temple_v525_pilgrim_journey'",
  "schema: 'temple-of-maat/pilgrim-journey-v1'",
  'The Pilgrim Journey',
  '72-Chamber Progress Map',
  'Download Journey JSON',
  'Save Reflection',
  'Open Dossier',
  'Chamber Dossier',
  'unified chamber record',
  'Record provenance & layer boundaries',
  'A dossier unifies access while keeping these source layers visibly distinct.',
  'for (let number = 1; number <= 72; number += 1)'
]) {
  if (!livingTemple.includes(marker)) fail(`Living Temple marker missing: ${marker}`);
}

for (const marker of [
  "const DB_NAME = 'temple-of-maat-media'",
  "const STORE = 'ritual-media'",
  "const CANONICAL_SHA256 = '3e40ba7d0b60c3a04f7edf3022fc98f9daf2fcc3ca9e7900c87bb2b62f02fbe6'",
  'const CANONICAL_BYTES = 16210172',
  "crypto.subtle.digest('SHA-256'",
  'indexedDB.open(DB_NAME, DB_VERSION)',
  "audio.removeAttribute('autoplay')"
]) {
  if (!mediaVault.includes(marker)) fail(`Media Vault marker missing: ${marker}`);
}
if (!mediaVault.toLowerCase().includes('files with a different byte size continue through the older generic local-audio fallback')) {
  fail('Media Vault must preserve the generic local-audio fallback for noncanonical files');
}
if (/\bautoplay\b\s*=\s*true|setAttribute\(\s*['\"]autoplay/i.test(livingCodex + livingTemple + mediaVault)) {
  fail('v5.2.5 must never enable ritual-audio autoplay');
}
if (!mediaVault.includes('file.size !== CANONICAL_BYTES') || !mediaVault.includes('event.stopImmediatePropagation()')) {
  fail('Canonical chant interception/verification path is incomplete');
}
if (!mediaVault.includes('putMedia({') || !mediaVault.includes('getMedia()')) {
  fail('Canonical chant persistence/restore path is incomplete');
}

if (audioMeta.source?.bytes !== 16210172) fail(`Canonical MP3 byte count drifted: ${audioMeta.source?.bytes}`);
if (audioMeta.source?.sha256 !== '3e40ba7d0b60c3a04f7edf3022fc98f9daf2fcc3ca9e7900c87bb2b62f02fbe6') fail('Canonical MP3 SHA-256 drifted');
if (audioMeta.distribution?.mode !== 'indexeddb-device-install') fail('Audio distribution mode must remain device-local IndexedDB installation');
if (audioMeta.distribution?.networkUpload !== false) fail('Audio metadata must not claim a network upload');
if (audioMeta.playbackPolicy?.autoplay !== false || audioMeta.playbackPolicy?.userGestureRequired !== true) fail('Audio playback policy drifted');

for (const marker of [
  "loadEnhancement('./scripts/v5.2.4-living-codex.js', 'living-codex')",
  "loadEnhancement('./scripts/v5.2.5-living-temple.js', 'living-temple')",
  "loadEnhancement('./scripts/v5.2.5-media-vault.js', 'media-vault')",
  "root.setAttribute('inert', '')",
  "event.target.closest('a[data-temple-entry]')",
  "document.body.classList.add('temple-app-ready')"
]) {
  if (!threshold.includes(marker)) fail(`Threshold v5.2.5/manual-entry marker missing: ${marker}`);
}

for (const asset of [
  './styles/v5.2.5-living-temple.css',
  './scripts/v5.2.5-living-temple.js',
  './scripts/v5.2.5-media-vault.js',
  './assets/audio/maat-forty-two-declarations.json'
]) {
  if (!sw.includes(`'${asset}'`)) fail(`Service worker does not cache v5.2.5 shell asset ${asset}`);
}
if (!sw.includes(`temple-maat-pwa-v${version.version}`)) fail(`Service worker cache namespace does not match current Temple ${version.version}`);
if (!sw.includes('Canonical ritual audio lives in IndexedDB only after explicit visitor installation.')) fail('Service-worker audio boundary comment is missing');

for (const marker of [
  '.tm525-node-grid',
  '.tm525-dossier-hero',
  '.tm525-visual-grid',
  '.tm525-reflection',
  '.tm525-progress-fill',
  'body:not(.temple-app-ready) .tm525-layer'
]) {
  if (!css.includes(marker)) fail(`Living Temple CSS marker missing: ${marker}`);
}

console.log(`Validated Temple ${version.version} Living Temple invariants: 72 Codex records ${JSON.stringify(strengthCounts)}, legacy collectible relays, 72-node journey, unified dossiers, favorites/reflections, manual threshold, and SHA-verified IndexedDB ritual-media vault.`);
