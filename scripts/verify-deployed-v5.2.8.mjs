import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const release = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const base = new URL(process.env.TEMPLE_LIVE_URL || 'https://christus-rex.github.io/temple-of-maat/');
const expectedVersion = process.env.TEMPLE_EXPECTED_VERSION || String(release.version || '');
const expectedBuild = process.env.TEMPLE_EXPECTED_BUILD || String(release.build || '');
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

async function inspectSignatureBook(page, width, label) {
  await page.evaluate(() => window.TempleMobileHardening?.refresh?.());
  await page.waitForSelector('.temple-signature-book', { state: 'attached', timeout: 30000 });
  await page.locator('.temple-signature-book').scrollIntoViewIfNeeded();
  await page.waitForTimeout(160);

  const state = await page.evaluate(() => {
    const section = document.querySelector('.temple-signature-book');
    const rectOf = (node) => {
      const rect = node?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
    };
    const heading = section?.querySelector('h3');
    const form = section?.querySelector('form');
    const toolbar = section?.querySelector('.temple-signature-book__toolbar');
    const actions = section?.querySelector('.temple-signature-book__actions');
    const tableScroll = section?.querySelector('.temple-signature-book__table-scroll');
    const controls = section ? [...section.querySelectorAll('input, select, button')].map((node) => ({
      tag: node.tagName,
      label: node.getAttribute('aria-label') || node.getAttribute('placeholder') || (node.textContent || '').trim().slice(0, 40),
      rect: rectOf(node),
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth
    })) : [];
    return {
      viewport: innerWidth,
      docWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      geometryFlag: section?.dataset.mobileGeometry || '',
      section: rectOf(section),
      form: rectOf(form),
      heading: {
        rect: rectOf(heading),
        clientWidth: heading?.clientWidth || 0,
        scrollWidth: heading?.scrollWidth || 0,
        text: (heading?.textContent || '').trim()
      },
      toolbar: rectOf(toolbar),
      actions: rectOf(actions),
      tableScroll: {
        rect: rectOf(tableScroll),
        clientWidth: tableScroll?.clientWidth || 0,
        scrollWidth: tableScroll?.scrollWidth || 0,
        overflowX: tableScroll ? getComputedStyle(tableScroll).overflowX : ''
      },
      controls
    };
  });

  const geometryNodes = [state.section, state.form, state.heading.rect, state.toolbar, state.actions, state.tableScroll.rect].filter(Boolean);
  const controlsInside = state.controls.every((control) => within(control.rect, width) && control.scrollWidth <= control.clientWidth + 2);
  const headingFits = within(state.heading.rect, width) && state.heading.scrollWidth <= state.heading.clientWidth + 2;
  const localTableScroll = within(state.tableScroll.rect, width) && ['auto', 'scroll'].includes(state.tableScroll.overflowX);
  const pageFits = state.docWidth <= width + 1 && state.bodyWidth <= width + 1;
  const geometryFits = geometryNodes.every((rect) => within(rect, width));
  const mobileFlagOk = width > 767 || state.geometryFlag === 'ok';
  const accessibleFilter = state.controls.some((control) => control.label === 'Filter visitor signature ledger');
  const accessibleSeal = state.controls.some((control) => control.label === 'Seal phrase');

  await page.screenshot({ path: path.join(outDir, `deployed-${label}-${width}-signature-book.png`), fullPage: false });
  return {
    ok: pageFits && geometryFits && controlsInside && headingFits && localTableScroll && mobileFlagOk && accessibleFilter && accessibleSeal,
    pageFits,
    geometryFits,
    controlsInside,
    headingFits,
    localTableScroll,
    mobileFlagOk,
    accessibleFilter,
    accessibleSeal,
    state
  };
}

