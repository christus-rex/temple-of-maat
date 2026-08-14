from pathlib import Path

path = Path('scripts/v5.2.5-living-temple.js')
source = path.read_text(encoding='utf-8')
source = source.replace("  const WEB_CHANT_SRC = './assets/audio/maat-forty-two-declarations-web.opus';\n", "")
source = source.replace("  const WEB_AUDIO_SHA256 = '60f73465d4f6022e6054a1be1c228cfeba04be7947344e4e7a43537400db7782';\n", "")
source = source.replace("  const WEB_AUDIO_BYTES = 1336596;\n", "")
source = source.replace("  const WEB_AUDIO_DURATION = 1013.072229;\n", "  const SOURCE_MP3_BYTES = 16210172;\n  const SOURCE_MP3_DURATION = 1013.106939;\n")
old = '''  function upgradeChant() {
    const chant = document.getElementById('tm524-chant');
    const audio = chant?.querySelector('audio');
    const content = chant?.querySelector('.tm524-chant-content');
    if (!audio || !content) return false;
    if (!audio.dataset.tm525Bundled) {
      audio.dataset.tm525Bundled = 'true';
      audio.preload = 'metadata';
      audio.src = WEB_CHANT_SRC;
      audio.load();
    }
    if (!content.querySelector('.tm525-audio-source')) {
      const source = el('div', 'tm525-audio-source');
      source.append(
        el('strong', '', 'Bundled Ma’at chant'),
        el('span', '', 'Web Opus · 16:53 · user-controlled playback'),
        el('small', '', `Web SHA-256 ${WEB_AUDIO_SHA256.slice(0, 12)}… · source MP3 ${SOURCE_MP3_SHA256.slice(0, 12)}…`)
      );
      const audioNode = content.querySelector('audio');
      content.insertBefore(source, audioNode);
    }
    return true;
  }
'''
new = '''  function upgradeChant() {
    const chant = document.getElementById('tm524-chant');
    const audio = chant?.querySelector('audio');
    if (!audio) return false;
    // v5.2.5 deliberately leaves source ownership to TempleMediaVault.
    // The exact MP3 is verified and installed locally; no unpublished network asset is implied.
    audio.preload = 'metadata';
    audio.removeAttribute('autoplay');
    return true;
  }
'''
if source.count(old) != 1:
    raise SystemExit(f'Expected one upgradeChant block, found {source.count(old)}')
source = source.replace(old, new, 1)
old_api = '''      audio: Object.freeze({
        source: WEB_CHANT_SRC,
        webSha256: WEB_AUDIO_SHA256,
        webBytes: WEB_AUDIO_BYTES,
        durationSeconds: WEB_AUDIO_DURATION,
        originalMp3Sha256: SOURCE_MP3_SHA256
      })'''
new_api = '''      audio: Object.freeze({
        distribution: 'indexeddb-device-install',
        originalMp3Sha256: SOURCE_MP3_SHA256,
        originalMp3Bytes: SOURCE_MP3_BYTES,
        durationSeconds: SOURCE_MP3_DURATION,
        autoplay: false
      })'''
if source.count(old_api) != 1:
    raise SystemExit(f'Expected one public audio API block, found {source.count(old_api)}')
source = source.replace(old_api, new_api, 1)
path.write_text(source, encoding='utf-8')
