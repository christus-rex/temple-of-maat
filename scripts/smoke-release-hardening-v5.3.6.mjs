import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'work', 'release-hardening-v5.3.6');
fs.mkdirSync(outDir, { recursive: true });

const port = 41796;
const base = `http://127.0.0.1:${port}/`;
const PRIOR_NAMESPACE = 'temple-maat-pwa-v5.2.7-prior-release-fixture';
const CURRENT_CACHE_REVISION = 'v5.3.6-global-logo-r1';
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
  if (requestUrl.pathname === '/__prior-sw.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'Service-Worker-Allowed': '/' });
    res.end(priorWorker);
    return;
  }
  if (requestUrl.pathname === '/__sw-setup.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('<!doctype html><meta charset="utf-8"><title>Temple SW setup</title><p>isolated service-worker fixture</p>');
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
    res.writeHead(200, {
      'Content-Type': mime.get(path.extname(resolved).toLowerCase()) || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(resolved).pipe(res);
  });
});

await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

async function installPriorWorker(page) {
  await page.goto(`${base}__sw-setup.html?prior=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    await navigator.serviceWorker.register('./__prior-sw.js', { scope: './', updateViaCache: 'none' });
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes('__prior-sw.js'), { timeout: 30000 });
}

async function upgradeWorker(page) {
  return page.evaluate(async ({ priorNamespace, revision }) => {
    const registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
    await registration.update();
    let candidate = registration.waiting || registration.installing;
    if (candidate && !['installed', 'activated'].includes(candidate.state)) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Worker stayed ${candidate.state}`)), 90000);
        candidate.addEventListener('statechange', () => {
          if (['installed', 'activated'].includes(candidate.state)) { clearTimeout(timer); resolve(); }
          if (candidate.state === 'redundant') { clearTimeout(timer); reject(new Error('Worker became redundant')); }
        });
      });
    }
    candidate = registration.waiting || registration.installing;
    if (candidate && candidate.state !== 'activated') {
      const changed = new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      candidate.postMessage({ type: 'SKIP_WAITING' });
      await Promise.race([changed, new Promise((_, reject) => setTimeout(() => reject(new Error('controllerchange timeout')), 90000))]);
    }
    const deadline = Date.now() + 90000;
    let names = [];
    let active = '';
    let activeState = '';
    while (Date.now() < deadline) {
      const reg = await navigator.serviceWorker.getRegistration('./');
      names = await caches.keys();
      active = reg?.active?.scriptURL || '';
      activeState = reg?.active?.state || '';
      if (activeState === 'activated' && !names.some((name) => name.includes(priorNamespace)) && names.some((name) => name.includes(revision))) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return {
      controller: navigator.serviceWorker.controller?.scriptURL || '',
      active,
      activeState,
      caches: names,
      currentRevisionPresent: names.some((name) => name.includes(revision)),
      priorRemoved: !names.some((name) => name.includes(priorNamespace))
    };
  }, { priorNamespace: PRIOR_NAMESPACE, revision: CURRENT_CACHE_REVISION });
}

async function waitForTempleRuntime(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.state && window.TempleLibrary?.open, { timeout: 45000 });
}

async function inspectLogo(page) {
  return page.evaluate(async () => {
    const panel = document.querySelector('.temple-static-entry__panel');
    const thresholdPseudo = panel ? getComputedStyle(panel, '::before') : null;
    const header = document.querySelector('.temple-brand-title');
    const headerPseudo = header ? getComputedStyle(header, '::before') : null;
    const response = await fetch('./assets/branding/temple-global-logo.webp', { cache: 'no-store' });
    let decoded = false;
    let bytes = 0;
    if (response.ok) {
      const blob = await response.blob();
      bytes = blob.size;
      const objectUrl = URL.createObjectURL(blob);
      decoded = await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
        image.onerror = () => resolve(false);
        image.src = objectUrl;
      });
      URL.revokeObjectURL(objectUrl);
    }
    return {
      responseOk: response.ok,
      bytes,
      decoded,
      thresholdBackground: thresholdPseudo?.backgroundImage || '',
      thresholdWidth: thresholdPseudo ? parseFloat(thresholdPseudo.width) : 0,
      thresholdHeight: thresholdPseudo ? parseFloat(thresholdPseudo.height) : 0,
      headerBackground: headerPseudo?.backgroundImage || ''
    };
  });
}

