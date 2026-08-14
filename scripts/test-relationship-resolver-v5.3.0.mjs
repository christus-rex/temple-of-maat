import fs from 'node:fs';
import path from 'node:path';
import {
  RELATIONSHIP_BUNDLE_SCHEMA,
  RELATIONSHIP_GRAPH_SCHEMA,
  RELATIONSHIP_GRAPH_VERSION,
  createRelationshipGraph,
  createStaticJsonProvider,
  loadRelationshipGraph,
  normalizeEndpoint
} from './v5.3.0-relationship-resolver.mjs';

const root = process.cwd();
const graphData = JSON.parse(fs.readFileSync(path.join(root, 'research', 'relationship-graph.json'), 'utf8'));
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };

const providerRecords = [
  { id: 'source.quran-tanzil-pickthall-edition', title: 'Qur’an source fixture' },
  { id: 'study.quran-abjad-gematria', title: 'Qur’an Abjad fixture' }
];
const provider = createStaticJsonProvider(providerRecords);
const resolver = createRelationshipGraph(graphData, { providers: { library: provider } });

assert(resolver.schema === RELATIONSHIP_GRAPH_SCHEMA, 'Resolver schema constant mismatch');
assert(resolver.version === RELATIONSHIP_GRAPH_VERSION, 'Resolver version constant mismatch');
assert(resolver.stats().privacy === 'public-canonical-only', 'Resolver privacy boundary mismatch');
assert(resolver.stats().namespaceCount === 4, 'Expected four endpoint namespaces');
assert(resolver.stats().edgeCount === 6, `Expected six seed edges, found ${resolver.stats().edgeCount}`);
assert(resolver.stats().providerNamespaces.includes('library'), 'Construction-time provider registration failed');

const endpointFromString = normalizeEndpoint('library:source.quran-tanzil-pickthall-edition');
assert(endpointFromString.namespace === 'library' && endpointFromString.recordId === 'source.quran-tanzil-pickthall-edition', 'Endpoint string normalization failed');
let invalidEndpointError = '';
try { normalizeEndpoint('unknown:record'); } catch (error) { invalidEndpointError = error.message; }
assert(invalidEndpointError.includes('Unknown relationship namespace'), 'Unknown namespace should fail normalization');

const sourceStudy = resolver.edges({ relationType: 'study-uses-source' });
assert(sourceStudy.length === 4, `Expected four study-uses-source edges, found ${sourceStudy.length}`);
const l1l2 = resolver.edges({ layersAll: ['L1', 'L2'] });
assert(l1l2.length === 4, `Expected four L1+L2 edges, found ${l1l2.length}`);
const structural = resolver.edges({ claimClass: 'structural' });
assert(structural.length === 2, `Expected two structural edges, found ${structural.length}`);
const libraryEdges = resolver.edges({ namespacesAny: ['library'] });
assert(libraryEdges.length === 4, `Expected four Library edges, found ${libraryEdges.length}`);

const dssNeighbors = resolver.neighbors('library:source.dead-sea-scrolls-qumran-corpus');
assert(dssNeighbors.length === 2, `Expected two Dead Sea Scrolls study neighbors, found ${dssNeighbors.length}`);
assert(dssNeighbors.every((item) => item.traversal === 'outgoing'), 'Source→study neighbors should be outgoing');
assert(dssNeighbors.some((item) => item.endpoint.recordId === 'study.dead-sea-scrolls-comprehensive-analysis'), 'Comprehensive DSS study neighbor missing');
assert(dssNeighbors.some((item) => item.endpoint.recordId === 'study.dead-sea-scrolls-gematria-companion'), 'DSS gematria study neighbor missing');

const quranBetween = resolver.between(
  'library:source.quran-tanzil-pickthall-edition',
  'library:study.quran-abjad-gematria'
);
assert(quranBetween.length === 1 && quranBetween[0].id === 'edge.quran-source_to_abjad-study', 'Exact pair relation lookup failed');

const search = resolver.search('reproducibility quran');
assert(search.length === 1 && search[0].id === 'edge.quran-source_to_abjad-study', 'Multi-term edge search failed');
const interpretive = resolver.search('interpretive-restraint');
assert(interpretive.length === 1 && interpretive[0].id === 'edge.dss-source_to_gematria-study', 'Tag search failed');

