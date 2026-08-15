import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createTempleKnowledgeInspector } from './v5.3.0-knowledge-inspector.mjs';

const root = process.cwd();
const json = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const endpointMap = json('research/knowledge-kernel/endpoint-map.v1.json');
const seed = json('research/knowledge-kernel/seed.v1.json');
const sources = json('research/knowledge-kernel/source-registry.v1.json');
const ui = read('scripts/v5.3.0-knowledge-inspector-ui.mjs');
const styles = read('styles/v5.3.0-knowledge-inspector.css');
const docs = read('docs/KNOWLEDGE_INSPECTOR.md');

assert(endpointMap.schema === 'temple-of-maat/knowledge-endpoint-map-v1', 'Endpoint map schema mismatch.');
assert(endpointMap.version === '1.0.0', 'Endpoint map version mismatch.');
assert(endpointMap.privacy === 'public-canonical-only', 'Endpoint map must remain public-canonical-only.');
assert(Array.isArray(endpointMap.mappings) && endpointMap.mappings.length === 4, 'Foundation endpoint map must contain four reviewed mappings.');
assert(endpointMap.mappings.every((item) => item.status === 'reviewed' && item.basis), 'Every endpoint mapping requires reviewed status and an explicit basis.');
assert(new Set(endpointMap.mappings.map((item) => item.endpoint)).size === endpointMap.mappings.length, 'Endpoint mappings must be unique.');

const fileByUrl = new Map([
  ['seed.v1.json', 'research/knowledge-kernel/seed.v1.json'],
  ['source-registry.v1.json', 'research/knowledge-kernel/source-registry.v1.json'],
  ['method-registry.v1.json', 'research/knowledge-kernel/method-registry.v1.json'],
  ['endpoint-map.v1.json', 'research/knowledge-kernel/endpoint-map.v1.json']
]);

async function fakeFetch(input, init = {}) {
  assert((init.method || 'GET') === 'GET', 'Knowledge Inspector must use read-only GET requests.');
  const url = String(input);
  const pair = [...fileByUrl.entries()].find(([name]) => url.endsWith(name));
  if (!pair) return { ok: false, status: 404, async json() { return {}; } };
  return { ok: true, status: 200, async json() { return json(pair[1]); } };
}

const inspector = await createTempleKnowledgeInspector({ fetchImpl: fakeFetch, windowRef: {} });
const stats = inspector.stats();
assert(inspector.schema === 'temple-of-maat/knowledge-inspector-v1', 'Inspector schema mismatch.');
assert(inspector.version === '1.0.0', 'Inspector version mismatch.');
assert(inspector.privacy === 'public-canonical-only', 'Inspector privacy mismatch.');
assert(stats.records === seed.records.length && stats.claims === seed.claims.length, 'Inspector must expose complete public seed counts.');
assert(stats.sources === sources.sources.length, 'Inspector must expose complete source-registry count.');
assert(stats.reviewedEndpointMappings === 4, 'Inspector must report four reviewed endpoint mappings.');

const chamber = inspector.inspectEndpoint('chamber:01');
assert(chamber.mapped === true, 'Chamber 01 must map to the Kernel.');
assert(chamber.recordInspection?.record?.recordId === 'chamber.01', 'Chamber endpoint must resolve exact Kernel chamber record.');
assert(chamber.recordInspection?.claims?.some((claim) => claim.claimId === 'claim.chamber.01.current-law'), 'Chamber 01 current-law claim must be inspectable.');
assert(chamber.recordInspection.claims.every((claim) => claim.boundaries?.historicalIdentity === false && claim.boundaries?.metaphysicalIdentity === false), 'Kernel claim identity boundaries must remain false.');

const quran = inspector.inspectEndpoint('library:source.quran-tanzil-pickthall-edition');
assert(quran.mapped === true, 'Qur\'an source endpoint must have reviewed mapping.');
assert(quran.sourceInspection?.source?.id === 'source.quran.tanzil-pickthall', 'Qur\'an source endpoint must resolve canonical Kernel source ID.');
assert(quran.preferredPassage?.recordId === 'passage.quran.49.13', 'Qur\'an endpoint must surface reviewed 49:13 seed passage.');
assert(quran.preferredPassage?.content?.mode === 'exact-source', 'Qur\'an 49:13 seed must remain exact-source.');
assert(typeof quran.preferredPassage?.content?.rightsNote === 'string' && quran.preferredPassage.content.rightsNote.length > 20, 'Exact source passage must surface rights note.');
assert(quran.preferredPassage?.content?.limitations?.length, 'Exact source passage must surface limitations.');

const unmapped = inspector.inspectEndpoint('library:study.quran-abjad-gematria');
assert(unmapped.mapped === false, 'Unmapped Abjad study endpoint must remain unmapped.');
assert(/will not infer one/i.test(unmapped.note), 'Unmapped endpoint must preserve no-inference language.');

const quranPassages = inspector.passagesForSource('source.quran.tanzil-pickthall');
assert(quranPassages.some((item) => item.recordId === 'passage.quran.49.13'), 'Source passage lookup must resolve Qur\'an 49:13.');
assert(inspector.inspectEndpoint({ namespace: 'chamber', recordId: '02' }).recordInspection?.record?.recordId === 'chamber.02', 'Object endpoint form must resolve reviewed mapping.');

assert(ui.includes('Evidence beneath the relationship'), 'UI must label the Kernel inspection layer.');
assert(ui.includes('Claim Inspection') && ui.includes('Source Passage Inspection'), 'UI must expose claim and source passage inspection.');
assert(ui.includes('UNMAPPED ENDPOINT'), 'UI must visibly preserve unmapped endpoints.');
assert(ui.includes("passage.content?.mode !== 'exact-source'"), 'UI must distinguish exact-source from non-exact passage modes.');
assert(!/localStorage\.|indexedDB\.|TemplePilgrimJourney\.state|TempleLibrary\.state/.test(ui), 'Inspector UI must not read private visitor state.');
assert(!/fetch\([^\n]*method\s*:\s*['\"](?:POST|PUT|PATCH|DELETE)/i.test(read('scripts/v5.3.0-knowledge-inspector.mjs')), 'Inspector must not issue write requests.');
assert(styles.includes('@media(max-width:760px)') && styles.includes('@media(max-width:430px)'), 'Inspector UI requires mobile breakpoints.');
assert(docs.includes('A missing claim is rendered as missing.'), 'Documentation must prohibit generated replacement claims.');
assert(docs.includes('exact-source') && docs.includes('careful-paraphrase') && docs.includes('normalized-temple-language'), 'Documentation must preserve source-passage content modes.');
assert(docs.includes('does not read or write'), 'Documentation must state private-state boundary.');

const serializedPublic = JSON.stringify({ endpointMap, stats, chamber, quran, unmapped });
for (const marker of ['temple_v525_pilgrim_journey', 'temple_library_personal_state_v1', 'temple_pilgrimage_enoch_v1', 'temple_pilgrimage_pistis_sophia_v1']) {
  assert(!serializedPublic.includes(marker), `Inspector output leaked private-state marker: ${marker}`);
}

console.log(JSON.stringify({
  ok: true,
  schema: inspector.schema,
  version: inspector.version,
  stats,
  chamberClaims: chamber.recordInspection.claims.length,
  quranPreferredPassage: quran.preferredPassage.recordId,
  unmappedStudyPreserved: true
}, null, 2));
