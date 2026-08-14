import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };
const readJson = (relative) => JSON.parse(fs.readFileSync(file(relative), 'utf8'));

const PUBLIC_SCHEMA_PATH = 'library/schema/temple-library.schema.json';
const PERSONAL_SCHEMA_PATH = 'library/schema/personal-state.schema.json';
const CATALOG_PATH = 'library/catalog.json';
const FIXTURE_PATH = 'scripts/fixtures/library-reference-catalog.json';
const PERSONAL_FIXTURE_PATH = 'scripts/fixtures/library-reference-personal-state.json';
const DOC_PATH = 'library/README.md';

for (const relative of [PUBLIC_SCHEMA_PATH, PERSONAL_SCHEMA_PATH, CATALOG_PATH, FIXTURE_PATH, PERSONAL_FIXTURE_PATH, DOC_PATH, 'GOVERNANCE.md']) {
  if (!fs.existsSync(file(relative))) fail(`Missing Library foundation file: ${relative}`);
}

const publicSchema = readJson(PUBLIC_SCHEMA_PATH);
const personalSchema = readJson(PERSONAL_SCHEMA_PATH);
const catalog = readJson(CATALOG_PATH);
const fixture = readJson(FIXTURE_PATH);
const personalFixture = readJson(PERSONAL_FIXTURE_PATH);
const docs = fs.readFileSync(file(DOC_PATH), 'utf8');
const governance = fs.readFileSync(file('GOVERNANCE.md'), 'utf8');

const LAYERS = new Set(['L1', 'L2', 'L3', 'L4']);
const STATUS = new Set(['planned', 'draft', 'reviewed', 'published', 'archived']);
const ID_PATTERN = /^(tradition|source|study|discernment|correspondence)\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHAMBER_PATTERN = /^(0[1-9]|[1-6][0-9]|7[0-2])$/;
const TYPE_TO_ARRAY = {
  tradition: 'traditions',
  source: 'sources',
  study: 'studies',
  discernment: 'discernments',
  correspondence: 'correspondences'
};
const ALLOWED_PUBLIC_KEYS = new Set(['schema', 'updated', 'traditions', 'sources', 'studies', 'discernments', 'correspondences']);

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertExactKeys(obj, allowed, label) {
  for (const key of Object.keys(obj)) {
    assert(allowed.has(key), `${label} contains forbidden/unknown key: ${key}`);
  }
}

function validateLayers(record, label) {
  assert(Array.isArray(record.provenanceLayers) && record.provenanceLayers.length > 0, `${label} must declare provenanceLayers`);
  assert(new Set(record.provenanceLayers).size === record.provenanceLayers.length, `${label} has duplicate provenance layers`);
  for (const layer of record.provenanceLayers) assert(LAYERS.has(layer), `${label} has invalid provenance layer ${layer}`);
}

function collectRecords(data) {
  const arrays = Object.values(TYPE_TO_ARRAY);
  const records = [];
  for (const key of arrays) {
    assert(Array.isArray(data[key]), `Catalog ${key} must be an array`);
    records.push(...data[key]);
  }
  return records;
}

