import fs from 'node:fs';
import path from 'node:path';
import { createTempleScribeWorkspace, SCRIBE_WORKSPACE_KEY } from './v5.3.0-scribe-workspace.mjs';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const schema = json('research/schema/scribe-workspace-state.v1.schema.json');
const coreText = read('scripts/v5.3.0-scribe-workspace.mjs');
const uiText = read('scripts/v5.3.0-scribe-workspace-ui.mjs');
const css = read('styles/v5.3.0-scribe-workspace.css');
const docs = read('docs/SCRIBE_WORKSPACE.md');

assert(schema.properties?.schema?.const === 'temple-of-maat/scribe-workspace-state-v1', 'Scribe schema identity mismatch.');
assert(schema.properties?.version?.const === '1.0.0', 'Scribe schema version mismatch.');
assert(schema.properties?.privacy?.const === 'device-local-private', 'Scribe schema must remain device-local-private.');
const eventKinds = schema.$defs?.ledgerEvent?.properties?.kind?.enum || [];
for (const kind of ['observation', 'inference', 'uncertainty', 'dissent', 'correction', 'reply']) {
  assert(eventKinds.includes(kind), `Scribe schema missing ledger kind ${kind}.`);
}
assert(schema.$defs?.ledgerEvent?.allOf?.length, 'Scribe schema must conditionally require related events for correction/reply.');

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

const quranClaim = { claimId: 'claim.quran.49.13.conduct' };
const quranPassage = { recordId: 'passage.quran.49.13', entityType: 'source-passage', displayName: "Qur'an 49:13" };
const quranSource = { id: 'source.quran.tanzil-pickthall', title: "The Qur'an — Arabic Source Text with Pickthall Translation" };
const notebookEntry = {
  id: 'notebook.entry-one',
  title: 'Private Qur’an comparison',
  body: 'PRIVATE NOTEBOOK BODY',
  stage: 'hypothesis',
  citations: [
    { kind: 'claim', id: quranClaim.claimId },
    { kind: 'passage', id: quranPassage.recordId },
    { kind: 'source', id: quranSource.id }
  ]
};
const secondNotebookEntry = {
  id: 'notebook.entry-two',
  title: 'Private source follow-up',
  body: 'SECOND PRIVATE NOTEBOOK BODY',
  stage: 'note',
  citations: [{ kind: 'source', id: quranSource.id }]
};
const notebookEntries = new Map([
  [notebookEntry.id, notebookEntry],
  [secondNotebookEntry.id, secondNotebookEntry]
]);
const notebook = {
  schema: 'temple-of-maat/research-notebook-state-v1',
  privacy: 'device-local-private',
  get(id) { return notebookEntries.has(id) ? structuredClone(notebookEntries.get(id)) : null; },
  entries() { return [...notebookEntries.values()].map((entry) => structuredClone(entry)); },
  citationsFromComparison() {
    return [
      { kind: 'endpoint', id: 'library:source.quran-tanzil-pickthall-edition' },
      { kind: 'endpoint', id: 'library:study.quran-abjad-gematria' },
      { kind: 'claim', id: quranClaim.claimId },
      { kind: 'passage', id: quranPassage.recordId },
      { kind: 'source', id: quranSource.id }
    ];
  },
  resolveCitation(citation) {
    if (citation.kind === 'endpoint') return { ...citation, canonical: null, inspection: { mapped: citation.id.includes('source.quran') } };
    if (citation.kind === 'claim' && citation.id === quranClaim.claimId) return { ...citation, canonical: structuredClone(quranClaim) };
    if (citation.kind === 'passage' && citation.id === quranPassage.recordId) return { ...citation, canonical: structuredClone(quranPassage) };
    if (citation.kind === 'source' && citation.id === quranSource.id) return { ...citation, canonical: structuredClone(quranSource) };
    return null;
  }
};

const ids = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888'
];
const fixedWindow = { crypto: { randomUUID: () => ids.shift() } };
const scribe = await createTempleScribeWorkspace({ storage, notebook, windowRef: fixedWindow });
assert(scribe.schema === 'temple-of-maat/scribe-workspace-state-v1', 'Scribe runtime schema mismatch.');
assert(scribe.version === '1.0.0', 'Scribe runtime version mismatch.');
assert(scribe.privacy === 'device-local-private', 'Scribe runtime privacy mismatch.');
assert(scribe.key === SCRIBE_WORKSPACE_KEY && SCRIBE_WORKSPACE_KEY === 'temple_scribe_workspace_v1', 'Scribe Workspace must use its dedicated private key.');
assert(scribe.threads().length === 0 && writes.length === 0, 'Scribe initialization must not persist anything.');

