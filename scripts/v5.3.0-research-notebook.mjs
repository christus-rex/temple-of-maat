import { installTempleKnowledgeInspector } from './v5.3.0-knowledge-inspector.mjs';

export const RESEARCH_NOTEBOOK_SCHEMA = 'temple-of-maat/research-notebook-state-v1';
export const RESEARCH_NOTEBOOK_VERSION = '1.0.0';
export const RESEARCH_NOTEBOOK_PRIVACY = 'device-local-private';
export const RESEARCH_NOTEBOOK_KEY = 'temple_research_notebook_v1';

const MAX_ENTRIES = 500;
const MAX_TITLE = 200;
const MAX_BODY = 20000;
const MAX_CITATIONS = 40;
const STAGES = new Set(['note', 'question', 'hypothesis', 'practice']);
const CITATION_KINDS = new Set(['endpoint', 'claim', 'passage', 'source']);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function now() {
  return new Date().toISOString();
}

function normalizeDateTime(value, fallback = now()) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function publicWindow(windowRef) {
  return windowRef && typeof windowRef === 'object' ? windowRef : {};
}

function emptyState() {
  return {
    schema: RESEARCH_NOTEBOOK_SCHEMA,
    version: RESEARCH_NOTEBOOK_VERSION,
    privacy: RESEARCH_NOTEBOOK_PRIVACY,
    updatedAt: now(),
    entries: []
  };
}

function cleanText(value, max) {
  return String(value ?? '').slice(0, max);
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

function uniqueCitations(values) {
  const map = new Map();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const citation = cleanCitation(value);
    if (citation) map.set(citationKey(citation), citation);
  });
  return [...map.values()].slice(0, MAX_CITATIONS);
}

function cleanEntry(input) {
  if (!input || typeof input !== 'object') return null;
  const id = cleanText(input.id, 180).trim();
  if (!/^notebook\.[a-z0-9-]+$/.test(id)) return null;
  const createdAt = normalizeDateTime(input.createdAt);
  const updatedAt = normalizeDateTime(input.updatedAt, createdAt);
  return {
    id,
    title: cleanText(input.title, MAX_TITLE),
    body: cleanText(input.body, MAX_BODY),
    stage: STAGES.has(input.stage) ? input.stage : 'note',
    citations: uniqueCitations(input.citations),
    createdAt,
    updatedAt
  };
}

