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
const outDir = path.join(root, 'work', 'scribe-workspace-smoke');
fs.mkdirSync(outDir, { recursive: true });

async function waitForTemple(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
  await wait(900);
  await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });
}

async function geometry(page, width) {
  await page.setViewportSize({ width, height: 920 });
  await wait(140);
  return page.evaluate(() => {
    const layer = document.getElementById('tm530-scribe-workspace');
    const panel = layer?.querySelector('.tm530-scribe-panel');
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
    const scribeUiModule = await import('./scripts/v5.3.0-scribe-workspace-ui.mjs');
    const scribeUi = await scribeUiModule.installTempleScribeWorkspaceUI();
    return {
      comparison: compareApi.schema,
      inspector: inspectorUi.inspector.schema,
      notebook: scribeUi.scribe.notebook.schema,
      scribe: scribeUi.scribe.schema,
      scribeUi: scribeUi.schema,
      privacy: scribeUi.privacy
    };
  });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 412, height: 920 }, acceptDownloads: true });
    await context.addInitScript(() => {
      if (!sessionStorage.getItem('temple_scribe_smoke_seeded')) {
        localStorage.removeItem('temple_research_notebook_v1');
        localStorage.removeItem('temple_scribe_workspace_v1');
        localStorage.setItem('temple_v525_pilgrim_journey', JSON.stringify({
          schema: 'temple-of-maat/pilgrim-journey-v1', version: '5.2.5', started: true, current: 1, visited: [1], favorites: [1],
          reflections: { 1: 'PRIVATE SCRIBE JOURNEY MARKER' }
        }));
        localStorage.setItem('temple_library_personal_state_v1', JSON.stringify({
          schema: 'temple-of-maat/library-personal-state-v1', updatedAt: new Date().toISOString(), bookmarks: [],
          notes: [{ id: 'note.scribe-marker', recordId: 'source.quran-tanzil-pickthall-edition', text: 'PRIVATE SCRIBE LIBRARY MARKER', updatedAt: new Date().toISOString() }], privateCorrespondences: []
        }));
        sessionStorage.setItem('temple_scribe_smoke_seeded', '1');
      }
    });

    const page = await context.newPage();
    const pageErrors = [];
    const writes = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push({ method: request.method(), url: request.url() });
    });

    await page.goto(`http://127.0.0.1:${port}/?scribe_workspace_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForTemple(page);
    const beforeEntry = await page.evaluate(() => ({
      appReady: document.body.classList.contains('temple-app-ready'),
      rootInert: document.getElementById('root')?.hasAttribute('inert'),
      scribeGlobal: Boolean(window.TempleScribeWorkspace),
      scribeUiGlobal: Boolean(window.TempleScribeWorkspaceUI),
      scribeStored: Boolean(localStorage.getItem('temple_scribe_workspace_v1'))
    }));

    await page.click('[data-temple-entry="explore"]');
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => window.TempleShem72?.all?.().length === 72 && window.TempleLibrary?.open, null, { timeout: 30000 });
    const installed = await installResearchStack(page);

    await page.evaluate(() => window.TempleLibrary.open('source.quran-tanzil-pickthall-edition'));
    await page.waitForSelector('[data-temple-comparative-launcher="library"]', { state: 'visible', timeout: 30000 });
    await page.click('[data-temple-comparative-launcher="library"]');
    await page.waitForSelector('#tm530-comparative:not([hidden]) [data-temple-scribe-launchbar]', { timeout: 30000 });

    const notebookSeed = await page.evaluate(() => {
      const comparison = window.TempleComparativeReading.last();
      const first = window.TempleResearchNotebook.createDraftFromComparison(comparison);
      const second = window.TempleResearchNotebook.createDraftFromComparison(comparison);
      window.TempleResearchNotebook.save({ ...first, title: 'Private source observation', body: 'PRIVATE NOTEBOOK SOURCE OBSERVATION', stage: 'note' });
      window.TempleResearchNotebook.save({ ...second, title: 'Private counter-reading', body: 'PRIVATE NOTEBOOK COUNTER READING', stage: 'question' });
      return { ids: window.TempleResearchNotebook.entries().map((entry) => entry.id), scribeStored: Boolean(localStorage.getItem('temple_scribe_workspace_v1')) };
    });

    const comparativeIntegration = await page.evaluate(() => ({
      launchbarCount: document.querySelectorAll('[data-temple-scribe-launchbar]').length,
      dockControls: document.querySelectorAll('#tm524-dock [data-temple-scribe-launchbar], #tm524-dock [data-temple-scribe-launcher]').length
    }));

    await page.getByRole('button', { name: 'New Thread from Comparison' }).click();
    await page.waitForSelector('#tm530-scribe-workspace:not([hidden]) [data-scribe-thread-title]', { timeout: 30000 });
    const draftState = await page.evaluate(() => ({
      storagePresent: Boolean(localStorage.getItem('temple_scribe_workspace_v1')),
      threadCount: window.TempleScribeWorkspace.threads().length,
      covenant: document.querySelector('.tm530-scribe-covenant')?.innerText || '',
      historicalBoundary: document.querySelector('.tm530-scribe-boundary')?.innerText || '',
      entryOptions: document.querySelectorAll('[data-scribe-entry-ref]').length,
      anchors: [...document.querySelectorAll('.tm530-scribe-anchor strong')].map((node) => node.textContent)
    }));

    await page.fill('[data-scribe-thread-title]', 'Private Nabu–Thoth source / inference thread');
    await page.fill('[data-scribe-thread-inquiry]', 'What is directly supported by the source, what is inferred, and what remains contestable?');
    const entryChecks = page.locator('[data-scribe-entry-ref]');
    await entryChecks.nth(0).check();
    await entryChecks.nth(1).check();
    const beforeSave = await page.evaluate(() => ({ storagePresent: Boolean(localStorage.getItem('temple_scribe_workspace_v1')), threads: window.TempleScribeWorkspace.threads().length }));

    await page.getByRole('button', { name: 'Save Thread' }).click();
    await page.waitForFunction(() => window.TempleScribeWorkspace.threads().length === 1 && localStorage.getItem('temple_scribe_workspace_v1'), null, { timeout: 30000 });

    const markers = {
      observation: 'PRIVATE SCRIBE OBSERVATION — source and study remain separate records',
      inference: 'PRIVATE SCRIBE INFERENCE — normalization choices affect numerical output',
      correction: 'PRIVATE SCRIBE CORRECTION — arithmetic dependence does not prove metaphysical identity',
      reply: 'PRIVATE SCRIBE REPLY — symbolic usefulness may still be explored without identity claims'
    };

    await page.selectOption('[data-scribe-ledger-kind]', 'observation');
    await page.fill('[data-scribe-ledger-text]', markers.observation);
    const citationChecks = page.locator('[data-scribe-ledger-citation]');
    if (await citationChecks.count()) await citationChecks.nth(0).check();
    await page.getByRole('button', { name: 'Add Ledger Entry' }).click();
    await page.waitForFunction((marker) => window.TempleScribeWorkspace.threads()[0]?.ledger?.some((event) => event.text === marker), markers.observation, { timeout: 30000 });

    await page.selectOption('[data-scribe-ledger-kind]', 'inference');
    await page.fill('[data-scribe-ledger-text]', markers.inference);
    await page.fill('[data-scribe-ledger-reasoning]', 'The study record declares normalization rules and explicitly preserves the source text separately.');
    await page.getByRole('button', { name: 'Add Ledger Entry' }).click();
    await page.waitForFunction((marker) => window.TempleScribeWorkspace.threads()[0]?.ledger?.some((event) => event.text === marker), markers.inference, { timeout: 30000 });

    const inferenceId = await page.evaluate((marker) => window.TempleScribeWorkspace.threads()[0].ledger.find((event) => event.text === marker)?.id, markers.inference);
    await page.selectOption('[data-scribe-ledger-kind]', 'correction');
    await page.fill('[data-scribe-ledger-text]', markers.correction);
    await page.fill('[data-scribe-ledger-reasoning]', 'The canonical relationship boundary explicitly rejects metaphysical identity.');
    await page.selectOption('[data-scribe-ledger-related]', inferenceId);
    await page.getByRole('button', { name: 'Add Ledger Entry' }).click();
    await page.waitForFunction((marker) => window.TempleScribeWorkspace.threads()[0]?.ledger?.some((event) => event.text === marker), markers.correction, { timeout: 30000 });

    const correctionId = await page.evaluate((marker) => window.TempleScribeWorkspace.threads()[0].ledger.find((event) => event.text === marker)?.id, markers.correction);
    await page.selectOption('[data-scribe-ledger-kind]', 'reply');
    await page.fill('[data-scribe-ledger-text]', markers.reply);
    await page.selectOption('[data-scribe-ledger-related]', correctionId);
    await page.getByRole('button', { name: 'Add Ledger Entry' }).click();
    await page.waitForFunction((marker) => window.TempleScribeWorkspace.threads()[0]?.ledger?.some((event) => event.text === marker), markers.reply, { timeout: 30000 });

    const afterLedger = await page.evaluate((markers) => {
      const raw = JSON.parse(localStorage.getItem('temple_scribe_workspace_v1') || 'null');
      const thread = window.TempleScribeWorkspace.threads()[0];
      const graphText = JSON.stringify(window.TempleRelationshipBrowser.exportBundle());
      const kernelText = JSON.stringify({ records: window.TempleKnowledgeInspector.records(), claims: window.TempleKnowledgeInspector.claims() });
      return {
        raw,
        thread,
        ledgerKinds: thread.ledger.map((event) => event.kind),
        ledgerTexts: thread.ledger.map((event) => event.text),
        correctionRelated: thread.ledger.find((event) => event.text === markers.correction)?.relatedLogId,
        replyRelated: thread.ledger.find((event) => event.text === markers.reply)?.relatedLogId,
        inferenceReasoning: thread.ledger.find((event) => event.text === markers.inference)?.reasoning || '',
        graphContainsPrivate: graphText.includes('PRIVATE SCRIBE'),
        kernelContainsPrivate: kernelText.includes('PRIVATE SCRIBE'),
        threadCopiedNotebookBody: JSON.stringify(raw).includes('PRIVATE NOTEBOOK SOURCE OBSERVATION') || JSON.stringify(raw).includes('PRIVATE NOTEBOOK COUNTER READING'),
        notebookCount: window.TempleResearchNotebook.entries().length,
        journeyUntouched: window.TemplePilgrimJourney.state().reflections['1'] === 'PRIVATE SCRIBE JOURNEY MARKER',
        libraryUntouched: window.TempleLibrary.state().notes.some((note) => note.text === 'PRIVATE SCRIBE LIBRARY MARKER')
      };
    }, markers);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Private Scribe Threads JSON' }).click();
    const download = await downloadPromise;
    const downloadName = download.suggestedFilename();

    const at360 = await geometry(page, 360);
    await page.screenshot({ path: path.join(outDir, 'scribe-workspace-360.png'), fullPage: false });
    const at412 = await geometry(page, 412);
    await page.screenshot({ path: path.join(outDir, 'scribe-workspace-412.png'), fullPage: false });

    await page.getByRole('button', { name: 'Close Nabu-Thoth Scribe Workspace' }).last().click();
    await page.waitForFunction(() => document.getElementById('tm530-scribe-workspace')?.hidden === true);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitForTemple(page);
    await page.click('[data-temple-entry="explore"]');
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => window.TempleShem72?.all?.().length === 72 && window.TempleLibrary?.open, null, { timeout: 30000 });
    await installResearchStack(page);
    const restored = await page.evaluate((marker) => ({
      threads: window.TempleScribeWorkspace.threads(),
      markerRestored: window.TempleScribeWorkspace.threads()[0]?.ledger?.some((event) => event.text === marker),
      privacy: window.TempleScribeWorkspace.state().privacy,
      notebookEntries: window.TempleResearchNotebook.entries().length
    }), markers.reply);

    const markerValues = Object.values(markers);
    const assertions = {
      manualThresholdPreserved: beforeEntry.appReady === false && beforeEntry.rootInert === true && beforeEntry.scribeGlobal === false && beforeEntry.scribeUiGlobal === false && beforeEntry.scribeStored === false,
      installedContract: installed.comparison === 'temple-of-maat/comparative-reading-v1' && installed.inspector === 'temple-of-maat/knowledge-inspector-v1' && installed.notebook === 'temple-of-maat/research-notebook-state-v1' && installed.scribe === 'temple-of-maat/scribe-workspace-state-v1' && installed.scribeUi === 'temple-of-maat/scribe-workspace-ui-v1' && installed.privacy === 'device-local-private',
      notebookSeedDoesNotCreateThread: notebookSeed.ids.length === 2 && notebookSeed.scribeStored === false,
      comparativeIntegratedNoDock: comparativeIntegration.launchbarCount === 1 && comparativeIntegration.dockControls === 0,
      threadDraftNotPersisted: draftState.storagePresent === false && draftState.threadCount === 0 && beforeSave.storagePresent === false && beforeSave.threads === 0,
      comparativeArchetypeBoundaryVisible: /modern Temple comparative scribe archetype/i.test(draftState.historicalBoundary),
      scribeCovenantVisible: /Observation and inference remain distinct/i.test(draftState.covenant) && /correction/i.test(draftState.covenant) && /reply/i.test(draftState.covenant),
      twoNotebookEntriesAvailable: draftState.entryOptions === 2,
      canonicalAnchorsPresent: draftState.anchors.some((value) => /CLAIM/i.test(value)) && draftState.anchors.some((value) => /PASSAGE/i.test(value)) && draftState.anchors.some((value) => /SOURCE/i.test(value)),
      explicitSaveGroupedEntries: afterLedger.raw?.privacy === 'device-local-private' && afterLedger.thread?.notebookEntryIds?.length === 2 && afterLedger.notebookCount === 2,
      notebookBodiesNotCopied: afterLedger.threadCopiedNotebookBody === false,
      ledgerTypesSeparated: ['observation', 'inference', 'correction', 'reply'].every((kind) => afterLedger.ledgerKinds.includes(kind)) && markerValues.every((marker) => afterLedger.ledgerTexts.includes(marker)),
      inferenceReasoningVisible: /normalization rules/i.test(afterLedger.inferenceReasoning),
      correctionAndReplyLinked: Boolean(afterLedger.correctionRelated) && Boolean(afterLedger.replyRelated) && afterLedger.correctionRelated !== afterLedger.replyRelated,
      publicEvidenceIsolation: afterLedger.graphContainsPrivate === false && afterLedger.kernelContainsPrivate === false,
      otherPrivateStateUntouched: afterLedger.journeyUntouched && afterLedger.libraryUntouched,
      exportExplicit: downloadName === 'temple-of-maat-private-scribe-threads.json',
      mobile360: at360.visible && at360.controlsInside && at360.noHorizontalOverflow,
      mobile412: at412.visible && at412.controlsInside && at412.noHorizontalOverflow,
      reloadRestoresPrivateThreads: restored.threads.length === 1 && restored.markerRestored && restored.privacy === 'device-local-private' && restored.notebookEntries === 2,
      noUnexpectedNetworkWrites: writes.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    console.log(JSON.stringify({ ok: failedAssertions.length === 0, failedAssertions, assertions, beforeEntry, installed, notebookSeed, comparativeIntegration, draftState, beforeSave, afterLedger, downloadName, at360, at412, restored, writes, pageErrors }, null, 2));
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
