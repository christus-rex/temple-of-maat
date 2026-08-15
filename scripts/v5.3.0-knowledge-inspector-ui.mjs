import { installTempleKnowledgeInspector } from './v5.3.0-knowledge-inspector.mjs';

export const KNOWLEDGE_INSPECTOR_UI_SCHEMA = 'temple-of-maat/knowledge-inspector-ui-v1';
export const KNOWLEDGE_INSPECTOR_UI_VERSION = '1.0.0';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function valueText(value) {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function badge(text, warning = false) {
  return el('span', `tm530-kernel-badge${warning ? ' tm530-kernel-badge--warning' : ''}`, text);
}

function kv(entries) {
  const list = el('dl', 'tm530-kernel-kv');
  entries.filter(([, value]) => value !== undefined && value !== null && value !== '').forEach(([label, value]) => {
    list.append(el('dt', '', label), el('dd', '', valueText(value)));
  });
  return list;
}

function installStyles() {
  if (document.querySelector('link[data-temple-knowledge-inspector-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './styles/v5.3.0-knowledge-inspector.css';
  link.dataset.templeKnowledgeInspectorStyle = 'true';
  document.head.appendChild(link);
}

function renderClaim(claim) {
  const card = el('article', 'tm530-kernel-claim');
  card.append(el('strong', '', claim.claimId));
  const badges = el('div', 'tm530-kernel-badges');
  badges.append(badge(claim.claimType), badge(claim.confidence), badge(claim.status));
  (claim.provenanceClasses || []).forEach((item) => badges.append(badge(item)));
  card.append(badges);
  card.append(kv([
    ['Subject', claim.subjectId],
    ['Predicate', claim.predicate],
    ['Object', claim.object?.recordId || claim.object?.literal],
    ['Method', claim.methodRef || 'none'],
    ['Historical identity', claim.boundaries?.historicalIdentity],
    ['Metaphysical identity', claim.boundaries?.metaphysicalIdentity],
    ['Historical influence', claim.boundaries?.directHistoricalInfluence]
  ]));
  if (claim.evidence?.rationale) card.append(el('p', '', `Rationale — ${claim.evidence.rationale}`));
  if (claim.evidence?.sourceLocator) card.append(el('p', '', `Locator — ${claim.evidence.sourceLocator}`));
  if (claim.evidence?.limitations?.length) {
    const list = el('ul', 'tm530-kernel-limitations');
    claim.evidence.limitations.forEach((item) => list.append(el('li', '', item)));
    card.append(list);
  }
  return card;
}

function renderPassage(passage, preferred = false) {
  const card = el('article', 'tm530-kernel-passage');
  card.append(el('h5', '', passage.displayName || passage.recordId));
  const badges = el('div', 'tm530-kernel-badges');
  badges.append(badge(passage.content?.mode || 'content-mode-unknown', passage.content?.mode !== 'exact-source'));
  (passage.provenanceClasses || []).forEach((item) => badges.append(badge(item)));
  if (preferred) badges.append(badge('preferred inspected passage'));
  card.append(badges);
  if (passage.sourceLocator) card.append(el('div', 'tm530-kernel-endpoint', passage.sourceLocator));
  if (passage.content?.text) {
    const quote = el('blockquote', '', passage.content.text);
    card.append(quote);
  }
  if (passage.content?.rightsNote) card.append(el('p', 'tm530-kernel-note', `Rights — ${passage.content.rightsNote}`));
  if (passage.content?.limitations?.length) {
    const list = el('ul', 'tm530-kernel-limitations');
    passage.content.limitations.forEach((item) => list.append(el('li', '', item)));
    card.append(list);
  }
  return card;
}

function renderInspection(result, side) {
  const card = el('article', 'tm530-kernel-card');
  card.dataset.kernelSide = side;
  card.append(el('p', 'tm530-compare-eyebrow', side === 'left' ? 'Record A · Kernel Inspection' : 'Record B · Kernel Inspection'));
  card.append(el('h4', '', result.endpoint));
  card.append(el('div', 'tm530-kernel-endpoint', result.mapped ? 'REVIEWED ENDPOINT MAP' : 'UNMAPPED ENDPOINT'));

  if (!result.mapped) {
    card.append(el('div', 'tm530-kernel-unmapped', result.note));
    return card;
  }

  card.append(el('div', 'tm530-kernel-mapping', result.note));

  const recordInspection = result.recordInspection;
  if (recordInspection?.record) {
    const record = recordInspection.record;
    const section = el('section', 'tm530-kernel-section');
    section.append(el('h5', '', 'Kernel Record'));
    const badges = el('div', 'tm530-kernel-badges');
    badges.append(badge(record.entityType), badge(record.reviewStatus || 'review-status-unknown'));
    (record.provenanceClasses || []).forEach((item) => badges.append(badge(item)));
    section.append(badges, kv([
      ['Record ID', record.recordId],
      ['Display name', record.displayName],
      ['Historical status', record.historicalStatus],
      ['Implementation status', record.implementationStatus],
      ['Source locator', record.sourceLocator]
    ]));
    card.append(section);
  }

  const claims = recordInspection?.claims || result.sourceInspection?.claims || [];
  if (claims.length) {
    const section = el('section', 'tm530-kernel-section');
    section.append(el('h5', '', `Claim Inspection · ${claims.length}`));
    claims.forEach((claim) => section.append(renderClaim(claim)));
    card.append(section);
  } else {
    const section = el('section', 'tm530-kernel-section');
    section.append(el('h5', '', 'Claim Inspection'), el('p', '', 'No Knowledge Kernel claim is attached to this reviewed mapping. The inspector does not generate one.'));
    card.append(section);
  }

  const sourceInspection = result.sourceInspection;
  if (sourceInspection?.source) {
    const source = sourceInspection.source;
    const section = el('section', 'tm530-kernel-section');
    section.append(el('h5', '', 'Source Registry'));
    section.append(kv([
      ['Source ID', source.id],
      ['Title', source.title],
      ['Authority type', source.authorityType],
      ['Storage', source.storage],
      ['Locator', source.locator],
      ['Provenance', source.provenanceClasses]
    ]));
    if (source.notes) section.append(el('p', 'tm530-kernel-note', source.notes));
    card.append(section);
  }

  const passages = [];
  if (result.preferredPassage) passages.push(result.preferredPassage);
  for (const passage of recordInspection?.passages || sourceInspection?.passages || []) {
    if (!passages.some((item) => item.recordId === passage.recordId)) passages.push(passage);
  }
  if (passages.length) {
    const section = el('section', 'tm530-kernel-section');
    section.append(el('h5', '', `Source Passage Inspection · ${passages.length}`));
    passages.forEach((passage) => section.append(renderPassage(passage, result.preferredPassage?.recordId === passage.recordId)));
    card.append(section);
  }

  const methods = recordInspection?.methods || sourceInspection?.methods || [];
  if (methods.length) {
    const section = el('section', 'tm530-kernel-section');
    section.append(el('h5', '', 'Method Registry'));
    methods.forEach((method) => section.append(kv([
      ['Method ID', method.id],
      ['Title', method.title],
      ['Version', method.version],
      ['Status', method.status]
    ])));
    card.append(section);
  }

  return card;
}

export async function installTempleKnowledgeInspectorUI(options = {}) {
  if (window.TempleKnowledgeInspectorUI?.schema === KNOWLEDGE_INSPECTOR_UI_SCHEMA) return window.TempleKnowledgeInspectorUI;
  installStyles();
  const inspector = options.inspector || await installTempleKnowledgeInspector(options.inspectorOptions || {});
  let queued = false;
  let observer = null;

  function render() {
    const body = document.querySelector('#tm530-comparative .tm530-compare-body');
    const left = document.getElementById('tm530-left')?.value;
    const right = document.getElementById('tm530-right')?.value;
    if (!body || !left || !right) return false;

    body.querySelector('[data-temple-kernel-inspector]')?.remove();
    const section = el('section', 'tm530-kernel-inspector');
    section.dataset.templeKernelInspector = 'true';
    const head = el('header', 'tm530-kernel-head');
    const text = el('div');
    text.append(el('p', 'tm530-compare-eyebrow', 'Knowledge Kernel · Claim & Source Inspector'), el('h3', '', 'Evidence beneath the relationship'));
    head.append(text, el('p', 'tm530-kernel-covenant', 'Canonical graph connectivity and Knowledge Kernel claims remain separate layers. This inspector reveals reviewed mappings, source passages, claim boundaries, methods, and limitations. Unmapped endpoints remain explicitly unmapped.'));
    section.append(head);

    const grid = el('div', 'tm530-kernel-grid');
    grid.append(renderInspection(inspector.inspectEndpoint(left), 'left'), renderInspection(inspector.inspectEndpoint(right), 'right'));
    section.append(grid);

    const relations = body.querySelector('.tm530-relations');
    body.insertBefore(section, relations || null);
    return true;
  }

  function queueRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      render();
    });
  }

  document.addEventListener('change', (event) => {
    if (event.target?.matches?.('#tm530-left, #tm530-right')) queueRender();
  });
  document.addEventListener('click', (event) => {
    if (event.target?.matches?.('.tm530-compare-action')) setTimeout(queueRender, 0);
  });
  observer = new MutationObserver(queueRender);
  observer.observe(document.body, { childList: true, subtree: true });
  queueRender();

  const api = Object.freeze({
    schema: KNOWLEDGE_INSPECTOR_UI_SCHEMA,
    version: KNOWLEDGE_INSPECTOR_UI_VERSION,
    privacy: 'public-canonical-only',
    inspector,
    render: queueRender,
    disconnect() { observer?.disconnect(); observer = null; }
  });
  window.TempleKnowledgeInspectorUI = api;
  document.dispatchEvent(new CustomEvent('temple:knowledge-inspector-ui-ready', {
    detail: { schema: api.schema, version: api.version, privacy: api.privacy }
  }));
  return api;
}
