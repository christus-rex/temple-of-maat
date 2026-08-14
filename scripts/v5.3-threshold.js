/* Temple of Ma'at v5.2.7 — progressive enhancement and manual threshold gate */
(function () {
  'use strict';

  const root = document.getElementById('root');
  const statusPhrases = /^(offline mode|update available|update ready|install temple)$/i;
  let enhancementQueued = false;
  let hasEntered = false;
  let artifactInteractionObserver = null;

  function loadEnhancement(src, key) {
    if (document.querySelector(`script[data-temple-enhancement="${key}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.templeEnhancement = key;
    document.head.appendChild(script);
  }

  function loadLivingCodex() {
    loadEnhancement('./scripts/v5.2.4-living-codex.js', 'living-codex');
    loadEnhancement('./scripts/v5.2.4-chant-fallback.js', 'chant-fallback');
    loadEnhancement('./scripts/v5.2.5-living-temple.js', 'living-temple');
    loadEnhancement('./scripts/v5.2.6-shem-dossiers.js', 'shem-dossiers');
    loadEnhancement('./scripts/v5.2.5-media-vault.js', 'media-vault');
    loadEnhancement('./scripts/v5.2.8-temple-library.js', 'temple-library');
    loadEnhancement('./scripts/v5.2.8-journey-import.js', 'journey-import');
    loadEnhancement('./scripts/v5.2.8-offline-controls.js', 'offline-controls');
  }

  function syncArtifactInteractionState() {
    if (!document.body) return;
    const isOpen = Boolean(document.querySelector('#tm2-artifact.open'));
    const hasClass = document.body.classList.contains('temple-artifact-open');
    if (isOpen !== hasClass) document.body.classList.toggle('temple-artifact-open', isOpen);
  }

  function installArtifactInteractionGuard() {
    if (!document.querySelector('style[data-temple-artifact-guard]')) {
      const style = document.createElement('style');
      style.dataset.templeArtifactGuard = 'true';
      style.textContent = `
        /* Manual threshold covenant: runtime chamber artifacts may mount from a URL hash,
           but they must never be visible or intercept the explicit entrance gesture. */
        body:not(.temple-app-ready) .tm2-artifact-backdrop {
          visibility: hidden !important;
          pointer-events: none !important;
        }

        /* The chamber artifact already contains its own Collect and download controls.
           On narrow screens, suspend redundant global floating controls while that
           artifact is open so they cannot cover or intercept artifact buttons. */
        @media (max-width: 760px) {
          body.temple-artifact-open .tm524-dock,
          body.temple-artifact-open .tm524-chamber-tools,
          body.temple-artifact-open .temple-shem-gateway {
            display: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    syncArtifactInteractionState();
    if (artifactInteractionObserver || !document.body) return;
    artifactInteractionObserver = new MutationObserver(syncArtifactInteractionState);
    artifactInteractionObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function installShemGateway() {
    if (document.querySelector('[data-shem-gateway]')) return;

    const staticNav = document.querySelector('#temple-static-entry .temple-static-entry__actions');
    if (staticNav) {
      const staticLink = document.createElement('a');
      staticLink.className = 'temple-static-entry__action temple-static-entry__action--secondary';
      staticLink.href = './shem-hamephorash-72.html';
      staticLink.dataset.shemGateway = 'static';
      staticLink.textContent = 'Enter the Shem 72 Archive';
      staticNav.appendChild(staticLink);
    }

    const style = document.createElement('style');
    style.dataset.shemGateway = 'styles';
    style.textContent = `
      .temple-shem-gateway{display:none;position:fixed;left:max(14px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));z-index:55;align-items:center;gap:8px;padding:10px 13px;border:1px solid rgba(212,175,55,.38);border-radius:999px;background:rgba(10,9,7,.9);color:#f5e6c8;text-decoration:none;font:700 11px/1.2 ui-monospace,monospace;letter-spacing:.06em;box-shadow:0 10px 30px rgba(0,0,0,.42);backdrop-filter:blur(12px)}
      .temple-app-ready .temple-shem-gateway{display:inline-flex}
      .temple-shem-gateway__sigil{color:#d4af37;font-size:14px}
      .temple-shem-gateway:focus-visible{outline:2px solid #d4af37;outline-offset:3px}
      @media (max-width:520px){.temple-shem-gateway{font-size:10px;padding:9px 11px}.temple-shem-gateway__long{display:none}}
    `;
    document.head.appendChild(style);

    const gateway = document.createElement('a');
    gateway.className = 'temple-shem-gateway';
    gateway.href = './shem-hamephorash-72.html';
    gateway.dataset.shemGateway = 'floating';
    gateway.setAttribute('aria-label', 'Open the Shem HaMephorash 72 archive');
    gateway.innerHTML = '<span class="temple-shem-gateway__sigil" aria-hidden="true">✦</span><span>SHEM 72<span class="temple-shem-gateway__long"> · ARCHIVE</span></span>';
    document.body.appendChild(gateway);
  }

  function noteApplicationMounted() {
    if (root && root.childElementCount > 0) {
      root.setAttribute('tabindex', '-1');
      return true;
    }
    return false;
  }

  function holdAtThreshold() {
    hasEntered = false;
    document.body.classList.remove('temple-app-ready');
    if (root) {
      root.setAttribute('aria-hidden', 'true');
      root.setAttribute('inert', '');
    }
    const status = document.querySelector('#temple-static-entry .temple-static-entry__status');
    if (status) status.textContent = 'Awaiting your entry.';
  }

  function enterTemple() {
    if (hasEntered) return;
    hasEntered = true;
    if (root) {
      root.removeAttribute('aria-hidden');
      root.removeAttribute('inert');
    }
    document.body.classList.add('temple-app-ready');
  }

  function inferControlLabel(control) {
    if (control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) return;
    const text = (control.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) return;

    const title = (control.getAttribute('title') || '').trim();
    if (title) {
      control.setAttribute('aria-label', title);
      return;
    }

    const symbol = (control.innerText || '').trim();
    const labels = {
      '×': 'Close',
      '✕': 'Close',
      '−': 'Minimize',
      '–': 'Minimize',
      '▶': 'Play',
      '⏸': 'Pause',
      '⏹': 'Stop',
      '🔊': 'Audio',
      '🔇': 'Mute audio'
    };
    if (labels[symbol]) control.setAttribute('aria-label', labels[symbol]);
  }

  function enhanceControls(scope) {
    const base = scope && scope.querySelectorAll ? scope : document;

    base.querySelectorAll('button, [role="button"]').forEach((control) => {
      inferControlLabel(control);
      if (!control.hasAttribute('type') && control.tagName === 'BUTTON') {
        control.setAttribute('type', 'button');
      }
    });

    base.querySelectorAll('audio').forEach((audio, index) => {
      if (!audio.hasAttribute('aria-label')) {
        audio.setAttribute('aria-label', index === 0 ? 'Temple ritual soundscape' : `Temple audio ${index + 1}`);
      }
    });

    base.querySelectorAll('img').forEach((image) => {
      if (!image.hasAttribute('alt') && image.getAttribute('role') === 'presentation') image.setAttribute('alt', '');
    });

    base.querySelectorAll('[aria-live], [role="status"]').forEach((node) => {
      if (!node.hasAttribute('aria-live')) node.setAttribute('aria-live', 'polite');
    });

    base.querySelectorAll('div, p, span').forEach((node) => {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text && text.length < 40 && statusPhrases.test(text) && !node.hasAttribute('role')) {
        node.setAttribute('role', 'status');
        node.setAttribute('aria-live', 'polite');
      }
    });
  }

  function queueEnhancement() {
    if (enhancementQueued) return;
    enhancementQueued = true;
    requestAnimationFrame(() => {
      enhancementQueued = false;
      noteApplicationMounted();
      enhanceControls(document);
    });
  }

  function chamberFromHash() {
    const match = location.hash.match(/chamber-(\d{1,2})/i);
    if (!match) return null;
    const value = Number(match[1]);
    return value >= 1 && value <= 72 ? value : null;
  }

  function postToServiceWorker(message) {
    if (!('serviceWorker' in navigator)) return Promise.resolve(false);
    return navigator.serviceWorker.ready.then((registration) => {
      const worker = registration.active || registration.waiting || registration.installing;
      if (!worker) return false;
      worker.postMessage(message);
      return true;
    }).catch(() => false);
  }

  function cacheCurrentChamber() {
    const chamber = chamberFromHash() || 1;
    postToServiceWorker({ type: 'CACHE_CHAMBER', chamber });
  }

  window.TempleOfflineCache = Object.freeze({
    cacheChamber(chamber) {
      const number = Number(chamber);
      if (!Number.isInteger(number) || number < 1 || number > 72) {
        return Promise.reject(new RangeError('Chamber must be an integer from 1 to 72.'));
      }
      return postToServiceWorker({ type: 'CACHE_CHAMBER', chamber: number });
    },
    downloadFull() {
      return postToServiceWorker({ type: 'CACHE_FULL_TEMPLE' });
    }
  });

  loadLivingCodex();

  document.addEventListener('DOMContentLoaded', () => {
    holdAtThreshold();
    noteApplicationMounted();
    enhanceControls(document);
    installArtifactInteractionGuard();
    installShemGateway();
    cacheCurrentChamber();

    const staticEntry = document.getElementById('temple-static-entry');
    if (staticEntry) {
      staticEntry.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-temple-entry]');
        if (!link) return;
        enterTemple();
      });
    }
  });

  window.addEventListener('hashchange', cacheCurrentChamber, { passive: true });
  navigator.serviceWorker?.addEventListener('controllerchange', cacheCurrentChamber);

  if (root) {
    new MutationObserver(queueEnhancement).observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['title', 'aria-label', 'role']
    });
  }
})();
