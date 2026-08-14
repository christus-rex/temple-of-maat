/* Temple of Ma'at v5.2.8 — web-streamed chant + local/canonical fallback */
(function () {
  'use strict';

  const WEB_SRC = './assets/audio/maat-forty-two-declarations.web.opus';
  let localObjectUrl = null;
  let sourceObserver = null;
  let webRepairQueued = false;

  function player() {
    const content = document.querySelector('#tm524-chant .tm524-chant-content');
    if (!content) return null;
    return {
      content,
      audio: content.querySelector('audio'),
      status: content.querySelector('.tm524-chant-status'),
      play: [...content.querySelectorAll('button')].find((node) => /^play$/i.test(node.textContent.trim()))
    };
  }

  function canonicalInstalled(audio) {
    return audio?.dataset?.tm525MediaVault === 'canonical' || window.TempleMediaVault?.installed?.() === true;
  }

  function isWebSource(audio) {
    if (!audio) return false;
    const attr = audio.getAttribute('src') || '';
    return audio.dataset.tm524StreamingFallback === 'web' || attr.endsWith('maat-forty-two-declarations.web.opus');
  }

  function releaseLocalObjectUrl() {
    if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
    localObjectUrl = null;
  }

  function ensureWebSource(message = 'Loading the compact web chant rendition…') {
    const ui = player();
    if (!ui?.audio || localObjectUrl || canonicalInstalled(ui.audio)) return false;
    if (isWebSource(ui.audio) && ui.audio.getAttribute('src')) return true;

    ui.audio.pause();
    ui.audio.preload = 'metadata';
    ui.audio.removeAttribute('data-tm525-media-vault');
    ui.audio.dataset.tm524StreamingFallback = 'web';
    ui.audio.src = WEB_SRC;
    ui.audio.removeAttribute('autoplay');
    ui.audio.load();
    if (ui.status) ui.status.textContent = message;
    return true;
  }

  function queueWebRepair() {
    if (webRepairQueued) return;
    webRepairQueued = true;
    queueMicrotask(() => {
      webRepairQueued = false;
      ensureWebSource();
    });
  }

  function watchSource(audio) {
    if (!audio || sourceObserver) return;
    sourceObserver = new MutationObserver(() => {
      if (canonicalInstalled(audio)) {
        releaseLocalObjectUrl();
        delete audio.dataset.tm524StreamingFallback;
        return;
      }
      if (!localObjectUrl && !audio.getAttribute('src')) queueWebRepair();
    });
    sourceObserver.observe(audio, {
      attributes: true,
      attributeFilter: ['src', 'data-tm525-media-vault']
    });
  }

  function bindStreamingEvents(ui) {
    if (!ui?.audio || ui.audio.dataset.tm524StreamingBound === 'true') return;
    ui.audio.dataset.tm524StreamingBound = 'true';

    ui.audio.addEventListener('loadedmetadata', () => {
      if (!isWebSource(ui.audio)) return;
      if (ui.status) ui.status.textContent = 'Web chant ready. Awaiting Play.';
      if (ui.play) ui.play.disabled = false;
    });

    ui.audio.addEventListener('error', () => {
      if (!isWebSource(ui.audio)) return;
      if (ui.status) ui.status.textContent = 'The web chant could not be reached. You can still choose the canonical MP3 from this device.';
    });
  }

  function installLocalChantLoader() {
    const ui = player();
    if (!ui?.content || !ui.audio) return false;

    if (!ui.content.querySelector('.tm524-local-chant')) {
      const wrap = document.createElement('div');
      wrap.className = 'tm524-local-chant';

      const note = document.createElement('p');
      note.className = 'tm524-note';
      note.textContent = 'The compact web rendition streams immediately. To keep the exact canonical Ma’at chant offline, choose the original MP3 once; the Temple verifies and stores it privately on this device. The file stays on this device and is never uploaded by the Temple.';

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/mpeg,audio/mp3,audio/*';
      input.setAttribute('aria-label', 'Load local Ma’at chant audio');

      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) return;
        if (!file.type.startsWith('audio/') && !/\.mp3$/i.test(file.name)) {
          if (ui.status) ui.status.textContent = 'Choose an MP3 or another browser-supported audio file.';
          input.value = '';
          return;
        }
        releaseLocalObjectUrl();
        localObjectUrl = URL.createObjectURL(file);
        ui.audio.pause();
        delete ui.audio.dataset.tm524StreamingFallback;
        ui.audio.src = localObjectUrl;
        ui.audio.load();
        if (ui.status) ui.status.textContent = `Local chant loaded: ${file.name}. Awaiting Play.`;
      });

      wrap.append(note, input);
      ui.content.insertBefore(wrap, ui.audio);
    }

    bindStreamingEvents(ui);
    watchSource(ui.audio);
    ensureWebSource();
    return true;
  }

  function installWhenReady() {
    if (installLocalChantLoader()) return;
    const observer = new MutationObserver(() => {
      if (installLocalChantLoader()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 30000);
  }

  document.addEventListener('temple:living-codex-ready', installWhenReady, { once: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installWhenReady, { once: true });
  else installWhenReady();

  window.addEventListener('pagehide', () => {
    sourceObserver?.disconnect();
    sourceObserver = null;
    releaseLocalObjectUrl();
  }, { once: true });
})();
