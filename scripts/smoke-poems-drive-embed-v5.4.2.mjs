import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41792;
const python = process.env.TEMPLE_PYTHON || 'python3';
const server = spawn(python, ['-m','http.server',String(port),'--bind','127.0.0.1'], { cwd: root, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}/`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function enter(page) {
  await page.waitForSelector('[data-temple-entry="guided"]', { timeout: 30000 });
  await page.locator('[data-temple-entry="guided"]').click();
  await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), { timeout: 15000 });
  await page.waitForFunction(() => window.TemplePoemsDriveEmbed?.version === '5.4.2', { timeout: 15000 });
}

async function openPoems(page) {
  await page.waitForSelector('[data-poems-chamber="floating"]', { timeout: 15000 });
  // The Temple may already have a chamber artifact open; dispatch the gateway activation
  // directly so this smoke test stays focused on Poems Chamber rendering and Drive embeds.
  await page.locator('[data-poems-chamber="floating"]').evaluate((node) => node.click());
  await page.waitForSelector('#temple-poems-backdrop.open', { timeout: 15000 });
}

async function inspectPoems(page) {
  return page.evaluate(() => {
    const pdfLinks = [...document.querySelectorAll('.temple-poem-link')].map((a) => a.href);
    return {
      api: window.TemplePoemsDriveEmbed,
      poemCards: document.querySelectorAll('.temple-poem-card').length,
      pdfLinks,
      oldPdfIdsPresent: /1W9UysgGzcmLd0GTMdXFwl2llaHgLa-QZ|1TQQuig2D1xKooMBj_J8aXVK2B8aHvkZ-|1X8_qFOHaZwbL7STgoE_ZUNtMkxeV7_wX|1rArvpXPzK49JpqTQYxuOAOIVY-9DgVFw|1hYyV7fTqtUrK4Q268ksfVHDlglB0dH9m/.test(pdfLinks.join(' ')),
      vaultAction: [...document.querySelectorAll('.temple-poems-action')].some((a) => a.href.includes('1CH3y554nm5r8kMTHLkSiwtlkrN83OPsN')),
      manifestAction: [...document.querySelectorAll('.temple-poems-action')].some((a) => a.href.includes('1GVH9AR9mVUCPTt7osFFrySIOL30RaGs4-mGNnzFJYPg'))
    };
  });
}

async function inspectGallery(page) {
  await page.getByRole('button', { name: 'Depictions' }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-depiction-grid] .temple-depiction-card').length === 31, { timeout: 15000 });
  const gallery = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-depiction-grid] .temple-depiction-card')];
    const hrefs = cards.flatMap((card) => [...card.querySelectorAll('a[href]')].map((a) => a.href));
    const srcs = cards.map((card) => card.querySelector('img')?.src || '');
    return {
      count: cards.length,
      extras: cards.filter((card) => card.dataset.pcVaultExtra === 'true').length,
      hardened: cards.filter((card) => card.querySelector('img')?.dataset.pcDriveHardened === 'true').length,
      oldIdPresent: /1P89m1HQc1W1aHePSjZYiXHa620SjD6nr|1tI94spgafTI5BJygNkOaiZ6RnIn_9qpK|1aWQwfGxoqd-sT1E2xgSSHF34cSJt50VD/.test(hrefs.join(' ') + srcs.join(' ')),
      newFirstPresent: hrefs.some((href) => href.includes('1Tikf1KUqakWLo0BA2xnWabkWaPoXIwtD')),
      newZenPresent: hrefs.some((href) => href.includes('15UrlAVwK-_Gc1rFmZDBepjVY6sbNji3s')),
      newShemPresent: hrefs.some((href) => href.includes('1ozRmQXqVtv2fLwWpKu8YjjtbFnD_W_Sy')),
      copyMentions31: [...document.querySelectorAll('.temple-poems-section-copy')].some((node) => /Thirty-one|31/.test(node.textContent || ''))
    };
  });

  await page.locator('.temple-poems-search').fill('Nemamiah');
  await page.waitForTimeout(100);
  const visibleAfterSearch = await page.locator('[data-depiction-grid] .temple-depiction-card:not([hidden])').count();
  if (visibleAfterSearch !== 1) throw new Error(`Gallery search expected 1 Nemamiah result, got ${visibleAfterSearch}`);
  await page.locator('.temple-poems-search').fill('');

  const fallbackState = await page.evaluate(() => {
    const img = document.querySelector('[data-pc-vault-extra] img');
    if (!img) return null;
    img.dispatchEvent(new Event('error'));
    const first = { stage: img.dataset.pcFallbackStage, src: img.src };
    img.dispatchEvent(new Event('error'));
    const note = img.closest('.temple-depiction-media')?.querySelector('.temple-drive-preview-fallback');
    return { first, hidden: img.hidden, note: note?.textContent || '' };
  });

  return { ...gallery, visibleAfterSearch, fallbackState };
}

async function mobileCheck(page) {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.waitForTimeout(120);
  return page.evaluate(() => ({
    width: innerWidth,
    doc: document.documentElement.scrollWidth,
    shell: document.querySelector('.temple-poems-shell')?.scrollWidth || 0,
    count: document.querySelectorAll('[data-depiction-grid] .temple-depiction-card').length,
    gatewayBottom: getComputedStyle(document.querySelector('[data-poems-chamber="floating"]')).bottom
  }));
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await enter(page);
  await openPoems(page);

  const poems = await inspectPoems(page);
  if (poems.poemCards !== 5 || poems.oldPdfIdsPresent || !poems.vaultAction || !poems.manifestAction) throw new Error(`Poems Drive remap failed: ${JSON.stringify(poems)}`);
  if (poems.api?.canonicalDepictionCount !== 31 || poems.api?.canonicalPoemPdfCount !== 5) throw new Error(`Drive embed API counts drifted: ${JSON.stringify(poems.api)}`);

  const gallery = await inspectGallery(page);
  if (gallery.count !== 31 || gallery.extras !== 10 || gallery.hardened !== 31 || gallery.oldIdPresent || !gallery.newFirstPresent || !gallery.newZenPresent || !gallery.newShemPresent || !gallery.copyMentions31) throw new Error(`Gallery remap failed: ${JSON.stringify(gallery)}`);
  if (gallery.fallbackState?.first?.stage !== 'direct' || !gallery.fallbackState?.first?.src?.includes('uc?export=view') || !gallery.fallbackState?.hidden || !/High-resolution source preserved/.test(gallery.fallbackState?.note || '')) throw new Error(`Fallback behavior failed: ${JSON.stringify(gallery.fallbackState)}`);

  const mobile = await mobileCheck(page);
  if (mobile.doc > mobile.width + 1 || mobile.shell > mobile.width + 1 || mobile.count !== 31) throw new Error(`Mobile Poems Chamber overflow/count failure: ${JSON.stringify(mobile)}`);

  await context.close();
  await browser.close();
  const result = { ok: errors.length === 0, poems, gallery, mobile, pageErrors: errors };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} finally {
  server.kill();
  server.unref();
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
