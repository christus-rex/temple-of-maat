/* Temple of Ma'at v5.3 — source-aware pilgrimage routes */
(function () {
  'use strict';

  const STATE_SCHEMA = 'temple-of-maat/pilgrimage-state-v1';
  const MAX_TEXT = 12000;
  const ROUTE_CONFIGS = Object.freeze([
    Object.freeze({
      routeId: 'route.enoch-angelic-mirror',
      slug: 'enoch',
      url: './pilgrimages/enoch.v1.json',
      stateKey: 'temple_pilgrimage_enoch_v1',
      cardMarker: 'enochRouteCard',
      openMarker: 'enochRouteOpen',
      closeLabel: 'Close Enoch pilgrimage',
      unitLabel: 'Gate'
    }),
    Object.freeze({
      routeId: 'route.pistis-sophia-descent-return',
      slug: 'pistis-sophia',
      url: './pilgrimages/pistis-sophia.v1.json',
      stateKey: 'temple_pilgrimage_pistis_sophia_v1',
      cardMarker: 'pistisSophiaRouteCard',
      openMarker: 'pistisSophiaRouteOpen',
      closeLabel: 'Close Pistis Sophia pilgrimage',
      unitLabel: 'Station'
    })
  ]);

  const routes = new Map();
  const states = new Map();
  const routePromises = new Map();
  let activeRouteId = ROUTE_CONFIGS[0].routeId;
  let layer = null;
  let layerBody = null;
  let layerTitle = null;
  let layerClose = null;
  let layerScrim = null;
  let currentFocus = null;
  let hiddenParent = null;
  let observer = null;
  let keyboardInstalled = false;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const configFor = (routeId) => ROUTE_CONFIGS.find((item) => item.routeId === routeId) || null;
  const activeRoute = () => routes.get(activeRouteId) || null;
  const activeState = () => states.get(activeRouteId) || null;

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

  function defaultRecordFields(route) {
    if (Array.isArray(route?.recordFields) && route.recordFields.length) return route.recordFields;
    return [
      { key: 'observation', label: 'Observation' },
      { key: 'interpretation', label: 'Interpretation' },
      { key: 'verification', label: 'Verification' },
      { key: 'conduct', label: 'Conduct' }
    ];
  }

  function recordTitle(route) {
    if (route?.recordTitle) return route.recordTitle;
    if (route?.routeId === 'route.enoch-angelic-mirror') return 'Private Enochian Reality Record';
    return 'Private Pilgrimage Record';
  }

  function recordSequence(route) {
    return route?.recordSequence || 'Observation → Interpretation → Verification → Conduct';
  }

  function recordNote(route) {
    return route?.recordNote || 'Record the experience first, then its meaning. Verification and conduct remain separate so personal testimony can stay meaningful without being silently promoted to historical or metaphysical certainty.';
  }

  function unitLabel(route) {
    return String(configFor(route?.routeId)?.unitLabel || route?.unitLabel || 'Gate');
  }

  function unitPlural(route) {
    const label = unitLabel(route);
    return label.endsWith('s') ? label : `${label}s`;
  }

  function installStyles() {
    if (document.querySelector('link[data-temple-pilgrimage-routes]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './styles/v5.3-pilgrimage-routes.css';
    link.dataset.templePilgrimageRoutes = 'true';
    document.head.appendChild(link);
  }

  function gateNumber(route, value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= route.gates.length ? number : null;
  }

  function cleanRecord(route, value) {
    const input = value && typeof value === 'object' ? value : {};
    const output = {};
    defaultRecordFields(route).forEach(({ key }) => {
      output[key] = typeof input[key] === 'string' ? input[key].slice(0, MAX_TEXT) : '';
    });
    return output;
  }

  function emptyState(route) {
    return {
      schema: STATE_SCHEMA,
      routeId: route.routeId,
      routeVersion: route.version,
      started: false,
      startedAt: null,
      updatedAt: null,
      currentGate: 1,
      completedGates: [],
      records: {}
    };
  }

  function loadState(route, config) {
    const fresh = emptyState(route);
    try {
      const raw = JSON.parse(localStorage.getItem(config.stateKey) || 'null');
      if (!raw || typeof raw !== 'object') return fresh;
      if (raw.schema !== STATE_SCHEMA || raw.routeId !== route.routeId || raw.routeVersion !== route.version) return fresh;
      const completedGates = [...new Set((Array.isArray(raw.completedGates) ? raw.completedGates : [])
        .map((value) => gateNumber(route, value)).filter(Boolean))].sort((a, b) => a - b);
      const records = {};
      if (raw.records && typeof raw.records === 'object') {
        Object.entries(raw.records).forEach(([key, value]) => {
          const number = gateNumber(route, key);
          if (number) records[number] = cleanRecord(route, value);
        });
      }
      return {
        ...fresh,
        started: Boolean(raw.started),
        startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : null,
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
        currentGate: gateNumber(route, raw.currentGate) || 1,
        completedGates,
        records
      };
    } catch {
      return fresh;
    }
  }

  async function loadRoute(config) {
    if (routes.has(config.routeId)) return routes.get(config.routeId);
    if (!routePromises.has(config.routeId)) {
      routePromises.set(config.routeId, fetch(config.url, { cache: 'force-cache' })
        .then((response) => {
          if (!response.ok) throw new Error(`${config.routeId} pilgrimage route ${response.status}`);
          return response.json();
        })
        .then((payload) => {
          if (payload?.schema !== 'temple-of-maat/pilgrimage-route-v1' || payload?.routeId !== config.routeId) {
            throw new Error(`Unsupported pilgrimage route payload for ${config.routeId}.`);
          }
          if (!Array.isArray(payload.gates) || payload.gates.length < 1) throw new Error(`${config.routeId} requires at least one route unit.`);
          routes.set(config.routeId, payload);
          states.set(config.routeId, loadState(payload, config));
          return payload;
        }));
    }
    return routePromises.get(config.routeId);
  }

  async function loadRoutes() {
    const results = await Promise.allSettled(ROUTE_CONFIGS.map((config) => loadRoute(config)));
    if (!results.some((result) => result.status === 'fulfilled')) throw new Error('No Temple pilgrimage routes could be loaded.');
    return ROUTE_CONFIGS.map((config) => routes.get(config.routeId)).filter(Boolean);
  }

  function publicState(routeId = activeRouteId) {
    const route = routes.get(routeId);
    const state = states.get(routeId);
    return route && state ? clone(state) : null;
  }

  function gallerySignature() {
    return ROUTE_CONFIGS.map((config) => {
      const route = routes.get(config.routeId);
      const state = states.get(config.routeId);
      if (!route || !state) return `${config.routeId}:missing`;
      return `${config.routeId}:${route.version}:${state.started ? 1 : 0}:${state.currentGate}:${state.completedGates.join('.')}`;
    }).join('|');
  }

  function persist(routeId = activeRouteId, render = true) {
    const route = routes.get(routeId);
    const config = configFor(routeId);
    const state = states.get(routeId);
    if (!route || !config || !state) return false;
    state.routeVersion = route.version;
    state.updatedAt = now();
    try { localStorage.setItem(config.stateKey, JSON.stringify(state)); } catch {}
    document.dispatchEvent(new CustomEvent('temple:pilgrimage-route-change', { detail: { routeId, state: publicState(routeId) } }));
    renderJourneyCards();
    if (render && layer && !layer.hidden && activeRouteId === routeId) renderRoute();
    return true;
  }

  function startIfNeeded(routeId = activeRouteId) {
    const state = states.get(routeId);
    if (!state || state.started) return;
    state.started = true;
    state.startedAt = state.startedAt || now();
    persist(routeId, false);
  }

  function createLayer() {
    if (layer) return;
    layer = el('div', 'tm53-route-layer');
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');

    layerScrim = button('', closeRoute, 'tm53-route-scrim');
    const panel = el('section', 'tm53-route-panel');
    const header = el('header', 'tm53-route-header');
    const titles = el('div');
    titles.append(el('p', 'tm53-route-eyebrow', 'Temple Pilgrimage Route · PERSONAL / SOURCE-AWARE'));
    layerTitle = el('h2', 'tm53-route-title', 'Temple Pilgrimage');
    titles.append(layerTitle);
    layerClose = button('×', closeRoute, 'tm53-route-close');
    header.append(titles, layerClose);
    layerBody = el('div', 'tm53-route-body');
    panel.append(header, layerBody);
    layer.append(layerScrim, panel);
    document.body.appendChild(layer);
  }

  function configureLayer(routeId) {
    createLayer();
    const route = routes.get(routeId);
    const config = configFor(routeId);
    if (!route || !config) return false;
    layer.id = `tm53-${config.slug}-route`;
    layer.dataset.templePilgrimageRoute = config.slug;
    const titleId = `tm53-${config.slug}-route-title`;
    layerTitle.id = titleId;
    layerTitle.textContent = route.title;
    layer.setAttribute('aria-labelledby', titleId);
    layerClose.setAttribute('aria-label', config.closeLabel);
    layerScrim.setAttribute('aria-label', config.closeLabel);
    return true;
  }

  function focusables() {
    if (!layer || layer.hidden) return [];
    return [...layer.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((node) => !node.hidden && node.getClientRects().length);
  }

  function openRoute(routeId = activeRouteId) {
    const config = configFor(routeId);
    if (!config || !document.body.classList.contains('temple-app-ready')) return false;
    loadRoute(config).then(() => {
      if (layer && !layer.hidden && activeRouteId !== routeId) saveCurrentRecord(false);
      activeRouteId = routeId;
      configureLayer(routeId);
      startIfNeeded(routeId);
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
      requestAnimationFrame(() => layerClose?.focus({ preventScroll: true }));
    }).catch((error) => console.error('[Temple pilgrimage]', error));
    return true;
  }

  function closeRoute() {
    if (!layer || layer.hidden) return;
    saveCurrentRecord(false);
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
    return el('span', `tm53-route-authority tm53-route-authority--${String(level).toLowerCase()}`, level);
  }

  function renderIntro(route, state) {
    const wrap = el('div', 'tm53-route-intro');
    const main = el('section', 'tm53-route-intro__card');
    main.append(el('p', 'tm53-route-card__eyebrow', route.subtitle), el('p', '', route.structureNote));
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
    side.append(progress, el('div', 'tm53-route-progress-label', `${completed} / ${route.gates.length} ${unitPlural(route).toLowerCase()} integrated`));
    side.append(el('p', 'tm53-route-private', `Your ${recordTitle(route)} remains on this device unless you explicitly export it. Personal testimony is not written into the public Knowledge Kernel or Relationship Graph.`));
    wrap.append(main, side);
    return wrap;
  }

  function renderGateMap(route, state) {
    const map = el('nav', 'tm53-route-gates');
    map.setAttribute('aria-label', `${route.title} ${unitPlural(route).toLowerCase()}`);
    route.gates.forEach((gate) => {
      const number = gate.ordinal;
      const classes = ['tm53-route-gate-button'];
      if (number === state.currentGate) classes.push('is-current');
      if (state.completedGates.includes(number)) classes.push('is-complete');
      const node = button(String(number).padStart(2, '0'), () => {
        saveCurrentRecord(false);
        state.currentGate = number;
        persist(route.routeId);
      }, classes.join(' '));
      node.title = `${gate.title}${state.completedGates.includes(number) ? ' · Integrated' : ''}`;
      node.setAttribute('aria-label', `${unitLabel(route)} ${number}: ${gate.title}${state.completedGates.includes(number) ? ', integrated' : ''}`);
      map.append(node);
    });
    return map;
  }

  function section(title, text) {
    const node = el('section', 'tm53-route-section');
    node.append(el('h4', '', title), el('p', '', text));
    return node;
  }

  function renderSourceDetails(route, gate) {
    const details = el('details', 'tm53-route-source');
    details.append(el('summary', '', 'Source & authority boundary'), el('p', '', gate.sourceAnchor));
    gate.sourceRefs.forEach((id) => {
      const source = route.sourceRefs.find((item) => item.id === id);
      if (!source) return;
      const line = el('p');
      line.append(el('strong', '', `${source.authority} · ${source.title}`), document.createTextNode(` — ${source.locators.join('; ')}`));
      details.append(line);
      if (Array.isArray(source.limitations) && source.limitations.length) {
        details.append(el('p', 'tm53-route-source__limitations', `Limitations: ${source.limitations.join(' ')}`));
      }
    });
    return details;
  }

  function fieldLabel(route, key) {
    const match = defaultRecordFields(route).find((item) => item.key === key);
    return match?.label || key.split('-').map((part) => part ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
  }

  function field(route, state, config, key, prompt, value) {
    const wrap = el('div', 'tm53-route-field');
    const label = el('label', '', fieldLabel(route, key));
    const id = `tm53-${config.slug}-${state.currentGate}-${key}`;
    label.htmlFor = id;
    const area = el('textarea');
    area.id = id;
    area.dataset.realityField = key;
    area.maxLength = MAX_TEXT;
    area.rows = 4;
    area.value = value || '';
    wrap.append(label, el('small', '', prompt), area);
    return wrap;
  }

  function readFormRecord(route, state) {
    const result = cleanRecord(route, state.records[state.currentGate]);
    if (!layerBody) return result;
    layerBody.querySelectorAll('[data-reality-field]').forEach((area) => {
      const key = area.dataset.realityField;
      if (key in result) result[key] = String(area.value || '').slice(0, MAX_TEXT);
    });
    return result;
  }

  function saveCurrentRecord(render = false) {
    const route = activeRoute();
    const state = activeState();
    if (!route || !state) return false;
    state.records[state.currentGate] = readFormRecord(route, state);
    return persist(route.routeId, render);
  }

  function completeCurrent() {
    const route = activeRoute();
    const state = activeState();
    if (!route || !state) return;
    saveCurrentRecord(false);
    if (!state.completedGates.includes(state.currentGate)) state.completedGates = [...state.completedGates, state.currentGate].sort((a, b) => a - b);
    if (state.currentGate < route.gates.length) state.currentGate += 1;
    persist(route.routeId);
  }

  function renderCurrentGate(route, state, config) {
    const gate = route.gates[state.currentGate - 1];
    const card = el('article', 'tm53-route-gate');
    card.append(
      el('p', 'tm53-route-eyebrow', `${unitLabel(route)} ${String(gate.ordinal).padStart(2, '0')} of ${route.gates.length}`),
      el('h3', '', gate.title),
      el('p', 'tm53-route-gate__subtitle', gate.subtitle)
    );
    const authorities = el('div', 'tm53-route-authorities');
    gate.authorityLevels.forEach((level) => authorities.append(renderAuthority(level)));
    card.append(authorities, section('Teaching', gate.teaching), section('Practice', gate.practice), section('Completion condition', gate.completionCondition));
    if (gate.stopCondition) card.append(el('div', 'tm53-route-stop', `Stop / pause condition — ${gate.stopCondition}`));
    card.append(renderSourceDetails(route, gate));

    const record = cleanRecord(route, state.records[gate.ordinal]);
    const privateRecord = el('section', 'tm53-route-record');
    privateRecord.append(
      el('p', 'tm53-route-eyebrow', recordTitle(route)),
      el('h3', '', recordSequence(route)),
      el('p', 'tm53-route-record__note', recordNote(route))
    );
    defaultRecordFields(route).forEach(({ key }) => {
      const prompt = gate.journalPrompts?.[key];
      if (typeof prompt === 'string' && prompt.trim()) privateRecord.append(field(route, state, config, key, prompt, record[key]));
    });

    const actions = el('div', 'tm53-route-actions');
    const previous = button(`← Previous ${unitLabel(route)}`, () => {
      saveCurrentRecord(false);
      state.currentGate = Math.max(1, state.currentGate - 1);
      persist(route.routeId);
    });
    previous.disabled = state.currentGate === 1;
    const save = button('Save Private Record', () => {
      saveCurrentRecord(false);
      save.textContent = 'Saved on this device';
      setTimeout(() => { if (document.contains(save)) save.textContent = 'Save Private Record'; }, 1100);
    });
    const complete = button(state.currentGate === route.gates.length
      ? `Integrate Final ${unitLabel(route)}`
      : `Complete ${unitLabel(route)} & Continue →`, completeCurrent);
    complete.dataset.primary = 'true';
    actions.append(previous, save, complete);
    privateRecord.append(actions);
    card.append(privateRecord);
    return card;
  }

  function downloadState(routeId = activeRouteId) {
    const route = routes.get(routeId);
    const state = states.get(routeId);
    const config = configFor(routeId);
    if (!route || !state || !config) return false;
    if (routeId === activeRouteId && layer && !layer.hidden) saveCurrentRecord(false);
    const payload = {
      ...clone(state),
      exportedAt: now(),
      route: {
        routeId: route.routeId,
        version: route.version,
        title: route.title,
        authorityLevels: route.authorityLevels,
        structureNote: route.structureNote,
        recordSequence: recordSequence(route)
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = config.slug === 'enoch' ? 'temple-of-maat-enoch-pilgrimage.json' : `temple-of-maat-${config.slug}-pilgrimage.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    return true;
  }

  function resetRoute(routeId = activeRouteId) {
    const route = routes.get(routeId);
    const config = configFor(routeId);
    if (!route || !config) return false;
    if (!confirm(`Reset ${route.title} progress and private records on this device?`)) return false;
    states.set(routeId, emptyState(route));
    try { localStorage.removeItem(config.stateKey); } catch {}
    renderJourneyCards(true);
    if (routeId === activeRouteId && layer && !layer.hidden) renderRoute();
    return true;
  }

  function renderRoute() {
    const route = activeRoute();
    const state = activeState();
    const config = configFor(activeRouteId);
    if (!layerBody || !route || !state || !config) return;
    layerBody.replaceChildren(renderIntro(route, state), renderGateMap(route, state), renderCurrentGate(route, state, config));
    const footer = el('footer', 'tm53-route-footer');
    footer.append(
      button(`Download ${route.title} JSON`, () => downloadState(route.routeId)),
      button(`Reset ${route.title}`, () => resetRoute(route.routeId))
    );
    layerBody.append(footer, el('p', 'tm53-route-private', `Route law — ${route.routeLaw}`));
  }

  function routeCard(route, state, config) {
    const card = el('section', 'tm53-route-card');
    card.dataset.templePilgrimageCard = config.slug;
    card.dataset[config.cardMarker] = 'true';
    card.append(
      el('p', 'tm53-route-card__eyebrow', `Pilgrimage Route · ${route.title.split('—')[0].trim()}`),
      el('h3', '', route.title),
      el('p', '', route.subtitle)
    );
    const meta = el('div', 'tm53-route-card__meta');
    meta.append(
      el('span', 'tm53-route-badge', `${route.gates.length} ${unitPlural(route).toUpperCase()}`),
      el('span', 'tm53-route-badge', `${state.completedGates.length}/${route.gates.length} INTEGRATED`),
      el('span', 'tm53-route-badge', 'DEVICE-LOCAL RECORD')
    );
    const launch = button(state.started ? `Resume ${route.title}` : `Begin ${route.title}`, () => openRoute(route.routeId), 'tm525-btn tm525-btn--gold tm53-route-launch');
    launch.dataset.templePilgrimageOpen = config.slug;
    launch.dataset[config.openMarker] = 'true';
    card.append(meta, launch);
    return card;
  }

  function renderJourneyCards(force = false) {
    if (!document.body.classList.contains('temple-app-ready')) return;
    const journeyBody = document.querySelector('#tm525-journey .tm525-panel-body');
    if (!journeyBody) return;
    let gallery = journeyBody.querySelector('[data-pilgrimage-route-gallery]');
    if (!gallery) {
      gallery = el('section', 'tm53-route-gallery');
      gallery.dataset.pilgrimageRouteGallery = 'true';
      const mapHeading = journeyBody.querySelector('.tm525-map-heading');
      journeyBody.insertBefore(gallery, mapHeading || journeyBody.firstChild);
    }
    const signature = gallerySignature();
    if (!force && gallery.dataset.routeSignature === signature && gallery.children.length) return;
    gallery.dataset.routeSignature = signature;
    const cards = [];
    ROUTE_CONFIGS.forEach((config) => {
      const route = routes.get(config.routeId);
      const state = states.get(config.routeId);
      if (route && state) cards.push(routeCard(route, state, config));
    });
    gallery.replaceChildren(...cards);
  }

  function installKeyboard() {
    if (keyboardInstalled) return;
    keyboardInstalled = true;
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

  function enhance() {
    renderJourneyCards();
  }

  async function init() {
    installStyles();
    try {
      await loadRoutes();
    } catch (error) {
      console.error('[Temple pilgrimage]', error);
      return;
    }
    createLayer();
    if (!routes.has(activeRouteId)) activeRouteId = routes.keys().next().value;
    configureLayer(activeRouteId);
    enhance();
    installKeyboard();
    if (!observer) {
      observer = new MutationObserver(() => requestAnimationFrame(enhance));
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    }
    window.TemplePilgrimageRoutes = Object.freeze({
      version: '1.1.0',
      routes: () => ROUTE_CONFIGS.map((config) => routes.get(config.routeId)).filter(Boolean).map(clone),
      state: (routeId = activeRouteId) => publicState(routeId),
      open: (routeId = activeRouteId) => openRoute(routeId),
      close: closeRoute,
      download: (routeId = activeRouteId) => downloadState(routeId),
      reset: (routeId = activeRouteId) => resetRoute(routeId)
    });
    document.dispatchEvent(new CustomEvent('temple:pilgrimage-routes-ready', { detail: { version: '1.1.0', routeIds: [...routes.keys()] } }));
  }

  function waitForJourney() {
    if (window.TemplePilgrimJourney) init();
    else document.addEventListener('temple:living-temple-ready', init, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForJourney, { once: true });
  else waitForJourney();
})();
