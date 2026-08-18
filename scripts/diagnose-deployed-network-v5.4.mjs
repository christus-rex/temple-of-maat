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

    page.on('response', (response) => {
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
    try {
      const url = new URL(`?network_diag=${width}-${Date.now()}#chamber-13`, base);
      await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TempleLibrary?.open, null, { timeout: 45000 });
      await page.waitForTimeout(1200);
      await page.evaluate(() => document.querySelector('[data-temple-entry="continue"]')?.click());
      await page.waitForTimeout(1200);
    } catch (error) {
      navigationError = error?.message || String(error);
    }

    reports.push({ width, height, navigationError, responses, requestFailures, pageErrors, consoleErrors });
    await context.close();
  }
} finally {
  await browser.close();
}

const allResponses = reports.flatMap((report) => report.responses.map((item) => ({ width: report.width, ...item })));
const allFailures = reports.flatMap((report) => report.requestFailures.map((item) => ({ width: report.width, ...item })));
const sameOriginHttpErrors = allResponses.filter((item) => item.scope === 'same-origin');
const benignAbortedMedia = allFailures.filter(isBenignMediaAbort);
const sameOriginRequestFailures = allFailures.filter((item) => item.scope === 'same-origin' && !isBenignMediaAbort(item));
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
  externalHttpErrors: externalHttpErrors.length,
  externalRequestFailures: externalRequestFailures.length,
  navigationErrors: navigationErrors.length,
  pageErrors: pageErrors.length
}, null, 2));
if (!result.ok) process.exitCode = 1;
