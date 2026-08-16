import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41796;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.join(root, 'work', 'living-temple-map-smoke');
fs.mkdirSync(outDir, { recursive: true });

async function waitForTemple(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
  await wait(900);
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
}

async function geometry(page, width) {
  await page.setViewportSize({ width, height: 820 });
  await wait(180);
  return page.evaluate(() => {
    const layer = document.getElementById('tm533-living-temple-map');
    const panel = layer?.querySelector('.tm533-map-panel');
    const rect = panel?.getBoundingClientRect();
    const controls = [...(layer?.querySelectorAll('button, input, select') || [])].filter((node) => node.getClientRects().length);
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      visible: Boolean(layer && !layer.hidden),
      view: window.TempleLivingTempleMap?.view?.(),
      panel: rect ? { left: rect.left, right: rect.right, width: rect.width } : null,
      controlsInside: controls.every((node) => {
        const box = node.getBoundingClientRect();
        return box.left >= -1 && box.right <= innerWidth + 1;
      }),
      listVisible: Boolean(layer?.querySelector('.tm533-edge-list')?.getClientRects().length),
      mapVisible: Boolean(layer?.querySelector('.tm533-map-canvas')?.getClientRects().length),
      noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth + 1
    };
  });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 412, height: 820 } });
    await context.addInitScript(() => {
      localStorage.setItem('temple_v525_pilgrim_journey', JSON.stringify({
        schema: 'temple-of-maat/pilgrim-journey-v1', version: '5.2.5', started: true, current: 1,
        visited: [1], favorites: [1], reflections: { 1: 'PRIVATE MAP JOURNEY MARKER' }
      }));
      localStorage.setItem('temple_library_personal_state_v1', JSON.stringify({
        schema: 'temple-of-maat/library-personal-state-v1', updatedAt: new Date().toISOString(),
        bookmarks: [], notes: [{ id: 'note.map.private', recordId: 'source.quran-tanzil-pickthall-edition', text: 'PRIVATE MAP LIBRARY MARKER', updatedAt: new Date().toISOString() }], privateCorrespondences: []
      }));
      localStorage.setItem('temple_research_notebook_v1', JSON.stringify({ schema: 'temple-of-maat/research-notebook-state-v1', version: '1.0.0', privacy: 'device-local-private', entries: [{ id: 'notebook.map.private', title: 'PRIVATE MAP NOTEBOOK MARKER', body: 'PRIVATE MAP NOTEBOOK BODY', stage: 'note', citations: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], updatedAt: new Date().toISOString() }));
      localStorage.setItem('temple_scribe_workspace_v1', JSON.stringify({ schema: 'temple-of-maat/scribe-workspace-state-v1', version: '1.0.0', privacy: 'device-local-private', threads: [{ id: 'thread.map.private', title: 'PRIVATE MAP SCRIBE MARKER', inquiry: 'private', status: 'open', notebookEntryIds: [], anchors: [], ledger: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }], updatedAt: new Date().toISOString() }));
    });

    const page = await context.newPage();
    const pageErrors = [];
    const writes = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push({ method: request.method(), url: request.url() });
    });

    await page.goto(`http://127.0.0.1:${port}/?living_map_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForTemple(page);

    const beforeEntry = await page.evaluate(() => ({
      appReady: document.body.classList.contains('temple-app-ready'),
      rootInert: document.getElementById('root')?.hasAttribute('inert'),
      mapGlobal: Boolean(window.TempleLivingTempleMap),
      mapLayer: Boolean(document.getElementById('tm533-living-temple-map'))
    }));

    await page.click('[data-temple-entry="explore"]');
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => window.TempleShem72?.all?.().length === 72 && window.TempleLibrary?.open, null, { timeout: 30000 });

    const installed = await page.evaluate(async () => {
      const module = await import('./scripts/v5.3.3-living-temple-map.mjs');
      const api = await module.installTempleLivingMap();
      return {
        schema: api.schema,
        version: api.version,
        privacy: api.privacy,
        edgeCount: api.edges().length,
        endpointCount: api.endpoints().length,
        view: api.view(),
        bands: api.bands()
      };
    });

    await page.evaluate(() => window.TempleLibrary.open('source.quran-tanzil-pickthall-edition'));
    await page.waitForSelector('#tm528-library:not([hidden]) [data-temple-map-launcher="library"]', { timeout: 30000 });
    const libraryButtonCount = await page.locator('[data-temple-map-launcher="library"]').count();
    const dockButtonCount = await page.locator('#tm524-dock [data-temple-map-launcher]').count();
    await page.click('[data-temple-map-launcher="library"]');
    await page.waitForSelector('#tm533-living-temple-map:not([hidden])', { timeout: 30000 });

    const mobileDefault = await page.evaluate(() => ({
      view: window.TempleLivingTempleMap.view(),
      edgeItems: document.querySelectorAll('.tm533-edge-item').length,
      bodyText: document.querySelector('#tm533-living-temple-map .tm533-map-body')?.innerText || ''
    }));

    await page.evaluate(() => window.TempleLivingTempleMap.selectEdge('edge.quran-source_to_abjad-study'));
    await page.waitForFunction(() => document.querySelector('.tm533-detail')?.textContent?.includes('study-uses-source'));
    const quranEdge = await page.evaluate(() => ({
      detailText: document.querySelector('.tm533-detail')?.innerText || '',
      exportBundle: window.TempleLivingTempleMap.exportVisible()
    }));

    await page.evaluate(() => window.TempleLivingTempleMap.selectEndpoint('chamber:03'));
    await page.waitForFunction(() => document.querySelector('.tm533-pair-authority')?.textContent?.includes('ANDRASITAEL'));
    const pairDetail = await page.evaluate(() => ({
      text: document.querySelector('.tm533-detail')?.innerText || '',
      pair: null
    }));
    pairDetail.pair = await page.evaluate(() => window.TempleLivingTempleMap.pairAuthority(3));

    await page.setViewportSize({ width: 1120, height: 820 });
    await wait(180);
    await page.evaluate(() => window.TempleLivingTempleMap.setView('map'));
    await wait(120);
    const desktop = await page.evaluate(() => ({
      view: window.TempleLivingTempleMap.view(),
      mapVisible: Boolean(document.querySelector('.tm533-map-canvas')?.getClientRects().length),
      visualLines: document.querySelectorAll('.tm533-edge-line').length,
      visualNodes: document.querySelectorAll('.tm533-node').length,
      documentWidth: document.documentElement.scrollWidth,
      viewport: innerWidth
    }));
    await page.screenshot({ path: path.join(outDir, 'living-temple-map-1120.png'), fullPage: false });

    const at412 = await geometry(page, 412);
    await page.screenshot({ path: path.join(outDir, 'living-temple-map-412.png'), fullPage: false });
    const at360 = await geometry(page, 360);
    await page.screenshot({ path: path.join(outDir, 'living-temple-map-360.png'), fullPage: false });

    const completeText = `${mobileDefault.bodyText}\n${quranEdge.detailText}\n${pairDetail.text}\n${JSON.stringify(quranEdge.exportBundle)}`;
    const privateMarkers = ['PRIVATE MAP JOURNEY MARKER', 'PRIVATE MAP LIBRARY MARKER', 'PRIVATE MAP NOTEBOOK MARKER', 'PRIVATE MAP NOTEBOOK BODY', 'PRIVATE MAP SCRIBE MARKER'];
    const privateLeak = privateMarkers.some((marker) => completeText.includes(marker));

    const assertions = {
      manualThresholdPreserved: beforeEntry.appReady === false && beforeEntry.rootInert === true && beforeEntry.mapGlobal === false && beforeEntry.mapLayer === false,
      installedContract: installed.schema === 'temple-of-maat/living-temple-map-v1' && installed.version === '1.0.0' && installed.privacy === 'public-canonical-only' && installed.edgeCount === 6 && installed.endpointCount === 10,
      libraryIntegratedNoDock: libraryButtonCount === 1 && dockButtonCount === 0,
      mobileDefaultsAccessibleList: mobileDefault.view === 'list' && mobileDefault.edgeItems === 6,
      covenantVisible: /Source → Scholarship → Correspondence → Temple Interpretation/.test(mobileDefault.bodyText) && /do not create historical influence/i.test(mobileDefault.bodyText),
      provenanceLegendVisible: /Source \/ Textual/.test(mobileDefault.bodyText) && /Temple Synthesis/.test(mobileDefault.bodyText),
      canonicalEvidenceVisible: /Evidence basis/i.test(quranEdge.detailText) && /Source references/i.test(quranEdge.detailText) && /Historical identity/i.test(quranEdge.detailText) && /Metaphysical identity/i.test(quranEdge.detailText),
      pairAuthorityBoundary: /Andritael/.test(pairDetail.text) && /ANDRASITAEL/.test(pairDetail.text) && /temple-third-name-v1/.test(pairDetail.text) && /temple-third-name-refined-v2/.test(pairDetail.text) && /does not rename the live chamber/i.test(pairDetail.text),
      pairAuthorityApi: pairDetail.pair?.pairNumber === 3 && pairDetail.pair?.legacyThirdName === 'Andritael' && pairDetail.pair?.preferredRefinedThirdName === 'ANDRASITAEL',
      desktopMapRendered: desktop.view === 'map' && desktop.mapVisible && desktop.visualLines === 6 && desktop.visualNodes === 10 && desktop.documentWidth <= desktop.viewport + 1,
      mobile412: at412.visible && at412.view === 'list' && at412.listVisible && !at412.mapVisible && at412.controlsInside && at412.noHorizontalOverflow,
      mobile360: at360.visible && at360.view === 'list' && at360.listVisible && !at360.mapVisible && at360.controlsInside && at360.noHorizontalOverflow,
      publicExportOnly: quranEdge.exportBundle?.privacy === 'public-canonical-only' && quranEdge.exportBundle?.edges?.length === 6 && !privateLeak,
      noUnexpectedWrites: writes.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    console.log(JSON.stringify({ ok: failedAssertions.length === 0, failedAssertions, assertions, beforeEntry, installed, mobileDefault, quranEdge, pairDetail, desktop, at412, at360, writes, pageErrors }, null, 2));
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