function validateCatalog(data, label = 'catalog') {
  assert(data && typeof data === 'object' && !Array.isArray(data), `${label} must be an object`);
  assertExactKeys(data, ALLOWED_PUBLIC_KEYS, label);
  assert(data.schema === 'temple-of-maat/library-v1', `${label} schema identifier drifted`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(data.updated), `${label} updated must be YYYY-MM-DD`);

  const records = collectRecords(data);
  const ids = new Set();
  const byId = new Map();

  for (const record of records) {
    assert(record && typeof record === 'object' && !Array.isArray(record), `${label} contains a non-object record`);
    assert(ID_PATTERN.test(record.id || ''), `${label} has invalid stable ID ${record.id}`);
    assert(TYPE_TO_ARRAY[record.type], `${record.id} has invalid record type ${record.type}`);
    assert(record.id.startsWith(`${record.type}.`), `${record.id} prefix does not match type ${record.type}`);
    assert(!ids.has(record.id), `${label} contains duplicate ID ${record.id}`);
    ids.add(record.id);
    byId.set(record.id, record);
    assert(typeof record.title === 'string' && record.title.trim(), `${record.id} requires a title`);
    assert(STATUS.has(record.status), `${record.id} has invalid status ${record.status}`);
    validateLayers(record, record.id);
    assert(!Object.hasOwn(record, 'bookmarks') && !Object.hasOwn(record, 'notes') && !Object.hasOwn(record, 'privateCorrespondences'), `${record.id} contains private visitor state`);
  }

  for (const tradition of data.traditions) {
    assert(tradition.type === 'tradition', `${tradition.id} is in traditions but has type ${tradition.type}`);
  }

  for (const source of data.sources) {
    assert(source.type === 'source', `${source.id} is in sources but has type ${source.type}`);
    assert(source.provenanceLayers.includes('L1'), `${source.id} must include L1`);
    assert(Array.isArray(source.traditionIds) && source.traditionIds.length > 0, `${source.id} requires traditionIds`);
    for (const id of source.traditionIds) assert(byId.get(id)?.type === 'tradition', `${source.id} references missing/non-tradition ${id}`);
    assert(source.sourceMetadata && typeof source.sourceMetadata === 'object', `${source.id} requires sourceMetadata`);
    assert(source.rights && typeof source.rights === 'object', `${source.id} requires rights metadata`);
    assert(typeof source.rights.attribution === 'string' && source.rights.attribution.trim(), `${source.id} requires rights.attribution`);
    assert(['full', 'excerpt-only', 'metadata-only', 'restricted', 'unknown'].includes(source.rights.publicExposure), `${source.id} has invalid rights.publicExposure`);
  }

  for (const study of data.studies) {
    assert(study.type === 'study', `${study.id} is in studies but has type ${study.type}`);
    assert(Array.isArray(study.traditionIds) && study.traditionIds.length > 0, `${study.id} requires traditionIds`);
    assert(Array.isArray(study.sourceIds), `${study.id} requires sourceIds array even when empty`);
    for (const id of study.traditionIds) assert(byId.get(id)?.type === 'tradition', `${study.id} references missing/non-tradition ${id}`);
    for (const id of study.sourceIds) assert(byId.get(id)?.type === 'source', `${study.id} references missing/non-source ${id}`);
    if (study.normalizationProfile) {
      assert(study.normalizationProfile.preservesOriginal === true, `${study.id} normalization must preserve the original source`);
      assert(Array.isArray(study.normalizationProfile.rules) && study.normalizationProfile.rules.length > 0, `${study.id} normalization requires declared rules`);
    }
    if (study.computationalMethod) {
      assert(typeof study.computationalMethod.name === 'string' && study.computationalMethod.name.trim(), `${study.id} computational method requires a name`);
      assert(typeof study.computationalMethod.method === 'string' && study.computationalMethod.method.trim(), `${study.id} computational method requires a method description`);
    }
  }

  for (const discernment of data.discernments) {
    assert(discernment.type === 'discernment', `${discernment.id} is in discernments but has type ${discernment.type}`);
    assert(Array.isArray(discernment.studyIds) && discernment.studyIds.length > 0, `${discernment.id} requires studyIds`);
    for (const id of discernment.studyIds) assert(byId.get(id)?.type === 'study', `${discernment.id} references missing/non-study ${id}`);
    for (const id of discernment.sourceIds || []) assert(byId.get(id)?.type === 'source', `${discernment.id} references missing/non-source ${id}`);
  }

  for (const correspondence of data.correspondences) {
    assert(correspondence.type === 'correspondence', `${correspondence.id} is in correspondences but has type ${correspondence.type}`);
    assert(correspondence.identityClaim === false, `${correspondence.id} must set identityClaim:false`);
    assert(byId.has(correspondence.fromRecordId) && byId.get(correspondence.fromRecordId)?.type !== 'correspondence', `${correspondence.id} has invalid fromRecordId ${correspondence.fromRecordId}`);
    assert(correspondence.target && typeof correspondence.target === 'object', `${correspondence.id} requires a target`);
    if (correspondence.target.kind === 'chamber') {
      assert(CHAMBER_PATTERN.test(correspondence.target.chamberId || ''), `${correspondence.id} has invalid chamber target ${correspondence.target.chamberId}`);
    } else if (correspondence.target.kind === 'library-record') {
      assert(byId.has(correspondence.target.recordId) && byId.get(correspondence.target.recordId)?.type !== 'correspondence', `${correspondence.id} targets missing/invalid record ${correspondence.target.recordId}`);
      assert(correspondence.target.recordId !== correspondence.fromRecordId, `${correspondence.id} may not target itself`);
    } else {
      fail(`${correspondence.id} has invalid target kind ${correspondence.target.kind}`);
    }
  }

  return { records, byId };
}

