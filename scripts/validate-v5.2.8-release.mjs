import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const read = (relative) => fs.readFileSync(file(relative), 'utf8');
const fail = (message) => { throw new Error(message); };

const required = [
  'README.md',
  'ROADMAP.md',
  'PWA-CHECKLIST.md',
  'GOVERNANCE.md',
  'docs/RELEASE_VERIFICATION.md',
  'version.json',
  'sw.js',
  'scripts/v5.3-threshold.js',
  'scripts/v5.2.8-temple-library.js',
  'styles/v5.2.8-temple-library.css',
  'scripts/v5.2.8-journey-import.js',
  'styles/v5.2.8-journey-import.css',
  'scripts/v5.2.8-offline-controls.js',
  'styles/v5.2.8-offline-controls.css',
  'scripts/smoke-release-hardening-v5.2.8.mjs',
  'scripts/verify-deployed-v5.2.8.mjs',
  '.github/workflows/smoke-release-hardening-v5.2.8.yml',
  '.github/workflows/verify-deployed-v5.2.8.yml'
];
for (const relative of required) {
  if (!fs.existsSync(file(relative))) fail(`Missing v5.2.8 release file: ${relative}`);
}

const version = JSON.parse(read('version.json'));
const sw = read('sw.js');
const threshold = read('scripts/v5.3-threshold.js');
const readme = read('README.md');
const roadmap = read('ROADMAP.md');
const checklist = read('PWA-CHECKLIST.md');
const runbook = read('docs/RELEASE_VERIFICATION.md');
const hardening = read('scripts/smoke-release-hardening-v5.2.8.mjs');
const deployed = read('scripts/verify-deployed-v5.2.8.mjs');
const hardeningWorkflow = read('.github/workflows/smoke-release-hardening-v5.2.8.yml');
const deployedWorkflow = read('.github/workflows/verify-deployed-v5.2.8.yml');
const wallpaper = read('scripts/diagnose-live-wallpapers.mjs');

for (const [name, source] of [
  ['Service Worker', sw],
  ['Threshold', threshold],
  ['Release hardening smoke', hardening],
  ['Deployed-origin verifier', deployed]
]) {
  try { new vm.Script(source, { filename: name }); }
  catch (error) { fail(`${name} JavaScript does not parse: ${error.message}`); }
}

if (version.version !== '5.2.8') fail(`Expected release version 5.2.8, found ${version.version}`);
if (version.build !== '2026-08-14-v5.2.8-library-journey-offline-hardening') fail(`Unexpected v5.2.8 build: ${version.build}`);
for (const marker of ['provenance-aware Temple Library', 'portable local Pilgrim Journey restore', 'explicit offline visual ownership', 'manual threshold covenant', 'no-autoplay ritual media']) {
  if (!String(version.source || '').includes(marker)) fail(`version.json source marker missing: ${marker}`);
}

const namespace = 'temple-maat-pwa-v5.2.8-library-journey-offline-2026-08-14';
if (!sw.includes(`const VERSION = '${namespace}'`)) fail('Service-worker namespace does not match final v5.2.8 release');
if (sw.includes("const VERSION = 'temple-maat-pwa-v5.2.7-wallpaper-hotfix-2026-08-14'")) fail('Historical v5.2.7 namespace is still current');

for (const asset of [
  './styles/v5.2.8-temple-library.css',
  './styles/v5.2.8-journey-import.css',
  './styles/v5.2.8-offline-controls.css',
  './scripts/v5.2.8-temple-library.js',
  './scripts/v5.2.8-journey-import.js',
  './scripts/v5.2.8-offline-controls.js'
]) {
  if (!sw.includes(`'${asset}'`)) fail(`v5.2.8 progressive enhancement missing from CORE_ASSETS: ${asset}`);
}

