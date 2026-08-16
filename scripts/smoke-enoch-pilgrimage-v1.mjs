import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41789;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.resolve(root, 'work', 'enoch-pilgrimage-smoke');
fs.mkdirSync(outDir, { recursive: true });

async function waitForTemple(page) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
      await page.waitForFunction(() => window.TemplePilgrimageRoutes?.version === '1.1.0', null, { timeout: 30000 });
      await wait(900);
      await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5' && window.TemplePilgrimageRoutes?.version === '1.1.0', null, { timeout: 30000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await wait(600);
    }
  }
  throw lastError;
}

async function geometry(page, width) {
  await page.setViewportSize({ width, height: 800 });
  await wait(120);
  return await page.evaluate(() => {
    const layer = document.querySelector('[data-temple-pilgrimage-route="enoch"]');
    const panel = layer?.querySelector('.tm53-route-panel');
    const gateButtons = [...(layer?.querySelectorAll('.tm53-route-gate-button') || [])];
    const fields = [...(layer?.querySelectorAll('[data-reality-field]') || [])];
    const panelRect = panel?.getBoundingClientRect();
    const buttonRects = gateButtons.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    return {
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      layerVisible: Boolean(layer && !layer.hidden && getComputedStyle(layer).display !== 'none'),
      panel: panelRect ? { left: panelRect.left, right: panelRect.right, width: panelRect.width } : null,
      gateCount: gateButtons.length,
      fieldCount: fields.length,
      buttonsInsideViewport: buttonRects.every((rect) => rect.left >= -1 && rect.right <= innerWidth + 1),
      noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth + 1
    };
  });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await context.newPage();
    const pageErrors = [];
    const badRequests = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) badRequests.push({ method: request.method(), url: request.url() });
    });

    await page.goto(`http://127.0.0.1:${port}/?enoch_pilgrimage_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForTemple(page);

    const beforeEntry = await page.evaluate(() => ({
      ready: document.body.classList.contains('temple-app-ready'),
      routeHidden: document.querySelector('[data-temple-pilgrimage-route="enoch"]')?.hidden === true,
      routeCardPresent: Boolean(document.querySelector('[data-enoch-route-card]')),
      routeOpenResult: window.TemplePilgrimageRoutes?.open?.('route.enoch-angelic-mirror')
    }));

    await page.waitForSelector('[data-temple-entry="explore"]', { timeout: 30000 });
    await page.evaluate(() => document.querySelector('[data-temple-entry="explore"]')?.click());
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && !document.body.classList.contains('temple-artifact-open'), null, { timeout: 30000 });
    await page.waitForSelector('#tm525-journey-button', { timeout: 30000 });
    await page.click('#tm525-journey-button');
    await page.waitForSelector('[data-enoch-route-card] [data-enoch-route-open]', { state: 'visible', timeout: 30000 });

    const journeyBefore = await page.evaluate(() => ({
      nodeCount: document.querySelectorAll('#tm525-journey .tm525-node-grid .tm525-node').length,
      routeCardCount: document.querySelectorAll('[data-pilgrimage-route-gallery] [data-temple-pilgrimage-card]').length,
      cardTitle: document.querySelector('[data-enoch-route-card] h3')?.textContent || '',
      cardText: document.querySelector('[data-enoch-route-card]')?.textContent || ''
    }));

    await page.click('[data-enoch-route-open]');
    await page.waitForFunction(() => {
      const layer = document.querySelector('[data-temple-pilgrimage-route="enoch"]');
      return Boolean(layer && !layer.hidden);
    }, null, { timeout: 30000 });

    const initialRoute = await page.evaluate(() => ({
      gateButtons: document.querySelectorAll('.tm53-route-gate-button').length,
      currentGate: document.querySelector('.tm53-route-gate h3')?.textContent || '',
      authorities: [...document.querySelectorAll('.tm53-route-gate .tm53-route-authority')].map((node) => node.textContent),
      realityHeading: document.querySelector('.tm53-route-record h3')?.textContent || '',
      sourceBoundary: document.querySelector('.tm53-route-source summary')?.textContent || '',
      journeyHiddenBehindRoute: document.getElementById('tm525-journey')?.hidden === true
    }));

    const values = {
      observation: 'Smoke observation: a symbol was recorded before assigning meaning.',
      interpretation: 'Smoke interpretation: this remains a personal reading with alternatives.',
      verification: 'Smoke verification: compare the record after sleep and against declared sources.',
      conduct: 'Smoke conduct: choose one proportionate truthful action.'
    };
    for (const [key, value] of Object.entries(values)) {
      await page.fill(`[data-reality-field="${key}"]`, value);
    }
    await page.getByRole('button', { name: 'Save Private Record' }).click();
    await page.getByRole('button', { name: /Complete Gate & Continue/ }).click();
    await page.waitForFunction(() => document.querySelector('.tm53-route-gate h3')?.textContent?.includes('Archive'));

    const persisted = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('temple_pilgrimage_enoch_v1') || 'null');
      return {
        raw,
        publicState: window.TemplePilgrimageRoutes?.state?.('route.enoch-angelic-mirror'),
        currentTitle: document.querySelector('.tm53-route-gate h3')?.textContent || '',
        completedNodes: document.querySelectorAll('.tm53-route-gate-button.is-complete').length,
        localKeys: Object.keys(localStorage)
      };
    });

    const at360 = await geometry(page, 360);
    await page.screenshot({ path: path.join(outDir, 'enoch-route-360.png'), fullPage: false });
    const at412 = await geometry(page, 412);
    await page.screenshot({ path: path.join(outDir, 'enoch-route-412.png'), fullPage: false });

    await page.getByRole('button', { name: 'Close Enoch pilgrimage' }).last().click();
    await page.waitForFunction(() => document.querySelector('[data-temple-pilgrimage-route="enoch"]')?.hidden === true);
    const afterClose = await page.evaluate(() => ({
      journeyVisible: document.getElementById('tm525-journey')?.hidden === false,
      nodeCount: document.querySelectorAll('#tm525-journey .tm525-node-grid .tm525-node').length,
      routeStateStillPresent: Boolean(localStorage.getItem('temple_pilgrimage_enoch_v1'))
    }));

    await page.click('[data-enoch-route-open]');
    await page.waitForFunction(() => document.querySelector('[data-temple-pilgrimage-route="enoch"]')?.hidden === false);
    const afterReopen = await page.evaluate(() => ({
      currentGate: window.TemplePilgrimageRoutes?.state?.('route.enoch-angelic-mirror')?.currentGate,
      completed: window.TemplePilgrimageRoutes?.state?.('route.enoch-angelic-mirror')?.completedGates,
      routeTitle: document.querySelector('.tm53-route-title')?.textContent || ''
    }));

    const privateLeakKeys = persisted.localKeys.filter((key) => /relationship|knowledge.kernel|library.*catalog/i.test(key));
    const assertions = {
      manualThresholdPreserved: beforeEntry.ready === false && beforeEntry.routeHidden && !beforeEntry.routeCardPresent && beforeEntry.routeOpenResult === false,
      existingJourneyPreserved: journeyBefore.nodeCount === 72,
      multiRouteGalleryPresent: journeyBefore.routeCardCount >= 2,
      enochLauncherVisible: /Enoch — The Angelic Mirror/.test(journeyBefore.cardTitle) && /DEVICE-LOCAL RECORD/.test(journeyBefore.cardText),
      eightGateRoute: initialRoute.gateButtons === 8,
      firstGatePersonalModern: initialRoute.authorities.includes('MODERN') && initialRoute.authorities.includes('PERSONAL') && !initialRoute.authorities.includes('HISTORICAL'),
      realityRecordSequence: initialRoute.realityHeading.includes('Observation') && initialRoute.realityHeading.includes('Verification') && initialRoute.realityHeading.includes('Conduct'),
      sourceBoundaryVisible: /Source & authority boundary/.test(initialRoute.sourceBoundary),
      parentJourneySuspended: initialRoute.journeyHiddenBehindRoute,
      stateSchema: persisted.raw?.schema === 'temple-of-maat/pilgrimage-state-v1' && persisted.raw?.routeId === 'route.enoch-angelic-mirror',
      gateOneCompleted: persisted.raw?.currentGate === 2 && persisted.raw?.completedGates?.includes(1) && persisted.completedNodes === 1,
      recordPersisted: Object.entries(values).every(([key, value]) => persisted.raw?.records?.['1']?.[key] === value),
      publicApiMatchesLocal: persisted.publicState?.currentGate === 2 && persisted.publicState?.completedGates?.includes(1),
      noPublicStateLeakKey: privateLeakKeys.length === 0,
      mobile360: at360.layerVisible && at360.gateCount === 8 && at360.fieldCount === 4 && at360.buttonsInsideViewport && at360.noHorizontalOverflow,
      mobile412: at412.layerVisible && at412.gateCount === 8 && at412.fieldCount === 4 && at412.buttonsInsideViewport && at412.noHorizontalOverflow,
      closeRestoresJourney: afterClose.journeyVisible && afterClose.nodeCount === 72 && afterClose.routeStateStillPresent,
      reopenRestoresRoute: afterReopen.currentGate === 2 && afterReopen.completed?.includes(1) && /Enoch — The Angelic Mirror/.test(afterReopen.routeTitle),
      noUnexpectedWrites: badRequests.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    const ok = failedAssertions.length === 0;
    console.log(JSON.stringify({ ok, failedAssertions, assertions, beforeEntry, journeyBefore, initialRoute, persisted, at360, at412, afterClose, afterReopen, privateLeakKeys, badRequests, pageErrors }, null, 2));
    await context.close();
    if (!ok) process.exitCode = 1;
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
  server.unref();
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
