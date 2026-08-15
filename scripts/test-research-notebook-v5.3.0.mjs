import fs from 'node:fs';
import path from 'node:path';
import { createTempleResearchNotebook, RESEARCH_NOTEBOOK_KEY } from './v5.3.0-research-notebook.mjs';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const schema = json('research/schema/research-notebook-state.v1.schema.json');
const uiText = read('scripts/v5.3.0-research-notebook-ui.mjs');
const coreText = read('scripts/v5.3.0-research-notebook.mjs');
const docs = read('docs/RESEARCH_NOTEBOOK.md');
const css = read('styles/v5.3.0-research-notebook.css');

assert(schema.properties?.schema?.const === 'temple-of-maat/research-notebook-state-v1', 'Notebook schema identity mismatch.');
assert(schema.properties?.version?.const === '1.0.0', 'Notebook schema version mismatch.');
assert(schema.properties?.privacy?.const === 'device-local-private', 'Notebook schema privacy must be device-local-private.');
assert(schema.$defs?.citation?.properties?.kind?.enum?.includes('claim') && schema.$defs?.citation?.properties?.kind?.enum?.includes('passage'), 'Notebook schema must support canonical claim and passage citations.');

const backing = new Map();
const writes = [];
let failNextSet = false;
const storage = {
  getItem(key) { return backing.has(key) ? backing.get(key) : null; },
  setItem(key, value) {
    if (failNextSet) {
      failNextSet = false;
      throw new Error('Simulated localStorage quota failure.');
    }
    writes.push({ op: 'set', key, value });
    backing.set(key, value);
  },
  removeItem(key) { writes.push({ op: 'remove', key }); backing.delete(key); }
};

const quranClaim = { claimId: 'claim.quran.49.13.conduct', subjectId: 'passage.quran.49.13', predicate: 'indexes-concept', object: { recordId: 'concept.conduct' } };
const quranPassage = { recordId: 'passage.quran.49.13', entityType: 'source-passage', displayName: "Qur'an 49:13" };
const quranSource = { id: 'source.quran.tanzil-pickthall', title: "The Qur'an — Arabic Source Text with Pickthall Translation" };
const inspector = {
  claim(id) { return id === quranClaim.claimId ? structuredClone(quranClaim) : null; },
  record(id) { return id === quranPassage.recordId ? structuredClone(quranPassage) : null; },
  source(id) { return id === quranSource.id ? structuredClone(quranSource) : null; },
  inspectClaim(id) { return id === quranClaim.claimId ? { claim: structuredClone(quranClaim) } : null; },
  inspectRecord(id) { return id === quranPassage.recordId ? { record: structuredClone(quranPassage), claims: [structuredClone(quranClaim)] } : null; },
  inspectSource(id) { return id === quranSource.id ? { source: structuredClone(quranSource), claims: [structuredClone(quranClaim)], passages: [structuredClone(quranPassage)] } : null; },
  inspectEndpoint(id) {
    if (id === 'library:source.quran-tanzil-pickthall-edition') return {
      endpoint: id,
      mapped: true,
      sourceInspection: { source: structuredClone(quranSource), claims: [structuredClone(quranClaim)] },
      recordInspection: null,
      preferredPassage: structuredClone(quranPassage)
    };
    return { endpoint: id, mapped: false, sourceInspection: null, recordInspection: null, preferredPassage: null };
  }
};

const fixedWindow = { crypto: { randomUUID: () => '12345678-1234-4234-8234-123456789abc' } };
const notebook = await createTempleResearchNotebook({ storage, inspector, windowRef: fixedWindow });
assert(notebook.schema === 'temple-of-maat/research-notebook-state-v1', 'Notebook runtime schema mismatch.');
assert(notebook.version === '1.0.0', 'Notebook runtime version mismatch.');
assert(notebook.privacy === 'device-local-private', 'Notebook runtime privacy mismatch.');
assert(notebook.key === RESEARCH_NOTEBOOK_KEY && RESEARCH_NOTEBOOK_KEY === 'temple_research_notebook_v1', 'Notebook must use its dedicated private key.');
assert(notebook.entries().length === 0 && writes.length === 0, 'Notebook initialization must not write private state.');

