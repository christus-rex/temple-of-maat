import crypto from 'node:crypto';
import fs from 'node:fs';

const fail = (message) => { throw new Error(message); };
const audioPath = 'assets/audio/maat-forty-two-declarations.web.opus';
const metaPath = 'assets/audio/maat-forty-two-declarations.json';
const fallbackPath = 'scripts/v5.2.4-chant-fallback.js';
const swPath = 'sw.js';

for (const path of [audioPath, metaPath, fallbackPath, swPath]) {
  if (!fs.existsSync(path)) fail(`Missing chant streaming asset: ${path}`);
}

const audio = fs.readFileSync(audioPath);
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const fallback = fs.readFileSync(fallbackPath, 'utf8');
const sw = fs.readFileSync(swPath, 'utf8');
const sha256 = crypto.createHash('sha256').update(audio).digest('hex');

if (audio.length !== 1336596) fail(`Unexpected web chant byte count: ${audio.length}`);
if (sha256 !== 'b82360e17adf2240ca8ac8071a8d20ce295bfb6c38f143a4b3367ab90afee94b') fail(`Unexpected web chant SHA-256: ${sha256}`);
if (meta.preparedWebRendition?.status !== 'published') fail('Web chant metadata must declare published status');
if (meta.preparedWebRendition?.path !== audioPath) fail('Web chant metadata path does not match published asset');
if (meta.preparedWebRendition?.bytes !== audio.length || meta.preparedWebRendition?.sha256 !== sha256) fail('Web chant metadata fingerprint does not match bytes');
if (meta.distribution?.mode !== 'web-rendition-plus-indexeddb-canonical' || meta.distribution?.webStreaming !== true) fail('Web chant distribution mode is not enabled');
if (meta.source?.sha256 !== '3e40ba7d0b60c3a04f7edf3022fc98f9daf2fcc3ca9e7900c87bb2b62f02fbe6') fail('Canonical MP3 fingerprint drifted');

for (const marker of [
  "const WEB_SRC = './assets/audio/maat-forty-two-declarations.web.opus'",
  'function ensureWebSource(',
  "audio.dataset.tm524StreamingFallback = 'web'",
  'canonicalInstalled(ui.audio)',
  "ui.audio.removeAttribute('autoplay')"
]) {
  if (!fallback.includes(marker)) fail(`Chant streaming fallback marker missing: ${marker}`);
}

if (!sw.includes("const VERSION = 'temple-maat-pwa-v5.2.8-library-journey-offline-2026-08-14-r3'")) fail('Chant streaming service-worker shell must be r3');
const core = sw.match(/const CORE_ASSETS = \[([\s\S]*?)\];/);
if (!core) fail('Unable to inspect service-worker CORE_ASSETS');
if (core[1].includes('maat-forty-two-declarations.web.opus')) fail('Streaming chant binary must remain network-only, outside Cache Storage');
if (!sw.includes('function isBinaryRitualMedia(url)')) fail('Binary ritual-media network-only boundary is missing');

console.log(JSON.stringify({
  ok: true,
  webRendition: { path: audioPath, bytes: audio.length, sha256 },
  canonicalSha256: meta.source.sha256,
  distribution: meta.distribution.mode,
  serviceWorkerShell: 'r3',
  autoplay: false
}, null, 2));
