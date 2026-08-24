import fs from 'node:fs';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const fail = (message) => {
  console.error(`CANON_MATURITY_ERROR: ${message}`);
  process.exitCode = 1;
};

const registryPath = 'research/chamber-canon-maturity.v1.json';
const chamberPath = 'chambers.json';

for (const path of [registryPath, chamberPath, 'research/relationship-graph.json']) {
  if (!fs.existsSync(path)) fail(`Missing required source: ${path}`);
}

if (process.exitCode) process.exit(process.exitCode);

const registry = readJson(registryPath);
const archive = readJson(chamberPath);

if (registry.schema !== 'temple-of-maat/chamber-canon-maturity-v1') {
  fail(`Unexpected registry schema: ${registry.schema}`);
}
if (registry.version !== '1.0.0') fail(`Unexpected registry version: ${registry.version}`);
if (registry.policy?.missingHistoricalEvidence !== 'UNMAPPED') {
  fail('Missing historical evidence must resolve to UNMAPPED.');
}
if (registry.policy?.historicalIdentityDefault !== false) {
  fail('historicalIdentityDefault must be false.');
}
if (registry.policy?.metaphysicalIdentityDefault !== false) {
  fail('metaphysicalIdentityDefault must be false.');
}
if (registry.policy?.appendOnlyCanon !== true) fail('appendOnlyCanon must be true.');
if (registry.policy?.blankFieldsCountAsComplete !== false) {
  fail('Blank fields must not count as complete.');
}
if (registry.policy?.fabricatedProvenanceAllowed !== false) {
  fail('Fabricated provenance must not be allowed.');
}

const chambers = Array.isArray(archive.chambers) ? archive.chambers : [];
const expected = registry.chamberRange?.expectedCount;
if (expected !== 72) fail(`Registry expectedCount must remain 72, found ${expected}`);
if (archive.chamberCount !== 72) fail(`chambers.json chamberCount must remain 72, found ${archive.chamberCount}`);
if (chambers.length !== 72) fail(`chambers.json must contain 72 records, found ${chambers.length}`);

const numbers = chambers.map((record) => Number(record.number));
const unique = new Set(numbers);
if (unique.size !== 72) fail(`Chamber numbers are not unique: ${unique.size}/72 unique`);

for (let number = 1; number <= 72; number += 1) {
  if (!unique.has(number)) fail(`Missing chamber number ${number}`);
}

const requiredCoreFields = Array.isArray(registry.requiredCoreFields)
  ? registry.requiredCoreFields
  : [];

const blank = (value) => typeof value === 'string' && value.trim().length === 0;
const missing = (record, field) => {
  if (!(field in record)) return true;
  const value = record[field];
  return value === null || value === undefined || blank(value);
};

for (const record of chambers) {
  const label = String(record.number).padStart(2, '0');
  if (record.id !== label) fail(`Chamber ${label} id must be ${label}, found ${record.id}`);

  for (const field of requiredCoreFields) {
    if (missing(record, field)) fail(`Chamber ${label} missing required core field ${field}`);
  }

  if (typeof record.fire !== 'object' || Array.isArray(record.fire)) {
    fail(`Chamber ${label} fire must be an object`);
  } else {
    for (const field of ['id', 'name', 'pillar']) {
      if (!(field in record.fire) || record.fire[field] === null || blank(record.fire[field])) {
        fail(`Chamber ${label} fire missing ${field}`);
      }
    }
  }

  if (typeof record.recurrence !== 'boolean') fail(`Chamber ${label} recurrence must be boolean`);
  if (typeof record.tetrad !== 'boolean') fail(`Chamber ${label} tetrad must be boolean`);
}

const requiredExpanded = new Set([
  'numericalField',
  'sacredLimitation',
  'antiDistortionMechanism',
  'maatTest',
  'invocation',
  'sealProvenance',
  'historicalProvenance',
  'symbolicProvenance',
  'review'
]);
const declaredExpanded = new Set(registry.expandedCanonFields || []);
for (const field of requiredExpanded) {
  if (!declaredExpanded.has(field)) fail(`Registry missing expanded canon field ${field}`);
}

const states = new Set(registry.allowedCompletionStates || []);
for (const state of ['REVIEWED', 'UNMAPPED', 'WITHHELD', 'NOT_APPLICABLE']) {
  if (!states.has(state)) fail(`Registry missing completion state ${state}`);
}

const batches = Array.isArray(registry.batchPlan) ? registry.batchPlan : [];
const expectedBatches = [
  ['A', 1, 24],
  ['B', 25, 48],
  ['C', 49, 72]
];
for (const [id, first, last] of expectedBatches) {
  const batch = batches.find((entry) => entry.id === id);
  if (!batch || batch.first !== first || batch.last !== last) {
    fail(`Batch ${id} must cover ${first}-${last}`);
  }
}

if (process.exitCode) process.exit(process.exitCode);

console.log('Canon 1.0 chamber maturity baseline: PASS');
console.log(`Core chamber integrity: ${chambers.length}/72`);
console.log(`Expanded canon target families: ${declaredExpanded.size}`);
console.log('Expanded chamber review status: PENDING_REVIEW (tracked deliberately; placeholders are not completion).');
