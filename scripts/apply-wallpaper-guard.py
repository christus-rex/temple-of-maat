from pathlib import Path

validator_path = Path('scripts/validate-v5.mjs')
validator = validator_path.read_text(encoding='utf-8')
anchor = "const html = fs.readFileSync(filePath('index.html'), 'utf8');\n"
block = '''const html = fs.readFileSync(filePath('index.html'), 'utf8');

// v5.2.3 collectible wallpaper guarantees. These markers are part of the public chamber UI
// and must not disappear during future threshold, PWA, or accessibility refinements.
const wallpaperUiMarkers = [
  ['chamber wallpaper download control', 'class="tm2-btn tm2-wallpaper">Wallpaper 1440×2560</button>'],
  ['Parental Powers wallpaper download control', 'tm2-parental-download'],
  ['Parental Powers chamber section', 'tm2-parental-section']
];
for (const [label, marker] of wallpaperUiMarkers) {
  if (!html.includes(marker)) fail(`Missing ${label} in index.html`);
}

const parentalAssetManifestPath = 'scripts/parental-powers-assets.json';
if (!fs.existsSync(filePath(parentalAssetManifestPath))) fail('Missing Parental Powers asset manifest');
const parentalAssetManifest = JSON.parse(fs.readFileSync(filePath(parentalAssetManifestPath), 'utf8'));
const parentalRecords = parentalAssetManifest.records;
if (!Array.isArray(parentalRecords) || parentalRecords.length !== 72) fail(`Expected 72 Parental Powers wallpaper records, found ${parentalRecords?.length}`);
for (const record of parentalRecords) {
  for (const key of ['masterPath', 'displayPath']) {
    const relativePath = record?.[key];
    if (!relativePath || !fs.existsSync(filePath(relativePath))) fail(`Missing Parental Powers ${key} for chamber ${record?.id || record?.number || '?'}`);
  }
}
'''
if 'const wallpaperUiMarkers = [' not in validator:
    if validator.count(anchor) != 1:
        raise SystemExit(f'validator anchor count: {validator.count(anchor)}')
    validator = validator.replace(anchor, block, 1)
    validator_path.write_text(validator, encoding='utf-8')

smoke_path = Path('scripts/smoke-parental-powers.mjs')
smoke = smoke_path.read_text(encoding='utf-8')
anchor = '  await page.goto(`http://127.0.0.1:${port}/#chamber-01`, { waitUntil: "domcontentloaded", timeout: 120000 });\n'
replacement = anchor + '  await page.locator(\'[data-temple-entry="guided"]\').click();\n'
if '[data-temple-entry="guided"]' not in smoke:
    if smoke.count(anchor) != 1:
        raise SystemExit(f'smoke anchor count: {smoke.count(anchor)}')
    smoke = smoke.replace(anchor, replacement, 1)
    smoke_path.write_text(smoke, encoding='utf-8')
