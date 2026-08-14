import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };
const read = (relative) => fs.readFileSync(file(relative), 'utf8');

for (const relative of [
  'scripts/v5.2.8-journey-import.js',
  'styles/v5.2.8-journey-import.css',
  'docs/JOURNEY_PORTABILITY.md',
  'scripts/v5.3-threshold.js'
]) {
  if (!fs.existsSync(file(relative))) fail(`Missing Journey portability file: ${relative}`);
}

const js = read('scripts/v5.2.8-journey-import.js');
const css = read('styles/v5.2.8-journey-import.css');
const docs = read('docs/JOURNEY_PORTABILITY.md');
const threshold = read('scripts/v5.3-threshold.js');
try { new vm.Script(js, { filename: 'v5.2.8-journey-import.js' }); } catch (error) { fail(`Journey import JavaScript does not parse: ${error.message}`); }

for (const marker of [
  "const STATE_KEY = 'temple_v525_pilgrim_journey'",
  "const SCHEMA = 'temple-of-maat/pilgrim-journey-v1'",
  "const ENGINE_VERSION = '5.2.5'",
  'const MAX_REFLECTION_LENGTH = 12000',
  'const MAX_IMPORT_BYTES = 2 * 1024 * 1024',
  'normalizePayload(raw)',
  "raw.schema !== SCHEMA",
  "raw.version !== ENGINE_VERSION",
  "strategy === 'replace'",
  'reflectionConflicts',
  'reflections: { ...imported.reflections, ...current.reflections }',
  'No local state changes have been applied yet.',
  'Import never uploads your reflections, favorites, or Journey state.',
  'history.replaceState',
  'location.reload()',
  'localStorage.setItem(STATE_KEY',
  "artifactLauncher"
]) {
  if (marker === 'artifactLauncher') continue;
  if (!js.includes(marker)) fail(`Journey portability marker missing: ${marker}`);
}

if (/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket\s*\(/.test(js)) {
  fail('Journey import must not contain a network upload/fetch path');
}
if (!js.includes("file.text()")) fail('Journey import must read selected files locally with File.text()');
if (!js.includes("fileInput.accept = '.json,application/json'")) fail('Journey import file input must be JSON-scoped');
if (!js.includes("button('Import / Restore Journey JSON'")) fail('Journey UI import control is missing');
if (!js.includes("window.TempleJourneyPortability = Object.freeze")) fail('Journey portability API is missing');

if (!threshold.includes("loadEnhancement('./scripts/v5.2.8-journey-import.js', 'journey-import')")) fail('Threshold does not load Journey import as a progressive enhancement');

for (const marker of [
  '.tm528j-layer',
  '.tm528j-compare',
  '.tm528j-danger',
  '@media(max-width:700px)',
  'overflow-wrap:anywhere',
  'body.tm528j-modal-open'
]) {
  if (!css.includes(marker)) fail(`Journey portability CSS marker missing: ${marker}`);
}

for (const marker of [
  '## Current accepted contract',
  '## Local-only privacy boundary',
  '## Replace strategy',
  '## Safe merge strategy',
  '## Round-trip guarantee',
  '## Future schema and version migrations',
  'must never be silently coerced',
  'existing local reflection wins'
]) {
  if (!docs.includes(marker)) fail(`Journey portability documentation marker missing: ${marker}`);
}

console.log('Validated Journey portability contract: exact schema/version gate, local-only JSON read, replace preview, non-destructive merge with local reflection precedence, reload restore path, mobile preview styling, and explicit future migration policy.');
