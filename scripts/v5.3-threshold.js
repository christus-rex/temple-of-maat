/* Temple of Ma'at v5.3 — progressive enhancement layer */
(function () {
  'use strict';

  const root = document.getElementById('root');
  const statusPhrases = /^(offline mode|update available|update ready|install temple)$/i;
  let enhancementQueued = false;

  function markApplicationReady() {
    if (root && root.childElementCount > 0) {
      document.body.classList.add('temple-app-ready');
      root.setAttribute('tabindex', '-1');
      return true;
    }
    return false;
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
      markApplicationReady();
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

  document.addEventListener('DOMContentLoaded', () => {
    markApplicationReady();
    enhanceControls(document);
    cacheCurrentChamber();

    const staticEntry = document.getElementById('temple-static-entry');
    if (staticEntry) {
      staticEntry.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-temple-entry]');
        if (!link) return;
        document.body.classList.add('temple-app-ready');
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
