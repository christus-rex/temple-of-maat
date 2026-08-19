import fs from 'node:fs';

const files = {
  html: 'index.html',
  thresholdCss: 'styles/v5.3-threshold.css',
  thresholdJs: 'scripts/v5.3-threshold.js',
  mobileJs: 'scripts/v5.4.3-mobile-hardening.js',
  signatureJs: 'scripts/v5.4.4-signature-book-semantics.js',
  releaseStatusJs: 'scripts/v5.4.5-release-status.js',
  livingArchiveJs: 'scripts/v5.5-living-archive.js',
  livingArchiveCss: 'styles/v5.5-living-archive.css',
  persistentJs: 'scripts/persistent-data.js'
};

const budgets = {
  html: 450 * 1024,
  thresholdCss: 96 * 1024,
  thresholdJs: 48 * 1024,
  mobileJs: 24 * 1024,
  signatureJs: 16 * 1024,
  releaseStatusJs: 24 * 1024,
  livingArchiveJs: 48 * 1024,
  livingArchiveCss: 24 * 1024,
  persistentJs: 24 * 1024
};

const sizes = {};
const failures = [];
for (const [key, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    failures.push(`missing quality-gate file: ${file}`);
    continue;
  }
  sizes[key] = fs.statSync(file).size;
  if (sizes[key] > budgets[key]) failures.push(`${file} exceeds budget: ${sizes[key]} > ${budgets[key]} bytes`);
}

