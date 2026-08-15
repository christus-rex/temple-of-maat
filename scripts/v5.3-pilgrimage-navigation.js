/* Temple of Ma'at v5.3 — Pilgrim Journey navigation enhancement */
(function () {
  'use strict';

  const MAX_CHAMBER = 72;
  let observer = null;

  function clampChamber(value) {
    const number = Number(value);
    if (!Number.isInteger(number)) return 1;
    return Math.min(MAX_CHAMBER, Math.max(1, number));
  }

  function journeyOpen() {
    const layer = document.getElementById('tm525-journey');
    return Boolean(layer && !layer.hidden);
  }

  function dossierOpen() {
    const layer = document.getElementById('tm525-dossier');
    return Boolean(layer && !layer.hidden);
  }

  function currentJourneyChamber() {
    try {
      const current = window.TemplePilgrimJourney?.state?.()?.current;
      if (current) return clampChamber(current);
    } catch {}

    const eyebrow = document.querySelector('#tm525-journey .tm525-current-card .tm525-eyebrow');
    const match = eyebrow?.textContent?.match(/(\d{1,2})\s*$/);
    return clampChamber(match ? match[1] : 1);
  }

  function currentDossierChamber() {
    const eyebrow = document.querySelector('#tm525-dossier .tm525-dossier-names .tm525-eyebrow');
    const match = eyebrow?.textContent?.match(/Chamber\s+(\d{1,2})/i);
    return clampChamber(match ? match[1] : currentJourneyChamber());
  }

  function selectJourneyChamber(number) {
    const target = clampChamber(number);
    const nodes = [...document.querySelectorAll('#tm525-journey .tm525-node-grid .tm525-node')];
    const node = nodes[target - 1];
    if (node) {
      node.click();
      requestAnimationFrame(() => {
        document.querySelector('#tm525-journey .tm53-pilgrim-nav')?.focus?.({ preventScroll: true });
      });
      return true;
    }
    return false;
  }

  function selectDossierChamber(number) {
    const target = clampChamber(number);
    if (typeof window.TemplePilgrimJourney?.openDossier !== 'function') return false;
    window.TemplePilgrimJourney.openDossier(target);
    return true;
  }

  function navButton(label, direction, current, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tm525-btn tm53-pilgrim-nav__button tm53-pilgrim-nav__button--${direction}`;
    button.textContent = label;
    const isPrevious = direction === 'previous';
    const target = isPrevious ? current - 1 : current + 1;
    const disabled = target < 1 || target > MAX_CHAMBER;
    button.disabled = disabled;
    button.setAttribute('aria-label', disabled
      ? `${isPrevious ? 'Previous' : 'Next'} chamber unavailable`
      : `${isPrevious ? 'Previous' : 'Next'} chamber: ${String(target).padStart(2, '0')}`);
    if (!disabled) button.addEventListener('click', () => handler(target));
    return button;
  }

  function buildNav(current, handler, label) {
    const nav = document.createElement('nav');
    nav.className = 'tm53-pilgrim-nav';
    nav.tabIndex = -1;
    nav.setAttribute('aria-label', label);

    const previous = navButton(`← ${String(Math.max(1, current - 1)).padStart(2, '0')} Previous`, 'previous', current, handler);
    const position = document.createElement('span');
    position.className = 'tm53-pilgrim-nav__position';
    position.textContent = `${String(current).padStart(2, '0')} / ${MAX_CHAMBER}`;
    position.setAttribute('aria-label', `Chamber ${current} of ${MAX_CHAMBER}`);
    const next = navButton(`Next ${String(Math.min(MAX_CHAMBER, current + 1)).padStart(2, '0')} →`, 'next', current, handler);

    nav.append(previous, position, next);
    return nav;
  }

  function enhanceJourney() {
    const card = document.querySelector('#tm525-journey .tm525-current-card');
    if (!card || card.querySelector('.tm53-pilgrim-nav')) return;

    const current = currentJourneyChamber();
    const nav = buildNav(current, selectJourneyChamber, 'Pilgrim Journey chamber navigation');
    const actionRow = card.querySelector('.tm525-action-row');
    card.insertBefore(nav, actionRow || null);
  }

  function enhanceDossier() {
    const actions = document.querySelector('#tm525-dossier .tm525-dossier-actions');
    if (!actions || actions.parentElement?.querySelector('.tm53-pilgrim-nav--dossier')) return;

    const current = currentDossierChamber();
    const nav = buildNav(current, selectDossierChamber, 'Chamber dossier navigation');
    nav.classList.add('tm53-pilgrim-nav--dossier');
    actions.parentElement.insertBefore(nav, actions);
  }

  function enhance() {
    enhanceJourney();
    enhanceDossier();
  }

  function installStyles() {
    if (document.querySelector('style[data-tm53-pilgrim-nav]')) return;
    const style = document.createElement('style');
    style.dataset.tm53PilgrimNav = 'true';
    style.textContent = `
      .tm53-pilgrim-nav {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 10px;
        margin-top: 16px;
        padding: 10px;
        border: 1px solid rgba(224, 198, 120, .18);
        border-radius: 14px;
        background: linear-gradient(90deg, rgba(114, 230, 218, .045), rgba(224, 198, 120, .055));
      }
      .tm53-pilgrim-nav__button {
        width: 100%;
        min-width: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        white-space: nowrap;
      }
      .tm53-pilgrim-nav__button--previous { justify-self: start; }
      .tm53-pilgrim-nav__button--next { justify-self: end; }
      .tm53-pilgrim-nav__button:disabled {
        opacity: .34;
        cursor: not-allowed;
        filter: grayscale(.35);
      }
      .tm53-pilgrim-nav__position {
        min-width: 72px;
        color: #f3dfaa;
        text-align: center;
        font: 850 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        letter-spacing: .08em;
      }
      .tm53-pilgrim-nav--dossier { margin: 18px 0 0; }
      @media (max-width: 560px) {
        .tm53-pilgrim-nav {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .tm53-pilgrim-nav__position {
          grid-column: 1 / -1;
          grid-row: 1;
          padding-bottom: 2px;
        }
        .tm53-pilgrim-nav__button--previous { grid-column: 1; grid-row: 2; }
        .tm53-pilgrim-nav__button--next { grid-column: 2; grid-row: 2; }
        .tm53-pilgrim-nav__button { min-height: 48px; padding-inline: 10px; }
      }
    `;
    document.head.appendChild(style);
  }

  function loadNamedPilgrimageRoutes() {
    if (document.querySelector('script[data-temple-pilgrimage-routes]')) return;
    const script = document.createElement('script');
    script.src = './scripts/v5.3-pilgrimage-routes.js';
    script.async = false;
    script.dataset.templePilgrimageRoutes = 'true';
    document.head.appendChild(script);
  }

  function installKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      const target = event.target;
      if (target && (target.matches?.('input, textarea, select, [contenteditable="true"]') || target.closest?.('[contenteditable="true"]'))) return;

      const delta = event.key === 'ArrowLeft' ? -1 : 1;
      if (journeyOpen()) {
        event.preventDefault();
        const current = currentJourneyChamber();
        const next = current + delta;
        if (next >= 1 && next <= MAX_CHAMBER) selectJourneyChamber(next);
      } else if (dossierOpen()) {
        event.preventDefault();
        const current = currentDossierChamber();
        const next = current + delta;
        if (next >= 1 && next <= MAX_CHAMBER) selectDossierChamber(next);
      }
    });
  }

  function init() {
    installStyles();
    enhance();
    loadNamedPilgrimageRoutes();
    installKeyboardNavigation();

    if (!observer) {
      observer = new MutationObserver(enhance);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  document.addEventListener('temple:living-temple-ready', enhance);
  document.addEventListener('temple:journey-change', enhance);
})();
