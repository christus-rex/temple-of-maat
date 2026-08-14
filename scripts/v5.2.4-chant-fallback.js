/* Temple of Ma'at v5.2.4 — local chant media fallback */
(function () {
  'use strict';

  let localObjectUrl = null;

  function installLocalChantLoader() {
    const content = document.querySelector('#tm524-chant .tm524-chant-content');
    if (!content || content.querySelector('.tm524-local-chant')) return false;

    const audio = content.querySelector('audio');
    const status = content.querySelector('.tm524-chant-status');
    if (!audio) return false;

    const wrap = document.createElement('div');
    wrap.className = 'tm524-local-chant';

    const note = document.createElement('p');
    note.className = 'tm524-note';
    note.textContent = 'Media fallback: if the packaged chant is unavailable, load your exact local Ma’at chant MP3 here. The file stays on this device and is never uploaded by the Temple.';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mpeg,audio/mp3,audio/*';
    input.setAttribute('aria-label', 'Load local Ma’at chant audio');

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type.startsWith('audio/') && !/\.mp3$/i.test(file.name)) {
        if (status) status.textContent = 'Choose an MP3 or another browser-supported audio file.';
        input.value = '';
        return;
      }
      if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
      localObjectUrl = URL.createObjectURL(file);
      audio.pause();
      audio.src = localObjectUrl;
      audio.load();
      if (status) status.textContent = `Local chant loaded: ${file.name}. Awaiting Play.`;
    });

    wrap.append(note, input);
    content.insertBefore(wrap, audio);
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
    if (localObjectUrl) URL.revokeObjectURL(localObjectUrl);
  }, { once: true });
})();
