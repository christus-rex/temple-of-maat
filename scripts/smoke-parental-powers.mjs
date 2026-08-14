import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 41783;
const python = process.env.TEMPLE_PYTHON || "python";
const server = spawn(python, ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: root, stdio: "ignore" });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  await wait(900);
  const browser = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => { if (request.url().startsWith(`http://127.0.0.1:${port}/`)) pageErrors.push(`${request.url()}: ${request.failure()?.errorText}`); });
  await page.goto(`http://127.0.0.1:${port}/#chamber-01`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.locator('[data-temple-entry="guided"]').click();
  await page.waitForSelector("#tm2-artifact.open .tm2-parental-section", { timeout: 30000 });
  await page.locator("#tm2-artifact.open .tm2-parental-section").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const image = document.querySelector("#tm2-artifact.open .tm2-parental-section img");
    return Boolean(image?.complete && image?.naturalWidth >= 900 && image?.naturalHeight >= 500);
  }, { timeout: 30000 });
  const result = await page.evaluate(() => {
    const chamber = window.TempleArchive?.chambers?.().find((item) => item.num === "01");
    const section = document.querySelector("#tm2-artifact.open .tm2-parental-section");
    const image = section?.querySelector("img");
    return {
      chamberCount: window.TempleArchive?.chambers?.().length,
      runtimeCount: Object.keys(window.TEMPLE_PARENTAL_POWERS || {}).length,
      parentalTitle: section?.querySelector(".tm2-parental-title")?.textContent?.trim(),
      thirdName: section?.querySelector(".tm2-parental-third")?.textContent?.trim(),
      imageLoaded: Boolean(image?.complete && image?.naturalWidth >= 900 && image?.naturalHeight >= 500),
      hasDownload: Boolean(section?.querySelector(".tm2-parental-download")),
      chamberMapped: Boolean(chamber?.parental?.masterPath && chamber?.parental?.displayPath),
      manifestMapped: Boolean(window.TempleArchive?.manifest?.().chambers?.every((item) => item.parentalPowers?.displayPath)),
    };
  });
  const wallpaperPath = path.join(root, "work", "parental-powers-wallpaper-smoke.png");
  const [wallpaperDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 120000 }),
    page.locator(".tm2-parental-download").click(),
  ]);
  await wallpaperDownload.saveAs(wallpaperPath);
  const wallpaperMetadata = await sharp(wallpaperPath).metadata();
  const platePath = path.join(root, "work", "parental-powers-plate-smoke.png");
  const [plateDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 120000 }),
    page.locator(".tm2-plate-download").click(),
  ]);
  await plateDownload.saveAs(platePath);
  const plateMetadata = await sharp(platePath).metadata();
  result.wallpaperDimensions = `${wallpaperMetadata.width}x${wallpaperMetadata.height}`;
  result.plateDimensions = `${plateMetadata.width}x${plateMetadata.height}`;
  await page.screenshot({ path: path.join(root, "work", "parental-powers-artifact-smoke.png"), fullPage: false });
  await browser.close();
  const ok = result.chamberCount === 72 && result.runtimeCount === 72 && result.imageLoaded && result.hasDownload && result.chamberMapped && result.manifestMapped && result.wallpaperDimensions === "3840x2160" && result.plateDimensions === "1200x2420" && pageErrors.length === 0;
  console.log(JSON.stringify({ ok, result, pageErrors }, null, 2));
  if (!ok) process.exitCode = 1;
} finally {
  server.kill();
  server.unref();
  setTimeout(() => process.exit(process.exitCode || 0), 50);
}
