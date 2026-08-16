import { installTempleLivingMap } from './v5.3.3-living-temple-map.mjs';

export const LIVING_CORRESPONDENCE_ENGINE_SCHEMA = 'temple-of-maat/living-correspondence-engine-v1';
export const LIVING_CORRESPONDENCE_ENGINE_VERSION = '1.0.0';
export const CORRESPONDENCE_BUNDLE_SCHEMA = 'temple-of-maat/correspondence-bundle-v1';

export const CORRESPONDENCE_FIELDS = Object.freeze([
  'deity-archetype',
  'angel',
  'inverse-shadow',
  'jungian-function',
  'ifs-part',
  'element',
  'planet',
  'number',
  'gematria',
  'scripture-parallels',
  'maat-declaration',
  'meditation',
  'ethical-action'
]);

export const CORRESPONDENCE_LAYERS = Object.freeze({
  source: 'Source / Historical',
  scholarship: 'Historical Scholarship',
  later: 'Later Correspondence',
  computational: 'Computational',
  implementation: 'Current Implementation',
  synthesis: 'Temple Synthesis / Practice',
  unresolved: 'Unresolved'
});

export const CORRESPONDENCE_STATUSES = Object.freeze({
  reviewed: 'REVIEWED',
  unassigned: 'UNASSIGNED',
  unmapped: 'UNMAPPED',
  noClaim: 'NO REVIEWED CLAIM'
});

const PAIR_AUTHORITY_URL = new URL('../research/pair-authority.json', import.meta.url);
const PAIR_MIGRATION_URL = new URL('../research/pair-authority-name-migration.v1.json', import.meta.url);
const KERNEL_URL = new URL('../research/knowledge-kernel/seed.v1.json', import.meta.url);

const FIELD_LABELS = Object.freeze({
  'deity-archetype': 'Deity / Archetype',
  angel: 'Angel',
  'inverse-shadow': 'Inverse / Shadow',
  'jungian-function': 'Jungian Function',
  'ifs-part': 'IFS Part',
  element: 'Element',
  planet: 'Planet',
  number: 'Number',
  gematria: 'Gematria',
  'scripture-parallels': 'Scripture Parallels',
  'maat-declaration': 'Ma’at Declaration',
  meditation: 'Meditation',
  'ethical-action': 'Ethical Action'
});

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
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

function endpointKey(endpoint) {
  return `${endpoint.namespace}:${endpoint.recordId}`;
}

function normalizePairNumber(endpoint, record = {}) {
  if (!['chamber', 'codex', 'dossier'].includes(endpoint?.namespace)) return null;
  const number = Number(record.number ?? record.num ?? record.sourceLayer?.num ?? endpoint.recordId);
  return Number.isInteger(number) && number >= 1 && number <= 72 ? number : null;
}

function unresolved(field, status = CORRESPONDENCE_STATUSES.noClaim, note = '') {
  return {
    field,
    label: FIELD_LABELS[field],
    value: null,
    status,
    layer: 'unresolved',
    provenanceClasses: [],
    sourceRefs: [],
    claimIds: [],
    methodRefs: [],
    boundaries: {
      historicalIdentity: false,
      metaphysicalIdentity: false,
      directHistoricalInfluence: 'not-claimed'
    },
    note: note || 'No reviewed canonical assignment is stored for this field. The engine does not infer one.'
  };
}

function assigned(field, value, options = {}) {
  return {
    field,
    label: FIELD_LABELS[field],
    value,
    status: options.status || CORRESPONDENCE_STATUSES.reviewed,
    layer: options.layer || 'implementation',
    provenanceClasses: clone(options.provenanceClasses || []),
    sourceRefs: clone(options.sourceRefs || []),
    claimIds: clone(options.claimIds || []),
    methodRefs: clone(options.methodRefs || []),
    boundaries: clone(options.boundaries || {
      historicalIdentity: false,
      metaphysicalIdentity: false,
      directHistoricalInfluence: 'not-claimed'
    }),
    note: options.note || ''
  };
}

