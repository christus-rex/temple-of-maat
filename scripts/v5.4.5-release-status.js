/* Temple of SOL-OM-ON (Ma'at) v5.4.5 — release status and update UI */
(function () {
  'use strict';

  const UPDATE_ID = 'temple-release-update';
  const PANEL_ID = 'temple-release-diagnostics';
  const STYLE_ID = 'temple-release-status-style';
  const HEALTH_KEY = 'temple_release_health_v1';
  const LIVING_ARCHIVE_SRC = './scripts/v5.5-living-archive.js';
  let hadController = Boolean(navigator.serviceWorker?.controller);
  let diagnosticsState = null;
  let livingArchiveRequested = false;

  function safeStore() {
    try { return window.localStorage; } catch (_) { return null; }
  }

  function ensureLivingArchive() {
    if (window.TempleLivingArchive?.open) return true;
    if (livingArchiveRequested) return false;
    livingArchiveRequested = true;
    let script = document.querySelector('script[data-temple-living-archive-runtime]');
    if (!script) {
      script = document.createElement('script');
      script.src = LIVING_ARCHIVE_SRC;
      script.async = false;
      script.dataset.templeLivingArchiveRuntime = '5.5.1';
      script.addEventListener('error', () => { livingArchiveRequested = false; }, { once: true });
      document.head.appendChild(script);
    }
    return false;
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${UPDATE_ID}{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(86px,calc(env(safe-area-inset-bottom) + 72px));z-index:90;border:1px solid rgba(212,175,55,.56);border-radius:999px;background:rgba(7,16,25,.96);color:#f5e6c8;padding:10px 14px;font:700 11px/1.2 ui-monospace,monospace;letter-spacing:.06em;box-shadow:0 10px 32px rgba(0,0,0,.48);backdrop-filter:blur(12px);cursor:pointer}
      #${UPDATE_ID}:focus-visible{outline:2px solid #d4af37;outline-offset:3px}
      #${PANEL_ID}{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(86px,calc(env(safe-area-inset-bottom) + 72px));z-index:91;width:min(380px,calc(100vw - 28px));max-height:min(68vh,560px);overflow:auto;border:1px solid rgba(212,175,55,.4);border-radius:18px;background:rgba(7,16,25,.98);color:#f5e6c8;padding:18px;box-shadow:0 18px 56px rgba(0,0,0,.58);backdrop-filter:blur(16px);font:12px/1.5 ui-monospace,monospace}
      #${PANEL_ID}[hidden]{display:none!important}
      #${PANEL_ID} h2{margin:0 0 12px;font:700 15px/1.3 Cinzel,serif;letter-spacing:.08em}
      #${PANEL_ID} dl{display:grid;grid-template-columns:minmax(104px,.8fr) minmax(0,1.2fr);gap:8px 12px;margin:0}
      #${PANEL_ID} dt{opacity:.68} #${PANEL_ID} dd{margin:0;overflow-wrap:anywhere}
      #${PANEL_ID} .temple-release-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
      #${PANEL_ID} button,#${PANEL_ID} .temple-release-link{border:1px solid rgba(212,175,55,.35);border-radius:999px;background:rgba(255,255,255,.05);color:inherit;padding:8px 11px;font:inherit;cursor:pointer;text-decoration:none}
      #${PANEL_ID} button:focus-visible,#${PANEL_ID} .temple-release-link:focus-visible{outline:2px solid #d4af37;outline-offset:2px}
      @media(max-width:520px){#${UPDATE_ID}{right:10px;bottom:max(104px,calc(env(safe-area-inset-bottom) + 92px));font-size:10px;padding:9px 11px}#${PANEL_ID}{right:10px;bottom:max(104px,calc(env(safe-area-inset-bottom) + 92px));width:calc(100vw - 20px);padding:15px}#${PANEL_ID} dl{grid-template-columns:1fr;gap:3px}#${PANEL_ID} dd{margin-bottom:7px}}
    `;
    document.head.appendChild(style);
  }

  function parseCacheRevision(source) {
    return String(source || '').match(/const CACHE_REVISION = '([^']+)'/)?.[1] || 'unknown';
  }

  async function readDiagnostics() {
    const result = {
      version: 'unknown',
      build: 'unknown',
      cacheRevision: 'unknown',
      serviceWorker: navigator.serviceWorker?.controller ? 'controlled' : 'uncontrolled',
      checkedAt: new Date().toISOString(),
      ok: false
    };
    try {
      const [versionResponse, workerResponse] = await Promise.all([
        fetch(`./version.json?release_status=${Date.now()}`, { cache: 'no-store' }),
        fetch(`./sw.js?release_status=${Date.now()}`, { cache: 'no-store' })
      ]);
      if (versionResponse.ok) {
        const release = await versionResponse.json();
        result.version = String(release.version || 'unknown');
        result.build = String(release.build || 'unknown');
      }
      if (workerResponse.ok) result.cacheRevision = parseCacheRevision(await workerResponse.text());
      result.serviceWorker = navigator.serviceWorker?.controller ? 'controlled' : 'uncontrolled';
      result.ok = versionResponse.ok && workerResponse.ok && result.serviceWorker === 'controlled';
    } catch (_) {
      result.ok = false;
    }
    diagnosticsState = Object.freeze(result);
    if (result.ok) {
      try { safeStore()?.setItem(HEALTH_KEY, JSON.stringify(result)); } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent('temple:release-health', { detail: diagnosticsState }));
    return diagnosticsState;
  }

  function rememberedHealth() {
    try {
      const parsed = JSON.parse(safeStore()?.getItem(HEALTH_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.hidden = true;
  }

  async function openPanel() {
    installStyle();
    const status = await readDiagnostics();
    const remembered = rememberedHealth();
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('section');
      panel.id = PANEL_ID;
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'false');
      panel.setAttribute('aria-labelledby', `${PANEL_ID}-title`);
      document.body.appendChild(panel);
    }
    panel.innerHTML = `
      <h2 id="${PANEL_ID}-title">Temple Release Status</h2>
      <dl>
        <dt>Portal</dt><dd>v${status.version}</dd>
        <dt>Build</dt><dd>${status.build}</dd>
        <dt>PWA cache</dt><dd>${status.cacheRevision}</dd>
        <dt>Service worker</dt><dd>${status.serviceWorker}</dd>
        <dt>Health</dt><dd>${status.ok ? 'local runtime checks passed' : 'runtime check incomplete'}</dd>
        <dt>Checked</dt><dd>${status.checkedAt}</dd>
        <dt>Last good check</dt><dd>${remembered?.checkedAt || 'none recorded on this device'}</dd>
      </dl>
      <div class="temple-release-actions">
        <a class="temple-release-link" href="./health/">Temple Health</a>
        <button type="button" data-temple-release-refresh>Refresh status</button>
        <button type="button" data-temple-release-reload>Reload Temple</button>
        <button type="button" data-temple-release-close>Close</button>
      </div>`;
    panel.hidden = false;
    panel.querySelector('[data-temple-release-refresh]')?.addEventListener('click', openPanel, { once: true });
    panel.querySelector('[data-temple-release-reload]')?.addEventListener('click', () => location.reload());
    panel.querySelector('[data-temple-release-close]')?.addEventListener('click', closePanel);
    panel.querySelector('[data-temple-release-close]')?.focus();
  }

  function showUpdate() {
    installStyle();
    let button = document.getElementById(UPDATE_ID);
    if (!button) {
      button = document.createElement('button');
      button.id = UPDATE_ID;
      button.type = 'button';
      button.textContent = 'UPDATE READY · RELOAD';
      button.setAttribute('aria-label', 'A new Temple version is ready. Reload now.');
      button.addEventListener('click', () => location.reload());
      document.body.appendChild(button);
    }
    button.hidden = false;
  }

  function bindPortalBadge() {
    const badge = document.querySelector('[data-temple-portal-version]');
    if (!badge || badge.dataset.templeReleaseDiagnostics === 'bound') return;
    badge.dataset.templeReleaseDiagnostics = 'bound';
    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.title = `${badge.title ? `${badge.title} · ` : ''}Open release diagnostics`;
    badge.addEventListener('click', openPanel);
    badge.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPanel();
      }
    });
  }

  async function watchServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) showUpdate();
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
        });
      });
    } catch (_) {}

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const shouldNotify = hadController;
      hadController = true;
      if (shouldNotify) showUpdate();
      readDiagnostics();
    });
  }

  function mount() {
    installStyle();
    bindPortalBadge();
    ensureLivingArchive();
    readDiagnostics();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  if (window.MutationObserver) new MutationObserver(bindPortalBadge).observe(document.documentElement, { childList: true, subtree: true });
  watchServiceWorker();

  window.TempleReleaseStatus = Object.freeze({ version: '5.4.5', refresh: readDiagnostics, open: openPanel, diagnostics: () => diagnosticsState || rememberedHealth() });
})();
