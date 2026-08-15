import fs from 'node:fs';
import path from 'node:path';
import {
  RELATIONSHIP_BROWSER_ADAPTER_VERSION,
  RELATIONSHIP_BROWSER_SCHEMA,
  createTempleRelationshipBrowserAdapter,
  installTempleRelationshipBrowserAdapter
} from './v5.3.0-relationship-browser-adapter.mjs';

const root = process.cwd();
const readJson = (...parts) => JSON.parse(fs.readFileSync(path.join(root, ...parts), 'utf8'));
const graph = readJson('research', 'relationship-graph.json');
const chambers = readJson('chambers.json');
const library = readJson('library', 'catalog.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function response(data) {
  return { ok: true, status: 200, async json() { return JSON.parse(JSON.stringify(data)); } };
}

const fetchCalls = [];
const fetchImpl = async (input) => {
  const value = String(input);
  fetchCalls.push(value);
  if (value.includes('relationship-graph.json')) return response(graph);
  if (value.includes('chambers.json')) return response(chambers);
  if (value.includes('library/catalog.json')) return response(library);
  return { ok: false, status: 404, async json() { return {}; } };
};

const fakeWindow = {
  fetch: fetchImpl,
  TempleLivingCodex: {
    record(number) {
      if (Number(number) !== 1) return null;
      return {
        number: 1,
        angel: 'Vehuiah',
        hebrewTriplet: 'והו',
        favorite: true,
        reflection: 'private fixture must not cross the adapter',
        nested: { privateNotes: 'also private', publicNote: 'canonical fixture' }
      };
    }
  },
  TempleShem72: {
    record(number) {
      if (Number(number) !== 1) return null;
      return {
        num: 1,
        root: 'והו',
        nameEn: 'Vehuiah',
        attribute: 'Willpower / New Beginnings',
        bookmarks: ['private fixture']
      };
    }
  }
};

const adapter = await createTempleRelationshipBrowserAdapter({ windowRef: fakeWindow, fetchImpl });
assert(adapter.schema === RELATIONSHIP_BROWSER_SCHEMA, 'Adapter schema mismatch.');
assert(adapter.version === RELATIONSHIP_BROWSER_ADAPTER_VERSION, 'Adapter version mismatch.');
assert(adapter.privacy === 'public-canonical-only', 'Adapter privacy boundary mismatch.');
assert(adapter.stats().edgeCount === 6, `Expected six relationship seed edges, found ${adapter.stats().edgeCount}.`);
assert(adapter.stats().providerNamespaces.join(',') === 'chamber,codex,dossier,library', 'Expected all four canonical provider namespaces.');

const chamber = await adapter.resolve('chamber:01');
assert(chamber.resolved, 'Chamber 01 should resolve through public chambers.json fallback.');
assert(chamber.record.thirdName === 'Bifruiah', `Unexpected Chamber 01 Third Name: ${chamber.record.thirdName}`);
assert(chamber.record.law === 'INITIATE WITHOUT ERASURE', 'Chamber provider should preserve canonical law.');

const codex = await adapter.resolve('codex:01');
assert(codex.resolved && codex.record.angel === 'Vehuiah', 'Codex 01 runtime provider failed.');
assert(codex.record.favorite === undefined && codex.record.reflection === undefined, 'Codex provider leaked Journey state markers.');
assert(codex.record.nested?.privateNotes === undefined && codex.record.nested?.publicNote === 'canonical fixture', 'Nested privacy sanitizer failed.');

const dossier = await adapter.resolve('dossier:01');
assert(dossier.resolved, 'Dossier 01 source layer should resolve.');
assert(dossier.record.recordKind === 'shem-dossier-source-layer', 'Dossier provider must identify its public source layer.');
assert(dossier.record.sourceLayer.nameEn === 'Vehuiah', 'Dossier source-layer identity mismatch.');
assert(dossier.record.sourceLayer.bookmarks === undefined, 'Dossier provider leaked private bookmark fixture.');
assert(/Private Journey reflection state is intentionally excluded/.test(dossier.record.provenanceNote), 'Dossier provider must state its privacy boundary.');

const quran = await adapter.resolve('library:source.quran-tanzil-pickthall-edition');
assert(quran.resolved && /Qur'an/i.test(quran.record.title), 'Library source provider failed for Qur’an edition.');
assert(quran.record.rights?.publicExposure === 'metadata-only', 'Library provider must preserve public-exposure rights metadata.');

const quranStudy = await adapter.resolve('library:study.quran-abjad-gematria');
assert(quranStudy.resolved && /Abjad/i.test(quranStudy.record.title), 'Library study provider failed for Abjad record.');

const quranPair = adapter.between('library:source.quran-tanzil-pickthall-edition', 'library:study.quran-abjad-gematria');
assert(quranPair.length === 1 && quranPair[0].id === 'edge.quran-source_to_abjad-study', 'Browser adapter must preserve exact canonical edge lookup.');

const pathResult = adapter.shortestPath('chamber:01', 'dossier:01');
assert(pathResult?.hops === 2, `Expected two-hop Chamber 01 → Codex 01 → Dossier 01 path, got ${pathResult?.hops}.`);
assert(pathResult.endpoints.map((item) => `${item.namespace}:${item.recordId}`).join(' > ') === 'chamber:01 > codex:01 > dossier:01', 'Browser path endpoint order mismatch.');

const bundle = adapter.exportBundle({ edgeIds: ['edge.quran-source_to_abjad-study', 'edge.chamber-01_to_codex-01'] });
assert(bundle.privacy === 'public-canonical-only', 'Adapter relationship bundle privacy mismatch.');
const serialized = JSON.stringify({ chamber, codex, dossier, quran, quranStudy, bundle });
for (const marker of ['private fixture must not cross', 'privateNotes', 'bookmarks', 'localStorage', 'indexedDB']) {
  assert(!serialized.includes(marker), `Browser adapter leaked private marker: ${marker}`);
}

const chamberFetchCountBefore = fetchCalls.filter((value) => value.includes('chambers.json')).length;
await adapter.resolve('chamber:02');
await adapter.resolve('chamber:03');
const chamberFetchCountAfter = fetchCalls.filter((value) => value.includes('chambers.json')).length;
assert(chamberFetchCountAfter === chamberFetchCountBefore, 'Chamber catalog should be memoized after first load.');
const libraryFetches = fetchCalls.filter((value) => value.includes('library/catalog.json')).length;
assert(libraryFetches === 1, `Library catalog should be fetched once, found ${libraryFetches}.`);

const installWindow = { ...fakeWindow };
const installed = await installTempleRelationshipBrowserAdapter({ windowRef: installWindow, fetchImpl });
assert(installWindow.TempleRelationshipBrowser === installed, 'Install helper must publish the adapter to the provided browser global.');
const installedAgain = await installTempleRelationshipBrowserAdapter({ windowRef: installWindow, fetchImpl });
assert(installedAgain === installed, 'Install helper must be idempotent.');

console.log(JSON.stringify({
  ok: true,
  schema: adapter.schema,
  version: adapter.version,
  stats: adapter.stats(),
  chamber: { id: chamber.record.id, thirdName: chamber.record.thirdName },
  codex: { angel: codex.record.angel, privateStateRemoved: true },
  dossier: { recordKind: dossier.record.recordKind, angel: dossier.record.sourceLayer.nameEn },
  library: { source: quran.record.id, study: quranStudy.record.id },
  path: pathResult.endpoints,
  fetchCalls
}, null, 2));
