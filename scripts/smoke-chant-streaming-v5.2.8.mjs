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

try {
  if (server) await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    const url = new URL(`?chant_stream_smoke=${Date.now()}`, base);
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TempleMediaVault?.version === '5.2.5', { timeout: 45000 });

    await page.locator('[data-temple-entry="journey"]').click();
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), { timeout: 30000 });
    await page.getByRole('button', { name: 'Chant' }).click();
    await page.waitForSelector('#tm524-chant:not([hidden])', { timeout: 30000 });
    await page.waitForFunction(() => {
      const audio = document.querySelector('#tm524-chant audio');
      const play = [...document.querySelectorAll('#tm524-chant button')].find((node) => /^play$/i.test(node.textContent.trim()));
      return audio?.src?.endsWith('/assets/audio/maat-forty-two-declarations.web.opus') &&
        audio.dataset.tm524StreamingFallback === 'web' &&
        audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 1000 && play && !play.disabled;
    }, { timeout: 45000 });

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
    }, { timeout: 15000 });
    await wait(350);
    const playing = await page.evaluate(() => {
      const audio = document.querySelector('#tm524-chant audio');
      return { paused: audio?.paused, currentTime: audio?.currentTime || 0 };
    });

    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await page.evaluate(() => document.querySelector('#tm524-chant audio')?.paused === true);

    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('#tm524-chant audio')?.paused, { timeout: 15000 });
    await page.getByRole('button', { name: 'Stop', exact: true }).click();
    const stopped = await page.evaluate(() => {
      const audio = document.querySelector('#tm524-chant audio');
      return { paused: audio?.paused, currentTime: audio?.currentTime || 0 };
    });

    await page.screenshot({ path: path.join(outDir, live ? 'deployed-chant-streaming.png' : 'chant-streaming.png'), fullPage: false });

    const assertions = {
      webSource: ready.src.endsWith('/assets/audio/maat-forty-two-declarations.web.opus') && ready.source === 'web',
      webMetadata: ready.readyState >= 1 && ready.duration > 1012 && ready.duration < 1014,
      noAutoplay: ready.autoplay === false && ready.paused === true,
      canonicalStillOptional: ready.installed === false,
      playEnabled: ready.playDisabled === false,
      userGesturePlayback: playing.paused === false,
      pauseWorks: paused === true,
      stopWorks: stopped.paused === true && stopped.currentTime < 0.15,
      noPageErrors: pageErrors.length === 0
    };
    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    const ok = failedAssertions.length === 0;
    console.log(JSON.stringify({ ok, base: base.href, failedAssertions, assertions, ready, playing, paused, stopped, pageErrors }, null, 2));
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
