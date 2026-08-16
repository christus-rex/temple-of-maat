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
const CACHE_REVISION = 'v5.3.6-global-logo-r1';
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8'], ['.webmanifest', 'application/manifest+json'],
  ['.png', 'image/png'], ['.webp', 'image/webp'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.svg', 'image/svg+xml'],
  ['.mp3', 'audio/mpeg'], ['.opus', 'audio/ogg'], ['.wav', 'audio/wav']
]);

const priorWorker = `
const VERSION='${PRIOR_NAMESPACE}';
const CACHE=VERSION+'-static';
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(['./','./index.html','./offline.html']);self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).catch(async()=>await caches.match(event.request)||await caches.match('./index.html')||await caches.match('./offline.html')));});
`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', base);
  if (url.pathname === '/__prior-sw.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'Service-Worker-Allowed': '/' });
    res.end(priorWorker);
    return;
  }
  if (url.pathname === '/__sw-setup.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('<!doctype html><meta charset="utf-8"><title>SW fixture</title>');
    return;
  }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const resolved = path.resolve(root, `.${pathname}`);
  if (!resolved.startsWith(root + path.sep) && resolved !== path.join(root, 'index.html')) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(resolved, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime.get(path.extname(resolved).toLowerCase()) || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(resolved).pipe(res);
  });
});
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

async function waitForTemple(page) {
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.state && window.TempleLibrary?.open, { timeout: 45000 });
}

