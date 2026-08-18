/* Temple of SOL-OM-ON (Ma'at) v5.5 — Living Archive / unified search */
(function () {
  'use strict';

  if (window.__templeLivingArchiveInstalled) return;
  window.__templeLivingArchiveInstalled = true;

  const VERSION = '5.5.0';
  const MANIFEST_URL = './data/living-archive-v5.5.json';
  const LIBRARY_URL = './library/catalog.json';
  const CHAMBERS_URL = './chambers.json';
  const STATE_KEY = 'temple_living_archive_state_v1';
  const TYPES = ['all', 'chamber', 'poem', 'text', 'artwork', 'audio', 'gematria', 'source', 'study', 'discernment', 'correspondence', 'tradition'];
  let indexPromise = null;
  let records = [];
  let selectedId = null;
  let returnFocus = null;
  let showFavoritesOnly = false;
  let state = loadState();

  function safeStorage() {
    try { return window.localStorage; } catch (_) { return null; }
  }

  function loadState() {
    const fallback = { schema: 1, favorites: [], recent: [], updatedAt: new Date().toISOString() };
    try {
      const parsed = JSON.parse(safeStorage()?.getItem(STATE_KEY) || 'null');
      if (!parsed || parsed.schema !== 1) return fallback;
      return {
        schema: 1,
        favorites: Array.isArray(parsed.favorites) ? [...new Set(parsed.favorites.filter((v) => typeof v === 'string'))] : [],
        recent: Array.isArray(parsed.recent) ? parsed.recent.filter((v) => typeof v === 'string').slice(0, 18) : [],
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : fallback.updatedAt
      };
    } catch (_) { return fallback; }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    try { safeStorage()?.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
    window.dispatchEvent(new CustomEvent('temple:living-archive-state', { detail: structuredClone(state) }));
  }

  function remember(id) {
    state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 18);
    saveState();
  }

  function toggleFavorite(id) {
    if (state.favorites.includes(id)) state.favorites = state.favorites.filter((item) => item !== id);
    else state.favorites.push(id);
    saveState();
    renderResults();
    renderReader();
  }

  function ensureStyle() {
    if (document.querySelector('link[data-temple-living-archive-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './styles/v5.5-living-archive.css';
    link.dataset.templeLivingArchiveStyle = VERSION;
    document.head.appendChild(link);
  }

  function text(value) { return String(value ?? '').trim(); }
  function array(value) { return Array.isArray(value) ? value.filter(Boolean) : []; }
  function short(value, max = 170) {
    const normalized = text(value).replace(/\s+/g, ' ');
    return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
  }

  function normalize(record, fallbackType) {
    const type = text(record.type || fallbackType || 'text').toLowerCase();
    return {
      id: text(record.id || `${type}.${record.title || Math.random()}`),
      type,
      title: text(record.title || record.name || 'Untitled archive record'),
      summary: text(record.summary || record.subtitle || record.description || record.office || ''),
      tags: array(record.tags),
      provenanceLayers: array(record.provenanceLayers),
      href: text(record.href || record.sourceUrl || record.url || ''),
      sourceId: text(record.sourceId || ''),
      chamberId: text(record.chamberId || ''),
      raw: record
    };
  }

  function catalogRecords(catalog) {
    const groups = ['traditions', 'sources', 'studies', 'discernments', 'correspondences'];
    return groups.flatMap((group) => array(catalog?.[group]).map((item) => normalize(item, item.type || group.replace(/s$/, ''))));
  }

  function chamberRecords(data) {
    return array(data?.chambers).map((chamber) => normalize({
      id: `chamber.${chamber.id}`,
      type: 'chamber',
      title: `Chamber ${chamber.id} · ${chamber.thirdName || chamber.office || ''}`,
      summary: [chamber.office, chamber.law, chamber.fire?.name, chamber.angel && `Angel ${chamber.angel}`, chamber.daemon && `Daemon ${chamber.daemon}`].filter(Boolean).join(' · '),
      tags: ['chamber', chamber.pillar, chamber.fire?.name, chamber.angel, chamber.daemon, chamber.thirdName].filter(Boolean),
      provenanceLayers: ['L4'],
      href: `#chamber-${chamber.id}`,
      chamberId: chamber.id,
      number: chamber.number,
      law: chamber.law,
      fire: chamber.fire,
      angel: chamber.angel,
      daemon: chamber.daemon
    }, 'chamber'));
  }

  function manifestRecords(manifest) {
    const poems = array(manifest?.poems).map((item) => normalize(item, 'poem'));
    const collections = array(manifest?.collections).map((item) => normalize(item, item.type || 'text'));
    const preservation = normalize({
      id: 'preservation.v5.5',
      type: 'text',
      title: 'Temple v5.5 Preservation Architecture',
      summary: 'Google Drive preservation root for artwork, audio, text/PDF masters, release backups, manifests, and provenance records.',
      href: manifest?.drive?.preservationRoot?.url,
      tags: ['preservation', 'google-drive', 'masters', 'provenance', 'release-backups'],
      provenanceLayers: ['L2']
    }, 'text');
    return [...poems, ...collections, preservation];
  }

  function dedupe(list) {
    const map = new Map();
    list.forEach((item) => { if (item?.id && !map.has(item.id)) map.set(item.id, item); });
    return [...map.values()];
  }

  async function loadIndex() {
    if (records.length) return records;
    if (!indexPromise) {
      indexPromise = Promise.all([
        fetch(MANIFEST_URL, { headers: { Accept: 'application/json' } }).then((r) => { if (!r.ok) throw new Error(`Living Archive manifest HTTP ${r.status}`); return r.json(); }),
        fetch(LIBRARY_URL, { headers: { Accept: 'application/json' } }).then((r) => { if (!r.ok) throw new Error(`Library catalog HTTP ${r.status}`); return r.json(); }),
        fetch(CHAMBERS_URL, { headers: { Accept: 'application/json' } }).then((r) => { if (!r.ok) throw new Error(`Chambers HTTP ${r.status}`); return r.json(); })
      ]).then(([manifest, library, chambers]) => {
        if (manifest?.schema !== 'temple-of-maat/living-archive-v1') throw new Error('Unsupported Living Archive manifest schema.');
        records = dedupe([...manifestRecords(manifest), ...catalogRecords(library), ...chamberRecords(chambers)]);
        window.dispatchEvent(new CustomEvent('temple:living-archive-ready', { detail: { version: VERSION, count: records.length } }));
        return records;
      }).catch((error) => {
        indexPromise = null;
        throw error;
      });
    }
    return indexPromise;
  }

  function searchText(record) {
    return JSON.stringify({ id: record.id, type: record.type, title: record.title, summary: record.summary, tags: record.tags, layers: record.provenanceLayers, raw: record.raw }).toLowerCase();
  }

  function filteredRecords() {
    const query = text(document.getElementById('tla-search')?.value).toLowerCase();
    const type = text(document.getElementById('tla-type')?.value || 'all');
    let list = records.filter((record) => (type === 'all' || record.type === type) && (!query || searchText(record).includes(query)));
    if (showFavoritesOnly) list = list.filter((record) => state.favorites.includes(record.id));
    if (!query && type === 'all' && !showFavoritesOnly && state.recent.length) {
      const order = new Map(state.recent.map((id, index) => [id, index]));
      list.sort((a, b) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999));
    }
    return list;
  }

  function create(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function createLayer() {
    if (document.getElementById('temple-living-archive')) return;
    ensureStyle();
    const layer = create('section', 'temple-living-archive');
    layer.id = 'temple-living-archive';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'tla-title');
    layer.innerHTML = `
      <div class="temple-living-archive__panel">
        <header class="temple-living-archive__header">
          <div><div class="temple-living-archive__eyebrow">Temple v5.5 · Living Archive</div><h2 id="tla-title">Search the Temple</h2></div>
          <button class="temple-living-archive__close" type="button" aria-label="Close Living Archive">×</button>
        </header>
        <div class="temple-living-archive__controls">
          <input id="tla-search" class="temple-living-archive__search" type="search" placeholder="Search chambers, poems, texts, art, audio, gematria…" aria-label="Search the Living Archive">
          <select id="tla-type" class="temple-living-archive__filter" aria-label="Filter Living Archive by type"></select>
          <button id="tla-favorites" class="temple-living-archive__toggle" type="button" aria-pressed="false">Favorites</button>
        </div>
        <div class="temple-living-archive__body">
          <nav id="tla-results" class="temple-living-archive__results" aria-label="Living Archive search results"></nav>
          <main id="tla-reader" class="temple-living-archive__reader" tabindex="-1"></main>
        </div>
        <footer class="temple-living-archive__footer"><span id="tla-status" class="temple-living-archive__status">Archive loads when opened.</span><span>Favorites and recents remain local to this browser.</span></footer>
      </div>`;
    document.body.appendChild(layer);
    const type = layer.querySelector('#tla-type');
    TYPES.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value === 'all' ? 'All types' : value[0].toUpperCase() + value.slice(1);
      type.appendChild(option);
    });
    layer.querySelector('.temple-living-archive__close').addEventListener('click', close);
    layer.addEventListener('click', (event) => { if (event.target === layer) close(); });
    layer.querySelector('#tla-search').addEventListener('input', renderResults);
    type.addEventListener('change', renderResults);
    layer.querySelector('#tla-favorites').addEventListener('click', () => {
      showFavoritesOnly = !showFavoritesOnly;
      const button = document.getElementById('tla-favorites');
      button?.setAttribute('aria-pressed', String(showFavoritesOnly));
      if (button) button.textContent = showFavoritesOnly ? 'All Records' : 'Favorites';
      renderResults();
    });
  }

  function installLauncher() {
    if (document.querySelector('[data-temple-living-archive-launcher]')) return;
    const button = create('button', 'temple-living-archive-launcher');
    button.type = 'button';
    button.dataset.templeLivingArchiveLauncher = VERSION;
    button.setAttribute('aria-label', 'Open Living Archive search');
    button.innerHTML = '<span aria-hidden="true">⌕</span><span>Archive</span>';
    button.addEventListener('click', () => open());
    document.body.appendChild(button);
  }

  function renderResults() {
    const host = document.getElementById('tla-results');
    if (!host) return;
    const list = filteredRecords();
    host.replaceChildren();
    const status = document.getElementById('tla-status');
    if (status) status.textContent = `${list.length} of ${records.length} records`;
    if (!list.length) {
      host.appendChild(create('p', 'temple-living-archive__empty', 'No archive records match those filters.'));
      renderReader();
      return;
    }
    if (!selectedId || !list.some((record) => record.id === selectedId)) selectedId = list[0].id;
    list.forEach((record) => {
      const item = create('button', 'temple-living-archive__result');
      item.type = 'button';
      item.dataset.recordId = record.id;
      item.setAttribute('aria-current', String(record.id === selectedId));
      const badge = create('span', 'temple-living-archive__badge', record.type);
      const title = create('strong', '', record.title);
      const summary = create('small', '', short(record.summary || record.tags.join(' · '), 125));
      item.append(badge, title, summary);
      item.addEventListener('click', () => { selectedId = record.id; remember(record.id); renderResults(); renderReader(); });
      host.appendChild(item);
    });
    renderReader();
  }

  function currentRecord() { return records.find((record) => record.id === selectedId) || null; }

  function action(label, handler, href) {
    const node = href ? create('a', 'temple-living-archive__action', label) : create('button', 'temple-living-archive__action', label);
    if (href) { node.href = href; if (/^https?:/i.test(href)) { node.target = '_blank'; node.rel = 'noopener noreferrer'; } }
    else { node.type = 'button'; node.addEventListener('click', handler); }
    return node;
  }

  function openPoem(record) {
    close(false);
    const gateway = document.querySelector('[data-poems-chamber]');
    if (gateway) gateway.click();
    else location.hash = 'poems-chamber';
    setTimeout(() => {
      const card = [...document.querySelectorAll('.temple-poem-card')].find((node) => node.textContent.includes(record.title));
      card?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }, 200);
  }

  function openLibrary(record) {
    remember(record.id);
    close(false);
    if (window.TempleLibrary?.open) window.TempleLibrary.open(record.id);
    else location.hash = 'temple-library';
  }

  function openChamber(record) {
    remember(record.id);
    close(false);
    location.hash = `chamber-${record.chamberId || record.id.replace(/^chamber\./, '')}`;
  }

  function primaryOpen(record) {
    if (record.type === 'chamber') return openChamber(record);
    if (record.type === 'poem' && /^poem-/.test(record.id)) return openPoem(record);
    if (['source', 'study', 'discernment', 'correspondence', 'tradition'].includes(record.type)) return openLibrary(record);
    if (record.id === 'collection.temple-library') { close(false); return window.TempleLibrary?.open?.(); }
    if (record.id === 'collection.poems-chamber' || record.id === 'collection.depiction-gallery') return openPoem({ title: '' });
    if (record.href) {
      if (record.href.startsWith('#')) { close(false); location.hash = record.href.slice(1); }
      else if (/^https?:/i.test(record.href)) window.open(record.href, '_blank', 'noopener,noreferrer');
      else location.href = record.href;
    }
  }

  function renderReader() {
    const host = document.getElementById('tla-reader');
    if (!host) return;
    const record = currentRecord();
    host.replaceChildren();
    if (!record) {
      host.append(create('p', 'temple-living-archive__empty', 'Choose a record from the archive.'));
      return;
    }
    const meta = create('div', 'temple-living-archive__meta');
    meta.appendChild(create('span', 'temple-living-archive__badge', record.type));
    record.provenanceLayers.forEach((layer) => meta.appendChild(create('span', 'temple-living-archive__badge', layer)));
    host.append(meta, create('h3', '', record.title));
    if (record.summary) host.appendChild(create('p', '', record.summary));
    if (record.tags.length) host.appendChild(create('div', 'temple-living-archive__tags', `Tags · ${record.tags.join(' · ')}`));
    const actions = create('div', 'temple-living-archive__actions');
    actions.appendChild(action('Open', () => primaryOpen(record)));
    actions.appendChild(action(state.favorites.includes(record.id) ? 'Remove Favorite' : 'Add Favorite', () => toggleFavorite(record.id)));
    if (record.href && /^https?:/i.test(record.href)) actions.appendChild(action('Open Source', null, record.href));
    if (record.raw?.sourceUrl && record.raw.sourceUrl !== record.href) actions.appendChild(action('Open Preserved Source', null, record.raw.sourceUrl));
    host.appendChild(actions);
  }

  async function open(options = {}) {
    createLayer();
    installLauncher();
    returnFocus = document.activeElement;
    const layer = document.getElementById('temple-living-archive');
    layer.hidden = false;
    document.body.classList.add('temple-living-archive-open');
    const status = document.getElementById('tla-status');
    if (status) status.textContent = 'Loading archive index…';
    try {
      await loadIndex();
      if (options.query !== undefined) document.getElementById('tla-search').value = text(options.query);
      if (options.type && TYPES.includes(options.type)) document.getElementById('tla-type').value = options.type;
      if (options.recordId && records.some((record) => record.id === options.recordId)) selectedId = options.recordId;
      renderResults();
      document.getElementById('tla-search')?.focus();
    } catch (error) {
      if (status) status.textContent = 'Archive index unavailable; core Temple remains available.';
      const reader = document.getElementById('tla-reader');
      reader?.replaceChildren(create('p', 'temple-living-archive__empty', `Unable to load archive: ${error.message}`));
    }
  }

  function close(restoreFocus = true) {
    const layer = document.getElementById('temple-living-archive');
    if (!layer) return;
    layer.hidden = true;
    document.body.classList.remove('temple-living-archive-open');
    if (restoreFocus && returnFocus?.focus) returnFocus.focus();
  }

  function handleKeys(event) {
    if (event.key === 'Escape' && !document.getElementById('temple-living-archive')?.hidden) close();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && document.body.classList.contains('temple-app-ready')) {
      event.preventDefault();
      open();
    }
  }

  function initialize() {
    ensureStyle();
    createLayer();
    installLauncher();
    document.addEventListener('keydown', handleKeys);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();

  window.TempleLivingArchive = Object.freeze({
    version: VERSION,
    open,
    close,
    async search(query, type = 'all') {
      await loadIndex();
      const q = text(query).toLowerCase();
      return records.filter((record) => (type === 'all' || record.type === type) && (!q || searchText(record).includes(q))).map((record) => structuredClone(record));
    },
    async records() { await loadIndex(); return records.map((record) => structuredClone(record)); },
    state() { return structuredClone(state); },
    favorite(id) { if (!records.some((record) => record.id === id)) return false; toggleFavorite(id); return state.favorites.includes(id); }
  });
})();