function claimsFor(kernel, kernelRecordId) {
  if (!kernelRecordId) return [];
  return (kernel?.claims || []).filter((claim) => claim.subjectId === kernelRecordId && claim.status === 'reviewed');
}

function kernelRecordIdFor(endpoint) {
  if (endpoint?.namespace !== 'chamber') return null;
  const number = Number(endpoint.recordId);
  if (!Number.isInteger(number)) return null;
  return `chamber.${String(number).padStart(2, '0')}`;
}

function lawClaim(claims) {
  return claims.find((claim) => claim.predicate === 'has-law' && claim.object?.literal) || null;
}

export function buildCorrespondenceLedger({ endpoint, resolvedRecord, pairAuthority, pairMigration, kernel } = {}) {
  if (!endpoint?.namespace || !endpoint?.recordId) throw new TypeError('Correspondence ledger requires a normalized endpoint.');
  const record = resolvedRecord || {};
  const pairNumber = normalizePairNumber(endpoint, record);
  const kernelRecordId = kernelRecordIdFor(endpoint);
  const reviewedClaims = claimsFor(kernel, kernelRecordId);
  const currentLawClaim = lawClaim(reviewedClaims);
  const fields = Object.fromEntries(CORRESPONDENCE_FIELDS.map((field) => [field, unresolved(field)]));

  if (pairNumber) {
    fields.number = assigned('number', pairNumber, {
      layer: 'implementation',
      provenanceClasses: ['current-implementation'],
      sourceRefs: ['source.temple.chambers-v3'],
      note: 'Stable Temple chamber/pair ordinal. A shared number does not establish historical or metaphysical identity.'
    });
  }

  const angel = record.angel || record.nameEn || record.sourceLayer?.nameEn || pairMigration?.angel || null;
  if (angel) {
    fields.angel = assigned('angel', angel, {
      layer: 'implementation',
      provenanceClasses: ['current-implementation', 'source-file-derived'],
      sourceRefs: pairNumber ? ['shem-master-catalogue-v1', 'effective-temple-canon-v1'] : [],
      methodRefs: pairNumber ? ['gematria-twin-crossmatch-v1'] : [],
      note: pairNumber
        ? 'Current Temple angel value preserved from the governed Pair Authority source chain. It is not a claim that the paired daemon is the angel’s ancient twin.'
        : 'Resolved from the public canonical record.'
    });
  }

  const daemon = record.daemon || pairMigration?.daemon || null;
  if (daemon && pairNumber) {
    fields['inverse-shadow'] = assigned('inverse-shadow', daemon, {
      layer: 'computational',
      provenanceClasses: ['current-implementation', 'computational-correspondence'],
      sourceRefs: ['shem-master-catalogue-v1', 'effective-temple-canon-v1'],
      methodRefs: ['gematria-twin-crossmatch-v1'],
      note: 'Displayed as the current Temple counterpart / shadow pole. This is a modern computational correspondence, not historical Goetia twinship, ontological evil, metaphysical identity, or spiritual rank.'
    });
  }

  if (currentLawClaim?.object?.literal) {
    fields['ethical-action'] = assigned('ethical-action', currentLawClaim.object.literal, {
      layer: 'synthesis',
      provenanceClasses: currentLawClaim.provenanceClasses || ['current-implementation', 'temple-synthesis'],
      sourceRefs: currentLawClaim.evidence?.sourceRefs || ['source.temple.chambers-v3'],
      claimIds: [currentLawClaim.claimId],
      methodRefs: currentLawClaim.methodRef ? [currentLawClaim.methodRef] : [],
      boundaries: currentLawClaim.boundaries,
      note: 'The reviewed current chamber law is surfaced as a Temple practice prompt. It is not presented as an ancient instruction.'
    });
  } else if (record.law) {
    fields['ethical-action'] = assigned('ethical-action', record.law, {
      layer: 'synthesis',
      provenanceClasses: ['current-implementation', 'temple-synthesis'],
      sourceRefs: ['source.temple.chambers-v3'],
      note: 'Current implementation law surfaced as Temple practice. No separate Knowledge Kernel claim is yet attached to this chamber.'
    });
  }

  fields['maat-declaration'] = unresolved(
    'maat-declaration',
    CORRESPONDENCE_STATUSES.unmapped,
    'UNMAPPED by design. OPEN-004 requires a reproducible 72×42 mapping before any chamber-to-Ma’at declaration assignment is implemented.'
  );
  fields['jungian-function'] = unresolved('jungian-function', CORRESPONDENCE_STATUSES.unassigned, 'No reviewed Jungian-function assignment is stored for this canonical record.');
  fields['ifs-part'] = unresolved('ifs-part', CORRESPONDENCE_STATUSES.unassigned, 'No reviewed IFS-part assignment is stored for this canonical record.');
  fields['deity-archetype'] = unresolved('deity-archetype', CORRESPONDENCE_STATUSES.unassigned, 'No reviewed deity/archetype assignment is stored for this canonical record.');
  fields.element = unresolved('element', CORRESPONDENCE_STATUSES.unassigned, 'No reviewed elemental assignment is stored for this canonical record.');
  fields.planet = unresolved('planet', CORRESPONDENCE_STATUSES.unassigned, 'No reviewed planetary assignment is stored for this canonical record.');
  fields.gematria = unresolved('gematria', CORRESPONDENCE_STATUSES.noClaim, 'Pair Authority may record computational methods, but this engine does not copy a numerical total unless a reviewed field-level calculation is explicitly mapped to this record and method version.');
  fields['scripture-parallels'] = unresolved('scripture-parallels', CORRESPONDENCE_STATUSES.noClaim, 'Source-dependency graph edges are not scripture parallels. No parallel is inferred from theme, proximity, or number.');
  fields.meditation = unresolved('meditation', CORRESPONDENCE_STATUSES.unassigned, 'No reviewed meditation assignment is stored. Practice content must be authored and reviewed separately from historical evidence.');

  const migration = pairMigration ? {
    recordId: pairMigration.recordId,
    deployedThirdName: pairMigration.legacyThirdName,
    preferredFutureThirdName: pairMigration.preferredRefinedThirdName,
    migrationStatus: pairMigration.migrationStatus,
    implementationMigrated: pairAuthority?.summary?.currentImplementationUsesRefinedNames === true
  } : null;

  return {
    schema: LIVING_CORRESPONDENCE_ENGINE_SCHEMA,
    version: LIVING_CORRESPONDENCE_ENGINE_VERSION,
    privacy: 'public-canonical-only',
    endpoint: clone(endpoint),
    record: clone(record),
    kernelRecordId,
    pairNumber,
    pairMigration: migration,
    reviewedClaims: clone(reviewedClaims),
    fields: CORRESPONDENCE_FIELDS.map((field) => fields[field]),
    boundaries: {
      visualPatternIsEvidence: false,
      sharedNumberIsIdentity: false,
      historicalIdentityInferred: false,
      metaphysicalIdentityInferred: false,
      privateStateIsEvidence: false,
      open004MaatMappingComplete: false
    }
  };
}