const comparison = {
  leftValue: 'library:source.quran-tanzil-pickthall-edition',
  rightValue: 'library:study.quran-abjad-gematria'
};
const draft = scribe.createThreadFromComparison(comparison);
assert(writes.length === 0, 'Preparing a Scribe thread draft must not persist it.');
assert(draft.id === 'thread.11111111-1111-4111-8111-111111111111', 'Thread ID must use private device UUID factory.');
assert(draft.anchors.length === 5, 'Thread from comparison must preserve canonical comparison anchors.');

const injectedLedger = [{
  id: 'scribe.injected-ledger-event',
  kind: 'inference',
  text: 'This injected event attempts to bypass appendLedger.',
  reasoning: '',
  sourceCitations: [],
  createdAt: new Date().toISOString()
}];
const saved = scribe.save({
  ...draft,
  title: 'Qur’an / Abjad Scribe Thread',
  inquiry: 'What is source wording, what is numerical inference, and what remains uncertain?',
  notebookEntryIds: [notebookEntry.id],
  ledger: injectedLedger
});
assert(writes.length === 1 && writes[0].key === SCRIBE_WORKSPACE_KEY, 'Explicit Save Thread must write only the Scribe key.');
assert(saved.notebookEntryIds[0] === notebookEntry.id && saved.ledger.length === 0, 'New-thread Save must never seed ledger history; ledger records must enter through appendLedger.');
assert(!backing.get(SCRIBE_WORKSPACE_KEY).includes('bypass appendLedger'), 'Injected ledger content must never reach persisted Scribe state.');
assert(!backing.get(SCRIBE_WORKSPACE_KEY).includes('PRIVATE NOTEBOOK BODY'), 'Scribe state must reference Notebook IDs rather than copying its body into public evidence.');

let unknownNotebookRejected = false;
const unknownNotebookDraft = scribe.createThreadDraft();
const writesBeforeUnknownNotebook = writes.length;
try {
  scribe.save({ ...unknownNotebookDraft, notebookEntryIds: ['notebook.missing-entry'] });
} catch (error) {
  unknownNotebookRejected = /Unknown Research Notebook entry/i.test(error.message);
}
assert(unknownNotebookRejected, 'Unknown Research Notebook references must be rejected on explicit save.');
assert(writes.length === writesBeforeUnknownNotebook, 'Rejected Notebook references must not write Scribe state.');

const attached = scribe.attachEntry(saved.id, secondNotebookEntry.id);
assert(attached.notebookEntryIds.includes(secondNotebookEntry.id), 'attachEntry must add an existing Notebook entry reference.');
assert(attached.anchors.some((citation) => citation.kind === 'source' && citation.id === quranSource.id), 'attachEntry must carry the Notebook entry canonical citations into thread anchors.');
assert(!backing.get(SCRIBE_WORKSPACE_KEY).includes('SECOND PRIVATE NOTEBOOK BODY'), 'Attaching a Notebook entry must not copy its private body into Scribe state.');

const observation = scribe.appendLedger(saved.id, {
  kind: 'observation',
  text: 'The selected source record is explicitly separated from the Abjad study.',
  sourceCitations: [{ kind: 'source', id: quranSource.id }]
});
assert(observation.kind === 'observation' && observation.sourceCitations.length === 1, 'Observation must retain its explicit source citation.');
const observationSnapshot = JSON.stringify(observation);

let missingReasoningRejected = false;
const writesBeforeRejectedInference = writes.length;
try {
  scribe.appendLedger(saved.id, { kind: 'inference', text: 'A numerical relationship therefore proves identity.' });
} catch (error) {
  missingReasoningRejected = /require visible reasoning/i.test(error.message);
}
assert(missingReasoningRejected, 'Inference without visible reasoning must be rejected.');
assert(writes.length === writesBeforeRejectedInference, 'Rejected inference must not write private state.');

const inference = scribe.appendLedger(saved.id, {
  kind: 'inference',
  text: 'The numerical study depends on declared normalization choices.',
  reasoning: 'The study record names a normalization profile and states that the source edition remains unchanged.',
  sourceCitations: [{ kind: 'claim', id: quranClaim.claimId }]
});
assert(inference.kind === 'inference' && inference.reasoning.length > 0, 'Inference must preserve its visible reasoning trail.');

