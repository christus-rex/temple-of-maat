/* Temple of Ma'at v5.2.8 — visitor-facing Temple Library progressive enhancement */
(function () {
  'use strict';

  const STATE_KEY = 'temple_library_personal_state_v1';
  const STATE_SCHEMA = 'temple-of-maat/library-personal-state-v1';
  const CATALOG_URL = './library/catalog.json';
  const TYPES = ['tradition', 'source', 'study', 'discernment', 'correspondence'];
  const LAYERS = ['L1', 'L2', 'L3', 'L4'];
  const RELATIONS = ['thematic-parallel', 'comparative-similarity', 'symbolic-correspondence', 'methodological-parallel'];
  let catalog = null;
  let records = [];
  let byId = new Map();
  let catalogPromise = null;
  let selectedId = null;
  let returnFocus = null;
  let state = loadState();
  const loadedIndexes = new Map();

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(label, onClick, className = 'tm528-btn') {
    const node = el('button', className, label);
    node.type = 'button';
    node.addEventListener('click', onClick);
    return node;
  }

  function now() { return new Date().toISOString(); }

  function emptyState() {
    return { schema: STATE_SCHEMA, updatedAt: now(), bookmarks: [], notes: [], privateCorrespondences: [] };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (!parsed || parsed.schema !== STATE_SCHEMA) return emptyState();
      return {
        schema: STATE_SCHEMA,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : now(),
        bookmarks: Array.isArray(parsed.bookmarks) ? [...new Set(parsed.bookmarks.filter((item) => typeof item === 'string'))] : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes.filter((item) => item && typeof item.recordId === 'string' && typeof item.text === 'string') : [],
        privateCorrespondences: Array.isArray(parsed.privateCorrespondences) ? parsed.privateCorrespondences.filter((item) => item && item.provenanceLayer === 'L4' && item.identityClaim === false) : []
      };
    } catch {
      return emptyState();
    }
  }

  function saveState() {
    state.updatedAt = now();
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
  }

  function ensureStyles() {
    if (document.querySelector('link[data-temple-library-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './styles/v5.2.8-temple-library.css';
    link.dataset.templeLibraryStyle = 'true';
    document.head.appendChild(link);
  }

  function publicRecords(data) {
    return TYPES.flatMap((type) => Array.isArray(data?.[`${type}s`]) ? data[`${type}s`] : []);
  }

  async function loadCatalog() {
    if (catalog) return catalog;
    if (!catalogPromise) {
      catalogPromise = fetch(CATALOG_URL, { headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error(`Library catalog HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (data?.schema !== 'temple-of-maat/library-v1') throw new Error('Unsupported Temple Library catalog schema.');
          catalog = data;
          records = publicRecords(data);
          byId = new Map(records.map((record) => [record.id, record]));
          return data;
        })
        .catch((error) => {
          catalogPromise = null;
          throw error;
        });
    }
    return catalogPromise;
  }

  function recordSearchText(record) {
    return JSON.stringify({
      id: record.id,
      type: record.type,
      title: record.title,
      summary: record.summary,
      layers: record.provenanceLayers,
      tags: record.tags,
      languages: record.languages,
      sourceMetadata: record.sourceMetadata,
      rights: record.rights,
      bibliography: record.bibliography,
      method: record.computationalMethod,
      normalization: record.normalizationProfile
    }).toLowerCase();
  }

  function filteredRecords() {
    const query = (document.getElementById('tm528-search')?.value || '').trim().toLowerCase();
    const type = document.getElementById('tm528-type')?.value || 'all';
    const layer = document.getElementById('tm528-layer-filter')?.value || 'all';
    return records.filter((record) => {
      if (type !== 'all' && record.type !== type) return false;
      if (layer !== 'all' && !record.provenanceLayers?.includes(layer)) return false;
      return !query || recordSearchText(record).includes(query);
    });
  }

  function badges(record) {
    const wrap = el('div', 'tm528-badges');
    wrap.append(el('span', `tm528-badge tm528-badge--${record.type}`, record.type.toUpperCase()));
    (record.provenanceLayers || []).forEach((layer) => wrap.append(el('span', `tm528-badge tm528-badge--${layer.toLowerCase()}`, layer)));
    return wrap;
  }

  function renderResults() {
    const list = document.getElementById('tm528-results');
    const count = document.getElementById('tm528-result-count');
    if (!list) return;
    const filtered = filteredRecords();
    if (count) count.textContent = `${filtered.length} of ${records.length} records`;
    list.replaceChildren();
    if (!filtered.length) {
      list.append(el('p', 'tm528-empty', 'No Library records match those filters.'));
      return;
    }
    filtered.forEach((record) => {
      const item = el('button', `tm528-record${record.id === selectedId ? ' is-selected' : ''}`);
      item.type = 'button';
      item.dataset.id = record.id;
      item.append(badges(record), el('strong', 'tm528-record-title', record.title), el('span', 'tm528-record-summary', record.summary || ''));
      item.addEventListener('click', () => selectRecord(record.id));
      list.append(item);
    });
  }

  function linkedRecordButton(id) {
    const record = byId.get(id);
    if (!record) return el('span', 'tm528-link-missing', id);
    return button(`${record.type}: ${record.title}`, () => selectRecord(id), 'tm528-link-record');
  }

  function detailSection(title, value) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) return null;
    const section = el('section', 'tm528-detail-section');
    section.append(el('h4', '', title));
    if (Array.isArray(value)) {
      const list = el('ul', 'tm528-detail-list');
      value.forEach((item) => {
        const li = el('li');
        li.textContent = typeof item === 'string' ? item : JSON.stringify(item);
        list.append(li);
      });
      section.append(list);
    } else if (typeof value === 'object') {
      const dl = el('dl', 'tm528-kv');
      Object.entries(value).forEach(([key, item]) => {
        if (item === undefined || item === null || item === '') return;
        dl.append(el('dt', '', key), el('dd', '', typeof item === 'string' ? item : JSON.stringify(item)));
      });
      section.append(dl);
    } else {
      section.append(el('p', '', String(value)));
    }
    return section;
  }

  function toggleBookmark(target) {
    const index = state.bookmarks.indexOf(target);
    if (index >= 0) state.bookmarks.splice(index, 1);
    else state.bookmarks.push(target);
    saveState();
    if (target === selectedId) renderReader();
    else renderLoadedIndex(selectedId);
  }

  function noteFor(recordId) {
    return state.notes.find((note) => note.recordId === recordId) || null;
  }

  function saveNote(recordId, text) {
    let note = noteFor(recordId);
    if (!note) {
      note = { id: `note.${recordId.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, recordId, text: '', updatedAt: now() };
      state.notes.push(note);
    }
    note.text = text;
    note.updatedAt = now();
    saveState();
  }

  function correspondenceId(recordId, chamberId, relationType) {
    return `private-correspondence.${recordId.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${chamberId}-${relationType}`;
  }

  function saveCorrespondence(recordId, chamberId, relationType, note) {
    const id = correspondenceId(recordId, chamberId, relationType);
    const record = {
      id,
      fromRecordId: recordId,
      target: { kind: 'chamber', chamberId },
      relationType,
      provenanceLayer: 'L4',
      identityClaim: false,
      note,
      updatedAt: now()
    };
    const existing = state.privateCorrespondences.findIndex((item) => item.id === id);
    if (existing >= 0) state.privateCorrespondences[existing] = record;
    else state.privateCorrespondences.push(record);
    saveState();
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function renderPersonalTools(record, reader) {
    const tools = el('section', 'tm528-personal');
    tools.append(el('h4', '', 'Private study tools'));
    tools.append(el('p', 'tm528-private-note', 'Bookmarks, notes, and chamber correspondences stay on this device unless you explicitly export them. They are never written into the public Library catalog.'));

    const row = el('div', 'tm528-personal-row');
    const bookmark = button(state.bookmarks.includes(record.id) ? 'Remove Bookmark' : 'Bookmark Record', () => toggleBookmark(record.id), 'tm528-btn tm528-btn--secondary');
    row.append(bookmark);
    tools.append(row);

    const noteLabel = el('label', 'tm528-field');
    noteLabel.append(el('span', '', 'Private note'));
    const textarea = document.createElement('textarea');
    textarea.id = 'tm528-note';
    textarea.rows = 5;
    textarea.value = noteFor(record.id)?.text || '';
    textarea.placeholder = 'Your private reflection…';
    noteLabel.append(textarea);
    tools.append(noteLabel);
    const noteStatus = el('span', 'tm528-inline-status', '');
    const save = button('Save Note', () => {
      saveNote(record.id, textarea.value);
      noteStatus.textContent = 'Saved locally.';
    }, 'tm528-btn tm528-btn--secondary');
    tools.append(save, noteStatus);

    const attach = el('div', 'tm528-attach');
    attach.append(el('h5', '', 'Attach as a labeled chamber correspondence'));
    const fields = el('div', 'tm528-attach-grid');
    const chamberLabel = el('label', 'tm528-field');
    chamberLabel.append(el('span', '', 'Chamber'));
    const chamber = document.createElement('select');
    chamber.id = 'tm528-chamber-select';
    for (let n = 1; n <= 72; n += 1) {
      const option = document.createElement('option');
      option.value = String(n).padStart(2, '0');
      option.textContent = `Chamber ${option.value}`;
      chamber.append(option);
    }
    const current = (location.hash.match(/chamber-(\d{1,2})/i) || [])[1];
    if (current) chamber.value = String(Number(current)).padStart(2, '0');
    chamberLabel.append(chamber);

    const relationLabel = el('label', 'tm528-field');
    relationLabel.append(el('span', '', 'Relation'));
    const relation = document.createElement('select');
    relation.id = 'tm528-relation-select';
    RELATIONS.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value.replaceAll('-', ' ');
      relation.append(option);
    });
    relationLabel.append(relation);
    fields.append(chamberLabel, relationLabel);
    attach.append(fields);

    const corrNoteLabel = el('label', 'tm528-field');
    corrNoteLabel.append(el('span', '', 'Optional correspondence note'));
    const corrNote = document.createElement('input');
    corrNote.id = 'tm528-corr-note';
    corrNote.type = 'text';
    corrNote.placeholder = 'Why this connection matters to you…';
    corrNoteLabel.append(corrNote);
    attach.append(corrNoteLabel);
    const corrStatus = el('span', 'tm528-inline-status', '');
    attach.append(button('Save Private Correspondence', () => {
      saveCorrespondence(record.id, chamber.value, relation.value, corrNote.value);
      corrStatus.textContent = `Saved locally as L4 · identityClaim:false · Chamber ${chamber.value}.`;
    }, 'tm528-btn tm528-btn--secondary'), corrStatus);
    tools.append(attach);
    reader.append(tools);
  }

  function fragmentFor(kind, item, index) {
    if (kind === 'chapters') return `chapter:${item.number ?? index + 1}`;
    if (kind === 'sections') return `section:${item.number ?? index + 1}`;
    if (kind === 'surahs') return `surah:${item.number ?? index + 1}`;
    if (kind === 'appendices') return `appendix:${item.id ?? index + 1}`;
    if (kind === 'selectedAddresses') return `ayah:${item.address ?? index + 1}`;
    if (kind === 'manuscriptSubjects') return `subject:${item.key ?? index + 1}`;
    if (kind === 'parts') return `part:${item.number ?? index + 1}`;
    return `${kind}:${index + 1}`;
  }

  function entryTitle(item, index) {
    return item.title || item.name || item.label || item.address || item.key || `Entry ${index + 1}`;
  }

  function renderIndexCollection(recordId, kind, items) {
    if (!Array.isArray(items) || !items.length) return null;
    const section = el('section', 'tm528-index-section');
    section.append(el('h5', '', kind.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())));
    const list = el('div', 'tm528-index-list');
    items.forEach((item, index) => {
      const fragment = fragmentFor(kind, item, index);
      const target = `${recordId}#${fragment}`;
      const row = el('article', 'tm528-index-entry');
      const text = el('div', 'tm528-index-entry-text');
      text.append(el('strong', '', entryTitle(item, index)));
      const meta = [];
      if (item.layer) meta.push(item.layer);
      if (item.stratum) meta.push(item.stratum);
      if (item.pageStart) meta.push(`p. ${item.pageStart}`);
      if (item.siglum) meta.push(item.siglum);
      if (item.keywords?.length) meta.push(item.keywords.join(', '));
      if (meta.length) text.append(el('span', 'tm528-index-meta', meta.join(' · ')));
      row.append(text, button(state.bookmarks.includes(target) ? 'Bookmarked' : 'Bookmark', () => toggleBookmark(target), 'tm528-passage-bookmark'));
      list.append(row);
    });
    section.append(list);
    return section;
  }

  function renderLoadedIndex(recordId) {
    const host = document.getElementById('tm528-index-host');
    if (!host || recordId !== selectedId) return;
    const data = loadedIndexes.get(recordId);
    if (!data) return;
    host.replaceChildren();
    host.append(el('p', 'tm528-index-status', 'Index loaded progressively. This does not place the full source volume in the initial Temple shell.'));
    ['parts', 'chapters', 'sections', 'surahs', 'appendices', 'selectedAddresses', 'manuscriptSubjects'].forEach((kind) => {
      const section = renderIndexCollection(recordId, kind, data[kind]);
      if (section) host.append(section);
    });
    const extra = ['sourceBasis', 'methodLayers', 'methods', 'methodProfiles', 'normalizationProfile', 'claimsPolicy', 'publicationLimits', 'corpusAudit', 'corpusIntegrity', 'rights', 'titleArchitecture', 'ruleOfDiscernment', 'ethicalBoundary'];
    extra.forEach((key) => {
      const section = detailSection(key.replace(/([A-Z])/g, ' $1'), data[key]);
      if (section) host.append(section);
    });
  }

  async function loadRecordIndex(record) {
    const host = document.getElementById('tm528-index-host');
    if (!host || !record.contentLocation) return;
    host.replaceChildren(el('p', 'tm528-index-status', 'Loading index…'));
    try {
      let data = loadedIndexes.get(record.id);
      if (!data) {
        const response = await fetch(`./${record.contentLocation}`, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
        loadedIndexes.set(record.id, data);
      }
      if (selectedId === record.id) renderLoadedIndex(record.id);
    } catch (error) {
      host.replaceChildren(el('p', 'tm528-error', `This Library index could not be loaded. The core Temple remains available. ${error.message}`));
    }
  }

  function renderReader() {
    const reader = document.getElementById('tm528-reader');
    if (!reader) return;
    const record = byId.get(selectedId);
    reader.replaceChildren();
    if (!record) {
      reader.append(el('p', 'tm528-empty', 'Choose a Library record to read its provenance and metadata.'));
      return;
    }
    reader.append(badges(record), el('h3', 'tm528-reader-title', record.title), el('p', 'tm528-reader-summary', record.summary || ''));
    reader.append(el('code', 'tm528-record-id', record.id));

    const linked = el('section', 'tm528-detail-section');
    const linkIds = [...(record.traditionIds || []), ...(record.sourceIds || []), ...(record.studyIds || [])];
    if (linkIds.length) {
      linked.append(el('h4', '', 'Linked Library records'));
      const linkWrap = el('div', 'tm528-link-wrap');
      linkIds.forEach((id) => linkWrap.append(linkedRecordButton(id)));
      linked.append(linkWrap);
      reader.append(linked);
    }

    [
      ['Source metadata', record.sourceMetadata],
      ['Attribution / rights / license', record.rights],
      ['Integrity', record.integrity],
      ['Normalization profile', record.normalizationProfile],
      ['Computational method', record.computationalMethod],
      ['Languages', record.languages],
      ['Themes / tags', record.tags],
      ['Bibliography / references', record.bibliography]
    ].forEach(([title, value]) => {
      const section = detailSection(title, value);
      if (section) reader.append(section);
    });

    if (record.contentLocation) {
      const indexSection = el('section', 'tm528-detail-section tm528-index-shell');
      indexSection.append(el('h4', '', record.type === 'source' ? 'Source index' : 'Study index'));
      indexSection.append(el('p', 'tm528-index-note', 'Loaded only when requested. Large source content is not eagerly precached.'));
      indexSection.append(button(loadedIndexes.has(record.id) ? 'Show Loaded Index' : 'Load Index', () => {
        if (loadedIndexes.has(record.id)) renderLoadedIndex(record.id);
        else loadRecordIndex(record);
      }, 'tm528-btn tm528-btn--secondary'));
      const host = el('div', 'tm528-index-host');
      host.id = 'tm528-index-host';
      indexSection.append(host);
      reader.append(indexSection);
      if (loadedIndexes.has(record.id)) renderLoadedIndex(record.id);
    }

    renderPersonalTools(record, reader);
  }

  function selectRecord(id) {
    if (!byId.has(id)) return;
    selectedId = id;
    renderResults();
    renderReader();
    document.getElementById('tm528-reader')?.scrollTo({ top: 0 });
  }

  function createLayer() {
    if (document.getElementById('tm528-library')) return;
    const layer = el('div', 'tm528-layer');
    layer.id = 'tm528-library';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'tm528-title');
    const panel = el('section', 'tm528-panel');
    const header = el('header', 'tm528-header');
    const titleWrap = el('div');
    titleWrap.append(el('p', 'tm528-eyebrow', 'Temple Library · provenance first'), el('h2', '', 'The Living Research Library'));
    titleWrap.querySelector('h2').id = 'tm528-title';
    const close = button('Close', closeLibrary, 'tm528-close');
    close.setAttribute('aria-label', 'Close Temple Library');
    header.append(titleWrap, close);

    const controls = el('div', 'tm528-controls');
    const searchLabel = el('label', 'tm528-field tm528-search-field');
    searchLabel.append(el('span', '', 'Search'));
    const search = document.createElement('input');
    search.id = 'tm528-search';
    search.type = 'search';
    search.placeholder = 'Title, theme, source metadata, method…';
    search.addEventListener('input', renderResults);
    searchLabel.append(search);

    const typeLabel = el('label', 'tm528-field');
    typeLabel.append(el('span', '', 'Record type'));
    const type = document.createElement('select');
    type.id = 'tm528-type';
    ['all', ...TYPES].forEach((value) => {
      const option = document.createElement('option'); option.value = value; option.textContent = value === 'all' ? 'All types' : value;
      type.append(option);
    });
    type.addEventListener('change', renderResults);
    typeLabel.append(type);

    const layerLabel = el('label', 'tm528-field');
    layerLabel.append(el('span', '', 'Provenance'));
    const layerFilter = document.createElement('select');
    layerFilter.id = 'tm528-layer-filter';
    ['all', ...LAYERS].forEach((value) => {
      const option = document.createElement('option'); option.value = value; option.textContent = value === 'all' ? 'All layers' : value;
      layerFilter.append(option);
    });
    layerFilter.addEventListener('change', renderResults);
    layerLabel.append(layerFilter);
    controls.append(searchLabel, typeLabel, layerLabel);

    const statusRow = el('div', 'tm528-status-row');
    statusRow.append(el('span', 'tm528-status', 'Library catalog loads only when opened.'), el('span', 'tm528-result-count', ''));
    statusRow.querySelector('.tm528-status').id = 'tm528-status';
    statusRow.querySelector('.tm528-result-count').id = 'tm528-result-count';

    const body = el('div', 'tm528-body');
    const results = el('nav', 'tm528-results'); results.id = 'tm528-results'; results.setAttribute('aria-label', 'Library records');
    const reader = el('main', 'tm528-reader'); reader.id = 'tm528-reader';
    body.append(results, reader);

    const footer = el('footer', 'tm528-footer');
    footer.append(el('span', '', 'Personal Library state stays local unless exported.'), button('Export Personal Library JSON', () => downloadJson('temple-of-maat-library-personal-state.json', state), 'tm528-btn tm528-btn--ghost'));
    panel.append(header, controls, statusRow, body, footer);
    layer.append(panel);
    document.body.append(layer);
    layer.addEventListener('click', (event) => { if (event.target === layer) closeLibrary(); });
  }

  async function openLibrary(recordId) {
    createLayer();
    returnFocus = document.activeElement;
    const layer = document.getElementById('tm528-library');
    layer.hidden = false;
    document.body.classList.add('temple-library-open');
    const status = document.getElementById('tm528-status');
    if (status) status.textContent = 'Loading Library catalog…';
    try {
      await loadCatalog();
      if (status) status.textContent = `Ready · ${records.length} public research records · personal state remains local.`;
      const desired = recordId && byId.has(recordId) ? recordId : (selectedId && byId.has(selectedId) ? selectedId : records[0]?.id);
      renderResults();
      if (desired) selectRecord(desired); else renderReader();
      document.getElementById('tm528-search')?.focus();
    } catch (error) {
      if (status) status.textContent = 'Library unavailable. The 72-chamber Temple remains fully usable.';
      const reader = document.getElementById('tm528-reader');
      reader?.replaceChildren(el('p', 'tm528-error', `The Library catalog could not be loaded: ${error.message}`));
    }
  }

  function closeLibrary() {
    const layer = document.getElementById('tm528-library');
    if (!layer) return;
    layer.hidden = true;
    document.body.classList.remove('temple-library-open');
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
  }

  function installLauncher() {
    const installIntoDock = () => {
      const dock = document.getElementById('tm524-dock');
      if (!dock || dock.querySelector('[data-temple-library-launcher]')) return false;
      const chamber = document.getElementById('tm524-dock-chamber');
      const launcher = button('Library', () => openLibrary(), 'tm524-dock-btn');
      launcher.dataset.templeLibraryLauncher = 'dock';
      if (chamber) dock.insertBefore(launcher, chamber); else dock.append(launcher);
      document.querySelector('[data-temple-library-launcher="fallback"]')?.remove();
      return true;
    };
    if (installIntoDock()) return;
    const observer = new MutationObserver(() => { if (installIntoDock()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      if (installIntoDock()) return;
      if (!document.querySelector('[data-temple-library-launcher="fallback"]')) {
        const fallback = button('Library', () => openLibrary(), 'tm528-launcher');
        fallback.dataset.templeLibraryLauncher = 'fallback';
        document.body.append(fallback);
      }
    }, 3500);
  }

  function handleKeys(event) {
    if (event.key === 'Escape' && !document.getElementById('tm528-library')?.hidden) closeLibrary();
  }

  function initialize() {
    ensureStyles();
    createLayer();
    installLauncher();
    document.addEventListener('keydown', handleKeys);
  }

  try {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();

    window.TempleLibrary = Object.freeze({
      open: openLibrary,
      close: closeLibrary,
      async search(query) {
        await openLibrary();
        const input = document.getElementById('tm528-search');
        if (input) { input.value = String(query || ''); renderResults(); }
        return filteredRecords().map((record) => record.id);
      },
      state() { return structuredClone(state); },
      catalog() { return catalog ? structuredClone(catalog) : null; },
      select: selectRecord,
      exportPersonalState() { downloadJson('temple-of-maat-library-personal-state.json', state); }
    });
  } catch (error) {
    console.warn('Temple Library enhancement did not initialize; core Temple remains available.', error);
  }
})();
