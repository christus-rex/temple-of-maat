import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41785;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function canonicalSizedSilentWav() {
  const totalSize = 16210172;
  const dataSize = totalSize - 44;
  const sampleRate = 8000;
  const buffer = Buffer.alloc(totalSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

try {
  await wait(900);
  const launchOptions = { headless: true };
  if (process.env.TEMPLE_BROWSER_PATH) launchOptions.executablePath = process.env.TEMPLE_BROWSER_PATH;
  else if (process.platform === 'win32') launchOptions.executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    if (sessionStorage.getItem('tm525-smoke-initialized')) return;
    localStorage.removeItem('temple_v525_pilgrim_journey');
    localStorage.removeItem('temple_last_chamber');
    sessionStorage.setItem('tm525-smoke-initialized', '1');
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5' && window.TempleMediaVault?.version === '5.2.5', { timeout: 30000 });

  const beforeEntry = await page.evaluate(() => ({
    appReady: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    rootHidden: document.getElementById('root')?.getAttribute('aria-hidden') === 'true',
    journeyEntry: document.querySelector('[data-temple-entry="journey"]')?.textContent?.trim(),
    journeyEntryHref: document.querySelector('[data-temple-entry="journey"]')?.getAttribute('href'),
    journeyLayerHidden: document.getElementById('tm525-journey')?.hidden,
    dockDisplay: getComputedStyle(document.getElementById('tm524-dock')).display
  }));

  await page.locator('[data-temple-entry="journey"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'));
  await page.waitForFunction(() => location.hash === '#chamber-01');
  await page.waitForFunction(() => window.TemplePilgrimJourney.state().visited.includes(1));

  await page.evaluate(() => window.TemplePilgrimJourney.openDossier(13));
  await page.waitForSelector('#tm525-dossier:not([hidden])');
  await page.waitForFunction(() => document.querySelectorAll('#tm525-dossier .tm525-visual-frame img').length === 3);
  await page.waitForFunction(() => [...document.querySelectorAll('#tm525-dossier .tm525-visual-frame img')].every((image) => image.complete && image.naturalWidth > 0), { timeout: 30000 });
  const dossier = await page.evaluate(() => ({
    text: document.querySelector('#tm525-dossier .tm525-panel-body')?.innerText || '',
    imageCount: document.querySelectorAll('#tm525-dossier .tm525-visual-frame img').length,
    imagesLoaded: [...document.querySelectorAll('#tm525-dossier .tm525-visual-frame img')].every((image) => image.naturalWidth > 0)
  }));

  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    window.TemplePilgrimJourney.favorite(13);
    window.TemplePilgrimJourney.reflect(13, 'Smoke reflection: depth keeps its word.');
    location.hash = '#chamber-13';
  });
  await page.waitForFunction(() => {
    const state = window.TemplePilgrimJourney.state();
    return state.current === 13 && state.visited.includes(1) && state.visited.includes(13) && state.favorites.includes(13) && state.reflections['13']?.includes('depth keeps its word');
  });

  await page.evaluate(() => window.TemplePilgrimJourney.open());
  await page.waitForSelector('#tm525-journey:not([hidden])');
  const journey = await page.evaluate(() => ({
    nodeCount: document.querySelectorAll('#tm525-journey .tm525-node').length,
    currentNodes: document.querySelectorAll('#tm525-journey .tm525-node.is-current').length,
    visitedNodes: document.querySelectorAll('#tm525-journey .tm525-node.is-visited').length,
    favoriteNodes: document.querySelectorAll('#tm525-journey .tm525-node.is-favorite').length,
    text: document.querySelector('#tm525-journey .tm525-panel-body')?.innerText || '',
    state: window.TemplePilgrimJourney.state()
  }));

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Chant' }).click();
  await page.waitForSelector('#tm524-chant:not([hidden])');
  await page.waitForFunction(() => document.querySelector('#tm524-chant .tm525-media-vault'));
  const mediaBefore = await page.evaluate(() => {
    const audio = document.querySelector('#tm524-chant audio');
    const input = document.querySelector('#tm524-chant input[type="file"]');
    return {
      installed: window.TempleMediaVault.installed(),
      autoplay: audio?.autoplay,
      autoplayAttribute: audio?.hasAttribute('autoplay'),
      paused: audio?.paused,
      src: audio?.getAttribute('src'),
      accept: input?.getAttribute('accept'),
      canonicalBytes: window.TempleMediaVault.canonical.bytes,
      canonicalSha: window.TempleMediaVault.canonical.sha256
    };
  });

  // Exercise the legacy generic local-audio fallback with a small WAV: it must play locally but never be persisted as canonical.
  const shortWav = canonicalSizedSilentWav().subarray(0, 16044);
  shortWav.writeUInt32LE(shortWav.length - 8, 4);
  shortWav.writeUInt32LE(shortWav.length - 44, 40);
  await page.locator('#tm524-chant input[type="file"]').setInputFiles({ name: 'generic-smoke.wav', mimeType: 'audio/wav', buffer: shortWav });
  await page.waitForFunction(() => document.querySelector('#tm524-chant audio')?.src?.startsWith('blob:'));
  const genericFallback = await page.evaluate(() => ({
    installed: window.TempleMediaVault.installed(),
    blob: document.querySelector('#tm524-chant audio')?.src?.startsWith('blob:'),
    paused: document.querySelector('#tm524-chant audio')?.paused
  }));

  // For persistence mechanics only, mock digest output while supplying a valid WAV with the canonical byte count.
  // Production code still performs real SHA-256; static validation protects the canonical hash and digest call.
  await page.evaluate(() => {
    const canonical = '3e40ba7d0b60c3a04f7edf3022fc98f9daf2fcc3ca9e7900c87bb2b62f02fbe6';
    const bytes = new Uint8Array(canonical.match(/../g).map((hex) => parseInt(hex, 16)));
    Object.defineProperty(crypto.subtle, 'digest', { configurable: true, value: async () => bytes.buffer.slice(0) });
  });
  await page.locator('#tm524-chant input[type="file"]').setInputFiles({
    name: 'Ma’at — Chant of the Forty-Two Declarations.mp3',
    mimeType: 'audio/wav',
    buffer: canonicalSizedSilentWav()
  });
  await page.waitForFunction(() => window.TempleMediaVault.installed() === true, { timeout: 30000 });
  const installedMedia = await page.evaluate(() => ({
    installed: window.TempleMediaVault.installed(),
    srcIsBlob: document.querySelector('#tm524-chant audio')?.src?.startsWith('blob:'),
    paused: document.querySelector('#tm524-chant audio')?.paused,
    cardText: document.querySelector('#tm524-chant .tm525-media-vault')?.innerText || ''
  }));

  // Keep IndexedDB and localStorage across reload; sessionStorage prevents the first-load reset from running twice.
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.TemplePilgrimJourney?.version === '5.2.5' && window.TempleMediaVault?.installed() === true, { timeout: 30000 });
  const restored = await page.evaluate(() => ({
    journey: window.TemplePilgrimJourney.state(),
    mediaInstalled: window.TempleMediaVault.installed(),
    audioSrcIsBlob: document.querySelector('#tm524-chant audio')?.src?.startsWith('blob:'),
    audioPaused: document.querySelector('#tm524-chant audio')?.paused,
    appReady: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert')
  }));

  const assertions = {
    thresholdHeld: beforeEntry.appReady === false && beforeEntry.rootInert === true && beforeEntry.rootHidden === true && beforeEntry.dockDisplay === 'none',
    journeyEntry: beforeEntry.journeyEntry === 'Begin Pilgrim Journey' && beforeEntry.journeyEntryHref === '#chamber-01' && beforeEntry.journeyLayerHidden === true,
    dossierIdentity: /Chamber 13/i.test(dossier.text) && dossier.text.includes('Focazalel') && dossier.text.includes('Iezalel ↔ Focalor'),
    dossierOffice: dossier.text.includes('Keeper of Deep Covenants') && dossier.text.includes('DEPTH KEEPS ITS WORD') && dossier.text.includes('Boaz'),
    dossierProvenance: dossier.text.includes('Record provenance & layer boundaries'),
    dossierVisuals: dossier.imageCount === 3 && dossier.imagesLoaded === true,
    journeyNodes: journey.nodeCount === 72 && journey.currentNodes === 1 && journey.visitedNodes >= 2 && journey.favoriteNodes >= 1,
    journeyState: journey.state.current === 13 && journey.state.visited.includes(1) && journey.state.visited.includes(13) && journey.state.favorites.includes(13) && journey.state.reflections['13'] === 'Smoke reflection: depth keeps its word.',
    mediaPolicy: mediaBefore.installed === false && mediaBefore.autoplay === false && mediaBefore.autoplayAttribute === false && mediaBefore.paused === true && mediaBefore.accept.includes('audio/'),
    canonicalFingerprint: mediaBefore.canonicalBytes === 16210172 && mediaBefore.canonicalSha === '3e40ba7d0b60c3a04f7edf3022fc98f9daf2fcc3ca9e7900c87bb2b62f02fbe6',
    genericFallback: genericFallback.installed === false && genericFallback.blob === true && genericFallback.paused === true,
    canonicalInstallMechanics: installedMedia.installed === true && installedMedia.srcIsBlob === true && installedMedia.paused === true && installedMedia.cardText.includes('installed locally'),
    journeyRestored: restored.journey.current === 13 && restored.journey.favorites.includes(13) && restored.journey.reflections['13'] === 'Smoke reflection: depth keeps its word.',
    mediaRestored: restored.mediaInstalled === true && restored.audioSrcIsBlob === true && restored.audioPaused === true,
    manualGateRestored: restored.appReady === false && restored.rootInert === true,
    noPageErrors: pageErrors.length === 0
  };
  const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
  const ok = failedAssertions.length === 0;

  console.log(JSON.stringify({ ok, failedAssertions, assertions, beforeEntry, dossier, journey, mediaBefore, genericFallback, installedMedia, restored, pageErrors }, null, 2));
  await browser.close();
  if (!ok) process.exitCode = 1;
} finally {
  server.kill();
  server.unref();
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