let missingCorrectionTargetRejected = false;
try {
  scribe.appendLedger(saved.id, { kind: 'correction', text: 'Correction without a target.' });
} catch (error) {
  missingCorrectionTargetRejected = /point to an existing ledger event/i.test(error.message);
}
assert(missingCorrectionTargetRejected, 'Correction without an existing target must be rejected.');

const correction = scribe.appendLedger(saved.id, {
  kind: 'correction',
  text: 'Clarification: source dependency does not establish theological or metaphysical identity.',
  reasoning: 'The graph boundary records metaphysical identity as false.',
  relatedLogId: inference.id,
  sourceCitations: [{ kind: 'claim', id: quranClaim.claimId }]
});
assert(correction.relatedLogId === inference.id, 'Correction must point to the prior ledger event it corrects.');
assert(JSON.stringify(scribe.get(saved.id).ledger[0]) === observationSnapshot, 'Appending a correction must not rewrite earlier ledger history.');

const reply = scribe.appendLedger(saved.id, {
  kind: 'reply',
  text: 'Counter-reading preserved: the arithmetic may still be meaningful as a modern contemplative practice.',
  relatedLogId: correction.id
});
assert(reply.relatedLogId === correction.id, 'Right of reply must preserve its target ledger event.');
assert(scribe.get(saved.id).ledger.length === 4, 'Scribe ledger must retain observation, inference, correction, and reply as separate records.');

const reloaded = await createTempleScribeWorkspace({ storage, notebook, windowRef: fixedWindow });
assert(reloaded.threads().length === 1 && reloaded.threads()[0].ledger.length === 4, 'Saved Scribe thread and append-only ledger must restore from device-local storage.');
const exported = reloaded.exportState();
assert(exported.privacy === 'device-local-private', 'Private Scribe export must retain privacy classification.');
assert(!Object.prototype.hasOwnProperty.call(exported, 'exportedAt'), 'Export must remain valid against the state schema rather than adding undeclared top-level properties.');
assert(Object.keys(exported).every((key) => Object.prototype.hasOwnProperty.call(schema.properties, key)), 'Export top-level properties must be declared by the state schema.');

const stateBeforeQuotaFailure = JSON.stringify(reloaded.state());
const storageBeforeQuotaFailure = backing.get(SCRIBE_WORKSPACE_KEY);
failNextSet = true;
let quotaFailureSurfaced = false;
try {
  reloaded.appendLedger(saved.id, { kind: 'observation', text: 'This write should fail transactionally.' });
} catch (error) {
  quotaFailureSurfaced = /quota failure/i.test(error.message);
}
assert(quotaFailureSurfaced, 'Device storage write failures must surface to the caller.');
assert(JSON.stringify(reloaded.state()) === stateBeforeQuotaFailure, 'Failed device storage writes must not mutate in-memory Scribe state.');
assert(backing.get(SCRIBE_WORKSPACE_KEY) === storageBeforeQuotaFailure, 'Failed device storage writes must leave persisted Scribe state unchanged.');

let badCitationRejected = false;
const badDraft = reloaded.createThreadDraft();
try {
  reloaded.save({ ...badDraft, anchors: [{ kind: 'claim', id: 'claim.not-real' }] });
} catch (error) {
  badCitationRejected = /not canonical or valid/i.test(error.message);
}
assert(badCitationRejected, 'Unknown canonical citations must be rejected before thread persistence.');

