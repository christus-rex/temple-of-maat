import { installTempleResearchNotebook } from './v5.3.0-research-notebook.mjs';

export const SCRIBE_WORKSPACE_SCHEMA = 'temple-of-maat/scribe-workspace-state-v1';
export const SCRIBE_WORKSPACE_VERSION = '1.0.0';
export const SCRIBE_WORKSPACE_PRIVACY = 'device-local-private';
export const SCRIBE_WORKSPACE_KEY = 'temple_scribe_workspace_v1';

const MAX_THREADS = 200;
const MAX_TITLE = 200;
const MAX_INQUIRY = 4000;
const MAX_ENTRY_REFS = 100;
const MAX_ANCHORS = 40;
const MAX_LEDGER = 500;
const MAX_EVENT_TEXT = 8000;
const MAX_REASONING = 6000;
const MAX_EVENT_CITATIONS = 8;
const THREAD_STATUSES = new Set(['open', 'paused', 'closed']);
const EVENT_KINDS = new Set(['observation', 'inference', 'uncertainty', 'dissent', 'correction', 'reply']);
const CITATION_KINDS = new Set(['endpoint', 'claim', 'passage', 'source']);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function now() {
  return new Date().toISOString();
}

function publicWindow(windowRef) {
  return windowRef && typeof windowRef === 'object' ? windowRef : {};
}

function cleanText(value, max) {
  return String(value ?? '').slice(0, max);
}

function emptyState() {
  return {
    schema: SCRIBE_WORKSPACE_SCHEMA,
    version: SCRIBE_WORKSPACE_VERSION,
    privacy: SCRIBE_WORKSPACE_PRIVACY,
    updatedAt: now(),
    threads: []
  };
}

function cleanCitation(input) {
  if (!input || typeof input !== 'object') return null;
  const kind = String(input.kind || '');
  const id = cleanText(input.id, 240).trim();
  if (!CITATION_KINDS.has(kind) || !id) return null;
  return { kind, id };
}

function citationKey(citation) {
  return `${citation.kind}:${citation.id}`;
}

function uniqueCitations(values, limit = MAX_ANCHORS) {
  const map = new Map();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const citation = cleanCitation(value);
    if (citation) map.set(citationKey(citation), citation);
  });
  return [...map.values()].slice(0, limit);
}

function cleanEntryIds(values) {
  const ids = [...new Set((Array.isArray(values) ? values : [])
    .map((value) => cleanText(value, 180).trim())
    .filter((value) => /^notebook\.[a-z0-9-]+$/.test(value)))];
  return ids.slice(0, MAX_ENTRY_REFS);
}