async function installPrior(page) {
  await page.goto(`${base}__sw-setup.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    await navigator.serviceWorker.register('./__prior-sw.js', { scope: './', updateViaCache: 'none' });
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes('__prior-sw.js'), { timeout: 30000 });
}

async function upgrade(page) {
  return page.evaluate(async ({ priorNamespace, revision }) => {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
    await reg.update();
    let candidate = reg.waiting || reg.installing;
    if (candidate && !['installed', 'activated'].includes(candidate.state)) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`worker state timeout: ${candidate.state}`)), 90000);
        candidate.addEventListener('statechange', () => {
          if (['installed', 'activated'].includes(candidate.state)) { clearTimeout(timer); resolve(); }
          if (candidate.state === 'redundant') { clearTimeout(timer); reject(new Error('worker redundant')); }
        });
      });
    }
    candidate = reg.waiting || reg.installing;
    if (candidate && candidate.state !== 'activated') {
      const changed = new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      candidate.postMessage({ type: 'SKIP_WAITING' });
      await Promise.race([changed, new Promise((_, reject) => setTimeout(() => reject(new Error('controllerchange timeout')), 90000))]);
    }
    const deadline = Date.now() + 90000;
    let names = [];
    let active = '';
    let state = '';
    while (Date.now() < deadline) {
      const current = await navigator.serviceWorker.getRegistration('./');
      names = await caches.keys();
      active = current?.active?.scriptURL || '';
      state = current?.active?.state || '';
      if (state === 'activated' && names.some((name) => name.includes(revision)) && !names.some((name) => name.includes(priorNamespace))) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return {
      controller: navigator.serviceWorker.controller?.scriptURL || '',
      active,
      state,
      caches: names,
      revisionPresent: names.some((name) => name.includes(revision)),
      priorRemoved: !names.some((name) => name.includes(priorNamespace))
    };
  }, { priorNamespace: PRIOR_NAMESPACE, revision: CACHE_REVISION });
}

async function logoState(page) {
  return page.evaluate(async () => {
    const panel = document.querySelector('.temple-static-entry__panel');
    const panelStyle = panel ? getComputedStyle(panel, '::before') : null;
    const header = document.querySelector('.temple-brand-title');
    const headerStyle = header ? getComputedStyle(header, '::before') : null;
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
      panelBackground: panelStyle?.backgroundImage || '',
      panelWidth: panelStyle ? parseFloat(panelStyle.width) : 0,
      panelHeight: panelStyle ? parseFloat(panelStyle.height) : 0,
      headerBackground: headerStyle?.backgroundImage || ''
    };
  });
}

async function mobileCheck(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => localStorage.setItem('temple_last_chamber', '42'));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}?mobile=${width}-${Date.now()}#chamber-42`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForTemple(page);
  const logo = await logoState(page);
  const threshold = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    inert: document.getElementById('root')?.hasAttribute('inert'),
    hidden: document.getElementById('root')?.getAttribute('aria-hidden') === 'true',
    continueText: document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim(),
    docWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  await page.screenshot({ path: path.join(outDir, `mobile-${width}-threshold.png`) });
  await context.close();
  return { width, logo, threshold, errors };
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await installPrior(page);
  const worker = await upgrade(page);
  await page.evaluate(() => localStorage.setItem('temple_last_chamber', '42'));
  await page.goto(`${base}?desktop=${Date.now()}#chamber-42`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await waitForTemple(page);

  const before = await logoState(page);
  const threshold = await page.evaluate(() => ({
    ready: document.body.classList.contains('temple-app-ready'),
    inert: document.getElementById('root')?.hasAttribute('inert'),
    hidden: document.getElementById('root')?.getAttribute('aria-hidden') === 'true',
    continueText: document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim(),
    continueHref: document.querySelector('[data-temple-entry="continue"]')?.getAttribute('href'),
    artifactVisibility: getComputedStyle(document.querySelector('.tm2-artifact-backdrop')).visibility
  }));
  await page.screenshot({ path: path.join(outDir, 'desktop-threshold-logo.png') });

  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && location.hash === '#chamber-42', { timeout: 30000 });
  await page.waitForSelector('#tm2-artifact.open', { timeout: 30000 });
  await page.keyboard.press('Escape');
  const after = await logoState(page);
  await page.screenshot({ path: path.join(outDir, 'desktop-runtime-logo.png') });
  await context.close();

  const mobile = [];
  for (const [width, height] of [[320, 740], [360, 800], [412, 915]]) mobile.push(await mobileCheck(browser, width, height));

  const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
  const assertions = {
    releaseIdentity: version.version === '5.3.6' && version.build === '2026-08-16-v5.3.6-logo-visibility-cache-rotation',
    workerUpgrade: worker.controller.endsWith('/sw.js') && worker.active.endsWith('/sw.js') && worker.state === 'activated' && worker.revisionPresent && worker.priorRemoved,
    thresholdHeld: threshold.ready === false && threshold.inert === true && threshold.hidden === true && threshold.artifactVisibility === 'hidden',
    deepLinkPreserved: threshold.continueText === 'Continue at Chamber 42' && threshold.continueHref === '#chamber-42',
    logoLoads: before.responseOk && before.decoded && before.bytes > 10000,
    thresholdLogoVisible: before.panelWidth > 100 && before.panelHeight > 100 && before.panelBackground.includes('temple-global-logo.webp') && before.panelBackground.includes('icon-512.png'),
    runtimeLogoVisible: after.headerBackground.includes('temple-global-logo.webp') && after.headerBackground.includes('icon-512.png'),
    mobileThresholds: mobile.every((item) => !item.threshold.ready && item.threshold.inert && item.threshold.hidden && item.threshold.continueText === 'Continue at Chamber 42'),
    mobileLogoVisible: mobile.every((item) => item.logo.responseOk && item.logo.decoded && item.logo.panelWidth > 100 && item.logo.panelBackground.includes('temple-global-logo.webp')),
    mobileNoOverflow: mobile.every((item) => item.threshold.docWidth <= item.width + 1 && item.threshold.bodyWidth <= item.width + 1),
    noPageErrors: errors.length === 0 && mobile.every((item) => item.errors.length === 0)
  };
  const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
  const result = { ok: failedAssertions.length === 0, failedAssertions, assertions, version, worker, threshold, before, after, mobile, errors };
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
