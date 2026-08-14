import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = new URL(process.env.TEMPLE_LIVE_URL || 'https://christus-rex.github.io/temple-of-maat/');
const expectedVersion = process.env.TEMPLE_EXPECTED_VERSION || '5.2.8';
const expectedBuild = process.env.TEMPLE_EXPECTED_BUILD || '2026-08-14-v5.2.8-library-journey-offline-hardening';
const outDir = path.resolve(process.cwd(), 'work', 'deployed-verification');
fs.mkdirSync(outDir, { recursive: true });

async function warm(context, label) {
  const page = await context.newPage();
  await page.goto(new URL(`?deployed_warm=${label}-${Date.now()}`, base).href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  if (await page.evaluate(() => 'serviceWorker' in navigator)) await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.close();
}

async function runtime(page) {
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.state && window.TempleLibrary?.open && window.TempleOfflineManager?.version === '1.0.0', { timeout: 45000 });
}

function within(rect, width) {
  return Boolean(rect) && rect.width > 0 && rect.left >= -1.5 && rect.right <= width + 1.5;
}

async function inspectMobile(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => localStorage.setItem('temple_last_chamber', '13'));
  await warm(context, `mobile-${width}`);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = new URL(`?deployed_mobile=${width}-${Date.now()}#chamber-13`, base);
  await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await runtime(page);
  await page.waitForSelector('[data-temple-entry="continue"]', { state: 'attached', timeout: 30000 });
  const before = await page.evaluate(() => ({ ready: document.body.classList.contains('temple-app-ready'), inert: document.getElementById('root')?.hasAttribute('inert') }));
  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && location.hash === '#chamber-13', { timeout: 30000 });
  await page.waitForSelector('#tm2-artifact.open', { timeout: 30000 });
  await page.waitForFunction(() => { const image = document.querySelector('#tm2-artifact.open .tm2-parental-section img'); return image?.complete && image.naturalWidth > 0; }, { timeout: 30000 });
  const chamber = await page.evaluate(() => {
    const artifact = document.querySelector('#tm2-artifact.open');
    const image = artifact?.querySelector('.tm2-parental-section img');
    const a = artifact?.getBoundingClientRect();
    const i = image?.getBoundingClientRect();
    return {
      doc: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      width: innerWidth,
      artifact: a ? { left: a.left, right: a.right, width: a.width } : null,
      image: i ? { left: i.left, right: i.right, width: i.width, height: i.height } : null
    };
  });
  await page.screenshot({ path: path.join(outDir, `deployed-mobile-${width}-chamber-13.png`), fullPage: false });
  await page.keyboard.press('Escape');

  const overlayChecks = [];
  for (const item of [
    ['library', () => window.TempleLibrary.open(), '#tm528-library:not([hidden])', '#tm528-library .tm528-panel'],
    ['journey', () => window.TemplePilgrimJourney.open(), '#tm525-journey:not([hidden])', '#tm525-journey .tm525-panel'],
    ['offline', () => window.TempleOfflineManager.open(), '#tm528-offline:not([hidden])', '#tm528-offline .tm528o-panel']
  ]) {
    const [name, , visibleSelector, panelSelector] = item;
    if (name === 'library') await page.evaluate(() => window.TempleLibrary.open());
    if (name === 'journey') await page.evaluate(() => window.TemplePilgrimJourney.open());
    if (name === 'offline') await page.evaluate(() => window.TempleOfflineManager.open());
    await page.waitForSelector(visibleSelector, { timeout: 30000 });
    const geometry = await page.evaluate((selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return { width: innerWidth, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth, rect: rect ? { left: rect.left, right: rect.right, width: rect.width } : null };
    }, panelSelector);
    overlayChecks.push({ name, ...geometry, inside: within(geometry.rect, width) && geometry.doc <= width + 1 && geometry.body <= width + 1 });
    await page.keyboard.press('Escape');
  }

  const result = {
    width, height, before,
    chamberInside: chamber.doc <= width + 1 && chamber.body <= width + 1 && within(chamber.artifact, width) && within(chamber.image, width),
    overlaysInside: overlayChecks.every((item) => item.inside),
    overlayChecks,
    errors
  };
  await context.close();
  return result;
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => localStorage.setItem('temple_last_chamber', '42'));
  await warm(context, 'desktop');
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const deepUrl = new URL(`?deployed_deep=${Date.now()}#chamber-42`, base);
  await page.goto(deepUrl.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await runtime(page);
  await page.waitForSelector('[data-temple-entry="continue"]', { state: 'attached', timeout: 30000 });

  const version = await page.evaluate(async () => fetch(`./version.json?verify=${Date.now()}`, { cache: 'no-store' }).then((response) => response.json()));
  const before = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    inert: document.getElementById('root')?.hasAttribute('inert'),
    hidden: document.getElementById('root')?.getAttribute('aria-hidden') === 'true',
    continueText: document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim(),
    continueHref: document.querySelector('[data-temple-entry="continue"]')?.getAttribute('href'),
    controller: navigator.serviceWorker.controller?.scriptURL || ''
  }));
  await page.screenshot({ path: path.join(outDir, 'deployed-desktop-threshold-chamber-42.png'), fullPage: false });
  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && location.hash === '#chamber-42', { timeout: 30000 });
  const after = await page.evaluate(() => ({ ready: document.body.classList.contains('temple-app-ready'), inert: document.getElementById('root')?.hasAttribute('inert'), hash: location.hash }));
  await context.close();

  const mobile = [await inspectMobile(browser, 360, 800), await inspectMobile(browser, 412, 915)];
  const assertions = {
    httpsOrigin: base.protocol === 'https:',
    releaseIdentity: version.version === expectedVersion && version.build === expectedBuild,
    serviceWorkerControlled: before.controller.endsWith('/sw.js'),
    thresholdHeld: before.ready === false && before.inert === true && before.hidden === true,
    deepLinkHeld: before.continueText === 'Continue at Chamber 42' && before.continueHref === '#chamber-42',
    explicitEntry: after.ready === true && after.inert === false && after.hash === '#chamber-42',
    mobileThresholdHeld: mobile.every((item) => item.before.ready === false && item.before.inert === true),
    mobileChamberGeometry: mobile.every((item) => item.chamberInside),
    mobileOverlayGeometry: mobile.every((item) => item.overlaysInside),
    noPageErrors: errors.length === 0 && mobile.every((item) => item.errors.length === 0)
  };
  const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
  const ok = failedAssertions.length === 0;
  console.log(JSON.stringify({ ok, base: base.href, failedAssertions, assertions, version, before, after, mobile, errors, screenshots: fs.readdirSync(outDir).sort() }, null, 2));
  if (!ok) process.exitCode = 1;
} finally {
  await browser.close();
}
