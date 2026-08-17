import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const threshold = read('scripts/v5.3-threshold.js');
const hardening = read('scripts/v5.4.3-mobile-hardening.js');
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
  "section.classList.add('temple-signature-book')",
  "section.dataset.mobileLayout = 'hardened-v5.4.3'",
  "actions?.classList.add('temple-signature-book__actions')",
  "table?.parentElement?.classList.add('temple-signature-book__table-scroll')",
  "document.documentElement.scrollWidth <= viewport + 1",
  "window.TempleMobileHardening = Object.freeze({ refresh: apply })"
]) {
  if (!hardening.includes(marker)) fail(`mobile hardening marker missing: ${marker}`);
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

for (const marker of [
  "'./scripts/v5.4.3-mobile-hardening.js'",
  'v5.4-canonical-identity-r3-debug-pass',
  'v5\\.4\\.3-mobile-hardening'
]) {
  if (!sw.includes(marker)) fail(`service-worker mobile hardening contract missing: ${marker}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log('Validated v5.4.3 mobile hardening: semantic Signature Book classes, narrow-screen containment, local ledger scrolling, loader integration, and fresh PWA shell delivery.');
