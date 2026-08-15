import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41790;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.resolve(root, 'work', 'pistis-sophia-pilgrimage-smoke');
fs.mkdirSync(outDir, { recursive: true });

async function geometry(page, width) {
  await page.setViewportSize({ width, height: 800 });
  await wait(150);
  return page.evaluate(() => {
    const layer = document.querySelector('[data-temple-pilgrimage-route="pistis-sophia"]');
    const panel = layer?.querySelector('.tm53-route-panel');
    const buttons = [...(layer?.querySelectorAll('.tm53-route-gate-button') || [])];
    const fields = [...(layer?.querySelectorAll('[data-reality-field]') || [])];
    const rects = buttons.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    const panelRect = panel?.getBoundingClientRect();
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      visible: Boolean(layer && !layer.hidden && getComputedStyle(layer).display !== 'none'),
      stationCount: buttons.length,
      fieldCount: fields.length,
      panelInsideViewport: Boolean(panelRect && panelRect.left >= -1 && panelRect.right <= innerWidth + 1),
      controlsInsideViewport: rects.every((rect) => rect.left >= -1 && rect.right <= innerWidth + 1 && rect.width > 0 && rect.height >= 44),
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

    await page.goto(`http://127.0.0.1:${port}/?pistis_sophia_pilgrimage_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
    await page.waitForFunction(() => window.TemplePilgrimageRoutes?.version === '1.1.0' && window.TemplePilgrimageRoutes?.routes?.().length >= 2, null, { timeout: 30000 });

    const beforeEntry = await page.evaluate(() => ({
      ready: document.body.classList.contains('temple-app-ready'),
      cardPresent: Boolean(document.querySelector('[data-pistis-sophia-route-card]')),
      openResult: window.TemplePilgrimageRoutes?.open?.('route.pistis-sophia-descent-return')
    }));

    await page.waitForSelector('[data-temple-entry="explore"]', { timeout: 30000 });
    await page.evaluate(() => document.querySelector('[data-temple-entry="explore"]')?.click());
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && !document.body.classList.contains('temple-artifact-open'), null, { timeout: 30000 });
    await page.waitForSelector('#tm525-journey-button', { timeout: 30000 });
    await page.click('#tm525-journey-button');
    await page.waitForSelector('[data-pistis-sophia-route-card] [data-pistis-sophia-route-open]', { state: 'visible', timeout: 30000 });

    const journey = await page.evaluate(() => ({
      chamberNodes: document.querySelectorAll('#tm525-journey .tm525-node-grid .tm525-node').length,
      routeCards: [...document.querySelectorAll('[data-pilgrimage-route-gallery] [data-temple-pilgrimage-card]')].map((node) => node.querySelector('h3')?.textContent || ''),
      sophiaText: document.querySelector('[data-pistis-sophia-route-card]')?.textContent || '',
      enochText: document.querySelector('[data-enoch-route-card]')?.textContent || ''
    }));

    await page.click('[data-pistis-sophia-route-open]');
    await page.waitForFunction(() => {
      const layer = document.querySelector('[data-temple-pilgrimage-route="pistis-sophia"]');
      return Boolean(layer && !layer.hidden);
    }, null, { timeout: 30000 });

    const opened = await page.evaluate(() => ({
      title: document.querySelector('.tm53-route-title')?.textContent || '',
      firstStation: document.querySelector('.tm53-route-gate h3')?.textContent || '',
      unitButtons: document.querySelectorAll('.tm53-route-gate-button').length,
      privateFields: [...document.querySelectorAll('[data-reality-field]')].map((node) => node.dataset.realityField),
      recordHeading: document.querySelector('.tm53-route-record h3')?.textContent || '',
      authorities: [...document.querySelectorAll('.tm53-route-authority')].map((node) => node.textContent),
      sourceBoundary: document.querySelector('.tm53-route-source summary')?.textContent || '',
      parentJourneyHidden: document.getElementById('tm525-journey')?.hidden === true
    }));

    const values = {
      'downward-draw': 'Smoke draw: urgency attached itself to a compelling promise.',
      'mistaken-light': 'Smoke mistaken light: intensity was treated as certainty.',
      'what-was-lost': 'Smoke loss: time and openness to alternative explanations narrowed.',
      recognition: 'Smoke recognition: observation and interpretation can be separated.',
      'returning-wisdom': 'Smoke return: test insight by reality, freedom, compassion, repair, and conduct.'
    };
    for (const [key, value] of Object.entries(values)) await page.fill(`[data-reality-field="${key}"]`, value);
    await page.getByRole('button', { name: 'Save Private Record' }).click();
    await page.getByRole('button', { name: /Complete Gate & Continue/ }).click();
    await page.waitForFunction(() => document.querySelector('.tm53-route-gate h3')?.textContent?.includes('Desire'));

    const persisted = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('temple_pilgrimage_pistis_sophia_v1') || 'null');
      return {
        raw,
        api: window.TemplePilgrimageRoutes?.state?.('route.pistis-sophia-descent-return'),
        enochState: localStorage.getItem('temple_pilgrimage_enoch_v1'),
        completedNodes: document.querySelectorAll('.tm53-route-gate-button.is-complete').length,
        currentTitle: document.querySelector('.tm53-route-gate h3')?.textContent || '',
        localKeys: Object.keys(localStorage)
      };
    });

    const at360 = await geometry(page, 360);
    await page.screenshot({ path: path.join(outDir, 'pistis-sophia-route-360.png'), fullPage: false });
    const at412 = await geometry(page, 412);
    await page.screenshot({ path: path.join(outDir, 'pistis-sophia-route-412.png'), fullPage: false });

    await page.getByRole('button', { name: 'Close Pistis Sophia pilgrimage' }).last().click();
    await page.waitForFunction(() => document.querySelector('[data-temple-pilgrimage-route="pistis-sophia"]')?.hidden === true);
    const closed = await page.evaluate(() => ({
      journeyVisible: document.getElementById('tm525-journey')?.hidden === false,
      chamberNodes: document.querySelectorAll('#tm525-journey .tm525-node-grid .tm525-node').length,
      sophiaCardVisible: Boolean(document.querySelector('[data-pistis-sophia-route-card]')),
      stateStillPresent: Boolean(localStorage.getItem('temple_pilgrimage_pistis_sophia_v1'))
    }));

    await page.click('[data-pistis-sophia-route-open]');
    await page.waitForFunction(() => document.querySelector('[data-temple-pilgrimage-route="pistis-sophia"]')?.hidden === false);
    const reopened = await page.evaluate(() => ({
      current: window.TemplePilgrimageRoutes?.state?.('route.pistis-sophia-descent-return')?.currentGate,
      completed: window.TemplePilgrimageRoutes?.state?.('route.pistis-sophia-descent-return')?.completedGates,
      currentTitle: document.querySelector('.tm53-route-gate h3')?.textContent || '',
      fieldCount: document.querySelectorAll('[data-reality-field]').length
    }));

    const leakKeys = persisted.localKeys.filter((key) => /relationship|knowledge.kernel|library.*catalog/i.test(key));
    const expectedFields = ['downward-draw', 'mistaken-light', 'what-was-lost', 'recognition', 'returning-wisdom'];
    const assertions = {
      manualThresholdPreserved: beforeEntry.ready === false && beforeEntry.cardPresent === false && beforeEntry.openResult === false,
      existingJourneyPreserved: journey.chamberNodes === 72,
      bothRoutesVisible: journey.routeCards.some((title) => /Enoch/.test(title)) && journey.routeCards.some((title) => /Pistis Sophia/.test(title)),
      sophiaLauncher: /Pistis Sophia — The Descent and Return/.test(journey.sophiaText) && /DEVICE-LOCAL RECORD/.test(journey.sophiaText),
      enochLauncherStillPresent: /Enoch — The Angelic Mirror/.test(journey.enochText),
      correctRouteOpened: /Pistis Sophia — The Descent and Return/.test(opened.title) && opened.firstStation === 'The Glimpse',
      thirteenStations: opened.unitButtons === 13,
      fivePartRecord: JSON.stringify(opened.privateFields) === JSON.stringify(expectedFields) && opened.recordHeading.includes('What drew me downward') && opened.recordHeading.includes('What wisdom returns with me'),
      authorityBoundaryVisible: opened.authorities.includes('HISTORICAL') && opened.authorities.includes('MODERN') && opened.authorities.includes('PERSONAL') && /Source & authority boundary/.test(opened.sourceBoundary),
      journeySuspendedBehindRoute: opened.parentJourneyHidden,
      stateSchema: persisted.raw?.schema === 'temple-of-maat/pilgrimage-state-v1' && persisted.raw?.routeId === 'route.pistis-sophia-descent-return',
      firstStationCompleted: persisted.raw?.currentGate === 2 && persisted.raw?.completedGates?.includes(1) && persisted.completedNodes === 1 && persisted.currentTitle === 'The Desire',
      privateRecordPersisted: Object.entries(values).every(([key, value]) => persisted.raw?.records?.['1']?.[key] === value),
      apiMatchesState: persisted.api?.currentGate === 2 && persisted.api?.completedGates?.includes(1),
      enochStateUntouched: persisted.enochState === null,
      noPublicLeakKey: leakKeys.length === 0,
      mobile360: at360.visible && at360.stationCount === 13 && at360.fieldCount === 5 && at360.panelInsideViewport && at360.controlsInsideViewport && at360.noHorizontalOverflow,
      mobile412: at412.visible && at412.stationCount === 13 && at412.fieldCount === 5 && at412.panelInsideViewport && at412.controlsInsideViewport && at412.noHorizontalOverflow,
      closeRestoresJourney: closed.journeyVisible && closed.chamberNodes === 72 && closed.sophiaCardVisible && closed.stateStillPresent,
      reopenRestoresProgress: reopened.current === 2 && reopened.completed?.includes(1) && reopened.currentTitle === 'The Desire' && reopened.fieldCount === 5,
      noUnexpectedWrites: badRequests.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    const ok = failedAssertions.length === 0;
    console.log(JSON.stringify({ ok, failedAssertions, assertions, beforeEntry, journey, opened, persisted, at360, at412, closed, reopened, leakKeys, badRequests, pageErrors }, null, 2));
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
