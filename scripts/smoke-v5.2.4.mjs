import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41784;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function silentWav(durationSeconds = 0.25, sampleRate = 8000) {
  const samples = Math.floor(durationSeconds * sampleRate);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

try {
  await wait(900);
  const launchOptions = { headless: true };
  if (process.env.TEMPLE_BROWSER_PATH) launchOptions.executablePath = process.env.TEMPLE_BROWSER_PATH;
  else if (process.platform === 'win32') launchOptions.executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => localStorage.setItem('temple_last_chamber', '42'));
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72, { timeout: 30000 });

  const beforeEntry = await page.evaluate(() => ({
    appReady: document.body.classList.contains('temple-app-ready'),
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
    rootHiddenFromAT: document.getElementById('root')?.getAttribute('aria-hidden') === 'true',
    dockDisplay: getComputedStyle(document.getElementById('tm524-dock')).display,
    continueText: document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim(),
    continueHref: document.querySelector('[data-temple-entry="continue"]')?.getAttribute('href')
  }));

  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'));
  await page.waitForFunction(() => location.hash === '#chamber-42');

  const record = await page.evaluate(() => {
    const item = window.TempleLivingCodex.record(13);
    return {
      total: window.TempleLivingCodex.records().length,
      hebrew: item?.hebrewTriplet,
      angel: item?.angel,
      twin: item?.gematriaTwin?.daemon,
      strength: item?.gematriaTwin?.strength,
      exactCiphers: item?.gematriaTwin?.exactCiphers?.join(',')
    };
  });

  await page.evaluate(() => window.TempleLivingCodex.open(13));
  await page.waitForSelector('#tm524-codex:not([hidden]) #tm524-record-detail');
  const codexText = await page.locator('#tm524-record-detail').innerText();
  const sourceDetail = await page.locator('#tm524-record-detail .tm524-details').innerText();

  await page.keyboard.press('Escape');
  await page.evaluate(() => window.TempleLivingCodex.openVault(42));
  await page.waitForSelector('#tm524-vault:not([hidden])');
  const vaultLabels = await page.locator('#tm524-vault .tm524-collectible').allTextContents();

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Chant' }).click();
  await page.waitForSelector('#tm524-chant:not([hidden])');
  const audioState = await page.evaluate(() => {
    const audio = document.querySelector('#tm524-chant audio');
    const input = document.querySelector('#tm524-chant input[type="file"]');
    return {
      autoplay: audio?.autoplay,
      hasAutoplayAttribute: audio?.hasAttribute('autoplay'),
      preload: audio?.preload,
      paused: audio?.paused,
      localInput: Boolean(input),
      localAccept: input?.getAttribute('accept') || ''
    };
  });

  await page.locator('#tm524-chant input[type="file"]').setInputFiles({
    name: 'maat-local-smoke.wav',
    mimeType: 'audio/wav',
    buffer: silentWav()
  });
  await page.waitForFunction(() => document.querySelector('#tm524-chant audio')?.src?.startsWith('blob:'));
  await page.waitForFunction(() => /Local chant loaded: maat-local-smoke\.wav|Ready\. Awaiting your command\./.test(document.querySelector('.tm524-chant-status')?.textContent || ''));
  const localAudioState = await page.evaluate(() => ({
    srcIsBlob: document.querySelector('#tm524-chant audio')?.src?.startsWith('blob:'),
    paused: document.querySelector('#tm524-chant audio')?.paused,
    status: document.querySelector('.tm524-chant-status')?.textContent || ''
  }));

  const ok =
    beforeEntry.appReady === false &&
    beforeEntry.rootInert === true &&
    beforeEntry.rootHiddenFromAT === true &&
    beforeEntry.dockDisplay === 'none' &&
    beforeEntry.continueText === 'Continue at Chamber 42' &&
    beforeEntry.continueHref === '#chamber-42' &&
    record.total === 72 &&
    record.hebrew === 'יזל' &&
    record.angel === 'Iezalel' &&
    record.twin === 'Focalor' &&
    record.strength === 'Tetrad exact' &&
    record.exactCiphers === 'EO,FR,RO,RFR' &&
    codexText.includes('Iezalel') &&
    codexText.includes('Focalor') &&
    codexText.includes('Tetrad exact') &&
    sourceDetail.includes('Reversal, not gematria, creates the 72.') &&
    ['Seal PNG', 'Plate PNG', 'Wallpaper 1440×2560', 'Parental Powers Wallpaper 3840×2160', 'Living Codex Record JSON'].every((label) => vaultLabels.includes(label)) &&
    audioState.autoplay === false &&
    audioState.hasAutoplayAttribute === false &&
    audioState.preload === 'metadata' &&
    audioState.paused === true &&
    audioState.localInput === true &&
    audioState.localAccept.includes('audio/') &&
    localAudioState.srcIsBlob === true &&
    localAudioState.paused === true &&
    pageErrors.length === 0;

  console.log(JSON.stringify({ ok, beforeEntry, record, vaultLabels, audioState, localAudioState, pageErrors }, null, 2));
  await browser.close();
  if (!ok) process.exitCode = 1;
} finally {
  server.kill();
  server.unref();
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
