import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { throw new Error(message); };

const version = JSON.parse(read('version.json'));
const sw = read('sw.js');
const threshold = read('scripts/v5.3-threshold.js');
const css = read('styles/v5.3-threshold.css');
const mobileHardening = read('scripts/v5.4.3-mobile-hardening.js');
const signatureSemantics = read('scripts/v5.4.4-signature-book-semantics.js');

if (version.version !== '5.4.0') fail(`Expected current portal version 5.4.0, found ${version.version}`);
if (version.build !== '2026-08-16-v5.4-canonical-identity') fail(`Unexpected current build: ${version.build}`);
if (!String(version.source || '').includes('canonical identity')) fail('Current release source must document canonical identity');

for (const [name, source] of [['Service Worker', sw], ['Threshold', threshold], ['Mobile hardening', mobileHardening], ['Signature Book semantics', signatureSemantics]]) {
  try { new vm.Script(source, { filename: name }); }
  catch (error) { fail(`${name} JavaScript does not parse: ${error.message}`); }
}

const compatibilityNamespace = 'temple-maat-pwa-v5.2.8-library-journey-offline-2026-08-14-r4';
if (!sw.includes(`const VERSION = '${compatibilityNamespace}'`)) fail('Legacy PWA compatibility namespace changed unexpectedly');
const cacheRevision = sw.match(/const CACHE_REVISION = '([^']+)'/)?.[1] || '';
if (!/^v5\.4-canonical-identity-r\d+(?:-[a-z0-9-]+)?$/.test(cacheRevision)) fail(`Invalid v5.4 cache revision: ${cacheRevision || '(missing)'}`);
if (!sw.includes('const STATIC_CACHE = `${VERSION}-${CACHE_REVISION}-static`')) fail('Static cache does not include the v5.4 revision');
if (!sw.includes('const RUNTIME_CACHE = `${VERSION}-${CACHE_REVISION}-runtime`')) fail('Runtime cache does not include the v5.4 revision');
if (!sw.includes("'./assets/branding/temple-global-logo-v5.4.webp'")) fail('Canonical v5.4 logo is not part of CORE_ASSETS');
if (!sw.includes("'./scripts/v5.4.3-mobile-hardening.js'")) fail('Mobile hardening is not part of CORE_ASSETS');

for (const marker of [
  'function isBinaryRitualMedia(url)',
  'function isReleaseIdentity(url)',
  'function isCriticalUiAsset(url)',
  'await cacheStrictInBatches(cache, CORE_ASSETS)',
  "data.type === 'CACHE_FULL_TEMPLE'",
  "data.type === 'CLEAR_OPTIONAL_VISUAL_CACHE'",
  "status: 504, statusText: 'Offline'"
]) {
  if (!sw.includes(marker)) fail(`Service-worker invariant missing: ${marker}`);
}
const core = sw.match(/const CORE_ASSETS = \[([\s\S]*?)\];/);
if (!core) fail('Unable to inspect CORE_ASSETS');
if (/\.(?:mp3|opus|ogg|m4a|wav)['"]/.test(core[1])) fail('Binary ritual media must not be part of CORE_ASSETS');

for (const marker of [
  "root.setAttribute('inert', '')",
  "event.target.closest('a[data-temple-entry]')",
  "document.body.classList.add('temple-app-ready')",
  'async function installPortalVersionBadge()',
  "fetch('./version.json', { cache: 'no-store' })",
  "loadEnhancement('./scripts/v5.4.3-mobile-hardening.js', 'mobile-hardening')"
]) {
  if (!threshold.includes(marker)) fail(`Threshold/version behavior missing: ${marker}`);
}

for (const marker of [
  "const SEMANTICS_SRC = './scripts/v5.4.4-signature-book-semantics.js'",
  'window.TempleSignatureBookSemantics?.apply',
  '.temple-signature-book__table-scroll',
  "window.TempleMobileHardening = Object.freeze({ version: '5.4.3', refresh: apply })"
]) {
  if (!mobileHardening.includes(marker)) fail(`Mobile hardening invariant missing: ${marker}`);
}

for (const marker of [
  "section.classList.add('temple-signature-book')",
  "section.dataset.templeComponent = 'visitor-signature-book'",
  "section.dataset.semanticBoundary = 'v5.4.4'",
  "setAccessibleName(sealInput, 'Seal phrase')",
  "setAccessibleName(filter, 'Filter visitor signature ledger')",
  "window.TempleSignatureBookSemantics = Object.freeze({ version: '5.4.4', apply })"
]) {
  if (!signatureSemantics.includes(marker)) fail(`Signature Book semantic invariant missing: ${marker}`);
}

for (const marker of [
  'body:not(.temple-app-ready) #root',
  'body:not(.temple-app-ready) #tm-commit-deck',
  'assets/branding/temple-global-logo-v5.4.webp',
  'assets/branding/temple-app-icon-192-v5.4.png',
  "url('../icon-512.png')",
  '.temple-brand-title::before',
  '.temple-static-entry__panel::before'
]) {
  if (!css.includes(marker)) fail(`Logo/threshold styling invariant missing: ${marker}`);
}

if (!fs.existsSync('assets/branding/temple-global-logo-v5.4.webp')) fail('Dedicated global logo asset is missing');
const logoSize = fs.statSync('assets/branding/temple-global-logo-v5.4.webp').size;
if (logoSize < 10000) fail(`Global logo asset is unexpectedly small: ${logoSize} bytes`);

console.log(JSON.stringify({
  ok: true,
  version: version.version,
  build: version.build,
  cacheRevision,
  logoBytes: logoSize,
  logoPrecached: true,
  iconFallback: true,
  ritualMediaBoundaryPreserved: true,
  manualThresholdPreserved: true,
  mobileHardeningLoaded: true,
  signatureBookSemanticBoundary: 'v5.4.4'
}, null, 2));