async function inspectResponsive(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: width <= 768, hasTouch: width <= 768 });
  await context.addInitScript(() => localStorage.setItem('temple_last_chamber', '13'));
  await warm(context, `responsive-${width}`);
  const page = await context.newPage();
  const errors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  const url = new URL(`?deployed_responsive=${width}-${Date.now()}#chamber-13`, base);
  await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await runtime(page);
  await page.waitForSelector('[data-temple-entry="continue"]', { state: 'attached', timeout: 30000 });
  const before = await page.evaluate(() => ({ ready: document.body.classList.contains('temple-app-ready'), inert: document.getElementById('root')?.hasAttribute('inert') }));
  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && location.hash === '#chamber-13', { timeout: 30000 });
  await page.waitForSelector('#tm2-artifact.open', { timeout: 30000 });
  await page.waitForFunction(() => { const image = document.querySelector('#tm2-artifact.open .tm2-parental-section img'); return image?.complete && image.naturalWidth > 0; }, { timeout: 30000 });
  const chamber = await page.evaluate((viewportWidth) => {
    const artifact = document.querySelector('#tm2-artifact.open');
    const image = artifact?.querySelector('.tm2-parental-section img');
    const launcher = document.querySelector('[data-temple-library-launcher="artifact-mobile"]');
    const a = artifact?.getBoundingClientRect();
    const i = image?.getBoundingClientRect();
    const l = launcher?.getBoundingClientRect();
    const headerClearance = a ? Math.min(180, Math.max(120, a.height * 0.2)) : 180;
    return {
      doc: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      width: innerWidth,
      artifact: a ? { left: a.left, right: a.right, top: a.top, bottom: a.bottom, width: a.width, height: a.height } : null,
      image: i ? { left: i.left, right: i.right, width: i.width, height: i.height } : null,
      launcher: l ? { left: l.left, right: l.right, top: l.top, bottom: l.bottom, width: l.width, height: l.height } : null,
      launcherClearOfHeader: viewportWidth > 760 || Boolean(a && l && l.top >= a.top + headerClearance)
    };
  }, width);
  await page.screenshot({ path: path.join(outDir, `deployed-responsive-${width}-chamber-13.png`), fullPage: false });
  await page.keyboard.press('Escape');

  const overlayChecks = [];
  for (const [name, visibleSelector, panelSelector] of [
    ['library', '#tm528-library:not([hidden])', '#tm528-library .tm528-panel'],
    ['journey', '#tm525-journey:not([hidden])', '#tm525-journey .tm525-panel'],
    ['offline', '#tm528-offline:not([hidden])', '#tm528-offline .tm528o-panel']
  ]) {
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

  const signatureBook = await inspectSignatureBook(page, width, 'responsive');
  const brokenImages = await page.evaluate(() => [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src || image.alt || 'unknown'));
  const result = {
    width, height, before,
    chamberInside: chamber.doc <= width + 1 && chamber.body <= width + 1 && within(chamber.artifact, width) && within(chamber.image, width),
    artifactLauncherClear: chamber.launcherClearOfHeader,
    overlaysInside: overlayChecks.every((item) => item.inside),
    signatureBook,
    chamber,
    overlayChecks,
    brokenImages,
    errors,
    consoleErrors
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
  const consoleErrors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  const deepUrl = new URL(`?deployed_deep=${Date.now()}#chamber-42`, base);
  await page.goto(deepUrl.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await runtime(page);
  await page.waitForSelector('[data-temple-entry="continue"]', { state: 'attached', timeout: 30000 });
  await page.waitForSelector('[data-temple-portal-version]:not([hidden])', { state: 'visible', timeout: 30000 });

  const version = await page.evaluate(async () => fetch(`./version.json?verify=${Date.now()}`, { cache: 'no-store' }).then((response) => response.json()));
  const before = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    inert: document.getElementById('root')?.hasAttribute('inert'),
    hidden: document.getElementById('root')?.getAttribute('aria-hidden') === 'true',
    continueText: document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim(),
    continueHref: document.querySelector('[data-temple-entry="continue"]')?.getAttribute('href'),
    controller: navigator.serviceWorker.controller?.scriptURL || '',
    portalVersion: document.querySelector('[data-temple-portal-version]')?.textContent?.trim() || '',
    portalVersionLabel: document.querySelector('[data-temple-portal-version]')?.getAttribute('aria-label') || ''
  }));
  await page.screenshot({ path: path.join(outDir, 'deployed-desktop-threshold-chamber-42.png'), fullPage: false });
  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && location.hash === '#chamber-42', { timeout: 30000 });
  const after = await page.evaluate(() => ({ ready: document.body.classList.contains('temple-app-ready'), inert: document.getElementById('root')?.hasAttribute('inert'), hash: location.hash }));
  if (await page.locator('#tm2-artifact.open').count()) await page.keyboard.press('Escape');
  const desktopSignatureBook = await inspectSignatureBook(page, 1280, 'desktop');
  const brokenImages = await page.evaluate(() => [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src || image.alt || 'unknown'));
  await context.close();

  const responsive = [];
  for (const [width, height] of [[320, 740], [360, 800], [412, 915], [430, 932], [768, 1024]]) {
    responsive.push(await inspectResponsive(browser, width, height));
  }
  const assertions = {
    httpsOrigin: base.protocol === 'https:',
    releaseIdentity: version.version === expectedVersion && version.build === expectedBuild,
    portalVersionVisible: before.portalVersion === `PORTAL v${expectedVersion}` && before.portalVersionLabel === `Temple portal version ${expectedVersion}`,
    serviceWorkerControlled: before.controller.endsWith('/sw.js'),
    thresholdHeld: before.ready === false && before.inert === true && before.hidden === true,
    deepLinkHeld: before.continueText === 'Continue at Chamber 42' && before.continueHref === '#chamber-42',
    explicitEntry: after.ready === true && after.inert === false && after.hash === '#chamber-42',
    desktopSignatureBook: desktopSignatureBook.ok,
    responsiveThresholdHeld: responsive.every((item) => item.before.ready === false && item.before.inert === true),
    responsiveChamberGeometry: responsive.every((item) => item.chamberInside),
    responsiveArtifactLauncherClear: responsive.every((item) => item.artifactLauncherClear),
    responsiveOverlayGeometry: responsive.every((item) => item.overlaysInside),
    responsiveSignatureBook: responsive.every((item) => item.signatureBook.ok),
    noBrokenImages: brokenImages.length === 0 && responsive.every((item) => item.brokenImages.length === 0),
    noPageErrors: errors.length === 0 && consoleErrors.length === 0 && responsive.every((item) => item.errors.length === 0 && item.consoleErrors.length === 0)
  };
  const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
  const ok = failedAssertions.length === 0;
  const result = { ok, base: base.href, failedAssertions, assertions, version, expectedVersion, expectedBuild, before, after, desktopSignatureBook, responsive, brokenImages, errors, consoleErrors, screenshots: fs.readdirSync(outDir).sort() };
  fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (!ok) process.exitCode = 1;
} finally {
  await browser.close();
}
