import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const threshold = read('scripts/v5.3-threshold.js');
const hardening = read('scripts/v5.4.3-mobile-hardening.js');
const semantics = read('scripts/v5.4.4-signature-book-semantics.js');
const sw = read('sw.js');
const css = read('styles/v5.3-threshold.css');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

for (const marker of [
  "loadEnhancement('./scripts/v5.4.3-mobile-hardening.js', 'mobile-hardening')",
  "loadEnhancement('./scripts/v5.2.4-living-codex.js', 'living-codex')"
]) {
  if (!threshold.includes(marker)) fail(`threshold loader missing: ${marker}`);
}

for (const marker of [
  "const SEMANTICS_SRC = './scripts/v5.4.4-signature-book-semantics.js'",
  'window.TempleSignatureBookSemantics?.apply',
  "section.dataset.mobileLayout = 'hardened-v5.4.3'",
  'document.documentElement.scrollWidth <= viewport + 1',
  "window.TempleMobileHardening = Object.freeze({ version: '5.4.3', refresh: apply })"
]) {
  if (!hardening.includes(marker)) fail(`mobile hardening marker missing: ${marker}`);
}

for (const marker of [
  'body.temple-poems-open .temple-poems-backdrop',
  'z-index: 9310 !important',
  'body.temple-living-archive-open .temple-living-archive',
  'z-index: 9320 !important',
  'body.temple-poems-open :is(',
  'body.temple-living-archive-open :is(',
  '.tm524-dock',
  'pointer-events: none !important'
]) {
  if (!hardening.includes(marker)) fail(`immersive chamber stack invariant missing: ${marker}`);
}

for (const marker of [
  "const FIRE_FILTER_HEADING = 'Seven Fires • Filterable Flames'",
  '.temple-fire-filter-heading-row',
  '.temple-fire-filter-strip',
  'overflow-x: auto !important',
  'scroll-snap-type: x proximity',
  'function centerFireFilterButton(strip, button)',
  "strip.addEventListener('focusin', revealButton)",
  'function wireFireFilterStrip()',
  'wireFireFilterStrip();'
]) {
  if (!hardening.includes(marker)) fail(`Seven Fires mobile filter invariant missing: ${marker}`);
}

for (const marker of [
  'scroll-padding-bottom: calc(148px + env(safe-area-inset-bottom))',
  'padding-bottom: calc(148px + env(safe-area-inset-bottom))',
  'font-size: 16px !important',
  'function normalizeMobileEditableControls()',
  "node.style.setProperty('font-size', '16px', 'important')",
  "node.dataset.templeMobileFont = '16px'",
  'normalizeMobileEditableControls();',
  '#temple-release-update',
  '#temple-release-diagnostics',
  '.temple-shem-gateway',
  '.temple-poems-gateway'
]) {
  if (!hardening.includes(marker)) fail(`site-wide mobile safety invariant missing: ${marker}`);
}

for (const marker of [
  "section.classList.add('temple-signature-book')",
  "section.dataset.templeComponent = 'visitor-signature-book'",
  "section.dataset.semanticBoundary = 'v5.4.4'",
  "actions?.classList.add('temple-signature-book__actions')",
  "tableScroll?.classList.add('temple-signature-book__table-scroll')",
  "setAccessibleName(sealInput, 'Seal phrase')",
  "setAccessibleName(filter, 'Filter visitor signature ledger')",
  "window.TempleSignatureBookSemantics = Object.freeze({ version: '5.4.4', apply })"
]) {
  if (!semantics.includes(marker)) fail(`signature-book semantic marker missing: ${marker}`);
}

for (const marker of [
  '.temple-signature-book__layout',
  'grid-template-columns: minmax(0, 1fr)',
  '.temple-signature-book__actions',
  'grid-template-columns: repeat(3, minmax(0, 1fr))',
  '.temple-signature-book__table-scroll',
  'overflow-x: auto'
]) {
  if (!hardening.includes(marker)) fail(`mobile layout rule missing: ${marker}`);
}

if (!css.includes('section:has(form input[placeholder="Seal Phrase"])')) {
  fail('existing CSS fallback for the signature book was removed');
}

const cacheRevision = sw.match(/const CACHE_REVISION = '([^']+)'/)?.[1] || '';
if (!/^v5\.4-canonical-identity-r\d+(?:-[a-z0-9-]+)?$/.test(cacheRevision)) {
  fail(`invalid v5.4 service-worker cache revision: ${cacheRevision || '(missing)'}`);
}
for (const marker of [
  "'./scripts/v5.4.3-mobile-hardening.js'",
  'v5\\.4\\.3-mobile-hardening'
]) {
  if (!sw.includes(marker)) fail(`service-worker mobile hardening contract missing: ${marker}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`Validated Signature Book semantic boundary + v5.4.3 mobile hardening under cache revision ${cacheRevision}: stable semantic classes, accessible labels, immersive chamber stack isolation, narrow-screen containment, locally scrollable/focus-revealed Seven Fires selection, CSS + inline runtime 16px mobile form controls, fixed-dock clearance, legacy gateway clearance, local ledger scrolling, loader integration, and PWA delivery.`);
