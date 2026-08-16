import { installTempleRelationshipBrowserAdapter } from './v5.3.0-relationship-browser-adapter.mjs';

export const LIVING_TEMPLE_MAP_SCHEMA = 'temple-of-maat/living-temple-map-v1';
export const LIVING_TEMPLE_MAP_VERSION = '1.0.0';

const MAP_BANDS = Object.freeze({
  'source-textual': 'Source / Textual',
  'historical-later': 'Historical / Later Correspondence',
  computational: 'Computational',
  comparative: 'Comparative',
  'temple-synthesis': 'Temple Synthesis',
  unclassified: 'Unclassified'
});

const NAMESPACE_X = Object.freeze({ chamber: 12, codex: 37, dossier: 62, library: 87 });
const PAIR_AUTHORITY_URL = new URL('../research/pair-authority.json', import.meta.url);
const PAIR_MIGRATION_URL = new URL('../research/pair-authority-name-migration.v1.json', import.meta.url);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function endpointKey(endpoint) {
  return `${endpoint.namespace}:${endpoint.recordId}`;
}

function edgeText(edge) {
  return [
    edge.id,
    endpointKey(edge.from), endpointKey(edge.to), edge.relationType,
    edge.claimBoundary?.claimClass, edge.claimBoundary?.directHistoricalInfluence,
    edge.summary, edge.evidence?.note,
    ...(edge.provenanceLayers || []), ...(edge.evidence?.basis || []),
    ...(edge.evidence?.sourceRefs || []), ...(edge.limitations || []), ...(edge.tags || [])
  ].filter(Boolean).join(' ').toLocaleLowerCase();
}

export function classifyRelationshipEdge(edge) {
  const relation = String(edge?.relationType || '');
  const claimClass = String(edge?.claimBoundary?.claimClass || '');
  if (relation === 'study-uses-source' || relation === 'textual-relationship') return 'source-textual';
  if (relation === 'historical-context' || relation === 'historical-influence' || claimClass === 'historical') return 'historical-later';
  if (relation === 'computational-correspondence' || claimClass === 'computational') return 'computational';
  if (['methodological-parallel', 'thematic-parallel', 'comparative-similarity'].includes(relation) || claimClass === 'comparative') return 'comparative';
  if (['record-layer-alignment', 'temple-correspondence'].includes(relation) || claimClass === 'structural') return 'temple-synthesis';
  return 'unclassified';
}

export function computeTempleMapLayout(endpointValues) {
  const groups = new Map();
  for (const endpoint of endpointValues || []) {
    const key = endpointKey(endpoint);
    if (!groups.has(endpoint.namespace)) groups.set(endpoint.namespace, []);
    groups.get(endpoint.namespace).push({ ...clone(endpoint), key });
  }
  const positions = {};
  for (const [namespace, entries] of groups) {
    entries.sort((a, b) => a.recordId.localeCompare(b.recordId, undefined, { numeric: true }));
    const x = NAMESPACE_X[namespace] ?? 50;
    const count = entries.length;
    entries.forEach((entry, index) => {
      const y = count === 1 ? 50 : 12 + (76 * index) / (count - 1);
      positions[entry.key] = { x, y };
    });
  }
  return positions;
}

function uniqueEndpoints(edges) {
  const map = new Map();
  for (const edge of edges || []) {
    for (const endpoint of [edge.from, edge.to]) map.set(endpointKey(endpoint), clone(endpoint));
  }
  return [...map.values()].sort((a, b) => endpointKey(a).localeCompare(endpointKey(b)));
}

function pairNumberForEndpoint(endpoint) {
  if (!['chamber', 'codex', 'dossier'].includes(endpoint?.namespace)) return null;
  const number = Number(endpoint.recordId);
  return Number.isInteger(number) && number >= 1 && number <= 72 ? number : null;
}

function recordTitle(resolved) {
  const record = resolved?.record || {};
  return record.title || record.thirdName || record.angel || record.nameEn || record.sourceLayer?.nameEn || endpointKey(resolved.endpoint);
}

function recordSummary(resolved) {
  const record = resolved?.record || {};
  return record.summary || record.office || record.attribute || record.provenanceNote || record.sourceLayer?.attribute || '';
}

function valueText(value) {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, handler, className = '') {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
}

function badge(text, band = '') {
  return el('span', `tm533-badge${band ? ` tm533-band-${band}` : ''}`, text);
}

