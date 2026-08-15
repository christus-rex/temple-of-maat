export const KNOWLEDGE_INSPECTOR_SCHEMA = 'temple-of-maat/knowledge-inspector-v1';
export const KNOWLEDGE_INSPECTOR_VERSION = '1.0.0';

const URLS = Object.freeze({
  seed: new URL('../research/knowledge-kernel/seed.v1.json', import.meta.url),
  sources: new URL('../research/knowledge-kernel/source-registry.v1.json', import.meta.url),
  methods: new URL('../research/knowledge-kernel/method-registry.v1.json', import.meta.url),
  endpointMap: new URL('../research/knowledge-kernel/endpoint-map.v1.json', import.meta.url)
});

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function publicWindow(windowRef) {
  return windowRef && typeof windowRef === 'object' ? windowRef : {};
}

async function fetchJson(fetchImpl, url, label) {
  const response = await fetchImpl(url, { cache: 'force-cache', headers: { Accept: 'application/json' } });
  if (!response?.ok) throw new Error(`Unable to load ${label} (${response?.status ?? 'unknown status'}): ${url}`);
  return response.json();
}

function endpointKey(endpoint) {
  if (typeof endpoint === 'string') return endpoint;
  if (endpoint && typeof endpoint === 'object' && endpoint.namespace && endpoint.recordId) {
    return `${endpoint.namespace}:${endpoint.recordId}`;
  }
  throw new TypeError('Knowledge Inspector endpoint must be namespace:recordId or an endpoint object.');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export async function createTempleKnowledgeInspector(options = {}) {
  const windowRef = publicWindow(options.windowRef || globalThis.window || globalThis);
  const rawFetch = options.fetchImpl || windowRef.fetch || globalThis.fetch;
  if (typeof rawFetch !== 'function') throw new TypeError('Knowledge Inspector requires fetch or options.fetchImpl.');
  const fetchImpl = rawFetch.bind ? rawFetch.bind(windowRef) : rawFetch;

  const urls = { ...URLS, ...(options.urls || {}) };
  const [seed, sourceRegistry, methodRegistry, endpointMap] = await Promise.all([
    fetchJson(fetchImpl, urls.seed, 'Knowledge Kernel seed'),
    fetchJson(fetchImpl, urls.sources, 'Knowledge Kernel source registry'),
    fetchJson(fetchImpl, urls.methods, 'Knowledge Kernel method registry'),
    fetchJson(fetchImpl, urls.endpointMap, 'Knowledge Kernel endpoint map')
  ]);

  if (seed?.schema !== 'temple-of-maat/knowledge-kernel-v1' || seed?.privacy !== 'public-canonical-only') {
    throw new Error('Unsupported or non-public Knowledge Kernel seed.');
  }
  if (sourceRegistry?.schema !== 'temple-of-maat/source-registry-v1' || sourceRegistry?.privacy !== 'public-canonical-only') {
    throw new Error('Unsupported or non-public source registry.');
  }
  if (methodRegistry?.schema !== 'temple-of-maat/method-registry-v1' || methodRegistry?.privacy !== 'public-canonical-only') {
    throw new Error('Unsupported or non-public method registry.');
  }
  if (endpointMap?.schema !== 'temple-of-maat/knowledge-endpoint-map-v1' || endpointMap?.privacy !== 'public-canonical-only') {
    throw new Error('Unsupported or non-public endpoint map.');
  }

  const records = Array.isArray(seed.records) ? seed.records : [];
  const claims = Array.isArray(seed.claims) ? seed.claims : [];
  const sources = Array.isArray(sourceRegistry.sources) ? sourceRegistry.sources : [];
  const methods = Array.isArray(methodRegistry.methods) ? methodRegistry.methods : [];
  const mappings = Array.isArray(endpointMap.mappings) ? endpointMap.mappings : [];

  const recordById = new Map(records.map((item) => [item.recordId, item]));
  const claimById = new Map(claims.map((item) => [item.claimId, item]));
  const sourceById = new Map(sources.map((item) => [item.id, item]));
  const methodById = new Map(methods.map((item) => [item.id, item]));
  const mappingByEndpoint = new Map(mappings.map((item) => [item.endpoint, item]));

  function claimsForRecord(recordId) {
    return claims.filter((claim) => claim.subjectId === recordId || claim.object?.recordId === recordId).map(clone);
  }

  function claimsForSource(sourceId) {
    return claims.filter((claim) => claim.evidence?.sourceRefs?.includes(sourceId)).map(clone);
  }

  function passagesForSource(sourceId) {
    return records.filter((record) => record.entityType === 'source-passage' && record.sourceRefs?.includes(sourceId)).map(clone);
  }

  function sourcesForRecord(record) {
    return unique(record?.sourceRefs || []).map((id) => sourceById.get(id)).filter(Boolean).map(clone);
  }

  function methodsForClaims(items) {
    return unique(items.map((claim) => claim.methodRef)).map((id) => methodById.get(id)).filter(Boolean).map(clone);
  }

  function inspectRecord(recordId) {
    const record = recordById.get(recordId);
    if (!record) return null;
    const recordClaims = claimsForRecord(recordId);
    const recordSources = sourcesForRecord(record);
    const sourceIds = unique([
      ...(record.sourceRefs || []),
      ...recordClaims.flatMap((claim) => claim.evidence?.sourceRefs || [])
    ]);
    const passages = sourceIds.flatMap((sourceId) => passagesForSource(sourceId));
    const passageMap = new Map(passages.map((passage) => [passage.recordId, passage]));
    return clone({
      record,
      claims: recordClaims,
      sources: sourceIds.map((id) => sourceById.get(id)).filter(Boolean),
      passages: [...passageMap.values()],
      methods: methodsForClaims(recordClaims)
    });
  }

  function inspectSource(sourceId) {
    const source = sourceById.get(sourceId);
    if (!source) return null;
    const sourceClaims = claimsForSource(sourceId);
    return clone({
      source,
      claims: sourceClaims,
      passages: passagesForSource(sourceId),
      methods: methodsForClaims(sourceClaims)
    });
  }

  function inspectClaim(claimId) {
    const claim = claimById.get(claimId);
    if (!claim) return null;
    return clone({
      claim,
      subject: recordById.get(claim.subjectId) || null,
      object: claim.object?.recordId ? recordById.get(claim.object.recordId) || null : clone(claim.object),
      sources: (claim.evidence?.sourceRefs || []).map((id) => sourceById.get(id)).filter(Boolean),
      method: claim.methodRef ? methodById.get(claim.methodRef) || null : null
    });
  }

  function inspectEndpoint(endpoint) {
    const key = endpointKey(endpoint);
    const mapping = mappingByEndpoint.get(key) || null;
    if (!mapping) {
      return clone({
        endpoint: key,
        mapped: false,
        mapping: null,
        recordInspection: null,
        sourceInspection: null,
        preferredPassage: null,
        note: 'No reviewed graph-to-kernel mapping exists for this endpoint. The inspector will not infer one.'
      });
    }
    const recordInspection = mapping.kernelRecordId ? inspectRecord(mapping.kernelRecordId) : null;
    const sourceInspection = mapping.kernelSourceId ? inspectSource(mapping.kernelSourceId) : null;
    const preferredPassage = mapping.preferredPassageId ? recordById.get(mapping.preferredPassageId) || null : null;
    return clone({
      endpoint: key,
      mapped: true,
      mapping,
      recordInspection,
      sourceInspection,
      preferredPassage,
      note: mapping.basis
    });
  }

  function inspectEvidenceRefs(sourceRefs = []) {
    const inspections = [];
    for (const ref of unique(sourceRefs)) {
      if (sourceById.has(ref)) {
        inspections.push({ ref, kernelSourceId: ref, inspection: inspectSource(ref), mappingBasis: 'Exact Knowledge Kernel source ID.' });
        continue;
      }
      const mapped = mappings.find((item) => item.endpoint === `library:${ref}` && item.kernelSourceId);
      if (mapped) inspections.push({ ref, kernelSourceId: mapped.kernelSourceId, inspection: inspectSource(mapped.kernelSourceId), mappingBasis: mapped.basis });
      else inspections.push({ ref, kernelSourceId: null, inspection: null, mappingBasis: 'No reviewed source mapping exists; no source identity was inferred.' });
    }
    return clone(inspections);
  }

  const api = Object.freeze({
    schema: KNOWLEDGE_INSPECTOR_SCHEMA,
    version: KNOWLEDGE_INSPECTOR_VERSION,
    privacy: 'public-canonical-only',
    records: () => clone(records),
    claims: () => clone(claims),
    sources: () => clone(sources),
    methods: () => clone(methods),
    mappings: () => clone(mappings),
    record: (id) => clone(recordById.get(id) || null),
    claim: (id) => clone(claimById.get(id) || null),
    source: (id) => clone(sourceById.get(id) || null),
    method: (id) => clone(methodById.get(id) || null),
    claimsForRecord,
    claimsForSource,
    passagesForSource,
    inspectRecord,
    inspectSource,
    inspectClaim,
    inspectEndpoint,
    inspectEvidenceRefs,
    stats: () => ({
      schema: KNOWLEDGE_INSPECTOR_SCHEMA,
      version: KNOWLEDGE_INSPECTOR_VERSION,
      privacy: 'public-canonical-only',
      records: records.length,
      claims: claims.length,
      sources: sources.length,
      methods: methods.length,
      reviewedEndpointMappings: mappings.filter((item) => item.status === 'reviewed').length
    })
  });

  return api;
}

export async function installTempleKnowledgeInspector(options = {}) {
  const windowRef = publicWindow(options.windowRef || globalThis.window || globalThis);
  if (windowRef.TempleKnowledgeInspector?.schema === KNOWLEDGE_INSPECTOR_SCHEMA) return windowRef.TempleKnowledgeInspector;
  const api = await createTempleKnowledgeInspector({ ...options, windowRef });
  windowRef.TempleKnowledgeInspector = api;
  if (typeof windowRef.document?.dispatchEvent === 'function' && typeof windowRef.CustomEvent === 'function') {
    windowRef.document.dispatchEvent(new windowRef.CustomEvent('temple:knowledge-inspector-ready', {
      detail: { schema: api.schema, version: api.version, privacy: api.privacy }
    }));
  }
  return api;
}
