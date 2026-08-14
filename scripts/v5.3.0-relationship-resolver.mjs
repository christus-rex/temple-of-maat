/* Temple of Ma'at v5.3.0 — headless relationship graph resolver/query core.
 *
 * This module intentionally knows nothing about private Journey/Library state.
 * Consumers may register endpoint providers, but the canonical graph remains public-only.
 */

export const RELATIONSHIP_GRAPH_SCHEMA = 'temple-of-maat/relationship-graph-v1';
export const RELATIONSHIP_GRAPH_VERSION = '1.0.0';
export const RELATIONSHIP_BUNDLE_SCHEMA = 'temple-of-maat/relationship-bundle-v1';

const KNOWN_NAMESPACES = new Set(['chamber', 'codex', 'dossier', 'library']);
const KNOWN_LAYERS = new Set(['L1', 'L2', 'L3', 'L4']);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function endpointKey(endpoint) {
  return `${endpoint.namespace}:${endpoint.recordId}`;
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function includesAll(haystack, needles) {
  return needles.every((item) => haystack.includes(item));
}

function includesAny(haystack, needles) {
  return needles.length === 0 || needles.some((item) => haystack.includes(item));
}

function searchableEdgeText(edge) {
  return [
    edge.id,
    edge.from.namespace,
    edge.from.recordId,
    edge.to.namespace,
    edge.to.recordId,
    edge.relationType,
    edge.direction,
    edge.confidence,
    edge.status,
    edge.claimBoundary?.claimClass,
    edge.claimBoundary?.directHistoricalInfluence,
    edge.summary,
    edge.evidence?.note,
    ...(edge.provenanceLayers || []),
    ...(edge.evidence?.basis || []),
    ...(edge.evidence?.sourceRefs || []),
    ...(edge.limitations || []),
    ...(edge.tags || [])
  ].filter(Boolean).join(' ').toLocaleLowerCase();
}

function assertGraphShape(graph) {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) throw new TypeError('Relationship graph must be an object.');
  if (graph.schema !== RELATIONSHIP_GRAPH_SCHEMA) throw new Error(`Unsupported relationship graph schema: ${String(graph.schema)}`);
  if (graph.version !== RELATIONSHIP_GRAPH_VERSION) throw new Error(`Unsupported relationship graph version: ${String(graph.version)}`);
  if (graph.privacy !== 'public-canonical-only') throw new Error(`Relationship graph privacy boundary must be public-canonical-only, found ${String(graph.privacy)}`);
  if (!Array.isArray(graph.namespaces) || !Array.isArray(graph.edges)) throw new Error('Relationship graph requires namespaces and edges arrays.');
}

