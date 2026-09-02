import fs from 'node:fs';

const registry = JSON.parse(fs.readFileSync('research/maat-forty-two-hall.v1.json', 'utf8'));
const moduleText = fs.readFileSync('scripts/v5.4.1-forty-two-hall.mjs', 'utf8');
const threshold = fs.readFileSync('scripts/v5.3-threshold.js', 'utf8');

const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(registry.schema === 'temple-of-maat/maat-forty-two-hall-v1', 'schema mismatch');
assert(registry.version === '1.0.0', 'version mismatch');
assert(registry.privacy === 'public-canonical-only', 'privacy must remain public-canonical-only');
assert(Array.isArray(registry.slots) && registry.slots.length === 42, 'registry must contain exactly 42 slots');
assert(registry.slots.every((slot, index) => slot.number === index + 1), 'slots must be uniquely ordered 1..42');
assert(registry.slots.slice(0, 3).map((slot) => slot.recordId).join('|') === 'declaration.maat.001|declaration.maat.002|declaration.maat.003', 'first three slots must preserve Knowledge Kernel seed IDs');
assert(registry.slots.filter((slot) => slot.recordId).length === 3, 'only three reviewed/provisional seed declarations may be mapped in v1');
assert(registry.slots.filter((slot) => !slot.recordId && slot.status === 'UNMAPPED').length === 39, 'remaining 39 slots must be explicitly UNMAPPED');
assert(registry.slots.every((slot) => slot.chantSegment === 'UNMAPPED'), 'declaration-level chant timing must remain unmapped');
assert(/OPEN-004/.test(registry.mappingBoundary), 'OPEN-004 mapping boundary must be explicit');
assert(/not presented as a unique canonical ancient sequence or translation/i.test(registry.historicalBoundary), 'historical/translation boundary must be explicit');
assert(!/localStorage|sessionStorage|indexedDB/i.test(moduleText), 'Hall runtime must not read device-local private state');
assert(/public-canonical-only/.test(moduleText), 'Hall runtime must expose public-canonical-only privacy');
assert(/No declaration is assigned to a chamber/i.test(moduleText), 'visible chamber-mapping covenant missing');
assert(!threshold.includes('v5.4.1-forty-two-hall'), 'Hall must remain non-autoloading');

console.log(JSON.stringify({
  ok: failures.length === 0,
  failures,
  schema: registry.schema,
  slots: registry.slots.length,
  mappedSeedDeclarations: registry.slots.filter((slot) => slot.recordId).length,
  unmappedDeclarations: registry.slots.filter((slot) => !slot.recordId).length,
  chamberMapping: 'UNMAPPED · OPEN-004',
  chantSegments: 'UNMAPPED',
  autoLoaded: threshold.includes('v5.4.1-forty-two-hall')
}, null, 2));

if (failures.length) process.exitCode = 1;