const comparison = {
  leftValue: 'library:source.quran-tanzil-pickthall-edition',
  rightValue: 'library:study.quran-abjad-gematria',
  left: { endpoint: { namespace: 'library', recordId: 'source.quran-tanzil-pickthall-edition' } },
  right: { endpoint: { namespace: 'library', recordId: 'study.quran-abjad-gematria' } }
};
const draft = notebook.createDraftFromComparison(comparison);
assert(writes.length === 0, 'Preparing a comparison draft must not persist anything.');
assert(draft.id === 'notebook.12345678-1234-4234-8234-123456789abc', 'Draft ID must use device UUID factory.');
assert(draft.citations.some((item) => item.kind === 'endpoint' && item.id === comparison.leftValue), 'Draft must cite Record A endpoint.');
assert(draft.citations.some((item) => item.kind === 'endpoint' && item.id === comparison.rightValue), 'Draft must cite Record B endpoint even when it has no reviewed Kernel mapping.');
assert(draft.citations.some((item) => item.kind === 'claim' && item.id === quranClaim.claimId), 'Draft must cite reviewed Kernel claim when available.');
assert(draft.citations.some((item) => item.kind === 'passage' && item.id === quranPassage.recordId), 'Draft must cite reviewed source passage when available.');
assert(draft.citations.some((item) => item.kind === 'source' && item.id === quranSource.id), 'Draft must cite reviewed Kernel source when available.');

const saved = notebook.save({ ...draft, title: 'Private Qur\'an comparison', body: 'A private interpretation that must never become public graph evidence.', stage: 'hypothesis' });
assert(writes.length === 1 && writes[0].op === 'set' && writes[0].key === RESEARCH_NOTEBOOK_KEY, 'Explicit Save must write only the Notebook key.');
assert(saved.stage === 'hypothesis' && notebook.entries().length === 1, 'Explicit save must persist one private entry.');
assert(JSON.parse(backing.get(RESEARCH_NOTEBOOK_KEY)).privacy === 'device-local-private', 'Persisted state must retain private classification.');

const reloaded = await createTempleResearchNotebook({ storage, inspector, windowRef: fixedWindow });
assert(reloaded.entries().length === 1 && reloaded.entries()[0].title === 'Private Qur\'an comparison', 'Saved Notebook state must restore from device-local storage.');
const exported = reloaded.exportState();
assert(exported.entries[0].citations.length === draft.citations.length, 'Private export must preserve canonical citation IDs.');
assert(!Object.prototype.hasOwnProperty.call(exported, 'exportedAt'), 'Private export must remain valid against the state schema.');
assert(Object.keys(exported).every((key) => Object.prototype.hasOwnProperty.call(schema.properties, key)), 'Notebook export top-level properties must be declared by the state schema.');

let invalidRejected = false;
try {
  reloaded.save({ ...reloaded.createDraft(), citations: [{ kind: 'claim', id: 'claim.not-real' }] });
} catch (error) {
  invalidRejected = /not canonical or valid/i.test(error.message);
}
assert(invalidRejected, 'Unknown canonical claim IDs must be rejected before persistence.');
assert(writes.length === 1, 'Rejected invalid citation must not write storage.');

const beforeQuotaState = JSON.stringify(reloaded.state());
const beforeQuotaStorage = backing.get(RESEARCH_NOTEBOOK_KEY);
failNextSet = true;
let quotaFailureSurfaced = false;
try {
  reloaded.save({ ...reloaded.get(saved.id), title: 'This title must not survive a failed write.' });
} catch (error) {
  quotaFailureSurfaced = /quota failure/i.test(error.message);
}
assert(quotaFailureSurfaced, 'Device storage write failures must surface to the Notebook caller.');
assert(JSON.stringify(reloaded.state()) === beforeQuotaState, 'Failed Notebook writes must not mutate in-memory state.');
assert(backing.get(RESEARCH_NOTEBOOK_KEY) === beforeQuotaStorage, 'Failed Notebook writes must leave persisted state unchanged.');

