import { installTempleResearchNotebookUI } from './v5.3.0-research-notebook-ui.mjs';
import { installTempleScribeWorkspace } from './v5.3.0-scribe-workspace.mjs';

export const SCRIBE_WORKSPACE_UI_SCHEMA = 'temple-of-maat/scribe-workspace-ui-v1';
export const SCRIBE_WORKSPACE_UI_VERSION = '1.0.0';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, handler, className = 'tm530-scribe-button') {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
}

function installStyles() {
  if (document.querySelector('link[data-temple-scribe-workspace-style]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './styles/v5.3.0-scribe-workspace.css';
  link.dataset.templeScribeWorkspaceStyle = 'true';
  document.head.appendChild(link);
}

function citationKey(citation) {
  return `${citation.kind}:${citation.id}`;
}

function uniqueCitations(values) {
  const map = new Map();
  values.forEach((citation) => map.set(citationKey(citation), citation));
  return [...map.values()];
}

function citationLabel(notebook, citation) {
  const resolved = notebook.resolveCitation(citation);
  if (!resolved) return citation.id;
  if (citation.kind === 'endpoint') {
    return resolved.inspection?.mapped ? `${citation.id} · reviewed Kernel mapping` : `${citation.id} · graph endpoint; Kernel mapping not reviewed`;
  }
  const canonical = resolved.canonical || {};
  return canonical.displayName || canonical.title || canonical.label || canonical.recordId || canonical.id || citation.id;
}

function eventLabel(kind) {
  return {
    observation: 'Observation',
    inference: 'Inference',
    uncertainty: 'Uncertainty',
    dissent: 'Dissent',
    correction: 'Correction',
    reply: 'Right of Reply'
  }[kind] || kind;
}

export async function installTempleScribeWorkspaceUI(options = {}) {
  if (window.TempleScribeWorkspaceUI?.schema === SCRIBE_WORKSPACE_UI_SCHEMA) return window.TempleScribeWorkspaceUI;
  installStyles();
  const notebookUi = options.notebookUi || await installTempleResearchNotebookUI(options.notebookUiOptions || {});
  const scribe = options.scribe || await installTempleScribeWorkspace({ notebook: notebookUi.notebook, ...(options.scribeOptions || {}) });
  const notebook = scribe.notebook;

  let layer = null;
  let list = null;
  let editor = null;
  let draft = null;
  let dirty = false;
  let returnFocus = null;
  let observer = null;

  function comparisonSnapshot() {
    try { return window.TempleComparativeReading?.last?.() || null; } catch { return null; }
  }

  function createLayer() {
    if (layer) return;
    layer = el('div', 'tm530-scribe-layer');
    layer.id = 'tm530-scribe-workspace';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('aria-labelledby', 'tm530-scribe-title');

    const scrim = button('', close, 'tm530-scribe-scrim');
    scrim.setAttribute('aria-label', 'Close Nabu-Thoth Scribe Workspace');
    const panel = el('section', 'tm530-scribe-panel');
    const header = el('header', 'tm530-scribe-header');
    const titles = el('div');
    titles.append(el('p', 'tm530-scribe-eyebrow', 'Nabu–Thoth · Temple Comparative Archetype · Private Verified Reckoning'));
    const title = el('h2', '', 'Scribe Workspace');
    title.id = 'tm530-scribe-title';
    titles.append(title);
    const closeButton = button('×', close, 'tm530-scribe-close');
    closeButton.setAttribute('aria-label', 'Close Nabu-Thoth Scribe Workspace');
    header.append(titles, closeButton);

    const body = el('div', 'tm530-scribe-body');
    body.append(el('p', 'tm530-scribe-covenant', 'Observation and inference remain distinct. Uncertainty, dissent, correction, and reply remain visible rather than being silently rewritten. Consequential notes can carry dated canonical source references. Private threads remain on this device and never become Relationship Graph or Knowledge Kernel evidence.'));
    body.append(el('p', 'tm530-scribe-boundary', 'Nabu–Thoth is a modern Temple comparative scribe archetype, not a claim that the historical Mesopotamian Nabu and Egyptian Djehuty/Thoth were one ancient deity.'));

    const layout = el('div', 'tm530-scribe-layout');
    const sidebar = el('aside', 'tm530-scribe-sidebar');
    sidebar.append(el('h3', '', 'Research Threads'));
    list = el('div', 'tm530-scribe-list');
    sidebar.append(list);
    editor = el('section', 'tm530-scribe-editor');
    layout.append(sidebar, editor);
    body.append(layout);

    const footer = el('footer', 'tm530-scribe-footer');
    footer.append(
      button('New Blank Thread', () => beginDraft(scribe.createThreadDraft())),
      button('New Thread from Comparison', beginFromCurrentComparison, 'tm530-scribe-button tm530-scribe-button--primary'),
      button('Export Private Scribe Threads JSON', downloadState)
    );
    body.append(footer, el('p', 'tm530-scribe-private', 'Private state key: temple_scribe_workspace_v1 · append-only Scribe ledger · no cloud upload · no public graph mutation · no Knowledge Kernel mutation.'));
    panel.append(header, body);
    layer.append(scrim, panel);
    document.body.append(layer);
  }

  function renderList() {
    if (!list) return;
    list.replaceChildren();
    const threads = scribe.threads();
    if (!threads.length) {
      list.append(el('p', 'tm530-scribe-empty', 'No saved research threads yet. Drafting a thread does not persist it until Save Thread is pressed.'));
      return;
    }
    threads.forEach((thread) => {
      const item = button(thread.title.trim() || 'Untitled research thread', () => beginDraft(thread), `tm530-scribe-item${draft?.id === thread.id ? ' is-current' : ''}`);
      item.append(el('span', '', `${thread.status} · ${thread.notebookEntryIds.length} notebook entr${thread.notebookEntryIds.length === 1 ? 'y' : 'ies'} · ${thread.ledger.length} ledger`));
      list.append(item);
    });
  }

  function currentNotebookIds() {
    if (!editor) return [];
    return [...editor.querySelectorAll('[data-scribe-entry-ref]:checked')].map((node) => node.value);
  }

  function deriveAnchors(entryIds) {
    const fromEntries = entryIds.flatMap((id) => notebook.get(id)?.citations || []);
    return uniqueCitations([...(draft?.anchors || []), ...fromEntries]);
  }

  function readEditor() {
    if (!editor || !draft) return draft;
    const notebookEntryIds = currentNotebookIds();
    return {
      ...draft,
      title: editor.querySelector('[data-scribe-thread-title]')?.value || '',
      inquiry: editor.querySelector('[data-scribe-thread-inquiry]')?.value || '',
      status: editor.querySelector('[data-scribe-thread-status]')?.value || 'open',
      notebookEntryIds,
      anchors: deriveAnchors(notebookEntryIds)
    };
  }

  function renderAnchor(citation) {
    const card = el('div', 'tm530-scribe-anchor');
    card.append(el('strong', '', `${citation.kind.toUpperCase()} · ${citation.id}`));
    card.append(el('p', '', citationLabel(notebook, citation)));
    return card;
  }

  function renderNotebookPicker() {
    const block = el('section', 'tm530-scribe-section');
    block.append(el('h3', '', 'Attached Private Notebook Entries'));
    const entries = notebook.entries();
    if (!entries.length) {
      block.append(el('p', 'tm530-scribe-empty', 'No saved Research Notebook entries are available. Threads can still be anchored to the current canonical comparison.'));
      return block;
    }
    const picker = el('div', 'tm530-scribe-entry-picker');
    entries.forEach((entry) => {
      const label = el('label', 'tm530-scribe-entry-option');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = entry.id;
      input.dataset.scribeEntryRef = 'true';
      input.checked = draft.notebookEntryIds.includes(entry.id);
      input.addEventListener('change', () => {
        dirty = true;
        const status = editor.querySelector('[data-scribe-status]');
        if (status) status.textContent = 'Thread changed — not saved.';
      });
      const copy = el('span');
      copy.append(el('strong', '', entry.title || 'Untitled Research Notebook entry'));
      copy.append(el('small', '', `${entry.stage} · ${entry.citations.length} citation${entry.citations.length === 1 ? '' : 's'} · ${entry.id}`));
      label.append(input, copy);
      picker.append(label);
    });
    block.append(picker);
    return block;
  }

  function renderLedgerEvent(event, index) {
    const card = el('article', `tm530-scribe-ledger-event tm530-scribe-ledger-event--${event.kind}`);
    const head = el('div', 'tm530-scribe-ledger-head');
    head.append(el('strong', '', `${index + 1}. ${eventLabel(event.kind)}`), el('time', '', event.createdAt));
    card.append(head, el('p', 'tm530-scribe-ledger-text', event.text));
    if (event.reasoning) {
      const reasoning = el('div', 'tm530-scribe-reasoning');
      reasoning.append(el('strong', '', 'Visible reasoning'), el('p', '', event.reasoning));
      card.append(reasoning);
    }
    if (event.relatedLogId) card.append(el('p', 'tm530-scribe-related', `Responds to / corrects: ${event.relatedLogId}`));
    if (event.sourceCitations.length) {
      const refs = el('div', 'tm530-scribe-ledger-refs');
      event.sourceCitations.forEach((citation) => refs.append(el('span', '', `${citation.kind}:${citation.id}`)));
      card.append(refs);
    } else {
      card.append(el('p', 'tm530-scribe-unsourced', 'No canonical source citation attached to this ledger event.'));
    }
    return card;
  }

  function renderLedgerForm(thread) {
    const form = el('section', 'tm530-scribe-ledger-form');
    form.append(el('h3', '', 'Append to Scribe Ledger'));
    form.append(el('p', 'tm530-scribe-empty', 'Ledger entries are append-only. Corrections and replies point back to earlier entries instead of erasing them. Inference requires visible reasoning.'));

    const kindField = el('div', 'tm530-scribe-field');
    const kindLabel = el('label', '', 'Record type');
    kindLabel.htmlFor = 'tm530-scribe-ledger-kind';
    const kind = el('select');
    kind.id = 'tm530-scribe-ledger-kind';
    kind.dataset.scribeLedgerKind = 'true';
    ['observation', 'inference', 'uncertainty', 'dissent', 'correction', 'reply'].forEach((value) => {
      const option = el('option', '', eventLabel(value));
      option.value = value;
      kind.append(option);
    });
    kindField.append(kindLabel, kind);

    const textField = el('div', 'tm530-scribe-field');
    const textLabel = el('label', '', 'Statement');
    textLabel.htmlFor = 'tm530-scribe-ledger-text';
    const text = el('textarea');
    text.id = 'tm530-scribe-ledger-text';
    text.maxLength = 8000;
    text.dataset.scribeLedgerText = 'true';
    textField.append(textLabel, text);

    const reasoningField = el('div', 'tm530-scribe-field');
    const reasoningLabel = el('label', '', 'Reasoning / calculation trail');
    reasoningLabel.htmlFor = 'tm530-scribe-ledger-reasoning';
    const reasoning = el('textarea');
    reasoning.id = 'tm530-scribe-ledger-reasoning';
    reasoning.maxLength = 6000;
    reasoning.dataset.scribeLedgerReasoning = 'true';
    reasoningField.append(reasoningLabel, reasoning);

    const relatedField = el('div', 'tm530-scribe-field');
    const relatedLabel = el('label', '', 'Related prior ledger entry');
    relatedLabel.htmlFor = 'tm530-scribe-ledger-related';
    const related = el('select');
    related.id = 'tm530-scribe-ledger-related';
    related.dataset.scribeLedgerRelated = 'true';
    related.append(el('option', '', 'None'));
    thread.ledger.forEach((event, index) => {
      const option = el('option', '', `${index + 1}. ${eventLabel(event.kind)} · ${event.text.slice(0, 70)}`);
      option.value = event.id;
      related.append(option);
    });
    relatedField.append(relatedLabel, related);

    form.append(kindField, textField, reasoningField, relatedField);

    if (thread.anchors.length) {
      form.append(el('h4', '', 'Canonical source references for this ledger entry'));
      const refs = el('div', 'tm530-scribe-source-picker');
      thread.anchors.forEach((citation) => {
        const label = el('label', 'tm530-scribe-source-option');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.scribeLedgerCitation = 'true';
        input.value = citationKey(citation);
        const span = el('span', '', `${citation.kind.toUpperCase()} · ${citation.id}`);
        label.append(input, span);
        refs.append(label);
      });
      form.append(refs);
    } else {
      form.append(el('p', 'tm530-scribe-unsourced', 'This thread currently has no canonical anchors. Attach a cited Notebook entry or create a thread from a canonical comparison before sourcing consequential ledger claims.'));
    }

    const ledgerStatus = el('p', 'tm530-scribe-status', 'Nothing is appended until Add Ledger Entry is pressed.');
    ledgerStatus.dataset.scribeLedgerStatus = 'true';
    form.append(button('Add Ledger Entry', appendLedgerCurrent, 'tm530-scribe-button tm530-scribe-button--primary'), ledgerStatus);
    return form;
  }

  function renderEditor() {
    if (!editor) return;
    editor.replaceChildren();
    if (!draft) {
      editor.append(el('h3', '', 'Select or create a research thread'), el('p', 'tm530-scribe-empty', 'A thread groups private Notebook entries and canonical anchors. Its Scribe ledger preserves observation, inference, uncertainty, dissent, correction, and right of reply as separate dated records.'));
      return;
    }

    const saved = scribe.get(draft.id);
    editor.append(el('p', 'tm530-scribe-eyebrow', saved ? 'Saved Private Research Thread' : 'Unsaved Private Thread Draft'), el('h3', '', draft.title || 'Untitled Research Thread'));

    const titleField = el('div', 'tm530-scribe-field');
    const titleLabel = el('label', '', 'Thread title');
    titleLabel.htmlFor = 'tm530-scribe-thread-title-input';
    const title = el('input');
    title.id = 'tm530-scribe-thread-title-input';
    title.maxLength = 200;
    title.value = draft.title;
    title.dataset.scribeThreadTitle = 'true';
    titleField.append(titleLabel, title);

    const inquiryField = el('div', 'tm530-scribe-field');
    const inquiryLabel = el('label', '', 'Research question / inquiry');
    inquiryLabel.htmlFor = 'tm530-scribe-thread-inquiry-input';
    const inquiry = el('textarea');
    inquiry.id = 'tm530-scribe-thread-inquiry-input';
    inquiry.maxLength = 4000;
    inquiry.value = draft.inquiry;
    inquiry.dataset.scribeThreadInquiry = 'true';
    inquiryField.append(inquiryLabel, inquiry);

    const statusField = el('div', 'tm530-scribe-field');
    const statusLabel = el('label', '', 'Editorial status');
    statusLabel.htmlFor = 'tm530-scribe-thread-status-input';
    const statusSelect = el('select');
    statusSelect.id = 'tm530-scribe-thread-status-input';
    statusSelect.dataset.scribeThreadStatus = 'true';
    ['open', 'paused', 'closed'].forEach((value) => {
      const option = el('option', '', value[0].toUpperCase() + value.slice(1));
      option.value = value;
      option.selected = draft.status === value;
      statusSelect.append(option);
    });
    statusField.append(statusLabel, statusSelect);
    editor.append(titleField, inquiryField, statusField, renderNotebookPicker());

    const previewAnchors = deriveAnchors(draft.notebookEntryIds);
    const anchorBlock = el('section', 'tm530-scribe-section');
    anchorBlock.append(el('h3', '', `Canonical Anchors · ${previewAnchors.length}`));
    if (previewAnchors.length) {
      const anchors = el('div', 'tm530-scribe-anchors');
      previewAnchors.forEach((citation) => anchors.append(renderAnchor(citation)));
      anchorBlock.append(anchors);
    } else anchorBlock.append(el('p', 'tm530-scribe-empty', 'No canonical anchors are attached yet.'));
    editor.append(anchorBlock);

    const actions = el('div', 'tm530-scribe-actions');
    actions.append(button('Save Thread', saveCurrent, 'tm530-scribe-button tm530-scribe-button--primary'), button('Discard Thread Changes', discardChanges));
    if (saved) actions.append(button('Delete Saved Thread', deleteCurrent, 'tm530-scribe-button tm530-scribe-danger'));
    const statusText = el('p', 'tm530-scribe-status', dirty ? 'Thread changed — not saved.' : (saved ? 'Saved privately on this device.' : 'Thread draft is not persisted until Save Thread is pressed.'));
    statusText.dataset.scribeStatus = 'true';
    editor.append(actions, statusText);

    if (saved) {
      const ledger = el('section', 'tm530-scribe-section');
      ledger.append(el('h3', '', `Scribe Ledger · ${saved.ledger.length}`));
      if (saved.ledger.length) saved.ledger.forEach((event, index) => ledger.append(renderLedgerEvent(event, index)));
      else ledger.append(el('p', 'tm530-scribe-empty', 'No ledger entries yet. The first append will be dated and preserved as its own record.'));
      editor.append(ledger, renderLedgerForm(saved));
    } else {
      editor.append(el('p', 'tm530-scribe-unsaved-ledger', 'Save this thread before adding append-only Scribe ledger entries.'));
    }

    editor.querySelectorAll('[data-scribe-thread-title], [data-scribe-thread-inquiry], [data-scribe-thread-status]').forEach((control) => control.addEventListener('input', () => {
      dirty = true;
      const target = editor.querySelector('[data-scribe-status]');
      if (target) target.textContent = 'Thread changed — not saved.';
    }));
  }

  function beginDraft(thread) {
    draft = JSON.parse(JSON.stringify(thread));
    dirty = false;
    renderList();
    renderEditor();
  }

  function beginFromCurrentComparison() {
    const comparison = comparisonSnapshot();
    if (!comparison) {
      beginDraft(scribe.createThreadDraft({ title: 'Research thread' }));
      return;
    }
    beginDraft(scribe.createThreadFromComparison(comparison));
  }

  function saveCurrent() {
    if (!draft) return;
    try {
      draft = scribe.save(readEditor());
      dirty = false;
      renderList();
      renderEditor();
      const status = editor.querySelector('[data-scribe-status]');
      if (status) status.textContent = 'Saved privately on this device.';
    } catch (error) {
      const status = editor.querySelector('[data-scribe-status]');
      if (status) status.textContent = error.message;
    }
  }

  function discardChanges() {
    if (!draft) return;
    const saved = scribe.get(draft.id);
    if (saved) beginDraft(saved);
    else {
      draft = null;
      dirty = false;
      renderList();
      renderEditor();
    }
  }

  function deleteCurrent() {
    if (!draft || !scribe.get(draft.id)) return;
    if (!confirm('Delete this private Scribe research thread from this device? The linked Research Notebook entries are not deleted.')) return;
    scribe.remove(draft.id);
    draft = null;
    dirty = false;
    renderList();
    renderEditor();
  }

  function appendLedgerCurrent() {
    if (!draft || !scribe.get(draft.id)) return;
    const kind = editor.querySelector('[data-scribe-ledger-kind]')?.value || 'observation';
    const text = editor.querySelector('[data-scribe-ledger-text]')?.value || '';
    const reasoning = editor.querySelector('[data-scribe-ledger-reasoning]')?.value || '';
    const relatedLogId = editor.querySelector('[data-scribe-ledger-related]')?.value || '';
    const anchorMap = new Map((scribe.get(draft.id)?.anchors || []).map((citation) => [citationKey(citation), citation]));
    const sourceCitations = [...editor.querySelectorAll('[data-scribe-ledger-citation]:checked')].map((node) => anchorMap.get(node.value)).filter(Boolean);
    try {
      scribe.appendLedger(draft.id, { kind, text, reasoning, relatedLogId: relatedLogId || undefined, sourceCitations });
      draft = scribe.get(draft.id);
      renderList();
      renderEditor();
      const status = editor.querySelector('[data-scribe-ledger-status]');
      if (status) status.textContent = 'Ledger entry appended. Earlier entries remain unchanged.';
    } catch (error) {
      const status = editor.querySelector('[data-scribe-ledger-status]');
      if (status) status.textContent = error.message;
    }
  }

  function downloadState() {
    const payload = scribe.exportState();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'temple-of-maat-private-scribe-threads.json';
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
    else if (mode === 'blank') beginDraft(scribe.createThreadDraft());
    else if (!draft && scribe.threads().length) beginDraft(scribe.threads()[0]);
    else renderEditor();
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('temple-scribe-workspace-open');
    requestAnimationFrame(() => layer.querySelector('.tm530-scribe-close')?.focus({ preventScroll: true }));
    return true;
  }

  function close() {
    if (!layer || layer.hidden) return false;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('temple-scribe-workspace-open');
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
    return true;
  }

  function installLaunchers() {
    const tryNotebook = () => {
      const footer = document.querySelector('#tm530-research-notebook .tm530-notebook-footer');
      if (!footer || footer.querySelector('[data-temple-scribe-launcher="notebook"]')) return false;
      const launch = button('Open Nabu–Thoth Scribe Workspace', () => open('existing'));
      launch.dataset.templeScribeLauncher = 'notebook';
      footer.append(launch);
      return true;
    };
    const tryComparative = () => {
      const body = document.querySelector('#tm530-comparative .tm530-compare-body');
      if (!body || body.querySelector('[data-temple-scribe-launchbar]')) return false;
      const bar = el('section', 'tm530-scribe-launchbar');
      bar.dataset.templeScribeLaunchbar = 'true';
      bar.append(el('p', 'tm530-scribe-launchbar__note', 'Private Scribe threads preserve the difference between observation, inference, uncertainty, dissent, correction, and reply.'));
      bar.append(button('Open Scribe Workspace', () => open('existing')), button('New Thread from Comparison', () => open('comparison'), 'tm530-scribe-button tm530-scribe-button--primary'));
      const relations = body.querySelector('.tm530-relations');
      body.insertBefore(bar, relations || null);
      return true;
    };
    tryNotebook();
    tryComparative();
    observer = new MutationObserver(() => { tryNotebook(); tryComparative(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && layer && !layer.hidden) {
      event.preventDefault();
      close();
    }
  });

  createLayer();
  installLaunchers();

  const api = Object.freeze({
    schema: SCRIBE_WORKSPACE_UI_SCHEMA,
    version: SCRIBE_WORKSPACE_UI_VERSION,
    privacy: 'device-local-private',
    scribe,
    notebookUi,
    open,
    close,
    threadFromComparison() { return open('comparison'); },
    disconnect() { observer?.disconnect(); observer = null; }
  });
  window.TempleScribeWorkspaceUI = api;
  document.dispatchEvent(new CustomEvent('temple:scribe-workspace-ui-ready', {
    detail: { schema: api.schema, version: api.version, privacy: api.privacy }
  }));
  return api;
}
