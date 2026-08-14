/* Temple of Ma'at v5.2.8 — portable Pilgrim Journey import/restore */
(function () {
  'use strict';

  const PORTABILITY_VERSION = '1.0.0';
  const STATE_KEY = 'temple_v525_pilgrim_journey';
  const LAST_CHAMBER_KEY = 'temple_last_chamber';
  const RESULT_KEY = 'temple_journey_import_result_v1';
  const SCHEMA = 'temple-of-maat/pilgrim-journey-v1';
  const ENGINE_VERSION = '5.2.5';
  const MAX_REFLECTION_LENGTH = 12000;
  const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
  let fileInput = null;
  let previewLayer = null;
  let previewBody = null;
  let observer = null;
  let selectedImport = null;
  let restoring = false;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(label, handler, className = 'tm525-btn') {
    const node = el('button', className, label);
    node.type = 'button';
    node.addEventListener('click', handler);
    return node;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function chamberNumber(value, label = 'chamber') {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 72) {
      throw new Error(`${label} must be an integer from 1 to 72.`);
    }
    return number;
  }

  function validTimestamp(value, label) {
    if (value === null) return null;
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
      throw new Error(`${label} must be null or a valid ISO date-time string.`);
    }
    return value;
  }

  function normalizeChamberArray(value, label) {
    if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
    const normalized = value.map((item, index) => chamberNumber(item, `${label}[${index}]`));
    return [...new Set(normalized)].sort((a, b) => a - b);
  }

  function normalizeReflections(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('reflections must be an object keyed by chamber number.');
    const normalized = {};
    for (const [key, reflection] of Object.entries(value)) {
      const number = chamberNumber(key, `reflection key ${key}`);
      if (typeof reflection !== 'string') throw new Error(`Reflection for Chamber ${String(number).padStart(2, '0')} must be a string.`);
      if (reflection.length > MAX_REFLECTION_LENGTH) throw new Error(`Reflection for Chamber ${String(number).padStart(2, '0')} exceeds ${MAX_REFLECTION_LENGTH.toLocaleString()} characters.`);
      if (reflection.trim()) normalized[number] = reflection;
    }
    return normalized;
  }

  function normalizePayload(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Journey import must contain one JSON object.');
    if (raw.schema !== SCHEMA) throw new Error(`Unsupported Journey schema. Expected ${SCHEMA}.`);
    if (raw.version !== ENGINE_VERSION) throw new Error(`Incompatible Journey version ${String(raw.version || 'missing')}. This Temple currently restores ${ENGINE_VERSION} exports only.`);
    if (typeof raw.started !== 'boolean') throw new Error('started must be true or false.');

    return {
      schema: SCHEMA,
      version: ENGINE_VERSION,
      started: raw.started,
      startedAt: validTimestamp(raw.startedAt ?? null, 'startedAt'),
      updatedAt: validTimestamp(raw.updatedAt ?? null, 'updatedAt'),
      current: chamberNumber(raw.current, 'current'),
      visited: normalizeChamberArray(raw.visited, 'visited'),
      favorites: normalizeChamberArray(raw.favorites, 'favorites'),
      reflections: normalizeReflections(raw.reflections)
    };
  }

  function currentState() {
    const api = window.TemplePilgrimJourney;
    if (!api?.state) throw new Error('Pilgrim Journey is not ready yet.');
    return normalizePayload(api.state());
  }

  function isEmptyJourney(value) {
    return !value.started && value.visited.length === 0 && value.favorites.length === 0 && Object.keys(value.reflections).length === 0;
  }

  function earliestTimestamp(left, right) {
    if (!left) return right || null;
    if (!right) return left;
    return Date.parse(left) <= Date.parse(right) ? left : right;
  }

  function mergeStates(current, imported) {
    const currentHasState = !isEmptyJourney(current);
    const conflicts = Object.keys(current.reflections)
      .map(Number)
      .filter((number) => Object.hasOwn(imported.reflections, number) && imported.reflections[number] !== current.reflections[number])
      .sort((a, b) => a - b);

    return {
      result: {
        schema: SCHEMA,
        version: ENGINE_VERSION,
        started: current.started || imported.started,
        startedAt: earliestTimestamp(current.startedAt, imported.startedAt),
        updatedAt: new Date().toISOString(),
        current: currentHasState ? current.current : imported.current,
        visited: [...new Set([...current.visited, ...imported.visited])].sort((a, b) => a - b),
        favorites: [...new Set([...current.favorites, ...imported.favorites])].sort((a, b) => a - b),
        // Existing local reflection text wins on conflict; imported text fills only gaps.
        reflections: { ...imported.reflections, ...current.reflections }
      },
      reflectionConflicts: conflicts,
      currentPolicy: currentHasState ? 'kept-existing-current' : 'used-imported-current'
    };
  }

  function replaceState(imported) {
    return {
      result: clone(imported),
      reflectionConflicts: [],
      currentPolicy: 'used-imported-current'
    };
  }

  function buildPlan(imported, strategy = 'merge') {
    const current = currentState();
    const safeStrategy = strategy === 'replace' ? 'replace' : 'merge';
    const outcome = safeStrategy === 'replace' ? replaceState(imported) : mergeStates(current, imported);
    const importedReflectionCount = Object.keys(imported.reflections).length;
    const currentReflectionCount = Object.keys(current.reflections).length;
    const resultReflectionCount = Object.keys(outcome.result.reflections).length;
    return {
      strategy: safeStrategy,
      current,
      imported: clone(imported),
      result: outcome.result,
      reflectionConflicts: outcome.reflectionConflicts,
      currentPolicy: outcome.currentPolicy,
      summary: {
        current: { visited: current.visited.length, favorites: current.favorites.length, reflections: currentReflectionCount, chamber: current.current },
        imported: { visited: imported.visited.length, favorites: imported.favorites.length, reflections: importedReflectionCount, chamber: imported.current },
        result: { visited: outcome.result.visited.length, favorites: outcome.result.favorites.length, reflections: resultReflectionCount, chamber: outcome.result.current }
      }
    };
  }

  function installStyles() {
    if (document.querySelector('link[data-temple-journey-import-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './styles/v5.2.8-journey-import.css';
    link.dataset.templeJourneyImportStyle = 'true';
    document.head.appendChild(link);
  }

  function closePreview() {
    if (!previewLayer) return;
    previewLayer.hidden = true;
    previewLayer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tm528j-modal-open');
    selectedImport = null;
  }

  function ensurePreviewLayer() {
    if (previewLayer) return;
    previewLayer = el('div', 'tm528j-layer');
    previewLayer.id = 'tm528j-import';
    previewLayer.hidden = true;
    previewLayer.setAttribute('role', 'dialog');
    previewLayer.setAttribute('aria-modal', 'true');
    previewLayer.setAttribute('aria-hidden', 'true');
    previewLayer.setAttribute('aria-labelledby', 'tm528j-title');

    const panel = el('section', 'tm528j-panel');
    const header = el('header', 'tm528j-header');
    const titles = el('div');
    titles.append(el('p', 'tm528j-eyebrow', 'Portable personal archive · local file only'), el('h2', '', 'Import / Restore Pilgrim Journey'));
    titles.querySelector('h2').id = 'tm528j-title';
    header.append(titles, button('Close', closePreview, 'tm528j-close'));
    previewBody = el('div', 'tm528j-body');
    panel.append(header, previewBody);
    previewLayer.append(panel);
    previewLayer.addEventListener('click', (event) => { if (event.target === previewLayer) closePreview(); });
    document.body.append(previewLayer);
  }

  function openPreview() {
    ensurePreviewLayer();
    previewLayer.hidden = false;
    previewLayer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tm528j-modal-open');
  }

  function metric(label, value) {
    const node = el('div', 'tm528j-metric');
    node.append(el('span', '', label), el('strong', '', String(value)));
    return node;
  }

  function renderRejected(message, filename = '') {
    openPreview();
    previewBody.replaceChildren();
    previewBody.append(
      el('p', 'tm528j-error', 'Import rejected. No local Journey state was changed.'),
      filename ? el('p', 'tm528j-file-name', filename) : el('span'),
      el('p', 'tm528j-copy', message),
      el('p', 'tm528j-copy', 'Unknown schemas or versions are never silently migrated. See the Journey portability guide before converting an older or future export.'),
      button('Close', closePreview, 'tm525-btn')
    );
  }

  function renderPlan(strategy = 'merge') {
    if (!selectedImport) return;
    let plan;
    try {
      plan = buildPlan(selectedImport.normalized, strategy);
    } catch (error) {
      renderRejected(error.message, selectedImport.filename);
      return;
    }

    openPreview();
    previewBody.replaceChildren();
    previewBody.append(
      el('p', 'tm528j-private', 'This file is read on this device. Import never uploads your reflections, favorites, or Journey state.'),
      el('p', 'tm528j-file-name', selectedImport.filename),
      el('p', 'tm528j-copy', `Schema ${SCHEMA} · Journey engine ${ENGINE_VERSION}`)
    );

    const strategyLabel = el('label', 'tm528j-field');
    strategyLabel.append(el('span', '', 'Import strategy'));
    const strategySelect = document.createElement('select');
    strategySelect.id = 'tm528j-strategy';
    [['merge', 'Merge safely (recommended)'], ['replace', 'Replace local Journey']].forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === plan.strategy) option.selected = true;
      strategySelect.append(option);
    });
    strategySelect.addEventListener('change', () => renderPlan(strategySelect.value));
    strategyLabel.append(strategySelect);
    previewBody.append(strategyLabel);

    const compare = el('div', 'tm528j-compare');
    [['Current', plan.summary.current], ['Imported', plan.summary.imported], ['Result', plan.summary.result]].forEach(([label, data]) => {
      const card = el('section', 'tm528j-summary-card');
      card.append(el('h3', '', label));
      const stats = el('div', 'tm528j-stat-grid');
      stats.append(
        metric('Current', String(data.chamber).padStart(2, '0')),
        metric('Visited', data.visited),
        metric('Favorites', data.favorites),
        metric('Reflections', data.reflections)
      );
      card.append(stats);
      compare.append(card);
    });
    previewBody.append(compare);

    if (plan.strategy === 'merge') {
      const mergeNote = el('section', 'tm528j-note');
      mergeNote.append(el('h3', '', 'Safe merge rules'));
      mergeNote.append(el('p', '', 'Visited chambers and favorites are combined. Existing local reflection text wins when both files contain different text for the same chamber. Imported reflections fill empty chambers.'));
      mergeNote.append(el('p', '', plan.currentPolicy === 'kept-existing-current' ? 'The existing current chamber is preserved because this device already has Journey state.' : 'The imported current chamber will be used because the local Journey is empty.'));
      if (plan.reflectionConflicts.length) {
        mergeNote.append(el('p', 'tm528j-conflict', `Reflection conflicts kept local: ${plan.reflectionConflicts.map((number) => `Chamber ${String(number).padStart(2, '0')}`).join(', ')}`));
      } else {
        mergeNote.append(el('p', 'tm528j-no-conflict', 'No reflection conflicts detected.'));
      }
      previewBody.append(mergeNote);
    } else {
      previewBody.append(el('p', 'tm528j-danger', 'Replace will overwrite the supported local Journey fields with this imported archive. The comparison above is your preview before that destructive change.'));
    }

    previewBody.append(el('p', 'tm528j-not-applied', 'No local state changes have been applied yet.'));
    const actions = el('div', 'tm528j-actions');
    actions.append(
      button('Cancel', closePreview, 'tm525-btn tm525-btn--ghost'),
      button(plan.strategy === 'replace' ? 'Replace Journey & Reload' : 'Merge Journey & Reload', () => applyPlan(plan), plan.strategy === 'replace' ? 'tm525-btn tm525-btn--danger' : 'tm525-btn tm525-btn--secondary')
    );
    previewBody.append(actions);
  }

  function applyPlan(plan) {
    if (restoring) return;
    restoring = true;
    try {
      const next = normalizePayload(plan.result);
      localStorage.setItem(STATE_KEY, JSON.stringify(next));
      localStorage.setItem(LAST_CHAMBER_KEY, String(next.current));
      sessionStorage.setItem(RESULT_KEY, JSON.stringify({ strategy: plan.strategy, chamber: next.current, restoredAt: new Date().toISOString() }));
      // replaceState updates the URL without firing the old Journey hash handler, so
      // the imported state cannot be overwritten by the pre-reload in-memory state.
      history.replaceState(null, '', `${location.pathname}${location.search}#chamber-${String(next.current).padStart(2, '0')}`);
      location.reload();
    } catch (error) {
      restoring = false;
      renderRejected(`Restore could not be written to local storage: ${error.message}`, selectedImport?.filename || '');
    }
  }

  async function readImportFile(file) {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      renderRejected(`Journey archive exceeds the ${Math.round(MAX_IMPORT_BYTES / 1024 / 1024)} MB local import limit.`, file.name);
      return;
    }
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const normalized = normalizePayload(raw);
      selectedImport = { filename: file.name || 'journey.json', normalized };
      renderPlan('merge');
    } catch (error) {
      selectedImport = null;
      renderRejected(error instanceof SyntaxError ? 'The selected file is not valid JSON.' : error.message, file.name);
    } finally {
      if (fileInput) fileInput.value = '';
    }
  }

  function ensureFileInput() {
    if (fileInput) return;
    fileInput = document.createElement('input');
    fileInput.id = 'tm528j-file';
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.hidden = true;
    fileInput.addEventListener('change', () => readImportFile(fileInput.files?.[0]));
    document.body.append(fileInput);
  }

  function openFilePicker() {
    ensureFileInput();
    fileInput.click();
  }

  function installJourneyControl() {
    const footer = document.querySelector('#tm525-journey .tm525-journey-footer');
    if (!footer || footer.querySelector('[data-tm528j-import]')) return false;
    const importButton = button('Import / Restore Journey JSON', openFilePicker, 'tm525-btn tm525-btn--secondary');
    importButton.dataset.tm528jImport = 'true';
    footer.insertBefore(importButton, footer.querySelector('.tm525-btn--danger') || null);

    try {
      const result = JSON.parse(sessionStorage.getItem(RESULT_KEY) || 'null');
      if (result?.strategy) {
        const status = el('span', 'tm528j-restored-status', `Restored locally by ${result.strategy} · Chamber ${String(result.chamber).padStart(2, '0')}`);
        footer.append(status);
        sessionStorage.removeItem(RESULT_KEY);
      }
    } catch {
      sessionStorage.removeItem(RESULT_KEY);
    }
    return true;
  }

  function observeJourney() {
    if (observer) return;
    observer = new MutationObserver(installJourneyControl);
    observer.observe(document.body, { childList: true, subtree: true });
    installJourneyControl();
  }

  function init() {
    installStyles();
    ensurePreviewLayer();
    ensureFileInput();
    observeJourney();
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && previewLayer && !previewLayer.hidden) closePreview();
    });

    window.TempleJourneyPortability = Object.freeze({
      version: PORTABILITY_VERSION,
      schema: SCHEMA,
      engineVersion: ENGINE_VERSION,
      maxImportBytes: MAX_IMPORT_BYTES,
      validate(raw) { return clone(normalizePayload(raw)); },
      preview(raw, strategy = 'merge') { return clone(buildPlan(normalizePayload(raw), strategy)); },
      openImport: openFilePicker
    });

    document.dispatchEvent(new CustomEvent('temple:journey-portability-ready', { detail: { version: PORTABILITY_VERSION, schema: SCHEMA, engineVersion: ENGINE_VERSION } }));
  }

  function waitForJourney() {
    if (window.TemplePilgrimJourney?.state) init();
    else document.addEventListener('temple:living-temple-ready', init, { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForJourney, { once: true });
  else waitForJourney();
})();
