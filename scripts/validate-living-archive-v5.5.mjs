import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { throw new Error(message); };
const manifest = JSON.parse(read('data/living-archive-v5.5.json'));
const version = JSON.parse(read('version.json'));
const script = read('scripts/v5.5-living-archive.js');
const css = read('styles/v5.5-living-archive.css');
const releaseStatus = read('scripts/v5.4.5-release-status.js');

if (manifest.schema !== 'temple-of-maat/living-archive-v1') fail('Living Archive schema mismatch');
if (manifest.version !== '5.5.0') fail(`Living Archive version mismatch: ${manifest.version}`);
if (version.version !== '5.5.0') fail(`Portal must be v5.5.0, found ${version.version}`);
if (!Array.isArray(manifest.poems) || manifest.poems.length < 5) fail('Living Archive must preserve at least five poem records');
if (new Set(manifest.poems.map((item) => item.id)).size !== manifest.poems.length) fail('Living Archive poem IDs must be unique');
for (const poem of manifest.poems) {
  for (const key of ['id', 'title', 'sourceId', 'sourceUrl']) if (!poem[key]) fail(`Poem record missing ${key}: ${poem.id || '(unknown)'}`);
  if (!Array.isArray(poem.provenanceLayers) || !poem.provenanceLayers.includes('L4')) fail(`Poem ${poem.id} must remain explicitly L4`);
}
for (const key of ['artworkMasters', 'audioMasters', 'textPdfMasters', 'releaseBackups', 'manifestsProvenance']) {
  const folder = manifest.drive?.folders?.[key];
  if (!folder?.id || !folder?.url?.startsWith('https://drive.google.com/drive/folders/')) fail(`Missing Drive preservation folder: ${key}`);
}
if (manifest.release?.knownGoodCommit !== 'ea3c90cb1257e82cd96be480921bf4fdc37dc614') fail('v5.4 known-good rollback commit changed unexpectedly');
if (manifest.release?.rollbackBranch !== 'release/v5.4.0') fail('v5.4 rollback branch is not recorded');

try { new vm.Script(script, { filename: 'v5.5-living-archive.js' }); }
catch (error) { fail(`Living Archive JavaScript does not parse: ${error.message}`); }

for (const marker of [
  "const MANIFEST_URL = './data/living-archive-v5.5.json'",
  "const LIBRARY_URL = './library/catalog.json'",
  "const CHAMBERS_URL = './chambers.json'",
  'window.TempleLivingArchive = Object.freeze',
  "temple_living_archive_state_v1",
  "event.key.toLowerCase() === 'k'",
  "window.TempleLibrary?.open"
]) if (!script.includes(marker)) fail(`Living Archive runtime marker missing: ${marker}`);

for (const marker of [
  '.temple-living-archive__controls',
  '.temple-living-archive__results',
  '@media(max-width:760px)',
  'min-height:44px',
  ':focus-visible'
]) if (!css.includes(marker)) fail(`Living Archive accessibility/mobile style missing: ${marker}`);

if (!releaseStatus.includes("const LIVING_ARCHIVE_SRC = './scripts/v5.5-living-archive.js'")) fail('Release-status bootstrap does not declare the Living Archive runtime');
if (!releaseStatus.includes('ensureLivingArchive()')) fail('Release-status bootstrap does not load the Living Archive runtime');
for (const path of ['docs/releases/v5.4.0.md', 'docs/releases/v5.5.0.md', 'docs/releases/ROLLBACK.md', '.github/rulesets/main-protection.json']) {
  if (!fs.existsSync(path)) fail(`Missing release-governance file: ${path}`);
}

console.log(JSON.stringify({
  ok: true,
  version: version.version,
  indexedPoems: manifest.poems.length,
  collections: manifest.collections?.length || 0,
  preservationFolders: Object.keys(manifest.drive.folders).length,
  rollback: manifest.release.rollbackBranch,
  shortcut: 'Ctrl/Cmd+K'
}, null, 2));
