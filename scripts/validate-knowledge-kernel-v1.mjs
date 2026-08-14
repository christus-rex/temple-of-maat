import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const read = (relative) => fs.readFileSync(file(relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const unique = (values) => new Set(values).size === values.length;

const PATHS = {
  schema: 'research/knowledge-kernel/temple-knowledge.schema.json',
  sources: 'research/knowledge-kernel/source-registry.v1.json',
  methods: 'research/knowledge-kernel/method-registry.v1.json',
  seed: 'research/knowledge-kernel/seed.v1.json',
  docs: 'docs/KNOWLEDGE_KERNEL.md',
  chambers: 'chambers.json'
};

for (const relative of Object.values(PATHS)) {
  assert(fs.existsSync(file(relative)), `Knowledge Kernel dependency missing: ${relative}`);
}

const schema = json(PATHS.schema);
const sources = json(PATHS.sources);
const methods = json(PATHS.methods);
const seed = json(PATHS.seed);
const chambersDoc = json(PATHS.chambers);
const docs = read(PATHS.docs);

assert(schema.$schema === 'https://json-schema.org/draft/2020-12/schema', 'Knowledge schema must use JSON Schema draft 2020-12');
assert(schema.properties?.schema?.const === 'temple-of-maat/knowledge-kernel-v1', 'Knowledge schema identity mismatch');
assert(schema.properties?.version?.const === '1.0.0', 'Knowledge schema version mismatch');
assert(seed.schema === 'temple-of-maat/knowledge-kernel-v1', `Unexpected seed schema: ${seed.schema}`);
assert(seed.version === '1.0.0', `Unexpected seed version: ${seed.version}`);
assert(seed.privacy === 'public-canonical-only', 'Knowledge seed must be public-canonical-only');
assert(seed.sourceRegistry === PATHS.sources, 'Seed sourceRegistry path must resolve to canonical registry');
assert(seed.methodRegistry === PATHS.methods, 'Seed methodRegistry path must resolve to canonical registry');
assert(/^\d{4}-\d{2}-\d{2}$/.test(seed.updated || ''), 'Knowledge seed updated must be YYYY-MM-DD');

assert(sources.schema === 'temple-of-maat/source-registry-v1', 'Unexpected source registry schema');
assert(methods.schema === 'temple-of-maat/method-registry-v1', 'Unexpected method registry schema');
assert(Array.isArray(sources.sources) && sources.sources.length >= 6, 'Source registry must include the six foundation sources');
assert(Array.isArray(methods.methods) && methods.methods.length === 2, 'Method registry must preserve exactly two foundation gematria methods');

const sourceIds = sources.sources.map((item) => item.id);
const methodIds = methods.methods.map((item) => item.id);
assert(unique(sourceIds), 'Source registry IDs must be unique');
assert(unique(methodIds), 'Method registry IDs must be unique');
const sourceSet = new Set(sourceIds);
const methodSet = new Set(methodIds);

for (const method of methods.methods) {
  assert(/^method\./.test(method.id), `Invalid method ID: ${method.id}`);
  assert(Array.isArray(method.sourceRefs) && method.sourceRefs.length, `${method.id}: sourceRefs required`);
  method.sourceRefs.forEach((ref) => assert(sourceSet.has(ref), `${method.id}: unresolved sourceRef ${ref}`));
  assert(Array.isArray(method.caveats) && method.caveats.length, `${method.id}: caveats required`);
}

assert(methodSet.has('method.gematria.master-catalogue.v1'), 'Master Catalogue method missing');
assert(methodSet.has('method.gematria.solomonic-pairing.v1'), 'Solomonic Pairing method missing');

assert(Array.isArray(seed.records), 'Knowledge records array required');
assert(Array.isArray(seed.claims), 'Knowledge claims array required');
const recordIds = seed.records.map((item) => item.recordId);
const claimIds = seed.claims.map((item) => item.claimId);
assert(unique(recordIds), 'Knowledge record IDs must be unique');
assert(unique(claimIds), 'Knowledge claim IDs must be unique');
const recordSet = new Set(recordIds);

const allowedProvenance = new Set(['source', 'historical-scholarship', 'later-correspondence', 'temple-synthesis', 'current-implementation', 'user-prompt-derived']);
const allowedEntityTypes = new Set(['chamber', 'maat-declaration', 'source-passage', 'concept']);
const allowedContentModes = new Set(['exact-source', 'careful-paraphrase', 'normalized-temple-language', 'locator-only']);

function validateSourceRefs(refs, label) {
  assert(Array.isArray(refs) && refs.length, `${label}: sourceRefs required`);
  assert(unique(refs), `${label}: sourceRefs must be unique`);
  refs.forEach((ref) => assert(sourceSet.has(ref), `${label}: unresolved sourceRef ${ref}`));
}

for (const record of seed.records) {
  assert(/^([a-z][a-z0-9._-]+)$/.test(record.recordId || ''), `Invalid recordId: ${record.recordId}`);
  assert(allowedEntityTypes.has(record.entityType), `${record.recordId}: invalid entityType ${record.entityType}`);
  assert(typeof record.displayName === 'string' && record.displayName.trim(), `${record.recordId}: displayName required`);
  assert(Array.isArray(record.provenanceClasses) && record.provenanceClasses.length, `${record.recordId}: provenanceClasses required`);
  record.provenanceClasses.forEach((value) => assert(allowedProvenance.has(value), `${record.recordId}: invalid provenance class ${value}`));
  validateSourceRefs(record.sourceRefs, record.recordId);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(record.createdAt || ''), `${record.recordId}: createdAt must be YYYY-MM-DD`);
  if (record.content) {
    assert(allowedContentModes.has(record.content.mode), `${record.recordId}: invalid content mode ${record.content.mode}`);
    assert(typeof record.content.text === 'string', `${record.recordId}: content.text must be a string`);
    if (record.content.mode === 'exact-source') assert(typeof record.content.rightsNote === 'string' && record.content.rightsNote.trim(), `${record.recordId}: exact-source content requires rightsNote`);
  }
}

const byType = (type) => seed.records.filter((record) => record.entityType === type);
assert(byType('chamber').length === 3, `Seed must contain exactly 3 chambers, found ${byType('chamber').length}`);
assert(byType('maat-declaration').length === 3, `Seed must contain exactly 3 Ma'at declarations, found ${byType('maat-declaration').length}`);
assert(byType('source-passage').length === 3, `Seed must contain exactly 3 source passages, found ${byType('source-passage').length}`);
assert(byType('concept').length >= 4, `Seed must contain at least 4 concepts, found ${byType('concept').length}`);

const canonicalChambers = Array.isArray(chambersDoc) ? chambersDoc : chambersDoc.chambers;
assert(Array.isArray(canonicalChambers) && canonicalChambers.length === 72, 'Canonical chambers.json must expose 72 chambers');
for (const seedChamber of byType('chamber')) {
  const number = seedChamber.attributes?.number;
  const canonical = canonicalChambers.find((item) => Number(item.number ?? item.num) === number);
  assert(canonical, `${seedChamber.recordId}: canonical chamber ${number} missing`);
  for (const key of ['thirdName', 'angel', 'daemon', 'office', 'pillar', 'law', 'thresholdSealName']) {
    assert(seedChamber.attributes?.[key] === canonical[key], `${seedChamber.recordId}: ${key} does not match chambers.json`);
  }
  assert(seedChamber.provenanceClasses.includes('current-implementation'), `${seedChamber.recordId}: chamber seed must include current-implementation provenance`);
  assert(seedChamber.provenanceClasses.includes('temple-synthesis'), `${seedChamber.recordId}: chamber seed must include temple-synthesis provenance`);
}

for (const declaration of byType('maat-declaration')) {
  assert(declaration.sourceRefs.includes('source.egyptian.book-dead-spell-125-concordance'), `${declaration.recordId}: Ma'at declaration seed must resolve to Spell 125 foundation source`);
  assert(declaration.content?.mode === 'normalized-temple-language', `${declaration.recordId}: Ma'at declaration seed must remain normalized-temple-language`);
  assert(declaration.reviewStatus === 'provisional', `${declaration.recordId}: normalized Ma'at declaration seed must remain provisional`);
  assert(declaration.historicalStatus === 'modern-synthesis', `${declaration.recordId}: normalized Ma'at declaration cannot be marked historical-source`);
}

const quranPassage = seed.records.find((record) => record.recordId === 'passage.quran.49.13');
assert(quranPassage, 'Qur\'an 49:13 seed passage missing');
assert(quranPassage.content?.mode === 'exact-source', 'Qur\'an 49:13 seed passage must remain exact-source');
assert(quranPassage.sourceRefs.includes('source.quran.tanzil-pickthall'), 'Qur\'an 49:13 seed passage must resolve to Tanzil/Pickthall source record');

for (const claim of seed.claims) {
  const id = claim.claimId || '<missing claimId>';
  assert(/^claim\.[a-z0-9][a-z0-9._-]*$/.test(id), `Invalid claimId: ${id}`);
  assert(recordSet.has(claim.subjectId), `${id}: unresolved subjectId ${claim.subjectId}`);
  if (claim.object?.recordId) assert(recordSet.has(claim.object.recordId), `${id}: unresolved object recordId ${claim.object.recordId}`);
  validateSourceRefs(claim.evidence?.sourceRefs, id);
  if (claim.methodRef) assert(methodSet.has(claim.methodRef), `${id}: unresolved methodRef ${claim.methodRef}`);
  assert(claim.boundaries?.historicalIdentity === false, `${id}: historicalIdentity must remain false`);
  assert(claim.boundaries?.metaphysicalIdentity === false, `${id}: metaphysicalIdentity must remain false`);
  if (claim.claimType === 'symbolic') assert(claim.provenanceClasses.includes('temple-synthesis'), `${id}: symbolic claim must include temple-synthesis provenance`);
  if (!['historical', 'textual'].includes(claim.claimType)) assert(claim.boundaries.directHistoricalInfluence === 'not-claimed', `${id}: non-historical claim cannot assert direct historical influence`);
}

for (const requiredText of ['Source Registry → Records → Claims', 'normalized-temple-language', 'method.gematria.master-catalogue.v1', 'method.gematria.solomonic-pairing.v1', '72 × 42']) {
  assert(docs.includes(requiredText), `KNOWLEDGE_KERNEL.md missing required contract text: ${requiredText}`);
}

const serialized = JSON.stringify(seed);
for (const privateMarker of ['temple_v525_pilgrim_journey', 'temple_library_notes', 'privateNotes', 'journeyState', 'indexedDBPayload']) {
  assert(!serialized.includes(privateMarker), `Public Knowledge Kernel contains private-state marker: ${privateMarker}`);
}

console.log(`Knowledge Kernel v1 valid: ${seed.records.length} records, ${seed.claims.length} claims, ${sources.sources.length} sources, ${methods.methods.length} methods.`);