function idFactory(windowRef) {
  const value = windowRef.crypto?.randomUUID?.() || globalThis.crypto?.randomUUID?.();
  if (value) return `notebook.${String(value).toLowerCase()}`;
  return `notebook.${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function endpointValue(value) {
  if (typeof value === 'string' && /^[a-z][a-z0-9-]*:.+/.test(value)) return value;
  if (value && typeof value === 'object' && value.namespace && value.recordId) return `${value.namespace}:${value.recordId}`;
  return null;
}

export async function createTempleResearchNotebook(options = {}) {
  const windowRef = publicWindow(options.windowRef || globalThis.window || globalThis);
  const storage = options.storage || windowRef.localStorage;
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('Research Notebook requires a localStorage-compatible device-local store.');
  }
  const inspector = options.inspector || await installTempleKnowledgeInspector({ windowRef, ...(options.inspectorOptions || {}) });

  function citationExists(citation) {
    if (citation.kind === 'endpoint') return Boolean(endpointValue(citation.id));
    if (citation.kind === 'claim') return Boolean(inspector.claim(citation.id));
    if (citation.kind === 'passage') return inspector.record(citation.id)?.entityType === 'source-passage';
    if (citation.kind === 'source') return Boolean(inspector.source(citation.id));
    return false;
  }

  function normalizeLoadedEntry(input) {
    const entry = cleanEntry(input);
    if (!entry) return null;
    entry.citations = entry.citations.filter(citationExists);
    return entry;
  }

  function loadState() {
    try {
      const parsed = JSON.parse(storage.getItem(RESEARCH_NOTEBOOK_KEY) || 'null');
      if (!parsed || parsed.schema !== RESEARCH_NOTEBOOK_SCHEMA || parsed.version !== RESEARCH_NOTEBOOK_VERSION || parsed.privacy !== RESEARCH_NOTEBOOK_PRIVACY) return emptyState();
      const entries = (Array.isArray(parsed.entries) ? parsed.entries : []).map(normalizeLoadedEntry).filter(Boolean).slice(0, MAX_ENTRIES);
      return { ...emptyState(), updatedAt: normalizeDateTime(parsed.updatedAt), entries };
    } catch {
      return emptyState();
    }
  }

  let state = loadState();

  function commit(nextState) {
    const committed = clone(nextState);
    committed.updatedAt = now();
    storage.setItem(RESEARCH_NOTEBOOK_KEY, JSON.stringify(committed));
    state = committed;
    if (typeof windowRef.document?.dispatchEvent === 'function' && typeof windowRef.CustomEvent === 'function') {
      windowRef.document.dispatchEvent(new windowRef.CustomEvent('temple:research-notebook-change', {
        detail: { schema: state.schema, privacy: state.privacy, entryCount: state.entries.length, updatedAt: state.updatedAt }
      }));
    }
  }

  function validateCitations(citations) {
    const cleaned = uniqueCitations(citations);
    for (const citation of cleaned) {
      if (!citationExists(citation)) throw new RangeError(`Research Notebook citation is not canonical or valid: ${citation.kind}:${citation.id}`);
    }
    return cleaned;
  }

  function createDraft(seed = {}) {
    return {
      id: idFactory(windowRef),
      title: cleanText(seed.title || '', MAX_TITLE),
      body: cleanText(seed.body || '', MAX_BODY),
      stage: STAGES.has(seed.stage) ? seed.stage : 'note',
      citations: validateCitations(seed.citations || []),
      createdAt: now(),
      updatedAt: now()
    };
  }

  function citationsFromComparison(comparison = {}) {
    const citations = [];
    const endpointIds = [endpointValue(comparison.leftValue || comparison.left?.endpoint), endpointValue(comparison.rightValue || comparison.right?.endpoint)].filter(Boolean);
    endpointIds.forEach((id) => citations.push({ kind: 'endpoint', id }));

    endpointIds.forEach((id) => {
      const inspected = inspector.inspectEndpoint(id);
      const recordClaims = inspected?.recordInspection?.claims || [];
      const sourceClaims = inspected?.sourceInspection?.claims || [];
      [...recordClaims, ...sourceClaims].forEach((claim) => citations.push({ kind: 'claim', id: claim.claimId }));
      if (inspected?.preferredPassage?.recordId) citations.push({ kind: 'passage', id: inspected.preferredPassage.recordId });
      if (inspected?.sourceInspection?.source?.id) citations.push({ kind: 'source', id: inspected.sourceInspection.source.id });
    });

    return validateCitations(citations);
  }

  function createDraftFromComparison(comparison = {}) {
    const left = endpointValue(comparison.leftValue || comparison.left?.endpoint) || 'Record A';
    const right = endpointValue(comparison.rightValue || comparison.right?.endpoint) || 'Record B';
    return createDraft({
      title: `Comparison — ${left} ↔ ${right}`,
      stage: 'note',
      citations: citationsFromComparison(comparison)
    });
  }

  function saveEntry(input) {
    const incoming = cleanEntry({ ...input, citations: validateCitations(input?.citations || []) });
    if (!incoming) throw new TypeError('Research Notebook entry is invalid.');
    const existingIndex = state.entries.findIndex((item) => item.id === incoming.id);
    if (existingIndex < 0 && state.entries.length >= MAX_ENTRIES) throw new RangeError(`Research Notebook supports at most ${MAX_ENTRIES} entries.`);
    const entry = {
      ...incoming,
      createdAt: existingIndex >= 0 ? state.entries[existingIndex].createdAt : incoming.createdAt,
      updatedAt: now()
    };
    const next = clone(state);
    if (existingIndex >= 0) next.entries.splice(existingIndex, 1, entry);
    else next.entries.unshift(entry);
    commit(next);
    return clone(entry);
  }

  function removeEntry(id) {
    const next = clone(state);
    const before = next.entries.length;
    next.entries = next.entries.filter((item) => item.id !== id);
    if (next.entries.length === before) return false;
    commit(next);
    return true;
  }

  function reset() {
    storage.removeItem(RESEARCH_NOTEBOOK_KEY);
    state = emptyState();
    if (typeof windowRef.document?.dispatchEvent === 'function' && typeof windowRef.CustomEvent === 'function') {
      windowRef.document.dispatchEvent(new windowRef.CustomEvent('temple:research-notebook-change', {
        detail: { schema: state.schema, privacy: state.privacy, entryCount: 0, updatedAt: state.updatedAt }
      }));
    }
    return true;
  }

  function exportState() {
    return clone(state);
  }

  function resolveCitation(citation) {
    const clean = cleanCitation(citation);
    if (!clean) return null;
    if (clean.kind === 'endpoint') return { ...clean, canonical: null, inspection: inspector.inspectEndpoint(clean.id) };
    if (clean.kind === 'claim') return { ...clean, canonical: inspector.claim(clean.id), inspection: inspector.inspectClaim(clean.id) };
    if (clean.kind === 'passage') return { ...clean, canonical: inspector.record(clean.id), inspection: inspector.inspectRecord(clean.id) };
    if (clean.kind === 'source') return { ...clean, canonical: inspector.source(clean.id), inspection: inspector.inspectSource(clean.id) };
    return null;
  }

  const api = Object.freeze({
    schema: RESEARCH_NOTEBOOK_SCHEMA,
    version: RESEARCH_NOTEBOOK_VERSION,
    privacy: RESEARCH_NOTEBOOK_PRIVACY,
    key: RESEARCH_NOTEBOOK_KEY,
    inspector,
    state: () => clone(state),
    entries: () => clone(state.entries),
    get: (id) => clone(state.entries.find((item) => item.id === id) || null),
    createDraft,
    createDraftFromComparison,
    citationsFromComparison,
    resolveCitation,
    save: saveEntry,
    remove: removeEntry,
    reset,
    exportState
  });

  return api;
}

export async function installTempleResearchNotebook(options = {}) {
  const windowRef = publicWindow(options.windowRef || globalThis.window || globalThis);
  if (windowRef.TempleResearchNotebook?.schema === RESEARCH_NOTEBOOK_SCHEMA) return windowRef.TempleResearchNotebook;
  const api = await createTempleResearchNotebook({ ...options, windowRef });
  windowRef.TempleResearchNotebook = api;
  if (typeof windowRef.document?.dispatchEvent === 'function' && typeof windowRef.CustomEvent === 'function') {
    windowRef.document.dispatchEvent(new windowRef.CustomEvent('temple:research-notebook-ready', {
      detail: { schema: api.schema, version: api.version, privacy: api.privacy, entryCount: api.entries().length }
    }));
  }
  return api;
}
