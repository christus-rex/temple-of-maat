import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };
const read = (relative) => fs.readFileSync(file(relative), 'utf8');

for (const relative of ['scripts/v5.2.8-temple-library.js','styles/v5.2.8-temple-library.css','library/catalog.json','library/schema/personal-state.schema.json','scripts/v5.3-threshold.js']) {
  if (!fs.existsSync(file(relative))) fail(`Missing Library UI dependency: ${relative}`);
}

const js = read('scripts/v5.2.8-temple-library.js');
const css = read('styles/v5.2.8-temple-library.css');
const threshold = read('scripts/v5.3-threshold.js');
const catalog = JSON.parse(read('library/catalog.json'));
try { new vm.Script(js, { filename: 'v5.2.8-temple-library.js' }); } catch (error) { fail(`Temple Library JS does not parse: ${error.message}`); }

const records = ['traditions','sources','studies','discernments','correspondences'].flatMap((key) => catalog[key] || []);
if (records.length < 10) fail(`Library UI release gate expects a populated catalog, found ${records.length} records`);
if (catalog.traditions.length < 2 || catalog.sources.length < 2 || catalog.studies.length < 2) fail('Library UI requires at least two traditions and two source/study pairs');

for (const marker of [
  "const STATE_KEY = 'temple_library_personal_state_v1'",
  "const STATE_SCHEMA = 'temple-of-maat/library-personal-state-v1'",
  "fetch(CATALOG_URL",
  "fetch(`./${record.contentLocation}`",
  "identityClaim: false",
  "provenanceLayer: 'L4'",
  'Export Personal Library JSON',
  'Save Private Correspondence',
  'stay on this device unless you explicitly export',
  'The 72-chamber Temple remains fully usable',
  'window.TempleLibrary = Object.freeze',
  "document.getElementById('tm524-dock')",
  "artifactLauncher.dataset.templeLibraryLauncher = 'artifact-mobile'"
]) {
  if (!js.includes(marker)) fail(`Library UI contract marker missing: ${marker}`);
}

if (!threshold.includes("loadEnhancement('./scripts/v5.2.8-temple-library.js', 'temple-library')")) fail('Threshold does not load the v5.2.8 Temple Library enhancement');
for (const marker of [
  'body:not(.temple-app-ready) .tm2-artifact-backdrop',
  'visibility: hidden !important',
  'pointer-events: none !important'
]) {
  if (!threshold.includes(marker)) fail(`Manual threshold hash-reload artifact guard missing: ${marker}`);
}
if (/localStorage\.setItem\([^,]+catalog/i.test(js)) fail('Public Library catalog must not be written into personal local state');
const loadCatalogBody = js.match(/async function loadCatalog\(\) \{([\s\S]*?)\n  \}\n\n  function recordSearchText/);
if (!loadCatalogBody) fail('Could not inspect loadCatalog() for lazy-loading policy');
if (loadCatalogBody[1].includes('contentLocation')) fail('Library indexes must remain lazy rather than loading with the catalog');

for (const marker of [
  '.tm528-body',
  '.tm528-reader',
  'overflow-wrap:anywhere',
  '@media(max-width:760px)',
  'body.temple-library-open',
  'body.temple-artifact-open .tm528-launcher',
  '.tm528-artifact-launcher',
  'body.temple-app-ready.temple-artifact-open:not(.temple-library-open) .tm528-artifact-launcher'
]) {
  if (!css.includes(marker)) fail(`Library mobile/interaction CSS marker missing: ${marker}`);
}
if (!css.includes('grid-template-columns:1fr') || !css.includes('overflow:hidden')) fail('Library mobile layout must avoid horizontal overflow');

const sourceWithRights = catalog.sources.filter((item) => item.rights?.attribution).length;
if (sourceWithRights < 2) fail('Library reading UI needs at least two source records with attribution/rights metadata');

console.log(`Validated Temple Library UI contract: ${records.length} public records across ${catalog.traditions.length} traditions; lazy indexes, provenance/type search, source rights, local bookmarks/notes/L4 chamber links, personal export, mobile artifact access without restoring the bottom dock, mobile overflow guards, hash-reload threshold protection, and failure isolation present.`);