const repairState = {
  schema: 'temple-of-maat/scribe-workspace-state-v1',
  version: '1.0.0',
  privacy: 'device-local-private',
  updatedAt: new Date().toISOString(),
  threads: [{
    id: 'thread.repair-fixture',
    title: 'Repair fixture',
    inquiry: '',
    status: 'open',
    notebookEntryIds: [],
    anchors: [
      { kind: 'claim', id: 'claim.not-real' },
      { kind: 'source', id: quranSource.id }
    ],
    ledger: [
      { id: 'scribe.first', kind: 'observation', text: 'Valid observation.', reasoning: '', sourceCitations: [{ kind: 'source', id: quranSource.id }], createdAt: new Date().toISOString() },
      { id: 'scribe.bad-inference', kind: 'inference', text: 'Missing reasoning.', reasoning: '', sourceCitations: [], createdAt: new Date().toISOString() },
      { id: 'scribe.bad-correction', kind: 'correction', text: 'Missing target.', reasoning: '', sourceCitations: [], createdAt: new Date().toISOString() },
      { id: 'scribe.forward-reply', kind: 'reply', text: 'Forward reference.', reasoning: '', sourceCitations: [], relatedLogId: 'scribe.future', createdAt: new Date().toISOString() },
      { id: 'scribe.second', kind: 'reply', text: 'Valid reply.', reasoning: '', sourceCitations: [{ kind: 'claim', id: 'claim.not-real' }], relatedLogId: 'scribe.first', createdAt: new Date().toISOString() },
      { id: 'scribe.first', kind: 'observation', text: 'Duplicate identifier.', reasoning: '', sourceCitations: [], createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }]
};
const repairStorage = {
  getItem(key) { return key === SCRIBE_WORKSPACE_KEY ? JSON.stringify(repairState) : null; },
  setItem() { throw new Error('Repair fixture must not write during load.'); },
  removeItem() {}
};
const repaired = await createTempleScribeWorkspace({ storage: repairStorage, notebook, windowRef: fixedWindow });
const repairedThread = repaired.threads()[0];
assert(repairedThread.anchors.length === 1 && repairedThread.anchors[0].id === quranSource.id, 'Reload must filter noncanonical thread anchors without dropping the valid thread.');
assert(repairedThread.ledger.length === 2 && repairedThread.ledger[0].id === 'scribe.first' && repairedThread.ledger[1].id === 'scribe.second', 'Reload must preserve only sequential, unique ledger events that satisfy inference/correction/reply invariants.');
assert(repairedThread.ledger[1].sourceCitations.length === 0, 'Reload must filter noncanonical ledger citations while preserving the valid ledger event.');

assert(coreText.includes("SCRIBE_WORKSPACE_KEY = 'temple_scribe_workspace_v1'"), 'Core must declare dedicated Scribe private storage key.');
assert(coreText.includes("kind === 'inference'") && coreText.includes('require visible reasoning'), 'Core must require visible reasoning for inference.');
assert(coreText.includes("kind === 'correction' || kind === 'reply'"), 'Core must preserve correction and reply target requirements.');
assert(coreText.includes('function commit(nextState)'), 'Core must use transactional device-state commits.');
assert(!/fetch\(/.test(coreText), 'Scribe core must not issue network requests.');
assert(uiText.includes('Observation and inference remain distinct.'), 'UI must communicate observation/inference separation.');
assert(uiText.includes('Nabu–Thoth is a modern Temple comparative scribe archetype'), 'UI must preserve comparative-archetype historical boundary.');
assert(uiText.includes('Add Ledger Entry') && uiText.includes('Save Thread'), 'UI must keep thread persistence and ledger append explicit.');
assert(!uiText.includes('tm524-dock'), 'Scribe Workspace must not add a global bottom-dock control.');
assert(css.includes('@media(max-width:760px)') && css.includes('@media(max-width:430px)'), 'Scribe Workspace must support narrow mobile breakpoints.');
assert(docs.includes('Observation remains distinct from inference.'), 'Docs must preserve the Scribe observation/inference covenant.');
assert(docs.includes('Corrections are append-only.'), 'Docs must preserve visible correction and institutional memory.');
assert(docs.includes('Right of reply is preserved.'), 'Docs must preserve right of reply.');
assert(docs.includes('not a surveillance archive'), 'Docs must preserve consent and dignity boundary.');
assert(docs.includes('Exporting is not publishing.'), 'Docs must distinguish private export from publication.');

console.log(JSON.stringify({
  ok: true,
  schema: scribe.schema,
  version: scribe.version,
  privacy: scribe.privacy,
  threadCount: reloaded.threads().length,
  ledgerCount: reloaded.threads()[0].ledger.length,
  explicitWrites: writes.filter((item) => item.op === 'set' && item.key === SCRIBE_WORKSPACE_KEY).length,
  newThreadLedgerInjectionBlocked: true,
  unknownNotebookReferenceRejected: true,
  notebookBodyIsolation: true,
  inferenceReasoningGuard: true,
  appendOnlyCorrection: true,
  rightOfReply: true,
  transactionalStorageFailure: true,
  schemaValidExport: true,
  corruptedStateRepair: true
}, null, 2));