for (const marker of [
  'function isBinaryRitualMedia(url)',
  "data.type === 'CACHE_FULL_TEMPLE'",
  "data.type === 'CLEAR_OPTIONAL_VISUAL_CACHE'",
  "status: 504, statusText: 'Offline'"
]) {
  if (!sw.includes(marker)) fail(`v5.2.8 service-worker invariant missing: ${marker}`);
}
const core = sw.match(/const CORE_ASSETS = \[([\s\S]*?)\];/);
if (!core) fail('Unable to inspect service-worker CORE_ASSETS');
if (/\.(?:mp3|opus|ogg|m4a|wav)['"]/.test(core[1])) fail('Binary ritual media must not be part of CORE_ASSETS');

for (const marker of [
  "root.setAttribute('inert', '')",
  "event.target.closest('a[data-temple-entry]')",
  "document.body.classList.add('temple-app-ready')",
  "loadEnhancement('./scripts/v5.2.8-temple-library.js', 'temple-library')",
  "loadEnhancement('./scripts/v5.2.8-journey-import.js', 'journey-import')",
  "loadEnhancement('./scripts/v5.2.8-offline-controls.js', 'offline-controls')"
]) {
  if (!threshold.includes(marker)) fail(`Manual threshold/progressive enhancement marker missing: ${marker}`);
}

for (const marker of [
  "# Temple of Ma'at — GitHub Pages PWA v5.2.8",
  'Temple Library · Portable Journey · Offline Ownership · Release Hardening',
  'v5.3.0 — Integrated Research Temple',
  'docs/RELEASE_VERIFICATION.md'
]) {
  if (!readme.includes(marker)) fail(`README v5.2.8 release marker missing: ${marker}`);
}

for (const marker of [
  '### v5.2.8 — Temple Library & Portable Practice',
  '## NEXT — v5.3.0 Integrated Research Temple',
  'Foundation first — canonical relationship edges',
  'Library → Tradition → Source → Study → Discernment → Correspondences',
  'compare without collapsing',
  'The repeatable deployed-origin verifier succeeds before the release is declared published.'
]) {
  if (!roadmap.includes(marker)) fail(`ROADMAP v5.2.8 marker missing: ${marker}`);
}

for (const marker of [
  'docs/RELEASE_VERIFICATION.md',
  'Simulated prior v5.2.7 service-worker control can upgrade to the v5.2.8 worker/cache namespace.',
  '`#chamber-42` remains hidden behind the threshold',
  '320 px, 360 px, and 412 px',
  'Physical Android phone',
  'Physical iPhone/iPad',
  'Installed-PWA checks'
]) {
  if (!checklist.includes(marker)) fail(`PWA checklist hardening marker missing: ${marker}`);
}

for (const marker of [
  '## 1. Release-candidate gate',
  '## 2. Post-merge deployed-origin gate',
  '## 3. Android / Chromium installed-PWA check',
  '## 4. iPhone / iPad — Safari Add to Home Screen',
  '## 5. Desktop Chromium installed-PWA check',
  '## 6. Failure-evidence rule',
  'Smoke Release hardening v5.2.8',
  'Verify Deployed Temple v5.2.8',
  'iOS/iPadOS is available',
  'Do not replace a failing assertion with a weaker assertion'
]) {
  if (!runbook.includes(marker)) fail(`Release verification runbook marker missing: ${marker}`);
}

for (const marker of [
  "const CURRENT_NAMESPACE = 'temple-maat-pwa-v5.2.8-library-journey-offline-2026-08-14'",
  "const PRIOR_NAMESPACE = 'temple-maat-pwa-v5.2.7-prior-release-fixture'",
  "#chamber-42",
  '[[320, 740], [360, 800], [412, 915]]',
  'mobileOverlayGeometry',
  'thresholdHeldAfterUpdate',
  'upgradedToCurrentWorker'
]) {
  if (!hardening.includes(marker)) fail(`Release hardening smoke marker missing: ${marker}`);
}

for (const marker of [
  "https://christus-rex.github.io/temple-of-maat/",
  "expectedVersion = process.env.TEMPLE_EXPECTED_VERSION || '5.2.8'",
  'serviceWorkerControlled',
  'deepLinkHeld',
  'mobileOverlayGeometry'
]) {
  if (!deployed.includes(marker)) fail(`Deployed verifier marker missing: ${marker}`);
}

for (const marker of ['if: always()', 'actions/upload-artifact@v4', 'v5.2.8-release-hardening-screenshots']) {
  if (!hardeningWorkflow.includes(marker)) fail(`Hardening screenshot-evidence workflow marker missing: ${marker}`);
}
if (!/on:\s*\n\s*workflow_dispatch:/m.test(deployedWorkflow)) fail('Deployed verifier must remain manual workflow_dispatch to avoid pre-deploy races');
for (const marker of ['actions/upload-artifact@v4', 'v5.2.8-deployed-origin-screenshots']) {
  if (!deployedWorkflow.includes(marker)) fail(`Deployed verifier artifact marker missing: ${marker}`);
}

if (!wallpaper.includes("version?.version === '5.2.8'")) fail('Wallpaper verifier is still locked to a historical release version');
if (wallpaper.includes("version?.version === '5.2.7'")) fail('Wallpaper verifier contains stale v5.2.7 exact-version assertion');

console.log(`Validated Temple ${version.version} release candidate: exact release/build identity, v5.2.8 service-worker namespace and shell, manual threshold, Library/Journey/Offline enhancements, ritual-media cache boundary, update/deep-link/mobile hardening, deployed-origin runbook, and screenshot evidence contract.`);