function installStyles() {
  if (document.querySelector('link[data-temple-living-map-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './styles/v5.3.3-living-temple-map.css';
  link.dataset.templeLivingMapStyle = 'true';
  document.head.appendChild(link);
}

async function fetchJson(fetchImpl, url, label) {
  const response = await fetchImpl(url, { cache: 'force-cache' });
  if (!response?.ok) throw new Error(`Unable to load ${label} (${response?.status ?? 'unknown status'}).`);
  return response.json();
}

export async function createTempleLivingMap(options = {}) {
  const windowRef = options.windowRef || globalThis.window;
  if (!windowRef?.document) throw new TypeError('Living Temple Map requires a browser document.');
  const adapter = options.adapter || await installTempleRelationshipBrowserAdapter(options.adapterOptions || {});
  const rawFetch = options.fetchImpl || windowRef.fetch || globalThis.fetch;
  if (typeof rawFetch !== 'function') throw new TypeError('Living Temple Map requires fetch.');
  const fetchImpl = rawFetch.bind ? rawFetch.bind(windowRef) : rawFetch;

  const allEdges = adapter.resolver.edges();
  const allEndpoints = uniqueEndpoints(allEdges);
  const titleCache = new Map();
  let authorityPromise = null;
  let layer = null;
  let body = null;
  let workspace = null;
  let detail = null;
  let returnFocus = null;
  let selected = null;
  let filterState = { query: '', band: 'all', layer: 'all' };
  let view = windowRef.matchMedia?.('(max-width: 700px)')?.matches ? 'list' : 'map';

  installStyles();

  function loadAuthority() {
    if (!authorityPromise) {
      authorityPromise = Promise.all([
        fetchJson(fetchImpl, options.pairAuthorityUrl || PAIR_AUTHORITY_URL, 'Pair Authority'),
        fetchJson(fetchImpl, options.pairMigrationUrl || PAIR_MIGRATION_URL, 'Pair Authority naming migration')
      ]).then(([manifest, migration]) => {
        if (manifest?.privacy !== 'public-canonical-only' || migration?.privacy !== 'public-canonical-only') {
          throw new Error('Living Temple Map accepts public-canonical-only Pair Authority data.');
        }
        return {
          manifest,
          migration,
          byNumber: new Map((migration.records || []).map((record) => [Number(record.pairNumber), clone(record)]))
        };
      });
    }
    return authorityPromise;
  }

  function filteredEdges() {
    const query = filterState.query.trim().toLocaleLowerCase();
    return allEdges.filter((edge) => {
      if (filterState.band !== 'all' && classifyRelationshipEdge(edge) !== filterState.band) return false;
      if (filterState.layer !== 'all' && !(edge.provenanceLayers || []).includes(filterState.layer)) return false;
      if (query && !edgeText(edge).includes(query)) return false;
      return true;
    });
  }

  function titleFor(endpoint) {
    return titleCache.get(endpointKey(endpoint)) || endpointKey(endpoint);
  }

  async function hydrateTitles() {
    const unresolved = allEndpoints.filter((endpoint) => !titleCache.has(endpointKey(endpoint)));
    if (!unresolved.length) return;
    const resolved = await adapter.resolveMany(unresolved);
    resolved.forEach((record) => titleCache.set(endpointKey(record.endpoint), recordTitle(record)));
  }

  function createLayer() {
    if (layer) return;
    layer = el('div', 'tm533-map-layer');
    layer.id = 'tm533-living-temple-map';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('aria-labelledby', 'tm533-living-temple-map-title');

    const scrim = button('', close, 'tm533-map-scrim');
    scrim.setAttribute('aria-label', 'Close Living Temple Map');
    const panel = el('section', 'tm533-map-panel');
    const header = el('header', 'tm533-map-header');
    const titles = el('div');
    titles.append(el('p', 'tm533-eyebrow', 'Public Canonical Research Layer · Provenance Before Synthesis'));
    const title = el('h2', 'tm533-title', 'Living Temple Map');
    title.id = 'tm533-living-temple-map-title';
    titles.append(title);
    const closeButton = button('×', close, 'tm533-close');
    closeButton.setAttribute('aria-label', 'Close Living Temple Map');
    header.append(titles, closeButton);
    body = el('div', 'tm533-map-body');
    panel.append(header, body);
    layer.append(scrim, panel);
    document.body.append(layer);
  }

  function makeControls() {
    const controls = el('section', 'tm533-controls');

    const searchField = el('label', 'tm533-field');
    searchField.append(el('span', '', 'Search canonical edges'));
    const search = el('input');
    search.type = 'search';
    search.placeholder = 'source, chamber, gematria, Qumran…';
    search.value = filterState.query;
    search.addEventListener('input', () => {
      filterState = { ...filterState, query: search.value };
      renderWorkspace();
    });
    searchField.append(search);

    const bandField = el('label', 'tm533-field');
    bandField.append(el('span', '', 'Relationship band'));
    const bandSelect = el('select');
    const allOption = el('option', '', 'All provenance bands');
    allOption.value = 'all';
    bandSelect.append(allOption);
    Object.entries(MAP_BANDS).forEach(([value, label]) => {
      const option = el('option', '', label);
      option.value = value;
      bandSelect.append(option);
    });
    bandSelect.value = filterState.band;
    bandSelect.addEventListener('change', () => {
      filterState = { ...filterState, band: bandSelect.value };
      renderWorkspace();
    });
    bandField.append(bandSelect);

    const layerField = el('label', 'tm533-field');
    layerField.append(el('span', '', 'Provenance layer'));
    const layerSelect = el('select');
    [['all', 'All layers'], ['L1', 'L1 · Source'], ['L2', 'L2 · Scholarship / Analysis'], ['L3', 'L3 · Later Correspondence'], ['L4', 'L4 · Temple Synthesis']].forEach(([value, label]) => {
      const option = el('option', '', label);
      option.value = value;
      layerSelect.append(option);
    });
    layerSelect.value = filterState.layer;
    layerSelect.addEventListener('change', () => {
      filterState = { ...filterState, layer: layerSelect.value };
      renderWorkspace();
    });
    layerField.append(layerSelect);

    const viewGroup = el('div', 'tm533-view-group');
    viewGroup.setAttribute('role', 'group');
    viewGroup.setAttribute('aria-label', 'Map display mode');
    const mapButton = button('Map', () => chooseView('map'), 'tm533-view-button');
    const listButton = button('Accessible List', () => chooseView('list'), 'tm533-view-button');
    mapButton.dataset.mapView = 'map';
    listButton.dataset.mapView = 'list';
    viewGroup.append(mapButton, listButton);

    controls.append(searchField, bandField, layerField, viewGroup);
    return controls;
  }

  function renderLegend() {
    const legend = el('section', 'tm533-legend');
    legend.append(el('p', 'tm533-eyebrow', 'Relationship Legend'));
    const row = el('div', 'tm533-legend-row');
    Object.entries(MAP_BANDS).forEach(([band, label]) => {
      const item = el('span', 'tm533-legend-item');
      item.append(el('span', `tm533-legend-mark tm533-band-${band}`), el('span', '', label));
      row.append(item);
    });
    legend.append(row);
    return legend;
  }

  function renderMapCanvas(edges) {
    const endpoints = uniqueEndpoints(edges);
    const positions = computeTempleMapLayout(endpoints);
    const canvas = el('div', 'tm533-map-canvas');
    canvas.setAttribute('aria-label', 'Visual canonical relationship map. Use the Accessible List for a complete keyboard-first edge representation.');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'tm533-edge-svg');
    svg.setAttribute('viewBox', '0 0 1000 680');
    svg.setAttribute('aria-hidden', 'true');
    for (const edge of edges) {
      const from = positions[endpointKey(edge.from)];
      const to = positions[endpointKey(edge.to)];
      if (!from || !to) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(from.x * 10));
      line.setAttribute('y1', String(from.y * 6.8));
      line.setAttribute('x2', String(to.x * 10));
      line.setAttribute('y2', String(to.y * 6.8));
      line.setAttribute('class', `tm533-edge-line tm533-band-${classifyRelationshipEdge(edge)}`);
      svg.append(line);
    }
    canvas.append(svg);

    for (const endpoint of endpoints) {
      const key = endpointKey(endpoint);
      const position = positions[key];
      const node = button(titleFor(endpoint), () => selectEndpoint(key), 'tm533-node');
      node.dataset.endpoint = key;
      node.dataset.namespace = endpoint.namespace;
      node.style.left = `${position.x}%`;
      node.style.top = `${position.y}%`;
      node.setAttribute('aria-label', `${titleFor(endpoint)} · ${key}`);
      if (selected?.type === 'node' && selected.key === key) node.classList.add('is-selected');
      canvas.append(node);
    }

    if (!edges.length) canvas.append(el('p', 'tm533-empty', 'No canonical edges match the current filters. No relationship is inferred.'));
    return canvas;
  }

  function renderEdgeList(edges) {
    const list = el('section', 'tm533-edge-list');
    list.setAttribute('aria-label', 'Accessible canonical relationship list');
    if (!edges.length) {
      list.append(el('p', 'tm533-empty', 'No canonical edges match the current filters. No relationship is inferred.'));
      return list;
    }
    edges.forEach((edge) => {
      const band = classifyRelationshipEdge(edge);
      const item = button('', () => selectEdge(edge.id), 'tm533-edge-item');
      item.dataset.edgeId = edge.id;
      if (selected?.type === 'edge' && selected.key === edge.id) item.classList.add('is-selected');
      const top = el('span', 'tm533-edge-item-top');
      top.append(badge(MAP_BANDS[band], band), badge(edge.claimBoundary?.claimClass || 'claim class unspecified'));
      item.append(
        top,
        el('strong', '', edge.relationType),
        el('span', 'tm533-edge-endpoints', `${titleFor(edge.from)} → ${titleFor(edge.to)}`),
        el('span', 'tm533-edge-ids', `${endpointKey(edge.from)} ↔ ${endpointKey(edge.to)}`)
      );
      list.append(item);
    });
    return list;
  }

  function section(title, content) {
    if (!content || (Array.isArray(content) && !content.length)) return null;
    const node = el('section', 'tm533-detail-section');
    node.append(el('h4', '', title));
    if (Array.isArray(content)) {
      const list = el('ul');
      content.forEach((item) => list.append(el('li', '', valueText(item))));
      node.append(list);
    } else {
      node.append(el('p', '', valueText(content)));
    }
    return node;
  }

  async function renderPairAuthority(endpoint) {
    const number = pairNumberForEndpoint(endpoint);
    if (!number) return null;
    try {
      const authority = await loadAuthority();
      const pair = authority.byNumber.get(number);
      if (!pair) return null;
      const node = el('section', 'tm533-pair-authority');
      node.append(el('p', 'tm533-eyebrow', `Pair Authority · ${pair.recordId}`), el('h4', '', `${pair.angel} ↔ ${pair.daemon}`));
      const status = el('div', 'tm533-badges');
      status.append(badge('CURRENT · Amendment I'), badge(pair.migrationStatus, pair.sameIgnoringCase ? 'source-textual' : 'historical-later'));
      node.append(status);
      const dl = el('dl', 'tm533-kv');
      [
        ['Deployed Third Name', pair.legacyThirdName],
        ['Preferred future form', pair.preferredRefinedThirdName],
        ['Current naming method', authority.manifest.currentImplementationContract?.namingMethod],
        ['Future naming method', authority.manifest.currentImplementationContract?.preferredFutureNamingMethod],
        ['Implementation migrated', authority.migration.summary?.implementationMigrated]
      ].forEach(([label, value]) => dl.append(el('dt', '', label), el('dd', '', valueText(value))));
      node.append(dl, el('p', 'tm533-private-note', 'Naming refinement is displayed as provenance only. This map does not rename the live chamber or create a new graph edge.'));
      return node;
    } catch (error) {
      const node = el('section', 'tm533-pair-authority');
      node.append(el('p', 'tm533-private-note', `Pair Authority unavailable: ${error.message}`));
      return node;
    }
  }

  async function renderNodeDetail(resolved) {
    const card = el('div', 'tm533-detail-card');
    card.append(el('p', 'tm533-eyebrow', 'Canonical Record'), el('h3', '', recordTitle(resolved)), el('div', 'tm533-endpoint', endpointKey(resolved.endpoint)));
    const badges = el('div', 'tm533-badges');
    badges.append(badge(resolved.namespace?.label || resolved.endpoint.namespace));
    card.append(badges);
    const summary = recordSummary(resolved);
    if (summary) card.append(el('p', 'tm533-summary', summary));

    const record = resolved.record || {};
    const dl = el('dl', 'tm533-kv');
    [
      ['Record kind', record.recordKind || record.type],
      ['Angel', record.angel || record.nameEn || record.sourceLayer?.nameEn],
      ['Daemon / counterpart', record.daemon || record.gematriaTwin?.daemon],
      ['Law', record.law],
      ['Source kind', record.sourceMetadata?.sourceKind]
    ].filter(([, value]) => value !== undefined && value !== null && value !== '').forEach(([label, value]) => dl.append(el('dt', '', label), el('dd', '', valueText(value))));
    if (dl.children.length) card.append(dl);

    const pairAuthority = await renderPairAuthority(resolved.endpoint);
    if (pairAuthority) card.append(pairAuthority);

    const neighbors = adapter.neighbors(resolved.endpoint);
    const neighborSection = el('section', 'tm533-neighbors');
    neighborSection.append(el('h4', '', `Canonical relations · ${neighbors.length}`));
    if (!neighbors.length) neighborSection.append(el('p', 'tm533-private-note', 'No canonical relationship edges are stored for this record.'));
    else neighbors.forEach(({ edge, endpoint, traversal }) => {
      neighborSection.append(button(`${edge.relationType} · ${traversal} · ${titleFor(endpoint)}`, () => selectEdge(edge.id), 'tm533-neighbor-button'));
    });
    card.append(neighborSection);
    return card;
  }

  function renderEdgeDetail(edge) {
    const band = classifyRelationshipEdge(edge);
    const card = el('div', 'tm533-detail-card');
    card.append(el('p', 'tm533-eyebrow', edge.id), el('h3', '', edge.relationType));
    const badges = el('div', 'tm533-badges');
    badges.append(badge(MAP_BANDS[band], band), badge(edge.direction), badge(edge.confidence), badge(edge.claimBoundary?.claimClass || 'claim class unspecified'));
    (edge.provenanceLayers || []).forEach((item) => badges.append(badge(item)));
    card.append(badges);
    if (edge.summary) card.append(el('p', 'tm533-summary', edge.summary));

    const endpointGrid = el('div', 'tm533-edge-detail-endpoints');
    [edge.from, edge.to].forEach((endpoint) => {
      const endpointButton = button(titleFor(endpoint), () => selectEndpoint(endpointKey(endpoint)), 'tm533-endpoint-button');
      endpointButton.append(el('span', '', endpointKey(endpoint)));
      endpointGrid.append(endpointButton);
    });
    card.append(endpointGrid);

    [section('Evidence basis', edge.evidence?.basis), section('Evidence note', edge.evidence?.note), section('Source references', edge.evidence?.sourceRefs), section('Limitations', edge.limitations)].filter(Boolean).forEach((node) => card.append(node));
    const dl = el('dl', 'tm533-kv');
    [
      ['Historical identity', edge.claimBoundary?.historicalIdentity],
      ['Metaphysical identity', edge.claimBoundary?.metaphysicalIdentity],
      ['Direct historical influence', edge.claimBoundary?.directHistoricalInfluence]
    ].forEach(([label, value]) => dl.append(el('dt', '', label), el('dd', '', valueText(value))));
    card.append(dl);
    return card;
  }

  async function selectEndpoint(value) {
    const endpoint = adapter.resolver.normalizeEndpoint(value);
    selected = { type: 'node', key: endpointKey(endpoint) };
    const resolved = await adapter.resolve(endpoint);
    if (detail) detail.replaceChildren(await renderNodeDetail(resolved));
    renderWorkspace(false);
    return clone(resolved);
  }

  function selectEdge(id) {
    const edge = adapter.resolver.getEdge(id);
    if (!edge) return null;
    selected = { type: 'edge', key: edge.id };
    if (detail) detail.replaceChildren(renderEdgeDetail(edge));
    renderWorkspace(false);
    return clone(edge);
  }

  function syncViewButtons() {
    body?.querySelectorAll('[data-map-view]').forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.mapView === view)));
  }

  function renderWorkspace(resetDetail = true) {
    if (!workspace) return;
    const edges = filteredEdges();
    const endpoints = uniqueEndpoints(edges);
    workspace.dataset.view = view;
    workspace.replaceChildren();

    const summary = el('div', 'tm533-stats');
    summary.append(badge(`${edges.length} canonical edge${edges.length === 1 ? '' : 's'}`), badge(`${endpoints.length} mapped record${endpoints.length === 1 ? '' : 's'}`), badge('Public canonical only'));
    workspace.append(summary, renderLegend());

    const views = el('div', 'tm533-view-stack');
    const map = renderMapCanvas(edges);
    const list = renderEdgeList(edges);
    map.hidden = view !== 'map';
    list.hidden = view !== 'list';
    views.append(map, list);
    workspace.append(views);
    syncViewButtons();

    if (resetDetail && detail && !selected) detail.replaceChildren(el('p', 'tm533-empty', 'Select a canonical record or relationship to inspect its evidence and boundaries.'));
  }

  function renderBody() {
    body.replaceChildren();
    body.append(el('p', 'tm533-covenant', 'Source → Scholarship → Correspondence → Temple Interpretation. The map renders only stored public canonical edges. Line proximity, visual paths, shared numbers, or naming similarity do not create historical influence, metaphysical identity, or causality.'));
    body.append(makeControls());

    const shell = el('div', 'tm533-shell');
    workspace = el('section', 'tm533-workspace');
    detail = el('aside', 'tm533-detail');
    detail.setAttribute('aria-live', 'polite');
    detail.append(el('p', 'tm533-empty', 'Select a canonical record or relationship to inspect its evidence and boundaries.'));
    shell.append(workspace, detail);
    body.append(shell, el('p', 'tm533-private-note', 'Private Journey, Library notes, Research Notebook, and Scribe threads are intentionally not read into v1 of this map. Future private overlays must remain device-local, opt-in, and must never become public graph evidence.'));
    renderWorkspace();
  }

  function installLibraryLauncher() {
    const tryInstall = () => {
      const footer = document.querySelector('#tm528-library .tm528-footer');
      if (!footer || footer.querySelector('[data-temple-map-launcher]')) return false;
      const launch = button('Living Temple Map', () => open(), 'tm533-library-launch');
      launch.dataset.templeMapLauncher = 'library';
      launch.setAttribute('aria-label', 'Open Living Temple Map research workspace');
      footer.append(launch);
      return true;
    };
    if (tryInstall()) return;
    const observer = new MutationObserver(() => { if (tryInstall()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function focusable() {
    if (!layer || layer.hidden) return [];
    return [...layer.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      .filter((node) => node.getClientRects().length);
  }

  async function restoreSelection() {
    if (!selected) return;
    if (selected.type === 'node') await selectEndpoint(selected.key);
    else if (selected.type === 'edge') selectEdge(selected.key);
  }

  async function open(endpointValue) {
    if (!document.body.classList.contains('temple-app-ready')) return false;
    createLayer();
    returnFocus = document.activeElement;
    await hydrateTitles();
    renderBody();
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('temple-living-map-open');
    if (endpointValue) await selectEndpoint(endpointValue);
    requestAnimationFrame(() => layer.querySelector('.tm533-close')?.focus({ preventScroll: true }));
    return true;
  }

  function close() {
    if (!layer || layer.hidden) return false;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('temple-living-map-open');
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
    return true;
  }

  async function setFilters(next = {}) {
    filterState = {
      query: next.query === undefined ? filterState.query : String(next.query),
      band: next.band === undefined ? filterState.band : String(next.band),
      layer: next.layer === undefined ? filterState.layer : String(next.layer)
    };
    if (layer && !layer.hidden) {
      renderBody();
      await restoreSelection();
    }
    return clone(filterState);
  }

  function chooseView(next) {
    if (!['map', 'list'].includes(next)) throw new RangeError('Living Temple Map view must be map or list.');
    view = next === 'map' && windowRef.matchMedia?.('(max-width: 700px)')?.matches ? 'list' : next;
    if (layer && !layer.hidden) renderWorkspace(false);
    return view;
  }

  function setView(next) {
    return chooseView(next);
  }

  function exportVisible() {
    return adapter.exportBundle({ edgeIds: filteredEdges().map((edge) => edge.id) });
  }

  windowRef.addEventListener?.('resize', () => {
    if (view === 'map' && windowRef.matchMedia?.('(max-width: 700px)')?.matches) {
      view = 'list';
      if (layer && !layer.hidden) renderWorkspace(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!layer || layer.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  createLayer();
  installLibraryLauncher();

  return Object.freeze({
    schema: LIVING_TEMPLE_MAP_SCHEMA,
    version: LIVING_TEMPLE_MAP_VERSION,
    privacy: 'public-canonical-only',
    adapter,
    bands: () => clone(MAP_BANDS),
    edges: () => clone(allEdges),
    endpoints: () => clone(allEndpoints),
    filters: () => clone(filterState),
    setFilters,
    view: () => view,
    setView,
    open,
    close,
    selectEndpoint,
    selectEdge,
    exportVisible,
    pairAuthority: async (number) => {
      const authority = await loadAuthority();
      return clone(authority.byNumber.get(Number(number)) || null);
    }
  });
}

export async function installTempleLivingMap(options = {}) {
  if (window.TempleLivingTempleMap?.schema === LIVING_TEMPLE_MAP_SCHEMA) return window.TempleLivingTempleMap;
  const api = await createTempleLivingMap(options);
  window.TempleLivingTempleMap = api;
  document.dispatchEvent(new CustomEvent('temple:living-temple-map-ready', {
    detail: { schema: api.schema, version: api.version, privacy: api.privacy }
  }));
  return api;
}
