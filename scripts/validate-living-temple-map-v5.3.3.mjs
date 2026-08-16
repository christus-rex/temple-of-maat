import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = (relative) => path.join(root, ...relative.split('/'));
const read = (relative) => fs.readFileSync(file(relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const MODULE_PATH = 'scripts/v5.3.3-living-temple-map.mjs';
const STYLE_PATH = 'styles/v5.3.3-living-temple-map.css';
const DOC_PATH = 'docs/LIVING_TEMPLE_MAP.md';
const GRAPH_PATH = 'research/relationship-graph.json';
const AUTHORITY_PATH = 'research/pair-authority.json';
const MIGRATION_PATH = 'research/pair-authority-name-migration.v1.json';
const THRESHOLD_PATH = 'scripts/v5.3-threshold.js';
const WORKFLOW_PATH = '.github/workflows/validate-living-temple-map-v5.3.3.yml';

[MODULE_PATH, STYLE_PATH, DOC_PATH, GRAPH_PATH, AUTHORITY_PATH, MIGRATION_PATH, THRESHOLD_PATH, WORKFLOW_PATH].forEach((relative) => {
  assert(fs.existsSync(file(relative)), `Living Temple Map dependency missing: ${relative}`);
});

const moduleSource = read(MODULE_PATH);
const styleSource = read(STYLE_PATH);
const docs = read(DOC_PATH);
const graph = json(GRAPH_PATH);
const authority = json(AUTHORITY_PATH);
const migration = json(MIGRATION_PATH);
const threshold = read(THRESHOLD_PATH);

assert(/LIVING_TEMPLE_MAP_SCHEMA\s*=\s*'temple-of-maat\/living-temple-map-v1'/.test(moduleSource), 'Living Temple Map schema contract missing.');
assert(/LIVING_TEMPLE_MAP_VERSION\s*=\s*'1\.0\.0'/.test(moduleSource), 'Living Temple Map version contract missing.');
assert(/privacy:\s*'public-canonical-only'/.test(moduleSource), 'Living Temple Map must expose public-canonical-only privacy.');
assert(/installTempleRelationshipBrowserAdapter/.test(moduleSource), 'Living Temple Map must use the canonical relationship browser adapter.');
assert(/pair-authority-name-migration\.v1\.json/.test(moduleSource), 'Living Temple Map must consume the governed naming migration overlay.');
assert(/Preferred future form/.test(moduleSource) && /Deployed Third Name/.test(moduleSource), 'Living Temple Map must visibly distinguish deployed and preferred-future Third Names.');
assert(/does not rename the live chamber or create a new graph edge/i.test(moduleSource), 'Pair Authority display boundary is missing.');
assert(/No relationship is inferred/i.test(moduleSource), 'No-edge non-inference behavior must be explicit.');
assert(/Accessible List/.test(moduleSource), 'Keyboard-first list alternative is required.');
assert(/Historical identity/.test(moduleSource) && /Metaphysical identity/.test(moduleSource) && /Direct historical influence/.test(moduleSource), 'Claim boundaries must be visible in edge details.');
assert(!/localStorage|indexedDB|TemplePilgrimJourney|TempleLibrary\.state|TempleResearchNotebook|TempleScribeWorkspace/.test(moduleSource), 'Living Temple Map must not read private visitor state.');
assert(!/tm524-dock/.test(moduleSource), 'Living Temple Map must not add a bottom-dock control.');
assert(!/v5\.3\.3-living-temple-map/.test(threshold), 'Living Temple Map must remain explicitly activated and must not auto-load from threshold startup.');
assert(/data-temple-map-launcher/.test(moduleSource) && /#tm528-library/.test(moduleSource), 'Living Temple Map should integrate only through the explicit Library research launcher after installation.');
assert(/@media\(max-width:700px\)/.test(styleSource) && /tm533-edge-list/.test(styleSource), 'Mobile accessible-list fallback styles are required.');
assert(/Source \/ Textual/.test(docs) && /Temple Synthesis/.test(docs) && /public canonical/i.test(docs), 'Living Temple Map documentation must explain provenance bands and public-canonical scope.');

assert(graph.schema === 'temple-of-maat/relationship-graph-v1' && graph.privacy === 'public-canonical-only', 'Relationship Graph contract mismatch.');
assert(authority.schema === 'temple-of-maat/pair-authority-v1' && authority.privacy === 'public-canonical-only', 'Pair Authority contract mismatch.');
assert(migration.schema === 'temple-of-maat/pair-authority-name-migration-v1' && migration.privacy === 'public-canonical-only', 'Pair Authority migration contract mismatch.');
assert(migration.summary?.recordCount === 72 && migration.records?.length === 72, 'Pair Authority migration must contain 72 records.');
assert(migration.summary?.implementationMigrated === false, 'Living Temple Map v1 assumes the refined naming layer is not yet deployed.');
assert(authority.currentImplementationContract?.namingMethod === 'temple-third-name-v1', 'Current deployed naming method drifted.');
assert(authority.currentImplementationContract?.preferredFutureNamingMethod === 'temple-third-name-refined-v2', 'Preferred future naming method drifted.');

const moduleUrl = pathToFileURL(file(MODULE_PATH)).href;
const { classifyRelationshipEdge, computeTempleMapLayout } = await import(moduleUrl);
assert(typeof classifyRelationshipEdge === 'function' && typeof computeTempleMapLayout === 'function', 'Living Temple Map pure helper exports are required.');

const syntheticCases = [
  [{ relationType: 'study-uses-source', claimBoundary: { claimClass: 'computational' } }, 'source-textual'],
  [{ relationType: 'historical-context', claimBoundary: { claimClass: 'historical' } }, 'historical-later'],
  [{ relationType: 'computational-correspondence', claimBoundary: { claimClass: 'computational' } }, 'computational'],
  [{ relationType: 'thematic-parallel', claimBoundary: { claimClass: 'comparative' } }, 'comparative'],
  [{ relationType: 'record-layer-alignment', claimBoundary: { claimClass: 'structural' } }, 'temple-synthesis'],
  [{ relationType: 'unknown-relation', claimBoundary: { claimClass: 'unknown' } }, 'unclassified']
];
syntheticCases.forEach(([edge, expected]) => assert(classifyRelationshipEdge(edge) === expected, `Expected ${expected} relationship band.`));

const endpointMap = new Map();
for (const edge of graph.edges) {
  const band = classifyRelationshipEdge(edge);
  assert(['source-textual','historical-later','computational','comparative','temple-synthesis','unclassified'].includes(band), `Unknown relationship band for ${edge.id}.`);
  endpointMap.set(`${edge.from.namespace}:${edge.from.recordId}`, edge.from);
  endpointMap.set(`${edge.to.namespace}:${edge.to.recordId}`, edge.to);
}
const endpoints = [...endpointMap.values()];
const layout = computeTempleMapLayout(endpoints);
assert(Object.keys(layout).length === endpoints.length, 'Every mapped endpoint must receive one deterministic layout position.');
for (const [key, position] of Object.entries(layout)) {
  assert(Number.isFinite(position.x) && Number.isFinite(position.y), `Layout position for ${key} must be finite.`);
  assert(position.x >= 0 && position.x <= 100 && position.y >= 0 && position.y <= 100, `Layout position for ${key} must remain inside the map plane.`);
}

const bands = graph.edges.reduce((counts, edge) => {
  const band = classifyRelationshipEdge(edge);
  counts[band] = (counts[band] || 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  ok: true,
  schema: 'temple-of-maat/living-temple-map-v1',
  version: '1.0.0',
  graphEdges: graph.edges.length,
  mappedEndpoints: endpoints.length,
  relationshipBands: bands,
  pairAuthorityRecords: migration.records.length,
  refinedNamingMigrated: migration.summary.implementationMigrated,
  autoLoaded: false,
  privateStateReads: false
}, null, 2));
