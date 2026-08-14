import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = path.join(root, 'work');
fs.mkdirSync(work, { recursive: true });
const port = 41788;
const python = process.env.TEMPLE_PYTHON || 'python3';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}/`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function supportedState(value) {
  return {
    schema: value.schema,
    version: value.version,
    started: value.started,
    startedAt: value.startedAt,
    updatedAt: value.updatedAt,
    current: value.current,
    visited: value.visited,
    favorites: value.favorites,
    reflections: value.reflections
  };
}

async function warmServiceWorker(context) {
  const page = await context.newPage();
  await page.goto(`${base}?journey_import_warmup=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  if (await page.evaluate(() => 'serviceWorker' in navigator)) await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.close();
}

async function waitForJourneyRuntime(page) {
  await page.waitForFunction(() => window.TemplePilgrimJourney?.state && window.TempleJourneyPortability?.version === '1.0.0', { timeout: 30000 });
}

async function enterTemple(page) {
  await page.waitForSelector('[data-temple-entry="journey"]', { timeout: 30000 });
  await page.locator('[data-temple-entry="journey"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), { timeout: 30000 });
  await waitForJourneyRuntime(page);
}

async function openJourney(page) {
  await page.evaluate(() => window.TemplePilgrimJourney.open());
  await page.waitForSelector('#tm525-journey:not([hidden])', { timeout: 15000 });
  await page.waitForSelector('[data-tm528j-import]', { timeout: 15000 });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await warmServiceWorker(context);
  const page = await context.newPage();
  const pageErrors = [];
  const writeRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) writeRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.goto(`${base}?journey_import_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(() => {
    localStorage.removeItem('temple_v525_pilgrim_journey');
    localStorage.removeItem('temple_last_chamber');
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await enterTemple(page);

  await page.evaluate(() => {
    const api = window.TemplePilgrimJourney;
    api.visit(1);
    api.visit(2);
    api.favorite(2);
    api.reflect(2, 'First private reflection — preserved exactly.');
    api.visit(7);
    api.favorite(7);
    api.reflect(7, 'Seventh chamber reflection with personal study notes.');
    api.start(7);
  });
  await page.waitForFunction(() => window.TemplePilgrimJourney.state().current === 7 && location.hash === '#chamber-07');
  const original = supportedState(await page.evaluate(() => window.TemplePilgrimJourney.state()));

  await openJourney(page);
  const exportPath = path.join(work, 'journey-portability-roundtrip.json');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.getByRole('button', { name: 'Download Journey JSON' }).click()
  ]);
  await download.saveAs(exportPath);
  const exportedPayload = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  if (JSON.stringify(supportedState(exportedPayload)) !== JSON.stringify(original)) throw new Error('Journey export did not preserve supported state fields before import testing');

  // Invalid/incompatible files must not mutate the current Journey.
  const beforeInvalid = supportedState(await page.evaluate(() => window.TemplePilgrimJourney.state()));
  const invalidPayload = { ...exportedPayload, version: '99.0.0' };
  await page.locator('#tm528j-file').setInputFiles({
    name: 'incompatible-journey.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(invalidPayload))
  });
  await page.waitForSelector('#tm528j-import:not([hidden])', { timeout: 10000 });
  const rejectedText = await page.locator('#tm528j-import').innerText();
  if (!/Import rejected/.test(rejectedText) || !/No local Journey state was changed/.test(rejectedText) || !/Incompatible Journey version/.test(rejectedText)) throw new Error('Incompatible Journey import was not visibly rejected');
  const afterInvalid = supportedState(await page.evaluate(() => window.TemplePilgrimJourney.state()));
  if (JSON.stringify(afterInvalid) !== JSON.stringify(beforeInvalid)) throw new Error('Rejected Journey import changed local state');
  await page.locator('#tm528j-import .tm528j-close').click();

  // Simulate transfer to a fresh device/profile: clear persisted Journey data and
  // remove the stale chamber hash without firing the old Journey hash handler.
  await page.evaluate(() => {
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    localStorage.removeItem('temple_v525_pilgrim_journey');
    localStorage.removeItem('temple_last_chamber');
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForJourneyRuntime(page);
  const clearedPersisted = supportedState(await page.evaluate(() => window.TemplePilgrimJourney.state()));
  if (clearedPersisted.visited.length || clearedPersisted.favorites.length || Object.keys(clearedPersisted.reflections).length || clearedPersisted.started) {
    throw new Error(`Fresh-device persisted state was not empty before restore: ${JSON.stringify(clearedPersisted)}`);
  }

  // The real visitor path still requires the manual entrance before opening Journey.
  await enterTemple(page);
  await openJourney(page);
  const beforePreview = supportedState(await page.evaluate(() => window.TemplePilgrimJourney.state()));
  await page.locator('#tm528j-file').setInputFiles(exportPath);
  await page.waitForSelector('#tm528j-import:not([hidden])', { timeout: 10000 });
  await page.locator('#tm528j-strategy').selectOption('replace');
  await page.waitForFunction(() => /Replace will overwrite/.test(document.querySelector('#tm528j-import')?.textContent || ''));
  const previewText = await page.locator('#tm528j-import').innerText();
  for (const marker of ['Current', 'Imported', 'Result', 'No local state changes have been applied yet.', 'Replace Journey & Reload']) {
    if (!previewText.includes(marker)) throw new Error(`Replace preview marker missing: ${marker}`);
  }
  const afterPreview = supportedState(await page.evaluate(() => window.TemplePilgrimJourney.state()));
  if (JSON.stringify(afterPreview) !== JSON.stringify(beforePreview)) throw new Error('Preview changed local Journey state before Apply');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 120000 }),
    page.getByRole('button', { name: 'Replace Journey & Reload' }).click()
  ]);
  await waitForJourneyRuntime(page);
  const restoredBeforeEntry = supportedState(await page.evaluate(() => window.TemplePilgrimJourney.state()));
  if (JSON.stringify(restoredBeforeEntry) !== JSON.stringify(original)) {
    throw new Error(`Journey replace round-trip lost supported fields. Expected ${JSON.stringify(original)} got ${JSON.stringify(restoredBeforeEntry)}`);
  }
  const postReloadThreshold = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    continueText: document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim(),
    continueHref: document.querySelector('[data-temple-entry="continue"]')?.getAttribute('href')
  }));
  if (postReloadThreshold.ready || postReloadThreshold.continueText !== 'Continue at Chamber 07' || postReloadThreshold.continueHref !== '#chamber-07') {
    throw new Error(`Restored Journey did not return to the manual threshold/current chamber correctly: ${JSON.stringify(postReloadThreshold)}`);
  }

  // Prove merge is non-destructive for conflicting reflection text.
  await page.evaluate(() => window.TemplePilgrimJourney.reflect(7, 'Newer local reflection must win merge conflict.'));
  const mergePlan = await page.evaluate((payload) => window.TempleJourneyPortability.preview(payload, 'merge'), exportedPayload);
  if (!mergePlan.reflectionConflicts.includes(7)) throw new Error('Merge preview did not report Chamber 07 reflection conflict');
  if (mergePlan.result.reflections['7'] !== 'Newer local reflection must win merge conflict.') throw new Error('Safe merge overwrote the existing local reflection');
  if (!mergePlan.result.visited.includes(1) || !mergePlan.result.visited.includes(2) || !mergePlan.result.visited.includes(7)) throw new Error('Safe merge lost visited chambers');

  const result = {
    ok: pageErrors.length === 0 && writeRequests.length === 0,
    restoredCurrent: restoredBeforeEntry.current,
    visited: restoredBeforeEntry.visited,
    favorites: restoredBeforeEntry.favorites,
    reflectionCount: Object.keys(restoredBeforeEntry.reflections).length,
    freshDeviceWasEmpty: !clearedPersisted.started && clearedPersisted.visited.length === 0 && clearedPersisted.favorites.length === 0 && Object.keys(clearedPersisted.reflections).length === 0,
    invalidRejectedWithoutMutation: JSON.stringify(afterInvalid) === JSON.stringify(beforeInvalid),
    replaceRoundTripExact: JSON.stringify(restoredBeforeEntry) === JSON.stringify(original),
    mergeConflictPreservedLocal: mergePlan.result.reflections['7'] === 'Newer local reflection must win merge conflict.',
    postReloadThreshold,
    writeRequests,
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
