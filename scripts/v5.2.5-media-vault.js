/* Temple of Ma'at v5.2.5 — canonical ritual media vault */
(function () {
  'use strict';

  const DB_NAME = 'temple-of-maat-media';
  const DB_VERSION = 1;
  const STORE = 'ritual-media';
  const KEY = 'maat-forty-two-declarations';
  const CANONICAL_SHA256 = '3e40ba7d0b60c3a04f7edf3022fc98f9daf2fcc3ca9e7900c87bb2b62f02fbe6';
  const CANONICAL_BYTES = 16210172;
  const CANONICAL_DURATION = 1013.106939;
  let objectUrl = null;
  let installed = false;
  let observer = null;

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getMedia() {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }

  async function putMedia(value) {
    const db = await openDb();
    try {
      await new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }

  async function deleteMedia() {
    const db = await openDb();
    try {
      await new Promise((resolve, reject) => {
        const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }

  async function sha256(blob) {
    const bytes = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  }

  function player() {
    const chant = document.getElementById('tm524-chant');
    if (!chant) return null;
    return {
      chant,
      content: chant.querySelector('.tm524-chant-content'),
      audio: chant.querySelector('audio'),
      status: chant.querySelector('.tm524-chant-status'),
      input: chant.querySelector('.tm524-local-chant input[type="file"]'),
      play: [...chant.querySelectorAll('button')].find((node) => /^play$/i.test(node.textContent.trim()))
    };
  }

  function releaseObjectUrl() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  function useBlob(blob, label = 'Canonical Ma’at chant installed on this device.') {
    const ui = player();
    if (!ui?.audio || !blob) return false;
    releaseObjectUrl();
    objectUrl = URL.createObjectURL(blob);
    ui.audio.pause();
    ui.audio.preload = 'metadata';
    ui.audio.src = objectUrl;
    ui.audio.dataset.tm525MediaVault = 'canonical';
    ui.audio.removeAttribute('autoplay');
    ui.audio.load();
    if (ui.status) ui.status.textContent = label;
    installed = true;
    renderStatus();
    return true;
  }

  function clearPlayer(message) {
    const ui = player();
    if (!ui?.audio) return;
    ui.audio.pause();
    releaseObjectUrl();
    ui.audio.removeAttribute('src');
    ui.audio.removeAttribute('data-tm525-media-vault');
    ui.audio.load();
    if (ui.play) ui.play.disabled = true;
    if (ui.status) ui.status.textContent = message;
    installed = false;
    renderStatus();
  }

  function renderStatus() {
    const ui = player();
    if (!ui?.content) return;
    ui.content.querySelector('.tm525-audio-source')?.remove();
    let card = ui.content.querySelector('.tm525-media-vault');
    if (!card) {
      card = document.createElement('div');
      card.className = 'tm525-audio-source tm525-media-vault';
      const audioNode = ui.content.querySelector('audio');
      ui.content.insertBefore(card, audioNode);
    }
    card.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = installed ? 'Canonical Ma’at chant · installed locally' : 'Canonical Ma’at chant · local installation';
    const detail = document.createElement('span');
    detail.textContent = installed
      ? 'Exact original MP3 · 16:53 · offline-capable · no autoplay'
      : 'Choose the exact original MP3 once; the PWA stores it privately on this device for future visits.';
    const fingerprint = document.createElement('small');
    fingerprint.textContent = `SHA-256 ${CANONICAL_SHA256.slice(0, 16)}… · ${CANONICAL_BYTES.toLocaleString()} bytes`;
    card.append(title, detail, fingerprint);
    if (installed) {
      const forget = document.createElement('button');
      forget.type = 'button';
      forget.className = 'tm525-btn tm525-btn--ghost';
      forget.textContent = 'Forget Installed Chant';
      forget.addEventListener('click', async () => {
        await deleteMedia();
        clearPlayer('Installed chant removed from this device. Choose the canonical MP3 to install it again.');
      });
      card.appendChild(forget);
    }
  }

  async function installFile(file) {
    const ui = player();
    if (!file || !ui) return;
    if (ui.status) ui.status.textContent = 'Verifying canonical Ma’at chant…';
    if (file.size !== CANONICAL_BYTES) {
      clearPlayer(`File size does not match the canonical chant (${CANONICAL_BYTES.toLocaleString()} bytes).`);
      if (ui.input) ui.input.value = '';
      return;
    }
    let hash;
    try { hash = await sha256(file); }
    catch {
      clearPlayer('The browser could not verify this audio file.');
      return;
    }
    if (hash !== CANONICAL_SHA256) {
      clearPlayer('SHA-256 mismatch. Choose the original “Ma’at — Chant of the Forty-Two Declarations.mp3”.');
      if (ui.input) ui.input.value = '';
      return;
    }
    await putMedia({
      blob: file,
      name: file.name,
      type: file.type || 'audio/mpeg',
      bytes: file.size,
      sha256: hash,
      durationSeconds: CANONICAL_DURATION,
      installedAt: new Date().toISOString()
    });
    useBlob(file, 'Canonical Ma’at chant verified and installed. Awaiting Play.');
  }

  function bindInput() {
    const ui = player();
    if (!ui?.input || ui.input.dataset.tm525Bound) return false;
    ui.input.dataset.tm525Bound = 'true';
    ui.input.accept = 'audio/mpeg,.mp3';
    // Capture-phase ownership prevents the older generic fallback from accepting a non-canonical file.
    ui.input.addEventListener('change', (event) => {
      event.stopImmediatePropagation();
      const file = ui.input.files?.[0];
      if (file) installFile(file).catch(() => clearPlayer('The chant could not be installed on this device.'));
    }, true);
    return true;
  }

  async function restore() {
    const ui = player();
    if (!ui?.audio) return false;
    bindInput();
    let saved = null;
    try { saved = await getMedia(); } catch {}
    if (saved?.blob && saved.sha256 === CANONICAL_SHA256 && saved.bytes === CANONICAL_BYTES) {
      useBlob(saved.blob, 'Canonical Ma’at chant restored from this device. Awaiting Play.');
      return true;
    }
    // Do not leave a broken network source in the player when the repository cannot stream the local upload.
    clearPlayer('Install the canonical Ma’at chant from this device. Playback will remain silent until you choose the file and press Play.');
    bindInput();
    return true;
  }

  function install() {
    if (restore()) {
      renderStatus();
      return;
    }
  }

  function watch() {
    if (observer) return;
    observer = new MutationObserver(() => {
      if (bindInput()) restore().catch(() => {});
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function init() {
    restore().catch(() => {});
    watch();
    window.TempleMediaVault = Object.freeze({
      version: '5.2.5',
      key: KEY,
      canonical: Object.freeze({ sha256: CANONICAL_SHA256, bytes: CANONICAL_BYTES, durationSeconds: CANONICAL_DURATION }),
      installed: () => installed,
      forget: async () => { await deleteMedia(); clearPlayer('Installed chant removed from this device.'); },
      restore
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  window.addEventListener('pagehide', releaseObjectUrl, { once: true });
})();
