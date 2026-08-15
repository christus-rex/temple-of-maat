import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41791;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    await page.goto(`http://127.0.0.1:${port}/?pilgrimage_hardening_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.TemplePilgrimageRoutes?.version === '1.1.0', null, { timeout: 30000 });
    await page.waitForFunction(() => window.TemplePilgrimageHardening?.version === '1.0.0', null, { timeout: 30000 });
    await page.waitForSelector('[data-temple-entry="explore"]', { timeout: 30000 });
    await page.evaluate(() => document.querySelector('[data-temple-entry="explore"]')?.click());
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.click('#tm525-journey-button');
    await page.waitForSelector('[data-pistis-sophia-route-open]', { state: 'visible', timeout: 30000 });
    await page.click('[data-pistis-sophia-route-open]');
    await page.waitForFunction(() => document.querySelector('[data-temple-pilgrimage-route="pistis-sophia"]')?.hidden === false, null, { timeout: 30000 });

    const lockOpen = await page.evaluate(() => ({
      bodyClass: document.body.classList.contains('tm53-pilgrimage-open'),
      htmlClass: document.documentElement.classList.contains('tm53-pilgrimage-scroll-lock'),
      bodyOverflow: getComputedStyle(document.body).overflow,
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      panelOverscroll: getComputedStyle(document.querySelector('.tm53-route-panel')).overscrollBehavior
    }));

    await page.evaluate(() => {
      const panel = document.querySelector('.tm53-route-panel');
      panel.scrollTop = panel.scrollHeight;
    });
    await page.locator('.tm53-route-gate-button').nth(1).click();
    await page.waitForFunction(() => document.querySelector('.tm53-route-gate h3')?.textContent === 'The Desire', null, { timeout: 30000 });
    await wait(100);
    const transition = await page.evaluate(() => ({
      title: document.querySelector('.tm53-route-gate h3')?.textContent || '',
      scrollTop: document.querySelector('.tm53-route-panel')?.scrollTop || 0
    }));

    await page.locator('.tm53-route-gate-button').first().click();
    await page.waitForFunction(() => document.querySelector('.tm53-route-gate h3')?.textContent === 'The Glimpse', null, { timeout: 30000 });
    const marker = 'Hardening smoke: storage failure must never report success.';
    await page.fill('[data-reality-field="downward-draw"]', marker);

    await page.evaluate(() => {
      window.__tm531OriginalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (String(key) === 'temple_pilgrimage_pistis_sophia_v1') {
          throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
        }
        return window.__tm531OriginalSetItem.call(this, key, value);
      };
    });

    await page.getByRole('button', { name: 'Save Private Record' }).click();
    await page.waitForFunction(() => window.TemplePilgrimageHardening?.storageStatus?.()?.state === 'error', null, { timeout: 5000 });
    const failedSave = await page.evaluate((expected) => {
      let disk = null;
      try { disk = JSON.parse(localStorage.getItem('temple_pilgrimage_pistis_sophia_v1') || 'null'); } catch {}
      const button = [...document.querySelectorAll('.tm53-route-actions button')].find((node) => /Save/.test(node.textContent || ''));
      return {
        status: window.TemplePilgrimageHardening?.storageStatus?.(),
        buttonText: button?.textContent || '',
        diskContainsMarker: JSON.stringify(disk || {}).includes(expected),
        apiContainsMarker: JSON.stringify(window.TemplePilgrimageRoutes?.state?.('route.pistis-sophia-descent-return') || {}).includes(expected)
      };
    }, marker);

    await page.evaluate(() => {
      Storage.prototype.setItem = window.__tm531OriginalSetItem;
      delete window.__tm531OriginalSetItem;
    });
    await wait(1900);
    await page.getByRole('button', { name: 'Save Private Record' }).click();
    await page.waitForFunction(() => window.TemplePilgrimageHardening?.storageStatus?.()?.state === 'ok', null, { timeout: 5000 });
    const recoveredSave = await page.evaluate((expected) => {
      const disk = JSON.parse(localStorage.getItem('temple_pilgrimage_pistis_sophia_v1') || 'null');
      return {
        status: window.TemplePilgrimageHardening?.storageStatus?.(),
        diskContainsMarker: JSON.stringify(disk || {}).includes(expected),
        apiMatchesDisk: JSON.stringify(disk) === JSON.stringify(window.TemplePilgrimageRoutes?.state?.('route.pistis-sophia-descent-return'))
      };
    }, marker);

    await page.getByRole('button', { name: 'Close Pistis Sophia pilgrimage' }).last().click();
    await page.waitForFunction(() => document.querySelector('[data-temple-pilgrimage-route="pistis-sophia"]')?.hidden === true, null, { timeout: 5000 });
    await wait(50);
    const lockClosed = await page.evaluate(() => ({
      bodyClass: document.body.classList.contains('tm53-pilgrimage-open'),
      htmlClass: document.documentElement.classList.contains('tm53-pilgrimage-scroll-lock'),
      bodyOverflow: getComputedStyle(document.body).overflow,
      htmlOverflow: getComputedStyle(document.documentElement).overflow
    }));

    const assertions = {
      modalLocksDocumentScroll: lockOpen.bodyClass && lockOpen.htmlClass && lockOpen.bodyOverflow === 'hidden' && lockOpen.htmlOverflow === 'hidden',
      panelContainsOverscroll: /contain/.test(lockOpen.panelOverscroll),
      transitionReturnsToTop: transition.title === 'The Desire' && transition.scrollTop <= 1,
      failedWriteVisible: failedSave.status?.state === 'error' && /not written|not saved|unavailable/i.test(failedSave.status?.message || ''),
      failedWriteNotCalledSuccess: !/^Saved on this device$/i.test(failedSave.buttonText),
      failedWriteNotOnDisk: failedSave.diskContainsMarker === false,
      failedWriteDetectedDespiteMemoryMutation: failedSave.apiContainsMarker === true,
      retryPersistsRecord: recoveredSave.status?.state === 'ok' && recoveredSave.diskContainsMarker && recoveredSave.apiMatchesDisk,
      modalUnlocksDocument: !lockClosed.bodyClass && !lockClosed.htmlClass && lockClosed.bodyOverflow !== 'hidden' && lockClosed.htmlOverflow !== 'hidden',
      noUnexpectedWrites: badRequests.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    const ok = failedAssertions.length === 0;
    console.log(JSON.stringify({ ok, failedAssertions, assertions, lockOpen, transition, failedSave, recoveredSave, lockClosed, badRequests, pageErrors }, null, 2));
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