const html = fs.readFileSync(files.html, 'utf8');
const threshold = fs.readFileSync(files.thresholdJs, 'utf8');
const mobile = fs.readFileSync(files.mobileJs, 'utf8');
const signature = fs.readFileSync(files.signatureJs, 'utf8');
const releaseStatus = fs.readFileSync(files.releaseStatusJs, 'utf8');
const livingArchive = fs.readFileSync(files.livingArchiveJs, 'utf8');
const livingArchiveCss = fs.readFileSync(files.livingArchiveCss, 'utf8');
const persistent = fs.readFileSync(files.persistentJs, 'utf8');
const livingCodex = fs.readFileSync('scripts/v5.2.4-living-codex.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

for (const marker of [
  "root.setAttribute('inert', '')",
  "root.removeAttribute('inert')",
  "event.target.closest('a[data-temple-entry]')",
  "root.setAttribute('tabindex', '-1')"
]) {
  if (!threshold.includes(marker)) failures.push(`threshold accessibility invariant missing: ${marker}`);
}

for (const marker of [
  "section.setAttribute('aria-labelledby', heading.id)",
  "form.setAttribute('aria-label', 'Visitor Signature Book entry form')",
  "table.setAttribute('aria-label', 'Visitor Signature Book ledger')",
  "setAccessibleName(sealInput, 'Seal phrase')",
  "setAccessibleName(filter, 'Filter visitor signature ledger')"
]) {
  if (!signature.includes(marker)) failures.push(`Signature Book accessibility invariant missing: ${marker}`);
}

for (const marker of [
  '.temple-signature-book__actions',
  'grid-template-columns: repeat(3, minmax(0, 1fr))',
  '.temple-signature-book__table-scroll',
  'overflow-x: auto',
  'font-size: 16px !important',
  'scroll-padding-bottom: calc(148px + env(safe-area-inset-bottom))',
  "strip.addEventListener('focusin', revealButton)",
  "const RELEASE_STATUS_SRC = './scripts/v5.4.5-release-status.js'",
  'ensureReleaseStatus()'
]) {
  if (!mobile.includes(marker)) failures.push(`mobile/runtime containment invariant missing: ${marker}`);
}

for (const marker of [
  "button.textContent = 'UPDATE READY · RELOAD'",
  "button.setAttribute('aria-label', 'A new Temple version is ready. Reload now.')",
  "window.TempleReleaseStatus = Object.freeze({ version: '5.4.5'",
  "fetch(`./version.json?release_status=${Date.now()}`",
  "fetch(`./sw.js?release_status=${Date.now()}`",
  "const LIVING_ARCHIVE_SRC = './scripts/v5.5-living-archive.js'"
]) {
  if (!releaseStatus.includes(marker)) failures.push(`release-status invariant missing: ${marker}`);
}

for (const marker of [
  "const MANIFEST_URL = './data/living-archive-v5.5.json'",
  "const LIBRARY_URL = './library/catalog.json'",
  "const CHAMBERS_URL = './chambers.json'",
  'window.TempleLivingArchive = Object.freeze'
]) {
  if (!livingArchive.includes(marker)) failures.push(`Living Archive runtime invariant missing: ${marker}`);
}
for (const marker of ['@media(max-width:760px)', 'min-height:44px', ':focus-visible']) {
  if (!livingArchiveCss.includes(marker)) failures.push(`Living Archive mobile/accessibility invariant missing: ${marker}`);
}

for (const marker of [
  "baseUrl: 'https://counterapi.com/api'",
  "provider: 'counterapi.com'",
  "url.searchParams.set('unique', 'true')",
  "detail: Object.freeze({ total, unique, persistent: true, provider: GLOBAL_COUNTER.provider })"
]) {
  if (!persistent.includes(marker)) failures.push(`visitor counter invariant missing: ${marker}`);
}
if (persistent.includes('https://api.counterapi.dev/v1')) failures.push('retired CounterAPI v1 browser endpoint reintroduced');

if (!livingCodex.includes("const CHANT_SRC = './assets/audio/maat-forty-two-declarations.web.opus';")) {
  failures.push('Living Codex is not initialized from the published Opus chant rendition');
}
if (livingCodex.includes("const CHANT_SRC = './assets/audio/maat-forty-two-declarations.mp3';")) {
  failures.push('legacy missing MP3 chant source reintroduced');
}

if (!html.includes('<meta name="viewport"')) failures.push('viewport meta tag is missing');
if (!html.includes('<script src="./scripts/persistent-data.js"></script>')) failures.push('persistent data bootstrap is missing');
if (/data:image\/(?:png|webp);base64,/i.test(html)) failures.push('index.html contains embedded raster payloads; display art should remain externalized');

const core = sw.match(/const CORE_ASSETS = \[([\s\S]*?)\];/)?.[1] || '';
if (/\.(?:mp3|opus|ogg|m4a|wav)['"]/i.test(core)) failures.push('binary ritual media entered the service-worker core shell');
for (const asset of [
  "'./scripts/v5.4.4-signature-book-semantics.js'",
  "'./scripts/v5.4.5-release-status.js'",
  "'./scripts/v5.5-living-archive.js'",
  "'./styles/v5.5-living-archive.css'",
  "'./data/living-archive-v5.5.json'",
  "'./library/catalog.json'"
]) {
  if (!core.includes(asset)) failures.push(`critical current-release asset is not precached: ${asset}`);
}
for (const marker of [
  'v5\\.4\\.4-signature-book-semantics',
  'persistent-data',
  'v5\\.4\\.5-release-status',
  'v5\\.5-living-archive',
  'data\\/living-archive-v5\\.5\\.json',
  'library\\/catalog\\.json'
]) {
  if (!sw.includes(marker)) failures.push(`critical UI network-first matcher missing: ${marker}`);
}

const report = {
  ok: failures.length === 0,
  budgets,
  sizes,
  accessibility: {
    manualThresholdInert: threshold.includes("root.setAttribute('inert', '')"),
    signatureBookSemanticBoundary: signature.includes("section.dataset.semanticBoundary = 'v5.4.4'"),
    signatureBookAccessibleForm: signature.includes('Visitor Signature Book entry form'),
    signatureBookAccessibleLedger: signature.includes('Visitor Signature Book ledger'),
    updateControlAccessible: releaseStatus.includes('A new Temple version is ready. Reload now.'),
    mobileEditableControlsProtected: mobile.includes('font-size: 16px !important'),
    sevenFiresKeyboardReveal: mobile.includes("strip.addEventListener('focusin', revealButton)")
  },
  performance: {
    externalizedRasterPayloads: !/data:image\/(?:png|webp);base64,/i.test(html),
    ritualMediaOutsideCoreShell: !/\.(?:mp3|opus|ogg|m4a|wav)['"]/i.test(core)
  },
  reliability: {
    visitorCounterProvider: persistent.includes("provider: 'counterapi.com'") ? 'counterapi.com' : 'unknown',
    legacyCounterV1Absent: !persistent.includes('https://api.counterapi.dev/v1'),
    publishedChantSource: livingCodex.includes('maat-forty-two-declarations.web.opus'),
    signatureSemanticsPrecached: core.includes("'./scripts/v5.4.4-signature-book-semantics.js'"),
    releaseStatusPrecached: core.includes("'./scripts/v5.4.5-release-status.js'"),
    livingArchivePrecached: core.includes("'./scripts/v5.5-living-archive.js'") && core.includes("'./data/living-archive-v5.5.json'"),
    livingArchiveNetworkFirst: sw.includes('v5\\.5-living-archive') && sw.includes('data\\/living-archive-v5\\.5\\.json')
  },
  failures
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
