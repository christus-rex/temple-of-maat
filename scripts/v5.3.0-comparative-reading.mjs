import { installTempleRelationshipBrowserAdapter } from './v5.3.0-relationship-browser-adapter.mjs';

export const COMPARATIVE_READING_SCHEMA = 'temple-of-maat/comparative-reading-v1';
export const COMPARATIVE_READING_VERSION = '1.0.0';

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function endpointKey(endpoint) {
  return `${endpoint.namespace}:${endpoint.recordId}`;
}

function uniqueEndpoints(edges) {
  const map = new Map();
  for (const edge of edges) {
    for (const endpoint of [edge.from, edge.to]) map.set(endpointKey(endpoint), clone(endpoint));
  }
  return [...map.values()].sort((a, b) => endpointKey(a).localeCompare(endpointKey(b)));
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

function badge(text, warning = false) {
  return el('span', `tm530-badge${warning ? ' tm530-badge--warning' : ''}`, text);
}

function section(title, content) {
  if (!content || (Array.isArray(content) && !content.length)) return null;
  const node = el('section', 'tm530-section');
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

function installStyles() {
  if (document.querySelector('link[data-temple-comparative-reading-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './styles/v5.3.0-comparative-reading.css';
  link.dataset.templeComparativeReadingStyle = 'true';
  document.head.appendChild(link);
}

export async function createTempleComparativeReading(options = {}) {
  const adapter = options.adapter || await installTempleRelationshipBrowserAdapter(options.adapterOptions || {});
  const endpoints = uniqueEndpoints(adapter.resolver.edges());
  let layer = null;
  let body = null;
  let leftSelect = null;
  let rightSelect = null;
  let returnFocus = null;
  let lastComparison = null;

  installStyles();

  function endpointExists(value) {
    return endpoints.some((endpoint) => endpointKey(endpoint) === value);
  }

  function optionLabel(endpoint) {
    return `${endpoint.namespace.toUpperCase()} · ${endpoint.recordId}`;
  }

  function populateSelect(select, selected) {
    select.replaceChildren();
    endpoints.forEach((endpoint) => {
      const option = el('option', '', optionLabel(endpoint));
      option.value = endpointKey(endpoint);
      option.selected = option.value === selected;
      select.append(option);
    });
  }

  function defaultPair() {
    const preferredLeft = 'library:source.quran-tanzil-pickthall-edition';
    const preferredRight = 'library:study.quran-abjad-gematria';
    return {
      left: endpointExists(preferredLeft) ? preferredLeft : endpointKey(endpoints[0]),
      right: endpointExists(preferredRight) ? preferredRight : endpointKey(endpoints[1] || endpoints[0])
    };
  }

  function createLayer() {
    if (layer) return;
    layer = el('div', 'tm530-compare-layer');
    layer.id = 'tm530-comparative';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('aria-labelledby', 'tm530-comparative-title');

    const scrim = button('', close, 'tm530-compare-scrim');
    scrim.setAttribute('aria-label', 'Close Comparative Reading');
    const panel = el('section', 'tm530-compare-panel');
    const header = el('header', 'tm530-compare-header');
    const titles = el('div');
    titles.append(el('p', 'tm530-compare-eyebrow', 'Research Workspace · Evidence Before Interpretation'));
    const title = el('h2', 'tm530-compare-title', 'Comparative Reading');
    title.id = 'tm530-comparative-title';
    titles.append(title);
    const closeButton = button('×', close, 'tm530-compare-close');
    closeButton.setAttribute('aria-label', 'Close Comparative Reading');
    header.append(titles, closeButton);
    body = el('div', 'tm530-compare-body');
    panel.append(header, body);
    layer.append(scrim, panel);
    document.body.append(layer);
  }

  function renderRecord(resolved, side) {
    const card = el('article', 'tm530-record-card');
    card.dataset.compareSide = side;
    card.append(el('p', 'tm530-compare-eyebrow', side === 'left' ? 'Record A' : 'Record B'));
    card.append(el('h3', '', recordTitle(resolved)));
    card.append(el('div', 'tm530-endpoint', endpointKey(resolved.endpoint)));

    const badges = el('div', 'tm530-badges');
    badges.append(badge(resolved.namespace?.label || resolved.endpoint.namespace));
    const record = resolved.record || {};
    (record.provenanceLayers || []).forEach((layerName) => badges.append(badge(layerName)));
    if (record.status) badges.append(badge(String(record.status).toUpperCase()));
    card.append(badges);

    const summary = recordSummary(resolved);
    if (summary) card.append(el('p', 'tm530-record-summary', summary));

    const dl = el('dl', 'tm530-kv');
    const entries = [
      ['Record kind', record.recordKind || record.type],
      ['Angel', record.angel || record.nameEn || record.sourceLayer?.nameEn],
      ['Daemon / counterpart', record.daemon || record.gematriaTwin?.daemon],
      ['Law', record.law],
      ['Languages', record.languages],
      ['Public exposure', record.rights?.publicExposure],
      ['Source kind', record.sourceMetadata?.sourceKind]
    ].filter(([, value]) => value !== undefined && value !== null && value !== '');
    entries.forEach(([label, value]) => dl.append(el('dt', '', label), el('dd', '', valueText(value))));
    if (entries.length) card.append(dl);
    return card;
  }

  function renderRelation(edge) {
    const card = el('article', 'tm530-relation-card');
    card.append(el('p', 'tm530-compare-eyebrow', edge.id), el('h3', '', edge.relationType));
    const meta = el('div', 'tm530-relation-meta');
    meta.append(badge(edge.direction), badge(edge.confidence), badge(edge.claimBoundary?.claimClass || 'claim class unspecified'));
    (edge.provenanceLayers || []).forEach((layerName) => meta.append(badge(layerName)));
    if (edge.claimBoundary?.directHistoricalInfluence !== 'established') meta.append(badge(`historical influence: ${edge.claimBoundary?.directHistoricalInfluence || 'not claimed'}`, true));
    card.append(meta);
    if (edge.summary) card.append(el('p', 'tm530-record-summary', edge.summary));

    const evidence = section('Evidence basis', edge.evidence?.basis);
    const evidenceNote = section('Evidence note', edge.evidence?.note);
    const sourceRefs = section('Source references', edge.evidence?.sourceRefs);
    const limitations = section('Limitations', edge.limitations);
    [evidence, evidenceNote, sourceRefs, limitations].filter(Boolean).forEach((node) => card.append(node));

    const boundary = el('dl', 'tm530-kv');
    [
      ['Historical identity', edge.claimBoundary?.historicalIdentity],
      ['Metaphysical identity', edge.claimBoundary?.metaphysicalIdentity],
      ['Direct historical influence', edge.claimBoundary?.directHistoricalInfluence]
    ].forEach(([label, value]) => boundary.append(el('dt', '', label), el('dd', '', valueText(value))));
    card.append(boundary);
    return card;
  }

  function renderPath(path) {
    if (!path) return null;
    const card = el('section', 'tm530-path-card');
    card.append(el('p', 'tm530-compare-eyebrow', 'Connectivity Only · Not Causality'), el('h3', '', `Shortest canonical path · ${path.hops} hop${path.hops === 1 ? '' : 's'}`));
    const line = el('div', 'tm530-path-list');
    path.endpoints.forEach((endpoint, index) => {
      if (index) line.append(el('span', 'tm530-path-arrow', '→'));
      line.append(el('span', '', endpointKey(endpoint)));
    });
    card.append(line, el('p', 'tm530-compare-private', 'A connectivity path shows that graph records touch through stored edges. It does not establish historical transmission, causality, metaphysical identity, or source dependence unless the individual edge claims explicitly say so.'));
    return card;
  }

  async function compare(leftValue = leftSelect?.value, rightValue = rightSelect?.value) {
    if (!endpointExists(leftValue) || !endpointExists(rightValue)) throw new RangeError('Comparative Reading requires two canonical graph endpoints.');
    const [left, right] = await adapter.resolveMany([leftValue, rightValue]);
    const edges = adapter.between(leftValue, rightValue);
    const path = edges.length ? null : adapter.shortestPath(leftValue, rightValue);
    lastComparison = { leftValue, rightValue, left, right, edges, path };
    renderComparison();
    return clone(lastComparison);
  }

  function renderComparison() {
    if (!body || !lastComparison) return;
    const { leftValue, rightValue, left, right, edges, path } = lastComparison;
    body.replaceChildren();
    body.append(el('p', 'tm530-compare-covenant', 'Source → Scholarship → Correspondence → Temple Interpretation. This workspace displays the canonical relationship claim before any new interpretation. No private Journey or Library state is read into the comparison.'));

    const picker = el('div', 'tm530-compare-picker');
    const leftField = el('div', 'tm530-compare-field');
    const leftLabel = el('label', '', 'Record A');
    leftLabel.htmlFor = 'tm530-left';
    leftSelect = el('select');
    leftSelect.id = 'tm530-left';
    populateSelect(leftSelect, leftValue);
    leftField.append(leftLabel, leftSelect);

    const rightField = el('div', 'tm530-compare-field');
    const rightLabel = el('label', '', 'Record B');
    rightLabel.htmlFor = 'tm530-right';
    rightSelect = el('select');
    rightSelect.id = 'tm530-right';
    populateSelect(rightSelect, rightValue);
    rightField.append(rightLabel, rightSelect);

    const compareButton = button('Compare Canonical Records', () => compare().catch((error) => console.error('[Comparative Reading]', error)), 'tm530-compare-action');
    picker.append(leftField, compareButton, rightField);
    body.append(picker);

    const grid = el('div', 'tm530-compare-grid');
    grid.append(renderRecord(left, 'left'), renderRecord(right, 'right'));
    body.append(grid);

    const relations = el('section', 'tm530-relations');
    relations.append(el('p', 'tm530-compare-eyebrow', 'Canonical Relationship Evidence'));
    if (edges.length) edges.forEach((edge) => relations.append(renderRelation(edge)));
    else relations.append(el('div', 'tm530-no-edge', 'No direct canonical relationship edge exists between these records. The workspace will not invent one. If a stored connectivity path exists, it is shown separately and must not be read as causality.'));
    body.append(relations);
    const pathCard = renderPath(path);
    if (pathCard) body.append(pathCard);
    body.append(el('p', 'tm530-compare-private', 'Private reflections may be considered by the visitor outside this canonical evidence view, but they are not inserted into the public graph, provider records, or relationship bundle.'));
  }

  function installLibraryLauncher() {
    const tryInstall = () => {
      const footer = document.querySelector('#tm528-library .tm528-footer');
      if (!footer || footer.querySelector('[data-temple-comparative-launcher]')) return false;
      const launch = button('Comparative Reading', () => open(), 'tm530-library-launch');
      launch.dataset.templeComparativeLauncher = 'library';
      launch.setAttribute('aria-label', 'Open Comparative Reading research workspace');
      footer.append(launch);
      return true;
    };
    if (tryInstall()) return;
    const observer = new MutationObserver(() => { if (tryInstall()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function focusable() {
    if (!layer || layer.hidden) return [];
    return [...layer.querySelectorAll('button:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      .filter((node) => node.getClientRects().length);
  }

  async function open(leftValue, rightValue) {
    if (!document.body.classList.contains('temple-app-ready')) return false;
    createLayer();
    const defaults = defaultPair();
    const left = endpointExists(leftValue) ? leftValue : defaults.left;
    const right = endpointExists(rightValue) ? rightValue : defaults.right;
    returnFocus = document.activeElement;
    await compare(left, right);
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('temple-comparative-reading-open');
    requestAnimationFrame(() => layer.querySelector('.tm530-compare-close')?.focus({ preventScroll: true }));
    return true;
  }

  function close() {
    if (!layer || layer.hidden) return false;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('temple-comparative-reading-open');
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
    return true;
  }

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
    const last = items[items.length - 1];
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

  const api = Object.freeze({
    schema: COMPARATIVE_READING_SCHEMA,
    version: COMPARATIVE_READING_VERSION,
    privacy: 'public-canonical-only',
    adapter,
    endpoints: () => clone(endpoints),
    open,
    close,
    compare,
    last: () => clone(lastComparison)
  });

  return api;
}

export async function installTempleComparativeReading(options = {}) {
  if (window.TempleComparativeReading?.schema === COMPARATIVE_READING_SCHEMA) return window.TempleComparativeReading;
  const api = await createTempleComparativeReading(options);
  window.TempleComparativeReading = api;
  document.dispatchEvent(new CustomEvent('temple:comparative-reading-ready', {
    detail: { schema: api.schema, version: api.version, privacy: api.privacy }
  }));
  return api;
}
