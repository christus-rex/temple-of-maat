/* Temple of SOL-OM-ON (Ma'at) v5.4.3 — mobile layout hardening */
(function () {
  'use strict';

  const root = document.getElementById('root');
  const STYLE_ID = 'temple-mobile-hardening-v543';
  const SEMANTICS_SRC = './scripts/v5.4.4-signature-book-semantics.js';
  const RELEASE_STATUS_SRC = './scripts/v5.4.5-release-status.js';
  const FIRE_FILTER_HEADING = 'Seven Fires • Filterable Flames';
  let queued = false;
  let semanticsRequested = false;
  let releaseStatusRequested = false;

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Modal stack guard. Legacy Poems and v5.5 Archive originally used two-digit
         z-index values while the Living Codex dock lives in the 8800 range. Keep
         immersive chambers above global chrome and suppress controls that would
         otherwise intercept taps through the modal surface. */
      body.temple-poems-open .temple-poems-backdrop {
        z-index: 9310 !important;
      }
      body.temple-living-archive-open .temple-living-archive {
        z-index: 9320 !important;
      }
      body.temple-poems-open :is(
        .tm524-dock,
        .tm524-chamber-tools,
        .temple-shem-gateway,
        .temple-living-archive-launcher,
        .tm528-launcher,
        #temple-release-update,
        #temple-release-diagnostics
      ),
      body.temple-living-archive-open :is(
        .tm524-dock,
        .tm524-chamber-tools,
        .temple-shem-gateway,
        .temple-poems-gateway,
        .tm528-launcher,
        #temple-release-update,
        #temple-release-diagnostics
      ) {
        display: none !important;
        pointer-events: none !important;
      }

      @media (max-width: 767px) {
        /* The two-row Living Codex dock is fixed over the document. Reserve a real
           scroll landing zone so the footer and final controls can always clear it. */
        html {
          scroll-padding-bottom: calc(148px + env(safe-area-inset-bottom)) !important;
        }
        body.temple-app-ready #root {
          box-sizing: border-box !important;
          padding-bottom: calc(148px + env(safe-area-inset-bottom)) !important;
        }

        /* iOS Safari zooms the viewport when focusing text-entry controls rendered
           below 16px. Several legacy/runtime panels intentionally use 13px desktop
           typography, so normalize only editable/select controls on phones. */
        :where(
          input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]),
          select,
          textarea
        ) {
          font-size: 16px !important;
        }

        /* Keep late-loaded release controls above the fixed mobile dock rather than
           letting their low historical z-index/bottom offset tuck beneath it. */
        #temple-release-update,
        #temple-release-diagnostics {
          bottom: calc(max(8px, env(safe-area-inset-bottom)) + 126px) !important;
          z-index: 8890 !important;
        }
        #temple-release-diagnostics { z-index: 8891 !important; }

        /* Legacy direct gateways remain useful on mobile, but their original 14px
           bottom offsets place them underneath the two-row dock. Stack them clear of
           the dock while keeping the v5.5 unified Archive launcher unobstructed. */
        body.temple-app-ready:not(.temple-artifact-open) .temple-shem-gateway {
          left: max(8px, env(safe-area-inset-left)) !important;
          bottom: calc(max(8px, env(safe-area-inset-bottom)) + 126px) !important;
          z-index: 8700 !important;
          min-height: 44px !important;
          box-sizing: border-box !important;
        }
        body.temple-app-ready:not(.temple-artifact-open) .temple-poems-gateway {
          right: max(8px, env(safe-area-inset-right)) !important;
          bottom: calc(max(8px, env(safe-area-inset-bottom)) + 176px) !important;
          z-index: 8701 !important;
          min-height: 44px !important;
          box-sizing: border-box !important;
        }

        /* Seven Fires selector: keep the complete chip rail inside the phone viewport.
           The page itself intentionally hides horizontal overflow, so this local rail
           owns horizontal scrolling and always leaves room for the final selection. */
        .temple-fire-filter-heading-row {
          display: block !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .temple-fire-filter-heading-row > h3 {
          margin-bottom: 12px !important;
        }
        .temple-fire-filter-strip {
          display: flex !important;
          flex-wrap: nowrap !important;
          align-items: stretch !important;
          justify-content: flex-start !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          gap: 10px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          padding: 2px max(20px, env(safe-area-inset-right)) 10px max(1px, env(safe-area-inset-left)) !important;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-inline: contain;
          scroll-snap-type: x proximity;
          scroll-padding-inline: 20px;
          scrollbar-width: none;
        }
        .temple-fire-filter-strip::-webkit-scrollbar {
          display: none;
        }
        .temple-fire-filter-strip > button {
          flex: 0 0 auto !important;
          min-width: max-content !important;
          min-height: 44px !important;
          white-space: nowrap !important;
          scroll-snap-align: center;
        }

        .temple-signature-book {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }
        .temple-signature-book__card {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }
        .temple-signature-book__layout {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          padding: 20px !important;
          gap: 24px !important;
        }
        .temple-signature-book__form-column,
        .temple-signature-book__ledger-column,
        .temple-signature-book form {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .temple-signature-book form :where(input, select, button) {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .temple-signature-book h3 {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          white-space: normal !important;
          overflow-wrap: anywhere !important;
          word-break: normal !important;
          font-size: clamp(20px, 6.3vw, 24px) !important;
          line-height: 1.18 !important;
        }
        .temple-signature-book__toolbar {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          justify-content: flex-start !important;
          gap: 12px !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }
        .temple-signature-book__toolbar > :first-child {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }
        .temple-signature-book__toolbar > :first-child span:last-child {
          white-space: normal !important;
          overflow-wrap: anywhere !important;
        }
        .temple-signature-book__actions {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 8px !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }
        .temple-signature-book__actions > input {
          grid-column: 1 / -1 !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .temple-signature-book__actions > button {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
          white-space: nowrap !important;
          box-sizing: border-box !important;
        }
        .temple-signature-book__table-scroll {
          display: block !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          overflow-x: auto !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-inline: contain;
          box-sizing: border-box !important;
        }
        .temple-signature-book__table-scroll > table {
          width: 620px !important;
          min-width: 620px !important;
          max-width: none !important;
        }
        .temple-signature-book__table-scroll :where(th, td) {
          white-space: normal !important;
          overflow-wrap: anywhere !important;
        }
      }

      @media (max-width: 380px) {
        .temple-signature-book__layout { padding: 16px !important; }
        .temple-signature-book__actions { grid-template-columns: 1fr !important; }
        .temple-signature-book__actions > input { grid-column: 1 !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function findFireFilterStrip() {
    const heading = [...document.querySelectorAll('h3')].find((node) =>
      (node.textContent || '').replace(/\s+/g, ' ').trim() === FIRE_FILTER_HEADING
    );
    if (!heading || !heading.parentElement) return null;

    const row = heading.parentElement;
    const strip = heading.nextElementSibling;
    if (!strip || !strip.querySelector('button')) return null;

    row.classList.add('temple-fire-filter-heading-row');
    strip.classList.add('temple-fire-filter-strip');
    strip.dataset.templeFireFilter = 'seven-fires';
    strip.setAttribute('role', 'group');
    strip.setAttribute('aria-label', 'Seven Fires filter');
    return strip;
  }

  function centerFireFilterButton(strip, button) {
    if (!strip || !button || innerWidth > 767) return;
    const stripRect = strip.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const buttonCenterInScroll = (buttonRect.left - stripRect.left) + strip.scrollLeft + (buttonRect.width / 2);
    const maxScroll = Math.max(0, strip.scrollWidth - strip.clientWidth);
    const target = buttonCenterInScroll - (strip.clientWidth / 2);
    const left = Math.max(0, Math.min(maxScroll, target));
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (typeof strip.scrollTo === 'function') {
      strip.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      strip.scrollLeft = left;
    }
  }

  function wireFireFilterStrip() {
    const strip = findFireFilterStrip();
    if (!strip || strip.dataset.templeFireFilterWired === 'true') return Boolean(strip);

    strip.dataset.templeFireFilterWired = 'true';
    const revealButton = (event) => {
      const button = event.target.closest?.('button');
      if (!button || !strip.contains(button)) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => centerFireFilterButton(strip, button));
      });
    };
    strip.addEventListener('click', revealButton);
    strip.addEventListener('focusin', revealButton);
    return true;
  }

  function ensureSemantics() {
    if (window.TempleSignatureBookSemantics?.apply) {
      window.TempleSignatureBookSemantics.apply();
      return true;
    }
    if (semanticsRequested) return false;
    semanticsRequested = true;
    let script = document.querySelector('script[data-temple-signature-book-semantics]');
    if (!script) {
      script = document.createElement('script');
      script.src = SEMANTICS_SRC;
      script.async = false;
      script.dataset.templeSignatureBookSemantics = 'v5.4.4';
      document.head.appendChild(script);
    }
    script.addEventListener('load', queue, { once: true });
    return false;
  }

  function ensureReleaseStatus() {
    if (window.TempleReleaseStatus?.refresh) return true;
    if (releaseStatusRequested) return false;
    releaseStatusRequested = true;
    let script = document.querySelector('script[data-temple-release-status]');
    if (!script) {
      script = document.createElement('script');
      script.src = RELEASE_STATUS_SRC;
      script.async = false;
      script.dataset.templeReleaseStatus = 'v5.4.5';
      document.head.appendChild(script);
    }
    return false;
  }

  function auditViewport() {
    if (innerWidth > 767) return;
    const section = document.querySelector('.temple-signature-book');
    if (!section) return;
    const sectionRect = section.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const safe = sectionRect.left >= -1 && sectionRect.right <= viewport + 1 && document.documentElement.scrollWidth <= viewport + 1;
    section.dataset.mobileLayout = 'hardened-v5.4.3';
    section.dataset.mobileGeometry = safe ? 'ok' : 'overflow';
  }

  function apply() {
    queued = false;
    installStyles();
    wireFireFilterStrip();
    ensureReleaseStatus();
    const semanticReady = ensureSemantics();
    if (semanticReady) auditViewport();
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  installStyles();
  queue();

  if (root && window.MutationObserver) new MutationObserver(queue).observe(root, { childList: true, subtree: true });
  window.addEventListener('resize', queue, { passive: true });
  window.addEventListener('orientationchange', queue, { passive: true });

  window.TempleMobileHardening = Object.freeze({ version: '5.4.3', refresh: apply });
})();
