import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { throw new Error(message); };
const manifest = JSON.parse(read('data/living-archive-v5.5.json'));
const version = JSON.parse(read('version.json'));
const script = read('scripts/v5.5-living-archive.js');
const css = read('styles/v5.5-living-archive.css');
const releaseStatus = read('scripts/v5.4.5-release-status.js');
const sw = read('sw.js');
const batch01 = JSON.parse(read('data/preservation-batch-2026-08-18.json'));
const batch02 = JSON.parse(read('data/preservation-batch-2026-08-18-02.json'));
const dedupe = JSON.parse(read('data/deduplication-2026-08-18.json'));

if (manifest.schema !== 'temple-of-maat/living-archive-v1') fail('Living Archive schema mismatch');
if (manifest.version !== '5.5.0') fail(`Living Archive dataset version mismatch: ${manifest.version}`);
if (version.version !== '5.5.1') fail(`Portal must be v5.5.1, found ${version.version}`);
if (!String(version.build || '').includes('v5.5.1')) fail(`Portal build must identify the v5.5.1 checkpoint, found ${version.build}`);
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

if (batch01.batchId !== '2026-08-18-preservation-batch-01') fail('Batch 01 registry ID changed unexpectedly');
if (batch02.batchId !== '2026-08-18-preservation-batch-02') fail('Batch 02 registry missing or malformed');
if (batch02.counts?.resolvedLocalMasters !== 6) fail('Batch 02 must resolve all six previously local-only masters');
if (batch02.counts?.historicalTextPdfCopies !== 7) fail('Batch 02 historical text/PDF preservation count mismatch');
if (batch02.counts?.historicalArtworkCopies !== 4) fail('Batch 02 historical artwork preservation count mismatch');
if (!batch02.drive?.manifest?.documentId || !batch02.drive?.manifest?.pdfId) fail('Batch 02 manifest document/PDF IDs must be recorded');

const collectionIds = new Set((manifest.collections || []).map((item) => item.id));
for (const id of [
  'preservation.batch02.manifest',
  'preservation.audio.natarikailum',
  'preservation.audio.elderion-osiris',
  'preservation.audio.light-upon-crown',
  'preservation.text.dead-sea-scrolls-gematria-docx',
  'preservation.text.dead-sea-scrolls-analysis-docx',
  'preservation.gematria.shem-highfidelity-html',
  'preservation.gematria.numerical-temple-kjv',
  'preservation.gematria.enochic-codex',
  'preservation.text.kybalion-personal',
  'preservation.text.thoth-42-modern',
  'preservation.text.book-of-dead-concordance',
  'preservation.text.thoth-concordance',
  'preservation.text.strategic-evolution-map',
  'preservation.art.dogen-genjokoan',
  'preservation.art.pistis-twelfth-visionary',
  'preservation.art.pistis-twelfth-social',
  'preservation.art.egypt-gnosis-social'
]) if (!collectionIds.has(id)) fail(`Batch 02 Living Archive search record missing: ${id}`);

const verifiedDuplicate = dedupe.verifiedDuplicates?.[0];
if (!verifiedDuplicate) fail('Verified duplicate registry is empty');
if (verifiedDuplicate.sha256 !== 'fdf1ef62a3e0fcaad2a623763a72e8b79ea3c34ca987c39ff43e1dffbbe92a87') fail('Verified duplicate SHA-256 changed unexpectedly');
if (verifiedDuplicate.canonical?.driveId !== '1_EF6SgBq3sG8Kho_1QExbMcqN5RLqZ0Q') fail('Verified duplicate canonical Drive record changed unexpectedly');
if (dedupe.policy?.destructiveCleanup !== false) fail('Deduplication policy must remain non-destructive');

try { new vm.Script(script, { filename: 'v5.5-living-archive.js' }); }
catch (error) { fail(`Living Archive JavaScript does not parse: ${error.message}`); }
try { new vm.Script(sw, { filename: 'sw.js' }); }
catch (error) { fail(`Service worker JavaScript does not parse: ${error.message}`); }

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
if (!releaseStatus.includes("script.dataset.templeLivingArchiveRuntime = '5.5.1'")) fail('Release-status bootstrap does not identify the v5.5.1 portal checkpoint');
if (!releaseStatus.includes('ensureLivingArchive()')) fail('Release-status bootstrap does not load the Living Archive runtime');

const core = sw.match(/const CORE_ASSETS = \[([\s\S]*?)\];/)?.[1] || '';
for (const asset of [
  "'./scripts/v5.5-living-archive.js'",
  "'./styles/v5.5-living-archive.css'",
  "'./data/living-archive-v5.5.json'",
  "'./library/catalog.json'",
  "'./chambers.json'"
]) if (!core.includes(asset)) fail(`Living Archive offline shell asset missing: ${asset}`);
for (const marker of [
  'function isCriticalUiAsset(url)',
  'v5\\.5-living-archive',
  'data\\/living-archive-v5\\.5\\.json',
  'library\\/catalog\\.json',
  "fetch(request, { cache: 'no-store' })"
]) if (!sw.includes(marker)) fail(`Living Archive current-data delivery marker missing: ${marker}`);

for (const path of ['docs/releases/v5.4.0.md', 'docs/releases/v5.5.0.md', 'docs/releases/v5.5.1.md', 'docs/releases/ROLLBACK.md', '.github/rulesets/main-protection.json']) {
  if (!fs.existsSync(path)) fail(`Missing release-governance file: ${path}`);
}

console.log(JSON.stringify({
  ok: true,
  portalVersion: version.version,
  archiveDatasetVersion: manifest.version,
  indexedPoems: manifest.poems.length,
  collections: manifest.collections?.length || 0,
  preservationFolders: Object.keys(manifest.drive.folders).length,
  batch02ResolvedLocalMasters: batch02.counts.resolvedLocalMasters,
  batch02IndexedRecords: [...collectionIds].filter((id) => id.startsWith('preservation.')).length,
  verifiedDuplicates: dedupe.verifiedDuplicates.length,
  offlineShell: true,
  currentDataNetworkFirst: true,
  rollback: manifest.release.rollbackBranch,
  shortcut: 'Ctrl/Cmd+K'
}, null, 2));
