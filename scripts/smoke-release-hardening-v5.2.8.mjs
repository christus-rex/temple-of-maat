import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'work', 'release-hardening');
fs.mkdirSync(outDir, { recursive: true });
const port = 41790;
const base = `http://127.0.0.1:${port}/`;
const CURRENT_NAMESPACE = 'temple-maat-pwa-v5.2.8-library-journey-offline-2026-08-14';
const PRIOR_NAMESPACE = 'temple-maat-pwa-v5.2.7-prior-release-fixture';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8'], ['.webmanifest', 'application/manifest+json'],
  ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'], ['.svg', 'image/svg+xml'],
  ['.mp3', 'audio/mpeg'], ['.opus', 'audio/ogg'], ['.wav', 'audio/wav']
]);

const priorWorker = `
const VERSION='${PRIOR_NAMESPACE}';
const CACHE=VERSION+'-static';
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(['./','./index.html','./offline.html']);self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;event.respondWith((async()=>{try{return await fetch(event.request);}catch{return (await caches.match(event.request))||(await caches.match('./index.html'))||(await caches.match('./offline.html'));}})());});
`;

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', base);
  if (requestUrl.pathname === '/__prior-v527-sw.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'Service-Worker-Allowed': '/' });
    res.end(priorWorker);
    return;
  }
  if (requestUrl.pathname === '/__sw-setup.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('<!doctype html><meta charset="utf-8"><title>Temple SW setup</title><p>release fixture</p>');
    return;
  }

  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === '/') pathname = '/index.html';
  const resolved = path.resolve(root, `.${pathname}`);
  if (!resolved.startsWith(root + path.sep) && resolved !== path.join(root, 'index.html')) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(resolved, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const headers = { 'Content-Type': mime.get(path.extname(resolved).toLowerCase()) || 'application/octet-stream', 'Cache-Control': 'no-store' };
    res.writeHead(200, headers);
    fs.createReadStream(resolved).pipe(res);
  });
});
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

async function waitForTempleRuntime(page) {
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.state && window.TempleLibrary?.open && window.TempleOfflineManager?.version === '1.0.0', { timeout: 45000 });
}

