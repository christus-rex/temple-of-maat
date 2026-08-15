import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41791;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.join(root, 'work', 'comparative-reading-smoke');
fs.mkdirSync(outDir, { recursive: true });

async function geometry(page, width) {
  await page.setViewportSize({ width, height: 800 });
  await wait(120);
  return page.evaluate(() => {
    const layer = document.getElementById('tm530-comparative');
    const panel = layer?.querySelector('.tm530-compare-panel');
    const rect = panel?.getBoundingClientRect();
    const controls = [...(layer?.querySelectorAll('button, select') || [])].filter((node) => node.getClientRects().length);
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      visible: Boolean(layer && !layer.hidden),
      panel: rect ? { left: rect.left, right: rect.right, width: rect.width } : null,
      controlsInside: controls.every((node) => {
        const box = node.getBoundingClientRect();
        return box.left >= -1 && box.right <= innerWidth + 1;
      }),
      noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth + 1
    };
  });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 412, height: 800 } });
    await context.addInitScript(() => {
      localStorage.setItem('temple_v525_pilgrim_journey', JSON.stringify({
        schema: 'temple-of-maat/pilgrim-journey-v1',
        version: '5.2.5',
        started: true,
        current: 1,
        visited: [1],
        favorites: [1],
        reflections: { 1: 'PRIVATE JOURNEY COMPARISON MARKER' }
      }));
      localStorage.setItem('temple_library_personal_state_v1', JSON.stringify({
        schema: 'temple-of-maat/library-personal-state-v1',
        updatedAt: new Date().toISOString(),
        bookmarks: ['source.quran-tanzil-pickthall-edition'],
        notes: [{ id: 'note.private', recordId: 'source.quran-tanzil-pickthall-edition', text: 'PRIVATE LIBRARY COMPARISON MARKER', updatedAt: new Date().toISOString() }],
        privateCorrespondences: []
      }));
    });

    const page = await context.newPage();
    const pageErrors = [];
    const writes = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push({ method: request.method(), url: request.url() });
    });

    await page.goto(`http://127.0.0.1:${port}/?comparative_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });

    const beforeEntry = await page.evaluate(() => ({
      appReady: document.body.classList.contains('temple-app-ready'),
      rootInert: document.getElementById('root')?.hasAttribute('inert'),
      comparativeGlobal: Boolean(window.TempleComparativeReading),
      comparativeLayer: Boolean(document.getElementById('tm530-comparative'))
    }));

    await page.click('[data-temple-entry="explore"]');
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => window.TempleShem72?.all?.().length === 72 && window.TempleLibrary?.open, null, { timeout: 30000 });

    const installed = await page.evaluate(async () => {
      const module = await import('./scripts/v5.3.0-comparative-reading.mjs');
      const api = await module.installTempleComparativeReading();
      return { schema: api.schema, version: api.version, privacy: api.privacy, endpointCount: api.endpoints().length };
    });

    await page.evaluate(() => window.TempleLibrary.open('source.quran-tanzil-pickthall-edition'));
    await page.waitForSelector('#tm528-library:not([hidden]) [data-temple-comparative-launcher="library"]', { timeout: 30000 });
    const libraryButtonCount = await page.locator('[data-temple-comparative-launcher="library"]').count();
    const dockButtonCount = await page.locator('#tm524-dock [data-temple-comparative-launcher]').count();
    await page.click('[data-temple-comparative-launcher="library"]');
    await page.waitForSelector('#tm530-comparative:not([hidden])', { timeout: 30000 });

    const direct = await page.evaluate(() => ({
      left: document.getElementById('tm530-left')?.value,
      right: document.getElementById('tm530-right')?.value,
      recordTitles: [...document.querySelectorAll('.tm530-record-card h3')].map((node) => node.textContent),
      relationTitles: [...document.querySelectorAll('.tm530-relation-card h3')].map((node) => node.textContent),
      bodyText: document.querySelector('#tm530-comparative .tm530-compare-body')?.innerText || '',
      last: window.TempleComparativeReading.last(),
      journeyPrivateStillPresent: window.TemplePilgrimJourney.state().reflections['1'] === 'PRIVATE JOURNEY COMPARISON MARKER',
      libraryPrivateStillPresent: window.TempleLibrary.state().notes.some((note) => note.text === 'PRIVATE LIBRARY COMPARISON MARKER')
    }));

    await page.selectOption('#tm530-left', 'chamber:01');
    await page.selectOption('#tm530-right', 'dossier:01');
    await page.click('.tm530-compare-action');
    await page.waitForFunction(() => document.querySelector('.tm530-path-card')?.textContent?.includes('2 hops'));

    const pathState = await page.evaluate(() => ({
      bodyText: document.querySelector('#tm530-comparative .tm530-compare-body')?.innerText || '',
      pathText: document.querySelector('.tm530-path-card')?.innerText || '',
      noEdgeText: document.querySelector('.tm530-no-edge')?.innerText || '',
      last: window.TempleComparativeReading.last()
    }));

    const at360 = await geometry(page, 360);
    await page.screenshot({ path: path.join(outDir, 'comparative-reading-360.png'), fullPage: false });
    const at412 = await geometry(page, 412);
    await page.screenshot({ path: path.join(outDir, 'comparative-reading-412.png'), fullPage: false });

    const privateLeak = `${direct.bodyText}\n${pathState.bodyText}`.includes('PRIVATE JOURNEY COMPARISON MARKER') || `${direct.bodyText}\n${pathState.bodyText}`.includes('PRIVATE LIBRARY COMPARISON MARKER');

    const assertions = {
      manualThresholdPreserved: beforeEntry.appReady === false && beforeEntry.rootInert === true && beforeEntry.comparativeGlobal === false && beforeEntry.comparativeLayer === false,
      installedContract: installed.schema === 'temple-of-maat/comparative-reading-v1' && installed.version === '1.0.0' && installed.privacy === 'public-canonical-only' && installed.endpointCount >= 8,
      libraryIntegrated: libraryButtonCount === 1 && dockButtonCount === 0,
      defaultExactPair: direct.left === 'library:source.quran-tanzil-pickthall-edition' && direct.right === 'library:study.quran-abjad-gematria',
      sourceAndStudyResolved: direct.recordTitles.some((title) => /Qur'an/i.test(title)) && direct.recordTitles.some((title) => /Abjad/i.test(title)),
      canonicalDirectEdge: direct.relationTitles.includes('study-uses-source') && direct.last?.edges?.[0]?.id === 'edge.quran-source_to_abjad-study',
      evidenceVisible: /Evidence basis/i.test(direct.bodyText) && /Source references/i.test(direct.bodyText) && /Limitations/i.test(direct.bodyText) && /Historical identity/i.test(direct.bodyText) && /Metaphysical identity/i.test(direct.bodyText),
      directHistoricalBoundaryVisible: /historical influence/i.test(direct.bodyText),
      noPrivateLeak: privateLeak === false && direct.journeyPrivateStillPresent && direct.libraryPrivateStillPresent,
      noInventedDirectEdge: /No direct canonical relationship edge exists/i.test(pathState.noEdgeText),
      structuralPath: pathState.last?.path?.hops === 2 && pathState.last?.path?.endpoints?.map((endpoint) => `${endpoint.namespace}:${endpoint.recordId}`).join(' > ') === 'chamber:01 > codex:01 > dossier:01',
      connectivityWarning: /Connectivity Only/i.test(pathState.pathText) && /not causality/i.test(pathState.pathText) && /does not establish historical transmission/i.test(pathState.pathText),
      mobile360: at360.visible && at360.controlsInside && at360.noHorizontalOverflow,
      mobile412: at412.visible && at412.controlsInside && at412.noHorizontalOverflow,
      noUnexpectedWrites: writes.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    console.log(JSON.stringify({ ok: failedAssertions.length === 0, failedAssertions, assertions, beforeEntry, installed, direct, pathState, at360, at412, writes, pageErrors }, null, 2));
    if (failedAssertions.length) process.exitCode = 1;

    await context.close();
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
  server.unref();
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
