import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = new URL(process.env.TEMPLE_LIVE_URL || 'https://christus-rex.github.io/temple-of-maat/');
const outDir = path.resolve(process.cwd(), 'work', 'deployed-verification');
fs.mkdirSync(outDir, { recursive: true });
const widths = [[1280, 900], [320, 740], [360, 800], [412, 915], [430, 932], [768, 1024]];

function classify(url) {
  try {
    return new URL(url).origin === base.origin ? 'same-origin' : 'external';
  } catch {
    return 'unknown';
  }
}

function isBenignMediaAbort(item) {
  return item.scope === 'same-origin' && item.resourceType === 'media' && /net::ERR_ABORTED/i.test(item.error || '');
}

function isNavigationRace(error) {
  return /execution context was destroyed|navigation|net::ERR_ABORTED/i.test(error?.message || String(error || ''));
}

async function waitForTempleReady(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await page.waitForFunction(
    () => window.TempleLivingCodex?.records?.().length === 72 && window.TempleLibrary?.open,
    null,
    { timeout: 45000 }
  );
}

async function enterTemple(page) {
  const entry = page.locator('[data-temple-entry="continue"]');
  await entry.waitFor({ state: 'visible', timeout: 15000 });
  await entry.click({ timeout: 15000 });
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 15000 });
}

const browser = await chromium.launch({ headless: true });
const reports = [];
try {
  for (const [width, height] of widths) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width <= 768, hasTouch: width <= 768 });
    await context.addInitScript(() => localStorage.setItem('temple_last_chamber', '13'));
    const page = await context.newPage();
    const responses = [];
    const requestFailures = [];
    const pageErrors = [];
    const consoleErrors = [];
    const successfulDocuments = [];

    page.on('response', (response) => {
      if (response.request().resourceType() === 'document' && response.status() >= 200 && response.status() < 400) {
        successfulDocuments.push({ status: response.status(), url: response.url() });
      }
      if (response.status() < 400) return;
      responses.push({
        status: response.status(),
        url: response.url(),
        scope: classify(response.url()),
        resourceType: response.request().resourceType(),
        method: response.request().method()
      });
    });
    page.on('requestfailed', (request) => {
      requestFailures.push({
        url: request.url(),
        scope: classify(request.url()),
        resourceType: request.resourceType(),
        method: request.method(),
        error: request.failure()?.errorText || ''
      });
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push({ text: message.text(), location: message.location() });
    });

    let navigationError = '';
    let navigationRecovered = false;
    const url = new URL(`?network_diag=${width}-${Date.now()}#chamber-13`, base);
    try {
      await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await waitForTempleReady(page);
      await page.waitForTimeout(900);
      await enterTemple(page);
      await page.waitForTimeout(900);
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
    } catch (error) {
      if (isNavigationRace(error)) {
        try {
          await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
          await waitForTempleReady(page);
          await enterTemple(page);
          await page.waitForTimeout(900);
          navigationRecovered = true;
        } catch (retryError) {
          navigationError = retryError?.message || String(retryError);
        }
      } else {
        navigationError = error?.message || String(error);
      }
    }

    const currentUrl = page.url();
    const finalSameOrigin = classify(currentUrl) === 'same-origin';
    const finalReady = await page.evaluate(() => ({
      codex: window.TempleLivingCodex?.records?.().length === 72,
      library: Boolean(window.TempleLibrary?.open),
      entered: document.body.classList.contains('temple-app-ready')
    })).catch(() => ({ codex: false, library: false, entered: false }));
    if (!navigationError && finalSameOrigin && finalReady.codex && finalReady.library && finalReady.entered && successfulDocuments.length > 0) {
      navigationRecovered = navigationRecovered || requestFailures.some((item) => item.resourceType === 'document' && /net::ERR_ABORTED/i.test(item.error || ''));
    }

    reports.push({ width, height, navigationError, navigationRecovered, currentUrl, successfulDocuments, finalReady, responses, requestFailures, pageErrors, consoleErrors });
    await context.close();
  }
} finally {
  await browser.close();
}

const allResponses = reports.flatMap((report) => report.responses.map((item) => ({ width: report.width, ...item })));
const allFailures = reports.flatMap((report) => report.requestFailures.map((item) => ({ width: report.width, ...item })));
const sameOriginHttpErrors = allResponses.filter((item) => item.scope === 'same-origin');
const benignAbortedMedia = allFailures.filter(isBenignMediaAbort);
const recoveredWidths = new Set(reports.filter((report) => report.navigationRecovered && !report.navigationError && report.finalReady?.entered).map((report) => report.width));
const benignRecoveredNavigationAborts = allFailures.filter((item) =>
  item.scope === 'same-origin' &&
  item.resourceType === 'document' &&
  /net::ERR_ABORTED/i.test(item.error || '') &&
  recoveredWidths.has(item.width)
);
const sameOriginRequestFailures = allFailures.filter((item) =>
  item.scope === 'same-origin' &&
  !isBenignMediaAbort(item) &&
  !benignRecoveredNavigationAborts.includes(item)
);
const externalHttpErrors = allResponses.filter((item) => item.scope === 'external');
const externalRequestFailures = allFailures.filter((item) => item.scope === 'external');
const navigationErrors = reports.filter((report) => report.navigationError).map((report) => ({ width: report.width, error: report.navigationError }));
const pageErrors = reports.flatMap((report) => report.pageErrors.map((error) => ({ width: report.width, error })));

const result = {
  ok: sameOriginHttpErrors.length === 0 && sameOriginRequestFailures.length === 0 && navigationErrors.length === 0 && pageErrors.length === 0,
  base: base.href,
  sameOriginHttpErrors,
  sameOriginRequestFailures,
  benignAbortedMedia,
  benignRecoveredNavigationAborts,
  externalHttpErrors,
  externalRequestFailures,
  navigationErrors,
  pageErrors,
  reports
};
fs.writeFileSync(path.join(outDir, 'network-diagnostics.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  ok: result.ok,
  sameOriginHttpErrors: sameOriginHttpErrors.length,
  sameOriginRequestFailures: sameOriginRequestFailures.length,
  benignAbortedMedia: benignAbortedMedia.length,
  benignRecoveredNavigationAborts: benignRecoveredNavigationAborts.length,
  externalHttpErrors: externalHttpErrors.length,
  externalRequestFailures: externalRequestFailures.length,
  navigationErrors: navigationErrors.length,
  pageErrors: pageErrors.length
}, null, 2));
if (!result.ok) process.exitCode = 1;
