import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');

const BASE_URL = process.env.TEMPLE_LIVE_URL || 'https://christus-rex.github.io/temple-of-maat/';
const outDir = path.resolve(process.cwd(), 'work', 'wallpaper-live');
fs.mkdirSync(outDir, { recursive: true });

const profiles = [
  {
    name: 'desktop',
    viewport: { width: 1440, height: 1100 },
  },
  {
    name: 'android-mobile',
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 17; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2.625,
  },
];

async function downloadAndInspect(page, locator, filename) {
  const target = path.join(outDir, filename);
  const started = Date.now();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 120000 }),
    locator.click({ timeout: 30000 }),
  ]);
  await download.saveAs(target);
  const metadata = await sharp(target).metadata();
  return {
    suggestedFilename: download.suggestedFilename(),
    bytes: fs.statSync(target).size,
    dimensions: `${metadata.width}x${metadata.height}`,
    elapsedMs: Date.now() - started,
  };
}

function attachDiagnostics(page, errors) {
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    const url = request.url();
    const errorText = request.failure()?.errorText || '';
    if (url.includes('/assets/audio/maat-forty-two-declarations.mp3') && errorText.includes('ERR_ABORTED')) return;
    // The diagnostic intentionally replaces its first page after service-worker
    // activation. Chromium may report that deliberate top-level diagnostic request
    // as aborted even though the replacement page is then fully controlled.
    if (url.includes('wallpaper_diag=') && errorText.includes('ERR_ABORTED') && request.isNavigationRequest()) return;
    errors.push(`requestfailed: ${url} :: ${errorText}`);
  });
  page.on('dialog', async (dialog) => {
    errors.push(`dialog:${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss();
  });
}

async function enterAndOpenChamber(page) {
  await page.goto(`${BASE_URL}?wallpaper_diag=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('[data-temple-entry="guided"]', { timeout: 30000 });
  await page.locator('[data-temple-entry="guided"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), { timeout: 30000 });
  await page.waitForSelector('#tm2-artifact.open .tm2-wallpaper', { timeout: 30000 });
  await page.waitForFunction(() => {
    const artifact = document.querySelector('#tm2-artifact.open');
    const image = artifact?.querySelector('.tm2-parental-section img');
    if (!artifact || !image?.complete || image.naturalWidth < 900 || image.naturalHeight < 500) return false;
    const style = getComputedStyle(artifact);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }, { timeout: 30000 });
}

async function runProfile(browser, profile) {
  const context = await browser.newContext(profile);
  let page = await context.newPage();
  const errors = [];
  attachDiagnostics(page, errors);

  await enterAndOpenChamber(page);

  const version = await page.evaluate(async () => {
    const response = await fetch(`./version.json?diag=${Date.now()}`, { cache: 'no-store' });
    return response.ok ? response.json() : null;
  });

  const swBefore = await page.evaluate(() => ({
    supported: 'serviceWorker' in navigator,
    controlled: Boolean(navigator.serviceWorker?.controller),
  }));

  if (swBefore.supported) {
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    // A controllerchange can replace/abort the currently loaded frame on the deployed PWA.
    // Open a fresh page in the same context instead of forcing page.reload().
    await page.close();
    page = await context.newPage();
    attachDiagnostics(page, errors);
    await enterAndOpenChamber(page);
  }

  const swAfter = await page.evaluate(() => ({
    controlled: Boolean(navigator.serviceWorker?.controller),
    controllerUrl: navigator.serviceWorker?.controller?.scriptURL || null,
  }));

  const state = await page.evaluate(() => ({
    chamberWallpaperButton: Boolean(document.querySelector('#tm2-artifact.open .tm2-wallpaper')),
    parentalWallpaperButton: Boolean(document.querySelector('#tm2-artifact.open .tm2-parental-download')),
    vaultApi: Boolean(window.TempleLivingCodex?.openVault),
    artifactOpen: Boolean(document.querySelector('#tm2-artifact.open')),
  }));

  const directChamber = await downloadAndInspect(
    page,
    page.locator('#tm2-artifact.open .tm2-wallpaper'),
    `${profile.name}-direct-chamber.png`,
  );

  const directParental = await downloadAndInspect(
    page,
    page.locator('#tm2-artifact.open .tm2-parental-download'),
    `${profile.name}-direct-parental.png`,
  );

  let vaultChamber = null;
  let vaultParental = null;
  if (state.vaultApi) {
    await page.evaluate(() => window.TempleLivingCodex.openVault(1));
    const vault = page.locator('#tm524-vault:not([hidden])');
    await vault.waitFor({ state: 'visible', timeout: 10000 });
    const chamberButton = vault.getByRole('button', { name: 'Wallpaper 1440×2560', exact: true });
    const parentalButton = vault.getByRole('button', { name: 'Parental Powers Wallpaper 3840×2160', exact: true });
    vaultChamber = await downloadAndInspect(page, chamberButton, `${profile.name}-vault-chamber.png`);
    vaultParental = await downloadAndInspect(page, parentalButton, `${profile.name}-vault-parental.png`);
  }

  const result = {
    profile: profile.name,
    version,
    swBefore,
    swAfter,
    state,
    directChamber,
    directParental,
    vaultChamber,
    vaultParental,
    errors,
  };

  result.ok =
    version?.version === '5.2.7' &&
    state.chamberWallpaperButton &&
    state.parentalWallpaperButton &&
    directChamber.dimensions === '1440x2560' &&
    directParental.dimensions === '3840x2160' &&
    (!vaultChamber || vaultChamber.dimensions === '1440x2560') &&
    (!vaultParental || vaultParental.dimensions === '3840x2160') &&
    errors.length === 0;

  await context.close();
  return result;
}

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const profile of profiles) results.push(await runProfile(browser, profile));
} finally {
  await browser.close();
}

const ok = results.every((result) => result.ok);
console.log(JSON.stringify({ ok, baseUrl: BASE_URL, results }, null, 2));
if (!ok) process.exitCode = 1;
