import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41788;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.resolve(root, 'work', 'mobile-dock-smoke');
fs.mkdirSync(outDir, { recursive: true });

function rectanglesOverlap(a, b, tolerance = 1) {
  return a.left < b.right - tolerance && a.right > b.left + tolerance && a.top < b.bottom - tolerance && a.bottom > b.top + tolerance;
}

async function inspect(page, width) {
  await page.setViewportSize({ width, height: 800 });
  await wait(180);
  const state = await page.evaluate(() => {
    const dock = document.getElementById('tm524-dock');
    const rect = dock?.getBoundingClientRect();
    const buttons = dock ? [...dock.children].filter((node) => {
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }).map((node) => {
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const label = (node.textContent || '').replace(/\s+/g, ' ').trim();
      let semantic = label;
      if (node.id === 'tm525-journey-button') semantic = 'Journey';
      else if (node.id === 'tm525-dossier-button') semantic = 'Dossier';
      else if (node.dataset.templeLibraryLauncher === 'dock') semantic = 'Library';
      else if (node.dataset.templeOfflineOpen === 'true') semantic = 'Offline';
      return {
        semantic,
        label,
        id: node.id || '',
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        whiteSpace: style.whiteSpace,
        overflow: style.overflow,
        textOverflow: style.textOverflow,
        fontSize: style.fontSize,
        afterContent: getComputedStyle(node, '::after').content
      };
    }) : [];

    const rowTops = [];
    buttons.forEach((button) => {
      if (!rowTops.some((top) => Math.abs(top - button.top) < 2)) rowTops.push(button.top);
    });

    return {
      viewport: { width: innerWidth, height: innerHeight },
      pageScrollWidth: document.documentElement.scrollWidth,
      dock: rect ? {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        clientWidth: dock.clientWidth,
        scrollWidth: dock.scrollWidth,
        overflowX: getComputedStyle(dock).overflowX,
        flexWrap: getComputedStyle(dock).flexWrap,
        gap: getComputedStyle(dock).gap
      } : null,
      buttons,
      rows: rowTops.sort((a, b) => a - b)
    };
  });

  const expected = ['Codex', 'Collect', 'Chant', 'Journey', 'Dossier', 'Library', 'Offline'];
  const semantics = state.buttons.map((button) => button.semantic);
  const journey = state.buttons.find((button) => button.semantic === 'Journey');
  const overlaps = [];
  for (let i = 0; i < state.buttons.length; i += 1) {
    for (let j = i + 1; j < state.buttons.length; j += 1) {
      if (rectanglesOverlap(state.buttons[i], state.buttons[j])) overlaps.push([state.buttons[i].semantic, state.buttons[j].semantic]);
    }
  }

  const assertions = {
    dockPresent: Boolean(state.dock),
    expectedButtons: expected.every((label) => semantics.includes(label)),
    exactlySevenVisibleControls: state.buttons.length === 7,
    wrappedIntoTwoRows: state.rows.length === 2,
    noButtonOverlap: overlaps.length === 0,
    dockInsideViewport: Boolean(state.dock) && state.dock.left >= -1 && state.dock.right <= state.viewport.width + 1,
    buttonsInsideDock: Boolean(state.dock) && state.buttons.every((button) => button.left >= state.dock.left - 1 && button.right <= state.dock.right + 1 && button.top >= state.dock.top - 1 && button.bottom <= state.dock.bottom + 1),
    labelsNotClipped: state.buttons.every((button) => button.scrollWidth <= button.clientWidth + 1),
    journeyUsesCompactVisualLabel: Boolean(journey) && journey.fontSize === '0px' && journey.afterContent === '"Journey"',
    noHorizontalDockScroll: Boolean(state.dock) && state.dock.scrollWidth <= state.dock.clientWidth + 1,
    noPageHorizontalOverflow: state.pageScrollWidth <= state.viewport.width + 1,
    wrappingEnabled: state.dock?.flexWrap === 'wrap'
  };
  const failed = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
  return { ok: failed.length === 0, failed, assertions, overlaps, state };
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(`http://127.0.0.1:${port}/?mobile_dock_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
    await page.waitForSelector('[data-temple-entry="explore"]', { timeout: 30000 });
    await page.evaluate(() => document.querySelector('[data-temple-entry="explore"]')?.click());
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready') && !document.body.classList.contains('temple-artifact-open'), null, { timeout: 30000 });
    await page.waitForFunction(() => Boolean(
      document.getElementById('tm525-journey-button') &&
      document.getElementById('tm525-dossier-button') &&
      document.querySelector('[data-temple-library-launcher="dock"]') &&
      document.querySelector('[data-temple-offline-open]')
    ), null, { timeout: 30000 });

    const at360 = await inspect(page, 360);
    await page.screenshot({ path: path.join(outDir, 'mobile-dock-360.png'), fullPage: false });
    const at412 = await inspect(page, 412);
    await page.screenshot({ path: path.join(outDir, 'mobile-dock-412.png'), fullPage: false });

    const assertions = {
      viewport360: at360.ok,
      viewport412: at412.ok,
      noPageErrors: pageErrors.length === 0
    };
    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    const ok = failedAssertions.length === 0;

    console.log(JSON.stringify({ ok, failedAssertions, assertions, at360, at412, pageErrors }, null, 2));
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
