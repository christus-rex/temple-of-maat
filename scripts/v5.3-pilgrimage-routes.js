/* Temple of Ma'at v5.3 — source-aware pilgrimage routes */
(function () {
  'use strict';

  const ROUTE_URL = './pilgrimages/enoch.v1.json';
  const STATE_KEY = 'temple_pilgrimage_enoch_v1';
  const STATE_SCHEMA = 'temple-of-maat/pilgrimage-state-v1';
  const MAX_TEXT = 12000;
  let route = null;
  let routePromise = null;
  let layer = null;
  let layerBody = null;
  let currentFocus = null;
  let hiddenParent = null;
  let observer = null;
  let state = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function now() {
    return new Date().toISOString();
  }

  function installStyles() {
    if (document.querySelector('link[data-temple-pilgrimage-routes]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './styles/v5.3-pilgrimage-routes.css';
    link.dataset.templePilgrimageRoutes = 'true';
    document.head.appendChild(link);
  }

  async function loadRoute() {
    if (route) return route;
    if (!routePromise) {
      routePromise = fetch(ROUTE_URL, { cache: 'force-cache' })
        .then((response) => {
          if (!response.ok) throw new Error(`Enoch pilgrimage route ${response.status}`);
          return response.json();
        })
        .then((payload) => {
          if (payload?.schema !== 'temple-of-maat/pilgrimage-route-v1' || payload?.routeId !== 'route.enoch-angelic-mirror') {
            throw new Error('Unsupported Enoch pilgrimage route payload.');
          }
          if (!Array.isArray(payload.gates) || payload.gates.length !== 8) throw new Error('Enoch pilgrimage route must contain eight gates.');
          route = payload;
          state = loadState();
          return route;
        });
    }
    return routePromise;
  }

  function emptyState() {
    return {
      schema: STATE_SCHEMA,
      routeId: route?.routeId || 'route.enoch-angelic-mirror',
      routeVersion: route?.version || '1.0.0',
      started: false,
      startedAt: null,
      updatedAt: null,
      currentGate: 1,
      completedGates: [],
      records: {}
    };
  }

  function gateNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) && route && number >= 1 && number <= route.gates.length ? number : null;
  }

  function cleanRecord(value) {
    const input = value && typeof value === 'object' ? value : {};
    return {
      observation: typeof input.observation === 'string' ? input.observation.slice(0, MAX_TEXT) : '',
      interpretation: typeof input.interpretation === 'string' ? input.interpretation.slice(0, MAX_TEXT) : '',
      verification: typeof input.verification === 'string' ? input.verification.slice(0, MAX_TEXT) : '',
      conduct: typeof input.conduct === 'string' ? input.conduct.slice(0, MAX_TEXT) : ''
    };
  }

  function loadState() {
    const fresh = emptyState();
    try {
      const raw = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return fresh;
      if (raw.schema !== STATE_SCHEMA || raw.routeId !== route.routeId || raw.routeVersion !== route.version) return fresh;
      const completed = [...new Set((Array.isArray(raw.completedGates) ? raw.completedGates : []).map(gateNumber).filter(Boolean))].sort((a, b) => a - b);
      const records = {};
      if (raw.records && typeof raw.records === 'object') {
        Object.entries(raw.records).forEach(([key, value]) => {
          const number = gateNumber(key);
          if (number) records[number] = cleanRecord(value);
        });
      }
      return {
        ...fresh,
        started: Boolean(raw.started),
        startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : null,
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
        currentGate: gateNumber(raw.currentGate) || 1,
        completedGates: completed,
        records
      };
    } catch {
      return fresh;
    }
  }

  function persist(render = true) {
    if (!state) state = emptyState();
    state.routeVersion = route.version;
    state.updatedAt = now();
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
    document.dispatchEvent(new CustomEvent('temple:pilgrimage-route-change', {
      detail: { routeId: route.routeId, state: publicState() }
    }));
    enhanceJourneyLauncher();
    if (render && layer && !layer.hidden) renderRoute();
  }

  function publicState() {
    return clone(state || emptyState());
  }

  function startIfNeeded() {
    if (state.started) return;
    state.started = true;
    state.startedAt = state.startedAt || now();
    persist(false);
  }

  function sourceById(id) {
    return route.sourceRefs.find((item) => item.id === id) || null;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(label, handler, className = '') {
    const node = el('button', className, label);
    node.type = 'button';
    node.addEventListener('click', handler);
    return node;
  }

  function createLayer() {
    if (layer) return;
    layer = el('div', 'tm53-route-layer');
    layer.id = 'tm53-enoch-route';
    layer.dataset.templePilgrimageRoute = 'enoch';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('aria-labelledby', 'tm53-enoch-route-title');

    const scrim = button('', closeRoute, 'tm53-route-scrim');
    scrim.setAttribute('aria-label', 'Close Enoch pilgrimage');
    const panel = el('section', 'tm53-route-panel');
    const header = el('header', 'tm53-route-header');
    const titles = el('div');
    titles.append(el('p', 'tm53-route-eyebrow', 'Temple Pilgrimage Route · PERSONAL / SOURCE-AWARE'));
    const title = el('h2', 'tm53-route-title', 'Enoch — The Angelic Mirror');
    title.id = 'tm53-enoch-route-title';
    titles.append(title);
    const close = button('×', closeRoute, 'tm53-route-close');
    close.setAttribute('aria-label', 'Close Enoch pilgrimage');
    header.append(titles, close);
    layerBody = el('div', 'tm53-route-body');
    panel.append(header, layerBody);
    layer.append(scrim, panel);
    document.body.appendChild(layer);
  }

  function focusables() {
    if (!layer || layer.hidden) return [];
    return [...layer.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((node) => !node.hidden && node.getClientRects().length);
  }

  function openRoute() {
    if (!document.body.classList.contains('temple-app-ready')) return false;
    loadRoute().then(() => {
      createLayer();
      startIfNeeded();
      currentFocus = document.activeElement;
      const journey = document.getElementById('tm525-journey');
      if (journey && !journey.hidden) {
        hiddenParent = journey;
        journey.hidden = true;
        journey.setAttribute('aria-hidden', 'true');
      }
      renderRoute();
      layer.hidden = false;
      layer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('tm53-pilgrimage-open');
      requestAnimationFrame(() => layer.querySelector('.tm53-route-close')?.focus({ preventScroll: true }));
    }).catch((error) => console.error('[Temple pilgrimage]', error));
    return true;
  }

  function closeRoute() {
    if (!layer || layer.hidden) return;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tm53-pilgrimage-open');
    if (hiddenParent && document.contains(hiddenParent)) {
      hiddenParent.hidden = false;
      hiddenParent.setAttribute('aria-hidden', 'false');
    }
    hiddenParent = null;
    if (currentFocus && document.contains(currentFocus)) currentFocus.focus({ preventScroll: true });
    currentFocus = null;
  }

  function renderAuthority(level) {
    const name = String(level).toLowerCase();
    return el('span', `tm53-route-authority tm53-route-authority--${name}`, level);
  }

  function renderIntro() {
    const wrap = el('div', 'tm53-route-intro');
    const main = el('section', 'tm53-route-intro__card');
    main.append(
      el('p', 'tm53-route-card__eyebrow', route.subtitle),
      el('p', '', route.structureNote)
    );
    const vow = el('div', 'tm53-route-vow', route.vow);
    vow.setAttribute('aria-label', `Route vow: ${route.vow}`);
    main.append(vow);

    const side = el('section', 'tm53-route-intro__card');
    const completed = state.completedGates.length;
    side.append(el('p', 'tm53-route-card__eyebrow', 'Private route progress'));
    const progress = el('div', 'tm53-route-progress');
    const fill = el('span');
    fill.style.width = `${(completed / route.gates.length) * 100}%`;
    progress.append(fill);
    side.append(progress, el('div', 'tm53-route-progress-label', `${completed} / ${route.gates.length} gates integrated`));
    side.append(el('p', 'tm53-route-private', 'Your Enochian Reality Record remains on this device unless you explicitly export it. Personal testimony is not written into the public Knowledge Kernel or Relationship Graph.'));
    wrap.append(main, side);
    return wrap;
  }

  function renderGateMap() {
    const map = el('nav', 'tm53-route-gates');
    map.setAttribute('aria-label', 'Enoch pilgrimage gates');
    route.gates.forEach((gate) => {
      const number = gate.ordinal;
      const classes = ['tm53-route-gate-button'];
      if (number === state.currentGate) classes.push('is-current');
      if (state.completedGates.includes(number)) classes.push('is-complete');
      const node = button(String(number).padStart(2, '0'), () => {
        saveCurrentRecord(false);
        state.currentGate = number;
        persist();
      }, classes.join(' '));
      node.title = `${gate.title}${state.completedGates.includes(number) ? ' · Integrated' : ''}`;
      node.setAttribute('aria-label', `Gate ${number}: ${gate.title}${state.completedGates.includes(number) ? ', integrated' : ''}`);
      map.append(node);
    });
    return map;
  }

  function section(title, text) {
    const node = el('section', 'tm53-route-section');
    node.append(el('h4', '', title), el('p', '', text));
    return node;
  }

  function renderSourceDetails(gate) {
    const details = el('details', 'tm53-route-source');
    details.append(el('summary', '', 'Source & authority boundary'));
    details.append(el('p', '', gate.sourceAnchor));
    gate.sourceRefs.forEach((id) => {
      const source = sourceById(id);
      if (!source) return;
      const line = el('p');
      const strong = el('strong', '', `${source.authority} · ${source.title}`);
      line.append(strong, document.createTextNode(` — ${source.locators.join('; ')}`));
      details.append(line);
    });
    return details;
  }

  function field(key, prompt, value) {
    const wrap = el('div', 'tm53-route-field');
    const label = el('label', '', key[0].toUpperCase() + key.slice(1));
    const id = `tm53-enoch-${state.currentGate}-${key}`;
    label.htmlFor = id;
    const small = el('small', '', prompt);
    const area = el('textarea');
    area.id = id;
    area.dataset.realityField = key;
    area.maxLength = MAX_TEXT;
    area.rows = 4;
    area.value = value || '';
    wrap.append(label, small, area);
    return wrap;
  }

  function readFormRecord() {
    const result = cleanRecord(state.records[state.currentGate]);
    if (!layerBody) return result;
    layerBody.querySelectorAll('[data-reality-field]').forEach((area) => {
      const key = area.dataset.realityField;
      if (key in result) result[key] = String(area.value || '').slice(0, MAX_TEXT);
    });
    return result;
  }

  function saveCurrentRecord(render = false) {
    if (!state || !route) return;
    state.records[state.currentGate] = readFormRecord();
    persist(render);
  }

  function completeCurrent() {
    saveCurrentRecord(false);
    if (!state.completedGates.includes(state.currentGate)) {
      state.completedGates = [...state.completedGates, state.currentGate].sort((a, b) => a - b);
    }
    if (state.currentGate < route.gates.length) state.currentGate += 1;
    persist();
  }

  function renderCurrentGate() {
    const gate = route.gates[state.currentGate - 1];
    const card = el('article', 'tm53-route-gate');
    card.append(
      el('p', 'tm53-route-eyebrow', `Gate ${String(gate.ordinal).padStart(2, '0')} of ${route.gates.length}`),
      el('h3', '', gate.title),
      el('p', 'tm53-route-gate__subtitle', gate.subtitle)
    );
    const authorities = el('div', 'tm53-route-authorities');
    gate.authorityLevels.forEach((level) => authorities.append(renderAuthority(level)));
    card.append(authorities, section('Teaching', gate.teaching), section('Practice', gate.practice), section('Completion condition', gate.completionCondition));
    if (gate.stopCondition) card.append(el('div', 'tm53-route-stop', `Stop / pause condition — ${gate.stopCondition}`));
    card.append(renderSourceDetails(gate));

    const record = cleanRecord(state.records[gate.ordinal]);
    const reality = el('section', 'tm53-route-record');
    reality.append(
      el('p', 'tm53-route-eyebrow', 'Private Enochian Reality Record'),
      el('h3', '', 'Observation → Interpretation → Verification → Conduct'),
      el('p', 'tm53-route-record__note', 'Record the experience first, then its meaning. Verification and conduct remain separate so personal testimony can stay meaningful without being silently promoted to historical or metaphysical certainty.')
    );
    Object.entries(gate.journalPrompts).forEach(([key, prompt]) => reality.append(field(key, prompt, record[key])));

    const actions = el('div', 'tm53-route-actions');
    const previous = button('← Previous Gate', () => {
      saveCurrentRecord(false);
      state.currentGate = Math.max(1, state.currentGate - 1);
      persist();
    });
    previous.disabled = state.currentGate === 1;
    const save = button('Save Reality Record', () => {
      saveCurrentRecord(false);
      save.textContent = 'Saved on this device';
      setTimeout(() => { if (document.contains(save)) save.textContent = 'Save Reality Record'; }, 1100);
    });
    const complete = button(state.currentGate === route.gates.length ? 'Integrate Final Gate' : 'Complete Gate & Continue →', completeCurrent);
    complete.dataset.primary = 'true';
    actions.append(previous, save, complete);
    reality.append(actions);
    card.append(reality);
    return card;
  }

  function downloadState() {
    saveCurrentRecord(false);
    const payload = {
      ...publicState(),
      exportedAt: now(),
      route: {
        routeId: route.routeId,
        version: route.version,
        title: route.title,
        authorityLevels: route.authorityLevels,
        structureNote: route.structureNote
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'temple-of-maat-enoch-pilgrimage.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function resetRoute() {
    if (!confirm('Reset Enoch pilgrimage progress and private Reality Records on this device?')) return;
    state = emptyState();
    try { localStorage.removeItem(STATE_KEY); } catch {}
    renderRoute();
    enhanceJourneyLauncher();
  }

  function renderRoute() {
    if (!layerBody || !route || !state) return;
    layerBody.replaceChildren(renderIntro(), renderGateMap(), renderCurrentGate());
    const footer = el('footer', 'tm53-route-footer');
    footer.append(
      button('Download Enoch Route JSON', downloadState),
      button('Reset Enoch Route', resetRoute)
    );
    layerBody.append(footer, el('p', 'tm53-route-private', `Route law — ${route.routeLaw}`));
  }

  function enhanceJourneyLauncher() {
    if (!route || !state || !document.body.classList.contains('temple-app-ready')) return;
    const journeyBody = document.querySelector('#tm525-journey .tm525-panel-body');
    if (!journeyBody || journeyBody.querySelector('[data-enoch-route-card]')) return;
    const card = el('section', 'tm53-route-card');
    card.dataset.enochRouteCard = 'true';
    card.append(
      el('p', 'tm53-route-card__eyebrow', 'Pilgrimage Route · Enoch'),
      el('h3', '', route.title),
      el('p', '', 'Explore your Enochian realities as private testimony through eight gates of source, vision, discernment, verification, and embodied right action.')
    );
    const meta = el('div', 'tm53-route-card__meta');
    meta.append(
      el('span', 'tm53-route-badge', '8 GATES'),
      el('span', 'tm53-route-badge', `${state.completedGates.length}/8 INTEGRATED`),
      el('span', 'tm53-route-badge', 'DEVICE-LOCAL RECORD')
    );
    const launch = button(state.started ? 'Resume Enoch Pilgrimage' : 'Begin Enoch Pilgrimage', openRoute, 'tm525-btn tm525-btn--gold tm53-route-launch');
    launch.dataset.enochRouteOpen = 'true';
    card.append(meta, launch);
    const mapHeading = journeyBody.querySelector('.tm525-map-heading');
    journeyBody.insertBefore(card, mapHeading || journeyBody.firstChild);
  }

  function enhance() {
    enhanceJourneyLauncher();
  }

  function installKeyboard() {
    document.addEventListener('keydown', (event) => {
      if (!layer || layer.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRoute();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
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
  }

  async function init() {
    installStyles();
    try {
      await loadRoute();
    } catch (error) {
      console.error('[Temple pilgrimage]', error);
      return;
    }
    createLayer();
    enhance();
    installKeyboard();
    if (!observer) {
      observer = new MutationObserver(() => requestAnimationFrame(enhance));
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    }
    window.TemplePilgrimageRoutes = Object.freeze({
      version: '1.0.0',
      routes: () => [clone(route)],
      state: (routeId = route.routeId) => routeId === route.routeId ? publicState() : null,
      open: (routeId = route.routeId) => routeId === route.routeId ? openRoute() : false,
      close: closeRoute,
      download: (routeId = route.routeId) => routeId === route.routeId ? downloadState() : false
    });
    document.dispatchEvent(new CustomEvent('temple:pilgrimage-routes-ready', { detail: { routeId: route.routeId, version: route.version } }));
  }

  function waitForJourney() {
    if (window.TemplePilgrimJourney) {
      init();
      return;
    }
    document.addEventListener('temple:living-temple-ready', init, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForJourney, { once: true });
  else waitForJourney();
})();
