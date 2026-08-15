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
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.join(root, 'work', 'research-notebook-smoke');
fs.mkdirSync(outDir, { recursive: true });

async function waitForTemple(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
  await wait(900);
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
}

async function geometry(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await wait(120);
  return page.evaluate(() => {
    const layer = document.getElementById('tm530-research-notebook');
    const panel = layer?.querySelector('.tm530-notebook-panel');
    const rect = panel?.getBoundingClientRect();
    const controls = [...(layer?.querySelectorAll('button, input, textarea, select') || [])].filter((node) => node.getClientRects().length);
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

async function installResearchStack(page) {
  return page.evaluate(async () => {
    const comparative = await import('./scripts/v5.3.0-comparative-reading.mjs');
    const compareApi = await comparative.installTempleComparativeReading();
    const inspectorUiModule = await import('./scripts/v5.3.0-knowledge-inspector-ui.mjs');
    const inspectorUi = await inspectorUiModule.installTempleKnowledgeInspectorUI();
    const notebookUiModule = await import('./scripts/v5.3.0-research-notebook-ui.mjs');
    const notebookUi = await notebookUiModule.installTempleResearchNotebookUI();
    return {
      comparison: compareApi.schema,
      inspector: inspectorUi.inspector.schema,
      notebook: notebookUi.notebook.schema,
      notebookUi: notebookUi.schema,
      privacy: notebookUi.privacy
    };
  });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 412, height: 900 }, acceptDownloads: true });
    await context.addInitScript(() => {
      if (sessionStorage.getItem('tm530-notebook-smoke-seeded')) return;
      localStorage.removeItem('temple_research_notebook_v1');
      localStorage.setItem('temple_v525_pilgrim_journey', JSON.stringify({
        schema: 'temple-of-maat/pilgrim-journey-v1', version: '5.2.5', started: true, current: 1, visited: [1], favorites: [1],
        reflections: { 1: 'PRIVATE NOTEBOOK JOURNEY MARKER' }
      }));
      localStorage.setItem('temple_library_personal_state_v1', JSON.stringify({
        schema: 'temple-of-maat/library-personal-state-v1', updatedAt: new Date().toISOString(), bookmarks: [],
        notes: [{ id: 'note.notebook-marker', recordId: 'source.quran-tanzil-pickthall-edition', text: 'PRIVATE NOTEBOOK LIBRARY MARKER', updatedAt: new Date().toISOString() }], privateCorrespondences: []
      }));
      sessionStorage.setItem('tm530-notebook-smoke-seeded', '1');
    });

    const page = await context.newPage();
    const pageErrors = [];
    const writes = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push({ method: request.method(), url: request.url() });
    });

    await page.goto(`http://127.0.0.1:${port}/?research_notebook_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForTemple(page);

    const beforeEntry = await page.evaluate(() => ({
      appReady: document.body.classList.contains('temple-app-ready'),
      rootInert: document.getElementById('root')?.hasAttribute('inert'),
      notebookGlobal: Boolean(window.TempleResearchNotebook),
      notebookUiGlobal: Boolean(window.TempleResearchNotebookUI),
      notebookStored: Boolean(localStorage.getItem('temple_research_notebook_v1'))
    }));

    await page.click('[data-temple-entry="explore"]');
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => window.TempleShem72?.all?.().length === 72 && window.TempleLibrary?.open, null, { timeout: 30000 });
    const installed = await installResearchStack(page);

    await page.evaluate(() => window.TempleLibrary.open('source.quran-tanzil-pickthall-edition'));
    await page.waitForSelector('[data-temple-comparative-launcher="library"]', { state: 'visible', timeout: 30000 });
    await page.click('[data-temple-comparative-launcher="library"]');
    await page.waitForSelector('#tm530-comparative:not([hidden]) [data-temple-research-notebook-launchbar]', { timeout: 30000 });

    const preDraft = await page.evaluate(() => ({
      storagePresent: Boolean(localStorage.getItem('temple_research_notebook_v1')),
      launchbarCount: document.querySelectorAll('[data-temple-research-notebook-launchbar]').length,
      dockNotebookControls: document.querySelectorAll('#tm524-dock [data-temple-research-notebook-launchbar], #tm524-dock [data-temple-research-notebook-launcher]').length,
      comparison: window.TempleComparativeReading.last()
    }));

    await page.getByRole('button', { name: 'Draft Note from Comparison' }).click();
    await page.waitForSelector('#tm530-research-notebook:not([hidden]) [data-notebook-body]', { timeout: 30000 });

    const draftState = await page.evaluate(() => ({
      storagePresent: Boolean(localStorage.getItem('temple_research_notebook_v1')),
      title: document.querySelector('[data-notebook-title]')?.value || '',
      citationText: document.querySelector('.tm530-notebook-citations')?.innerText || '',
      covenant: document.querySelector('.tm530-notebook-covenant')?.innerText || '',
      notebookEntries: window.TempleResearchNotebook.entries().length
    }));

    const privateMarker = 'PRIVATE USER HYPOTHESIS — never canonical graph evidence';
    await page.fill('[data-notebook-title]', 'Private Qur’an / Abjad working note');
    await page.selectOption('[data-notebook-stage]', 'hypothesis');
    await page.fill('[data-notebook-body]', privateMarker);

    const beforeSave = await page.evaluate(() => ({
      storagePresent: Boolean(localStorage.getItem('temple_research_notebook_v1')),
      entries: window.TempleResearchNotebook.entries().length
    }));

    await page.getByRole('button', { name: 'Save Entry' }).click();
    await page.waitForFunction(() => window.TempleResearchNotebook.entries().length === 1 && localStorage.getItem('temple_research_notebook_v1'), null, { timeout: 30000 });

    const afterSave = await page.evaluate((marker) => {
      const raw = JSON.parse(localStorage.getItem('temple_research_notebook_v1') || 'null');
      const graphBundle = window.TempleRelationshipBrowser.exportBundle();
      const kernelText = JSON.stringify({
        stats: window.TempleKnowledgeInspector.stats(),
        records: window.TempleKnowledgeInspector.records(),
        claims: window.TempleKnowledgeInspector.claims()
      });
      return {
        raw,
        entry: window.TempleResearchNotebook.entries()[0],
        graphContainsPrivate: JSON.stringify(graphBundle).includes(marker),
        kernelContainsPrivate: kernelText.includes(marker),
        journeyUntouched: window.TemplePilgrimJourney.state().reflections['1'] === 'PRIVATE NOTEBOOK JOURNEY MARKER',
        libraryUntouched: window.TempleLibrary.state().notes.some((note) => note.text === 'PRIVATE NOTEBOOK LIBRARY MARKER')
      };
    }, privateMarker);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Private Notebook JSON' }).click();
    const download = await downloadPromise;
    const downloadName = download.suggestedFilename();

    const at360 = await geometry(page, 360);
    await page.screenshot({ path: path.join(outDir, 'research-notebook-360.png'), fullPage: false });
    const at412 = await geometry(page, 412);
    await page.screenshot({ path: path.join(outDir, 'research-notebook-412.png'), fullPage: false });

    await page.getByRole('button', { name: 'Close Private Research Notebook' }).last().click();
    await page.waitForFunction(() => document.getElementById('tm530-research-notebook')?.hidden === true);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForTemple(page);
    await page.click('[data-temple-entry="explore"]');
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => window.TempleShem72?.all?.().length === 72 && window.TempleLibrary?.open, null, { timeout: 30000 });
    await installResearchStack(page);
    const restored = await page.evaluate((marker) => ({
      entries: window.TempleResearchNotebook.entries(),
      markerRestored: window.TempleResearchNotebook.entries().some((entry) => entry.body === marker),
      privacy: window.TempleResearchNotebook.state().privacy
    }), privateMarker);

    const assertions = {
      manualThresholdPreserved: beforeEntry.appReady === false && beforeEntry.rootInert === true && beforeEntry.notebookGlobal === false && beforeEntry.notebookUiGlobal === false && beforeEntry.notebookStored === false,
      installedContract: installed.comparison === 'temple-of-maat/comparative-reading-v1' && installed.inspector === 'temple-of-maat/knowledge-inspector-v1' && installed.notebook === 'temple-of-maat/research-notebook-state-v1' && installed.notebookUi === 'temple-of-maat/research-notebook-ui-v1' && installed.privacy === 'device-local-private',
      comparativeIntegration: preDraft.launchbarCount === 1 && preDraft.dockNotebookControls === 0,
      draftNotPersisted: preDraft.storagePresent === false && draftState.storagePresent === false && draftState.notebookEntries === 0 && beforeSave.storagePresent === false && beforeSave.entries === 0,
      comparisonDraftCitations: /ENDPOINT · library:source\.quran-tanzil-pickthall-edition/i.test(draftState.citationText) && /ENDPOINT · library:study\.quran-abjad-gematria/i.test(draftState.citationText) && /CLAIM · claim\.quran\.49\.13\.conduct/i.test(draftState.citationText) && /PASSAGE · passage\.quran\.49\.13/i.test(draftState.citationText),
      consentCovenantVisible: /Nothing is persisted until you explicitly choose Save Entry/i.test(draftState.covenant),
      explicitSavePersisted: afterSave.raw?.schema === 'temple-of-maat/research-notebook-state-v1' && afterSave.raw?.privacy === 'device-local-private' && afterSave.raw?.entries?.length === 1 && afterSave.entry?.body === privateMarker && afterSave.entry?.stage === 'hypothesis',
      publicEvidenceIsolation: afterSave.graphContainsPrivate === false && afterSave.kernelContainsPrivate === false,
      otherPrivateStateUntouched: afterSave.journeyUntouched && afterSave.libraryUntouched,
      exportExplicit: downloadName === 'temple-of-maat-private-research-notebook.json',
      mobile360: at360.visible && at360.controlsInside && at360.noHorizontalOverflow,
      mobile412: at412.visible && at412.controlsInside && at412.noHorizontalOverflow,
      reloadRestoresPrivateNotebook: restored.entries.length === 1 && restored.markerRestored && restored.privacy === 'device-local-private',
      noUnexpectedNetworkWrites: writes.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    console.log(JSON.stringify({ ok: failedAssertions.length === 0, failedAssertions, assertions, beforeEntry, installed, preDraft, draftState, beforeSave, afterSave, downloadName, at360, at412, restored, writes, pageErrors }, null, 2));
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
