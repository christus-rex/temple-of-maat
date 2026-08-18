import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = process.env.TEMPLE_LIVE_URL || '';
const port = 41786;
const base = live ? new URL(live) : new URL(`http://127.0.0.1:${port}/`);
const outDir = path.resolve(root, 'work', live ? 'deployed-verification' : 'chant-streaming-smoke');
fs.mkdirSync(outDir, { recursive: true });
const resultPath = path.join(outDir, live ? 'chant-streaming-v5.4-result.json' : 'result-v5.4.json');
const python = process.env.TEMPLE_PYTHON || 'python';
const server = live ? null : spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const opusSuffix = '/assets/audio/maat-forty-two-declarations.web.opus';
const isChantRequest = (url) => url.includes('maat-forty-two-declarations.web.opus');

function writeResult(result) {
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

async function enterTemple(page) {
  for (const selector of ['[data-temple-entry="journey"]', '[data-temple-entry="continue"]', '[data-temple-entry="explore"]']) {
    const node = page.locator(selector);
    if (await node.count()) {
      await node.first().click();
      await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
      return selector;
    }
  }
  throw new Error('No Temple entry control was available for chant verification.');
}

async function transportProbe(page) {
  return page.evaluate(async (src) => {
    const response = await fetch(src, {
      method: 'GET',
      headers: { Range: 'bytes=0-65535' },
      cache: 'no-store'
    });
    const bytes = await response.arrayBuffer();
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      contentRange: response.headers.get('content-range') || '',
      acceptRanges: response.headers.get('accept-ranges') || '',
      bytes: bytes.byteLength,
      url: response.url
    };
  }, `.${opusSuffix}`);
}

async function openChant(page) {
  const button = page.getByRole('button', { name: 'Chant', exact: true }).first();
  await button.waitFor({ state: 'visible', timeout: 30000 });
  await button.click();
  await page.waitForSelector('#tm524-chant:not([hidden])', { timeout: 30000 });
  await wait(350);
}

async function readChantState(page) {
  return page.evaluate(() => {
    const audio = document.querySelector('#tm524-chant audio');
    const buttons = [...document.querySelectorAll('#tm524-chant button')].map((node) => ({
      text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
      disabled: Boolean(node.disabled)
    }));
    const play = buttons.find((button) => /^play$/i.test(button.text));
    return {
      src: audio?.src || '',
      source: audio?.dataset.tm524StreamingFallback || '',
      autoplay: Boolean(audio?.autoplay || audio?.hasAttribute('autoplay')),
      paused: audio?.paused,
      readyState: audio?.readyState ?? null,
      durationSeconds: Number.isFinite(audio?.duration) ? audio.duration : null,
      status: document.querySelector('#tm524-chant .tm524-chant-status')?.textContent || '',
      playDisabled: play?.disabled ?? null,
      buttons,
      streamApi: Boolean(window.TempleChantStreaming),
      mediaVaultInstalled: window.TempleMediaVault?.installed?.() ?? null
    };
  });
}

async function optionalPlaybackProbe(page) {
  const result = { attempted: false, started: false, paused: false, stopped: false, error: '' };
  try {
    const play = page.getByRole('button', { name: 'Play', exact: true }).first();
    if (!await play.count()) return result;
    result.attempted = true;
    await play.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    result.started = await page.evaluate(() => document.querySelector('#tm524-chant audio')?.paused === false);
    const pause = page.getByRole('button', { name: 'Pause', exact: true }).first();
    if (await pause.count()) {
      await pause.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
      result.paused = await page.evaluate(() => document.querySelector('#tm524-chant audio')?.paused === true);
    }
    await play.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    const stop = page.getByRole('button', { name: 'Stop', exact: true }).first();
    if (await stop.count()) {
      await stop.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
      result.stopped = await page.evaluate(() => {
        const audio = document.querySelector('#tm524-chant audio');
        return Boolean(audio?.paused) && (audio?.currentTime || 0) < 0.2;
      });
    }
  } catch (error) {
    result.error = error?.message || String(error);
  }
  return result;
}

