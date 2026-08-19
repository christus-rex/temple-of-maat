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
const releaseStatus = read('scripts/v5.4.5-release-status.js');
const livingArchive = read('scripts/v5.5-living-archive.js');
const livingArchiveCss = read('styles/v5.5-living-archive.css');
const livingArchiveManifest = JSON.parse(read('data/living-archive-v5.5.json'));
const liveSmoke = read('scripts/smoke-live-pages-v5.5.1.mjs');
const healthDashboard = read('health/index.html');

if (version.version !== '5.5.1') fail(`Expected current portal version 5.5.1, found ${version.version}`);
if (version.build !== '2026-08-19-v5.5.1-stability-observability') fail(`Unexpected current build: ${version.build}`);
if (!String(version.source || '').toLowerCase().includes('living archive')) fail('Current release source must document the Living Archive line');
if (!String(version.source || '').toLowerCase().includes('observability')) fail('Current release source must document the observability checkpoint');
if (livingArchiveManifest.schema !== 'temple-of-maat/living-archive-v1') fail('Living Archive manifest schema mismatch');
const archiveLine = String(livingArchiveManifest.version || '').split('.').slice(0, 2).join('.');
const portalLine = String(version.version || '').split('.').slice(0, 2).join('.');
if (archiveLine !== portalLine) fail(`Living Archive manifest release line ${archiveLine || '(missing)'} does not match portal line ${portalLine}`);

for (const [name, source] of [
  ['Service Worker', sw],
  ['Threshold', threshold],
  ['Mobile hardening', mobileHardening],
  ['Signature Book semantics', signatureSemantics],
  ['Release status', releaseStatus],
  ['Living Archive', livingArchive]
]) {
  try { new vm.Script(source, { filename: name }); }
  catch (error) { fail(`${name} JavaScript does not parse: ${error.message}`); }
}

const compatibilityNamespace = 'temple-maat-pwa-v5.2.8-library-journey-offline-2026-08-14-r4';
if (!sw.includes(`const VERSION = '${compatibilityNamespace}'`)) fail('Legacy PWA compatibility namespace changed unexpectedly');
const cacheRevision = sw.match(/const CACHE_REVISION = '([^']+)'/)?.[1] || '';
if (!/^v5\.4-canonical-identity-r\d+(?:-[a-z0-9-]+)?$/.test(cacheRevision)) fail(`Invalid compatibility cache revision: ${cacheRevision || '(missing)'}`);
if (!sw.includes('const STATIC_CACHE = `${VERSION}-${CACHE_REVISION}-static`')) fail('Static cache does not include the compatibility revision');
if (!sw.includes('const RUNTIME_CACHE = `${VERSION}-${CACHE_REVISION}-runtime`')) fail('Runtime cache does not include the compatibility revision');

const core = sw.match(/const CORE_ASSETS = \[([\s\S]*?)\];/);
if (!core) fail('Unable to inspect CORE_ASSETS');
if (/\.(?:mp3|opus|ogg|m4a|wav)['"]/.test(core[1])) fail('Binary ritual media must not be part of CORE_ASSETS');
for (const asset of [
  "'./assets/branding/temple-global-logo-v5.4.webp'",
  "'./scripts/v5.4.3-mobile-hardening.js'",
  "'./scripts/v5.5-living-archive.js'",
  "'./styles/v5.5-living-archive.css'",
  "'./data/living-archive-v5.5.json'",
  "'./library/catalog.json'"
]) {
  if (!core[1].includes(asset)) fail(`Current release core asset missing: ${asset}`);
}

for (const marker of [
  'function isBinaryRitualMedia(url)',
  'function isReleaseIdentity(url)',
  'function isCriticalUiAsset(url)',
  'v5\\.5-living-archive',
  'data\\/living-archive-v5\\.5\\.json',
  'library\\/catalog\\.json',
  'await cacheStrictInBatches(cache, CORE_ASSETS)',
  "data.type === 'CACHE_FULL_TEMPLE'",
  "data.type === 'CLEAR_OPTIONAL_VISUAL_CACHE'",
  "status: 504, statusText: 'Offline'"
]) {
  if (!sw.includes(marker)) fail(`Service-worker invariant missing: ${marker}`);
}

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
  'font-size: 16px !important',
  'scroll-padding-bottom: calc(148px + env(safe-area-inset-bottom))',
  "strip.addEventListener('focusin', revealButton)",
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
  "const LIVING_ARCHIVE_SRC = './scripts/v5.5-living-archive.js'",
  "script.dataset.templeLivingArchiveRuntime = '5.5.1'",
  'ensureLivingArchive()',
  'window.TempleLivingArchive?.open',
  'href="./health/"'
]) {
  if (!releaseStatus.includes(marker)) fail(`Release diagnostics/Living Archive invariant missing: ${marker}`);
}

