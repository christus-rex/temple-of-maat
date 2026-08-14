/* Temple of Ma'at v5.2.6 — Native Shem HaMephorash dossier layer */
(function () {
  'use strict';

  const VERSION = '5.2.6';
  const DATA = Object.freeze([{"num":1,"root":"והו","fullHe":"והויה","nameEn":"Vehuiah","psalm":"3:3","attribute":"Willpower / New Beginnings"},{"num":2,"root":"ילי","fullHe":"יליאל","nameEn":"Jeliel","psalm":"22:19","attribute":"Love / Wisdom"},{"num":3,"root":"סיט","fullHe":"סיטאל","nameEn":"Sitael","psalm":"91:2","attribute":"Construction / Miracle"},{"num":4,"root":"עלם","fullHe":"עלמיה","nameEn":"Elemiah","psalm":"6:4","attribute":"Hidden / Revelation"},{"num":5,"root":"מהש","fullHe":"מהשיה","nameEn":"Mahasiah","psalm":"34:4","attribute":"Healing / Rectification"},{"num":6,"root":"ללה","fullHe":"ללהאל","nameEn":"Lelahel","psalm":"9:11","attribute":"Dreams / Light"},{"num":7,"root":"אכא","fullHe":"אכאיה","nameEn":"Achaiah","psalm":"103:8","attribute":"Patience / Life's Purpose"},{"num":8,"root":"כהת","fullHe":"כהתאל","nameEn":"Cahetel","psalm":"95:6","attribute":"Blessing / Harvest"},{"num":9,"root":"הזי","fullHe":"הזיאל","nameEn":"Haziel","psalm":"25:6","attribute":"Mercy / Forgiveness"},{"num":10,"root":"אלד","fullHe":"אלדיה","nameEn":"Aladiah","psalm":"33:22","attribute":"Protection from Evil Eye"},{"num":11,"root":"לאו","fullHe":"לאויה","nameEn":"Laviah","psalm":"18:46","attribute":"Victory / Banishing Pride"},{"num":12,"root":"ההע","fullHe":"ההעיה","nameEn":"Hahaiah","psalm":"10:1","attribute":"Refuge / Unconditional Love"},{"num":13,"root":"יזל","fullHe":"יזלאל","nameEn":"Iezalel","psalm":"98:4","attribute":"Fidelity / Unity"},{"num":14,"root":"מבה","fullHe":"מבהאל","nameEn":"Mebahel","psalm":"9:9","attribute":"Justice / Truth"},{"num":15,"root":"הרי","fullHe":"הריאל","nameEn":"Hariel","psalm":"94:22","attribute":"Purification / Method"},{"num":16,"root":"הקם","fullHe":"הקמיה","nameEn":"Hakamiah","psalm":"88:1","attribute":"Loyalty / Devotion"},{"num":17,"root":"לאו","fullHe":"לאויה","nameEn":"Lauviah","psalm":"8:9","attribute":"Revelations / Dreams"},{"num":18,"root":"כלי","fullHe":"כליאל","nameEn":"Caliel","psalm":"35:24","attribute":"Justice / Recompense"},{"num":19,"root":"לוו","fullHe":"לוויה","nameEn":"Leuviah","psalm":"40:1","attribute":"Intelligence / Expansion"},{"num":20,"root":"פהל","fullHe":"פהליה","nameEn":"Pahaliah","psalm":"120:1-2","attribute":"Vocation / Redemption"},{"num":21,"root":"נלכ","fullHe":"נלכאל","nameEn":"Nelchael","psalm":"31:14","attribute":"Learning / Anti-Ignorance"},{"num":22,"root":"ייי","fullHe":"יייאל","nameEn":"Ieiaiel","psalm":"121:5","attribute":"Fortune / Renown"},{"num":23,"root":"מלה","fullHe":"מלהאל","nameEn":"Melahel","psalm":"121:8","attribute":"Healing / Safe Journey"},{"num":24,"root":"חהו","fullHe":"חהויה","nameEn":"Hahuiah","psalm":"33:18","attribute":"Protection / Shelter"},{"num":25,"root":"נתה","fullHe":"נתהיה","nameEn":"Nith-Haiah","psalm":"9:1","attribute":"Wisdom / Metamorphosis"},{"num":26,"root":"האא","fullHe":"האאיה","nameEn":"Haaiah","psalm":"119:145","attribute":"Discretion / Political Science"},{"num":27,"root":"ירת","fullHe":"ירתאל","nameEn":"Ierathel","psalm":"140:1","attribute":"Propagation of Light"},{"num":28,"root":"שאה","fullHe":"שאהיה","nameEn":"Seehiah","psalm":"71:12","attribute":"Longevity"},{"num":29,"root":"ריי","fullHe":"רייאל","nameEn":"Reiyel","psalm":"54:4","attribute":"Liberation"},{"num":30,"root":"אום","fullHe":"אומאל","nameEn":"Omael","psalm":"71:5","attribute":"Multiplication / Fertility"},{"num":31,"root":"לכב","fullHe":"לכבאל","nameEn":"Lecabel","psalm":"71:16","attribute":"Talent / Resolution"},{"num":32,"root":"ושר","fullHe":"ושריה","nameEn":"Vasahiah","psalm":"33:4","attribute":"Clemency / Justice"},{"num":33,"root":"יחו","fullHe":"יחויה","nameEn":"Iehuiah","psalm":"94:11","attribute":"Knowledge of Evil"},{"num":34,"root":"להח","fullHe":"להחיה","nameEn":"Lehahiah","psalm":"131:3","attribute":"Obedience / Order"},{"num":35,"root":"כוק","fullHe":"כוקיה","nameEn":"Chavakiah","psalm":"116:1","attribute":"Reconciliation"},{"num":36,"root":"מנד","fullHe":"מנדאל","nameEn":"Menadel","psalm":"26:8","attribute":"Work / Vocation"},{"num":37,"root":"אני","fullHe":"אניאל","nameEn":"Aniel","psalm":"80:3","attribute":"Breaking the Circle"},{"num":38,"root":"חעם","fullHe":"חעמיה","nameEn":"Haamiah","psalm":"91:9","attribute":"Ritual / Sacred Space"},{"num":39,"root":"רהע","fullHe":"רהעאל","nameEn":"Rehael","psalm":"30:10","attribute":"Filial Submission"},{"num":40,"root":"ייז","fullHe":"ייזאל","nameEn":"Ieiazel","psalm":"88:14","attribute":"Rejoicing / Consolation"},{"num":41,"root":"ההה","fullHe":"הההאל","nameEn":"Hahahel","psalm":"120:2","attribute":"Mission / Faith"},{"num":42,"root":"מיכ","fullHe":"מיכאל","nameEn":"Mikael","psalm":"121:7","attribute":"Political Order"},{"num":43,"root":"וול","fullHe":"ווליה","nameEn":"Veuliah","psalm":"88:13","attribute":"Prosperity / Dominion"},{"num":44,"root":"ילה","fullHe":"ילהיה","nameEn":"Yelahiah","psalm":"119:108","attribute":"Karmic Warrior"},{"num":45,"root":"סאל","fullHe":"סאליה","nameEn":"Sealiah","psalm":"94:18","attribute":"Motivation / Purification"},{"num":46,"root":"ערי","fullHe":"עריאל","nameEn":"Ariel","psalm":"145:9","attribute":"Revelation / Perception"},{"num":47,"root":"עשל","fullHe":"עשליה","nameEn":"Asaliah","psalm":"92:5","attribute":"Contemplation"},{"num":48,"root":"מיה","fullHe":"מיהאל","nameEn":"Mihael","psalm":"98:2","attribute":"Fertility / Fecundity"},{"num":49,"root":"והו","fullHe":"והואל","nameEn":"Vehuel","psalm":"145:3","attribute":"Elevation / Grandeur"},{"num":50,"root":"דני","fullHe":"דניאל","nameEn":"Daniel","psalm":"145:8","attribute":"Eloquence"},{"num":51,"root":"החש","fullHe":"החשיה","nameEn":"Hahasiah","psalm":"104:31","attribute":"Universal Medicine"},{"num":52,"root":"עמם","fullHe":"עממיה","nameEn":"Imamiah","psalm":"7:17","attribute":"Exorcism / Freedom"},{"num":53,"root":"ננא","fullHe":"ננאאל","nameEn":"Nanael","psalm":"119:75","attribute":"Spiritual Communication"},{"num":54,"root":"נית","fullHe":"ניתאל","nameEn":"Nithael","psalm":"103:19","attribute":"Eternity / Legitimacy"},{"num":55,"root":"מבה","fullHe":"מבהיה","nameEn":"Mebahaiah","psalm":"102:12","attribute":"Intellectual Lucidity"},{"num":56,"root":"פוי","fullHe":"פויאל","nameEn":"Poiel","psalm":"145:14","attribute":"Support / Fortune"},{"num":57,"root":"נמם","fullHe":"נממיה","nameEn":"Nemamiah","psalm":"115:11","attribute":"Discernment"},{"num":58,"root":"ייל","fullHe":"יילאל","nameEn":"Ieialel","psalm":"6:3","attribute":"Healing / Karmic Healing"},{"num":59,"root":"הרח","fullHe":"הרחאל","nameEn":"Harahel","psalm":"113:3","attribute":"Intellectual Richness"},{"num":60,"root":"מצר","fullHe":"מצראל","nameEn":"Mizrael","psalm":"145:17","attribute":"Internal Repair"},{"num":61,"root":"ומב","fullHe":"ומבאל","nameEn":"Umabel","psalm":"113:2","attribute":"Affinity / Friendship"},{"num":62,"root":"יהה","fullHe":"יההאל","nameEn":"Iah-Hel","psalm":"119:159","attribute":"Desire to Know"},{"num":63,"root":"ענו","fullHe":"ענואל","nameEn":"Anavel","psalm":"100:2","attribute":"Perception of Unity"},{"num":64,"root":"מחי","fullHe":"מחיאל","nameEn":"Mehiel","psalm":"33:18","attribute":"Vivification"},{"num":65,"root":"דמב","fullHe":"דמביה","nameEn":"Damabiah","psalm":"90:13","attribute":"Fountain of Wisdom"},{"num":66,"root":"מנק","fullHe":"מנקאל","nameEn":"Manakel","psalm":"38:21","attribute":"Knowledge of Good and Evil"},{"num":67,"root":"איא","fullHe":"איעאל","nameEn":"Eiael","psalm":"37:4","attribute":"Transformation"},{"num":68,"root":"חבו","fullHe":"חבויה","nameEn":"Habuiah","psalm":"106:1","attribute":"Healing / Agriculture"},{"num":69,"root":"ראה","fullHe":"ראהאל","nameEn":"Roehel","psalm":"16:5","attribute":"Restitution"},{"num":70,"root":"יבמ","fullHe":"יבמיה","nameEn":"Yabamiah","psalm":"Gen 1:1","attribute":"Alchemy / First Creation"},{"num":71,"root":"היי","fullHe":"הייאל","nameEn":"Haiaiel","psalm":"109:30","attribute":"Divine Warrior Arms"},{"num":72,"root":"מום","fullHe":"מומיה","nameEn":"Mumiah","psalm":"116:7","attribute":"End / Rebirth / Completion"}]);
  const byNumber = new Map(DATA.map((record) => [Number(record.num), Object.freeze({...record})]));

  function chamberNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 72 ? number : null;
  }

  function currentDossierNumber() {
    const eyebrow = document.querySelector('#tm525-dossier .tm525-dossier-hero .tm525-eyebrow');
    const match = (eyebrow?.textContent || '').match(/Chamber\s+(\d{1,2})/i);
    if (match) return chamberNumber(match[1]);
    const hash = location.hash.match(/chamber-(\d{1,2})/i);
    return hash ? chamberNumber(hash[1]) : null;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function datum(label, value, extra = '') {
    const card = el('div', `tm525-data-card tm526-shem-data ${extra}`.trim());
    card.append(el('span', 'tm525-data-label', label), el('strong', 'tm525-data-value', value || '—'));
    return card;
  }

  function installStyles() {
    if (document.querySelector('style[data-tm526-shem]')) return;
    const style = document.createElement('style');
    style.dataset.tm526Shem = 'true';
    style.textContent = `
      .tm526-shem-layer{margin-top:1.1rem;padding:1rem;border:1px solid rgba(212,175,55,.25);border-radius:16px;background:linear-gradient(180deg,rgba(212,175,55,.07),rgba(8,12,16,.18))}
      .tm526-shem-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:.8rem}
      .tm526-shem-title{margin:0;font-size:16px;letter-spacing:.04em;color:#f5e6c8}
      .tm526-shem-root{font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1;color:#d4af37;direction:rtl}
      .tm526-shem-note{margin:.7rem 0 0;color:#9fb0b5;font-size:11px;line-height:1.6}
      .tm526-shem-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;margin-top:.8rem}
      .tm526-shem-open{display:inline-flex;align-items:center;justify-content:center;margin-top:.8rem;padding:.55rem .8rem;border:1px solid rgba(212,175,55,.28);border-radius:999px;color:#f5e6c8;text-decoration:none;font:700 10px/1.2 ui-monospace,monospace;letter-spacing:.08em;background:rgba(212,175,55,.08)}
      .tm526-shem-open:focus-visible{outline:2px solid #d4af37;outline-offset:2px}
      @media(max-width:560px){.tm526-shem-grid{grid-template-columns:1fr}.tm526-shem-root{font-size:30px}}
    `;
    document.head.appendChild(style);
  }

  function renderIntoDossier() {
    const body = document.querySelector('#tm525-dossier .tm525-panel-body');
    if (!body) return;
    const number = currentDossierNumber();
    const record = byNumber.get(number);
    if (!record) return;

    const existing = body.querySelector('[data-tm526-shem-layer]');
    if (existing?.dataset.chamber === String(number)) return;
    existing?.remove();

    const layer = el('section', 'tm526-shem-layer');
    layer.dataset.tm526ShemLayer = 'true';
    layer.dataset.chamber = String(number);

    const head = el('div', 'tm526-shem-head');
    const titles = el('div');
    titles.append(el('p', 'tm525-eyebrow', `Shem HaMephorash layer · ${String(number).padStart(2,'0')} / 72`), el('h4', 'tm526-shem-title', record.nameEn));
    head.append(titles, el('div', 'tm526-shem-root', record.root));

    const grid = el('div', 'tm526-shem-grid');
    grid.append(
      datum('Shem root', record.root, 'tm525-data-hebrew'),
      datum('Constructed form', record.fullHe, 'tm525-data-hebrew'),
      datum('Source name form', record.nameEn),
      datum('Psalm / citation', record.psalm),
      datum('Source attribute', record.attribute)
    );

    const note = el('p', 'tm526-shem-note', 'Source-preserved layer from the uploaded Shem HaMephorash 72 artifact. This is displayed beside—rather than merged with—the Temple’s Third Name, gematria-twin, angelic, daemonic, office, law, pillar, and fire layers.');
    const open = el('a', 'tm526-shem-open', 'OPEN SHEM 72 ARCHIVE');
    open.href = `./shem-hamephorash-72.html#name-${String(number).padStart(2,'0')}`;
    open.setAttribute('aria-label', `Open Shem 72 archive at ${record.nameEn}`);

    layer.append(head, grid, note, open);
    const reflection = body.querySelector('.tm525-dossier-reflection');
    body.insertBefore(layer, reflection || body.querySelector('.tm525-action-row') || null);
  }

  let queued = false;
  function queueRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; renderIntoDossier(); });
  }

  window.TempleShem72 = Object.freeze({
    version: VERSION,
    record(number) { return byNumber.get(chamberNumber(number)) || null; },
    all() { return DATA.map((record) => ({...record})); },
    open(number) {
      const valid = chamberNumber(number) || currentDossierNumber() || 1;
      location.href = `./shem-hamephorash-72.html#name-${String(valid).padStart(2,'0')}`;
    }
  });

  installStyles();
  queueRender();
  new MutationObserver(queueRender).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', queueRender, { passive: true });
})();
