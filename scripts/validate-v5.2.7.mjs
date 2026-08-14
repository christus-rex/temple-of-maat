import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };
const read = (relative) => fs.readFileSync(file(relative), 'utf8');

const required = [
  'README.md',
  'ROADMAP.md',
  'GOVERNANCE.md',
  'PWA-CHECKLIST.md',
  'version.json',
  'sw.js',
  'chambers.json',
  'scripts/v5.2.4-living-codex.js',
  'scripts/v5.2.5-living-temple.js',
  'scripts/v5.2.5-media-vault.js',
  'scripts/v5.2.6-shem-dossiers.js',
  'scripts/v5.3-threshold.js',
  'assets/audio/maat-forty-two-declarations.json'
];
for (const relative of required) {
  if (!fs.existsSync(file(relative))) fail(`Missing stewardship/release file: ${relative}`);
}

const version = JSON.parse(read('version.json'));
if (version.version !== '5.2.7') fail(`Expected stewardship release 5.2.7, found ${version.version}`);
if (version.build !== '2026-08-14-v5.2.7-stewardship-governance') fail(`Unexpected stewardship build: ${version.build}`);
if (!/canonical roadmap/i.test(version.source || '') || !/governance covenant/i.test(version.source || '')) {
  fail('version.json must describe the v5.2.7 roadmap/governance stewardship scope');
}

const readme = read('README.md');
const roadmap = read('ROADMAP.md');
const governance = read('GOVERNANCE.md');
const pwaChecklist = read('PWA-CHECKLIST.md');
const sw = read('sw.js');
const threshold = read('scripts/v5.3-threshold.js');
const livingCodex = read('scripts/v5.2.4-living-codex.js');
const livingTemple = read('scripts/v5.2.5-living-temple.js');
const mediaVault = read('scripts/v5.2.5-media-vault.js');
const shemDossiers = read('scripts/v5.2.6-shem-dossiers.js');
const audioMeta = JSON.parse(read('assets/audio/maat-forty-two-declarations.json'));

for (const [name, source] of [
  ['Threshold', threshold],
  ['Living Codex', livingCodex],
  ['Living Temple', livingTemple],
  ['Media Vault', mediaVault],
  ['Shem Dossiers', shemDossiers],
  ['Service Worker', sw]
]) {
  try { new vm.Script(source, { filename: name }); }
  catch (error) { fail(`${name} JavaScript does not parse: ${error.message}`); }
}

// Documentation truth.
for (const marker of [
  '# Temple of Ma\'at — GitHub Pages PWA v5.2.7',
  'v5.2.6 Shem Dossiers → v5.2.7 Stewardship & Governance',
  'ROADMAP.md',
  'GOVERNANCE.md',
  'v5.2.8 — Temple Library'
]) {
  if (!readme.includes(marker)) fail(`README stewardship marker missing: ${marker}`);
}

for (const marker of [
  '## Current release',
  '### v5.2.6 — Shem Dossiers',
  '## NOW — v5.2.7 Stewardship & Governance',
  '## NEXT — v5.2.8 Temple Library',
  '## LATER — v5.3.0 Integrated Research Temple',
  '## Research backlog',
  '## Release gates',
  'Library → Tradition → Source → Study → Discernment → Correspondences'
]) {
  if (!roadmap.includes(marker)) fail(`ROADMAP marker missing: ${marker}`);
}

for (const marker of [
  '## 2. Compare without collapsing',
  '## 3. Four provenance layers',
  'Layer 1 — Primary / Historical Source',
  'Layer 2 — Scholarly / Computational Analysis',
  'Layer 3 — Comparative Interpretation',
  'Layer 4 — Temple / Personal Symbolism',
  'Numerical equality proves numerical equality under the stated method.',
  '## 6. Manual threshold covenant',
  '## 7. Ritual media covenant',
  'No autoplay.',
  '## 11. Release governance',
  '## 14. Anti-distortion rule'
]) {
  if (!governance.includes(marker)) fail(`GOVERNANCE marker missing: ${marker}`);
}

for (const marker of [
  '## Automated / repository-verified',
  '## Deployed-origin checks',
  '## Installed-PWA checks',
  '## Mobile accessibility checks',
  '1440×2560',
  '3840×2160'
]) {
  if (!pwaChecklist.includes(marker)) fail(`PWA verification marker missing: ${marker}`);
}

// Canonical 72 chamber integrity.
const chamberData = JSON.parse(read('chambers.json'));
const chambers = chamberData.chambers;
if (!Array.isArray(chambers) || chambers.length !== 72) fail(`Expected 72 canonical chambers, found ${chambers?.length}`);
if (new Set(chambers.map((item) => item.id)).size !== 72) fail('Canonical chamber IDs are not unique');

