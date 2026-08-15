import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = 41790;
const python = process.env.TEMPLE_PYTHON || 'python';
const server = spawn(python, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        reflections: { 1: 'PRIVATE ADAPTER SMOKE REFLECTION' }
      }));
    });
    const page = await context.newPage();
    const pageErrors = [];
    const writeRequests = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method())) writeRequests.push({ method: request.method(), url: request.url() });
    });

    await page.goto(`http://127.0.0.1:${port}/?relationship_adapter_smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.TempleLivingCodex?.records?.().length === 72 && window.TemplePilgrimJourney?.version === '5.2.5', null, { timeout: 30000 });

    const beforeEntry = await page.evaluate(() => ({
      appReady: document.body.classList.contains('temple-app-ready'),
      rootInert: document.getElementById('root')?.hasAttribute('inert'),
      relationshipGlobal: Boolean(window.TempleRelationshipBrowser)
    }));

    await page.waitForSelector('[data-temple-entry="explore"]', { timeout: 30000 });
    await page.click('[data-temple-entry="explore"]');
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), null, { timeout: 30000 });
    await page.waitForFunction(() => window.TempleShem72?.all?.().length === 72, null, { timeout: 30000 });

    const result = await page.evaluate(async () => {
      const module = await import('./scripts/v5.3.0-relationship-browser-adapter.mjs');
      const adapter = await module.installTempleRelationshipBrowserAdapter();
      const chamber = await adapter.resolve('chamber:01');
      const codex = await adapter.resolve('codex:01');
      const dossier = await adapter.resolve('dossier:01');
      const source = await adapter.resolve('library:source.quran-tanzil-pickthall-edition');
      const study = await adapter.resolve('library:study.quran-abjad-gematria');
      const exact = adapter.between('library:source.quran-tanzil-pickthall-edition', 'library:study.quran-abjad-gematria');
      const path = adapter.shortestPath('chamber:01', 'dossier:01');
      const bundle = adapter.exportBundle({ edgeIds: ['edge.quran-source_to_abjad-study', 'edge.chamber-01_to_codex-01'] });
      const serialized = JSON.stringify({ chamber, codex, dossier, source, study, bundle });
      return {
        schema: adapter.schema,
        version: adapter.version,
        privacy: adapter.privacy,
        stats: adapter.stats(),
        chamber: { resolved: chamber.resolved, thirdName: chamber.record?.thirdName, law: chamber.record?.law },
        codex: { resolved: codex.resolved, angel: codex.record?.angel, hasFavorite: Object.hasOwn(codex.record || {}, 'favorite'), hasReflection: Object.hasOwn(codex.record || {}, 'reflection') },
        dossier: { resolved: dossier.resolved, kind: dossier.record?.recordKind, angel: dossier.record?.sourceLayer?.nameEn },
        source: { resolved: source.resolved, id: source.record?.id, exposure: source.record?.rights?.publicExposure },
        study: { resolved: study.resolved, id: study.record?.id },
        exactEdgeIds: exact.map((edge) => edge.id),
        path: path?.endpoints?.map((endpoint) => `${endpoint.namespace}:${endpoint.recordId}`) || [],
        bundlePrivacy: bundle.privacy,
        leakedPrivateReflection: serialized.includes('PRIVATE ADAPTER SMOKE REFLECTION'),
        globalInstalled: window.TempleRelationshipBrowser === adapter,
        journeyStateStillPrivate: window.TemplePilgrimJourney.state().reflections['1'] === 'PRIVATE ADAPTER SMOKE REFLECTION'
      };
    });

    const assertions = {
      manualThresholdPreserved: beforeEntry.appReady === false && beforeEntry.rootInert === true && beforeEntry.relationshipGlobal === false,
      schema: result.schema === 'temple-of-maat/relationship-browser-adapter-v1' && result.version === '1.0.0',
      privacy: result.privacy === 'public-canonical-only' && result.bundlePrivacy === 'public-canonical-only',
      providerNamespaces: result.stats.providerNamespaces?.join(',') === 'chamber,codex,dossier,library',
      graphLoaded: result.stats.edgeCount === 6,
      chamberResolved: result.chamber.resolved && result.chamber.thirdName === 'Bifruiah' && result.chamber.law === 'INITIATE WITHOUT ERASURE',
      codexResolved: result.codex.resolved && result.codex.angel === 'Vehuiah' && !result.codex.hasFavorite && !result.codex.hasReflection,
      dossierResolved: result.dossier.resolved && result.dossier.kind === 'shem-dossier-source-layer' && result.dossier.angel === 'Vehuiah',
      libraryResolved: result.source.resolved && result.study.resolved && result.source.exposure === 'metadata-only',
      exactEdge: result.exactEdgeIds.length === 1 && result.exactEdgeIds[0] === 'edge.quran-source_to_abjad-study',
      structuralPath: result.path.join(' > ') === 'chamber:01 > codex:01 > dossier:01',
      noPrivateLeak: result.leakedPrivateReflection === false && result.journeyStateStillPrivate === true,
      installedGlobal: result.globalInstalled === true,
      noUnexpectedWrites: writeRequests.length === 0,
      noPageErrors: pageErrors.length === 0
    };

    const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
    console.log(JSON.stringify({ ok: failedAssertions.length === 0, failedAssertions, assertions, beforeEntry, result, writeRequests, pageErrors }, null, 2));
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
