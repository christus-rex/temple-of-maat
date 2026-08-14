import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41789;
const python = process.env.TEMPLE_PYTHON || 'python3';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}/`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function warmServiceWorker(context) {
  const page = await context.newPage();
  await page.goto(`${base}?offline_warmup=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  if (await page.evaluate(() => 'serviceWorker' in navigator)) {
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  }
  await page.close();
}

async function waitForRuntime(page) {
  await page.waitForFunction(() => window.TempleOfflineManager?.version === '1.0.0' && window.TemplePilgrimJourney?.state, { timeout: 30000 });
  await page.waitForSelector('[data-temple-offline-open]', { state: 'attached', timeout: 30000 });
}

async function enterTemple(page) {
  await page.waitForSelector('[data-temple-entry="guided"]', { timeout: 30000 });
  await page.locator('[data-temple-entry="guided"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), { timeout: 30000 });
}

async function fetchRepresentativeAssets(page) {
  return await page.evaluate(async () => {
    const [release, parental] = await Promise.all([
      fetch('./scripts/v5.1-asset-manifest.json').then((response) => response.json()),
      fetch('./scripts/parental-powers-assets.json').then((response) => response.json())
    ]);
    const hero = release.assets.find((asset) => asset.category === 'hero' && asset.display?.path)?.display?.path;
    const seal = release.assets.find((asset) => asset.category === 'seal' && asset.display?.path)?.display?.path;
    const parentalPath = parental.records.find((record) => record.display?.path)?.display?.path;
    if (!hero || !seal || !parentalPath) throw new Error('Representative offline visual paths are missing from manifests');
    return [`./${hero}`, `./${seal}`, `./${parentalPath}`];
  });
}

async function fetchOffline(page, assets) {
  return await page.evaluate(async (paths) => {
    const results = [];
    for (const asset of paths) {
      try {
        const response = await fetch(asset, { cache: 'no-store' });
        const blob = await response.blob();
        results.push({ asset, ok: response.ok, status: response.status, bytes: blob.size });
      } catch (error) {
        results.push({ asset, ok: false, status: 0, bytes: 0, error: error.message });
      }
    }
    return results;
  }, assets);
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await warmServiceWorker(context);

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${base}?offline_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForRuntime(page);

  const beforeEntry = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    dockDisplay: getComputedStyle(document.getElementById('tm524-dock')).display,
    openResult: window.TempleOfflineManager.open(),
    overlayHidden: document.getElementById('tm528-offline')?.hidden
  }));
  if (beforeEntry.ready || !beforeEntry.rootInert || beforeEntry.dockDisplay !== 'none' || beforeEntry.openResult !== false || !beforeEntry.overlayHidden) {
    throw new Error(`Offline controls violated the manual threshold: ${JSON.stringify(beforeEntry)}`);
  }

  await enterTemple(page);
  await page.evaluate(() => {
    const journey = window.TemplePilgrimJourney;
    journey.start(1);
    journey.visit(1);
    journey.favorite(1);
    journey.reflect(1, 'Offline privacy sentinel — must survive visual cache cleanup.');
  });
  await page.waitForFunction(() => window.TemplePilgrimJourney.state().reflections['1']?.includes('Offline privacy sentinel'));
  const privateBefore = await page.evaluate(() => ({
    favorite: window.TemplePilgrimJourney.state().favorites.includes(1),
    reflection: window.TemplePilgrimJourney.state().reflections['1']
  }));
  const representativeAssets = await fetchRepresentativeAssets(page);

  await page.getByRole('button', { name: 'Open offline download and storage controls' }).click();
  await page.waitForSelector('#tm528-offline:not([hidden])');
  const panelText = await page.locator('#tm528-offline').innerText();
  for (const marker of [
    'Download Temple for Offline Use',
    'substantial device storage',
    'It does not erase your Pilgrim Journey, favorites, reflections, Library bookmarks, Library notes',
    'Ritual audio is excluded from the service-worker cache'
  ]) {
    if (!panelText.includes(marker)) throw new Error(`Offline ownership copy missing: ${marker}`);
  }

  const statusBefore = await page.evaluate(() => window.TempleOfflineManager.status());
  if (statusBefore.optionalTotal !== 216) throw new Error(`Expected 216 optional chamber visuals, received ${statusBefore.optionalTotal}`);

  // Cancellation is cooperative between small batches. Whether the local archive is
  // fast enough to finish first or honours cancellation, the normal shell must remain intact.
  const cancelAttempt = await page.evaluate(async () => {
    const id = await window.TempleOfflineManager.downloadFull();
    const requested = await window.TempleOfflineManager.cancelFull();
    return { id, requested };
  });
  await page.waitForFunction(() => window.TempleOfflineManager.currentJob() === null, { timeout: 180000 });
  const afterCancelShell = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    progress: document.querySelector('.tm528o-progress-label')?.textContent || ''
  }));
  if (!afterCancelShell.ready || afterCancelShell.rootInert) throw new Error('Cancellation/early completion corrupted the normal Temple shell');
  if (!/(cancelled safely|archive complete|finished with)/i.test(afterCancelShell.progress)) throw new Error(`Unexpected cancellation outcome: ${afterCancelShell.progress}`);

  // A second request must reach a complete, error-free full visual archive.
  await page.evaluate(() => window.TempleOfflineManager.downloadFull());
  await page.waitForFunction(() => window.TempleOfflineManager.currentJob() === null, { timeout: 240000 });
  const fullProgress = await page.locator('.tm528o-progress-label').innerText();
  if (!/Offline visual archive complete:/i.test(fullProgress)) throw new Error(`Full visual cache did not complete cleanly: ${fullProgress}`);
  const statusFull = await page.evaluate(() => window.TempleOfflineManager.status());
  if (statusFull.optionalCached !== statusFull.optionalTotal || statusFull.optionalTotal !== 216) {
    throw new Error(`Full optional visual cache is incomplete: ${JSON.stringify(statusFull)}`);
  }

  const ritualBinaryCached = await page.evaluate(() => caches.match('./assets/audio/maat-forty-two-declarations.mp3').then(Boolean));
  if (ritualBinaryCached) throw new Error('Binary ritual audio entered Cache Storage');

  await context.setOffline(true);
  const offlineAssets = await fetchOffline(page, representativeAssets);
  if (!offlineAssets.every((item) => item.ok && item.bytes > 1000)) throw new Error(`Representative visuals failed offline: ${JSON.stringify(offlineAssets)}`);

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForRuntime(page);
  const offlineReload = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    reflection: window.TemplePilgrimJourney.state().reflections['1'],
    favorite: window.TemplePilgrimJourney.state().favorites.includes(1),
    controlsVersion: window.TempleOfflineManager.version
  }));
  if (offlineReload.ready || !offlineReload.rootInert || offlineReload.reflection !== privateBefore.reflection || !offlineReload.favorite) {
    throw new Error(`Offline reload/manual threshold/private state check failed: ${JSON.stringify(offlineReload)}`);
  }

  await context.setOffline(false);
  await enterTemple(page);
  await page.evaluate(() => window.TempleOfflineManager.open());
  await page.waitForSelector('#tm528-offline:not([hidden])');
  const clearResult = await page.evaluate(() => window.TempleOfflineManager.clearVisuals());
  if (!clearResult?.ok || clearResult.cleared < 200) throw new Error(`Optional visual cleanup did not remove the cached archive: ${JSON.stringify(clearResult)}`);

  const afterClear = await page.evaluate(async (assets) => {
    const state = window.TemplePilgrimJourney.state();
    const visualMatches = await Promise.all(assets.map((asset) => caches.match(asset).then(Boolean)));
    return {
      favorite: state.favorites.includes(1),
      reflection: state.reflections['1'],
      shellCached: Boolean(await caches.match('./index.html')),
      controlsCached: Boolean(await caches.match('./scripts/v5.2.8-offline-controls.js')),
      visualMatches
    };
  }, representativeAssets);
  if (!afterClear.favorite || afterClear.reflection !== privateBefore.reflection) throw new Error('Visual cache cleanup erased private Journey state');
  if (!afterClear.shellCached || !afterClear.controlsCached) throw new Error('Visual cache cleanup damaged the normal offline PWA shell');
  if (afterClear.visualMatches.some(Boolean)) throw new Error(`Optional visual cache cleanup left representative visuals cached: ${JSON.stringify(afterClear.visualMatches)}`);

  // The shell must still reload offline after optional visuals are removed.
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForRuntime(page);
  const shellAfterClear = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    reflection: window.TemplePilgrimJourney.state().reflections['1']
  }));
  if (shellAfterClear.ready || !shellAfterClear.rootInert || shellAfterClear.reflection !== privateBefore.reflection) {
    throw new Error(`Offline shell/private state failed after visual cleanup: ${JSON.stringify(shellAfterClear)}`);
  }

  const result = {
    ok: pageErrors.length === 0,
    optionalTotal: statusFull.optionalTotal,
    optionalCachedAtFull: statusFull.optionalCached,
    representativeAssets,
    offlineAssets,
    cancelAttempt,
    afterCancelShell,
    offlineReload,
    clearResult,
    afterClear,
    shellAfterClear,
    ritualBinaryCached,
    pageErrors
  };
  console.log(JSON.stringify(result, null, 2));
  await context.close();
  await browser.close();
  if (!result.ok) process.exitCode = 1;
} finally {
  server.kill();
  server.unref();
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