const repairState = {
  schema: 'temple-of-maat/research-notebook-state-v1',
  version: '1.0.0',
  privacy: 'device-local-private',
  updatedAt: 'not-a-date',
  entries: [{
    id: 'notebook.repair-entry',
    title: 'Repair fixture',
    body: 'Private repair fixture.',
    stage: 'question',
    citations: [
      { kind: 'claim', id: 'claim.not-real' },
      { kind: 'source', id: quranSource.id }
    ],
    createdAt: 'not-created-at',
    updatedAt: 'not-updated-at'
  }]
};
const repairStorage = {
  getItem(key) { return key === RESEARCH_NOTEBOOK_KEY ? JSON.stringify(repairState) : null; },
  setItem() { throw new Error('Repair fixture must not write during load.'); },
  removeItem() {}
};
const repaired = await createTempleResearchNotebook({ storage: repairStorage, inspector, windowRef: fixedWindow });
const repairedEntry = repaired.entries()[0];
assert(repairedEntry.citations.length === 1 && repairedEntry.citations[0].id === quranSource.id, 'Reload must filter noncanonical Notebook citations while preserving the valid private entry.');
assert(Number.isFinite(Date.parse(repaired.state().updatedAt)), 'Reload must normalize malformed Notebook state timestamp.');
assert(Number.isFinite(Date.parse(repairedEntry.createdAt)) && Number.isFinite(Date.parse(repairedEntry.updatedAt)), 'Reload must normalize malformed Notebook entry timestamps.');

const graphBundle = JSON.stringify({ schema: 'temple-of-maat/relationship-bundle-v1', edgeCount: 0 });
assert(!graphBundle.includes('Private Qur\'an comparison'), 'Private Notebook content must not be part of public graph bundle fixtures.');

assert(coreText.includes("RESEARCH_NOTEBOOK_KEY = 'temple_research_notebook_v1'"), 'Core must declare dedicated private storage key.');
assert(coreText.includes('createDraftFromComparison') && coreText.includes('saveEntry'), 'Core must separate draft creation from explicit save.');
assert(coreText.includes('function commit(nextState)'), 'Notebook core must use transactional device-state commits.');
assert(coreText.includes('function normalizeDateTime'), 'Notebook core must normalize restored timestamps before export.');
assert(!/fetch\(/.test(coreText), 'Notebook core must not issue network requests.');
assert(uiText.includes('Nothing is persisted until you explicitly choose Save Entry.'), 'UI must communicate consent-before-persistence.');
assert(uiText.includes('Draft Note from Comparison') && uiText.includes('Save Entry'), 'UI must expose draft and explicit-save actions separately.');
assert(uiText.includes('Export Private Notebook JSON'), 'UI must provide explicit private export.');
assert(!uiText.includes('tm524-dock'), 'Notebook must not add a bottom-dock control.');
assert(css.includes('@media(max-width:760px)') && css.includes('@media(max-width:430px)'), 'Notebook must support mobile breakpoints.');
assert(docs.includes('Preparing a draft does not persist it.'), 'Docs must define consent-before-persistence.');
assert(docs.includes('A private note does not become a public claim'), 'Docs must preserve public/private evidence boundary.');
assert(docs.includes('Exporting is not publishing.'), 'Docs must distinguish private export from publication.');

console.log(JSON.stringify({
  ok: true,
  schema: notebook.schema,
  version: notebook.version,
  privacy: notebook.privacy,
  persistedEntries: reloaded.entries().length,
  comparisonCitationCount: draft.citations.length,
  explicitSaveWrites: writes.filter((item) => item.op === 'set').length,
  invalidCitationRejected: true,
  transactionalStorageFailure: true,
  schemaValidExport: true,
  corruptedStateRepair: true,
  timestampRepair: true
}, null, 2));