function validatePersonalState(state, publicData, label = 'personal state') {
  assert(state && typeof state === 'object' && !Array.isArray(state), `${label} must be an object`);
  assertExactKeys(state, new Set(['schema', 'updatedAt', 'bookmarks', 'notes', 'privateCorrespondences']), label);
  assert(state.schema === 'temple-of-maat/library-personal-state-v1', `${label} schema identifier drifted`);
  assert(!Number.isNaN(Date.parse(state.updatedAt)), `${label} updatedAt must be an ISO date-time`);
  assert(Array.isArray(state.bookmarks) && Array.isArray(state.notes) && Array.isArray(state.privateCorrespondences), `${label} arrays are incomplete`);

  const { byId } = validateCatalog(publicData, `${label} public fixture`);
  for (const id of state.bookmarks) assert(byId.has(id), `${label} bookmark references missing ${id}`);
  for (const note of state.notes) {
    assert(/^note\.[a-z0-9]+(?:-[a-z0-9]+)*$/.test(note.id || ''), `${label} has invalid note ID ${note.id}`);
    assert(byId.has(note.recordId), `${note.id} references missing record ${note.recordId}`);
    assert(typeof note.text === 'string', `${note.id} text must be a string`);
    assert(!Number.isNaN(Date.parse(note.updatedAt)), `${note.id} updatedAt is invalid`);
  }
  for (const correspondence of state.privateCorrespondences) {
    assert(/^private-correspondence\.[a-z0-9]+(?:-[a-z0-9]+)*$/.test(correspondence.id || ''), `${label} has invalid private correspondence ID ${correspondence.id}`);
    assert(byId.has(correspondence.fromRecordId), `${correspondence.id} references missing ${correspondence.fromRecordId}`);
    assert(correspondence.provenanceLayer === 'L4', `${correspondence.id} must remain L4`);
    assert(correspondence.identityClaim === false, `${correspondence.id} must set identityClaim:false`);
    if (correspondence.target?.kind === 'chamber') assert(CHAMBER_PATTERN.test(correspondence.target.chamberId || ''), `${correspondence.id} has invalid chamber ${correspondence.target.chamberId}`);
    else if (correspondence.target?.kind === 'library-record') assert(byId.has(correspondence.target.recordId), `${correspondence.id} targets missing ${correspondence.target.recordId}`);
    else fail(`${correspondence.id} has invalid target`);
  }
}

function expectFailure(label, fn) {
  let failed = false;
  try { fn(); } catch { failed = true; }
  assert(failed, `Negative contract test did not fail: ${label}`);
}