function installStyles() {
  if (document.querySelector('link[data-temple-correspondence-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './styles/v5.3.4-living-correspondence-engine.css';
  link.dataset.templeCorrespondenceStyle = 'true';
  document.head.appendChild(link);
}

async function fetchJson(fetchImpl, url, label) {
  const response = await fetchImpl(url, { cache: 'force-cache' });
  if (!response?.ok) throw new Error(`Unable to load ${label} (${response?.status ?? 'unknown status'}).`);
  return response.json();
}

function fieldBadge(text, kind = '') {
  return el('span', `tm534-badge${kind ? ` tm534-${kind}` : ''}`, text);
}

function renderField(field) {
  const card = el('article', `tm534-field-card tm534-layer-${field.layer}`);
  const head = el('div', 'tm534-field-head');
  head.append(el('h4', '', field.label), fieldBadge(field.status, field.status === CORRESPONDENCE_STATUSES.reviewed ? 'reviewed' : 'unresolved'));
  card.append(head);
  card.append(el('div', 'tm534-value', field.value === null ? '—' : String(field.value)));
  const badges = el('div', 'tm534-badges');
  badges.append(fieldBadge(CORRESPONDENCE_LAYERS[field.layer] || field.layer));
  (field.provenanceClasses || []).forEach((item) => badges.append(fieldBadge(item)));
  card.append(badges);
  if (field.note) card.append(el('p', 'tm534-note', field.note));
  if (field.sourceRefs?.length) card.append(el('p', 'tm534-meta', `Sources · ${field.sourceRefs.join(' · ')}`));
  if (field.methodRefs?.length) card.append(el('p', 'tm534-meta', `Methods · ${field.methodRefs.join(' · ')}`));
  if (field.claimIds?.length) card.append(el('p', 'tm534-meta', `Claims · ${field.claimIds.join(' · ')}`));
  return card;
}

export async function createTempleLivingCorrespondenceEngine(options = {}) {
  const windowRef = options.windowRef || globalThis.window;
  if (!windowRef?.document) throw new TypeError('Living Correspondence Engine requires a browser document.');
  const map = options.map || await installTempleLivingMap(options.mapOptions || {});
  const adapter = map.adapter;
  const rawFetch = options.fetchImpl || windowRef.fetch || globalThis.fetch;
  if (typeof rawFetch !== 'function') throw new TypeError('Living Correspondence Engine requires fetch.');
  const fetchImpl = rawFetch.bind ? rawFetch.bind(windowRef) : rawFetch;
  installStyles();

  const [pairAuthority, pairMigration, kernel] = await Promise.all([
    fetchJson(fetchImpl, options.pairAuthorityUrl || PAIR_AUTHORITY_URL, 'Pair Authority'),
    fetchJson(fetchImpl, options.pairMigrationUrl || PAIR_MIGRATION_URL, 'Pair Authority migration'),
    fetchJson(fetchImpl, options.kernelUrl || KERNEL_URL, 'Knowledge Kernel')
  ]);
  if (pairAuthority?.privacy !== 'public-canonical-only' || pairMigration?.privacy !== 'public-canonical-only' || kernel?.privacy !== 'public-canonical-only') {
    throw new Error('Living Correspondence Engine accepts public-canonical-only canonical inputs.');
  }

  const migrationByNumber = new Map((pairMigration.records || []).map((record) => [Number(record.pairNumber), clone(record)]));
  const chamberEndpoints = Array.from({ length: 72 }, (_, index) => ({ namespace: 'chamber', recordId: String(index + 1).padStart(2, '0') }));
  const mapEndpoints = map.endpoints();
  const endpointMap = new Map([...chamberEndpoints, ...mapEndpoints].map((endpoint) => [endpointKey(endpoint), endpoint]));
  const endpoints = [...endpointMap.values()].sort((a, b) => endpointKey(a).localeCompare(endpointKey(b), undefined, { numeric: true }));

  let layer = null;
  let body = null;
  let returnFocus = null;
  let currentEndpoint = chamberEndpoints[0];
  let currentLedger = null;
  let filter = { layer: 'all', status: 'all' };

  function createLayer() {
    if (layer) return;
    layer = el('div', 'tm534-layer');
    layer.id = 'tm534-living-correspondence';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('aria-labelledby', 'tm534-title');
    const scrim = button('', close, 'tm534-scrim');
    scrim.setAttribute('aria-label', 'Close Living Correspondence Engine');
    const panel = el('section', 'tm534-panel');
    const header = el('header', 'tm534-header');
    const titles = el('div');
    titles.append(el('p', 'tm534-eyebrow', 'Governed Correspondence · Absence Is Data'));
    const title = el('h2', '', 'Living Correspondence Engine');
    title.id = 'tm534-title';
    titles.append(title);
    const closeButton = button('×', close, 'tm534-close');
    closeButton.setAttribute('aria-label', 'Close Living Correspondence Engine');
    header.append(titles, closeButton);
    body = el('div', 'tm534-body');
    panel.append(header, body);
    layer.append(scrim, panel);
    document.body.append(layer);
  }

  function titleForLedger(ledger) {
    const record = ledger?.record || {};
    return record.title || record.thirdName || record.angel || record.sourceLayer?.nameEn || endpointKey(ledger.endpoint);
  }

  function filteredFields(ledger) {
    return (ledger?.fields || []).filter((field) => {
      if (filter.layer !== 'all' && field.layer !== filter.layer) return false;
      if (filter.status !== 'all' && field.status !== filter.status) return false;
      return true;
    });
  }

  function makeSelect(label, optionsList, value, onChange) {
    const wrap = el('label', 'tm534-control');
    wrap.append(el('span', '', label));
    const select = el('select');
    optionsList.forEach(([optionValue, text]) => {
      const option = el('option', '', text);
      option.value = optionValue;
      select.append(option);
    });
    select.value = value;
    select.addEventListener('change', () => onChange(select.value));
    wrap.append(select);
    return wrap;
  }

  function render() {
    if (!body || !currentLedger) return;
    body.replaceChildren();
    body.append(el('p', 'tm534-covenant', 'Source → Historical Scholarship → Later Correspondence → Computation → Temple Synthesis. A field is populated only when a reviewed canonical input supports it. Similarity, visual proximity, shared numbers, personal resonance, or graph connectivity do not create evidence.'));

    const controls = el('section', 'tm534-controls');
    controls.append(makeSelect('Canonical record', endpoints.map((endpoint) => [endpointKey(endpoint), endpointKey(endpoint)]), endpointKey(currentEndpoint), async (value) => {
      await select(value);
    }));
    controls.append(makeSelect('Evidence layer', [['all', 'All layers'], ...Object.entries(CORRESPONDENCE_LAYERS)], filter.layer, (value) => {
      filter = { ...filter, layer: value };
      render();
    }));
    controls.append(makeSelect('Assignment status', [
      ['all', 'All statuses'],
      [CORRESPONDENCE_STATUSES.reviewed, CORRESPONDENCE_STATUSES.reviewed],
      [CORRESPONDENCE_STATUSES.unassigned, CORRESPONDENCE_STATUSES.unassigned],
      [CORRESPONDENCE_STATUSES.unmapped, CORRESPONDENCE_STATUSES.unmapped],
      [CORRESPONDENCE_STATUSES.noClaim, CORRESPONDENCE_STATUSES.noClaim]
    ], filter.status, (value) => {
      filter = { ...filter, status: value };
      render();
    }));
    body.append(controls);

    const recordHead = el('section', 'tm534-record-head');
    recordHead.append(el('p', 'tm534-eyebrow', endpointKey(currentLedger.endpoint)), el('h3', '', titleForLedger(currentLedger)));
    const summaryBadges = el('div', 'tm534-badges');
    summaryBadges.append(fieldBadge(`${currentLedger.fields.filter((field) => field.status === CORRESPONDENCE_STATUSES.reviewed).length} reviewed fields`));
    summaryBadges.append(fieldBadge(`${currentLedger.fields.filter((field) => field.status !== CORRESPONDENCE_STATUSES.reviewed).length} unresolved fields`));
    summaryBadges.append(fieldBadge('Public canonical only'));
    recordHead.append(summaryBadges);
    if (currentLedger.pairMigration) {
      recordHead.append(el('p', 'tm534-migration', `Pair Authority · ${currentLedger.pairMigration.deployedThirdName} → ${currentLedger.pairMigration.preferredFutureThirdName} · ${currentLedger.pairMigration.migrationStatus} · implementation migrated: ${currentLedger.pairMigration.implementationMigrated}`));
    }
    body.append(recordHead);

    const grid = el('section', 'tm534-grid');
    const visible = filteredFields(currentLedger);
    if (!visible.length) grid.append(el('p', 'tm534-empty', 'No correspondence fields match the current filters. No assignment is inferred.'));
    else visible.forEach((field) => grid.append(renderField(field)));
    body.append(grid);

    const guard = el('section', 'tm534-guard');
    guard.append(el('h3', '', 'Discernment boundary'));
    guard.append(el('p', '', 'The forty-two Ma’at declarations remain intentionally unmapped to the seventy-two chambers until OPEN-004 has a reproducible reviewed method. Jungian, IFS, deity, elemental, planetary, gematria, scripture-parallel, and meditation fields likewise remain explicit absences unless reviewed evidence is added.'));
    guard.append(el('p', '', 'Private Journey reflections, Library notes, Research Notebook entries, and Nabu–Thoth Scribe threads are not read, displayed, exported, or promoted into canonical evidence.'));
    body.append(guard);
  }

  async function select(endpointValue) {
    const endpoint = adapter.resolver.normalizeEndpoint(endpointValue);
    const resolved = await adapter.resolve(endpoint);
    const pairNumber = normalizePairNumber(endpoint, resolved.record || {});
    currentEndpoint = endpoint;
    currentLedger = buildCorrespondenceLedger({
      endpoint,
      resolvedRecord: resolved.record || {},
      pairAuthority,
      pairMigration: pairNumber ? migrationByNumber.get(pairNumber) : null,
      kernel
    });
    if (layer && !layer.hidden) render();
    return clone(currentLedger);
  }

  function installLaunchers() {
    const tryInstall = () => {
      const footer = document.querySelector('#tm528-library .tm528-footer');
      if (!footer || footer.querySelector('[data-temple-correspondence-launcher]')) return false;
      const launch = button('Correspondence Engine', () => open(), 'tm534-library-launch');
      launch.dataset.templeCorrespondenceLauncher = 'library';
      launch.setAttribute('aria-label', 'Open Living Correspondence Engine');
      footer.append(launch);
      return true;
    };
    if (tryInstall()) return;
    const observer = new MutationObserver(() => { if (tryInstall()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function open(endpointValue = endpointKey(currentEndpoint)) {
    if (!document.body.classList.contains('temple-app-ready')) return false;
    createLayer();
    returnFocus = document.activeElement;
    await select(endpointValue);
    render();
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('temple-correspondence-open');
    requestAnimationFrame(() => layer.querySelector('.tm534-close')?.focus({ preventScroll: true }));
    return true;
  }

  function close() {
    if (!layer || layer.hidden) return false;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('temple-correspondence-open');
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
    return true;
  }

  function exportCurrent() {
    if (!currentLedger) return null;
    return {
      schema: CORRESPONDENCE_BUNDLE_SCHEMA,
      version: '1.0.0',
      privacy: 'public-canonical-only',
      exportedAt: new Date().toISOString(),
      ledger: clone(currentLedger)
    };
  }

  document.addEventListener('keydown', (event) => {
    if (!layer || layer.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  createLayer();
  installLaunchers();
  await select(currentEndpoint);

  return Object.freeze({
    schema: LIVING_CORRESPONDENCE_ENGINE_SCHEMA,
    version: LIVING_CORRESPONDENCE_ENGINE_VERSION,
    privacy: 'public-canonical-only',
    map,
    adapter,
    fields: () => [...CORRESPONDENCE_FIELDS],
    layers: () => clone(CORRESPONDENCE_LAYERS),
    statuses: () => clone(CORRESPONDENCE_STATUSES),
    endpoints: () => clone(endpoints),
    current: () => clone(currentLedger),
    select,
    open,
    close,
    exportCurrent,
    pairAuthority: () => clone(pairAuthority),
    kernelStats: () => ({ records: kernel.records?.length || 0, claims: kernel.claims?.length || 0 })
  });
}

export async function installTempleLivingCorrespondenceEngine(options = {}) {
  if (window.TempleLivingCorrespondenceEngine?.schema === LIVING_CORRESPONDENCE_ENGINE_SCHEMA) return window.TempleLivingCorrespondenceEngine;
  const api = await createTempleLivingCorrespondenceEngine(options);
  window.TempleLivingCorrespondenceEngine = api;
  document.dispatchEvent(new CustomEvent('temple:living-correspondence-engine-ready', {
    detail: { schema: api.schema, version: api.version, privacy: api.privacy }
  }));
  return api;
}