async function inspectMobile(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => localStorage.setItem('temple_last_chamber', '42'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}?mobile=${width}-${Date.now()}#chamber-42`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForTempleRuntime(page);
  const before = await inspectLogo(page);
  const threshold = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    rootHidden: document.getElementById('root')?.getAttribute('aria-hidden') === 'true',
    continueText: document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim(),
    docWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  await page.screenshot({ path: path.join(outDir, `mobile-${width}-threshold.png`), fullPage: false });
  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && location.hash === '#chamber-42', { timeout: 30000 });
  await page.waitForSelector('#tm2-artifact.open', { timeout: 30000 });
  const after = await page.evaluate(() => ({
    hash: location.hash,
    artifactOpen: Boolean(document.querySelector('#tm2-artifact.open')),
    docWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  await page.screenshot({ path: path.join(outDir, `mobile-${width}-chamber-42.png`), fullPage: false });
  await context.close();
  return { width, threshold, before, after, errors };
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await installPriorWorker(page);
  const upgrade = await upgradeWorker(page);
  fs.writeFileSync(path.join(outDir, 'service-worker-upgrade.json'), JSON.stringify(upgrade, null, 2));

  await page.goto(`${base}?desktop=${Date.now()}#chamber-42`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForTempleRuntime(page);
  const logoBeforeEntry = await inspectLogo(page);
  const threshold = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    rootHidden: document.getElementById('root')?.getAttribute('aria-hidden') === 'true',
    continueText: document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim(),
    continueHref: document.querySelector('[data-temple-entry="continue"]')?.getAttribute('href'),
    artifactVisibility: getComputedStyle(document.querySelector('.tm2-artifact-backdrop')).visibility
  }));
  await page.screenshot({ path: path.join(outDir, 'desktop-threshold-logo.png'), fullPage: false });

  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && location.hash === '#chamber-42', { timeout: 30000 });
  await page.waitForSelector('#tm2-artifact.open', { timeout: 30000 });
  await page.keyboard.press('Escape');
  await page.waitForSelector('.temple-brand-title', { state: 'attached', timeout: 30000 });
  const logoAfterEntry = await inspectLogo(page);
  await page.screenshot({ path: path.join(outDir, 'desktop-runtime-logo.png'), fullPage: false });
  await context.close();

  const mobile = [];
  for (const [width, height] of [[320, 740], [360, 800], [412, 915]]) mobile.push(await inspectMobile(browser, width, height));

  const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
  const assertions = {
    releaseIdentity: version.version === '5.3.6' && version.build === '2026-08-16-v5.3.6-logo-visibility-cache-rotation',
    workerUpgraded: upgrade.controller.endsWith('/sw.js') && upgrade.active.endsWith('/sw.js') && upgrade.activeState === 'activated' && upgrade.currentRevisionPresent && upgrade.priorRemoved,
    thresholdHeld: threshold.ready === false && threshold.rootInert === true && threshold.rootHidden === true && threshold.artifactVisibility === 'hidden',
    deepLinkPreserved: threshold.continueText === 'Continue at Chamber 42' && threshold.continueHref === '#chamber-42',
    logoHttpAndDecode: logoBeforeEntry.responseOk && logoBeforeEntry.decoded && logoBeforeEntry.bytes > 10000,
    thresholdLogoRendered: logoBeforeEntry.thresholdWidth > 100 && logoBeforeEntry.thresholdHeight > 100 && logoBeforeEntry.thresholdBackground.includes('temple-global-logo.webp') && logoBeforeEntry.thresholdBackground.includes('icon-512.png'),
    runtimeLogoRendered: logoAfterEntry.headerBackground.includes('temple-global-logo.webp') && logoAfterEntry.headerBackground.includes('icon-512.png'),
    mobileThresholdsHeld: mobile.every((item) => item.threshold.ready === false && item.threshold.rootInert && item.threshold.rootHidden && item.threshold.continueText === 'Continue at Chamber 42'),
    mobileLogosRendered: mobile.every((item) => item.before.responseOk && item.before.decoded && item.before.thresholdWidth > 100 && item.before.thresholdBackground.includes('temple-global-logo.webp')),
    mobileNoOverflow: mobile.every((item) => item.threshold.docWidth <= item.width + 1 && item.threshold.bodyWidth <= item.width + 1 && item.after.docWidth <= item.width + 1 && item.after.bodyWidth <= item.width + 1),
    mobileEntryPreserved: mobile.every((item) => item.after.hash === '#chamber-42' && item.after.artifactOpen),
    noPageErrors: pageErrors.length === 0 && mobile.every((item) => item.errors.length === 0)
  };

  const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
  const result = { ok: failedAssertions.length === 0, failedAssertions, assertions, version, upgrade, threshold, logoBeforeEntry, logoAfterEntry, mobile, pageErrors };
  fs.writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  fs.writeFileSync(path.join(outDir, 'fatal-error.txt'), `${error?.stack || error}\n`);
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
