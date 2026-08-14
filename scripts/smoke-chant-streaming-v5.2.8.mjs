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
const python = process.env.TEMPLE_PYTHON || 'python';
const server = live ? null : spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isChantRequest = (url) => url.includes('maat-forty-two-declarations.web.opus');

try {
  if (server) await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    const chantNetwork = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => { if (isChantRequest(request.url())) chantNetwork.push({ phase: 'request', url: request.url() }); });
    page.on('requestfailed', (request) => { if (isChantRequest(request.url())) chantNetwork.push({ phase: 'failed', url: request.url(), error: request.failure()?.errorText || '' }); });
    page.on('response', (response) => { if (isChantRequest(response.url())) chantNetwork.push({ phase: 'response', url: response.url(), status: response.status(), contentType: response.headers()['content-type'] || '' }); });

    const url = new URL(`?chant_stream_smoke=${Date.now()}`, base);
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5' && window.TempleMediaVault?.version === '5.2.5', null, { timeout: 45000 });

    await page.locator('[data-temple-entry="journey"]').click();
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => location.hash === '#chamber-01', null, { timeout: 30000 });
    await page.waitForFunction(() => window.TemplePilgrimJourney.state().visited.includes(1), null, { timeout: 30000 });

    await page.getByRole('button', { name: 'Chant' }).click();
    await page.waitForSelector('#tm524-chant:not([hidden])', { timeout: 30000 });
    await wait(400);

    const preEnsure = await page.evaluate(() => {
      const audio = document.querySelector('#tm524-chant audio');
      return {
        chantHidden: document.getElementById('tm524-chant')?.hidden,
        srcAttr: audio?.getAttribute('src') || '',
        src: audio?.src || '',
        streamingMarker: audio?.dataset.tm524StreamingFallback || '',
        canonicalMarker: audio?.dataset.tm525MediaVault || '',
        installed: window.TempleMediaVault?.installed?.(),
        streamApi: Boolean(window.TempleChantStreaming),
        usingWeb: window.TempleChantStreaming?.usingWebSource?.(),
        readyState: audio?.readyState,
        duration: audio?.duration,
        status: document.querySelector('#tm524-chant .tm524-chant-status')?.textContent || ''
      };
    });
    const uiTriggerAssigned = preEnsure.src.endsWith('/assets/audio/maat-forty-two-declarations.web.opus') && preEnsure.streamingMarker === 'web';
    const forcedEnsure = await page.evaluate(() => window.TempleChantStreaming?.ensure?.('Smoke requested web chant source…', { force: true }) === true);
    console.log('CHANT_PRESTREAM', JSON.stringify({ preEnsure, forcedEnsure, chantNetwork }, null, 2));

    await page.waitForFunction(() => {
      const audio = document.querySelector('#tm524-chant audio');
      const play = [...document.querySelectorAll('#tm524-chant button')].find((node) => /^play$/i.test(node.textContent.trim()));
      return audio?.src?.endsWith('/assets/audio/maat-forty-two-declarations.web.opus') &&
        audio.dataset.tm524StreamingFallback === 'web' && audio.readyState >= 1 && play && !play.disabled;
    }, null, { timeout: 45000 });

    const ready = await page.evaluate(() => {
      const audio = document.querySelector('#tm524-chant audio');
      const play = [...document.querySelectorAll('#tm524-chant button')].find((node) => /^play$/i.test(node.textContent.trim()));
      return {
        installed: window.TempleMediaVault.installed(),
        src: audio?.src || '',
        source: audio?.dataset.tm524StreamingFallback || '',
        autoplay: Boolean(audio?.autoplay || audio?.hasAttribute('autoplay')),
        paused: audio?.paused,
        duration: audio?.duration,
        readyState: audio?.readyState,
        playDisabled: play?.disabled,
        status: document.querySelector('#tm524-chant .tm524-chant-status')?.textContent || ''
      };
    });

    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => {
      const audio = document.querySelector('#tm524-chant audio');
      return audio && !audio.paused;
    }, null, { timeout: 15000 });
    await wait(350);
    const playing = await page.evaluate(() => {
      const audio = document.querySelector('#tm524-chant audio');
      return { paused: audio?.paused, currentTime: audio?.currentTime || 0 };
    });

    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await page.evaluate(() => document.querySelector('#tm524-chant audio')?.paused === true);

    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('#tm524-chant audio')?.paused, null, { timeout: 15000 });
    await page.getByRole('button', { name: 'Stop', exact: true }).click();
    const stopped = await page.evaluate(() => {
      const audio = document.querySelector('#tm524-chant audio');
      return { paused: audio?.paused, currentTime: audio?.currentTime || 0 };
    });

    await page.screenshot({ path: path.join(outDir, live ? 'deployed-chant-streaming.png' : 'chant-streaming.png'), fullPage: false });

    const durationValid = Number.isFinite(ready.duration)
      ? ready.duration > 1012 && ready.duration < 1014
      : !live && ready.duration === Infinity;
    const assertions = {
      uiTriggerAssigned,
      forcedEnsureAvailable: forcedEnsure,
      webSource: ready.src.endsWith('/assets/audio/maat-forty-two-declarations.web.opus') && ready.source === 'web',
      webMetadata: ready.readyState >= 1 && durationValid,
      noAutoplay: ready.autoplay === false && ready.paused === true,
      canonicalStillOptional: ready.installed === false,
      playEnabled: ready.playDisabled === false,
      userGesturePlayback: playing.paused === false,
      pauseWorks: paused === true,
      stopWorks: stopped.paused === true && stopped.currentTime < 0.15,
      networkResponse: chantNetwork.some((entry) => entry.phase === 'response' && entry.status >= 200 && entry.status < 300),
      noPageErrors: pageErrors.length === 0
    };
    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    const ok = failedAssertions.length === 0;
    console.log(JSON.stringify({ ok, base: base.href, failedAssertions, assertions, preEnsure, forcedEnsure, ready, playing, paused, stopped, chantNetwork, pageErrors }, null, 2));
    await context.close();
    if (!ok) process.exitCode = 1;
  } finally {
    await browser.close();
  }
} finally {
  if (server) {
    server.kill();
    server.unref();
  }
}