export function normalizeEndpoint(value) {
  if (typeof value === 'string') {
    const separator = value.indexOf(':');
    if (separator <= 0 || separator === value.length - 1) throw new TypeError(`Endpoint string must be namespace:recordId, received ${value}`);
    value = { namespace: value.slice(0, separator), recordId: value.slice(separator + 1) };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Endpoint must be an object or namespace:recordId string.');
  const namespace = String(value.namespace || '').trim();
  const recordId = String(value.recordId || '').trim();
  if (!KNOWN_NAMESPACES.has(namespace)) throw new RangeError(`Unknown relationship namespace: ${namespace}`);
  if (!recordId) throw new TypeError('Endpoint recordId is required.');
  return Object.freeze({ namespace, recordId });
}

export function createRelationshipGraph(graphData, options = {}) {
  assertGraphShape(graphData);
  const graph = clone(graphData);
  const namespaceMap = new Map(graph.namespaces.map((namespace) => [namespace.id, Object.freeze(clone(namespace))]));
  const edgeMap = new Map();
  const endpointEdges = new Map();
  const searchable = new Map();
  const providers = new Map();

  for (const namespace of KNOWN_NAMESPACES) {
    if (!namespaceMap.has(namespace)) throw new Error(`Graph namespace descriptor missing: ${namespace}`);
  }

  for (const edge of graph.edges) {
    if (!edge?.id || edgeMap.has(edge.id)) throw new Error(`Relationship graph edge id is missing or duplicated: ${String(edge?.id)}`);
    const from = normalizeEndpoint(edge.from);
    const to = normalizeEndpoint(edge.to);
    const frozen = Object.freeze({ ...clone(edge), from, to });
    edgeMap.set(edge.id, frozen);
    searchable.set(edge.id, searchableEdgeText(frozen));
    for (const endpoint of [from, to]) {
      const key = endpointKey(endpoint);
      if (!endpointEdges.has(key)) endpointEdges.set(key, []);
      endpointEdges.get(key).push(frozen);
    }
  }

  for (const [namespace, provider] of Object.entries(options.providers || {})) registerProvider(namespace, provider);

  function registerProvider(namespace, provider) {
    if (!KNOWN_NAMESPACES.has(namespace)) throw new RangeError(`Cannot register provider for unknown namespace: ${namespace}`);
    if (typeof provider !== 'function') throw new TypeError(`Provider for ${namespace} must be a function.`);
    providers.set(namespace, provider);
    return api;
  }

  function unregisterProvider(namespace) {
    providers.delete(namespace);
    return api;
  }

  function namespace(id) {
    if (!KNOWN_NAMESPACES.has(id)) throw new RangeError(`Unknown relationship namespace: ${id}`);
    return clone(namespaceMap.get(id));
  }

  function namespaces() {
    return [...namespaceMap.values()].map(clone);
  }

  function getEdge(id) {
    const edge = edgeMap.get(String(id));
    return edge ? clone(edge) : null;
  }

  function edgeMatches(edge, filter = {}) {
    const relationTypes = asArray(filter.relationType || filter.relationTypes);
    if (relationTypes.length && !relationTypes.includes(edge.relationType)) return false;

    const confidences = asArray(filter.confidence || filter.confidences);
    if (confidences.length && !confidences.includes(edge.confidence)) return false;

    const statuses = asArray(filter.status || filter.statuses);
    if (statuses.length && !statuses.includes(edge.status)) return false;

    const claimClasses = asArray(filter.claimClass || filter.claimClasses);
    if (claimClasses.length && !claimClasses.includes(edge.claimBoundary?.claimClass)) return false;

    const influence = asArray(filter.directHistoricalInfluence);
    if (influence.length && !influence.includes(edge.claimBoundary?.directHistoricalInfluence)) return false;

    const layersAny = asArray(filter.layersAny);
    if (!includesAny(edge.provenanceLayers || [], layersAny)) return false;

    const layersAll = asArray(filter.layersAll);
    if (layersAll.length && !includesAll(edge.provenanceLayers || [], layersAll)) return false;

    const evidenceAny = asArray(filter.evidenceAny);
    if (!includesAny(edge.evidence?.basis || [], evidenceAny)) return false;

    const tagsAny = asArray(filter.tagsAny);
    if (!includesAny(edge.tags || [], tagsAny)) return false;

    const namespacesAny = asArray(filter.namespacesAny);
    if (namespacesAny.length && !namespacesAny.some((item) => edge.from.namespace === item || edge.to.namespace === item)) return false;

    if (filter.direction && edge.direction !== filter.direction) return false;

    if (filter.query) {
      const terms = String(filter.query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      const text = searchable.get(edge.id) || '';
      if (!terms.every((term) => text.includes(term))) return false;
    }
    return true;
  }

  function edges(filter = {}) {
    return [...edgeMap.values()].filter((edge) => edgeMatches(edge, filter)).map(clone);
  }

  function neighbors(endpointValue, filter = {}) {
    const endpoint = normalizeEndpoint(endpointValue);
    const key = endpointKey(endpoint);
    return (endpointEdges.get(key) || [])
      .filter((edge) => edgeMatches(edge, filter))
      .map((edge) => {
        const fromKey = endpointKey(edge.from);
        const currentIsFrom = fromKey === key;
        const other = currentIsFrom ? edge.to : edge.from;
        const traversal = edge.direction === 'undirected' ? 'peer' : currentIsFrom ? 'outgoing' : 'incoming';
        return { edge: clone(edge), endpoint: clone(other), traversal };
      });
  }

  function between(leftValue, rightValue, filter = {}) {
    const left = normalizeEndpoint(leftValue);
    const right = normalizeEndpoint(rightValue);
    const leftKey = endpointKey(left);
    const rightKey = endpointKey(right);
    return (endpointEdges.get(leftKey) || [])
      .filter((edge) => {
        const keys = [endpointKey(edge.from), endpointKey(edge.to)];
        return keys.includes(leftKey) && keys.includes(rightKey) && edgeMatches(edge, filter);
      })
      .map(clone);
  }

  function facetCounts(filter = {}) {
    const selected = [...edgeMap.values()].filter((edge) => edgeMatches(edge, filter));
    const count = (getter) => {
      const result = {};
      for (const edge of selected) {
        for (const value of asArray(getter(edge)).filter(Boolean)) result[value] = (result[value] || 0) + 1;
      }
      return result;
    };
    return {
      total: selected.length,
      relationType: count((edge) => edge.relationType),
      provenanceLayer: count((edge) => edge.provenanceLayers),
      confidence: count((edge) => edge.confidence),
      claimClass: count((edge) => edge.claimBoundary?.claimClass),
      evidenceBasis: count((edge) => edge.evidence?.basis),
      namespace: count((edge) => [edge.from.namespace, edge.to.namespace]),
      tag: count((edge) => edge.tags)
    };
  }

  function search(query, filter = {}) {
    const normalized = String(query || '').trim();
    if (!normalized) return edges(filter);
    return edges({ ...filter, query: normalized });
  }

  function shortestPath(startValue, endValue, options = {}) {
    const start = normalizeEndpoint(startValue);
    const end = normalizeEndpoint(endValue);
    const startKey = endpointKey(start);
    const endKey = endpointKey(end);
    if (startKey === endKey) return { endpoints: [clone(start)], edges: [], hops: 0 };

    const maxDepth = Math.max(1, Math.min(12, Number(options.maxDepth) || 6));
    const filter = options.filter || {};
    const queue = [{ endpoint: start, endpoints: [start], edgeIds: [] }];
    const visited = new Set([startKey]);

    while (queue.length) {
      const state = queue.shift();
      if (state.edgeIds.length >= maxDepth) continue;
      for (const relation of neighbors(state.endpoint, filter)) {
        const next = normalizeEndpoint(relation.endpoint);
        const nextKey = endpointKey(next);
        if (visited.has(nextKey)) continue;
        const endpointPath = [...state.endpoints, next];
        const edgePath = [...state.edgeIds, relation.edge.id];
        if (nextKey === endKey) {
          return {
            endpoints: endpointPath.map(clone),
            edges: edgePath.map((id) => getEdge(id)),
            hops: edgePath.length
          };
        }
        visited.add(nextKey);
        queue.push({ endpoint: next, endpoints: endpointPath, edgeIds: edgePath });
      }
    }
    return null;
  }

  async function resolve(endpointValue, context = {}) {
    const endpoint = normalizeEndpoint(endpointValue);
    const provider = providers.get(endpoint.namespace);
    const descriptor = namespaceMap.get(endpoint.namespace);
    if (!provider) {
      return {
        endpoint: clone(endpoint),
        namespace: clone(descriptor),
        resolved: false,
        record: null
      };
    }
    const record = await provider(clone(endpoint), { graph: api, ...context });
    return {
      endpoint: clone(endpoint),
      namespace: clone(descriptor),
      resolved: record !== undefined && record !== null,
      record: record === undefined ? null : clone(record)
    };
  }

  async function resolveMany(endpointValues, context = {}) {
    return Promise.all(endpointValues.map((endpoint) => resolve(endpoint, context)));
  }

  function exportBundle(selection = {}) {
    const selectedEdges = selection.edgeIds
      ? asArray(selection.edgeIds).map((id) => edgeMap.get(String(id))).filter(Boolean)
      : [...edgeMap.values()].filter((edge) => edgeMatches(edge, selection.filter || {}));
    const endpoints = new Map();
    for (const edge of selectedEdges) {
      endpoints.set(endpointKey(edge.from), clone(edge.from));
      endpoints.set(endpointKey(edge.to), clone(edge.to));
    }
    return {
      schema: RELATIONSHIP_BUNDLE_SCHEMA,
      graphSchema: graph.schema,
      graphVersion: graph.version,
      exportedAt: new Date().toISOString(),
      privacy: 'public-canonical-only',
      endpoints: [...endpoints.values()],
      edges: selectedEdges.map(clone)
    };
  }

  function stats() {
    return {
      schema: graph.schema,
      version: graph.version,
      privacy: graph.privacy,
      namespaceCount: namespaceMap.size,
      edgeCount: edgeMap.size,
      providerNamespaces: [...providers.keys()].sort(),
      facets: facetCounts()
    };
  }

  const api = Object.freeze({
    schema: RELATIONSHIP_GRAPH_SCHEMA,
    version: RELATIONSHIP_GRAPH_VERSION,
    normalizeEndpoint,
    namespace,
    namespaces,
    getEdge,
    edges,
    neighbors,
    between,
    search,
    shortestPath,
    facetCounts,
    registerProvider,
    unregisterProvider,
    resolve,
    resolveMany,
    exportBundle,
    stats
  });

  return api;
}

export async function loadRelationshipGraph(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new TypeError('loadRelationshipGraph requires fetch or options.fetchImpl.');
  const graphUrl = options.graphUrl || new URL('../research/relationship-graph.json', import.meta.url).href;
  const response = await fetchImpl(graphUrl, { cache: 'no-store' });
  if (!response?.ok) throw new Error(`Unable to load relationship graph (${response?.status ?? 'unknown status'}): ${graphUrl}`);
  const data = await response.json();
  return createRelationshipGraph(data, options);
}

export function createStaticJsonProvider(records, options = {}) {
  const key = options.key || 'id';
  const normalize = options.normalizeId || ((value) => String(value));
  const map = new Map(records.map((record) => [normalize(record?.[key]), record]));
  return async (endpoint) => map.get(normalize(endpoint.recordId)) || null;
}
