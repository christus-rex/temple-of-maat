import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41794;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.join(root, 'work', 'living-correspondence-engine-smoke');
fs.mkdirSync(outDir, { recursive: true });

async function waitForTemple(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
  await wait(900);
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
}

async function geometry(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await wait(150);
  return page.evaluate(() => {
    const layer = document.getElementById('tm534-living-correspondence');
    const panel = layer?.querySelector('.tm534-panel');
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
      columns: getComputedStyle(layer?.querySelector('.tm534-grid') || document.body).gridTemplateColumns,
      noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth + 1
    };
  });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1120, height: 900 } });
    await context.addInitScript(() => {
      localStorage.setItem('temple_v525_pilgrim_journey', JSON.stringify({
        schema: 'temple-of-maat/pilgrim-journey-v1', version: '5.2.5', started: true, current: 1, visited: [1], favorites: [],
        reflections: { 1: 'PRIVATE CORRESPONDENCE JOURNEY MARKER' }
      }));
      localStorage.setItem('temple_library_personal_state_v1', JSON.stringify({
        schema: 'temple-of-maat/library-personal-state-v1', updatedAt: new Date().toISOString(), bookmarks: [],
        notes: [{ id: 'note.correspondence', recordId: 'source.quran-tanzil-pickthall-edition', text: 'PRIVATE CORRESPONDENCE LIBRARY MARKER', updatedAt: new Date().toISOString() }],
        privateCorrespondences: []
      }));
      localStorage.setItem('temple_research_notebook_v1', JSON.stringify({ marker: 'PRIVATE CORRESPONDENCE NOTEBOOK MARKER' }));
      localStorage.setItem('temple_scribe_workspace_v1', JSON.stringify({ marker: 'PRIVATE CORRESPONDENCE SCRIBE MARKER' }));
    });

    const page = await context.newPage();
    const pageErrors = [];
    const writes = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push({ method: request.method(), url: request.url() });
    });

    await page.goto(`http://127.0.0.1:${port}/?correspondence_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForTemple(page);

    const beforeEntry = await page.evaluate(() => ({
      appReady: document.body.classList.contains('temple-app-ready'),
      rootInert: document.getElementById('root')?.hasAttribute('inert'),
      engineGlobal: Boolean(window.TempleLivingCorrespondenceEngine),
      mapGlobal: Boolean(window.TempleLivingTempleMap),
      layer: Boolean(document.getElementById('tm534-living-correspondence'))
    }));

    await page.click('[data-temple-entry="explore"]');
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => window.TempleShem72?.all?.().length === 72 && window.TempleLibrary?.open, null, { timeout: 30000 });

    const installed = await page.evaluate(async () => {
      const module = await import('./scripts/v5.3.4-living-correspondence-engine.mjs');
      const api = await module.installTempleLivingCorrespondenceEngine();
      return {
        schema: api.schema,
        version: api.version,
        privacy: api.privacy,
        fieldCount: api.fields().length,
        endpointCount: api.endpoints().length,
        kernelStats: api.kernelStats(),
        mapSchema: api.map.schema
      };
    });

    await page.evaluate(() => window.TempleLivingCorrespondenceEngine.open('chamber:03'));
    await page.waitForSelector('#tm534-living-correspondence:not([hidden])', { timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('#tm534-living-correspondence')?.innerText?.includes('Andritael'), null, { timeout: 30000 });

    const chamber = await page.evaluate(() => {
      const api = window.TempleLivingCorrespondenceEngine;
      const ledger = api.current();
      const fields = Object.fromEntries(ledger.fields.map((field) => [field.field, field]));
      return {
        ledger,
        fields,
        text: document.getElementById('tm534-living-correspondence')?.innerText || '',
        launcher: Boolean(document.querySelector('[data-temple-correspondence-launcher="library"]')),
        dockCount: document.querySelectorAll('.tm524-dock [data-temple-correspondence-launcher]').length,
        exportBundle: api.exportCurrent(),
        privateState: {
          journey: localStorage.getItem('temple_v525_pilgrim_journey'),
          library: localStorage.getItem('temple_library_personal_state_v1'),
          notebook: localStorage.getItem('temple_research_notebook_v1'),
          scribe: localStorage.getItem('temple_scribe_workspace_v1')
        }
      };
    });

    const desktop = await geometry(page, 1120);
    await page.screenshot({ path: path.join(outDir, 'correspondence-engine-1120.png'), fullPage: false });
    const at412 = await geometry(page, 412);
    await page.screenshot({ path: path.join(outDir, 'correspondence-engine-412.png'), fullPage: false });
    const at360 = await geometry(page, 360);
    await page.screenshot({ path: path.join(outDir, 'correspondence-engine-360.png'), fullPage: false });

    const sourceLedger = await page.evaluate(async () => {
      const api = window.TempleLivingCorrespondenceEngine;
      await api.select('library:source.quran-tanzil-pickthall-edition');
      return api.current();
    });
    const sourceFields = Object.fromEntries(sourceLedger.fields.map((field) => [field.field, field]));

    const allVisibleAndExported = `${chamber.text}\n${JSON.stringify(chamber.exportBundle)}\n${JSON.stringify(sourceLedger)}`;
    const assertions = {
      manualThresholdPreserved: beforeEntry.appReady === false && beforeEntry.rootInert === true && beforeEntry.engineGlobal === false && beforeEntry.mapGlobal === false && beforeEntry.layer === false,
      installedContract: installed.schema === 'temple-of-maat/living-correspondence-engine-v1' && installed.version === '1.0.0' && installed.privacy === 'public-canonical-only' && installed.mapSchema === 'temple-of-maat/living-temple-map-v1',
      thirteenFields: installed.fieldCount === 13 && chamber.ledger.fields.length === 13,
      seventyTwoChambersAvailable: installed.endpointCount >= 72,
      libraryLauncherNoDock: chamber.launcher && chamber.dockCount === 0,
      chamberThreeCurrentName: /Andritael/.test(chamber.text) && chamber.ledger.record.thirdName === 'Andritael',
      pairMigrationSeparated: chamber.ledger.pairMigration?.deployedThirdName === 'Andritael' && chamber.ledger.pairMigration?.preferredFutureThirdName === 'ANDRASITAEL' && chamber.ledger.pairMigration?.implementationMigrated === false,
      angelReviewed: chamber.fields.angel?.value === 'Sitael' && chamber.fields.angel?.status === 'REVIEWED',
      inverseShadowBounded: chamber.fields['inverse-shadow']?.value === 'Andras' && chamber.fields['inverse-shadow']?.layer === 'computational' && /not historical Goetia twinship/i.test(chamber.fields['inverse-shadow']?.note || ''),
      ethicalActionReviewed: chamber.fields['ethical-action']?.value === 'END WHAT DEVOURS LIFE' && chamber.fields['ethical-action']?.claimIds?.includes('claim.chamber.03.current-law'),
      maatExplicitlyUnmapped: chamber.fields['maat-declaration']?.status === 'UNMAPPED' && /OPEN-004/.test(chamber.fields['maat-declaration']?.note || ''),
      jungAndIfsUnassigned: chamber.fields['jungian-function']?.status === 'UNASSIGNED' && chamber.fields['ifs-part']?.status === 'UNASSIGNED',
      noFabricatedPlanetElementDeity: chamber.fields.planet?.status === 'UNASSIGNED' && chamber.fields.element?.status === 'UNASSIGNED' && chamber.fields['deity-archetype']?.status === 'UNASSIGNED',
      sourceDependencyNotScriptureParallel: sourceFields['scripture-parallels']?.status === 'NO REVIEWED CLAIM' && /Source-dependency graph edges are not scripture parallels/.test(sourceFields['scripture-parallels']?.note || ''),
      publicExportOnly: chamber.exportBundle?.schema === 'temple-of-maat/correspondence-bundle-v1' && chamber.exportBundle?.privacy === 'public-canonical-only' && chamber.exportBundle?.ledger?.boundaries?.privateStateIsEvidence === false,
      noPrivateLeak: !allVisibleAndExported.includes('PRIVATE CORRESPONDENCE JOURNEY MARKER') && !allVisibleAndExported.includes('PRIVATE CORRESPONDENCE LIBRARY MARKER') && !allVisibleAndExported.includes('PRIVATE CORRESPONDENCE NOTEBOOK MARKER') && !allVisibleAndExported.includes('PRIVATE CORRESPONDENCE SCRIBE MARKER'),
      privateStateUntouched: Object.values(chamber.privateState).every(Boolean),
      desktopContained: desktop.visible && desktop.controlsInside && desktop.noHorizontalOverflow,
      mobile412: at412.visible && at412.controlsInside && at412.noHorizontalOverflow,
      mobile360: at360.visible && at360.controlsInside && at360.noHorizontalOverflow && String(at360.columns).split(' ').length === 1,
      noUnexpectedWrites: writes.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    console.log(JSON.stringify({ ok: failedAssertions.length === 0, failedAssertions, assertions, beforeEntry, installed, chamber, sourceLedger, desktop, at412, at360, writes, pageErrors }, null, 2));
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
