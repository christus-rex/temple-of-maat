/* Temple of Ma'at v5.2.4 — The Living Codex */
(function () {
  'use strict';

  const VERSION = '5.2.4';
  const LAST_CHAMBER_KEY = 'temple_last_chamber';
  const CHANT_VOLUME_KEY = 'temple_maat_chant_volume';
  const CHANT_SRC = './assets/audio/maat-forty-two-declarations.web.opus';
  const CIPHER_ORDER = ['EO', 'FR', 'RO', 'RFR'];
  const SOURCE = Object.freeze({
    title: 'The 72-Fold Shem HaMephorash — Master Catalogue, Hebrew Triplets, Angelic Names, Gematria & Discernment',
    purpose: 'Reference document separating the underlying Hebrew 72-triplet construction from later angelological and Hermetic correspondences, then bringing them together in one catalogue.',
    extraction: 'Exodus 14:19–21: verse 19 forward, verse 20 reversed, verse 21 forward; 216 source letters arranged as 72 triplets.',
    gematriaPolicy: 'Triplet gematria uses standard Hebrew Mispar Hechrechi values; digital reduction is a modern shorthand. Gematria is an analytical index, not the extraction algorithm.',
    layerNote: 'The Hebrew triplets, later angelic expansions, Hermetic correspondences, and later Goetic pairings are distinct source layers and should remain visibly distinguished.',
    twinMethod: 'Gematria twins are strongest numerical counterparts from a 72×72 English-cipher search using EO, FR, RO, and RFR; they are numerical correspondences, not claims of historical or metaphysical identity.'
  });
  const DISCERNMENT = Object.freeze([
    'The 72 triplets and the 72 angels are related but not identical layers.',
    'Shem ha-Meforash has more than one historical referent; precise study should identify which layer is meant.',
    'Reversal, not gematria, creates the 72.',
    'Duplicate roots warn against simplistic one-to-one identity claims.',
    'Pronunciation is not fixed by the unpointed consonants alone.',
    'Astrological and calendrical assignments are school-dependent.',
    'Later Goetic pairings are a separate Western occult layer.'
  ]);
  const SYNTHESIS = 'The strongest internal pattern is triadic rather than binary: forward / reversed / forward, traditionally read as Chesed / Gevurah / Tiferet. The construction contains polarity and a mediating third term. Duplicate roots show the system is positional as well as lexical; gematria equality can signal resonance, but source lineage and positional context still matter.';

  const RAW = `01|והו|VHV|17|8|Vehuiah|יה|והויה|32|5|Bifrons|Single exact|FR|74/38/115/34|83/38/106/43
02|ילי|YLY|50|5|Jeliel|אל|יליאל|81|9|Orias|Double match|FR,RFR|53/26/109/37|62/26/73/37
03|סיט|SYṬ|79|7|Sitael|אל|סיטאל|110|2|Andras|Double match|FR,RFR|66/21/96/42|57/21/105/42
04|עלם|ʿLM|140|5|Elemiah|יה|עלםיה|155|2|Berith|Double match|FR,RFR|53/35/136/37|62/35/100/37
05|מהש|MHŠ|345|3|Mahasiah|יה|מהשיה|360|9|Gamigin|Single exact|EO|60/33/156/48|60/42/129/39
06|ללה|LLH|65|2|Lelahel|אל|ללהאל|96|6|Vapula|Single exact|RFR|55/28/134/35|73/19/89/35
07|אכא|ʾKʾ|22|4|Achaiah|יה|אכאיה|37|1|Alloces|Single exact|RFR|31/31/158/41|67/22/122/41
08|כהת|KHT|425|2|Cahetel|אל|כהתאל|456|6|Bathin|Triple lock|EO,FR,RFR|54/27/135/36|54/27/108/36
09|הזי|HZY|22|4|Haziel|אל|הזיאל|53|8|Beleth|Single exact|RFR|61/34/101/29|52/25/110/29
10|אלד|ʾLD|35|8|Aladiah|יה|אלדיה|50|5|Bathin|Single exact|FR|36/27/153/45|54/27/108/36
11|לאו|LʾV|37|1|Lauviah|יה|לאויה|52|7|Valefar|Double match|FR,RFR|74/29/115/43|65/29/124/43
12|ההע|HHʿ|80|8|Hahaiah|יה|ההעיה|95|5|Dantalion|Double match|FR,RO|36/36/153/36|90/36/153/54
13|יזל|YZL|47|2|Iezalel|אל|יזלאל|78|6|Focalor|Tetrad exact|EO,FR,RO,RFR|70/34/119/38|70/34/119/38
14|מבה|MBH|47|2|Mebahel|אל|מבהאל|78|6|Vapula|Single exact|RFR|46/28/143/35|73/19/89/35
15|הרי|HRY|215|8|Hariel|אל|הריאל|246|3|Berith|Double match|FR,RFR|53/35/109/37|62/35/100/37
16|הקם|HQM|145|1|Hekamiah|יה|הקםיה|160|7|Haagenti|Double match|FR,RFR|56/38/160/43|65/38/151/43
17|לאו|LʾV|37|1|Lauviah|יה|לאויה|52|7|Valefar|Double match|FR,RFR|74/29/115/43|65/29/124/43
18|כלי|KLY|60|6|Caliel|אל|כליאל|91|1|Agares|Double match|FR,RFR|42/24/120/39|51/24/111/39
19|לוו|LVV|42|6|Leuviah|יה|לוויה|57|3|Asmoday|Triple lock|EO,RO,RFR|78/33/111/39|78/24/111/39
20|פהל|PHL|115|7|Pahaliah|יה|פהליה|130|4|Haagenti|Double match|FR,RFR|56/38/160/43|65/38/151/43
21|נלך|NLK|100|1|Nelkhael|אל|נלךאל|131|5|Paimon|Double match|EO,FR|68/32/148/40|68/32/94/31
22|ייי|YYY|30|3|Yeiayel|אל|יייאל|61|7|Vapula|Single exact|RFR|82/37/107/35|73/19/89/35
23|מלה|MLH|75|3|Melahel|אל|מלהאל|106|7|Halphas|Double match|FR,RFR|56/29/133/34|65/29/124/34
24|חהו|ḤHV|19|1|Hahuiah|יה|חהויה|34|7|Halphas|Single exact|RFR|56/38/133/34|65/29/124/34
25|נתה|NTH|455|5|Nithaiah|יה|נתהיה|470|2|Focalor|Single exact|EO|70/43/146/47|70/34/119/38
26|האא|Hʾʾ|7|7|Haaiah|יה|האאיה|22|4|Vapula|Single exact|RFR|28/28/134/35|73/19/89/35
27|ירת|YRT|610|7|Yerathel|אל|ירתאל|641|2|Alloces|Double match|RO,RFR|94/40/122/41|67/22/122/41
28|שאה|ŠʾH|306|9|Seheiah|יה|שאהיה|321|6|Vapula|Single exact|RFR|55/37/134/35|73/19/89/35
29|ריי|RYY|220|4|Reyiel|אל|רייאל|251|8|Gremory|Double match|RO,RFR|74/38/88/34|101/47/88/34
30|אום|ʾVM|47|2|Omael|אל|אוםאל|78|6|Buer|Triple lock|EO,FR,RFR|46/19/89/26|46/19/62/26
31|לכב|LKB|52|7|Lecabel|אל|לכבאל|83|2|Alloces|Double match|FR,RFR|40/22/149/41|67/22/122/41
32|ושר|VŠR|506|2|Vasariah|יה|ושריה|521|8|Focalor|Single exact|FR|79/34/137/56|70/34/119/38
33|יחו|YḤV|24|6|Yehuiah|יה|יחויה|39|3|Paimon|Single exact|RFR|77/41/112/31|68/32/94/31
34|להח|LHḤ|43|7|Lehahiah|יה|להחיה|58|4|Marchosias|Double match|FR,RO|52/43/164/38|106/43/164/65
35|כוק|KVQ|126|9|Chavakiah|יה|כוקיה|141|6|Glasya Labolas|Single exact|FR|64/37/179/53|127/37/224/80
36|מנד|MND|94|4|Menadel|אל|מנדאל|125|8|Bathin|Triple lock|EO,FR,RFR|54/27/135/36|54/27/108/36
37|אני|ʾNY|61|7|Aniel|אל|אניאל|92|2|Camio|Tetrad exact|EO,FR,RO,RFR|41/23/94/31|41/23/94/31
38|חעם|ḤʿM|118|1|Haamiah|יה|חעםיה|133|7|Belial|Double match|EO,RFR|41/32/148/40|41/23/121/40
39|רעה|RʿH|275|5|Rehael|אל|רעהאל|306|9|Gusoin|Double match|FR,RFR|49/31/113/32|85/31/77/32
40|ייז|YYZ|27|9|Yeiazel|אל|ייזאל|58|4|Bifrons|Triple lock|EO,FR,RO|83/38/106/34|83/38/106/43
41|ההה|HHH|15|6|Hahahel|אל|הההאל|46|1|Beleth|Single exact|RFR|43/34/146/29|52/25/110/29
42|מיכ|MYK|70|7|Mikael|אל|מיכאל|101|2|Agares|Tetrad exact|EO,FR,RO,RFR|51/24/111/39|51/24/111/39
43|וול|VVL|42|6|Veuliah|יה|ווליה|57|3|Asmoday|Triple lock|EO,RO,RFR|78/33/111/39|78/24/111/39
44|ילה|YLH|45|9|Yelahiah|יה|ילהיה|60|6|Gamigin|Double match|FR,RFR|69/42/147/39|60/42/129/39
45|סאל|SʾL|91|1|Sehaliah|יה|סאליה|106|7|Cimeies|Triple lock|EO,FR,RFR|63/36/153/45|63/36/126/45
46|ערי|ʿRY|280|1|Ariel|אל|עריאל|311|5|Haures|Triple lock|FR,RO,RFR|45/27/90/36|72/27/90/36
47|עשל|ʿŠL|400|4|Asaliah|יה|עשליה|415|1|Agares|Double match|EO,FR|51/24/138/48|51/24/111/39
48|מיה|MYH|55|1|Mihael|אל|מיהאל|86|5|Leraye|Double match|FR,RFR|48/30/114/33|66/30/96/33
49|והו|VHV|17|8|Vehuel|אל|והואל|48|3|Vapula|Double match|EO,RO|73/28/89/26|73/19/89/35
50|דני|DNY|64|1|Daniel|אל|דניאל|95|5|Bathin|Double match|FR,RFR|45/27/117/36|54/27/108/36
51|החש|HḤŠ|313|7|Hahasiah|יה|החשיה|328|4|Glasya Labolas|Single exact|FR|55/37/161/44|127/37/224/80
52|עמם|ʿMM|150|6|Imamiah|יה|עמםיה|165|3|Cimeies|Double match|FR,RFR|54/36/135/45|63/36/126/45
53|ננא|NNʾ|101|2|Nanael|אל|ננאאל|132|6|Botis|Double match|FR,RFR|47/20/115/34|65/20/70/34
54|נית|NYT|460|1|Nithael|אל|ניתאל|491|5|Procel|Double match|EO,FR|69/33/120/39|69/33/93/30
55|מבה|MBH|47|2|Mebahiah|יה|מבהיה|62|8|Haagenti|Double match|FR,RFR|47/38/169/43|65/38/151/43
56|פוי|PVY|96|6|Poyel|אל|פויאל|127|1|Buer|Single exact|RO|73/28/62/17|46/19/62/26
57|נמם|NMM|130|4|Nemamiah|יה|נמםיה|145|1|Glasya Labolas|Single exact|FR|64/37/152/44|127/37/224/80
58|ייל|YYL|50|5|Yeialel|אל|יילאל|81|9|Procel|Double match|EO,FR|69/33/120/39|69/33/93/30
59|הרח|HRḤ|213|6|Harahel|אל|הרחאל|244|1|Berith|Double match|FR,RFR|53/35/136/37|62/35/100/37
60|מצר|MṢR|330|6|Mitzrael|אל|מצראל|361|1|Murmur|Single exact|EO|104/41/112/49|104/32/58/40
61|ומב|VMB|48|3|Umabel|אל|ומבאל|79|7|Marbas|Triple lock|EO,FR,RO|54/18/108/36|54/18/108/45
62|יהה|YHH|20|2|Iahhel|אל|יההאל|51|6|Focalor|Double match|FR,RO|43/34/119/29|70/34/119/38
63|ענו|ʿNV|126|9|Anauel|אל|ענואל|157|4|Marbas|Triple lock|EO,FR,RO|54/18/108/36|54/18/108/45
64|מחי|MḤY|58|4|Mehiel|אל|מחיאל|89|8|Beleth|Triple lock|EO,RO,RFR|52/34/110/29|52/25/110/29
65|דמב|DMB|46|1|Damabiah|יה|דמביה|61|7|Astaroth|Double match|FR,RFR|39/30/177/51|102/30/114/51
66|מנק|MNQ|190|1|Manakel|אל|מנקאל|221|5|Andras|Triple lock|EO,FR,RFR|57/21/132/42|57/21/105/42
67|איע|ʾYʿ|81|9|Eyael|אל|איעאל|112|4|Andras|Single exact|FR|48/21/87/24|57/21/105/42
68|חבו|ḤBV|16|7|Habuhiah|יה|חבויה|31|4|Alloces|Single exact|RFR|58/40/158/41|67/22/122/41
69|ראה|RʾH|206|8|Rochel|אל|ראהאל|237|3|Beleth|Single exact|RFR|61/34/101/29|52/25/110/29
70|יבמ|YBM|52|7|Jabamiah|יה|יבמיה|67|4|Dantalion|Single exact|RFR|45/27/171/54|90/36/153/54
71|היי|HYY|25|7|Haiaiel|אל|הייאל|56|2|Cimeies|Double match|FR,RFR|45/36/144/45|63/36/126/45
72|מום|MVM|86|5|Mumiah|יה|מוםיה|101|2|Halphas|Triple lock|EO,FR,RFR|65/29/97/34|65/29/124/34`;

  function parseVector(value) {
    const values = String(value).split('/').map(Number);
    return Object.fromEntries(CIPHER_ORDER.map((key, index) => [key, values[index]]));
  }

  const records = RAW.trim().split('\n').map((line) => {
    const [id, hebrewTriplet, transliteration, tripletGematria, tripletDigitalRoot, angel, suffix, constructedHebrew, fullGematria, fullDigitalRoot, daemon, strength, exactCiphers, angelVector, daemonVector] = line.split('|');
    return Object.freeze({
      number: Number(id), id, hebrewTriplet, transliteration,
      tripletGematria: Number(tripletGematria), tripletDigitalRoot: Number(tripletDigitalRoot),
      angel, suffix, constructedHebrew,
      fullGematria: Number(fullGematria), fullDigitalRoot: Number(fullDigitalRoot),
      gematriaTwin: Object.freeze({ daemon, strength, exactCiphers: exactCiphers.split(',').filter(Boolean), angelVector: parseVector(angelVector), daemonVector: parseVector(daemonVector) })
    });
  });
  const byNumber = new Map(records.map((record) => [record.number, record]));
  let selectedNumber = 1;
  let previousFocus = null;
  let artifactObserver = null;
  let audio = null;
  let chantReady = false;

  function clampChamber(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 72 ? number : null;
  }

  function chamberFromHash() {
    const match = location.hash.match(/chamber-(\d{1,2})/i);
    return match ? clampChamber(match[1]) : null;
  }

  function archiveChamber(number) {
    const target = clampChamber(number);
    if (!target) return null;
    try {
      const list = window.TempleArchive?.chambers?.();
      if (Array.isArray(list)) return list.find((item) => Number(item.num || item.number || item.id) === target) || null;
    } catch {}
    return null;
  }

  function currentNumber() {
    return chamberFromHash() || clampChamber(localStorage.getItem(LAST_CHAMBER_KEY)) || selectedNumber || 1;
  }

  function rememberChamber(number) {
    const valid = clampChamber(number);
    if (!valid) return;
    selectedNumber = valid;
    try { localStorage.setItem(LAST_CHAMBER_KEY, String(valid)); } catch {}
    updateDockLabel();
  }

  function ensureStyle() {
    if (document.querySelector('link[data-temple-v524]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './styles/v5.2.4-living-codex.css';
    link.dataset.templeV524 = 'true';
    document.head.appendChild(link);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(text, action, className = 'tm524-btn') {
    const node = el('button', className, text);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }

  function formatChamber(number) { return String(number).padStart(2, '0'); }

  function layerCard(label, value, className = '') {
    const card = el('div', `tm524-data-card ${className}`.trim());
    card.append(el('span', 'tm524-data-label', label), el('strong', 'tm524-data-value', value));
    return card;
  }

  function vectorText(vector) {
    return CIPHER_ORDER.map((key) => `${key} ${vector[key]}`).join(' · ');
  }

  function openLayer(name) {
    const layer = document.getElementById(name);
    if (!layer) return;
    previousFocus = document.activeElement;
    layer.hidden = false;
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tm524-modal-open');
    requestAnimationFrame(() => layer.querySelector('button, input, [tabindex]:not([tabindex="-1"])')?.focus());
  }

  function closeLayer(layer) {
    if (!layer) return;
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.tm524-layer:not([hidden])')) document.body.classList.remove('tm524-modal-open');
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
  }

  function closeAll() {
    document.querySelectorAll('.tm524-layer:not([hidden])').forEach(closeLayer);
  }

  function createLayer(id, title) {
    const layer = el('div', 'tm524-layer');
    layer.id = id;
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('aria-labelledby', `${id}-title`);
    const scrim = el('button', 'tm524-scrim');
    scrim.type = 'button';
    scrim.setAttribute('aria-label', `Close ${title}`);
    scrim.addEventListener('click', () => closeLayer(layer));
    const panel = el('section', 'tm524-panel');
    const header = el('header', 'tm524-panel-header');
    const heading = el('div');
    heading.append(el('p', 'tm524-eyebrow', `Temple v${VERSION}`), el('h2', 'tm524-panel-title', title));
    heading.querySelector('h2').id = `${id}-title`;
    header.append(heading, button('×', () => closeLayer(layer), 'tm524-icon-btn'));
    panel.append(header);
    layer.append(scrim, panel);
    document.body.appendChild(layer);
    return { layer, panel };
  }

  function createCodex() {
    if (document.getElementById('tm524-codex')) return;
    const { layer, panel } = createLayer('tm524-codex', 'The Living Codex');
    const body = el('div', 'tm524-codex-body');
    const rail = el('aside', 'tm524-codex-rail');
    const search = el('input', 'tm524-search');
    search.type = 'search';
    search.placeholder = 'Search chamber, angel, triplet, or twin…';
    search.setAttribute('aria-label', 'Search the 72-fold Living Codex');
    const results = el('div', 'tm524-record-list');
    results.setAttribute('role', 'list');
    rail.append(search, results);
    const detail = el('article', 'tm524-record-detail');
    detail.id = 'tm524-record-detail';
    body.append(rail, detail);
    const footer = el('footer', 'tm524-panel-footer');
    footer.append(
      button('Download Full Codex JSON', downloadFullCodex, 'tm524-btn tm524-btn--secondary'),
      el('p', 'tm524-source-mini', 'Source layers remain explicitly distinguished; gematria resonance is not presented as identity.')
    );
    panel.append(body, footer);

    function renderList(query = '') {
      const needle = query.trim().toLocaleLowerCase();
      results.replaceChildren();
      records.filter((record) => {
        if (!needle) return true;
        const haystack = [record.id, record.hebrewTriplet, record.transliteration, record.angel, record.gematriaTwin.daemon, record.gematriaTwin.strength].join(' ').toLocaleLowerCase();
        return haystack.includes(needle);
      }).forEach((record) => {
        const item = button('', () => selectRecord(record.number), 'tm524-record-item');
        item.setAttribute('role', 'listitem');
        item.dataset.number = String(record.number);
        const left = el('span', 'tm524-record-index', record.id);
        const middle = el('span', 'tm524-record-name');
        middle.append(el('strong', '', record.angel), el('small', '', `${record.transliteration} · ${record.gematriaTwin.daemon}`));
        item.append(left, middle, el('span', 'tm524-record-hebrew', record.hebrewTriplet));
        results.appendChild(item);
      });
      if (!results.childElementCount) results.append(el('p', 'tm524-empty', 'No matching Codex records.'));
      syncSelectedList();
    }

    search.addEventListener('input', () => renderList(search.value));
    layer.addEventListener('temple:codex-open', () => {
      search.value = '';
      renderList();
      // Honor an explicitly requested record; openCodex(number) sets selectedNumber first.
      selectRecord(selectedNumber || currentNumber(), false);
    });
    renderList();
  }

  function syncSelectedList() {
    document.querySelectorAll('.tm524-record-item').forEach((item) => item.classList.toggle('is-selected', Number(item.dataset.number) === selectedNumber));
  }

  function selectRecord(number, scrollList = true) {
    const valid = clampChamber(number) || 1;
    selectedNumber = valid;
    const record = byNumber.get(valid);
    const archive = archiveChamber(valid);
    const detail = document.getElementById('tm524-record-detail');
    if (!detail || !record) return;
    detail.replaceChildren();

    const nav = el('div', 'tm524-record-nav');
    nav.append(
      button('←', () => selectRecord(valid === 1 ? 72 : valid - 1), 'tm524-icon-btn'),
      el('span', 'tm524-record-count', `Chamber ${record.id} / 72`),
      button('→', () => selectRecord(valid === 72 ? 1 : valid + 1), 'tm524-icon-btn')
    );
    const hero = el('div', 'tm524-codex-hero');
    const title = el('div');
    title.append(el('p', 'tm524-eyebrow', 'Hebrew triplet · Layer B'), el('h3', 'tm524-record-heading', record.angel), el('p', 'tm524-record-subtitle', `${record.transliteration} · constructed ${record.constructedHebrew}`));
    hero.append(el('div', 'tm524-hebrew', record.hebrewTriplet), title);

    const baseGrid = el('div', 'tm524-data-grid');
    baseGrid.append(
      layerCard('Triplet gematria', `${record.tripletGematria} → ${record.tripletDigitalRoot}`),
      layerCard('Full gematria', `${record.fullGematria} → ${record.fullDigitalRoot}`),
      layerCard('Theophoric suffix', record.suffix),
      layerCard('Constructed Hebrew', record.constructedHebrew, 'tm524-hebrew-card')
    );

    const twin = el('section', 'tm524-section');
    twin.append(el('p', 'tm524-eyebrow', 'Gematria twin · later analytical layer'), el('h4', 'tm524-section-title', `${record.angel} ↔ ${record.gematriaTwin.daemon}`));
    const strength = el('div', 'tm524-strength-row');
    strength.append(el('span', `tm524-strength tm524-strength--${record.gematriaTwin.strength.toLowerCase().replace(/\s+/g, '-')}`, record.gematriaTwin.strength), el('span', 'tm524-ciphers', `Exact: ${record.gematriaTwin.exactCiphers.join(', ')}`));
    twin.append(strength, layerCard('Angel vector', vectorText(record.gematriaTwin.angelVector)), layerCard('Twin vector', vectorText(record.gematriaTwin.daemonVector)));

    const temple = el('section', 'tm524-section tm524-section--temple');
    temple.append(el('p', 'tm524-eyebrow', 'Temple chamber layer'));
    const templeTitle = el('h4', 'tm524-section-title', archive ? `${archive.angel || record.angel} ↔ ${archive.daemon || record.gematriaTwin.daemon}` : `${record.angel} ↔ ${record.gematriaTwin.daemon}`);
    temple.append(templeTitle);
    if (archive) {
      const templeGrid = el('div', 'tm524-data-grid');
      if (archive.thirdName) templeGrid.append(layerCard('Third Name', archive.thirdName));
      if (archive.office) templeGrid.append(layerCard('Office', archive.office));
      if (archive.law) templeGrid.append(layerCard('Chamber law', archive.law));
      if (archive.pillar) templeGrid.append(layerCard('Pillar', archive.pillar));
      temple.append(templeGrid);
    } else {
      temple.append(el('p', 'tm524-note', 'Temple runtime chamber metadata will appear here when the chamber archive is mounted.'));
    }

    const method = el('details', 'tm524-details');
    const summary = el('summary', '', 'Source & discernment');
    const sourceBody = el('div', 'tm524-details-body');
    sourceBody.append(el('p', '', SOURCE.extraction), el('p', '', SOURCE.gematriaPolicy), el('p', '', SOURCE.twinMethod));
    const list = el('ul', 'tm524-discernment-list');
    DISCERNMENT.forEach((item) => list.append(el('li', '', item)));
    sourceBody.append(list, el('p', 'tm524-synthesis', SYNTHESIS));
    method.append(summary, sourceBody);

    const actions = el('div', 'tm524-detail-actions');
    actions.append(
      button('Open Chamber', () => { location.hash = `#chamber-${record.id}`; rememberChamber(valid); closeAll(); }, 'tm524-btn'),
      button('Collect', () => openVault(valid), 'tm524-btn tm524-btn--secondary'),
      button('Download Record JSON', () => downloadRecord(valid), 'tm524-btn tm524-btn--ghost')
    );
    detail.append(nav, hero, baseGrid, twin, temple, method, actions);
    syncSelectedList();
    if (scrollList) document.querySelector(`.tm524-record-item[data-number="${valid}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function downloadRecord(number) {
    const record = byNumber.get(clampChamber(number) || 1);
    downloadJson(`temple-of-maat-chamber-${record.id}-living-codex.json`, {
      schema: 'temple-of-maat/living-codex-record-v1', version: VERSION, source: SOURCE, record, templeLayer: archiveChamber(record.number), discernment: DISCERNMENT, synthesis: SYNTHESIS
    });
  }

  function downloadFullCodex() {
    downloadJson('temple-of-maat-v5.2.4-living-codex.json', {
      schema: 'temple-of-maat/living-codex-v1', version: VERSION, source: SOURCE, records, discernment: DISCERNMENT, synthesis: SYNTHESIS
    });
  }

  function findExistingAction(selector, textPattern) {
    const artifact = document.querySelector('#tm2-artifact.open') || document;
    const bySelector = selector ? artifact.querySelector(selector) : null;
    if (bySelector) return bySelector;
    return [...artifact.querySelectorAll('button, a[role="button"], a')].find((node) => textPattern && textPattern.test((node.textContent || '').replace(/\s+/g, ' ').trim())) || null;
  }

  function relayDownload(selector, pattern, status) {
    const action = findExistingAction(selector, pattern);
    if (!action) {
      status.textContent = 'That collectible is not available in the current chamber view.';
      return;
    }
    status.textContent = `Preparing ${((action.textContent || 'collectible').trim())}…`;
    action.click();
    setTimeout(() => { status.textContent = 'Download requested.'; }, 300);
  }

  function createVault() {
    if (document.getElementById('tm524-vault')) return;
    const { layer, panel } = createLayer('tm524-vault', 'Chamber Collectible Vault');
    const content = el('div', 'tm524-vault-content');
    content.id = 'tm524-vault-content';
    panel.append(content);
    layer.addEventListener('temple:vault-open', () => renderVault(currentNumber()));
  }

  function renderVault(number) {
    const valid = clampChamber(number) || currentNumber();
    const record = byNumber.get(valid);
    const content = document.getElementById('tm524-vault-content');
    if (!content || !record) return;
    content.replaceChildren();
    const archive = archiveChamber(valid);
    content.append(el('p', 'tm524-eyebrow', `Chamber ${record.id}`), el('h3', 'tm524-vault-title', archive?.thirdName || `${record.angel} ↔ ${record.gematriaTwin.daemon}`));
    const status = el('p', 'tm524-vault-status', 'Choose a collectible. Existing Temple export engines are reused rather than duplicated.');
    const grid = el('div', 'tm524-vault-grid');
    const actions = [
      ['Seal PNG', '.tm2-seal-download', /seal\s*(png|download)/i],
      ['Plate PNG', '.tm2-plate-download', /plate\s*(png|download)/i],
      ['Wallpaper 1440×2560', '.tm2-wallpaper', /wallpaper\s*1440/i],
      ['Parental Powers Wallpaper 3840×2160', '.tm2-parental-download', /parental.*wallpaper|wallpaper.*3840/i]
    ];
    actions.forEach(([label, selector, pattern]) => grid.append(button(label, () => relayDownload(selector, pattern, status), 'tm524-collectible')));
    grid.append(button('Living Codex Record JSON', () => { downloadRecord(valid); status.textContent = 'Codex record downloaded.'; }, 'tm524-collectible'));
    content.append(grid, status);
  }

  function openVault(number) {
    const valid = clampChamber(number) || currentNumber();
    rememberChamber(valid);
    renderVault(valid);
    openLayer('tm524-vault');
  }

  function createChant() {
    if (document.getElementById('tm524-chant')) return;
    const { layer, panel } = createLayer('tm524-chant', 'Ma’at — Forty-Two Declarations');
    const content = el('div', 'tm524-chant-content');
    audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = CHANT_SRC;
    audio.setAttribute('aria-label', 'Ma’at Chant of the Forty-Two Declarations');
    const savedVolume = Number(localStorage.getItem(CHANT_VOLUME_KEY));
    audio.volume = Number.isFinite(savedVolume) ? Math.min(1, Math.max(0, savedVolume)) : 0.72;
    const status = el('p', 'tm524-chant-status', 'Loading chant metadata…');
    const time = el('span', 'tm524-chant-time', '00:00 / --:--');
    const transport = el('div', 'tm524-transport');
    const play = button('Play', async () => {
      if (!chantReady) return;
      try { await audio.play(); } catch { status.textContent = 'Playback requires an explicit browser media permission.'; }
    });
    const pause = button('Pause', () => audio.pause(), 'tm524-btn tm524-btn--secondary');
    const stop = button('Stop', () => { audio.pause(); audio.currentTime = 0; }, 'tm524-btn tm524-btn--ghost');
    play.disabled = true;
    transport.append(play, pause, stop);
    const volumeWrap = el('label', 'tm524-volume');
    volumeWrap.append(el('span', '', 'Volume'));
    const volume = document.createElement('input');
    volume.type = 'range'; volume.min = '0'; volume.max = '1'; volume.step = '0.01'; volume.value = String(audio.volume);
    volume.addEventListener('input', () => { audio.volume = Number(volume.value); try { localStorage.setItem(CHANT_VOLUME_KEY, volume.value); } catch {} });
    volumeWrap.append(volume);
    const note = el('p', 'tm524-note', 'The chant never autoplays. Playback begins only after the visitor presses Play; volume preference may be remembered locally.');
    content.append(el('p', 'tm524-eyebrow', 'User-governed ritual audio'), status, time, transport, volumeWrap, note, audio);
    panel.append(content);

    function formatTime(seconds) {
      if (!Number.isFinite(seconds)) return '--:--';
      const whole = Math.max(0, Math.floor(seconds));
      return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
    }
    audio.addEventListener('loadedmetadata', () => { chantReady = true; play.disabled = false; status.textContent = 'Ready. Awaiting your command.'; time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`; });
    audio.addEventListener('timeupdate', () => { time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`; });
    audio.addEventListener('play', () => { status.textContent = 'Chant playing.'; });
    audio.addEventListener('pause', () => { if (chantReady && audio.currentTime > 0 && !audio.ended) status.textContent = 'Chant paused.'; });
    audio.addEventListener('ended', () => { status.textContent = 'Chant complete.'; });
    audio.addEventListener('error', () => { chantReady = false; play.disabled = true; status.textContent = 'The chant audio asset is not installed in this build.'; });
  }

  function createDock() {
    if (document.getElementById('tm524-dock')) return;
    const dock = el('nav', 'tm524-dock');
    dock.id = 'tm524-dock';
    dock.setAttribute('aria-label', 'Living Codex tools');
    const chamber = button('Chamber 01', () => { const n = currentNumber(); location.hash = `#chamber-${formatChamber(n)}`; }, 'tm524-dock-chamber');
    chamber.id = 'tm524-dock-chamber';
    dock.append(
      button('Codex', openCodex, 'tm524-dock-btn'),
      button('Collect', () => openVault(currentNumber()), 'tm524-dock-btn'),
      button('Chant', () => openLayer('tm524-chant'), 'tm524-dock-btn'),
      chamber
    );
    document.body.appendChild(dock);
    updateDockLabel();
  }

  function updateDockLabel() {
    const node = document.getElementById('tm524-dock-chamber');
    if (node) node.textContent = `Chamber ${formatChamber(currentNumber())}`;
  }

  function openCodex(number) {
    const valid = clampChamber(number) || currentNumber();
    selectedNumber = valid;
    const layer = document.getElementById('tm524-codex');
    layer?.dispatchEvent(new CustomEvent('temple:codex-open'));
    openLayer('tm524-codex');
  }

  function enhanceEntrance() {
    const actions = document.querySelector('#temple-static-entry .temple-static-entry__actions');
    if (!actions || actions.querySelector('[data-temple-entry="continue"]')) return;
    const last = clampChamber(localStorage.getItem(LAST_CHAMBER_KEY));
    if (!last) return;
    const link = el('a', 'temple-static-entry__action temple-static-entry__action--continue', `Continue at Chamber ${formatChamber(last)}`);
    link.href = `#chamber-${formatChamber(last)}`;
    link.dataset.templeEntry = 'continue';
    actions.appendChild(link);
  }

  function syncContextTools() {
    const artifact = document.querySelector('#tm2-artifact.open');
    let tools = document.getElementById('tm524-context-tools');
    if (!artifact) {
      tools?.remove();
      return;
    }
    if (tools) return;
    tools = el('div', 'tm524-chamber-tools');
    tools.id = 'tm524-context-tools';
    tools.setAttribute('aria-label', 'Current chamber Codex tools');
    tools.append(
      button('Open Codex Record', () => openCodex(currentNumber()), 'tm524-chamber-tool'),
      button('Collect', () => openVault(currentNumber()), 'tm524-chamber-tool')
    );
    // Keep Temple enhancements outside the React-owned artifact subtree.
    document.body.appendChild(tools);
  }

  function onChamberChange() {
    const number = chamberFromHash();
    if (number) rememberChamber(number);
    syncContextTools();
  }

  function initObserver() {
    if (artifactObserver || !document.body) return;
    artifactObserver = new MutationObserver(syncContextTools);
    artifactObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  function init() {
    ensureStyle();
    createCodex();
    createVault();
    createChant();
    createDock();
    enhanceEntrance();
    initObserver();
    onChamberChange();
    window.addEventListener('hashchange', onChamberChange, { passive: true });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAll(); });

    window.TempleLivingCodex = Object.freeze({
      version: VERSION,
      source: SOURCE,
      records: () => records.slice(),
      record: (number) => byNumber.get(clampChamber(number) || currentNumber()) || null,
      current: currentNumber,
      open: openCodex,
      openVault,
      downloadRecord,
      downloadFull: downloadFullCodex,
      chant: Object.freeze({
        play: () => chantReady ? audio.play() : Promise.reject(new Error('Chant audio is not ready.')),
        pause: () => audio?.pause(),
        stop: () => { if (audio) { audio.pause(); audio.currentTime = 0; } }
      })
    });
    document.dispatchEvent(new CustomEvent('temple:living-codex-ready', { detail: { version: VERSION, records: records.length } }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
