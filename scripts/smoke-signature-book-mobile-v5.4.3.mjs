import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41793;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const outDir = path.resolve(root, 'work', 'signature-book-mobile-smoke');
fs.mkdirSync(outDir, { recursive: true });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function inspect(page, width) {
  await page.setViewportSize({ width, height: 860 });
  await page.evaluate(() => window.TempleMobileHardening?.refresh?.());
  await page.locator('.temple-signature-book').scrollIntoViewIfNeeded();
  await wait(180);

  return await page.evaluate(() => {
    const section = document.querySelector('.temple-signature-book');
    const card = section?.querySelector('.temple-signature-book__card');
    const layout = section?.querySelector('.temple-signature-book__layout');
    const form = section?.querySelector('form');
    const toolbar = section?.querySelector('.temple-signature-book__toolbar');
    const actions = section?.querySelector('.temple-signature-book__actions');
    const tableScroll = section?.querySelector('.temple-signature-book__table-scroll');
    const title = section?.querySelector('h3');
    const controls = form ? [...form.querySelectorAll('input, select, button')] : [];
    const actionControls = actions ? [...actions.querySelectorAll('input, button')] : [];
    const rect = (node) => {
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    const viewportWidth = document.documentElement.clientWidth;
    const inside = (node) => {
      if (!node) return false;
      const box = node.getBoundingClientRect();
      return box.left >= -1 && box.right <= viewportWidth + 1;
    };

    return {
      viewportWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      geometryFlag: section?.dataset.mobileGeometry || '',
      section: rect(section),
      card: rect(card),
      layout: rect(layout),
      toolbar: rect(toolbar),
      actions: rect(actions),
      tableScroll: rect(tableScroll),
      title: rect(title),
      sectionInside: inside(section),
      cardInside: inside(card),
      layoutInside: inside(layout),
      toolbarInside: inside(toolbar),
      actionsInside: inside(actions),
      tableViewportInside: inside(tableScroll),
      formControlsInside: controls.every(inside),
      actionControlsInside: actionControls.every(inside),
      tableIsLocallyScrollable: Boolean(tableScroll && tableScroll.scrollWidth > tableScroll.clientWidth && getComputedStyle(tableScroll).overflowX !== 'visible'),
      titleWraps: Boolean(title && getComputedStyle(title).whiteSpace !== 'nowrap'),
      semanticClassPresent: Boolean(section?.classList.contains('temple-signature-book')),
      hardeningVersion: section?.dataset.mobileLayout || '',
      labelsPresent: controls.filter((node) => node.matches('input,select')).every((node) => Boolean(node.getAttribute('aria-label') || node.getAttribute('aria-labelledby')))
    };
  });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 360, height: 860 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(`http://127.0.0.1:${port}/?signature_mobile_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('[data-temple-entry="explore"]', { timeout: 30000 });
    await page.evaluate(() => document.querySelector('[data-temple-entry="explore"]')?.click());
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => Boolean(document.querySelector('form input[placeholder="Seal Phrase"]')), null, { timeout: 30000 });
    await page.waitForFunction(() => Boolean(document.querySelector('.temple-signature-book')) && window.TempleMobileHardening, null, { timeout: 30000 });

    const widths = [320, 360, 412];
    const results = {};
    for (const width of widths) {
      results[width] = await inspect(page, width);
      await page.screenshot({ path: path.join(outDir, `signature-book-${width}.png`), fullPage: false });
    }

    const checks = Object.fromEntries(widths.map((width) => {
      const item = results[width];
      const passed = item.semanticClassPresent &&
        item.hardeningVersion === 'hardened-v5.4.3' &&
        item.documentScrollWidth <= width + 1 &&
        item.bodyScrollWidth <= width + 1 &&
        item.sectionInside && item.cardInside && item.layoutInside &&
        item.toolbarInside && item.actionsInside && item.tableViewportInside &&
        item.formControlsInside && item.actionControlsInside &&
        item.tableIsLocallyScrollable && item.titleWraps && item.labelsPresent;
      return [`viewport${width}`, passed];
    }));
    checks.noPageErrors = pageErrors.length === 0;

    const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
    const ok = failed.length === 0;
    console.log(JSON.stringify({ ok, failed, checks, results, pageErrors }, null, 2));
    await context.close();
    if (!ok) process.exitCode = 1;
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
  server.unref();
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
