import { access, readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const [chambers, generation, assets, version, index, serviceWorker, runtime] = await Promise.all([
  readJson("chambers.json"),
  readJson("scripts/parental-powers-generation-manifest.json"),
  readJson("scripts/parental-powers-assets.json"),
  readJson("version.json"),
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "sw.js"), "utf8"),
  readFile(path.join(root, "scripts/parental-powers.js"), "utf8"),
]);

check(chambers.chamberCount === 72 && chambers.chambers.length === 72, "Canonical chamber document must contain 72 chambers.");
check(generation.records.length === 72, "Generation manifest must contain 72 records.");
check(assets.records.length === 72, "Asset manifest must contain 72 records.");
check(assets.completeMasters === 72, `Expected 72 masters; found ${assets.completeMasters}.`);
check(assets.completeDisplays === 72, `Expected 72 displays; found ${assets.completeDisplays}.`);
check(version.version === "5.2.0", `Expected version 5.2.0; found ${version.version}.`);
check(index.includes("tm2-parental-section"), "Artifact page Parental Powers section is missing.");
check(index.includes("const W=3840,H=2160"), "4K Parental Powers renderer is missing.");
check(index.includes("const W=1200,H=2420"), "Expanded collectible plate renderer is missing.");
check(index.includes('<script src="./scripts/parental-powers.js"></script>'), "Runtime manifest is not loaded by index.html.");
check(serviceWorker.includes("temple-maat-pwa-v5.2-2026-08-13-r1"), "Service worker cache version was not advanced.");
check(serviceWorker.includes("parentalDisplayAssets"), "Service worker does not cache Parental Powers display assets.");

const generationIds = new Set(generation.records.map((record) => record.id));
const assetIds = new Set(assets.records.map((record) => record.id));
check(generationIds.size === 72 && assetIds.size === 72, "Chamber IDs must be unique in both Parental Powers manifests.");
check(new Set(assets.records.map((record) => record.master?.sha256).filter(Boolean)).size === 72, "Each chamber must have a unique master image.");

let totalMasterBytes = 0;
let totalDisplayBytes = 0;
for (const [indexNumber, chamber] of chambers.chambers.entries()) {
  const id = String(indexNumber + 1).padStart(2, "0");
  const source = generation.records[indexNumber];
  const packaged = assets.records[indexNumber];
  check(chamber.id === id && source.id === id && packaged.id === id, `Chamber ordering mismatch at ${id}.`);
  check(source.angel === chamber.angel && source.daemon === chamber.daemon && source.thirdName === chamber.thirdName, `Canonical name mismatch at chamber ${id}.`);
  check(runtime.includes(`"${id}": {`) && runtime.includes(`"thirdName": "${chamber.thirdName}"`), `Runtime mapping is incomplete for chamber ${id}.`);
  for (const kind of ["master", "display"]) {
    const entry = packaged[kind];
    if (!entry) continue;
    const absolute = path.join(root, entry.path);
    try {
      await access(absolute);
      const [metadata, file] = await Promise.all([sharp(absolute).metadata(), stat(absolute)]);
      check(metadata.format === "webp", `${id} ${kind} must be WebP.`);
      check(metadata.width === entry.width && metadata.height === entry.height && file.size === entry.bytes, `${id} ${kind} metadata drifted from its manifest.`);
      check(Math.abs((metadata.width / metadata.height) - (16 / 9)) < 0.01, `${id} ${kind} is not 16:9.`);
      if (kind === "master") {
        totalMasterBytes += file.size;
        check(metadata.width >= 1600 && metadata.height >= 900, `${id} master resolution is below the fidelity floor.`);
      } else {
        totalDisplayBytes += file.size;
        check(metadata.width === 960 && metadata.height === 540, `${id} display rendition must be 960x540.`);
      }
    } catch (error) {
      failures.push(`${id} ${kind} is unreadable: ${error.message}`);
    }
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  chambers: 72,
  masters: assets.completeMasters,
  displays: assets.completeDisplays,
  totalMasterMiB: Number((totalMasterBytes / 1024 / 1024).toFixed(2)),
  totalDisplayMiB: Number((totalDisplayBytes / 1024 / 1024).toFixed(2)),
  version: version.version,
  wallpaper: "3840x2160 PNG on demand",
  plate: "1200x2420 PNG",
}, null, 2));
