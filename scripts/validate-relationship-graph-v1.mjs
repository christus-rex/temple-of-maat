import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const read = (relative) => fs.readFileSync(file(relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const fail = (message) => { throw new Error(message); };

const GRAPH_PATH = 'research/relationship-graph.json';
const SCHEMA_PATH = 'research/relationship-graph.schema.json';
const DOC_PATH = 'docs/RELATIONSHIP_GRAPH.md';

for (const relative of [GRAPH_PATH, SCHEMA_PATH, DOC_PATH, 'chambers.json', 'library/catalog.json', 'scripts/v5.2.4-living-codex.js', 'scripts/v5.2.6-shem-dossiers.js']) {
  if (!fs.existsSync(file(relative))) fail(`Relationship graph dependency missing: ${relative}`);
}

const graph = json(GRAPH_PATH);
const schema = json(SCHEMA_PATH);
const chambers = json('chambers.json');
const catalog = json('library/catalog.json');
const codexJs = read('scripts/v5.2.4-living-codex.js');
const dossierJs = read('scripts/v5.2.6-shem-dossiers.js');
const docs = read(DOC_PATH);

const LAYERS = new Set(['L1', 'L2', 'L3', 'L4']);
const NAMESPACES = new Set(['chamber', 'codex', 'dossier', 'library']);
const RELATIONS = new Set([
  'study-uses-source',
  'record-layer-alignment',
  'textual-relationship',
  'historical-context',
  'historical-influence',
  'methodological-parallel',
  'thematic-parallel',
  'comparative-similarity',
  'computational-correspondence',
  'temple-correspondence'
]);
const DIRECTIONS = new Set(['directed', 'undirected']);
const CONFIDENCE = new Set(['established', 'supported', 'provisional', 'exploratory', 'symbolic']);
const STATUS = new Set(['draft', 'reviewed', 'archived']);
const CLAIM_CLASSES = new Set(['structural', 'historical', 'textual', 'comparative', 'computational', 'symbolic']);
const INFLUENCE = new Set(['not-claimed', 'supported', 'provisional']);
const EVIDENCE_BASIS = new Set([
  'primary-source',
  'scholarly-source',
  'catalog-metadata',
  'computational-result',
  'comparative-analysis',
  'temple-architecture',
  'personal-symbolism'
]);
const PRIVATE_KEYS = new Set([
  'reflection',
  'reflections',
  'privateNote',
  'privateNotes',
  'bookmarks',
  'favorites',
  'localStorageKey',
  'indexedDBPayload',
  'journeyState',
  'personalState'
]);
const PRIVATE_MARKERS = [
  'temple_v525_pilgrim_journey',
  'temple_last_chamber',
  'temple_library_personal_state',
  'temple_library_notes',
  'temple_library_bookmarks'
];

function assert(condition, message) {
  if (!condition) fail(message);
}

function unique(values) {
  return new Set(values).size === values.length;
}

function parseCodexIds(source) {
  const match = source.match(/const RAW = `([\s\S]*?)`;/);
  assert(match, 'Living Codex RAW table could not be located');
  const rows = match[1].trim().split(/\r?\n/).filter(Boolean);
  assert(rows.length === 72, `Living Codex must expose 72 RAW rows, found ${rows.length}`);
  const ids = rows.map((row, index) => {
    const columns = row.split('|');
    assert(columns.length === 15, `Living Codex RAW row ${index + 1} must contain 15 fields, found ${columns.length}`);
    return columns[0];
  });
  assert(unique(ids), 'Living Codex RAW IDs must be unique');
  return new Set(ids);
}

function parseDossierIds(source) {
  const match = source.match(/const DATA = Object\.freeze\((\[[\s\S]*?\])\);/);
  assert(match, 'Shem Dossier DATA array could not be located');
  const records = JSON.parse(match[1]);
  assert(records.length === 72, `Shem Dossier layer must expose 72 records, found ${records.length}`);
  const ids = records.map((record) => String(record.num).padStart(2, '0'));
  assert(unique(ids), 'Shem Dossier IDs must be unique');
  return new Set(ids);
}

function chamberIdsFromCanonical(value) {
  const records = Array.isArray(value) ? value : Array.isArray(value?.chambers) ? value.chambers : null;
  assert(records, 'chambers.json must be an array or contain a chambers array');
  assert(records.length === 72, `Canonical chamber store must contain 72 records, found ${records.length}`);
  const ids = records.map((record, index) => {
    const raw = record?.num ?? record?.number ?? index + 1;
    const numeric = Number(raw);
    assert(Number.isInteger(numeric) && numeric >= 1 && numeric <= 72, `Invalid canonical chamber number at index ${index}: ${raw}`);
    return String(numeric).padStart(2, '0');
  });
  assert(unique(ids), 'Canonical chamber IDs must be unique');
  return new Set(ids);
}

function libraryIdsFromCatalog(value) {
  const groups = ['traditions', 'sources', 'studies', 'discernments'];
  const ids = [];
  for (const group of groups) {
    assert(Array.isArray(value[group]), `library/catalog.json missing ${group} array`);
    for (const record of value[group]) {
      assert(typeof record?.id === 'string' && record.id, `Library ${group} record is missing a stable id`);
      ids.push(record.id);
    }
  }
  assert(unique(ids), 'Library record IDs must be globally unique across catalog groups');
  return new Set(ids);
}

const endpointSets = {
  chamber: chamberIdsFromCanonical(chambers),
  codex: parseCodexIds(codexJs),
  dossier: parseDossierIds(dossierJs),
  library: libraryIdsFromCatalog(catalog)
};

function assertNoPrivateFields(value, pathLabel = 'graph') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPrivateFields(item, `${pathLabel}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert(!PRIVATE_KEYS.has(key), `Public relationship graph contains forbidden private-state field ${pathLabel}.${key}`);
    assertNoPrivateFields(child, `${pathLabel}.${key}`);
  }
}

function assertSourceRef(ref, edgeId) {
  assert(typeof ref === 'string' && ref.trim(), `${edgeId}: sourceRef must be a non-empty string`);
  if (/^(tradition|source|study|discernment)\./.test(ref)) {
    assert(endpointSets.library.has(ref), `${edgeId}: unresolved Library sourceRef ${ref}`);
    return;
  }
  if (/^(library|scripts|research)\//.test(ref) || ref === 'chambers.json') {
    assert(fs.existsSync(file(ref)), `${edgeId}: repository sourceRef does not exist: ${ref}`);
  }
}

function validateEndpoint(endpoint, edgeId, side) {
  assert(endpoint && typeof endpoint === 'object' && !Array.isArray(endpoint), `${edgeId}: ${side} endpoint must be an object`);
  assert(NAMESPACES.has(endpoint.namespace), `${edgeId}: unsupported ${side} namespace ${endpoint.namespace}`);
  assert(typeof endpoint.recordId === 'string' && endpoint.recordId, `${edgeId}: ${side}.recordId is required`);
  assert(endpointSets[endpoint.namespace].has(endpoint.recordId), `${edgeId}: unresolved ${side} endpoint ${endpoint.namespace}:${endpoint.recordId}`);
}

function validateEdge(edge) {
  const id = edge?.id || '<missing edge id>';
  assert(/^edge\.[a-z0-9][a-z0-9._-]*$/.test(id), `Invalid edge id: ${id}`);
  validateEndpoint(edge.from, id, 'from');
  validateEndpoint(edge.to, id, 'to');
  assert(!(edge.from.namespace === edge.to.namespace && edge.from.recordId === edge.to.recordId), `${id}: self-edges are not allowed in graph v1`);
  assert(RELATIONS.has(edge.relationType), `${id}: unsupported relationType ${edge.relationType}`);
  assert(DIRECTIONS.has(edge.direction), `${id}: unsupported direction ${edge.direction}`);
  assert(Array.isArray(edge.provenanceLayers) && edge.provenanceLayers.length, `${id}: provenanceLayers are required`);
  assert(unique(edge.provenanceLayers), `${id}: provenanceLayers must be unique`);
  edge.provenanceLayers.forEach((layer) => assert(LAYERS.has(layer), `${id}: invalid provenance layer ${layer}`));
  assert(CONFIDENCE.has(edge.confidence), `${id}: invalid confidence ${edge.confidence}`);
  assert(STATUS.has(edge.status), `${id}: invalid status ${edge.status}`);
  assert(typeof edge.summary === 'string' && edge.summary.trim(), `${id}: summary is required`);

  const evidence = edge.evidence;
  assert(evidence && Array.isArray(evidence.basis) && evidence.basis.length, `${id}: evidence.basis is required`);
  assert(unique(evidence.basis), `${id}: evidence.basis must be unique`);
  evidence.basis.forEach((basis) => assert(EVIDENCE_BASIS.has(basis), `${id}: unsupported evidence basis ${basis}`));
  assert(Array.isArray(evidence.sourceRefs) && evidence.sourceRefs.length, `${id}: evidence.sourceRefs are required`);
  assert(unique(evidence.sourceRefs), `${id}: sourceRefs must be unique`);
  evidence.sourceRefs.forEach((ref) => assertSourceRef(ref, id));

  const boundary = edge.claimBoundary;
  assert(boundary && CLAIM_CLASSES.has(boundary.claimClass), `${id}: valid claimBoundary.claimClass is required`);
  assert(boundary.historicalIdentity === false, `${id}: historicalIdentity must be false`);
  assert(boundary.metaphysicalIdentity === false, `${id}: metaphysicalIdentity must be false`);
  assert(INFLUENCE.has(boundary.directHistoricalInfluence), `${id}: invalid directHistoricalInfluence ${boundary.directHistoricalInfluence}`);

  if (boundary.claimClass === 'symbolic' || edge.confidence === 'symbolic' || evidence.basis.includes('personal-symbolism')) {
    assert(edge.provenanceLayers.includes('L4'), `${id}: symbolic/personal claims must include L4`);
  }

  if (evidence.basis.includes('personal-symbolism')) {
    assert(edge.provenanceLayers.includes('L4'), `${id}: personal-symbolism evidence requires L4`);
  }

  if (edge.relationType === 'study-uses-source') {
    assert(edge.direction === 'directed', `${id}: study-uses-source must be directed`);
    assert(edge.from.namespace === 'library' && edge.from.recordId.startsWith('source.'), `${id}: study-uses-source must begin at a Library source.* record`);
    assert(edge.to.namespace === 'library' && edge.to.recordId.startsWith('study.'), `${id}: study-uses-source must end at a Library study.* record`);
    assert(edge.provenanceLayers.includes('L1') && edge.provenanceLayers.includes('L2'), `${id}: study-uses-source must include L1 and L2`);
    assert(['established', 'supported'].includes(edge.confidence), `${id}: study-uses-source confidence must be established or supported`);
    assert(evidence.basis.includes('catalog-metadata'), `${id}: study-uses-source must include catalog-metadata evidence`);
    assert(boundary.directHistoricalInfluence === 'not-claimed', `${id}: modern study dependency must not imply ancient direct historical influence`);
  }

  if (edge.relationType === 'record-layer-alignment') {
    assert(edge.direction === 'undirected', `${id}: record-layer-alignment must be undirected`);
    assert(edge.provenanceLayers.length === 1 && edge.provenanceLayers[0] === 'L4', `${id}: record-layer-alignment must be L4-only`);
    assert(boundary.claimClass === 'structural', `${id}: record-layer-alignment must use structural claim class`);
    assert(evidence.basis.includes('temple-architecture'), `${id}: record-layer-alignment requires temple-architecture evidence`);
    assert(boundary.directHistoricalInfluence === 'not-claimed', `${id}: structural alignment cannot imply historical influence`);
  }

  if (edge.relationType === 'historical-influence') {
    assert(['supported', 'provisional'].includes(boundary.directHistoricalInfluence), `${id}: historical-influence must explicitly be supported or provisional`);
    assert(evidence.basis.includes('primary-source') || evidence.basis.includes('scholarly-source'), `${id}: historical-influence requires primary or scholarly evidence`);
    assert(edge.confidence !== 'symbolic', `${id}: historical-influence cannot have symbolic confidence`);
    assert(!(edge.provenanceLayers.length === 1 && edge.provenanceLayers[0] === 'L4'), `${id}: L4-only evidence cannot support historical influence`);
  } else {
    assert(boundary.directHistoricalInfluence === 'not-claimed' || edge.relationType === 'historical-context' || edge.relationType === 'textual-relationship', `${id}: only historical/textual relations may carry a supported/provisional influence field outside historical-influence`);
  }

  if (edge.relationType === 'computational-correspondence') {
    assert(evidence.basis.includes('computational-result'), `${id}: computational-correspondence requires computational-result evidence`);
  }

  if (edge.relationType === 'temple-correspondence') {
    assert(edge.provenanceLayers.includes('L4'), `${id}: temple-correspondence requires L4`);
    assert(evidence.basis.includes('temple-architecture') || evidence.basis.includes('personal-symbolism'), `${id}: temple-correspondence requires Temple/personal evidence`);
    assert(['symbolic', 'exploratory', 'supported'].includes(edge.confidence), `${id}: temple-correspondence confidence must remain symbolic, exploratory, or supported`);
    assert(boundary.directHistoricalInfluence === 'not-claimed', `${id}: temple-correspondence cannot claim direct historical influence`);
  }
}

function validateGraph(value) {
  assert(value.schema === 'temple-of-maat/relationship-graph-v1', `Unexpected relationship graph schema: ${value.schema}`);
  assert(value.version === '1.0.0', `Unexpected relationship graph version: ${value.version}`);
  assert(value.privacy === 'public-canonical-only', `Relationship graph privacy must be public-canonical-only, found ${value.privacy}`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(value.updated || ''), 'Relationship graph updated must be YYYY-MM-DD');
  assert(Array.isArray(value.namespaces), 'Relationship graph namespaces array is required');
  assert(Array.isArray(value.edges), 'Relationship graph edges array is required');
  assertNoPrivateFields(value);
  const serialized = JSON.stringify(value);
  PRIVATE_MARKERS.forEach((marker) => assert(!serialized.includes(marker), `Public relationship graph contains private-state marker ${marker}`));

  const namespaceIds = value.namespaces.map((item) => item.id);
  assert(unique(namespaceIds), 'Relationship graph namespace IDs must be unique');
  assert(namespaceIds.length === 4 && [...NAMESPACES].every((id) => namespaceIds.includes(id)), `Graph namespaces must be exactly chamber, codex, dossier, library; found ${namespaceIds.join(', ')}`);
  for (const namespace of value.namespaces) {
    assert(NAMESPACES.has(namespace.id), `Unsupported namespace descriptor ${namespace.id}`);
    assert(typeof namespace.resolver === 'string' && namespace.resolver, `${namespace.id}: resolver is required`);
    assert(fs.existsSync(file(namespace.resolver)), `${namespace.id}: resolver path does not exist: ${namespace.resolver}`);
    assert(typeof namespace.key === 'string' && namespace.key, `${namespace.id}: key is required`);
    if (namespace.id !== 'library') assert(namespace.expectedCount === 72, `${namespace.id}: expectedCount must be 72`);
  }

  const edgeIds = value.edges.map((edge) => edge.id);
  assert(unique(edgeIds), 'Relationship graph edge IDs must be unique');
  value.edges.forEach(validateEdge);
  return true;
}

validateGraph(graph);

// Schema artifact contract: identity boundaries must be mechanically impossible to set true.
assert(schema?.properties?.schema?.const === 'temple-of-maat/relationship-graph-v1', 'Relationship graph schema const is missing');
assert(schema?.properties?.version?.const === '1.0.0', 'Relationship graph version const is missing');
assert(schema?.properties?.privacy?.const === 'public-canonical-only', 'Relationship graph privacy const is missing');
const boundarySchema = schema?.$defs?.claimBoundary?.properties;
assert(boundarySchema?.historicalIdentity?.const === false, 'Schema must mechanically fix historicalIdentity=false');
assert(boundarySchema?.metaphysicalIdentity?.const === false, 'Schema must mechanically fix metaphysicalIdentity=false');

for (const marker of [
  'Compare without collapsing',
  'Public canonical graph only',
  'historicalIdentity: false',
  'metaphysicalIdentity: false',
  'No new Library → Chamber symbolic relationship is invented',
  'Comparative Reading / Research Workspace',
  '72-node Temple Map',
  'never become the only way to reach a Chamber or source record'
]) {
  assert(docs.includes(marker), `Relationship graph documentation marker missing: ${marker}`);
}

// Negative fixtures are generated in memory so the validator proves its own guardrails.
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function expectFailure(label, mutate, expected) {
  const candidate = clone(graph);
  mutate(candidate);
  let message = '';
  try { validateGraph(candidate); }
  catch (error) { message = error.message; }
  assert(message, `Negative fixture did not fail: ${label}`);
  assert(message.includes(expected), `Negative fixture ${label} failed for the wrong reason. Expected ${expected}; got ${message}`);
}

expectFailure('identity inflation', (candidate) => { candidate.edges[0].claimBoundary.historicalIdentity = true; }, 'historicalIdentity must be false');
expectFailure('unresolved endpoint', (candidate) => { candidate.edges[0].to.recordId = 'study.missing-record'; }, 'unresolved to endpoint');
expectFailure('private state', (candidate) => { candidate.edges[0].reflections = { '1': 'private' }; }, 'forbidden private-state field');
expectFailure('Temple edge missing L4', (candidate) => {
  const edge = clone(candidate.edges[0]);
  edge.id = 'edge.invalid-temple-correspondence';
  edge.relationType = 'temple-correspondence';
  edge.provenanceLayers = ['L2'];
  edge.confidence = 'symbolic';
  edge.evidence.basis = ['temple-architecture'];
  edge.claimBoundary.claimClass = 'symbolic';
  candidate.edges.push(edge);
}, 'symbolic/personal claims must include L4');
expectFailure('computational edge without computational evidence', (candidate) => {
  const edge = clone(candidate.edges[0]);
  edge.id = 'edge.invalid-computational-correspondence';
  edge.relationType = 'computational-correspondence';
  edge.evidence.basis = ['catalog-metadata'];
  candidate.edges.push(edge);
}, 'computational-correspondence requires computational-result evidence');
expectFailure('historical influence without evidence', (candidate) => {
  const edge = clone(candidate.edges[0]);
  edge.id = 'edge.invalid-historical-influence';
  edge.relationType = 'historical-influence';
  edge.claimBoundary.claimClass = 'historical';
  edge.claimBoundary.directHistoricalInfluence = 'supported';
  edge.evidence.basis = ['catalog-metadata'];
  candidate.edges.push(edge);
}, 'historical-influence requires primary or scholarly evidence');

const relationCounts = Object.fromEntries([...RELATIONS].map((type) => [type, graph.edges.filter((edge) => edge.relationType === type).length]).filter(([, count]) => count));
console.log(JSON.stringify({
  ok: true,
  schema: graph.schema,
  version: graph.version,
  privacy: graph.privacy,
  namespaces: Object.fromEntries(Object.entries(endpointSets).map(([name, set]) => [name, set.size])),
  edgeCount: graph.edges.length,
  relationCounts,
  negativeGuardrails: 6
}, null, 2));