// Schema-document contract checks. The custom validator remains dependency-free, while
// the JSON Schema files provide the machine-readable interface for future consumers.
assert(publicSchema.$schema === 'https://json-schema.org/draft/2020-12/schema', 'Public Library schema must use JSON Schema 2020-12');
assert(publicSchema.properties?.schema?.const === 'temple-of-maat/library-v1', 'Public schema ID constant is missing');
assert(publicSchema.$defs?.source?.properties?.provenanceLayers?.contains?.const === 'L1', 'Public schema must structurally require L1 on Source records');
assert(publicSchema.$defs?.correspondence?.properties?.identityClaim?.const === false, 'Public correspondence schema must structurally forbid identity claims');
assert(personalSchema.properties?.schema?.const === 'temple-of-maat/library-personal-state-v1', 'Personal-state schema ID constant is missing');
const privateCorrespondenceSchema = personalSchema.properties?.privateCorrespondences?.items?.properties;
assert(privateCorrespondenceSchema?.provenanceLayer?.const === 'L4', 'Private correspondence schema must remain L4');
assert(privateCorrespondenceSchema?.identityClaim?.const === false, 'Private correspondence schema must structurally forbid identity claims');

for (const marker of [
  'Library → Tradition → Source → Study → Discernment → Correspondences',
  'compare without collapsing',
  'public catalog **must not contain visitor notes or bookmarks**',
  'identityClaim: false',
  'temple-of-maat/library-v1',
  'temple-of-maat/library-personal-state-v1'
]) assert(docs.includes(marker), `Library documentation marker missing: ${marker}`);
for (const marker of ['## 3. Four provenance layers', '## 8. Personal data and private practice', '## 13. Research ingestion covenant']) {
  assert(governance.includes(marker), `Governance dependency missing: ${marker}`);
}

// The bootstrap catalog began empty. Once reviewed ingestion issues land, the
// canonical catalog may grow; validate every production record semantically instead
// of imposing a temporary record-count rule.
const production = validateCatalog(catalog, 'canonical library/catalog.json');
const reference = validateCatalog(fixture, 'reference Library fixture');
assert(reference.records.length === 7, `Expected 7 reference records, found ${reference.records.length}`);
validatePersonalState(personalFixture, fixture, 'reference personal state');

// Negative tests prove the anti-collapse constraints are enforced rather than merely documented.
const clone = (value) => structuredClone(value);

expectFailure('public catalog contains bookmarks', () => {
  const invalid = clone(fixture);
  invalid.bookmarks = ['study.fixture-computation'];
  validateCatalog(invalid, 'invalid public-state fixture');
});

expectFailure('source without L1', () => {
  const invalid = clone(fixture);
  invalid.sources[0].provenanceLayers = ['L2'];
  validateCatalog(invalid, 'invalid source-layer fixture');
});

expectFailure('correspondence identity claim', () => {
  const invalid = clone(fixture);
  invalid.correspondences[0].identityClaim = true;
  validateCatalog(invalid, 'invalid identity fixture');
});

expectFailure('chamber 73', () => {
  const invalid = clone(fixture);
  invalid.correspondences[0].target.chamberId = '73';
  validateCatalog(invalid, 'invalid chamber fixture');
});

expectFailure('private correspondence outside L4', () => {
  const invalid = clone(personalFixture);
  invalid.privateCorrespondences[0].provenanceLayer = 'L3';
  validatePersonalState(invalid, fixture, 'invalid private-layer fixture');
});

expectFailure('private correspondence identity claim', () => {
  const invalid = clone(personalFixture);
  invalid.privateCorrespondences[0].identityClaim = true;
  validatePersonalState(invalid, fixture, 'invalid private-identity fixture');
});

console.log(JSON.stringify({
  ok: true,
  schema: catalog.schema,
  canonicalRecords: production.records.length,
  referenceRecords: reference.records.length,
  referenceBreakdown: {
    traditions: fixture.traditions.length,
    sources: fixture.sources.length,
    studies: fixture.studies.length,
    discernments: fixture.discernments.length,
    correspondences: fixture.correspondences.length
  },
  negativeContracts: 6,
  guarantees: [
    'stable namespaced IDs',
    'explicit record relationships',
    'L1 source preservation',
    'separate normalization/computational methods',
    'rights and integrity metadata',
    'identityClaim:false correspondences',
    '01-72 chamber target bounds',
    'public/private state separation',
    'private symbolism constrained to L4'
  ]
}, null, 2));
