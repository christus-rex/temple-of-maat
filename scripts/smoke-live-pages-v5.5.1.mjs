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

function rectInside(rect, width) {
  return Boolean(rect) && rect.width > 0 && rect.left >= -2 && rect.right <= width + 2;
}

async function enterTemple(page) {
  await page.goto(new URL(`?live_smoke=${Date.now()}`, base).href, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });

  await page.waitForSelector('[data-temple-entry="continue"]', { state: 'visible', timeout: 45000 });
  await page.waitForFunction(() => Boolean(window.TempleLivingArchive?.open), { timeout: 45000 });
  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), { timeout: 30000 });
}

async function checkPage(browser, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: width <= 768,
    hasTouch: width <= 768
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const sameOriginFailures = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    try {
      const url = new URL(request.url());
      if (url.origin === base.origin) {
        sameOriginFailures.push({ url: request.url(), error: request.failure()?.errorText || 'request failed' });
      }
    } catch {}
  });

  await enterTemple(page);

  const version = await page.evaluate(async () => {
    const response = await fetch(`./version.json?live_smoke=${Date.now()}`, { cache: 'no-store' });
    return response.json();
  });

  const shell = await page.evaluate(() => {
    const dock = document.getElementById('tm524-dock');
    const strip = document.querySelector('.temple-fire-filter-strip');
    const editable = [...document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]), select, textarea')]
      .filter((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      })
      .map((node) => Number.parseFloat(getComputedStyle(node).fontSize || '0'));
    const dockStyle = dock ? getComputedStyle(dock) : null;
    const stripRect = strip?.getBoundingClientRect();
    return {
      viewport: innerWidth,
      docWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      dockVisible: Boolean(dock && dockStyle && dockStyle.display !== 'none' && dockStyle.visibility !== 'hidden'),
      dockActions: dock ? dock.querySelectorAll('a, button').length : 0,
      fireButtons: strip ? strip.querySelectorAll('button').length : 0,
      fireOverflow: strip ? getComputedStyle(strip).overflowX : '',
      fireRect: stripRect ? { left: stripRect.left, right: stripRect.right, width: stripRect.width } : null,
      minEditableFont: editable.length ? Math.min(...editable) : null,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerController: navigator.serviceWorker?.controller?.scriptURL || '',
      serviceWorkerRegistrations: 0
    };
  });

  if (shell.serviceWorkerSupported) {
    shell.serviceWorkerRegistrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
  }

  let fireFocus = { present: false, visible: false };
  const fireButtons = page.locator('.temple-fire-filter-strip button');
  if (await fireButtons.count()) {
    const last = fireButtons.last();
    await last.focus();
    await page.waitForTimeout(180);
    fireFocus = await last.evaluate((node) => {
      const strip = node.closest('.temple-fire-filter-strip');
      const n = node.getBoundingClientRect();
      const s = strip?.getBoundingClientRect();
      return {
        present: true,
        visible: Boolean(s && n.left >= s.left - 2 && n.right <= s.right + 2),
        focused: document.activeElement === node
      };
    });
  }

  const poemsGateway = page.locator('.temple-poems-gateway');
  await poemsGateway.waitFor({ state: 'visible', timeout: 30000 });
  await poemsGateway.click();
  await page.waitForFunction(() => document.body.classList.contains('temple-poems-open'), { timeout: 30000 });
  const poems = await page.evaluate(() => {
    const layer = document.querySelector('.temple-poems-backdrop');
    const dock = document.getElementById('tm524-dock');
    const rect = layer?.getBoundingClientRect();
    return {
      open: document.body.classList.contains('temple-poems-open'),
      zIndex: Number.parseInt(getComputedStyle(layer).zIndex || '0', 10),
      layer: rect ? { left: rect.left, right: rect.right, width: rect.width } : null,
      dockDisplay: dock ? getComputedStyle(dock).display : 'missing'
    };
  });
  await page.screenshot({ path: path.join(outDir, `live-smoke-poems-${width}.png`), fullPage: false });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.body.classList.contains('temple-poems-open'), { timeout: 15000 });

  await page.evaluate(() => window.TempleLivingArchive.open());
  await page.waitForFunction(() => document.body.classList.contains('temple-living-archive-open'), { timeout: 30000 });
  const archive = await page.evaluate(() => {
    const layer = document.querySelector('.temple-living-archive');
    const dock = document.getElementById('tm524-dock');
    const rect = layer?.getBoundingClientRect();
    const search = layer?.querySelector('input[type="search"], input');
    return {
      open: document.body.classList.contains('temple-living-archive-open'),
      zIndex: Number.parseInt(getComputedStyle(layer).zIndex || '0', 10),
      layer: rect ? { left: rect.left, right: rect.right, width: rect.width } : null,
      dockDisplay: dock ? getComputedStyle(dock).display : 'missing',
      searchPresent: Boolean(search),
      searchFont: search ? Number.parseFloat(getComputedStyle(search).fontSize || '0') : null
    };
  });
  await page.screenshot({ path: path.join(outDir, `live-smoke-archive-${width}.png`), fullPage: false });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.body.classList.contains('temple-living-archive-open'), { timeout: 15000 });

  const checks = {
    releaseIdentity: version.version === expectedVersion && version.build === expectedBuild,
    pageContained: shell.docWidth <= width + 1 && shell.bodyWidth <= width + 1,
    mobileDock: shell.dockVisible && shell.dockActions >= 4,
    sevenFires: shell.fireButtons >= 8 && ['auto', 'scroll'].includes(shell.fireOverflow),
    sevenFiresFocusReveal: fireFocus.present && fireFocus.focused && fireFocus.visible,
    mobileEditableFont: width > 768 || shell.minEditableFont === null || shell.minEditableFont >= 16,
    serviceWorker: shell.serviceWorkerSupported && shell.serviceWorkerRegistrations >= 1,
    poemsOpenAboveDock: poems.open && poems.zIndex > 8800 && rectInside(poems.layer, width) && poems.dockDisplay === 'none',
    archiveOpenAboveDock: archive.open && archive.zIndex > 8800 && rectInside(archive.layer, width) && archive.dockDisplay === 'none' && archive.searchPresent,
    archiveMobileSearchFont: width > 768 || archive.searchFont === null || archive.searchFont >= 16,
    noPageErrors: pageErrors.length === 0,
    noConsoleErrors: consoleErrors.length === 0,
    noSameOriginFailures: sameOriginFailures.length === 0
  };

  const failed = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
  await page.screenshot({ path: path.join(outDir, `live-smoke-final-${width}.png`), fullPage: false });
  await context.close();

  return {
    width,
    height,
    ok: failed.length === 0,
    failed,
    checks,
    version,
    shell,
    fireFocus,
    poems,
    archive,
    pageErrors,
    consoleErrors,
    sameOriginFailures
  };
}

const browser = await chromium.launch({ headless: true });
try {
  const results = [];
  for (const [width, height] of [[360, 800], [412, 915], [1280, 900]]) {
    results.push(await checkPage(browser, width, height));
  }
  const ok = results.every((entry) => entry.ok);
  const report = {
    ok,
    live_url: base.href,
    expected_version: expectedVersion,
    expected_build: expectedBuild,
    results,
    screenshots: fs.readdirSync(outDir).filter((name) => name.startsWith('live-smoke-')).sort()
  };
  fs.writeFileSync(path.join(outDir, 'live-smoke-v5.5.1.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exitCode = 1;
} finally {
  await browser.close();
}
