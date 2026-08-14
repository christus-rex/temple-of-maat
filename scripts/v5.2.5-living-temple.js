/* Temple of Ma'at v5.2.5 — The Living Temple */
(function () {
  'use strict';

  const VERSION = '5.2.5';
  const STATE_KEY = 'temple_v525_pilgrim_journey';
  const SOURCE_MP3_SHA256 = '3e40ba7d0b60c3a04f7edf3022fc98f9daf2fcc3ca9e7900c87bb2b62f02fbe6';
  const SOURCE_MP3_BYTES = 16210172;
  const SOURCE_MP3_DURATION = 1013.106939;
  let manifestPromise = null;
  let journeyLayer = null;
  let dossierLayer = null;
  let lastFocus = null;
  let observer = null;

  function chamberNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 72 ? number : null;
  }

  function numberFromHash() {
    const match = location.hash.match(/chamber-(\d{1,2})/i);
    return match ? chamberNumber(match[1]) : null;
  }

  function currentNumber() {
    return numberFromHash() || chamberNumber(window.TempleLivingCodex?.current?.()) || chamberNumber(localStorage.getItem('temple_last_chamber')) || 1;
  }

  function emptyState() {
    return {
      schema: 'temple-of-maat/pilgrim-journey-v1',
      version: VERSION,
      started: false,
      startedAt: null,
      updatedAt: null,
      current: 1,
      visited: [],
      favorites: [],
      reflections: {}
    };
  }

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return emptyState();
      const visited = [...new Set((Array.isArray(raw.visited) ? raw.visited : []).map(chamberNumber).filter(Boolean))].sort((a, b) => a - b);
      const favorites = [...new Set((Array.isArray(raw.favorites) ? raw.favorites : []).map(chamberNumber).filter(Boolean))].sort((a, b) => a - b);
      const reflections = {};
      if (raw.reflections && typeof raw.reflections === 'object') {
        Object.entries(raw.reflections).forEach(([key, value]) => {
          const number = chamberNumber(key);
          if (number && typeof value === 'string' && value.trim()) reflections[number] = value.slice(0, 12000);
        });
      }
      return {
        ...emptyState(),
        started: Boolean(raw.started),
        startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : null,
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
        current: chamberNumber(raw.current) || 1,
        visited,
        favorites,
        reflections
      };
    } catch {
      return emptyState();
    }
  }

  let state = loadState();

  function persist() {
    state.version = VERSION;
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
    refreshJourneyButton();
    document.dispatchEvent(new CustomEvent('temple:journey-change', { detail: publicState() }));
  }

  function publicState() {
    return JSON.parse(JSON.stringify(state));
  }

  function markVisited(number) {
    const valid = chamberNumber(number);
    if (!valid || !document.body.classList.contains('temple-app-ready')) return;
    if (!state.started) {
      state.started = true;
      state.startedAt = state.startedAt || new Date().toISOString();
    }
    state.current = valid;
    if (!state.visited.includes(valid)) state.visited = [...state.visited, valid].sort((a, b) => a - b);
    persist();
    if (journeyLayer && !journeyLayer.hidden) renderJourney();
  }

  function startJourney(number = 1) {
    const valid = chamberNumber(number) || 1;
    state.started = true;
    state.startedAt = state.startedAt || new Date().toISOString();
    state.current = valid;
    persist();
    location.hash = `#chamber-${String(valid).padStart(2, '0')}`;
    if (document.body.classList.contains('temple-app-ready')) markVisited(valid);
  }

  function toggleFavorite(number) {
    const valid = chamberNumber(number) || currentNumber();
    state.favorites = state.favorites.includes(valid)
      ? state.favorites.filter((item) => item !== valid)
      : [...state.favorites, valid].sort((a, b) => a - b);
    persist();
    return state.favorites.includes(valid);
  }

  function setReflection(number, text) {
    const valid = chamberNumber(number) || currentNumber();
    const value = String(text || '').slice(0, 12000);
    if (value.trim()) state.reflections[valid] = value;
    else delete state.reflections[valid];
    persist();
  }

  function resetJourney() {
    state = emptyState();
    try { localStorage.removeItem(STATE_KEY); } catch {}
    refreshJourneyButton();
    renderJourney();
  }

  function record(number) {
    return window.TempleLivingCodex?.record?.(chamberNumber(number) || currentNumber()) || null;
  }

  function archive(number) {
    const valid = chamberNumber(number) || currentNumber();
    try {
      const chambers = window.TempleArchive?.chambers?.();
      if (Array.isArray(chambers)) return chambers.find((item) => Number(item.num || item.number || item.id) === valid) || null;
    } catch {}
    return null;
  }

  function parental(number) {
    return window.TEMPLE_PARENTAL_POWERS?.[String(chamberNumber(number) || currentNumber())] || null;
  }

  async function assetManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch('./scripts/v5.1-asset-manifest.json', { cache: 'force-cache' })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Asset manifest ${response.status}`)))
        .catch(() => ({ assets: [] }));
    }
    return manifestPromise;
  }

  async function visualAssets(number) {
    const valid = chamberNumber(number) || currentNumber();
    const manifest = await assetManifest();
    const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
    const heroes = assets.filter((item) => item.category === 'hero');
    const seals = assets.filter((item) => item.category === 'seal');
    const hero = heroes[valid - 1];
    const seal = seals[valid - 1];
    const parent = parental(valid);
    return {
      hero: hero?.display?.path || hero?.path || null,
      seal: seal?.display?.path || seal?.path || null,
      parental: parent?.displayPath || null
    };
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(label, handler, className = 'tm525-btn') {
    const node = el('button', className, label);
    node.type = 'button';
    node.addEventListener('click', handler);
    return node;
  }

  function closeLayer(layer) {
    if (!layer) return;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tm525-modal-open');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  function openLayer(layer) {
    if (!layer) return;
    lastFocus = document.activeElement;
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tm525-modal-open');
    requestAnimationFrame(() => layer.querySelector('button, input, textarea, [tabindex]:not([tabindex="-1"])')?.focus());
  }

  function createLayer(id, title, eyebrow) {
    const layer = el('div', 'tm525-layer');
    layer.id = id;
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('aria-labelledby', `${id}-title`);
    const scrim = button('', () => closeLayer(layer), 'tm525-scrim');
    scrim.setAttribute('aria-label', `Close ${title}`);
    const panel = el('section', 'tm525-panel');
    const header = el('header', 'tm525-panel-header');
    const titles = el('div');
    titles.append(el('p', 'tm525-eyebrow', eyebrow), el('h2', 'tm525-panel-title', title));
    titles.querySelector('h2').id = `${id}-title`;
    header.append(titles, button('×', () => closeLayer(layer), 'tm525-icon-btn'));
    const body = el('div', 'tm525-panel-body');
    panel.append(header, body);
    layer.append(scrim, panel);
    document.body.appendChild(layer);
    return { layer, body };
  }

  function installStyles() {
    if (document.querySelector('link[data-temple-v525]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './styles/v5.2.5-living-temple.css';
    link.dataset.templeV525 = 'true';
    document.head.appendChild(link);
  }

  function progressText() {
    return `${state.visited.length}/72 · ${Math.round((state.visited.length / 72) * 100)}%`;
  }

  function refreshJourneyButton() {
    const node = document.getElementById('tm525-journey-button');
    if (node) node.textContent = state.started ? `Journey ${progressText()}` : 'Begin Journey';
  }

  function ensureDockControls() {
    const dock = document.getElementById('tm524-dock');
    if (dock && !document.getElementById('tm525-journey-button')) {
      const chamberButton = document.getElementById('tm524-dock-chamber');
      const journey = button('', () => openJourney(), 'tm524-dock-btn');
      journey.id = 'tm525-journey-button';
      const dossier = button('Dossier', () => openDossier(currentNumber()), 'tm524-dock-btn');
      dossier.id = 'tm525-dossier-button';
      dock.insertBefore(journey, chamberButton || null);
      dock.insertBefore(dossier, chamberButton || null);
      refreshJourneyButton();
    }

    const context = document.getElementById('tm524-context-tools');
    if (context && !context.querySelector('[data-tm525-dossier]')) {
      const dossier = button('Open Dossier', () => openDossier(currentNumber()), 'tm524-chamber-tool');
      dossier.dataset.tm525Dossier = 'true';
      context.appendChild(dossier);
    }
  }

  function enhanceEntrance() {
    const actions = document.querySelector('#temple-static-entry .temple-static-entry__actions');
    if (!actions || actions.querySelector('[data-temple-entry="journey"]')) return;
    const anchor = el('a', 'temple-static-entry__action tm525-entry-journey', state.started ? `Resume Pilgrim Journey · ${progressText()}` : 'Begin Pilgrim Journey');
    anchor.href = `#chamber-${String(state.current || 1).padStart(2, '0')}`;
    anchor.dataset.templeEntry = 'journey';
    anchor.addEventListener('click', () => {
      state.started = true;
      state.startedAt = state.startedAt || new Date().toISOString();
      state.current = chamberNumber(state.current) || 1;
      persist();
    });
    actions.appendChild(anchor);
  }

  function createJourney() {
    if (journeyLayer) return;
    const created = createLayer('tm525-journey', 'The Pilgrim Journey', `Temple v${VERSION} · visitor-controlled progression`);
    journeyLayer = created.layer;
    journeyLayer._body = created.body;
  }

  function renderJourney() {
    createJourney();
    const body = journeyLayer._body;
    if (!body) return;
    body.replaceChildren();
    const current = chamberNumber(state.current) || currentNumber();
    const currentRecord = record(current);

    const summary = el('section', 'tm525-journey-summary');
    const stats = el('div', 'tm525-journey-stats');
    stats.append(
      metric('Visited', `${state.visited.length} / 72`),
      metric('Completion', `${Math.round((state.visited.length / 72) * 100)}%`),
      metric('Favorites', String(state.favorites.length)),
      metric('Reflections', String(Object.keys(state.reflections).length))
    );
    const progress = el('div', 'tm525-progress');
    const fill = el('span', 'tm525-progress-fill');
    fill.style.width = `${(state.visited.length / 72) * 100}%`;
    progress.appendChild(fill);
    summary.append(stats, progress);

    const currentCard = el('section', 'tm525-current-card');
    currentCard.append(el('p', 'tm525-eyebrow', `Current chamber · ${String(current).padStart(2, '0')}`), el('h3', 'tm525-current-title', currentRecord ? `${currentRecord.angel} ↔ ${currentRecord.gematriaTwin.daemon}` : `Chamber ${current}`));
    const actions = el('div', 'tm525-action-row');
    actions.append(
      button('Open Chamber', () => { location.hash = `#chamber-${String(current).padStart(2, '0')}`; closeLayer(journeyLayer); }, 'tm525-btn'),
      button('Open Dossier', () => { closeLayer(journeyLayer); openDossier(current); }, 'tm525-btn tm525-btn--gold'),
      button(state.favorites.includes(current) ? '★ Favorited' : '☆ Favorite', () => { toggleFavorite(current); renderJourney(); }, 'tm525-btn tm525-btn--ghost')
    );
    currentCard.appendChild(actions);

    const reflection = el('div', 'tm525-reflection');
    reflection.append(el('label', 'tm525-label', `Reflection for Chamber ${String(current).padStart(2, '0')}`));
    const textarea = el('textarea', 'tm525-textarea');
    textarea.rows = 4;
    textarea.maxLength = 12000;
    textarea.placeholder = 'Record what changed, what you observed, or what you will carry forward…';
    textarea.value = state.reflections[current] || '';
    const save = button('Save Reflection', () => { setReflection(current, textarea.value); save.textContent = 'Saved'; setTimeout(() => { save.textContent = 'Save Reflection'; }, 900); }, 'tm525-btn tm525-btn--secondary');
    reflection.append(textarea, save);

    const gridTitle = el('div', 'tm525-map-heading');
    gridTitle.append(el('div', '', ''), el('h3', 'tm525-section-title', '72-Chamber Progress Map'));
    const grid = el('div', 'tm525-node-grid');
    for (let number = 1; number <= 72; number += 1) {
      const r = record(number);
      const visited = state.visited.includes(number);
      const favorite = state.favorites.includes(number);
      const node = button(String(number).padStart(2, '0'), () => {
        state.current = number;
        persist();
        renderJourney();
      }, `tm525-node${visited ? ' is-visited' : ''}${favorite ? ' is-favorite' : ''}${number === current ? ' is-current' : ''}`);
      node.title = `${String(number).padStart(2, '0')} · ${r?.angel || 'Chamber'}${favorite ? ' · Favorite' : ''}${visited ? ' · Visited' : ''}`;
      node.setAttribute('aria-label', node.title);
      grid.appendChild(node);
    }

    const footer = el('div', 'tm525-journey-footer');
    if (!state.started) footer.append(button('Begin at Chamber 01', () => { startJourney(1); renderJourney(); }, 'tm525-btn'));
    footer.append(button('Download Journey JSON', downloadJourney, 'tm525-btn tm525-btn--secondary'));
    if (state.started || state.visited.length || Object.keys(state.reflections).length) footer.append(button('Reset Journey', () => { if (confirm('Reset visited chambers, favorites, and reflections on this device?')) resetJourney(); }, 'tm525-btn tm525-btn--danger'));

    body.append(summary, currentCard, reflection, gridTitle, grid, footer);
  }

  function metric(label, value) {
    const node = el('div', 'tm525-metric');
    node.append(el('span', 'tm525-metric-label', label), el('strong', 'tm525-metric-value', value));
    return node;
  }

  function openJourney() {
    renderJourney();
    openLayer(journeyLayer);
  }

  function createDossier() {
    if (dossierLayer) return;
    const created = createLayer('tm525-dossier', 'Chamber Dossier', `Temple v${VERSION} · unified chamber record`);
    dossierLayer = created.layer;
    dossierLayer._body = created.body;
  }

  function dataCard(label, value, extra = '') {
    const card = el('div', `tm525-data-card ${extra}`.trim());
    card.append(el('span', 'tm525-data-label', label), el('strong', 'tm525-data-value', value == null || value === '' ? '—' : String(value)));
    return card;
  }

  function imageCard(label, path, alt) {
    const card = el('figure', 'tm525-visual-card');
    const frame = el('div', 'tm525-visual-frame');
    if (path) {
      const image = document.createElement('img');
      image.src = `./${String(path).replace(/^\.\//, '')}`;
      image.alt = alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      frame.appendChild(image);
    } else frame.append(el('span', 'tm525-visual-missing', 'Asset unavailable'));
    card.append(frame, el('figcaption', '', label));
    return card;
  }

  async function renderDossier(number) {
    createDossier();
    const valid = chamberNumber(number) || currentNumber();
    const body = dossierLayer._body;
    body.replaceChildren(el('p', 'tm525-loading', 'Opening unified chamber record…'));
    const [assets] = await Promise.all([visualAssets(valid)]);
    const r = record(valid);
    const a = archive(valid);
    const p = parental(valid);
    if (!r) {
      body.replaceChildren(el('p', 'tm525-loading', 'Codex record unavailable.'));
      return;
    }

    body.replaceChildren();
    const hero = el('section', 'tm525-dossier-hero');
    const hebrew = el('div', 'tm525-dossier-hebrew', r.hebrewTriplet);
    const names = el('div', 'tm525-dossier-names');
    names.append(el('p', 'tm525-eyebrow', `Chamber ${r.id} · ${r.transliteration}`), el('h3', 'tm525-dossier-title', p?.thirdName || a?.thirdName || `${r.angel} ↔ ${r.gematriaTwin.daemon}`), el('p', 'tm525-dossier-subtitle', `${r.angel} ↔ ${p?.daemon || a?.daemon || r.gematriaTwin.daemon}`));
    hero.append(hebrew, names);

    const visuals = el('div', 'tm525-visual-grid');
    visuals.append(
      imageCard('Hero', assets.hero, `Chamber ${r.id} hero artwork`),
      imageCard('Egypto-Solomonic Seal', assets.seal, `Chamber ${r.id} seal`),
      imageCard('Parental Powers', assets.parental, `Chamber ${r.id} parental powers artwork`)
    );

    const grid = el('div', 'tm525-data-grid');
    grid.append(
      dataCard('Hebrew triplet', r.hebrewTriplet, 'tm525-data-hebrew'),
      dataCard('Triplet gematria', `${r.tripletGematria} → ${r.tripletDigitalRoot}`),
      dataCard('Constructed name', r.constructedHebrew, 'tm525-data-hebrew'),
      dataCard('Full gematria', `${r.fullGematria} → ${r.fullDigitalRoot}`),
      dataCard('Gematria twin', r.gematriaTwin.daemon),
      dataCard('Twin strength', r.gematriaTwin.strength),
      dataCard('Exact ciphers', r.gematriaTwin.exactCiphers.join(', ')),
      dataCard('Third Name', p?.thirdName || a?.thirdName),
      dataCard('Office', p?.office || a?.office),
      dataCard('Chamber Law', p?.law || a?.law),
      dataCard('Pillar', p?.pillar || a?.pillar),
      dataCard('Parental Fire', p?.fire?.name)
    );

    const reflection = el('section', 'tm525-dossier-reflection');
    reflection.append(el('h4', 'tm525-section-title', 'Pilgrim Reflection'));
    const textarea = el('textarea', 'tm525-textarea');
    textarea.rows = 4;
    textarea.maxLength = 12000;
    textarea.value = state.reflections[valid] || '';
    textarea.placeholder = 'Write a chamber reflection…';
    reflection.append(textarea, button('Save Reflection', () => setReflection(valid, textarea.value), 'tm525-btn tm525-btn--secondary'));

    const actions = el('div', 'tm525-action-row tm525-dossier-actions');
    const favoriteButton = button(state.favorites.includes(valid) ? '★ Favorited' : '☆ Favorite', () => {
      const on = toggleFavorite(valid);
      favoriteButton.textContent = on ? '★ Favorited' : '☆ Favorite';
    }, 'tm525-btn tm525-btn--ghost');
    actions.append(
      button('Open Chamber', () => { state.current = valid; persist(); location.hash = `#chamber-${r.id}`; closeLayer(dossierLayer); }, 'tm525-btn'),
      button('Open Living Codex', () => { closeLayer(dossierLayer); window.TempleLivingCodex?.open?.(valid); }, 'tm525-btn tm525-btn--gold'),
      button('Collect', () => { closeLayer(dossierLayer); window.TempleLivingCodex?.openVault?.(valid); }, 'tm525-btn tm525-btn--secondary'),
      favoriteButton
    );

    const provenance = el('details', 'tm525-provenance');
    provenance.append(el('summary', '', 'Record provenance & layer boundaries'));
    const provenanceBody = el('div', 'tm525-provenance-body');
    provenanceBody.append(
      el('p', '', 'Layer B: Exodus-derived Hebrew triplet and later angelic expansion from the Living Codex source catalogue.'),
      el('p', '', 'Analytical layer: gematria-twin correspondence; numerical resonance is not presented as historical or metaphysical identity.'),
      el('p', '', 'Temple layer: Third Name, office, law, pillar, Parental Powers artwork, hero artwork, seal, and visitor reflection.'),
      el('p', '', 'A dossier unifies access while keeping these source layers visibly distinct.')
    );
    provenance.appendChild(provenanceBody);

    body.append(hero, visuals, grid, reflection, actions, provenance);
  }

  async function openDossier(number) {
    createDossier();
    openLayer(dossierLayer);
    await renderDossier(number);
  }

  function downloadJourney() {
    const payload = {
      ...publicState(),
      exportedAt: new Date().toISOString(),
      completion: state.visited.length / 72,
      records: state.visited.map((number) => {
        const r = record(number);
        const p = parental(number);
        return {
          number,
          angel: r?.angel || null,
          twin: r?.gematriaTwin?.daemon || null,
          thirdName: p?.thirdName || archive(number)?.thirdName || null,
          favorite: state.favorites.includes(number),
          reflection: state.reflections[number] || null
        };
      })
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'temple-of-maat-pilgrim-journey.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function upgradeChant() {
    const chant = document.getElementById('tm524-chant');
    const audio = chant?.querySelector('audio');
    if (!audio) return false;
    // v5.2.5 deliberately leaves source ownership to TempleMediaVault.
    // The exact MP3 is verified and installed locally; no unpublished network asset is implied.
    audio.preload = 'metadata';
    audio.removeAttribute('autoplay');
    return true;
  }

  function observeTemple() {
    if (observer) return;
    observer = new MutationObserver(() => {
      ensureDockControls();
      upgradeChant();
      if (document.body.classList.contains('temple-app-ready')) {
        const number = numberFromHash();
        if (number) markVisited(number);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  function handleHashChange() {
    const number = numberFromHash();
    if (number) {
      state.current = number;
      if (document.body.classList.contains('temple-app-ready')) markVisited(number);
      else persist();
    }
    ensureDockControls();
  }

  function init() {
    installStyles();
    createJourney();
    createDossier();
    ensureDockControls();
    enhanceEntrance();
    upgradeChant();
    observeTemple();
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (journeyLayer && !journeyLayer.hidden) closeLayer(journeyLayer);
      if (dossierLayer && !dossierLayer.hidden) closeLayer(dossierLayer);
    });

    window.TemplePilgrimJourney = Object.freeze({
      version: VERSION,
      state: publicState,
      current: currentNumber,
      start: startJourney,
      visit: markVisited,
      favorite: toggleFavorite,
      reflect: setReflection,
      open: openJourney,
      openDossier,
      download: downloadJourney,
      reset: resetJourney,
      audio: Object.freeze({
        distribution: 'indexeddb-device-install',
        originalMp3Sha256: SOURCE_MP3_SHA256,
        originalMp3Bytes: SOURCE_MP3_BYTES,
        durationSeconds: SOURCE_MP3_DURATION,
        autoplay: false
      })
    });

    document.dispatchEvent(new CustomEvent('temple:living-temple-ready', { detail: { version: VERSION, journey: publicState() } }));
  }

  function waitForCodex() {
    if (window.TempleLivingCodex?.records?.().length === 72) {
      init();
      return;
    }
    document.addEventListener('temple:living-codex-ready', init, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForCodex, { once: true });
  else waitForCodex();
})();
