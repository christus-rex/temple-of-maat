import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };

const version = JSON.parse(fs.readFileSync(file('version.json'), 'utf8'));
if (version.version !== '5.2.4') fail(`Expected Living Codex version 5.2.4, found ${version.version}`);

for (const relative of [
  'scripts/v5.2.4-living-codex.js',
  'styles/v5.2.4-living-codex.css',
  'scripts/v5.3-threshold.js',
  'scripts/validate-v5.mjs',
  'sw.js'
]) {
  if (!fs.existsSync(file(relative))) fail(`Missing v5.2.4 file: ${relative}`);
}

const codex = fs.readFileSync(file('scripts/v5.2.4-living-codex.js'), 'utf8');
const threshold = fs.readFileSync(file('scripts/v5.3-threshold.js'), 'utf8');
const sw = fs.readFileSync(file('sw.js'), 'utf8');
const css = fs.readFileSync(file('styles/v5.2.4-living-codex.css'), 'utf8');

try { new vm.Script(codex, { filename: 'scripts/v5.2.4-living-codex.js' }); }
catch (error) { fail(`Living Codex JavaScript does not parse: ${error.message}`); }
try { new vm.Script(threshold, { filename: 'scripts/v5.3-threshold.js' }); }
catch (error) { fail(`Threshold JavaScript does not parse: ${error.message}`); }

const rawMatch = codex.match(/const RAW = `([\s\S]*?)`;/);
if (!rawMatch) fail('Living Codex 72-record source table is missing');
const rows = rawMatch[1].trim().split('\n');
if (rows.length !== 72) fail(`Expected 72 Living Codex records, found ${rows.length}`);

const parsed = rows.map((row, index) => {
  const fields = row.split('|');
  if (fields.length !== 15) fail(`Living Codex record ${index + 1} has ${fields.length} fields instead of 15`);
  return {
    id: fields[0],
    hebrew: fields[1],
    angel: fields[5],
    daemon: fields[10],
    strength: fields[11],
    ciphers: fields[12]
  };
});

for (let index = 0; index < 72; index += 1) {
  const expected = String(index + 1).padStart(2, '0');
  if (parsed[index].id !== expected) fail(`Expected Codex record ${expected}, found ${parsed[index].id}`);
  if (!parsed[index].hebrew || !parsed[index].angel || !parsed[index].daemon) fail(`Codex record ${expected} is incomplete`);
}
if (new Set(parsed.map((record) => record.id)).size !== 72) fail('Living Codex record IDs are not unique');

const strengthCounts = parsed.reduce((counts, record) => {
  counts[record.strength] = (counts[record.strength] || 0) + 1;
  return counts;
}, {});
const expectedStrengths = { 'Single exact': 24, 'Double match': 32, 'Triple lock': 13, 'Tetrad exact': 3 };
for (const [strength, expected] of Object.entries(expectedStrengths)) {
  if (strengthCounts[strength] !== expected) fail(`Expected ${expected} ${strength} records, found ${strengthCounts[strength] || 0}`);
}
const tetrads = parsed.filter((record) => record.strength === 'Tetrad exact').map((record) => record.id).join(',');
if (tetrads !== '13,37,42') fail(`Expected tetrad-exact records 13,37,42, found ${tetrads}`);

for (const marker of [
  'Reversal, not gematria, creates the 72.',
  'The 72 triplets and the 72 angels are related but not identical layers.',
  'numerical correspondences, not claims of historical or metaphysical identity',
  'Hebrew triplet · Layer B',
  'Gematria twin · later analytical layer',
  'Temple chamber layer'
]) {
  if (!codex.includes(marker)) fail(`Missing source/discernment marker: ${marker}`);
}

for (const selector of ['.tm2-wallpaper', '.tm2-parental-download', '.tm2-plate-download']) {
  if (!codex.includes(selector)) fail(`Living Codex vault no longer relays existing collectible ${selector}`);
}
if (!codex.includes('Open Codex Record') || !codex.includes('Continue at Chamber')) fail('Living Codex navigation controls are incomplete');
if (!codex.includes("const LAST_CHAMBER_KEY = 'temple_last_chamber'")) fail('Continue Journey persistence key is missing');
if (!codex.includes("audio.preload = 'metadata'")) fail('Ma’at chant player must use metadata-only preload');
if (/\bautoplay\b\s*=|setAttribute\(\s*['\"]autoplay/i.test(codex)) fail('Ma’at chant player must never enable autoplay');
if (!codex.includes("button('Play'") || !codex.includes("button('Pause'") || !codex.includes("button('Stop'")) fail('Ma’at chant Play/Pause/Stop transport is incomplete');

if (!threshold.includes("script.src = './scripts/v5.2.4-living-codex.js'")) fail('Threshold layer does not load the Living Codex');
if (!threshold.includes("root.setAttribute('inert', '')") || !threshold.includes("event.target.closest('a[data-temple-entry]')")) fail('Manual entrance gate protections were not preserved');
if (!threshold.includes("document.body.classList.add('temple-app-ready')")) fail('Manual entry reveal state is missing');

for (const asset of ['./styles/v5.2.4-living-codex.css', './scripts/v5.2.4-living-codex.js']) {
  if (!sw.includes(`'${asset}'`)) fail(`Service worker does not cache ${asset}`);
}
if (!sw.includes('temple-maat-pwa-v5.2.4-living-codex')) fail('Service worker cache namespace was not bumped for v5.2.4');

for (const marker of ['.tm524-codex-body', '.tm524-vault-grid', '.tm524-transport', 'body:not(.temple-app-ready) .tm524-dock']) {
  if (!css.includes(marker)) fail(`Living Codex CSS marker is missing: ${marker}`);
}

console.log(`Validated Temple ${version.version} Living Codex: ${rows.length} records; strengths ${JSON.stringify(strengthCounts)}; manual entry, collectibles, return journey, and no-autoplay chant controls preserved.`);
