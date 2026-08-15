import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const routePath = 'pilgrimages/enoch.v1.json';
const schemaPath = 'pilgrimages/schema/pilgrimage-route.schema.json';
const runtimePath = 'scripts/v5.3-pilgrimage-routes.js';
const stylePath = 'styles/v5.3-pilgrimage-routes.css';
const docsPath = 'docs/ENOCH_PILGRIMAGE.md';

for (const file of [routePath, schemaPath, runtimePath, stylePath, docsPath]) {
  assert(fs.existsSync(path.join(root, file)), `Missing Enoch pilgrimage file: ${file}`);
}

const route = json(routePath);
const schema = json(schemaPath);
const runtime = read(runtimePath);
const styles = read(stylePath);
const docs = read(docsPath);
const threshold = read('scripts/v5.3-threshold.js');
const sw = read('sw.js');
const workflow = read('.github/workflows/validate-v5.yml');

assert(route.schema === 'temple-of-maat/pilgrimage-route-v1', 'Unexpected pilgrimage route schema.');
assert(route.version === '1.0.0', 'Unexpected Enoch route version.');
assert(route.routeId === 'route.enoch-angelic-mirror', 'Unexpected Enoch route id.');
assert(route.privacy === 'personal-state-device-local', 'Enoch route must declare device-local personal state.');
assert(schema?.properties?.privacy?.const === 'personal-state-device-local', 'Route schema must lock the device-local privacy contract.');

const authoritySet = new Set(route.authorityLevels);
for (const level of ['HISTORICAL', 'RECONSTRUCTED', 'MODERN', 'PERSONAL']) {
  assert(authoritySet.has(level), `Missing authority level ${level}.`);
}

assert(/eight-gate route is a modern personal Temple structure/i.test(route.structureNote), 'Eight-gate form must be labeled modern/personal.');
assert(/not presented as historical Enochian architecture/i.test(route.structureNote), 'Eight-gate form must reject historical backdating.');
assert(/Truth before power/i.test(route.vow), 'Route vow is missing.');
assert(/do not command what I have not understood/i.test(route.routeLaw), 'Route law is missing accountable-command boundary.');
assert(/do not believe what I have not tested/i.test(route.routeLaw), 'Route law is missing verification boundary.');

assert(Array.isArray(route.sourceRefs) && route.sourceRefs.length >= 4, 'Expected Angelic Mirror plus three Sloane source references.');
const sourceIds = new Set();
for (const source of route.sourceRefs) {
  assert(/^source\./.test(source.id), `Invalid source id ${source.id}`);
  assert(!sourceIds.has(source.id), `Duplicate source id ${source.id}`);
  sourceIds.add(source.id);
  assert(['HISTORICAL', 'RECONSTRUCTED', 'MODERN', 'PERSONAL'].includes(source.authority), `Invalid source authority ${source.authority}`);
  assert(Array.isArray(source.locators) && source.locators.length, `Source ${source.id} requires locators.`);
}
for (const id of ['source.angelic-mirror-2026', 'source.dee-sloane-3188', 'source.dee-sloane-3189', 'source.dee-sloane-3191']) {
  assert(sourceIds.has(id), `Required source reference missing: ${id}`);
}

assert(Array.isArray(route.gates) && route.gates.length === 8, `Enoch route must contain exactly eight gates, found ${route.gates?.length}.`);
const gateIds = new Set();
for (let index = 0; index < route.gates.length; index += 1) {
  const gate = route.gates[index];
  const expected = index + 1;
  assert(gate.ordinal === expected, `Gate ordinal ${gate.ordinal} is not sequential at position ${expected}.`);
  assert(gate.id === `enoch-gate-${String(expected).padStart(2, '0')}`, `Unexpected gate id ${gate.id}.`);
  assert(!gateIds.has(gate.id), `Duplicate gate id ${gate.id}.`);
  gateIds.add(gate.id);
  assert(gate.title && gate.subtitle && gate.teaching && gate.practice, `Gate ${gate.id} is incomplete.`);
  assert(Array.isArray(gate.authorityLevels) && gate.authorityLevels.length, `Gate ${gate.id} requires authority levels.`);
  gate.authorityLevels.forEach((level) => assert(authoritySet.has(level), `Gate ${gate.id} has unsupported authority ${level}.`));
  assert(Array.isArray(gate.sourceRefs) && gate.sourceRefs.length, `Gate ${gate.id} requires source references.`);
  gate.sourceRefs.forEach((id) => assert(sourceIds.has(id), `Gate ${gate.id} references unresolved source ${id}.`));
  for (const field of ['observation', 'interpretation', 'verification', 'conduct']) {
    assert(typeof gate.journalPrompts?.[field] === 'string' && gate.journalPrompts[field].length > 20, `Gate ${gate.id} requires ${field} prompt.`);
  }
  assert(typeof gate.completionCondition === 'string' && gate.completionCondition.length > 10, `Gate ${gate.id} requires a completion condition.`);
}

