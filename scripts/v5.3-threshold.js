/* Temple of Ma'at v5.2.4 — progressive enhancement and manual threshold gate */
(function () {
  'use strict';

  const root = document.getElementById('root');
  const statusPhrases = /^(offline mode|update available|update ready|install temple)$/i;
  let enhancementQueued = false;
  let hasEntered = false;

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