for (const marker of [
  "const MANIFEST_URL = './data/living-archive-v5.5.json'",
  "const LIBRARY_URL = './library/catalog.json'",
  "const CHAMBERS_URL = './chambers.json'",
  'window.TempleLivingArchive = Object.freeze',
  "temple_living_archive_state_v1"
]) {
  if (!livingArchive.includes(marker)) fail(`Living Archive runtime invariant missing: ${marker}`);
}
if (!livingArchiveCss.includes('@media(max-width:760px)')) fail('Living Archive mobile layout contract is missing');
if (!livingArchiveCss.includes('min-height:44px')) fail('Living Archive touch target contract is missing');

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

for (const marker of [
  'smoke-live-pages-v5.5.1',
  '.temple-fire-filter-strip',
  'temple-poems-open',
  'temple-living-archive-open',
  'serviceWorker.getRegistrations()',
  'noSameOriginFailures'
]) {
  if (!liveSmoke.includes(marker)) fail(`Live Pages smoke invariant missing: ${marker}`);
}

for (const marker of [
  '<title>Temple Health · SOL-OM-ON</title>',
  'temple-status/temple-health.json',
  'temple/connector-ci',
  'temple/live-smoke',
  'CACHE_REVISION',
  'Auto-refresh every 60 seconds'
]) {
  if (!healthDashboard.includes(marker)) fail(`Temple Health dashboard invariant missing: ${marker}`);
}

if (!fs.existsSync('assets/branding/temple-global-logo-v5.4.webp')) fail('Dedicated global logo asset is missing');
const logoSize = fs.statSync('assets/branding/temple-global-logo-v5.4.webp').size;
if (logoSize < 10000) fail(`Global logo asset is unexpectedly small: ${logoSize} bytes`);

for (const path of [
  'data/living-archive-v5.5.json',
  'styles/v5.5-living-archive.css',
  'scripts/v5.5-living-archive.js',
  'scripts/smoke-live-pages-v5.5.1.mjs',
  'scripts/validate-living-archive-v5.5.mjs',
  'health/index.html',
  'docs/releases/v5.4.0.md',
  'docs/releases/v5.5.0.md',
  'docs/releases/v5.5.1.md',
  'docs/releases/ROLLBACK.md'
]) if (!fs.existsSync(path)) fail(`v5.5.1 release asset missing: ${path}`);

console.log(JSON.stringify({
  ok: true,
  version: version.version,
  build: version.build,
  cacheRevision,
  pwaCompatibilityCacheRetained: true,
  logoBytes: logoSize,
  logoPrecached: true,
  iconFallback: true,
  ritualMediaBoundaryPreserved: true,
  manualThresholdPreserved: true,
  mobileHardeningLoaded: true,
  signatureBookSemanticBoundary: 'v5.4.4',
  livingArchive: true,
  livingArchiveReleaseLine: archiveLine,
  livingArchiveOfflineShell: true,
  livingArchiveNetworkFirst: true,
  productionLiveSmoke: true,
  templeHealthDashboard: true,
  livingArchiveRecords: livingArchiveManifest.poems.length + (livingArchiveManifest.collections?.length || 0)
}, null, 2));
