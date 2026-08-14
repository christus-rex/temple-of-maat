import { createRequire } from "node:module";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const [id, source] = process.argv.slice(2);

if (!id || !source) {
  throw new Error("Usage: node scripts/package-parental-power.mjs <chamber-id> <source-image>");
}

const manifest = JSON.parse(await readFile(path.join(scriptDir, "parental-powers-generation-manifest.json"), "utf8"));
const record = manifest.records.find((candidate) => candidate.id === id.padStart(2, "0"));
if (!record) throw new Error(`Unknown chamber ${id}.`);

const master = path.join(root, record.masterPath);
const display = path.join(root, record.displayPath);
await mkdir(path.dirname(master), { recursive: true });
await mkdir(path.dirname(display), { recursive: true });
await mkdir(path.join(root, "work", "parental-sources"), { recursive: true });
await copyFile(source, path.join(root, "work", "parental-sources", `${record.id}.png`));

await sharp(source)
  .resize(1920, 1080, { fit: "cover", position: "attention", withoutEnlargement: true })
  .webp({ quality: 96, smartSubsample: true, effort: 6 })
  .toFile(master);

await sharp(source)
  .resize(960, 540, { fit: "cover", position: "attention" })
  .webp({ quality: 84, smartSubsample: true, effort: 5 })
  .toFile(display);

const metadata = await sharp(master).metadata();
console.log(JSON.stringify({ id: record.id, thirdName: record.thirdName, master: record.masterPath, display: record.displayPath, width: metadata.width, height: metadata.height }));
