/* Temple of SOL-OM-ON (Ma'at) v5.4.3 — mobile layout hardening */
(function () {
  'use strict';

  const root = document.getElementById('root');
  const STYLE_ID = 'temple-mobile-hardening-v543';
  let queued = false;

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Semantic class-based fallback for the Visitor Signature Book. This avoids
         depending on :has() support or generated utility-class ancestry. */
      @media (max-width: 767px) {
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

  function setAccessibleName(control, label) {
    if (!control || control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) return;
    control.setAttribute('aria-label', label);
  }

  function markSignatureBook() {
    const sealInput = document.querySelector('form input[placeholder="Seal Phrase"]');
    const form = sealInput?.closest('form');
    const section = form?.closest('section');
    if (!section) return false;

    section.classList.add('temple-signature-book');
    section.dataset.mobileLayout = 'hardened-v5.4.3';

    const card = section.firstElementChild;
    const layout = card?.firstElementChild;
    const formColumn = layout?.children?.[0] || null;
    const ledgerColumn = layout?.children?.[1] || null;
    card?.classList.add('temple-signature-book__card');
    layout?.classList.add('temple-signature-book__layout');
    formColumn?.classList.add('temple-signature-book__form-column');
    ledgerColumn?.classList.add('temple-signature-book__ledger-column');

    const filter = ledgerColumn?.querySelector('input[placeholder="Filter ledger…"]') || null;
    const actions = filter?.parentElement || null;
    const toolbar = actions?.parentElement || null;
    actions?.classList.add('temple-signature-book__actions');
    toolbar?.classList.add('temple-signature-book__toolbar');

    const table = ledgerColumn?.querySelector('table') || null;
    table?.parentElement?.classList.add('temple-signature-book__table-scroll');

    setAccessibleName(form.querySelector('input[placeholder="Name"]'), 'Visitor name');
    setAccessibleName(form.querySelector('input[placeholder="Wholesome Name (optional)"]'), 'Wholesome name, optional');
    setAccessibleName(form.querySelector('select'), 'Temple chamber');
    setAccessibleName(form.querySelector('input[placeholder="Intention"]'), 'Intention');
    setAccessibleName(form.querySelector('input[placeholder="Vow"]'), 'Vow');
    setAccessibleName(sealInput, 'Seal phrase');
    setAccessibleName(filter, 'Filter visitor signature ledger');

    return true;
  }

  function auditViewport() {
    if (innerWidth > 767) return;
    const section = document.querySelector('.temple-signature-book');
    if (!section) return;
    const sectionRect = section.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const safe = sectionRect.left >= -1 && sectionRect.right <= viewport + 1 && document.documentElement.scrollWidth <= viewport + 1;
    section.dataset.mobileGeometry = safe ? 'ok' : 'overflow';
  }

  function apply() {
    queued = false;
    installStyles();
    markSignatureBook();
    auditViewport();
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  installStyles();
  queue();

  if (root && window.MutationObserver) {
    new MutationObserver(queue).observe(root, { childList: true, subtree: true });
  }
  window.addEventListener('resize', queue, { passive: true });
  window.addEventListener('orientationchange', queue, { passive: true });

  window.TempleMobileHardening = Object.freeze({ refresh: apply });
})();
