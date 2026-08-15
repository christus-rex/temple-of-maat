import { loadRelationshipGraph } from './v5.3.0-relationship-resolver.mjs';

export const RELATIONSHIP_BROWSER_ADAPTER_VERSION = '1.0.0';
export const RELATIONSHIP_BROWSER_SCHEMA = 'temple-of-maat/relationship-browser-adapter-v1';

const PUBLIC_CATALOGS = Object.freeze({
  chambers: new URL('../chambers.json', import.meta.url),
  library: new URL('../library/catalog.json', import.meta.url),
  graph: new URL('../research/relationship-graph.json', import.meta.url)
});

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function chamberNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 72 ? number : null;
}

function libraryRecords(catalog) {
  const keys = ['traditions', 'sources', 'studies', 'discernments', 'correspondences'];
  return keys.flatMap((key) => Array.isArray(catalog?.[key]) ? catalog[key] : []);
}

async function fetchJson(fetchImpl, url, label) {
  const response = await fetchImpl(url, { cache: 'force-cache' });
  if (!response?.ok) throw new Error(`Unable to load ${label} (${response?.status ?? 'unknown status'}): ${url}`);
  return response.json();
}

function publicWindow(windowRef) {
  if (!windowRef || typeof windowRef !== 'object') return {};
  return windowRef;
}

export async function createTempleRelationshipBrowserAdapter(options = {}) {
  const windowRef = publicWindow(options.windowRef || globalThis.window || globalThis);
  const rawFetch = options.fetchImpl || windowRef.fetch || globalThis.fetch;
  if (typeof rawFetch !== 'function') throw new TypeError('Relationship browser adapter requires fetch or options.fetchImpl.');
  const fetchImpl = rawFetch.bind ? rawFetch.bind(windowRef) : rawFetch;

  const urls = {
    chambers: options.chambersUrl || PUBLIC_CATALOGS.chambers,
    library: options.libraryUrl || PUBLIC_CATALOGS.library,
    graph: options.graphUrl || PUBLIC_CATALOGS.graph
  };

  let chamberCatalogPromise = null;
  let libraryCatalogPromise = null;

  async function chamberCatalog() {
    if (!chamberCatalogPromise) chamberCatalogPromise = fetchJson(fetchImpl, urls.chambers, 'chamber archive');
    return chamberCatalogPromise;
  }

  async function libraryCatalog() {
    if (!libraryCatalogPromise) libraryCatalogPromise = fetchJson(fetchImpl, urls.library, 'Library catalog');
    return libraryCatalogPromise;
  }

  async function chamberProvider(endpoint) {
    const number = chamberNumber(endpoint.recordId);
    if (!number) return null;

    try {
      const runtime = windowRef.TempleArchive?.chambers?.();
      if (Array.isArray(runtime)) {
        const found = runtime.find((item) => Number(item?.num || item?.number || item?.id) === number);
        if (found) return clone(found);
      }
    } catch {}

    const catalog = await chamberCatalog();
    const records = Array.isArray(catalog?.chambers) ? catalog.chambers : [];
    return clone(records.find((item) => Number(item?.number || item?.num || item?.id) === number) || null);
  }

  async function codexProvider(endpoint) {
    const number = chamberNumber(endpoint.recordId);
    if (!number) return null;
    try {
      const record = windowRef.TempleLivingCodex?.record?.(number);
      return record ? clone(record) : null;
    } catch {
      return null;
    }
  }

  async function dossierProvider(endpoint) {
    const number = chamberNumber(endpoint.recordId);
    if (!number) return null;
    try {
      const record = windowRef.TempleShem72?.record?.(number);
      if (!record) return null;
      return {
        id: String(number).padStart(2, '0'),
        number,
        recordKind: 'shem-dossier-source-layer',
        sourceLayer: clone(record),
        provenanceNote: 'Resolved from the public TempleShem72 source-preserved layer. Private Journey reflection state is intentionally excluded.'
      };
    } catch {
      return null;
    }
  }

  async function libraryProvider(endpoint) {
    const catalog = await libraryCatalog();
    return clone(libraryRecords(catalog).find((record) => record?.id === endpoint.recordId) || null);
  }

  const providers = Object.freeze({
    chamber: chamberProvider,
    codex: codexProvider,
    dossier: dossierProvider,
    library: libraryProvider
  });

  const resolver = await loadRelationshipGraph({
    graphUrl: urls.graph,
    fetchImpl,
    providers
  });

  const api = Object.freeze({
    schema: RELATIONSHIP_BROWSER_SCHEMA,
    version: RELATIONSHIP_BROWSER_ADAPTER_VERSION,
    privacy: 'public-canonical-only',
    resolver,
    providers,
    catalogs: Object.freeze({
      chambers: () => chamberCatalog().then(clone),
      library: () => libraryCatalog().then(clone)
    }),
    resolve: (endpoint, context = {}) => resolver.resolve(endpoint, context),
    resolveMany: (endpoints, context = {}) => resolver.resolveMany(endpoints, context),
    neighbors: (endpoint, filter = {}) => resolver.neighbors(endpoint, filter),
    between: (left, right, filter = {}) => resolver.between(left, right, filter),
    search: (query, filter = {}) => resolver.search(query, filter),
    shortestPath: (start, end, queryOptions = {}) => resolver.shortestPath(start, end, queryOptions),
    facetCounts: (filter = {}) => resolver.facetCounts(filter),
    exportBundle: (selection = {}) => resolver.exportBundle(selection),
    stats: () => ({
      ...resolver.stats(),
      adapterSchema: RELATIONSHIP_BROWSER_SCHEMA,
      adapterVersion: RELATIONSHIP_BROWSER_ADAPTER_VERSION,
      privacy: 'public-canonical-only',
      providerNamespaces: Object.keys(providers).sort()
    })
  });

  return api;
}

export async function installTempleRelationshipBrowserAdapter(options = {}) {
  const windowRef = publicWindow(options.windowRef || globalThis.window || globalThis);
  if (windowRef.TempleRelationshipBrowser?.schema === RELATIONSHIP_BROWSER_SCHEMA) return windowRef.TempleRelationshipBrowser;
  const api = await createTempleRelationshipBrowserAdapter({ ...options, windowRef });
  windowRef.TempleRelationshipBrowser = api;
  if (typeof windowRef.document?.dispatchEvent === 'function' && typeof windowRef.CustomEvent === 'function') {
    windowRef.document.dispatchEvent(new windowRef.CustomEvent('temple:relationship-browser-ready', {
      detail: { schema: api.schema, version: api.version, privacy: api.privacy }
    }));
  }
  return api;
}