const gate1 = route.gates[0];
const gate2 = route.gates[1];
const gate6 = route.gates[5];
const gate7 = route.gates[6];
const gate8 = route.gates[7];
assert(gate1.stopCondition && /coercion|harm|isolation|sleep/i.test(gate1.stopCondition), 'Gate 1 must contain the grounding/stop covenant.');
assert(/not the same corpus|not one|related/i.test(gate2.teaching) && /Enoch/i.test(gate2.teaching) && /Dee/i.test(gate2.teaching), 'Gate 2 must preserve Enoch versus Dee–Kelley corpus distinction.');
assert(/do not undertake a full Aethyr ascent/i.test(gate6.practice), 'Gate 6 must preserve the first-month no-full-ascent rule.');
assert(gate6.stopCondition && /compulsion|fear|sleep|grandiose/i.test(gate6.stopCondition), 'Gate 6 must preserve visionary grounding conditions.');
assert(gate7.authorityLevels.length === 2 && gate7.authorityLevels.includes('MODERN') && gate7.authorityLevels.includes('PERSONAL'), 'ZID gate must remain explicitly modern/personal.');
assert(!gate7.authorityLevels.includes('HISTORICAL'), 'Personal ZID indexing must not be labeled historical.');
assert(/not a historical Enochian divination rule/i.test(gate7.teaching), 'ZID indexing disclaimer is required.');
assert(/lens, not the universe/i.test(gate7.teaching), 'Unselected-witness humility boundary is required.');
assert(/PROCEED, PAUSE, or STUDY FURTHER/i.test(gate8.practice), 'Final gate must require an explicit integration decision.');
assert(/sleep|work|relationships|safety/i.test(gate8.stopCondition || ''), 'Final gate must test ordinary-life impact.');

assert(runtime.includes("const STATE_KEY = 'temple_pilgrimage_enoch_v1'"), 'Runtime must use dedicated Enoch device-local state key.');
assert(runtime.includes("const STATE_SCHEMA = 'temple-of-maat/pilgrimage-state-v1'"), 'Runtime state schema missing.');
assert(runtime.includes('Observation → Interpretation → Verification → Conduct'), 'Reality Record sequence missing from runtime.');
assert(runtime.includes('Personal testimony is not written into the public Knowledge Kernel or Relationship Graph.'), 'Runtime must state public/private boundary.');
assert(!/localStorage\.setItem\([^\n]*(relationship|knowledge|library)/i.test(runtime), 'Runtime must not write personal route state into public graph/kernel/library keys.');
assert(!/fetch\([^\n]*method\s*:\s*['\"](?:POST|PUT|PATCH|DELETE)/i.test(runtime), 'Pilgrimage runtime must not upload personal state.');
assert(runtime.includes('data-enoch-route') || runtime.includes('enochRoute'), 'Runtime must expose a stable Enoch route launcher marker.');

assert(styles.includes('@media(max-width:760px)'), 'Enoch route styles require narrow-screen layout.');
assert(styles.includes('@media(max-width:430px)'), 'Enoch route styles require phone layout.');
assert(styles.includes('min-height:44px'), 'Enoch route controls must preserve 44px touch targets.');

assert(threshold.includes("loadEnhancement('./scripts/v5.3-pilgrimage-routes.js', 'pilgrimage-routes')"), 'Threshold must load pilgrimage-routes enhancement.');
for (const asset of [
  './pilgrimages/enoch.v1.json',
  './pilgrimages/schema/pilgrimage-route.schema.json',
  './styles/v5.3-pilgrimage-routes.css',
  './scripts/v5.3-pilgrimage-routes.js'
]) {
  assert(sw.includes(`'${asset}'`), `Service-worker core is missing ${asset}`);
}
assert(workflow.includes('node scripts/validate-enoch-pilgrimage-v1.mjs'), 'Canonical validation must run Enoch pilgrimage validator.');
assert(docs.includes('Observation → Interpretation → Verification → Conduct'), 'Enoch pilgrimage documentation must define the Reality Record sequence.');
assert(docs.includes('does **not** replace the chamber journey'), 'Documentation must preserve the existing 72-chamber Journey.');

console.log(`Enoch pilgrimage v1 validated: ${route.gates.length} gates, ${route.sourceRefs.length} source references, device-local Reality Record.`);