async function installPriorWorker(page) {
  await page.goto(`${base}__sw-setup.html?prior=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    await navigator.serviceWorker.register('./__prior-v527-sw.js', { scope: './', updateViaCache: 'none' });
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes('__prior-v527-sw.js'), { timeout: 30000 });
  return await page.evaluate(async () => ({
    controller: navigator.serviceWorker.controller?.scriptURL || '',
    caches: await caches.keys()
  }));
}

async function upgradeToCurrentWorker(page) {
  return await page.evaluate(async ({ currentNamespace, priorNamespace }) => {
    const before = navigator.serviceWorker.controller?.scriptURL || '';
    const registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
    await registration.update();

    let candidate = registration.waiting || registration.installing;
    if (candidate && candidate.state !== 'installed' && candidate.state !== 'activated') {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`New worker stayed in ${candidate.state}`)), 90000);
        candidate.addEventListener('statechange', () => {
          if (candidate.state === 'installed' || candidate.state === 'activated') { clearTimeout(timer); resolve(); }
          if (candidate.state === 'redundant') { clearTimeout(timer); reject(new Error('New worker became redundant')); }
        });
      });
    }

    candidate = registration.waiting || registration.installing;
    if (candidate && candidate.state !== 'activated') {
      const changed = new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      candidate.postMessage({ type: 'SKIP_WAITING' });
      await Promise.race([changed, new Promise((_, reject) => setTimeout(() => reject(new Error('controllerchange timeout')), 90000))]);
    }

    // controllerchange can fire while the new worker is still finishing activate-event
    // cleanup. Wait for the worker to reach activated and for the prior namespace to
    // disappear before judging the update contract.
    let activeRegistration = null;
    let cachesNow = [];
    const cleanupDeadline = Date.now() + 90000;
    while (Date.now() < cleanupDeadline) {
      activeRegistration = await navigator.serviceWorker.getRegistration('./');
      cachesNow = await caches.keys();
      const activeReady = activeRegistration?.active?.state === 'activated';
      const priorCachePresent = cachesNow.some((name) => name.includes(priorNamespace));
      if (activeReady && !priorCachePresent) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return {
      before,
      after: navigator.serviceWorker.controller?.scriptURL || '',
      active: activeRegistration?.active?.scriptURL || '',
      activeState: activeRegistration?.active?.state || '',
      caches: cachesNow,
      currentCachePresent: cachesNow.some((name) => name.startsWith(currentNamespace)),
      priorCachePresent: cachesNow.some((name) => name.includes(priorNamespace))
    };
  }, { currentNamespace: CURRENT_NAMESPACE, priorNamespace: PRIOR_NAMESPACE });
}

function geometryFromRect(rect, viewportWidth) {
  return Boolean(rect) && rect.width > 0 && rect.left >= -1.5 && rect.right <= viewportWidth + 1.5;
}

async function inspectPanel(page, layerSelector, panelSelector) {
  return await page.evaluate(({ layerSelector, panelSelector }) => {
    const layer = document.querySelector(layerSelector);
    const panel = document.querySelector(panelSelector);
    const rect = panel?.getBoundingClientRect();
    return {
      visible: Boolean(layer && !layer.hidden && panel && rect?.width && rect?.height),
      rect: rect ? { left: rect.left, right: rect.right, width: rect.width, top: rect.top, bottom: rect.bottom } : null,
      viewportWidth: innerWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth
    };
  }, { layerSelector, panelSelector });
}

async function runMobile(browser, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
    userAgent: `Mozilla/5.0 (Linux; Android 17; Temple release test ${width}) AppleWebKit/537.36 Chrome/151 Mobile Safari/537.36`
  });
  await context.addInitScript(() => localStorage.setItem('temple_last_chamber', '13'));
  const warm = await context.newPage();
  await warm.goto(`${base}?mobile_warm=${width}-${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  if (await warm.evaluate(() => 'serviceWorker' in navigator)) await warm.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await warm.close();

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${base}?mobile=${width}-${Date.now()}#chamber-13`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForTempleRuntime(page);
  await page.waitForSelector('[data-temple-entry="continue"]', { state: 'attached', timeout: 30000 });
  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && location.hash === '#chamber-13', { timeout: 30000 });
  await page.waitForSelector('#tm2-artifact.open', { timeout: 30000 });
  await page.waitForFunction(() => {
    const image = document.querySelector('#tm2-artifact.open .tm2-parental-section img');
    return image?.complete && image.naturalWidth > 0;
  }, { timeout: 30000 });

  const artifact = await page.evaluate(() => {
    const node = document.querySelector('#tm2-artifact.open');
    const image = node?.querySelector('.tm2-parental-section img');
    const launcher = document.querySelector('[data-temple-library-launcher="artifact-mobile"]');
    const rect = node?.getBoundingClientRect();
    const imageRect = image?.getBoundingClientRect();
    const launcherRect = launcher?.getBoundingClientRect();
    const style = image ? getComputedStyle(image) : null;
    const headerClearance = rect ? Math.min(180, Math.max(120, rect.height * 0.2)) : 180;
    return {
      viewportWidth: innerWidth,
      docScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      rect: rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null,
      imageRect: imageRect ? { left: imageRect.left, right: imageRect.right, width: imageRect.width, height: imageRect.height } : null,
      launcherRect: launcherRect ? { left: launcherRect.left, right: launcherRect.right, top: launcherRect.top, bottom: launcherRect.bottom, width: launcherRect.width, height: launcherRect.height } : null,
      launcherClearOfHeader: Boolean(rect && launcherRect && launcherRect.top >= rect.top + headerClearance),
      imageLoaded: Boolean(image?.naturalWidth),
      objectFit: style?.objectFit || '',
      objectPosition: style?.objectPosition || ''
    };
  });
  await page.screenshot({ path: path.join(outDir, `mobile-${width}-chamber-13.png`), fullPage: false });

  await page.keyboard.press('Escape');
  await page.evaluate(() => window.TempleLibrary.open());
  await page.waitForSelector('#tm528-library:not([hidden])', { timeout: 30000 });
  const library = await inspectPanel(page, '#tm528-library', '#tm528-library .tm528-panel');
  if (width === 320) await page.screenshot({ path: path.join(outDir, 'mobile-320-library.png'), fullPage: false });
  await page.keyboard.press('Escape');

  await page.evaluate(() => window.TemplePilgrimJourney.open());
  await page.waitForSelector('#tm525-journey:not([hidden])', { timeout: 30000 });
  const journey = await inspectPanel(page, '#tm525-journey', '#tm525-journey .tm525-panel');
  await page.keyboard.press('Escape');

  await page.evaluate(() => window.TempleOfflineManager.open());
  await page.waitForSelector('#tm528-offline:not([hidden])', { timeout: 30000 });
  const offline = await inspectPanel(page, '#tm528-offline', '#tm528-offline .tm528o-panel');
  await page.keyboard.press('Escape');

  const panels = { library, journey, offline };
  const noHorizontalOverflow = artifact.docScrollWidth <= width + 1 && artifact.bodyScrollWidth <= width + 1;
  const artifactInside = geometryFromRect(artifact.rect, width) && geometryFromRect(artifact.imageRect, width);
  const panelsInside = Object.values(panels).every((item) => item.visible && geometryFromRect(item.rect, width) && item.docScrollWidth <= width + 1 && item.bodyScrollWidth <= width + 1);
  const result = { width, height, noHorizontalOverflow, artifactInside, artifactLauncherClear: artifact.launcherClearOfHeader, panelsInside, artifact, panels, pageErrors };
  await context.close();
  return result;
}

let browser;
try {
  await wait(250);
  browser = await chromium.launch({ headless: true });

  const updateContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await updateContext.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const prior = await installPriorWorker(page);
  const upgrade = await upgradeToCurrentWorker(page);
  fs.writeFileSync(path.join(outDir, 'service-worker-upgrade.json'), JSON.stringify({ prior, upgrade }, null, 2));
  await page.screenshot({ path: path.join(outDir, 'service-worker-upgrade-state.png'), fullPage: false });
  if (!prior.controller.includes('__prior-v527-sw.js')) throw new Error(`Prior worker never controlled the test origin: ${JSON.stringify(prior)}`);
  if (!upgrade.after.endsWith('/sw.js') || !upgrade.active.endsWith('/sw.js') || upgrade.activeState !== 'activated' || !upgrade.currentCachePresent || upgrade.priorCachePresent) {
    throw new Error(`Service-worker upgrade contract failed: ${JSON.stringify(upgrade)}`);
  }

  await page.evaluate(() => localStorage.setItem('temple_last_chamber', '42'));
  await page.goto(`${base}?deep_link_after_update=${Date.now()}#chamber-42`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForTempleRuntime(page);
  await page.waitForSelector('[data-temple-entry="continue"]', { state: 'attached', timeout: 30000 });
  const threshold = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    rootHidden: document.getElementById('root')?.getAttribute('aria-hidden') === 'true',
    continueText: document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim(),
    continueHref: document.querySelector('[data-temple-entry="continue"]')?.getAttribute('href'),
    artifactVisibility: getComputedStyle(document.querySelector('.tm2-artifact-backdrop')).visibility
  }));
  if (threshold.ready || !threshold.rootInert || !threshold.rootHidden || threshold.continueText !== 'Continue at Chamber 42' || threshold.continueHref !== '#chamber-42' || threshold.artifactVisibility !== 'hidden') {
    throw new Error(`Deep-link/manual threshold failed after SW upgrade: ${JSON.stringify(threshold)}`);
  }
  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && location.hash === '#chamber-42', { timeout: 30000 });
  await page.waitForSelector('#tm2-artifact.open', { timeout: 30000 });
  const afterEntry = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    hash: location.hash,
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    artifactOpen: Boolean(document.querySelector('#tm2-artifact.open')),
    controller: navigator.serviceWorker.controller?.scriptURL || ''
  }));
  await page.screenshot({ path: path.join(outDir, 'desktop-after-v527-to-v528-update-chamber-42.png'), fullPage: false });
  await updateContext.close();

  const mobile = [];
  for (const [width, height] of [[320, 740], [360, 800], [412, 915]]) mobile.push(await runMobile(browser, width, height));

  const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
  const assertions = {
    releaseVersion: version.version === '5.2.8' && version.build === '2026-08-14-v5.2.8-library-journey-offline-hardening',
    priorWorkerInstalled: prior.controller.includes('__prior-v527-sw.js') && prior.caches.some((name) => name.includes(PRIOR_NAMESPACE)),
    upgradedToCurrentWorker: upgrade.after.endsWith('/sw.js') && upgrade.active.endsWith('/sw.js') && upgrade.activeState === 'activated' && upgrade.currentCachePresent && !upgrade.priorCachePresent,
    thresholdHeldAfterUpdate: threshold.ready === false && threshold.rootInert === true && threshold.rootHidden === true && threshold.artifactVisibility === 'hidden',
    deepLinkPreserved: threshold.continueText === 'Continue at Chamber 42' && threshold.continueHref === '#chamber-42',
    explicitEntryToIntendedChamber: afterEntry.ready === true && afterEntry.hash === '#chamber-42' && afterEntry.rootInert === false && afterEntry.artifactOpen === true,
    mobileNoHorizontalOverflow: mobile.every((item) => item.noHorizontalOverflow),
    mobileArtifactGeometry: mobile.every((item) => item.artifactInside && item.artifact.imageLoaded),
    mobileArtifactLauncherClear: mobile.every((item) => item.artifactLauncherClear),
    mobileOverlayGeometry: mobile.every((item) => item.panelsInside),
    noPageErrors: pageErrors.length === 0 && mobile.every((item) => item.pageErrors.length === 0)
  };
  const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
  const ok = failedAssertions.length === 0;
  console.log(JSON.stringify({ ok, failedAssertions, assertions, version, prior, upgrade, threshold, afterEntry, mobile, pageErrors, screenshots: fs.readdirSync(outDir).sort() }, null, 2));
  if (!ok) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
