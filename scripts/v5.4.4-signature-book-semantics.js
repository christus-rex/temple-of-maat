/* Temple of SOL-OM-ON (Ma'at) v5.4.4 — Visitor Signature Book semantic boundary */
(function () {
  'use strict';

  const root = document.getElementById('root');
  let queued = false;

  function setAccessibleName(control, label) {
    if (!control || control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) return;
    control.setAttribute('aria-label', label);
  }

  function apply() {
    queued = false;
    const sealInput = document.querySelector('form input[placeholder="Seal Phrase"]');
    const form = sealInput?.closest('form');
    const section = form?.closest('section');
    if (!section) return false;

    section.classList.add('temple-signature-book');
    section.dataset.templeComponent = 'visitor-signature-book';
    section.dataset.semanticBoundary = 'v5.4.4';

    const card = section.firstElementChild;
    const layout = card?.firstElementChild;
    const formColumn = layout?.children?.[0] || null;
    const ledgerColumn = layout?.children?.[1] || null;
    card?.classList.add('temple-signature-book__card');
    layout?.classList.add('temple-signature-book__layout');
    formColumn?.classList.add('temple-signature-book__form-column');
    ledgerColumn?.classList.add('temple-signature-book__ledger-column');

    const heading = section.querySelector('h3');
    if (heading) {
      heading.id ||= 'temple-signature-book-title';
      section.setAttribute('aria-labelledby', heading.id);
    }
    form.setAttribute('aria-label', 'Visitor Signature Book entry form');

    const filter = ledgerColumn?.querySelector('input[placeholder="Filter ledger…"]') || null;
    const actions = filter?.parentElement || null;
    const toolbar = actions?.parentElement || null;
    actions?.classList.add('temple-signature-book__actions');
    toolbar?.classList.add('temple-signature-book__toolbar');

    const table = ledgerColumn?.querySelector('table') || null;
    const tableScroll = table?.parentElement || null;
    tableScroll?.classList.add('temple-signature-book__table-scroll');
    if (table) table.setAttribute('aria-label', 'Visitor Signature Book ledger');

    setAccessibleName(form.querySelector('input[placeholder="Name"]'), 'Visitor name');
    setAccessibleName(form.querySelector('input[placeholder="Wholesome Name (optional)"]'), 'Wholesome name, optional');
    setAccessibleName(form.querySelector('select'), 'Temple chamber');
    setAccessibleName(form.querySelector('input[placeholder="Intention"]'), 'Intention');
    setAccessibleName(form.querySelector('input[placeholder="Vow"]'), 'Vow');
    setAccessibleName(sealInput, 'Seal phrase');
    setAccessibleName(filter, 'Filter visitor signature ledger');

    const buttons = actions ? [...actions.querySelectorAll('button')] : [];
    for (const button of buttons) {
      const text = (button.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) setAccessibleName(button, `${text} visitor signature ledger`);
    }

    window.dispatchEvent(new CustomEvent('temple:signature-book-ready', { detail: { version: '5.4.4' } }));
    return true;
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  queue();
  if (root && window.MutationObserver) new MutationObserver(queue).observe(root, { childList: true, subtree: true });
  window.TempleSignatureBookSemantics = Object.freeze({ version: '5.4.4', apply });
})();
