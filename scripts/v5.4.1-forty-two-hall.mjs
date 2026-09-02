export const FORTY_TWO_HALL_SCHEMA = 'temple-of-maat/maat-forty-two-hall-v1';
export const FORTY_TWO_HALL_VERSION = '1.0.0';

const REGISTRY_URL = './research/maat-forty-two-hall.v1.json';
let registryPromise;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function loadRegistry() {
  if (!registryPromise) registryPromise = fetch(REGISTRY_URL, { cache: 'no-store' }).then(async (response) => {
    if (!response.ok) throw new Error(`Forty-Two Hall registry request failed: ${response.status}`);
    const data = await response.json();
    if (data.schema !== FORTY_TWO_HALL_SCHEMA || data.version !== FORTY_TWO_HALL_VERSION || data.privacy !== 'public-canonical-only') {
      throw new Error('Unsupported Forty-Two Hall registry contract.');
    }
    if (!Array.isArray(data.slots) || data.slots.length !== 42) throw new Error('Forty-Two Hall registry must contain exactly 42 slots.');
    return data;
  });
  return registryPromise;
}

function installStyle() {
  if (document.querySelector('link[data-temple-forty-two-hall-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './styles/v5.4.1-forty-two-hall.css';
  link.dataset.templeFortyTwoHallStyle = 'true';
  document.head.appendChild(link);
}

function installLayer() {
  let layer = document.getElementById('tm541-forty-two-hall');
  if (layer) return layer;
  layer = el('section', 'tm541-hall');
  layer.id = 'tm541-forty-two-hall';
  layer.hidden = true;
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'tm541-hall-title');
  layer.innerHTML = `
    <div class="tm541-hall__backdrop" data-hall-close></div>
    <div class="tm541-hall__panel" role="document">
      <header class="tm541-hall__header">
        <div>
          <p class="tm541-hall__eyebrow">Ma'at · Spell 125 Research Layer</p>
          <h2 id="tm541-hall-title">The Forty-Two Hall</h2>
        </div>
        <button type="button" class="tm541-hall__close" data-hall-close aria-label="Close Forty-Two Hall">×</button>
      </header>
      <p class="tm541-hall__covenant">Source before synthesis. Missing evidence remains visible. No declaration is assigned to a chamber merely because a numerical slot exists.</p>
      <div class="tm541-hall__status" data-hall-status role="status" aria-live="polite">Loading governed registry…</div>
      <div class="tm541-hall__body" data-hall-body></div>
    </div>`;
  document.body.appendChild(layer);
  layer.addEventListener('click', (event) => {
    if (event.target.closest('[data-hall-close]')) close();
  });
  return layer;
}

function renderSlot(slot) {
  const card = el('button', `tm541-hall__slot ${slot.status === 'PROVISIONAL' ? 'is-provisional' : 'is-unmapped'}`);
  card.type = 'button';
  card.dataset.hallSlot = String(slot.number);
  const n = el('span', 'tm541-hall__number', String(slot.number).padStart(2, '0'));
  const title = el('strong', '', slot.theme ? slot.theme.replaceAll('-', ' ') : 'Awaiting reviewed source alignment');
  const status = el('span', 'tm541-hall__badge', slot.status);
  card.append(n, title, status);
  return card;
}

function detailFor(slot) {
  const detail = el('article', 'tm541-hall__detail');
  detail.dataset.hallDetail = String(slot.number);
  detail.append(el('p', 'tm541-hall__eyebrow', `Declaration Slot ${String(slot.number).padStart(2, '0')}`));
  detail.append(el('h3', '', slot.theme ? slot.theme.replaceAll('-', ' ') : 'UNMAPPED declaration slot'));
  if (slot.normalizedText) detail.append(el('blockquote', '', slot.normalizedText));
  else detail.append(el('p', 'tm541-hall__missing', 'No reviewed declaration record is assigned to this slot. The Hall does not synthesize missing wording.'));
  const dl = el('dl', 'tm541-hall__kv');
  const rows = [
    ['Status', slot.status],
    ['Kernel record', slot.recordId || 'UNMAPPED'],
    ['Content mode', slot.contentMode || 'UNMAPPED'],
    ['Source locator', slot.sourceLocator || 'UNMAPPED'],
    ['Chant segment', slot.chantSegment || 'UNMAPPED'],
    ['72×42 chamber mapping', 'UNMAPPED · OPEN-004']
  ];
  for (const [label, value] of rows) dl.append(el('dt', '', label), el('dd', '', value));
  detail.append(dl);
  detail.append(el('p', 'tm541-hall__note', 'Reflection prompt · What conduct would demonstrate this principle without turning symbolic correspondence into a claim of historical fact?'));
  return detail;
}

async function render() {
  const layer = installLayer();
  const status = layer.querySelector('[data-hall-status]');
  const body = layer.querySelector('[data-hall-body]');
  try {
    const registry = await loadRegistry();
    status.textContent = '42 governed slots · 3 provisional normalized seed records · 39 explicitly unmapped';
    body.replaceChildren();
    const boundaries = el('section', 'tm541-hall__boundaries');
    boundaries.append(el('h3', '', 'Authority boundaries'));
    for (const text of [registry.historicalBoundary, registry.mappingBoundary, registry.chantBoundary]) boundaries.append(el('p', '', text));
    const grid = el('div', 'tm541-hall__grid');
    const detailHost = el('div', 'tm541-hall__detail-host');
    for (const slot of registry.slots) {
      const card = renderSlot(slot);
      card.addEventListener('click', () => detailHost.replaceChildren(detailFor(slot)));
      grid.append(card);
    }
    detailHost.append(detailFor(registry.slots[0]));
    body.append(boundaries, grid, detailHost);
  } catch (error) {
    status.textContent = `Forty-Two Hall unavailable: ${error.message}`;
  }
}

let previousFocus = null;

export async function open(number = 1) {
  const layer = installLayer();
  previousFocus = document.activeElement;
  await render();
  layer.hidden = false;
  document.body.classList.add('temple-forty-two-hall-open');
  const target = layer.querySelector(`[data-hall-slot="${Number(number)}"]`) || layer.querySelector('[data-hall-slot]');
  target?.focus();
  return true;
}

export function close() {
  const layer = document.getElementById('tm541-forty-two-hall');
  if (!layer || layer.hidden) return false;
  layer.hidden = true;
  document.body.classList.remove('temple-forty-two-hall-open');
  previousFocus?.focus?.();
  return true;
}

function installLauncher(api) {
  if (document.querySelector('[data-forty-two-hall-launcher]')) return;
  const tryInstall = () => {
    const footer = document.querySelector('#tm528-library .tm528-footer, #tm528-library footer, [data-temple-library-footer]');
    if (!footer || footer.querySelector('[data-forty-two-hall-launcher]')) return false;
    const button = el('button', 'tm541-hall__launcher', 'Forty-Two Hall');
    button.type = 'button';
    button.dataset.fortyTwoHallLauncher = 'true';
    button.addEventListener('click', () => api.open());
    footer.appendChild(button);
    return true;
  };
  if (tryInstall()) return;
  const observer = new MutationObserver(() => { if (tryInstall()) observer.disconnect(); });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 30000);
}

export async function installTempleFortyTwoHall() {
  if (window.TempleFortyTwoHall?.schema === FORTY_TWO_HALL_SCHEMA) return window.TempleFortyTwoHall;
  installStyle();
  const registry = await loadRegistry();
  const api = Object.freeze({
    schema: FORTY_TWO_HALL_SCHEMA,
    version: FORTY_TWO_HALL_VERSION,
    privacy: 'public-canonical-only',
    slotCount: registry.slots.length,
    mappedCount: registry.slots.filter((slot) => slot.recordId).length,
    unmappedCount: registry.slots.filter((slot) => !slot.recordId).length,
    open,
    close,
    slot(number) { return structuredClone(registry.slots.find((slot) => slot.number === Number(number)) || null); },
    exportRegistry() { return structuredClone(registry); }
  });
  window.TempleFortyTwoHall = api;
  installLauncher(api);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  document.dispatchEvent(new CustomEvent('temple:forty-two-hall-ready', { detail: { schema: api.schema, version: api.version, privacy: api.privacy } }));
  return api;
}