let browser = null;
let context = null;
let page = null;
const chantNetwork = [];
const pageErrors = [];
const consoleErrors = [];
let partial = { base: base.href, live: Boolean(live) };

try {
  if (server) await wait(900);
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', (request) => { if (isChantRequest(request.url())) chantNetwork.push({ phase: 'request', url: request.url() }); });
  page.on('requestfailed', (request) => { if (isChantRequest(request.url())) chantNetwork.push({ phase: 'failed', url: request.url(), error: request.failure()?.errorText || '' }); });
  page.on('response', (response) => { if (isChantRequest(response.url())) chantNetwork.push({ phase: 'response', url: response.url(), status: response.status(), contentType: response.headers()['content-type'] || '' }); });

  const url = new URL(`?chant_stream_smoke_v54=${Date.now()}`, base);
  await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.state && window.TempleMediaVault && window.TempleChantStreaming, null, { timeout: 45000 });

  const entrySelector = await enterTemple(page);
  partial.entrySelector = entrySelector;
  const transport = await transportProbe(page);
  partial.transport = transport;

  await openChant(page);
  const forcedEnsure = await page.evaluate(() => window.TempleChantStreaming?.ensure?.('Deployed chant verification requested web source…', { force: true }) === true);
  partial.forcedEnsure = forcedEnsure;
  await page.waitForFunction((suffix) => {
    const audio = document.querySelector('#tm524-chant audio');
    const play = [...document.querySelectorAll('#tm524-chant button')].find((node) => /^play$/i.test((node.textContent || '').trim()));
    return Boolean(audio?.src?.endsWith(suffix) && audio.dataset.tm524StreamingFallback === 'web' && play && !play.disabled);
  }, opusSuffix, { timeout: 45000 });

  const ready = await readChantState(page);
  partial.ready = ready;
  const playback = await optionalPlaybackProbe(page);
  partial.playback = playback;

  let screenshotCaptured = false;
  try {
    await page.screenshot({ path: path.join(outDir, live ? 'deployed-chant-streaming-v5.4.png' : 'chant-streaming-v5.4.png'), fullPage: false, timeout: 10000 });
    screenshotCaptured = true;
  } catch (error) {
    partial.screenshotError = error?.message || String(error);
  }

  const transportOk = transport.ok && [200, 206].includes(transport.status) && transport.bytes > 0 && /audio\/(?:ogg|opus)|application\/ogg/i.test(transport.contentType);
  const sourceOk = ready.src.endsWith(opusSuffix) && ready.source === 'web';
  const controlsPresent = ['Play', 'Pause', 'Stop'].every((name) => ready.buttons.some((button) => button.text === name));
  const localPlaybackOk = live ? true : playback.attempted && playback.started && playback.paused && playback.stopped;
  const assertions = {
    transportOk,
    forcedEnsureAvailable: forcedEnsure,
    webSource: sourceOk,
    playEnabled: ready.playDisabled === false,
    controlsPresent,
    noAutoplay: ready.autoplay === false,
    noPageErrors: pageErrors.length === 0,
    localPlaybackControls: localPlaybackOk
  };
  const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
  const result = {
    ok: failedAssertions.length === 0,
    failedAssertions,
    assertions,
    ...partial,
    chantNetwork,
    screenshotCaptured,
    pageErrors,
    consoleErrors,
    note: live ? 'Deployed gate validates HTTP transport, canonical Opus source assignment, enabled controls, and error-free UI. Headless audio-device playback is diagnostic only.' : 'Local smoke also requires Play/Pause/Stop playback behavior.'
  };
  writeResult(result);
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  const result = {
    ok: false,
    failedAssertions: ['fatalError'],
    assertions: {},
    ...partial,
    fatalError: error?.stack || error?.message || String(error),
    chantNetwork,
    pageErrors,
    consoleErrors
  };
  writeResult(result);
  process.exitCode = 1;
} finally {
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server) {
    server.kill();
    server.unref();
  }
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
