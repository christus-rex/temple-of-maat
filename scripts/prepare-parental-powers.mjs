import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const chambersDocument = JSON.parse(await readFile(path.join(root, "chambers.json"), "utf8"));
const assetManifest = JSON.parse(await readFile(path.join(scriptDir, "v5.1-asset-manifest.json"), "utf8"));
const heroes = assetManifest.assets.filter((asset) => asset.category === "hero");

if (chambersDocument.chambers.length !== 72 || heroes.length !== 72) {
  throw new Error(`Expected 72 chambers and 72 hero references; found ${chambersDocument.chambers.length} and ${heroes.length}.`);
}

const familyMotifs = {
  1: "a dawn archive-garden of blue remembrance, luminous water, carved memory stones, and one threshold",
  2: "a turquoise sanctuary of concord, twin waterways and bridges resolving into one harmonious axis",
  3: "a copper-red landscape of clean severance, parted veils, a decisive path, and a radiant horizon without violence",
  4: "an emerald healing sanctuary, medicinal gardens, restored water, and architecture returning to wholeness",
  5: "a golden sacred workshop-observatory, precise instruments, living geometry, and materials transformed by right work",
  6: "a violet nocturnal sanctuary of depth, cavernous water, distant stars, and a guarded covenant at the horizon",
  7: "an ivory-gold landscape of return, a spiral road, a reopened gate, and dusk becoming a second dawn",
};

const records = chambersDocument.chambers.map((chamber, index) => {
  const slug = chamber.thirdName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const stem = `${chamber.id}-${slug}`;
  return {
    number: chamber.number,
    id: chamber.id,
    thirdName: chamber.thirdName,
    angel: chamber.angel,
    daemon: chamber.daemon,
    office: chamber.office,
    law: chamber.law,
    fire: chamber.fire,
    pillar: chamber.pillar,
    heroReference: heroes[index].path,
    familyMotif: familyMotifs[chamber.fire.id],
    masterPath: `assets/parental/master/${stem}.webp`,
    displayPath: `assets/parental/display/${stem}.webp`,
  };
});

const generationManifest = {
  schema: "temple-of-maat/parental-powers-generation-v1",
  version: "1.0.0",
  styleAnchor: "Approved Chamber 01 Parental Powers sample",
  promptTemplate: "scripts/parental-powers-prompt-template.md",
  records,
};

await writeFile(
  path.join(scriptDir, "parental-powers-generation-manifest.json"),
  `${JSON.stringify(generationManifest, null, 2)}\n`,
);

const runtimeRecords = Object.fromEntries(records.map((record) => [record.id, {
  id: record.id,
  thirdName: record.thirdName,
  angel: record.angel,
  daemon: record.daemon,
  office: record.office,
  law: record.law,
  fire: record.fire,
  pillar: record.pillar,
  masterPath: record.masterPath,
  displayPath: record.displayPath,
}]));
await writeFile(
  path.join(scriptDir, "parental-powers.js"),
  `window.TEMPLE_PARENTAL_POWERS = Object.freeze(${JSON.stringify(runtimeRecords, null, 2)});\n`,
);

async function buildContactSheet() {
  const columns = 8;
  const rows = 9;
  const cellWidth = 180;
  const imageHeight = 240;
  const labelHeight = 34;
  const cellHeight = imageHeight + labelHeight;
  const composites = [];

  for (const [index, record] of records.entries()) {
    const image = await sharp(path.join(root, record.heroReference))
      .resize(cellWidth, imageHeight, { fit: "cover", position: "attention" })
      .webp({ quality: 76 })
      .toBuffer();
    const label = await sharp(Buffer.from(
      `<svg width="${cellWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#090b12"/><text x="8" y="22" fill="#f3ddb0" font-family="Arial" font-size="13">${record.id} ${record.thirdName}</text></svg>`,
    )).png().toBuffer();
    const left = (index % columns) * cellWidth;
    const top = Math.floor(index / columns) * cellHeight;
    composites.push({ input: image, left, top });
    composites.push({ input: label, left, top: top + imageHeight });
  }

  const output = path.join(root, "work", "parental-hero-contact-sheet.jpg");
  await mkdir(path.dirname(output), { recursive: true });
  await sharp({
    create: {
      width: columns * cellWidth,
      height: rows * cellHeight,
      channels: 3,
      background: "#090b12",
    },
  }).composite(composites).jpeg({ quality: 88 }).toFile(output);
  return output;
}

async function inspectPackagedAssets() {
  const assetRecords = [];
  for (const record of records) {
    const item = { ...record };
    for (const kind of ["master", "display"]) {
      const assetPath = path.join(root, record[`${kind}Path`]);
      try {
        const [metadata, fileStat, file] = await Promise.all([
          sharp(assetPath).metadata(),
          stat(assetPath),
          readFile(assetPath),
        ]);
        item[kind] = {
          path: record[`${kind}Path`],
          width: metadata.width,
          height: metadata.height,
          bytes: fileStat.size,
          sha256: createHash("sha256").update(file).digest("hex"),
        };
      } catch {
        item[kind] = null;
      }
    }
    assetRecords.push(item);
  }
  const packaged = {
    schema: "temple-of-maat/parental-powers-assets-v1",
    version: "1.0.0",
    chamberCount: assetRecords.length,
    completeMasters: assetRecords.filter((record) => record.master).length,
    completeDisplays: assetRecords.filter((record) => record.display).length,
    records: assetRecords,
  };
  await writeFile(path.join(scriptDir, "parental-powers-assets.json"), `${JSON.stringify(packaged, null, 2)}\n`);
  return packaged;
}

async function buildParentalContactSheet(packaged) {
  if (packaged.completeMasters !== 72) return null;
  const columns = 4;
  const rows = 18;
  const cellWidth = 400;
  const imageHeight = 225;
  const labelHeight = 32;
  const cellHeight = imageHeight + labelHeight;
  const composites = [];
  for (const [index, record] of packaged.records.entries()) {
    const image = await sharp(path.join(root, record.master.path))
      .resize(cellWidth, imageHeight, { fit: "cover", position: "attention" })
      .jpeg({ quality: 78 })
      .toBuffer();
    const label = await sharp(Buffer.from(
      `<svg width="${cellWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#090b12"/><text x="10" y="21" fill="#f3ddb0" font-family="Arial" font-size="13">${record.id} ${record.angel} + ${record.daemon} — ${record.thirdName}</text></svg>`,
    )).png().toBuffer();
    const left = (index % columns) * cellWidth;
    const top = Math.floor(index / columns) * cellHeight;
    composites.push({ input: image, left, top }, { input: label, left, top: top + imageHeight });
  }
  const output = path.join(root, "work", "parental-powers-contact-sheet.jpg");
  await sharp({ create: { width: columns * cellWidth, height: rows * cellHeight, channels: 3, background: "#090b12" } })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(output);
  return output;
}

const contactSheet = await buildContactSheet();
const packaged = await inspectPackagedAssets();
const parentalContactSheet = await buildParentalContactSheet(packaged);
console.log(JSON.stringify({ contactSheet, parentalContactSheet, generatedRecords: records.length, completeMasters: packaged.completeMasters, completeDisplays: packaged.completeDisplays }));
