import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = path.join(root, 'work');
fs.mkdirSync(work, { recursive: true });
const port = 41787;
const python = process.env.TEMPLE_PYTHON || 'python3';
const server = spawn(python, ['-m','http.server',String(port),'--bind','127.0.0.1'], { cwd: root, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}/`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function entryDiagnostic(page) {
  return page.evaluate(() => {
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const dock = document.getElementById('tm524-dock');
    const dockStyle = dock ? getComputedStyle(dock) : null;
    const launchers = [...document.querySelectorAll('[data-temple-library-launcher]')].map((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        kind: node.dataset.templeLibraryLauncher,
        visible: visible(node),
        display: style.display,
        visibility: style.visibility,
        position: style.position,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    });
    return {
      href: location.href,
      bodyClasses: document.body.className,
      templeReady: document.body.classList.contains('temple-app-ready'),
      artifactOpen: Boolean(document.querySelector('#tm2-artifact.open')),
      artifactVisibility: document.querySelector('#tm2-artifact.open') ? getComputedStyle(document.querySelector('#tm2-artifact.open')).visibility : null,
      launchers,
      anyLauncherVisible: launchers.some((item) => item.visible),
      dockExists: Boolean(dock),
      dockDisplay: dockStyle?.display || null,
      dockVisibility: dockStyle?.visibility || null,
      viewport: { width: innerWidth, height: innerHeight }
    };
  });
}

async function enter(page) {
  await page.waitForSelector('[data-temple-entry="guided"]', { timeout: 30000 });
  await page.locator('[data-temple-entry="guided"]').click();
  try {
    await page.waitForFunction(() => document.body.classList.contains('temple-app-ready'), { timeout: 15000 });
  } catch {
    throw new Error(`Manual entry did not reach temple-app-ready: ${JSON.stringify(await entryDiagnostic(page))}`);
  }
  try {
    await page.waitForFunction(() => [...document.querySelectorAll('[data-temple-library-launcher]')].some((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    }), { timeout: 15000 });
  } catch {
    throw new Error(`No Library launcher became visibly rendered after entry: ${JSON.stringify(await entryDiagnostic(page))}`);
  }
}

async function openLibrary(page) {
  const launcher = page.locator('[data-temple-library-launcher]').filter({ visible: true });
  // Playwright's :visible engine correctly handles fixed-position controls.
  await page.locator('[data-temple-library-launcher]:visible').first().click();
  await page.waitForSelector('#tm528-library:not([hidden])', { timeout: 15000 });
  await page.waitForFunction(() => /Ready/.test(document.querySelector('#tm528-status')?.textContent || ''), { timeout: 15000 });
}

try {
  await wait(900);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.evaluate(() => localStorage.removeItem('temple_library_personal_state_v1'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });

  const threshold = await page.evaluate(() => {
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    };
    return {
      ready: document.body.classList.contains('temple-app-ready'),
      layerHidden: document.getElementById('tm528-library')?.hidden !== false,
      launcherVisible: [...document.querySelectorAll('[data-temple-library-launcher]')].some(visible)
    };
  });
  if (threshold.ready || !threshold.layerHidden || threshold.launcherVisible) throw new Error(`Library threshold leak: ${JSON.stringify(threshold)}`);

  await enter(page);
  await openLibrary(page);

  const catalogState = await page.evaluate(() => ({
    recordCount: window.TempleLibrary?.catalog()?.traditions?.length + window.TempleLibrary?.catalog()?.sources?.length + window.TempleLibrary?.catalog()?.studies?.length + window.TempleLibrary?.catalog()?.discernments?.length + window.TempleLibrary?.catalog()?.correspondences?.length,
    traditions: window.TempleLibrary?.catalog()?.traditions?.length,
    sources: window.TempleLibrary?.catalog()?.sources?.length,
    studies: window.TempleLibrary?.catalog()?.studies?.length
  }));
  if (catalogState.recordCount < 10 || catalogState.traditions < 2 || catalogState.sources < 2 || catalogState.studies < 2) throw new Error(`Catalog too small: ${JSON.stringify(catalogState)}`);

  await page.locator('#tm528-search').fill("Qur'an");
  await page.waitForTimeout(100);
  const quranIds = await page.locator('.tm528-record').evaluateAll((nodes) => nodes.map((node) => node.dataset.id));
  if (!quranIds.includes('source.quran-tanzil-pickthall-edition') || !quranIds.includes('study.quran-abjad-gematria')) throw new Error(`Qur'an search did not distinguish source/study: ${quranIds.join(',')}`);

  await page.locator('.tm528-record[data-id="source.quran-tanzil-pickthall-edition"]').click();
  const sourceText = await page.locator('#tm528-reader').textContent();
  if (!/SOURCE/.test(sourceText) || !/L1/.test(sourceText) || !/Tanzil Project/.test(sourceText) || !/Creative Commons Attribution 3.0/.test(sourceText)) throw new Error('Qur\'an source attribution/provenance is not visible');

  await page.getByRole('button', { name: 'Bookmark Record' }).click();
  await page.getByRole('button', { name: 'Load Index' }).click();
  await page.waitForFunction(() => document.querySelectorAll('#tm528-index-host .tm528-index-entry').length >= 114, { timeout: 15000 });
  const firstPassage = page.locator('#tm528-index-host .tm528-index-entry').first();
  if (!/Al-Fatiha/.test(await firstPassage.textContent())) throw new Error('Lazy Qur\'an source index did not render Al-Fatiha');
  await firstPassage.getByRole('button', { name: 'Bookmark' }).click();

  await page.locator('#tm528-note').fill('Private source-study note for regression testing.');
  await page.getByRole('button', { name: 'Save Note' }).click();
  await page.locator('#tm528-chamber-select').selectOption('42');
  await page.locator('#tm528-relation-select').selectOption('thematic-parallel');
  await page.locator('#tm528-corr-note').fill('Private thematic correspondence.');
  await page.getByRole('button', { name: 'Save Private Correspondence' }).click();

  const exportPath = path.join(work, 'library-personal-state-smoke.json');
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.getByRole('button', { name: 'Export Personal Library JSON' }).click()
  ]);
  await download.saveAs(exportPath);
  const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  if (exported.schema !== 'temple-of-maat/library-personal-state-v1') throw new Error('Personal Library export schema drifted');

  const beforeReload = await page.evaluate(() => window.TempleLibrary.state());
  if (!beforeReload.bookmarks.includes('source.quran-tanzil-pickthall-edition')) throw new Error('Record bookmark missing');
  if (!beforeReload.bookmarks.includes('source.quran-tanzil-pickthall-edition#surah:1')) throw new Error('Passage bookmark missing');
  if (!beforeReload.notes.some((note) => note.recordId === 'source.quran-tanzil-pickthall-edition' && /Private source-study/.test(note.text))) throw new Error('Private note missing');
  if (!beforeReload.privateCorrespondences.some((item) => item.fromRecordId === 'source.quran-tanzil-pickthall-edition' && item.target?.chamberId === '42' && item.provenanceLayer === 'L4' && item.identityClaim === false)) throw new Error('Private chamber correspondence missing');

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await enter(page);
  await openLibrary(page);
  const afterReload = await page.evaluate(() => window.TempleLibrary.state());
  if (JSON.stringify([...afterReload.bookmarks].sort()) !== JSON.stringify([...beforeReload.bookmarks].sort())) throw new Error('Bookmarks did not persist across reload');
  if (!afterReload.notes.some((note) => /Private source-study/.test(note.text))) throw new Error('Note did not persist across reload');
  if (!afterReload.privateCorrespondences.some((item) => item.target?.chamberId === '42')) throw new Error('Correspondence did not persist across reload');
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.625 });
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on('pageerror', (error) => mobileErrors.push(error.message));
  await mobilePage.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await enter(mobilePage);
  await openLibrary(mobilePage);
  const overflow = await mobilePage.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, layerWidth: document.getElementById('tm528-library')?.scrollWidth }));
  if (overflow.scrollWidth > overflow.width + 1 || overflow.layerWidth > overflow.width + 1) throw new Error(`Mobile Library overflows horizontally: ${JSON.stringify(overflow)}`);
  await mobile.close();
  await browser.close();

  const allErrors = [...errors, ...mobileErrors];
  const result = { ok: allErrors.length === 0, threshold, catalogState, quranIds, persistedBookmarks: afterReload.bookmarks.length, persistedNotes: afterReload.notes.length, persistedCorrespondences: afterReload.privateCorrespondences.length, overflow, pageErrors: allErrors };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} finally {
  server.kill();
  server.unref();
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
