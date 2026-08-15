import { installTempleResearchNotebook } from './v5.3.0-research-notebook.mjs';

export const RESEARCH_NOTEBOOK_UI_SCHEMA = 'temple-of-maat/research-notebook-ui-v1';
export const RESEARCH_NOTEBOOK_UI_VERSION = '1.0.0';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, handler, className = 'tm530-notebook-button') {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
}

function installStyles() {
  if (document.querySelector('link[data-temple-research-notebook-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './styles/v5.3.0-research-notebook.css';
  link.dataset.templeResearchNotebookStyle = 'true';
  document.head.appendChild(link);
}

function citationLabel(resolved) {
  if (!resolved) return 'Unresolved citation';
  const { kind, id, canonical, inspection } = resolved;
  if (kind === 'endpoint') {
    const mapped = inspection?.mapped ? 'reviewed Kernel mapping' : 'graph endpoint; no reviewed Kernel mapping';
    return `${id} · ${mapped}`;
  }
  const title = canonical?.displayName || canonical?.title || canonical?.label || canonical?.recordId || canonical?.id || id;
  return `${title}`;
}

export async function installTempleResearchNotebookUI(options = {}) {
  if (window.TempleResearchNotebookUI?.schema === RESEARCH_NOTEBOOK_UI_SCHEMA) return window.TempleResearchNotebookUI;
  installStyles();
  const notebook = options.notebook || await installTempleResearchNotebook(options.notebookOptions || {});

  let layer = null;
  let list = null;
  let editor = null;
  let returnFocus = null;
  let draft = null;
  let dirty = false;
  let observer = null;

  function comparisonSnapshot() {
    try { return window.TempleComparativeReading?.last?.() || null; } catch { return null; }
  }

  function createLayer() {
    if (layer) return;
    layer = el('div', 'tm530-notebook-layer');
    layer.id = 'tm530-research-notebook';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('aria-labelledby', 'tm530-research-notebook-title');

    const scrim = button('', close, 'tm530-notebook-scrim');
    scrim.setAttribute('aria-label', 'Close Private Research Notebook');
    const panel = el('section', 'tm530-notebook-panel');
    const header = el('header', 'tm530-notebook-header');
    const titles = el('div');
    titles.append(el('p', 'tm530-notebook-eyebrow', 'Private Research Workspace · Device Local'));
    const title = el('h2', '', 'Research Notebook');
    title.id = 'tm530-research-notebook-title';
    titles.append(title);
    const closeButton = button('×', close, 'tm530-notebook-close');
    closeButton.setAttribute('aria-label', 'Close Private Research Notebook');
    header.append(titles, closeButton);

    const body = el('div', 'tm530-notebook-body');
    body.append(el('p', 'tm530-notebook-covenant', 'Your note remains private on this device. Canonical claim, passage, source, and endpoint IDs may be cited here, but the note itself never becomes Relationship Graph or Knowledge Kernel evidence. Nothing is persisted until you explicitly choose Save Entry.'));
    const layout = el('div', 'tm530-notebook-layout');
    const sidebar = el('aside', 'tm530-notebook-sidebar');
    sidebar.append(el('h3', '', 'Private Entries'));
    list = el('div', 'tm530-notebook-list');
    sidebar.append(list);
    editor = el('section', 'tm530-notebook-editor');
    layout.append(sidebar, editor);
    body.append(layout);

    const footer = el('footer', 'tm530-notebook-footer');
    footer.append(
      button('New Blank Entry', () => beginDraft(notebook.createDraft())),
      button('Draft from Current Comparison', beginFromCurrentComparison, 'tm530-notebook-button tm530-notebook-button--primary'),
      button('Export Private Notebook JSON', downloadState)
    );
    body.append(footer, el('p', 'tm530-notebook-private', 'Private state key: temple_research_notebook_v1 · no cloud upload · no graph mutation · no Knowledge Kernel mutation.'));
    panel.append(header, body);
    layer.append(scrim, panel);
    document.body.append(layer);
  }

  function renderList() {
    if (!list) return;
    list.replaceChildren();
    const entries = notebook.entries();
    if (!entries.length) {
      list.append(el('p', 'tm530-notebook-empty', 'No saved research entries yet. A comparison can prepare a draft, but it is not stored until Save Entry is pressed.'));
      return;
    }
    entries.forEach((entry) => {
      const item = button(entry.title.trim() || 'Untitled research note', () => beginDraft(entry), `tm530-notebook-item${draft?.id === entry.id ? ' is-current' : ''}`);
      item.append(el('span', '', `${entry.stage} · ${entry.citations.length} citation${entry.citations.length === 1 ? '' : 's'}`));
      list.append(item);
    });
  }

  function citationCard(citation) {
    const resolved = notebook.resolveCitation(citation);
    const card = el('div', 'tm530-notebook-citation');
    card.append(el('strong', '', `${citation.kind.toUpperCase()} · ${citation.id}`));
    card.append(el('p', '', citationLabel(resolved)));
    return card;
  }

  function readEditor() {
    if (!editor || !draft) return draft;
    return {
      ...draft,
      title: editor.querySelector('[data-notebook-title]')?.value || '',
      stage: editor.querySelector('[data-notebook-stage]')?.value || 'note',
      body: editor.querySelector('[data-notebook-body]')?.value || ''
    };
  }

  function renderEditor() {
    if (!editor) return;
    editor.replaceChildren();
    if (!draft) {
      editor.append(el('h3', '', 'Select or create an entry'), el('p', 'tm530-notebook-empty', 'Use “Draft from Current Comparison” to prepare a private note with canonical citations, or start with a blank entry. Draft preparation alone does not write to storage.'));
      return;
    }

    editor.append(el('p', 'tm530-notebook-eyebrow', 'Unsaved Private Draft'), el('h3', '', draft.title || 'Untitled Research Entry'));

    const titleField = el('div', 'tm530-notebook-field');
    const titleLabel = el('label', '', 'Title');
    titleLabel.htmlFor = 'tm530-notebook-entry-title';
    const titleInput = el('input');
    titleInput.id = 'tm530-notebook-entry-title';
    titleInput.maxLength = 200;
    titleInput.value = draft.title;
    titleInput.dataset.notebookTitle = 'true';
    titleField.append(titleLabel, titleInput);

    const stageField = el('div', 'tm530-notebook-field');
    const stageLabel = el('label', '', 'Working stage');
    stageLabel.htmlFor = 'tm530-notebook-entry-stage';
    const stageSelect = el('select');
    stageSelect.id = 'tm530-notebook-entry-stage';
    stageSelect.dataset.notebookStage = 'true';
    ['note', 'question', 'hypothesis', 'practice'].forEach((value) => {
      const option = el('option', '', value[0].toUpperCase() + value.slice(1));
      option.value = value;
      option.selected = draft.stage === value;
      stageSelect.append(option);
    });
    stageField.append(stageLabel, stageSelect);

    const bodyField = el('div', 'tm530-notebook-field');
    const bodyLabel = el('label', '', 'Private reflection');
    bodyLabel.htmlFor = 'tm530-notebook-entry-body';
    const textarea = el('textarea');
    textarea.id = 'tm530-notebook-entry-body';
    textarea.maxLength = 20000;
    textarea.value = draft.body;
    textarea.dataset.notebookBody = 'true';
    bodyField.append(bodyLabel, textarea);

    editor.append(titleField, stageField, bodyField);
    if (draft.citations.length) {
      editor.append(el('h3', '', `Canonical citations · ${draft.citations.length}`));
      const citations = el('div', 'tm530-notebook-citations');
      draft.citations.forEach((citation) => citations.append(citationCard(citation)));
      editor.append(citations);
    } else {
      editor.append(el('p', 'tm530-notebook-empty', 'No canonical citations are attached to this draft.'));
    }

    const status = el('p', 'tm530-notebook-status', dirty ? 'Draft changed — not saved.' : 'Draft is not persisted until Save Entry is pressed.');
    status.dataset.notebookStatus = 'true';
    const actions = el('div', 'tm530-notebook-actions');
    actions.append(
      button('Save Entry', saveCurrent, 'tm530-notebook-button tm530-notebook-button--primary'),
      button('Discard Draft Changes', discardChanges)
    );
    if (notebook.get(draft.id)) actions.append(button('Delete Saved Entry', deleteCurrent, 'tm530-notebook-button tm530-notebook-danger'));
    editor.append(actions, status);

    editor.querySelectorAll('input, textarea, select').forEach((control) => control.addEventListener('input', () => {
      dirty = true;
      const target = editor.querySelector('[data-notebook-status]');
      if (target) target.textContent = 'Draft changed — not saved.';
    }));
  }

  function beginDraft(entry) {
    draft = JSON.parse(JSON.stringify(entry));
    dirty = false;
    renderList();
    renderEditor();
  }

  function beginFromCurrentComparison() {
    const comparison = comparisonSnapshot();
    if (!comparison) {
      beginDraft(notebook.createDraft({ title: 'Research note' }));
      return;
    }
    beginDraft(notebook.createDraftFromComparison(comparison));
  }

  function saveCurrent() {
    if (!draft) return;
    draft = notebook.save(readEditor());
    dirty = false;
    renderList();
    renderEditor();
    const status = editor.querySelector('[data-notebook-status]');
    if (status) status.textContent = 'Saved privately on this device.';
  }

  function discardChanges() {
    if (!draft) return;
    const saved = notebook.get(draft.id);
    if (saved) beginDraft(saved);
    else {
      draft = null;
      dirty = false;
      renderList();
      renderEditor();
    }
  }

  function deleteCurrent() {
    if (!draft || !notebook.get(draft.id)) return;
    if (!confirm('Delete this private Research Notebook entry from this device?')) return;
    notebook.remove(draft.id);
    draft = null;
    dirty = false;
    renderList();
    renderEditor();
  }

  function downloadState() {
    const payload = notebook.exportState();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'temple-of-maat-private-research-notebook.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function open(mode = 'existing') {
    if (!document.body.classList.contains('temple-app-ready')) return false;
    createLayer();
    returnFocus = document.activeElement;
    renderList();
    if (mode === 'comparison') beginFromCurrentComparison();
    else if (!draft && notebook.entries().length) beginDraft(notebook.entries()[0]);
    else renderEditor();
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('temple-research-notebook-open');
    requestAnimationFrame(() => layer.querySelector('.tm530-notebook-close')?.focus({ preventScroll: true }));
    return true;
  }

  function close() {
    if (!layer || layer.hidden) return false;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('temple-research-notebook-open');
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
    return true;
  }

  function installComparativeLauncher() {
    const tryInstall = () => {
      const body = document.querySelector('#tm530-comparative .tm530-compare-body');
      if (!body || body.querySelector('[data-temple-research-notebook-launchbar]')) return false;
      const bar = el('section', 'tm530-notebook-launchbar');
      bar.dataset.templeResearchNotebookLaunchbar = 'true';
      bar.append(el('p', 'tm530-notebook-launchbar__note', 'Private notebook: cite the current canonical comparison without turning your reflection into public evidence.'));
      bar.append(
        button('Open Research Notebook', () => open('existing')),
        button('Draft Note from Comparison', () => open('comparison'), 'tm530-notebook-button tm530-notebook-button--primary')
      );
      const relations = body.querySelector('.tm530-relations');
      body.insertBefore(bar, relations || null);
      return true;
    };
    tryInstall();
    observer = new MutationObserver(() => tryInstall());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && layer && !layer.hidden) {
      event.preventDefault();
      close();
    }
  });

  createLayer();
  installComparativeLauncher();

  const api = Object.freeze({
    schema: RESEARCH_NOTEBOOK_UI_SCHEMA,
    version: RESEARCH_NOTEBOOK_UI_VERSION,
    privacy: 'device-local-private',
    notebook,
    open,
    close,
    draftFromComparison() { return open('comparison'); },
    disconnect() { observer?.disconnect(); observer = null; }
  });
  window.TempleResearchNotebookUI = api;
  document.dispatchEvent(new CustomEvent('temple:research-notebook-ui-ready', {
    detail: { schema: api.schema, version: api.version, privacy: api.privacy }
  }));
  return api;
}