function makeId(windowRef, prefix) {
  const value = windowRef.crypto?.randomUUID?.() || globalThis.crypto?.randomUUID?.();
  if (value) return `${prefix}.${String(value).toLowerCase()}`;
  return `${prefix}.${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function cleanLedgerEvent(input) {
  if (!input || typeof input !== 'object') return null;
  const id = cleanText(input.id, 180).trim();
  const kind = String(input.kind || '');
  const text = cleanText(input.text, MAX_EVENT_TEXT).trim();
  if (!/^scribe\.[a-z0-9-]+$/.test(id) || !EVENT_KINDS.has(kind) || !text) return null;
  const relatedLogId = cleanText(input.relatedLogId, 180).trim();
  if ((kind === 'correction' || kind === 'reply') && !/^scribe\.[a-z0-9-]+$/.test(relatedLogId)) return null;
  const event = {
    id,
    kind,
    text,
    reasoning: cleanText(input.reasoning, MAX_REASONING),
    sourceCitations: uniqueCitations(input.sourceCitations, MAX_EVENT_CITATIONS),
    createdAt: typeof input.createdAt === 'string' ? input.createdAt : now()
  };
  if (relatedLogId) event.relatedLogId = relatedLogId;
  return event;
}

function cleanThread(input) {
  if (!input || typeof input !== 'object') return null;
  const id = cleanText(input.id, 180).trim();
  if (!/^thread\.[a-z0-9-]+$/.test(id)) return null;
  const createdAt = typeof input.createdAt === 'string' ? input.createdAt : now();
  const updatedAt = typeof input.updatedAt === 'string' ? input.updatedAt : createdAt;
  const ledger = (Array.isArray(input.ledger) ? input.ledger : []).map(cleanLedgerEvent).filter(Boolean).slice(0, MAX_LEDGER);
  return {
    id,
    title: cleanText(input.title, MAX_TITLE),
    inquiry: cleanText(input.inquiry, MAX_INQUIRY),
    status: THREAD_STATUSES.has(input.status) ? input.status : 'open',
    notebookEntryIds: cleanEntryIds(input.notebookEntryIds),
    anchors: uniqueCitations(input.anchors),
    ledger,
    createdAt,
    updatedAt
  };
}

export async function createTempleScribeWorkspace(options = {}) {
  const windowRef = publicWindow(options.windowRef || globalThis.window || globalThis);
  const storage = options.storage || windowRef.localStorage;
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('Scribe Workspace requires a localStorage-compatible device-local store.');
  }
  const notebook = options.notebook || await installTempleResearchNotebook({ windowRef, ...(options.notebookOptions || {}) });

  function citationExists(citation) {
    if (citation.kind === 'endpoint') return /^[a-z][a-z0-9-]*:.+/.test(citation.id);
    const resolved = notebook.resolveCitation(citation);
    if (!resolved) return false;
    if (citation.kind === 'claim') return Boolean(resolved.canonical?.claimId);
    if (citation.kind === 'passage') return resolved.canonical?.entityType === 'source-passage';
    if (citation.kind === 'source') return Boolean(resolved.canonical?.id);
    return false;
  }

  function validateCitations(values, limit = MAX_ANCHORS) {
    const citations = uniqueCitations(values, limit);
    for (const citation of citations) {
      if (!citationExists(citation)) throw new RangeError(`Scribe Workspace citation is not canonical or valid: ${citation.kind}:${citation.id}`);
    }
    return citations;
  }

  function loadState() {
    try {
      const parsed = JSON.parse(storage.getItem(SCRIBE_WORKSPACE_KEY) || 'null');
      if (!parsed || parsed.schema !== SCRIBE_WORKSPACE_SCHEMA || parsed.version !== SCRIBE_WORKSPACE_VERSION || parsed.privacy !== SCRIBE_WORKSPACE_PRIVACY) return emptyState();
      const threads = (Array.isArray(parsed.threads) ? parsed.threads : []).map(cleanThread).filter(Boolean).slice(0, MAX_THREADS);
      return { ...emptyState(), updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : now(), threads };
    } catch {
      return emptyState();
    }
  }

  let state = loadState();

  function persist() {
    state.updatedAt = now();
    storage.setItem(SCRIBE_WORKSPACE_KEY, JSON.stringify(state));
    if (typeof windowRef.document?.dispatchEvent === 'function' && typeof windowRef.CustomEvent === 'function') {
      windowRef.document.dispatchEvent(new windowRef.CustomEvent('temple:scribe-workspace-change', {
        detail: { schema: state.schema, privacy: state.privacy, threadCount: state.threads.length, updatedAt: state.updatedAt }
      }));
    }
  }

  function createThreadDraft(seed = {}) {
    return {
      id: makeId(windowRef, 'thread'),
      title: cleanText(seed.title || '', MAX_TITLE),
      inquiry: cleanText(seed.inquiry || '', MAX_INQUIRY),
      status: THREAD_STATUSES.has(seed.status) ? seed.status : 'open',
      notebookEntryIds: cleanEntryIds(seed.notebookEntryIds),
      anchors: validateCitations(seed.anchors || []),
      ledger: [],
      createdAt: now(),
      updatedAt: now()
    };
  }

  function createThreadFromComparison(comparison = {}) {
    const anchors = notebook.citationsFromComparison(comparison);
    const left = comparison.leftValue || (comparison.left?.endpoint ? `${comparison.left.endpoint.namespace}:${comparison.left.endpoint.recordId}` : 'Record A');
    const right = comparison.rightValue || (comparison.right?.endpoint ? `${comparison.right.endpoint.namespace}:${comparison.right.endpoint.recordId}` : 'Record B');
    return createThreadDraft({
      title: `Thread — ${left} ↔ ${right}`,
      inquiry: `What is supported, uncertain, contested, or still unresolved between ${left} and ${right}?`,
      anchors
    });
  }

  function createThreadFromNotebookEntry(entryId) {
    const entry = notebook.get(entryId);
    if (!entry) throw new RangeError(`Unknown Research Notebook entry: ${entryId}`);
    return createThreadDraft({
      title: entry.title ? `Thread — ${entry.title}` : 'Thread from Research Notebook entry',
      inquiry: '',
      notebookEntryIds: [entry.id],
      anchors: entry.citations
    });
  }

  function saveThread(input) {
    const cleaned = cleanThread({ ...input, anchors: validateCitations(input?.anchors || []) });
    if (!cleaned) throw new TypeError('Scribe Workspace thread is invalid.');
    const index = state.threads.findIndex((thread) => thread.id === cleaned.id);
    const existing = index >= 0 ? state.threads[index] : null;
    if (!existing && state.threads.length >= MAX_THREADS) throw new RangeError(`Scribe Workspace supports at most ${MAX_THREADS} threads.`);
    const timestamp = now();
    const thread = {
      ...cleaned,
      ledger: existing ? existing.ledger : [],
      createdAt: existing ? existing.createdAt : cleaned.createdAt,
      updatedAt: timestamp
    };
    if (index >= 0) state.threads.splice(index, 1, thread);
    else state.threads.unshift(thread);
    persist();
    return clone(thread);
  }

  function removeThread(id) {
    const before = state.threads.length;
    state.threads = state.threads.filter((thread) => thread.id !== id);
    if (state.threads.length === before) return false;
    persist();
    return true;
  }

  function appendLedger(threadId, input = {}) {
    const index = state.threads.findIndex((thread) => thread.id === threadId);
    if (index < 0) throw new RangeError(`Unknown saved Scribe thread: ${threadId}`);
    const thread = state.threads[index];
    if (thread.ledger.length >= MAX_LEDGER) throw new RangeError(`Scribe thread supports at most ${MAX_LEDGER} ledger events.`);
    const kind = EVENT_KINDS.has(input.kind) ? input.kind : 'observation';
    const text = cleanText(input.text, MAX_EVENT_TEXT).trim();
    if (!text) throw new TypeError('Scribe ledger event requires text.');
    const reasoning = cleanText(input.reasoning, MAX_REASONING);
    if (kind === 'inference' && !reasoning.trim()) throw new TypeError('Inference entries require visible reasoning.');
    const sourceCitations = validateCitations(input.sourceCitations || [], MAX_EVENT_CITATIONS);
    const relatedLogId = cleanText(input.relatedLogId, 180).trim();
    if (kind === 'correction' || kind === 'reply') {
      if (!thread.ledger.some((event) => event.id === relatedLogId)) throw new RangeError(`${kind} entries must point to an existing ledger event.`);
    } else if (relatedLogId && !thread.ledger.some((event) => event.id === relatedLogId)) {
      throw new RangeError('relatedLogId must point to an existing ledger event.');
    }
    const event = {
      id: makeId(windowRef, 'scribe'),
      kind,
      text,
      reasoning,
      sourceCitations,
      createdAt: now()
    };
    if (relatedLogId) event.relatedLogId = relatedLogId;
    thread.ledger.push(event);
    thread.updatedAt = now();
    persist();
    return clone(event);
  }

  function attachEntry(threadId, entryId) {
    const index = state.threads.findIndex((thread) => thread.id === threadId);
    if (index < 0) throw new RangeError(`Unknown saved Scribe thread: ${threadId}`);
    if (!notebook.get(entryId)) throw new RangeError(`Unknown Research Notebook entry: ${entryId}`);
    const thread = state.threads[index];
    if (thread.notebookEntryIds.includes(entryId)) return clone(thread);
    if (thread.notebookEntryIds.length >= MAX_ENTRY_REFS) throw new RangeError(`Scribe thread supports at most ${MAX_ENTRY_REFS} Notebook entry references.`);
    thread.notebookEntryIds.push(entryId);
    thread.updatedAt = now();
    persist();
    return clone(thread);
  }

  function detachEntry(threadId, entryId) {
    const index = state.threads.findIndex((thread) => thread.id === threadId);
    if (index < 0) throw new RangeError(`Unknown saved Scribe thread: ${threadId}`);
    const thread = state.threads[index];
    const before = thread.notebookEntryIds.length;
    thread.notebookEntryIds = thread.notebookEntryIds.filter((id) => id !== entryId);
    if (before === thread.notebookEntryIds.length) return clone(thread);
    thread.updatedAt = now();
    persist();
    return clone(thread);
  }

  function resolveThread(threadOrId) {
    const thread = typeof threadOrId === 'string' ? state.threads.find((item) => item.id === threadOrId) : threadOrId;
    if (!thread) return null;
    return clone({
      thread,
      notebookEntries: thread.notebookEntryIds.map((id) => ({ id, entry: notebook.get(id) || null })),
      anchors: thread.anchors.map((citation) => ({ citation, resolved: notebook.resolveCitation(citation) }))
    });
  }

  function reset() {
    state = emptyState();
    storage.removeItem(SCRIBE_WORKSPACE_KEY);
    return true;
  }

  function exportState() {
    return clone({ ...state, exportedAt: now() });
  }

  const api = Object.freeze({
    schema: SCRIBE_WORKSPACE_SCHEMA,
    version: SCRIBE_WORKSPACE_VERSION,
    privacy: SCRIBE_WORKSPACE_PRIVACY,
    key: SCRIBE_WORKSPACE_KEY,
    notebook,
    state: () => clone(state),
    threads: () => clone(state.threads),
    get: (id) => clone(state.threads.find((thread) => thread.id === id) || null),
    createThreadDraft,
    createThreadFromComparison,
    createThreadFromNotebookEntry,
    save: saveThread,
    remove: removeThread,
    appendLedger,
    attachEntry,
    detachEntry,
    resolveThread,
    reset,
    exportState
  });

  return api;
}

export async function installTempleScribeWorkspace(options = {}) {
  const windowRef = publicWindow(options.windowRef || globalThis.window || globalThis);
  if (windowRef.TempleScribeWorkspace?.schema === SCRIBE_WORKSPACE_SCHEMA) return windowRef.TempleScribeWorkspace;
  const api = await createTempleScribeWorkspace({ ...options, windowRef });
  windowRef.TempleScribeWorkspace = api;
  if (typeof windowRef.document?.dispatchEvent === 'function' && typeof windowRef.CustomEvent === 'function') {
    windowRef.document.dispatchEvent(new windowRef.CustomEvent('temple:scribe-workspace-ready', {
      detail: { schema: api.schema, version: api.version, privacy: api.privacy, threadCount: api.threads().length }
    }));
  }
  return api;
}
