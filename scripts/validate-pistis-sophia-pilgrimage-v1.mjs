import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const routePath = 'pilgrimages/pistis-sophia.v1.json';
const schemaPath = 'pilgrimages/schema/pilgrimage-route.schema.json';
const runtimePath = 'scripts/v5.3-pilgrimage-routes.js';
const docsPath = 'docs/PISTIS_SOPHIA_PILGRIMAGE.md';
const stylePath = 'styles/v5.3-pilgrimage-routes.css';

for (const file of [routePath, schemaPath, runtimePath, docsPath, stylePath]) {
  assert(fs.existsSync(path.join(root, file)), `Missing Pistis Sophia pilgrimage file: ${file}`);
}

const route = json(routePath);
const schema = json(schemaPath);
const runtime = read(runtimePath);
const docs = read(docsPath);
const styles = read(stylePath);
const workflow = read('.github/workflows/validate-v5.yml');

assert(route.schema === 'temple-of-maat/pilgrimage-route-v1', 'Unexpected route schema.');
assert(route.version === '1.0.0', 'Unexpected Pistis Sophia route version.');
assert(route.routeId === 'route.pistis-sophia-descent-return', 'Unexpected Pistis Sophia route id.');
assert(route.title === 'Pistis Sophia — The Descent and Return', 'Unexpected route title.');
assert(route.privacy === 'personal-state-device-local', 'Pistis Sophia personal state must remain device-local.');
assert(schema?.properties?.privacy?.const === 'personal-state-device-local', 'Shared route schema must preserve device-local privacy.');
assert(Array.isArray(route.authorityLevels) && route.authorityLevels.includes('HISTORICAL') && route.authorityLevels.includes('MODERN') && route.authorityLevels.includes('PERSONAL'), 'Route authority levels must expose historical, modern, and personal layers.');
assert(!route.authorityLevels.includes('RECONSTRUCTED'), 'Do not invent a reconstruction layer where this route does not need one.');
assert(/thirteen stations/i.test(route.structureNote), 'Route structure must explicitly name thirteen stations.');
assert(/does not assign a universal psychological meaning/i.test(route.structureNote), 'Route must reject backdating modern psychological meanings into the ancient text.');
assert(/not presented as an ancient ritual sequence/i.test(route.structureNote), 'Route must identify the thirteen-station retelling as modern rather than ancient ritual architecture.');
assert(/faith become discerning/i.test(route.vow) && /wisdom become compassionate/i.test(route.vow) && /right action/i.test(route.vow), 'Returning Light vow is incomplete.');
assert(/reality, freedom, compassion, repair, and conduct/i.test(route.routeLaw), 'Route law must preserve its explicit fruit test.');

const expectedFields = [
  ['downward-draw', 'What drew me downward'],
  ['mistaken-light', 'What I mistook for light'],
  ['what-was-lost', 'What was lost'],
  ['recognition', 'What I recognized'],
  ['returning-wisdom', 'What wisdom returns with me']
];
assert(route.recordTitle === 'Private Record of the Returning Light', 'Unexpected private record title.');
assert(route.recordSequence === expectedFields.map(([, label]) => label).join(' → '), 'Returning Light record sequence changed unexpectedly.');
assert(Array.isArray(route.recordFields) && route.recordFields.length === expectedFields.length, 'Returning Light record must contain five fields.');
expectedFields.forEach(([key, label], index) => {
  assert(route.recordFields[index]?.key === key && route.recordFields[index]?.label === label, `Record field ${index + 1} changed unexpectedly.`);
});

const sourceIds = new Set();
assert(Array.isArray(route.sourceRefs) && route.sourceRefs.length === 3, 'Expected three declared source anchors.');
for (const source of route.sourceRefs) {
  assert(/^source\./.test(source.id), `Invalid source id ${source.id}.`);
  assert(!sourceIds.has(source.id), `Duplicate source id ${source.id}.`);
  sourceIds.add(source.id);
  assert(['HISTORICAL', 'MODERN', 'PERSONAL'].includes(source.authority), `Unsupported source authority ${source.authority}.`);
  assert(Array.isArray(source.locators) && source.locators.length, `Source ${source.id} requires locators.`);
  assert(Array.isArray(source.limitations) && source.limitations.length, `Source ${source.id} requires explicit limitations.`);
}
for (const id of ['source.pistis-sophia-mead-1921', 'source.pistis-sophia-returning-light-2026', 'source.pistis-sophia-faith-wisdom-2026']) {
  assert(sourceIds.has(id), `Required source anchor missing: ${id}`);
}

const expectedTitles = [
  'The Glimpse',
  'The Desire',
  'The Counterfeit Radiance',
  'The Descent',
  'The Loss of Power',
  'The First Cry',
  'The Delay',
  'The Mocking Powers',
  'The Witnesses',
  'The Turning',
  'The Two Powers of Help',
  'The Restoration',
  'The Commission'
];
assert(Array.isArray(route.gates) && route.gates.length === 13, `Pistis Sophia route must contain 13 stations, found ${route.gates?.length}.`);
for (let index = 0; index < route.gates.length; index += 1) {
  const station = route.gates[index];
  const ordinal = index + 1;
  assert(station.ordinal === ordinal, `Station ${ordinal} ordinal mismatch.`);
  assert(station.id === `pistis-sophia-gate-${String(ordinal).padStart(2, '0')}`, `Station ${ordinal} id mismatch.`);
  assert(station.title === expectedTitles[index], `Station ${ordinal} title mismatch: ${station.title}`);
  assert(station.subtitle && station.teaching && station.practice && station.sourceAnchor, `Station ${ordinal} is incomplete.`);
  assert(Array.isArray(station.sourceRefs) && station.sourceRefs.length, `Station ${ordinal} requires source anchors.`);
  station.sourceRefs.forEach((id) => assert(sourceIds.has(id), `Station ${ordinal} references unresolved source ${id}.`));
  expectedFields.forEach(([key]) => assert(typeof station.journalPrompts?.[key] === 'string' && station.journalPrompts[key].length > 20, `Station ${ordinal} requires ${key} prompt.`));
  assert(typeof station.completionCondition === 'string' && station.completionCondition.length > 15, `Station ${ordinal} requires a completion condition.`);
}

