import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const read = (relative) => fs.readFileSync(file(relative), 'utf8');
const fail = (message) => { throw new Error(message); };

for (const relative of [
  'scripts/v5.2.8-offline-controls.js',
  'styles/v5.2.8-offline-controls.css',
  'scripts/v5.3-threshold.js',
  'sw.js'
]) {
  if (!fs.existsSync(file(relative))) fail(`Missing offline ownership file: ${relative}`);
}

const ui = read('scripts/v5.2.8-offline-controls.js');
const css = read('styles/v5.2.8-offline-controls.css');
const threshold = read('scripts/v5.3-threshold.js');
const sw = read('sw.js');

for (const [name, source] of [['offline controls', ui], ['service worker', sw]]) {
  try { new vm.Script(source, { filename: name }); } catch (error) { fail(`${name} JavaScript does not parse: ${error.message}`); }
}

for (const marker of [
  "loadEnhancement('./scripts/v5.2.8-offline-controls.js', 'offline-controls')",
  "window.TempleOfflineCache = Object.freeze",
  "CACHE_FULL_TEMPLE"
]) {
  if (!threshold.includes(marker)) fail(`Threshold offline marker missing: ${marker}`);
}

for (const marker of [
  "const VERSION = '1.0.0'",
  'window.TempleOfflineManager = Object.freeze',
  'Download Temple for Offline Use',
  'Cancel Download',
  'Refresh Storage Status',
  'Clear Optional Offline Visuals',
  'substantial device storage',
  'It does not erase your Pilgrim Journey, favorites, reflections, Library bookmarks, Library notes',
  'Ritual audio is excluded from the service-worker cache',
  "request('GET_OFFLINE_STATUS', 'TEMPLE_OFFLINE_STATUS')",
  "request('CLEAR_OPTIONAL_VISUAL_CACHE', 'TEMPLE_OFFLINE_CLEAR_RESULT')",
  "post('CANCEL_FULL_TEMPLE'",
  "if (!document.body.classList.contains('temple-app-ready')) return false"
]) {
  if (!ui.includes(marker)) fail(`Offline UI contract marker missing: ${marker}`);
}

if (/localStorage\.(?:clear|removeItem)\s*\(/.test(ui)) fail('Offline UI must not clear localStorage or Journey/reflection state');
if (/indexedDB\.deleteDatabase\s*\(/.test(ui)) fail('Offline UI must not delete ritual-media or personal IndexedDB databases');
if (/\bfetch\s*\(/.test(ui)) fail('Offline control UI must communicate through the service worker rather than upload/fetch private state');

for (const marker of [
  'async function optionalDisplayAssets()',
  "asset.category === 'hero' || asset.category === 'seal'",
  'record.display?.path',
  'async function cacheFullTemple(requestId, clientId)',
  "type: 'TEMPLE_OFFLINE_FULL_PROGRESS'",
  "data.type === 'CANCEL_FULL_TEMPLE'",
  "data.type === 'GET_OFFLINE_STATUS'",
  "data.type === 'CLEAR_OPTIONAL_VISUAL_CACHE'",
  'async function clearOptionalVisualCache(requestId, clientId)',
  'cache.delete(asset)',
  'function isBinaryRitualMedia(url)',
  "status: 504, statusText: 'Offline'",
  "'./scripts/v5.2.8-offline-controls.js'",
  "'./styles/v5.2.8-offline-controls.css'",
  "'./assets/audio/maat-forty-two-declarations.json'"
]) {
  if (!sw.includes(marker)) fail(`Service-worker offline marker missing: ${marker}`);
}

const coreMatch = sw.match(/const CORE_ASSETS = \[([\s\S]*?)\];/);
if (!coreMatch) fail('Unable to inspect CORE_ASSETS');
if (/\.(?:mp3|opus|ogg|m4a|wav)['"]/.test(coreMatch[1])) fail('Binary ritual media must not be present in CORE_ASSETS');
if (!/\/assets\\\/audio\\\/\.\*\\\.\(\?:mp3\|opus\|ogg\|m4a\|wav\)/.test(sw) && !sw.includes('/\\/assets\\/audio\\/.*\\.(?:mp3|opus|ogg|m4a|wav)$/i')) {
  fail('Binary ritual media bypass pattern is missing');
}
if (/caches\.delete\s*\(\s*RUNTIME_CACHE\s*\)/.test(sw)) fail('Optional visual cleanup must not delete the entire runtime shell cache');

for (const marker of [
  '.tm528o-layer',
  'body:not(.temple-app-ready) .tm528o-layer',
  '.tm528o-progress',
  '@media(max-width:700px)',
  '.tm528o-actions .tm525-btn{width:100%}',
  '@media(prefers-reduced-motion:reduce)'
]) {
  if (!css.includes(marker)) fail(`Offline controls CSS marker missing: ${marker}`);
}

console.log('Validated offline ownership controls: explicit opt-in, status/progress/cancel, visual-only cleanup, private-state separation, binary ritual-media cache bypass, mobile layout, and manual-threshold protection.');
