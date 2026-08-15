import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41792;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = path.join(root, 'work', 'knowledge-inspector-smoke');
fs.mkdirSync(outDir, { recursive: true });

async function geometry(page, width) {
  await page.setViewportSize({ width, height: 900 });
  await wait(150);
  return page.evaluate(() => {
    const section = document.querySelector('[data-temple-kernel-inspector]');
    const rect = section?.getBoundingClientRect();
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      visible: Boolean(section && section.getClientRects().length),
      rect: rect ? { left: rect.left, right: rect.right, width: rect.width } : null,
      columns: getComputedStyle(section?.querySelector('.tm530-kernel-grid') || document.body).gridTemplateColumns,
      noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth + 1
    };
  });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 412, height: 900 } });
    await context.addInitScript(() => {
      localStorage.setItem('temple_v525_pilgrim_journey', JSON.stringify({
        schema: 'temple-of-maat/pilgrim-journey-v1', version: '5.2.5', started: true, current: 1, visited: [1], favorites: [1],
        reflections: { 1: 'PRIVATE KERNEL JOURNEY MARKER' }
      }));
      localStorage.setItem('temple_library_personal_state_v1', JSON.stringify({
        schema: 'temple-of-maat/library-personal-state-v1', updatedAt: new Date().toISOString(), bookmarks: [],
        notes: [{ id: 'note.kernel', recordId: 'source.quran-tanzil-pickthall-edition', text: 'PRIVATE KERNEL LIBRARY MARKER', updatedAt: new Date().toISOString() }], privateCorrespondences: []
      }));
    });

    const page = await context.newPage();
    const pageErrors = [];
    const writes = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writes.push({ method: request.method(), url: request.url() });
    });

    await page.goto(`http://127.0.0.1:${port}/?kernel_inspector_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });

    const beforeEntry = await page.evaluate(() => ({
      appReady: document.body.classList.contains('temple-app-ready'),
      rootInert: document.getElementById('root')?.hasAttribute('inert'),
      inspectorGlobal: Boolean(window.TempleKnowledgeInspector),
      inspectorUiGlobal: Boolean(window.TempleKnowledgeInspectorUI)
    }));

    await page.click('[data-temple-entry="explore"]');
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => window.TempleShem72?.all?.().length === 72 && window.TempleLibrary?.open, null, { timeout: 30000 });

    const installed = await page.evaluate(async () => {
      const comparative = await import('./scripts/v5.3.0-comparative-reading.mjs');
      const compareApi = await comparative.installTempleComparativeReading();
      const inspectorUi = await import('./scripts/v5.3.0-knowledge-inspector-ui.mjs');
      const uiApi = await inspectorUi.installTempleKnowledgeInspectorUI();
      return {
        comparativeSchema: compareApi.schema,
        inspectorSchema: uiApi.inspector.schema,
        uiSchema: uiApi.schema,
        privacy: uiApi.privacy,
        stats: uiApi.inspector.stats()
      };
    });

    await page.evaluate(() => window.TempleLibrary.open('source.quran-tanzil-pickthall-edition'));
    await page.waitForSelector('[data-temple-comparative-launcher="library"]', { state: 'visible', timeout: 30000 });
    await page.click('[data-temple-comparative-launcher="library"]');
    await page.waitForSelector('#tm530-comparative:not([hidden]) [data-temple-kernel-inspector]', { timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('[data-temple-kernel-inspector]')?.innerText?.includes("Qur'an 49:13"), null, { timeout: 30000 });

    const defaultState = await page.evaluate(() => ({
      left: document.getElementById('tm530-left')?.value,
      right: document.getElementById('tm530-right')?.value,
      text: document.querySelector('[data-temple-kernel-inspector]')?.innerText || '',
      leftText: document.querySelector('[data-kernel-side="left"]')?.innerText || '',
      rightText: document.querySelector('[data-kernel-side="right"]')?.innerText || '',
      passageModes: [...document.querySelectorAll('[data-temple-kernel-inspector] .tm530-kernel-badge')].map((node) => node.textContent),
      journeyPrivateStillPresent: window.TemplePilgrimJourney.state().reflections['1'] === 'PRIVATE KERNEL JOURNEY MARKER',
      libraryPrivateStillPresent: window.TempleLibrary.state().notes.some((note) => note.text === 'PRIVATE KERNEL LIBRARY MARKER')
    }));

    await page.selectOption('#tm530-left', 'chamber:01');
    await page.selectOption('#tm530-right', 'dossier:01');
    await page.click('.tm530-compare-action');
    await page.waitForFunction(() => document.querySelector('[data-kernel-side="left"]')?.innerText?.includes('claim.chamber.01.current-law'), null, { timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('[data-kernel-side="right"]')?.innerText?.includes('UNMAPPED ENDPOINT'), null, { timeout: 30000 });

    const chamberState = await page.evaluate(() => ({
      leftText: document.querySelector('[data-kernel-side="left"]')?.innerText || '',
      rightText: document.querySelector('[data-kernel-side="right"]')?.innerText || '',
      wholeText: document.querySelector('[data-temple-kernel-inspector]')?.innerText || ''
    }));

    const at360 = await geometry(page, 360);
    await page.screenshot({ path: path.join(outDir, 'knowledge-inspector-360.png'), fullPage: false });
    const at412 = await geometry(page, 412);
    await page.screenshot({ path: path.join(outDir, 'knowledge-inspector-412.png'), fullPage: false });

    const allVisibleText = `${defaultState.text}\n${chamberState.wholeText}`;
    const assertions = {
      thresholdPreserved: beforeEntry.appReady === false && beforeEntry.rootInert === true && beforeEntry.inspectorGlobal === false && beforeEntry.inspectorUiGlobal === false,
      installedContract: installed.comparativeSchema === 'temple-of-maat/comparative-reading-v1' && installed.inspectorSchema === 'temple-of-maat/knowledge-inspector-v1' && installed.uiSchema === 'temple-of-maat/knowledge-inspector-ui-v1' && installed.privacy === 'public-canonical-only',
      reviewedMappings: installed.stats?.reviewedEndpointMappings === 4,
      defaultPairPreserved: defaultState.left === 'library:source.quran-tanzil-pickthall-edition' && defaultState.right === 'library:study.quran-abjad-gematria',
      quranSourceMapped: /REVIEWED ENDPOINT MAP/.test(defaultState.leftText) && /source\.quran\.tanzil-pickthall/.test(defaultState.leftText),
      exactPassageVisible: /Source Passage Inspection/.test(defaultState.leftText) && /Qur'an 49:13/.test(defaultState.leftText) && defaultState.passageModes.includes('EXACT-SOURCE'),
      rightsAndLimitationsVisible: /Rights —/.test(defaultState.leftText) && /complete verse and Arabic text/i.test(defaultState.leftText),
      unmappedStudyExplicit: /UNMAPPED ENDPOINT/.test(defaultState.rightText) && /will not infer one/i.test(defaultState.rightText),
      chamberClaimVisible: /claim\.chamber\.01\.current-law/.test(chamberState.leftText) && /INITIATE WITHOUT ERASURE/.test(chamberState.leftText),
      chamberBoundaryVisible: /Historical identity\s+false/i.test(chamberState.leftText) && /Metaphysical identity\s+false/i.test(chamberState.leftText),
      dossierUnmappedExplicit: /UNMAPPED ENDPOINT/.test(chamberState.rightText),
      noPrivateLeak: !allVisibleText.includes('PRIVATE KERNEL JOURNEY MARKER') && !allVisibleText.includes('PRIVATE KERNEL LIBRARY MARKER') && defaultState.journeyPrivateStillPresent && defaultState.libraryPrivateStillPresent,
      mobile360: at360.visible && at360.noHorizontalOverflow,
      mobile412: at412.visible && at412.noHorizontalOverflow,
      noUnexpectedWrites: writes.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    console.log(JSON.stringify({ ok: failedAssertions.length === 0, failedAssertions, assertions, beforeEntry, installed, defaultState, chamberState, at360, at412, writes, pageErrors }, null, 2));
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
