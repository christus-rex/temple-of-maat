/* Temple of SOL-OM-ON — Ma'at v5.4.2 Poems Chamber Drive embed hardening */
(function () {
  'use strict';

  if (window.__templePoemsDriveEmbedInstalled) return;
  window.__templePoemsDriveEmbedInstalled = true;

  const VAULT_URL = 'https://drive.google.com/drive/folders/1CH3y554nm5r8kMTHLkSiwtlkrN83OPsN';
  const MANIFEST_URL = 'https://docs.google.com/document/d/1GVH9AR9mVUCPTt7osFFrySIOL30RaGs4-mGNnzFJYPg/edit';
  const idMap = new Map(Object.entries({
    '1P89m1HQc1W1aHePSjZYiXHa620SjD6nr':'1Tikf1KUqakWLo0BA2xnWabkWaPoXIwtD',
    '1tI94spgafTI5BJygNkOaiZ6RnIn_9qpK':'1WBV3L1p1L6PSUTeBcR1f_HQ_iCOfvNd0',
    '1_4GszmzjIf7hbReO7c01eBcwXhtZ2x-q':'1xuE5L9imzAadiG0lMc35rq6onRbuED9x',
    '1zQlNrUQSr6_vN_v_xnpyjUzLcCjNKSQD':'12adyr2w-VwwtKzqKhHZcvEEQ3m5NxOBj',
    '1MHCdPNMS-hPsZ9OVEBJmdCTVqXT7XbQt':'1iBjdNArY-pYJQGT_dMeCtPVoa16HWz7y',
    '1KdVw4MDU0986Yp30qo1xVWlhEMUOsrYf':'1RBAH1XaOWEm43iPJ0ZK5tTamx9p-xdH1',
    '1eCyxWHNBfAgSL_OvLga61zCeWN9dXQTP':'1Z0GYpieWhk2Odb_17Ip-9c75IcL2lkeN',
    '18nsnA77Ux-cgLm8Ffb8K8Dj3CZswxhu5':'1dUZYTfbJCkz2OWrPjRSKt86bQGYlM9UI',
    '1VAphQhOtYIyXbm0VQqLYHER3CqL_Z0ui':'1OAaqNXSDOnzoiSPMtvDb3nBuHV6e2mSp',
    '1n_-jSCBQW0UcVPWHdmoCbfiz8GrxQLO0':'1CnshIaRlGp6uS3w84RZXnLFsP4JoGPi3',
    '12WTyLIMhQ1hW54U-Mi-LrfSfaL3klSqw':'1bOMHLxz90uhu8C2W_YxnK7qTM3tqatPO',
    '1L907QOQRZZr-oOclXqLqzLbox-bBgaEV':'1M-yvVW5Aadt4aPJjlKCmSIBo4_lPgQWi',
    '12Ld-5qozOA0aZq9EctkqWZkTUyzPiM8U':'101McX8F0zYTjGGzGcaiIS4WaVvN302m8',
    '1lwi0GQ1d8hhbnPEEfwy22aXbTw2gp-c1':'1mI9FkkK-kEXz1uq_LW1lbDUIoVlJjBQy',
    '1aL6zx8CRw9GbGtQFRZp1lYzDwlztgif4':'1Fy-LzReuhzVo5unmCeefDcXQpLdhjXNY',
    '1bF5qD99YHz3tqUZPJ1PsP-0S_tiy2pxv':'1jN4nbuSlaZYATYLlNV6CPPntAaQh6YJy',
    '1nfGV14Cn-ig3sIGmDxDEp-SJtS9wPzZe':'1kSZFXo8KMGvSeT1GiAgqkLE6qFpx9-Bb',
    '1VOXuSnSf1WtDwv-79_tERkK5s9kuK6J_':'1yC752wf7FhaCWPR-1Wxqmu7bbpoLDsDV',
    '1YP31r25yzmNQf5vsrGfeOjeZc-GQK_gm':'1AvhcoWPSp1ues9BXiL1F4msQKqB5dlPJ',
    '1iU8vyIwfDiI-8yKVL7SetEGULaPuGLI5':'19MClou1uRKZfN6fJHvETz2bd6xui6cym',
    '1aWQwfGxoqd-sT1E2xgSSHF34cSJt50VD':'15UrlAVwK-_Gc1rFmZDBepjVY6sbNji3s',
    '1W9UysgGzcmLd0GTMdXFwl2llaHgLa-QZ':'1Tdsxwi9xI9rQmaJ0N65rTLmq3z72m-3u',
    '1TQQuig2D1xKooMBj_J8aXVK2B8aHvkZ-':'1DQoOO01cvJsoyIQVv8XQwIjJK_uD8Ova',
    '1X8_qFOHaZwbL7STgoE_ZUNtMkxeV7_wX':'1msHipYqZPuJsXnkUUwGv5HtPd3J4XxxP',
    '1rArvpXPzK49JpqTQYxuOAOIVY-9DgVFw':'1wAs_olfkN2qb0QHRQLGYHvSl1MrsHyev',
    '1hYyV7fTqtUrK4Q268ksfVHDlglB0dH9m':'1EMAmX4KhhfhoaQp2QwX55WNDRDIv9G78'
  }));

  const extras = [
    ['1tcfXS2XAd102xldOowyRIALcFeaiHQNz','2026-08-14 — ChatGPT Creation — image-gen-2','Recent Creations'],
    ['1ozRmQXqVtv2fLwWpKu8YjjtbFnD_W_Sy','Shem HaMephorash — Sacred Four-Plate Composite','Shem HaMephorash'],
    ['1E3lPj2FeJbvt_QfKBLVwHm55bo58da0a','Nemamiah — 57th Angel of the Shem HaMephorash','Shem HaMephorash'],
    ['1l3oJ1DOboO_MY0QaxuMdI2b9EINhhvYK','Ma’at — Feather Eye and Temple Seal','Ma’at'],
    ['1la_nv8J9SWz5LnpO9FUVjmH_vAcFpYLs','Ma’at — Feather of Truth and Scales','Ma’at'],
    ['1uLW5dGZixYb74DV8pwTdQxZBLIeU5VPY','Katabasis — Descent and Remembrance Seal','Temple Seals'],
    ['1du026KMkr7NJfW_24jf-h6901qlRFd4V','Merkabah — Vessel of Ascending Solar Will — SOL-OM-ON in Motion','Merkabah'],
    ['1HL8nPCUwEaxSq5RaSFXVhqQwHsAi5opn','Covenant of Two Testaments — Ma’at Feather and Scales','Interfaith'],
    ['1y6oBC6z3TrwqE3S9CNR3OKk2jR0NYCCe','Thoth · Christus · Ma’at — Justice Wisdom Truth Love','Interfaith'],
    ['18gSy7GenTLV5o-WcWAliRwApxRk09gE2','Temple Gnostic Seal — Transparent Cutout','Temple Seals']
  ].map(([id,title,series]) => ({id,title,series}));

  const esc = (value) => String(value ?? '').replace(/[&<>\'\"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[char]);
  const thumb = (id, size = 2000) => `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${size}`;
  const fallback = (id) => `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
  const driveView = (id) => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;

  function remapUrl(url) {
    let next = String(url || '');
    for (const [oldId, newId] of idMap) next = next.split(oldId).join(newId);
    return next;
  }

  function installStyles() {
    if (document.getElementById('temple-poems-drive-embed-style')) return;
    const style = document.createElement('style');
    style.id = 'temple-poems-drive-embed-style';
    style.textContent = `
      .temple-drive-preview-fallback{display:flex;min-height:220px;align-items:center;justify-content:center;padding:28px;text-align:center;background:radial-gradient(circle at 50% 20%,rgba(67,221,208,.08),transparent 50%),#03070b;color:#c8d6d6;font:700 11px/1.6 ui-monospace,monospace;letter-spacing:.05em}
      .temple-drive-preview-fallback strong{display:block;color:#f2d27d;margin-bottom:6px}
      .temple-poems-vault-badge{margin-top:10px;color:#8debe3;font:700 9px/1.4 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
    `;
    document.head.appendChild(style);
  }

  function hardenImage(img) {
    if (!img || img.dataset.pcDriveHardened === 'true') return;
    const match = remapUrl(img.currentSrc || img.src).match(/[?&]id=([^&]+)/);
    const hrefMatch = img.closest('a')?.href?.match(/\/d\/([^/]+)/);
    const id = decodeURIComponent(match?.[1] || hrefMatch?.[1] || '');
    if (!id) return;
    img.dataset.pcDriveHardened = 'true';
    img.removeAttribute('onerror');
    img.src = thumb(id, img.closest('.temple-poem-card') ? 1600 : 2000);
    img.addEventListener('error', () => {
      if (img.dataset.pcFallbackStage !== 'direct') {
        img.dataset.pcFallbackStage = 'direct';
        img.src = fallback(id);
        return;
      }
      const media = img.closest('.temple-poem-media,.temple-depiction-media');
      if (!media || media.querySelector('.temple-drive-preview-fallback')) return;
      img.hidden = true;
      const note = document.createElement('div');
      note.className = 'temple-drive-preview-fallback';
      note.innerHTML = '<div><strong>High-resolution source preserved</strong>Preview temporarily unavailable. Open the original Drive file.</div>';
      media.appendChild(note);
    });
  }

  function extraCard(item) {
    return `<article class="temple-depiction-card" data-pc-vault-extra="true" data-title="${esc(item.title.toLowerCase())}" data-series="${esc(item.series)}">
      <a class="temple-depiction-media" href="${driveView(item.id)}" target="_blank" rel="noopener noreferrer" aria-label="Open full resolution depiction: ${esc(item.title)}">
        <img loading="lazy" decoding="async" src="${thumb(item.id)}" alt="${esc(item.title)}" referrerpolicy="no-referrer">
      </a>
      <div class="temple-depiction-body"><div class="temple-depiction-series">${esc(item.series)}</div><div class="temple-depiction-title">${esc(item.title)}</div><div class="temple-poems-vault-badge">Drive Embed Vault</div><a class="temple-depiction-open" href="${driveView(item.id)}" target="_blank" rel="noopener noreferrer">Full-resolution source ↗</a></div>
    </article>`;
  }

  function patchActions(backdrop) {
    const actions = backdrop.querySelector('.temple-poems-actions');
    if (!actions || actions.querySelector('[data-pc-vault-link]')) return;
    const vault = document.createElement('a');
    vault.className = 'temple-poems-action';
    vault.dataset.pcVaultLink = 'true';
    vault.href = VAULT_URL;
    vault.target = '_blank';
    vault.rel = 'noopener noreferrer';
    vault.textContent = 'Drive Embed Vault ↗';
    const manifest = vault.cloneNode(true);
    manifest.dataset.pcVaultLink = 'manifest';
    manifest.href = MANIFEST_URL;
    manifest.textContent = 'Embed Manifest ↗';
    actions.append(vault, manifest);
  }

  function patchCopy(backdrop) {
    backdrop.querySelectorAll('.temple-poems-section-copy').forEach((node) => {
      node.textContent = node.textContent
        .replace(/The 21 directly addressable image depictions[^.]*\./, 'Thirty-one high-fidelity depictions are served from the dedicated Poems Chamber Drive embed vault, with original source files preserved.')
        .replace(/the 21 direct high-resolution images/i, 'the 31 Drive-vault high-resolution images');
    });
  }

  function patchDom() {
    installStyles();
    const backdrop = document.getElementById('temple-poems-backdrop');
    if (!backdrop) return;
    patchActions(backdrop);
    patchCopy(backdrop);

    backdrop.querySelectorAll('a[href]').forEach((link) => {
      const next = remapUrl(link.href);
      if (next !== link.href) link.href = next;
    });
    backdrop.querySelectorAll('img[src]').forEach((img) => {
      const next = remapUrl(img.src);
      if (next !== img.src) img.src = next;
      hardenImage(img);
    });

    const grid = backdrop.querySelector('[data-depiction-grid]');
    if (grid) {
      const present = new Set([...grid.querySelectorAll('.temple-depiction-media')].map((a) => a.href.match(/\/d\/([^/]+)/)?.[1]).filter(Boolean));
      const missing = extras.filter((item) => !present.has(item.id));
      if (missing.length) grid.insertAdjacentHTML('beforeend', missing.map(extraCard).join(''));
      backdrop.querySelectorAll('[data-pc-vault-extra] img').forEach(hardenImage);
      const select = backdrop.querySelector('.temple-poems-filter');
      if (select) {
        const values = new Set([...select.options].map((o) => o.value || o.textContent));
        extras.map((item) => item.series).filter((value, index, list) => list.indexOf(value) === index).sort().forEach((series) => {
          if (values.has(series)) return;
          const option = document.createElement('option');
          option.value = series;
          option.textContent = series;
          select.appendChild(option);
        });
      }
    }
  }

  let queued = false;
  function queuePatch() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; patchDom(); });
  }

  const observer = new MutationObserver(queuePatch);
  function init() {
    queuePatch();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.TemplePoemsDriveEmbed = Object.freeze({
    version: '5.4.2',
    vaultUrl: VAULT_URL,
    manifestUrl: MANIFEST_URL,
    canonicalDepictionCount: 31,
    canonicalPoemPdfCount: 5,
    remappedSourceCount: idMap.size
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