const facets = resolver.facetCounts();
assert(facets.total === 6, 'Facet total mismatch');
assert(facets.relationType['study-uses-source'] === 4, 'Relation facet mismatch');
assert(facets.relationType['record-layer-alignment'] === 2, 'Structural relation facet mismatch');
assert(facets.provenanceLayer.L4 === 4, `Expected four L4-bearing edges, found ${facets.provenanceLayer.L4}`);
assert(facets.namespace.library === 8, `Expected eight Library endpoint appearances, found ${facets.namespace.library}`);

const structuralPath = resolver.shortestPath('chamber:01', 'dossier:01');
assert(structuralPath?.hops === 2, `Expected Chamber 01 → Codex 01 → Dossier 01 path in two hops, got ${structuralPath?.hops}`);
assert(structuralPath.endpoints.map((item) => `${item.namespace}:${item.recordId}`).join(' > ') === 'chamber:01 > codex:01 > dossier:01', 'Structural path endpoint order mismatch');
assert(resolver.shortestPath('library:source.quran-tanzil-pickthall-edition', 'dossier:01') === null, 'Disconnected graph regions should not invent a path');

const resolvedLibrary = await resolver.resolve('library:study.quran-abjad-gematria');
assert(resolvedLibrary.resolved && resolvedLibrary.record.title === 'Qur’an Abjad fixture', 'Registered provider did not resolve Library endpoint');
const unresolvedChamber = await resolver.resolve('chamber:01');
assert(unresolvedChamber.resolved === false && unresolvedChamber.record === null, 'Missing provider should return an unresolved public descriptor rather than guess data');

resolver.registerProvider('chamber', createStaticJsonProvider([{ num: '01', title: 'Chamber fixture' }], { key: 'num' }));
const resolvedChamber = await resolver.resolve('chamber:01');
assert(resolvedChamber.resolved && resolvedChamber.record.title === 'Chamber fixture', 'Late provider registration failed');
resolver.unregisterProvider('chamber');
assert((await resolver.resolve('chamber:01')).resolved === false, 'Provider unregister failed');

const bundle = resolver.exportBundle({ edgeIds: ['edge.quran-source_to_abjad-study', 'edge.dss-source_to_gematria-study'] });
assert(bundle.schema === RELATIONSHIP_BUNDLE_SCHEMA, 'Relationship bundle schema mismatch');
assert(bundle.graphSchema === RELATIONSHIP_GRAPH_SCHEMA && bundle.graphVersion === RELATIONSHIP_GRAPH_VERSION, 'Bundle source graph identity missing');
assert(bundle.privacy === 'public-canonical-only', 'Bundle privacy boundary mismatch');
assert(bundle.edges.length === 2, 'Bundle edge selection failed');
assert(bundle.endpoints.length === 4, 'Bundle endpoint deduplication failed');
const serializedBundle = JSON.stringify(bundle);
for (const marker of ['reflections', 'privateNotes', 'localStorage', 'indexedDB']) {
  assert(!serializedBundle.includes(marker), `Bundle leaked private-state marker: ${marker}`);
}

const graphSnapshot = JSON.stringify(graphData);
resolver.edges()[0].summary = 'consumer mutation';
assert(JSON.stringify(graphData) === graphSnapshot, 'Resolver queries must not mutate canonical graph data');
assert(resolver.getEdge('edge.quran-source_to_abjad-study').summary !== 'consumer mutation', 'Returned edge mutation must not alter resolver index');

const fakeFetch = async (url) => ({
  ok: true,
  status: 200,
  async json() { return graphData; },
  url
});
const loaded = await loadRelationshipGraph({ graphUrl: 'https://example.invalid/research/relationship-graph.json', fetchImpl: fakeFetch });
assert(loaded.stats().edgeCount === 6, 'loadRelationshipGraph custom fetch path failed');

let unsupportedSchemaError = '';
try { createRelationshipGraph({ ...graphData, schema: 'temple-of-maat/relationship-graph-v99' }); }
catch (error) { unsupportedSchemaError = error.message; }
assert(unsupportedSchemaError.includes('Unsupported relationship graph schema'), 'Unsupported graph schema must be rejected');

console.log(JSON.stringify({
  ok: true,
  schema: resolver.schema,
  version: resolver.version,
  stats: resolver.stats(),
  quranPair: quranBetween[0].id,
  dssNeighborCount: dssNeighbors.length,
  structuralPath: structuralPath.endpoints,
  bundle: { schema: bundle.schema, endpointCount: bundle.endpoints.length, edgeCount: bundle.edges.length },
  privateStateLeak: false
}, null, 2));