const [s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13] = route.gates;
assert(/sacred, psychological, relational, situational, or ordinary/i.test(s1.practice), 'Station 1 must preserve multiple interpretations rather than premature certainty.');
assert(/need beneath/i.test(s2.teaching) && /alternative/i.test(s2.practice), 'Station 2 must distinguish need from object.');
assert(/reality, freedom, compassion, and repair/i.test(s3.practice), 'Station 3 must preserve the Four-Fruit Test.');
assert(/without moral adjectives/i.test(s4.practice), 'Station 4 must preserve the non-totalizing descent timeline.');
assert(/body, calendar, finances, work, relationships, sleep/i.test(s5.practice), 'Station 5 must inventory measurable ordinary-life effects.');
assert(/reality-testing|basic needs|sleep loss/i.test(s5.stopCondition || ''), 'Station 5 must contain practical safety/grounding limits.');
assert(/exact sentence/i.test(s6.practice) && /trustworthy person/i.test(s6.practice), 'Station 6 must move truthful speech toward practical response.');
assert(/not a command to remain in danger/i.test(s7.teaching), 'Station 7 must reject romanticizing preventable harm.');
assert(/emergency care|safety planning|medical treatment/i.test(s7.stopCondition || ''), 'Station 7 must preserve time-sensitive support boundaries.');
assert(/correction without contempt/i.test(s8.subtitle), 'Station 8 must distinguish correction from contempt.');
assert(/three columns/i.test(s9.practice) && /trustworthy witness/i.test(s9.practice), 'Station 9 must use accountable witnessing rather than solitary certainty.');
assert(/repair/i.test(s10.teaching) && /irreversible harm/i.test(s10.practice), 'Station 10 must turn repentance into proportionate repair.');
assert(/return capacity rather than create a cult of the rescuer/i.test(s11.teaching), 'Station 11 must reject dependency on the helper.');
assert(/service, not revenge/i.test(s12.subtitle) && /capacity/i.test(s12.teaching), 'Station 12 must measure restoration by capacity and service.');
assert(s13.authorityLevels.length === 2 && s13.authorityLevels.includes('MODERN') && s13.authorityLevels.includes('PERSONAL') && !s13.authorityLevels.includes('HISTORICAL'), 'Station 13 Commission must remain explicitly modern/personal.');
assert(/thirteen lines/i.test(s13.practice) && /observable behavior/i.test(s13.practice), 'Station 13 must end in an observable thirteen-line rule of life.');
assert(/submission, sexual access, money, secrecy/i.test(s13.teaching), 'Station 13 must preserve anti-domination boundaries.');

assert(runtime.includes("routeId: 'route.pistis-sophia-descent-return'"), 'Multi-route runtime must register Pistis Sophia.');
assert(runtime.includes("url: './pilgrimages/pistis-sophia.v1.json'"), 'Runtime must load the reviewed Pistis Sophia route file.');
assert(runtime.includes("stateKey: 'temple_pilgrimage_pistis_sophia_v1'"), 'Runtime must use a dedicated Pistis Sophia device-local state key.');
assert(runtime.includes("const STATE_SCHEMA = 'temple-of-maat/pilgrimage-state-v1'"), 'Shared state schema missing.');
assert(runtime.includes("version: '1.1.0'"), 'Multi-route API version must be 1.1.0.');
assert(runtime.includes('defaultRecordFields(route)'), 'Runtime must support route-specific private record fields.');
assert(runtime.includes('Personal testimony is not written into the public Knowledge Kernel or Relationship Graph.'), 'Runtime must state the public/private boundary.');
assert(!/fetch\([^\n]*method\s*:\s*['\"](?:POST|PUT|PATCH|DELETE)/i.test(runtime), 'Pilgrimage runtime must not upload private route state.');
assert(!/localStorage\.setItem\([^\n]*(relationship|knowledge|library)/i.test(runtime), 'Private route state must not be written to public data stores.');
assert(styles.includes('.tm53-route-gallery'), 'Multi-route gallery styles missing.');
assert(styles.includes('@media(max-width:760px)') && styles.includes('@media(max-width:430px)'), 'Pistis Sophia route requires mobile layouts.');
assert(workflow.includes('node scripts/validate-pistis-sophia-pilgrimage-v1.mjs'), 'Canonical validation must run Pistis Sophia validator.');
assert(docs.includes('What drew me downward → What I mistook for light → What was lost → What I recognized → What wisdom returns with me'), 'Documentation must preserve the five-part Returning Light record.');
assert(docs.includes('does not teach that pain must continue before help is deserved'), 'Documentation must preserve anti-romanticization of suffering.');

console.log(`Pistis Sophia pilgrimage v1 validated: ${route.gates.length} stations, ${route.sourceRefs.length} source anchors, ${route.recordFields.length}-field device-local Returning Light record.`);