// Living Codex source table and collectible relays.
const rawMatch = livingCodex.match(/const RAW = `([\s\S]*?)`;/);
if (!rawMatch) fail('Living Codex source table is missing');
const codexRows = rawMatch[1].trim().split('\n');
if (codexRows.length !== 72) fail(`Expected 72 Living Codex records, found ${codexRows.length}`);
for (const selector of ['.tm2-wallpaper', '.tm2-parental-download', '.tm2-plate-download']) {
  if (!livingCodex.includes(selector)) fail(`Collectible relay disappeared: ${selector}`);
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

// Living Temple state and dossiers remain present.
for (const marker of [
  "const STATE_KEY = 'temple_v525_pilgrim_journey'",
  'The Pilgrim Journey',
  '72-Chamber Progress Map',
  'Save Reflection',
  'Open Dossier',
  'Chamber Dossier',
  'for (let number = 1; number <= 72; number += 1)'
]) {
  if (!livingTemple.includes(marker)) fail(`Living Temple invariant missing: ${marker}`);
}

// v5.2.6 Shem dossier layer remains complete and sequential.
const shemMatch = shemDossiers.match(/const DATA = Object\.freeze\((\[[\s\S]*?\])\);/);
if (!shemMatch) fail('Shem Dossier DATA array is missing');
let shem;
try { shem = JSON.parse(shemMatch[1]); }
catch (error) { fail(`Shem Dossier DATA is not parseable JSON: ${error.message}`); }
if (shem.length !== 72) fail(`Expected 72 Shem dossier records, found ${shem.length}`);
for (let index = 0; index < 72; index += 1) {
  const item = shem[index];
  if (Number(item?.num) !== index + 1) fail(`Shem dossier sequence drift at position ${index + 1}`);
  if (!item?.root || !item?.fullHe || !item?.nameEn) fail(`Incomplete Shem dossier record ${index + 1}`);
}
if (!threshold.includes("loadEnhancement('./scripts/v5.2.6-shem-dossiers.js', 'shem-dossiers')")) {
  fail('Threshold no longer loads the v5.2.6 Shem dossier layer');
}

// Manual threshold covenant remains enforced.
for (const marker of [
  "root.setAttribute('inert', '')",
  "event.target.closest('a[data-temple-entry]')",
  "document.body.classList.add('temple-app-ready')"
]) {
  if (!threshold.includes(marker)) fail(`Manual threshold marker missing: ${marker}`);
}

// Ritual media remains private, integrity-bound, and never autoplayed.
for (const marker of [
  "const DB_NAME = 'temple-of-maat-media'",
  "const STORE = 'ritual-media'",
  "const CANONICAL_SHA256 = '3e40ba7d0b60c3a04f7edf3022fc98f9daf2fcc3ca9e7900c87bb2b62f02fbe6'",
  'const CANONICAL_BYTES = 16210172',
  "crypto.subtle.digest('SHA-256'",
  "audio.removeAttribute('autoplay')"
]) {
  if (!mediaVault.includes(marker)) fail(`Media Vault marker missing: ${marker}`);
}
if (/\bautoplay\b\s*=\s*true|setAttribute\(\s*['\"]autoplay/i.test(livingCodex + livingTemple + mediaVault)) {
  fail('Temple runtime must never enable ritual-media autoplay');
}
if (audioMeta.source?.bytes !== 16210172) fail(`Canonical MP3 byte count drifted: ${audioMeta.source?.bytes}`);
if (audioMeta.source?.sha256 !== '3e40ba7d0b60c3a04f7edf3022fc98f9daf2fcc3ca9e7900c87bb2b62f02fbe6') fail('Canonical MP3 SHA-256 drifted');
if (audioMeta.distribution?.mode !== 'indexeddb-device-install') fail('Canonical audio distribution must remain device-local IndexedDB install');
if (audioMeta.playbackPolicy?.autoplay !== false || audioMeta.playbackPolicy?.userGestureRequired !== true) {
  fail('Canonical ritual-media playback policy drifted');
}

// PWA release truth.
if (!sw.includes("const VERSION = 'temple-maat-pwa-v5.2.7-stewardship-governance-2026-08-14'")) {
  fail('Service-worker cache namespace is not v5.2.7 stewardship-governance');
}
for (const asset of [
  './index.html',
  './shem-hamephorash-72.html',
  './version.json',
  './scripts/v5.2.4-living-codex.js',
  './scripts/v5.2.5-living-temple.js',
  './scripts/v5.2.6-shem-dossiers.js',
  './scripts/v5.2.5-media-vault.js'
]) {
  if (!sw.includes(`'${asset}'`)) fail(`Service worker no longer caches required shell asset: ${asset}`);
}
if (!sw.includes('Canonical ritual audio lives in IndexedDB only after explicit visitor installation.')) {
  fail('Service-worker ritual-media boundary comment is missing');
}

console.log(`Validated Temple ${version.version} stewardship: 72 chambers, 72 Codex records, 72 Shem dossiers, roadmap/governance truth, manual threshold, collectibles, Journey/Dossiers, and no-autoplay device-local ritual media preserved.`);
