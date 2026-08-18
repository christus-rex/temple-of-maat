import fs from 'node:fs';

const files = {
  html: 'index.html',
  thresholdCss: 'styles/v5.3-threshold.css',
  thresholdJs: 'scripts/v5.3-threshold.js',
  mobileJs: 'scripts/v5.4.3-mobile-hardening.js',
  signatureJs: 'scripts/v5.4.4-signature-book-semantics.js',
  persistentJs: 'scripts/persistent-data.js'
};

const budgets = {
  html: 450 * 1024,
  thresholdCss: 96 * 1024,
  thresholdJs: 48 * 1024,
  mobileJs: 24 * 1024,
  signatureJs: 16 * 1024,
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
  'overflow-x: auto'
]) {
  if (!mobile.includes(marker)) failures.push(`mobile containment invariant missing: ${marker}`);
}

if (!html.includes('<meta name="viewport"')) failures.push('viewport meta tag is missing');
if (!html.includes('<script src="./scripts/persistent-data.js"></script>')) failures.push('persistent data bootstrap is missing');
if (/data:image\/(?:png|webp);base64,/i.test(html)) failures.push('index.html contains embedded raster payloads; display art should remain externalized');

const core = sw.match(/const CORE_ASSETS = \[([\s\S]*?)\];/)?.[1] || '';
if (/\.(?:mp3|opus|ogg|m4a|wav)['"]/i.test(core)) failures.push('binary ritual media entered the service-worker core shell');

const report = {
  ok: failures.length === 0,
  budgets,
  sizes,
  accessibility: {
    manualThresholdInert: threshold.includes("root.setAttribute('inert', '')"),
    signatureBookSemanticBoundary: signature.includes("section.dataset.semanticBoundary = 'v5.4.4'"),
    signatureBookAccessibleForm: signature.includes("Visitor Signature Book entry form"),
    signatureBookAccessibleLedger: signature.includes("Visitor Signature Book ledger")
  },
  performance: {
    externalizedRasterPayloads: !/data:image\/(?:png|webp);base64,/i.test(html),
    ritualMediaOutsideCoreShell: !/\.(?:mp3|opus|ogg|m4a|wav)['"]/i.test(core)
  },
  failures
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
