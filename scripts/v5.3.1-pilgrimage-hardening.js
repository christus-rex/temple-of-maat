/* Temple of Ma'at v5.3.1 — pilgrimage persistence, scroll, and modal hardening */
(function () {
  'use strict';

  const VERSION = '1.0.0';
  const ROUTES = Object.freeze({
    enoch: Object.freeze({
      routeId: 'route.enoch-angelic-mirror',
      stateKey: 'temple_pilgrimage_enoch_v1'
    }),
    'pistis-sophia': Object.freeze({
      routeId: 'route.pistis-sophia-descent-return',
      stateKey: 'temple_pilgrimage_pistis_sophia_v1'
    })
  });
  const lastGate = new Map();
  let bodyObserver = null;

  function activeLayer() {
    return [...document.querySelectorAll('[data-temple-pilgrimage-route]')]
      .find((node) => !node.hidden && getComputedStyle(node).display !== 'none') || null;
  }

  function routeMeta(layer = activeLayer()) {
    const slug = layer?.dataset?.templePilgrimageRoute || '';
    const route = ROUTES[slug];
    return route ? { slug, ...route } : null;
  }

  function ensureStatus(layer = activeLayer()) {
    if (!layer) return null;
    let status = layer.querySelector('[data-pilgrimage-storage-status]');
    if (status) return status;
    status = document.createElement('p');
    status.className = 'tm53-route-storage-status';
    status.dataset.pilgrimageStorageStatus = 'true';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;
    const titleWrap = layer.querySelector('.tm53-route-header > div');
    (titleWrap || layer.querySelector('.tm53-route-header') || layer).appendChild(status);
    return status;
  }

  function announce(message, state = 'info', layer = activeLayer()) {
    const status = ensureStatus(layer);
    if (!status) return;
    status.hidden = false;
    status.dataset.state = state;
    status.textContent = message;
  }

  function clearStatus(layer = activeLayer()) {
    const status = ensureStatus(layer);
    if (!status) return;
    status.hidden = true;
    status.dataset.state = '';
    status.textContent = '';
  }

  function readDisk(meta) {
    try {
      const raw = localStorage.getItem(meta.stateKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function apiState(meta) {
    try {
      return window.TemplePilgrimageRoutes?.state?.(meta.routeId) || null;
    } catch {
      return null;
    }
  }

  function sameJson(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function diskMatchesApi(meta) {
    const disk = readDisk(meta);
    const api = apiState(meta);
    if (!disk || !api) return false;
    return disk.schema === api.schema
      && disk.routeId === api.routeId
      && disk.routeVersion === api.routeVersion
      && disk.started === api.started
      && disk.startedAt === api.startedAt
      && disk.updatedAt === api.updatedAt
      && disk.currentGate === api.currentGate
      && sameJson(disk.completedGates || [], api.completedGates || [])
      && sameJson(disk.records || {}, api.records || {});
  }

  function currentForm(layer = activeLayer()) {
    if (!layer) return {};
    const record = {};
    layer.querySelectorAll('[data-reality-field]').forEach((field) => {
      record[field.dataset.realityField] = String(field.value || '');
    });
    return record;
  }

  function recordMatchesDisk(meta, gate, record) {
    const disk = readDisk(meta);
    if (!disk || !gate) return false;
    const stored = disk.records?.[String(gate)] || disk.records?.[gate] || {};
    return Object.entries(record || {}).every(([key, value]) => String(stored?.[key] || '') === value);
  }

  function formDirty(meta, layer = activeLayer()) {
    const state = apiState(meta);
    if (!state) return false;
    const disk = readDisk(meta);
    const stored = disk?.records?.[String(state.currentGate)] || disk?.records?.[state.currentGate] || {};
    return Object.entries(currentForm(layer)).some(([key, value]) => String(stored?.[key] || '') !== value);
  }

  function probeStorage(meta) {
    const probeKey = `${meta.stateKey}__tm53_probe__`;
    try {
      const prior = localStorage.getItem(probeKey);
      localStorage.setItem(probeKey, `${Date.now()}`);
      if (prior == null) localStorage.removeItem(probeKey);
      else localStorage.setItem(probeKey, prior);
      return true;
    } catch {
      return false;
    }
  }

  function storageReadable(meta) {
    try {
      localStorage.getItem(meta.stateKey);
      return true;
    } catch {
      return false;
    }
  }

  function actionKind(button) {
    if (button.matches('.tm53-route-gate-button')) return 'navigate';
    if (button.dataset.primary === 'true') return 'complete';
    const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
    const label = (button.getAttribute('aria-label') || '').trim();
    if (/^Save Private Record$/i.test(text) || /^Save failed/i.test(text)) return 'save';
    if (/^←\s*Previous\s+/i.test(text)) return 'previous';
    if (/^Reset\s+/i.test(text)) return 'reset';
    if (/^Close\s+/i.test(label)) return 'close';
    return null;
  }

  function markSaveFailure(button) {
    if (!button || !document.contains(button)) return;
    const original = button.dataset.tm53OriginalLabel || 'Save Private Record';
    button.dataset.tm53OriginalLabel = original;
    button.textContent = 'Save failed — retry';
    setTimeout(() => {
      if (document.contains(button)) button.textContent = original;
    }, 1800);
  }

  function verifyAfterAction(kind, meta, before, button, layer) {
    if (kind === 'reset') {
      let cleared = false;
      try { cleared = localStorage.getItem(meta.stateKey) == null; } catch {}
      if (!cleared) announce('Reset could not be written to device storage. Your previous route state may return after reload.', 'error', layer);
      else clearStatus(layer);
      return;
    }

    const stateMatch = diskMatchesApi(meta);
    const recordMatch = recordMatchesDisk(meta, before.gate, before.record);
    if (!stateMatch || !recordMatch) {
      announce('Private route changes were not written to device storage. Retry, or export the route JSON before leaving this pilgrimage.', 'error', layer);
      if (kind === 'save') markSaveFailure(button);
      return;
    }

    if (kind === 'save') announce('Private record saved on this device.', 'ok', layer);
    else if (ensureStatus(layer)?.dataset.state === 'error') clearStatus(layer);
  }

  function interceptAction(event) {
    const button = event.target?.closest?.('button');
    const layer = button?.closest?.('[data-temple-pilgrimage-route]');
    if (!button || !layer || layer.hidden) return;
    const kind = actionKind(button);
    if (!kind) return;
    const meta = routeMeta(layer);
    if (!meta) return;

    if (kind === 'reset') {
      if (!storageReadable(meta)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        announce('Device storage is unavailable, so this route cannot be reset safely.', 'error', layer);
        return;
      }
      requestAnimationFrame(() => verifyAfterAction(kind, meta, { gate: null, record: {} }, button, layer));
      return;
    }

    if (kind === 'close' && !formDirty(meta, layer)) return;

    if (!probeStorage(meta)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      announce('Device storage is unavailable. Your private route changes were not saved. Retry or export JSON before leaving.', 'error', layer);
      if (kind === 'save') markSaveFailure(button);
      return;
    }

    const state = apiState(meta);
    const before = {
      gate: Number(state?.currentGate) || 1,
      record: currentForm(layer)
    };
    requestAnimationFrame(() => verifyAfterAction(kind, meta, before, button, layer));
  }

  function interceptEscape(event) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    const layer = activeLayer();
    const meta = routeMeta(layer);
    if (!layer || !meta || !formDirty(meta, layer)) return;
    if (probeStorage(meta)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    announce('Device storage is unavailable. Export the route JSON or retry saving before closing this private record.', 'error', layer);
  }

  function scrollRouteToTop() {
    const panel = activeLayer()?.querySelector('.tm53-route-panel');
    if (!panel) return;
    panel.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  function onRouteChange(event) {
    const routeId = event.detail?.routeId;
    const gate = Number(event.detail?.state?.currentGate) || 0;
    if (!routeId || !gate) return;
    const previous = lastGate.get(routeId);
    lastGate.set(routeId, gate);
    if (previous != null && previous !== gate) requestAnimationFrame(scrollRouteToTop);
  }

  function seedGatePositions() {
    try {
      window.TemplePilgrimageRoutes?.routes?.().forEach((route) => {
        const gate = Number(window.TemplePilgrimageRoutes?.state?.(route.routeId)?.currentGate) || 1;
        lastGate.set(route.routeId, gate);
      });
    } catch {}
  }

  function installStyles() {
    if (document.querySelector('style[data-tm531-pilgrimage-hardening]')) return;
    const style = document.createElement('style');
    style.dataset.tm531PilgrimageHardening = 'true';
    style.textContent = `
      html.tm53-pilgrimage-scroll-lock,
      body.tm53-pilgrimage-open {
        overflow: hidden !important;
        overscroll-behavior: none !important;
      }
      body.tm53-pilgrimage-open .tm53-route-panel {
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }
      .tm53-route-storage-status {
        margin: 7px 0 0;
        max-width: 62ch;
        color: #c7c1b5;
        font: 700 11px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      .tm53-route-storage-status[data-state="ok"] { color: #bff3db; }
      .tm53-route-storage-status[data-state="error"] { color: #f2b8b8; }
    `;
    document.head.appendChild(style);
  }

  function syncScrollLock() {
    document.documentElement.classList.toggle('tm53-pilgrimage-scroll-lock', document.body.classList.contains('tm53-pilgrimage-open'));
    if (activeLayer()) ensureStatus();
  }

  function init() {
    installStyles();
    seedGatePositions();
    syncScrollLock();
    document.addEventListener('click', interceptAction, true);
    document.addEventListener('keydown', interceptEscape, true);
    document.addEventListener('temple:pilgrimage-route-change', onRouteChange);
    document.addEventListener('temple:pilgrimage-routes-ready', () => {
      seedGatePositions();
      syncScrollLock();
    });
    if (!bodyObserver && document.body) {
      bodyObserver = new MutationObserver(syncScrollLock);
      bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    }
    window.TemplePilgrimageHardening = Object.freeze({
      version: VERSION,
      storageStatus: () => {
        const status = activeLayer()?.querySelector('[data-pilgrimage-storage-status]');
        return status ? { state: status.dataset.state || '', message: status.textContent || '' } : null;
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
