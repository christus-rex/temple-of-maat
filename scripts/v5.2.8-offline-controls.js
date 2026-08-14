/* Temple of Ma'at v5.2.8 — Offline ownership controls */
(function () {
  'use strict';

  const VERSION = '1.0.0';
  const REQUEST_TIMEOUT_MS = 15000;
  const pending = new Map();
  let layer = null;
  let statusNode = null;
  let storageNode = null;
  let progressNode = null;
  let progressLabel = null;
  let downloadButton = null;
  let cancelButton = null;
  let clearButton = null;
  let currentJobId = null;
  let observer = null;

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

  function requestId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function formatBytes(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes < 0) return 'Unavailable';
    if (bytes < 1024) return `${Math.round(bytes)} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }

  async function serviceWorker() {
    if (!('serviceWorker' in navigator)) throw new Error('This browser does not expose service-worker offline storage.');
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active || registration.waiting || registration.installing;
    if (!worker) throw new Error('The Temple service worker is not ready yet.');
    return worker;
  }

  async function post(type, payload = {}) {
    const worker = await serviceWorker();
    worker.postMessage({ type, ...payload });
    return true;
  }

  function request(type, expectedType, payload = {}) {
    const id = requestId(type.toLowerCase());
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('The offline cache did not respond in time. Normal Temple use is unchanged.'));
      }, REQUEST_TIMEOUT_MS);
      pending.set(id, { expectedType, resolve, reject, timer });
      try {
        await post(type, { ...payload, requestId: id });
      } catch (error) {
        clearTimeout(timer);
        pending.delete(id);
        reject(error);
      }
    });
  }

  async function storageEstimate() {
    const estimate = navigator.storage?.estimate ? await navigator.storage.estimate().catch(() => ({})) : {};
    const persisted = navigator.storage?.persisted ? await navigator.storage.persisted().catch(() => false) : null;
    return {
      usage: Number.isFinite(estimate?.usage) ? estimate.usage : null,
      quota: Number.isFinite(estimate?.quota) ? estimate.quota : null,
      persisted
    };
  }

  async function status() {
    const [cache, storage] = await Promise.all([
      request('GET_OFFLINE_STATUS', 'TEMPLE_OFFLINE_STATUS'),
      storageEstimate()
    ]);
    if (!cache.ok) throw new Error(cache.error || 'Unable to inspect offline cache status.');
    return { ...cache, storage };
  }

  function setProgress(completed, total, text) {
    if (!progressNode || !progressLabel) return;
    const safeTotal = Math.max(0, Number(total) || 0);
    const safeCompleted = Math.max(0, Number(completed) || 0);
    progressNode.max = safeTotal || 1;
    progressNode.value = Math.min(safeCompleted, safeTotal || 1);
    progressLabel.textContent = text;
  }

  function setBusy(busy) {
    if (downloadButton) downloadButton.disabled = busy;
    if (cancelButton) {
      cancelButton.hidden = !busy;
      cancelButton.disabled = false;
    }
    if (clearButton) clearButton.disabled = busy;
  }

  async function refreshStatus() {
    if (!statusNode || !storageNode) return null;
    statusNode.textContent = 'Checking offline visual archive…';
    try {
      const data = await status();
      statusNode.textContent = `${data.optionalCached} of ${data.optionalTotal} optional chamber visuals are cached on this device.`;
      const usage = data.storage.usage === null ? 'unknown usage' : `${formatBytes(data.storage.usage)} used`;
      const quota = data.storage.quota === null ? 'unknown quota' : `${formatBytes(data.storage.quota)} available to this origin`;
      const persistence = data.storage.persisted === null ? 'persistence status unavailable' : data.storage.persisted ? 'persistent storage granted' : 'storage managed by the browser';
      storageNode.textContent = `Site storage estimate: ${usage}; ${quota}; ${persistence}.`;
      return data;
    } catch (error) {
      statusNode.textContent = `Offline status unavailable: ${error.message}`;
      storageNode.textContent = 'The normal Temple shell remains usable.';
      return null;
    }
  }

  async function startFullDownload() {
    if (currentJobId) return currentJobId;
    const id = requestId('full-offline');
    currentJobId = id;
    setBusy(true);
    setProgress(0, 1, 'Preparing the full optional visual archive…');
    try {
      await post('CACHE_FULL_TEMPLE', { requestId: id });
      return id;
    } catch (error) {
      currentJobId = null;
      setBusy(false);
      setProgress(0, 1, `Offline download could not start: ${error.message}`);
      return null;
    }
  }

  async function cancelFullDownload() {
    if (!currentJobId) return false;
    const id = currentJobId;
    if (cancelButton) cancelButton.disabled = true;
    setProgress(progressNode?.value || 0, progressNode?.max || 1, 'Cancellation requested. Finishing the current small batch safely…');
    try {
      await post('CANCEL_FULL_TEMPLE', { requestId: id });
      return true;
    } catch (error) {
      if (cancelButton) cancelButton.disabled = false;
      setProgress(progressNode?.value || 0, progressNode?.max || 1, `Cancellation request failed: ${error.message}`);
      return false;
    }
  }

  async function clearVisuals() {
    if (currentJobId) return null;
    if (clearButton) clearButton.disabled = true;
    setProgress(0, 1, 'Clearing optional chamber visuals only…');
    try {
      const result = await request('CLEAR_OPTIONAL_VISUAL_CACHE', 'TEMPLE_OFFLINE_CLEAR_RESULT');
      if (!result.ok) throw new Error(result.error || 'Unable to clear optional visuals.');
      setProgress(1, 1, `Cleared ${result.cleared} cached optional visuals. Private Journey and study data were not touched.`);
      await refreshStatus();
      return result;
    } catch (error) {
      setProgress(0, 1, `Visual cache cleanup failed: ${error.message}`);
      return null;
    } finally {
      if (clearButton) clearButton.disabled = false;
    }
  }

  function handleServiceWorkerMessage(event) {
    const data = event.data || {};
    const waiting = data.requestId ? pending.get(data.requestId) : null;
    if (waiting && data.type === waiting.expectedType) {
      clearTimeout(waiting.timer);
      pending.delete(data.requestId);
      waiting.resolve(data);
      return;
    }

    if (data.type !== 'TEMPLE_OFFLINE_FULL_PROGRESS' || !data.requestId || data.requestId !== currentJobId) return;
    const completed = Number(data.completed) || 0;
    const total = Number(data.total) || 0;
    const failed = Number(data.failed) || 0;

    if (data.phase === 'started') {
      setProgress(completed, total, `Downloading ${total} visual assets for offline use…`);
      return;
    }
    if (data.phase === 'progress') {
      const suffix = failed ? ` · ${failed} unavailable so far` : '';
      setProgress(completed, total, `${completed} of ${total} visual assets processed${suffix}.`);
      return;
    }

    if (data.phase === 'cancelled') {
      setProgress(completed, total, `Offline download cancelled safely after ${completed} of ${total} assets. The normal PWA shell remains intact.`);
    } else if (data.phase === 'complete') {
      setProgress(total, total, `Offline visual archive complete: ${total} assets processed.`);
    } else if (data.phase === 'complete-with-errors') {
      setProgress(completed, total, `Offline visual archive finished with ${failed} unavailable assets. Cached content remains valid.`);
    } else {
      setProgress(completed, total || 1, `Offline download failed: ${data.error || 'unknown cache error'}. The normal PWA shell remains intact.`);
    }

    currentJobId = null;
    setBusy(false);
    refreshStatus();
  }

  function closeLayer() {
    if (!layer) return;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tm528o-modal-open');
  }

  function openLayer() {
    if (!document.body.classList.contains('temple-app-ready')) return false;
    ensureLayer();
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tm528o-modal-open');
    refreshStatus();
    return true;
  }

  function ensureLayer() {
    if (layer) return;
    layer = el('div', 'tm528o-layer');
    layer.id = 'tm528-offline';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('aria-labelledby', 'tm528o-title');

    const panel = el('section', 'tm528o-panel');
    const header = el('header', 'tm528o-header');
    const titles = el('div');
    titles.append(el('p', 'tm528o-eyebrow', 'Device ownership · explicit opt-in'), el('h2', '', 'Offline Temple'));
    titles.querySelector('h2').id = 'tm528o-title';
    header.append(titles, button('Close', closeLayer, 'tm528o-close'));

    const body = el('div', 'tm528o-body');
    body.append(
      el('p', 'tm528o-lead', 'Download Temple for Offline Use stores the full optional chamber visual set on this device so the 72 chamber displays, seals, and Parental Powers visuals can remain available without a network connection.'),
      el('p', 'tm528o-warning', 'The visual archive may consume substantial device storage. The browser ultimately controls quota and may evict non-persistent cache data when storage is scarce.')
    );

    const statusCard = el('section', 'tm528o-status-card');
    statusCard.append(el('h3', '', 'Storage status'));
    statusNode = el('p', 'tm528o-cache-status', 'Checking offline visual archive…');
    statusNode.setAttribute('role', 'status');
    statusNode.setAttribute('aria-live', 'polite');
    storageNode = el('p', 'tm528o-storage-status', 'Checking browser storage estimate…');
    statusCard.append(statusNode, storageNode);
    body.append(statusCard);

    const progressCard = el('section', 'tm528o-progress-card');
    progressCard.append(el('h3', '', 'Offline visual job'));
    progressNode = document.createElement('progress');
    progressNode.className = 'tm528o-progress';
    progressNode.max = 1;
    progressNode.value = 0;
    progressLabel = el('p', 'tm528o-progress-label', 'No offline visual job is running.');
    progressLabel.setAttribute('role', 'status');
    progressLabel.setAttribute('aria-live', 'polite');
    progressCard.append(progressNode, progressLabel);
    body.append(progressCard);

    const actions = el('div', 'tm528o-actions');
    downloadButton = button('Download Temple for Offline Use', startFullDownload, 'tm525-btn tm525-btn--secondary');
    cancelButton = button('Cancel Download', cancelFullDownload, 'tm525-btn tm525-btn--ghost');
    cancelButton.hidden = true;
    clearButton = button('Clear Optional Offline Visuals', clearVisuals, 'tm525-btn tm525-btn--danger');
    actions.append(
      downloadButton,
      cancelButton,
      button('Refresh Storage Status', refreshStatus, 'tm525-btn tm525-btn--ghost'),
      clearButton
    );
    body.append(actions);

    const boundary = el('section', 'tm528o-boundary');
    boundary.append(
      el('h3', '', 'What this does — and does not — clear'),
      el('p', '', 'Optional visual cleanup removes only cached chamber hero images, seal display images, and Parental Powers display images from Cache Storage.'),
      el('p', '', 'It does not erase your Pilgrim Journey, favorites, reflections, Library bookmarks, Library notes, or other local personal study state.'),
      el('p', '', 'Ritual audio is excluded from the service-worker cache. Canonical Ma’at ritual media remains device-installed in IndexedDB only after explicit visitor selection.')
    );
    body.append(boundary);

    panel.append(header, body);
    layer.append(panel);
    layer.addEventListener('click', (event) => { if (event.target === layer) closeLayer(); });
    document.body.append(layer);
  }

  function installStyle() {
    if (document.querySelector('link[data-temple-offline-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './styles/v5.2.8-offline-controls.css';
    link.dataset.templeOfflineStyle = 'true';
    document.head.appendChild(link);
  }

  function installDockButton() {
    const dock = document.getElementById('tm524-dock');
    if (!dock || dock.querySelector('[data-temple-offline-open]')) return Boolean(dock);
    const open = button('Offline', openLayer, 'tm524-dock-btn');
    open.dataset.templeOfflineOpen = 'true';
    open.setAttribute('aria-label', 'Open offline download and storage controls');
    const chamber = document.getElementById('tm524-dock-chamber');
    dock.insertBefore(open, chamber || null);
    return true;
  }

  function observeDock() {
    installDockButton();
    if (observer) return;
    observer = new MutationObserver(installDockButton);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    installStyle();
    ensureLayer();
    observeDock();
    if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && layer && !layer.hidden) closeLayer();
    });

    window.TempleOfflineManager = Object.freeze({
      version: VERSION,
      open: openLayer,
      close: closeLayer,
      status,
      downloadFull: startFullDownload,
      cancelFull: cancelFullDownload,
      clearVisuals,
      currentJob() { return currentJobId; }
    });

    document.dispatchEvent(new CustomEvent('temple:offline-controls-ready', { detail: { version: VERSION } }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
