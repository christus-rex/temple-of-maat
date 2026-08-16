import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, value) => fs.writeFileSync(file, value);

function replaceRequired(file, from, to, all = false) {
  let source = read(file);
  if (!source.includes(from)) throw new Error(`${file}: required marker not found: ${from}`);
  source = all ? source.split(from).join(to) : source.replace(from, to);
  write(file, source);
}

for (const required of [
  'assets/branding/temple-global-logo-v5.4.webp',
  'assets/branding/temple-app-icon-192-v5.4.png',
  'assets/branding/temple-app-icon-512-v5.4.png',
  'assets/branding/temple-app-icon-maskable-512-v5.4.png',
  'assets/branding/temple-app-icon-180-v5.4.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png'
]) {
  if (!fs.existsSync(required)) throw new Error(`Missing materialized canonical asset: ${required}`);
}

// Semantic release identity.
write('version.json', `${JSON.stringify({
  version: '5.4.0',
  build: '2026-08-16-v5.4-canonical-identity',
  source: "Temple v5.4 makes the user-approved SOL-OM-ON / Ma'at artwork the canonical identity for the website and installed app, replaces legacy launcher/icon assets with derivatives of that source, and rotates PWA cache ownership so existing clients receive the new identity."
}, null, 2)}\n`);

// PWA: versioned icon URLs force installed clients to discover a new icon resource.
const manifest = JSON.parse(read('manifest.webmanifest'));
manifest.name = "Temple of SOL-OM-ON — Ma'at · 72 Chamber Archive";
manifest.short_name = "SOL-OM-ON · Ma'at";
manifest.icons = [
  { src: './assets/branding/temple-app-icon-192-v5.4.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: './assets/branding/temple-app-icon-512-v5.4.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: './assets/branding/temple-app-icon-maskable-512-v5.4.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
];
for (const shortcut of manifest.shortcuts || []) {
  shortcut.icons = [{ src: './assets/branding/temple-app-icon-192-v5.4.png', sizes: '192x192', type: 'image/png' }];
}
write('manifest.webmanifest', `${JSON.stringify(manifest, null, 2)}\n`);

// Threshold and runtime header: only canonical v5.4 sources are allowed to render.
replaceRequired('styles/v5.3-threshold.css',
  "/* Temple of SOL-OM-ON (Ma'at) v5.3.6 — global identity, threshold, accessibility, and mobile refinement */",
  "/* Temple of SOL-OM-ON (Ma'at) v5.4 — canonical identity, threshold, accessibility, and mobile refinement */");
replaceRequired('styles/v5.3-threshold.css',
  "url('../assets/branding/temple-global-logo.webp'),\n    url('../icon-512.png');",
  "url('../assets/branding/temple-global-logo-v5.4.webp'),\n    url('../icon-512.png');");
replaceRequired('styles/v5.3-threshold.css',
  "url('../assets/branding/temple-global-logo.webp'),\n    url('../icon-512.png');",
  "url('../assets/branding/temple-app-icon-192-v5.4.png'),\n    url('../icon-192.png');");
replaceRequired('styles/v5.3-threshold.css',
  '/* Global Temple identity: the approved SOL-OM-ON / Ma\'at emblem is the threshold seal.\n   The second image is an already-core-cached fallback so the frame never appears blank\n   while a stale service worker or delayed branding asset is being replaced. */',
  '/* Canonical Temple identity: the approved uploaded SOL-OM-ON / Ma\'at artwork is the threshold seal.\n   Every fallback below is itself derived from that same approved source, so a legacy emblem can never flash. */');
replaceRequired('styles/v5.3-threshold.css',
  '/* Runtime global identity. The existing React header remains the host; branding is layered without rebuilding the app bundle. */',
  '/* Runtime canonical identity. The existing React header remains the host; its mark is a small-size derivative of the same approved artwork. */');

replaceRequired('offline.html', './assets/branding/temple-global-logo.webp', './assets/branding/temple-global-logo-v5.4.webp');

// Service worker: rotate physical caches and precache versioned canonical identity resources.
replaceRequired('sw.js', "const CACHE_REVISION = 'v5.3.6-global-logo-r1';", "const CACHE_REVISION = 'v5.4-canonical-identity-r1';");
replaceRequired('sw.js', "const RELEASE_NAMESPACE_MARKER = 'temple-maat-pwa-v5.3.6';", "const RELEASE_NAMESPACE_MARKER = 'temple-maat-pwa-v5.4';");
replaceRequired('sw.js',
  '// Shell revision r4 remains the compatibility namespace; CACHE_REVISION rotates the physical caches for the v5.3.6 global-logo visibility repair.',
  '// Shell revision r4 remains the compatibility namespace; CACHE_REVISION rotates physical caches for the v5.4 canonical website/app identity rollout.');
replaceRequired('sw.js',
  "  './assets/branding/temple-global-logo.webp',",
  "  './assets/branding/temple-global-logo.webp',\n  './assets/branding/temple-global-logo-v5.4.webp',\n  './assets/branding/temple-app-icon-192-v5.4.png',\n  './assets/branding/temple-app-icon-512-v5.4.png',\n  './assets/branding/temple-app-icon-maskable-512-v5.4.png',\n  './assets/branding/temple-app-icon-180-v5.4.png',");

// Search/social identity: root icon-512 is now canonical, so existing image URLs remain stable.
replaceRequired('index.html', "Temple of Ma'at — 72 Chamber Archive", "Temple of SOL-OM-ON — Ma'at · 72 Chamber Archive", true);
replaceRequired('index.html', 'content="Temple of Ma\'at"', 'content="Temple of SOL-OM-ON — Ma\'at"');
replaceRequired('index.html', 'Enter the Temple of Ma\'at, an interactive 72-chamber archive', 'Enter the Temple of SOL-OM-ON — Ma\'at, an interactive 72-chamber archive');
replaceRequired('index.html', 'Explore the interactive 72-chamber Temple of Ma\'at archive.', 'Explore the interactive 72-chamber Temple of SOL-OM-ON — Ma\'at archive.');
replaceRequired('index.html', 'alt="Temple of Ma\'at emblem"', 'alt="Temple of SOL-OM-ON — Ma\'at emblem"');

// Current-release validator follows the semantic release rather than the historical filename.
replaceRequired('scripts/validate-current-release.mjs', "version.version !== '5.3.6'", "version.version !== '5.4.0'");
replaceRequired('scripts/validate-current-release.mjs', 'Expected current portal version 5.3.6', 'Expected current portal version 5.4.0');
replaceRequired('scripts/validate-current-release.mjs', "version.build !== '2026-08-16-v5.3.6-logo-visibility-cache-rotation'", "version.build !== '2026-08-16-v5.4-canonical-identity'");
replaceRequired('scripts/validate-current-release.mjs', "includes('logo visibility')", "includes('canonical identity')");
replaceRequired('scripts/validate-current-release.mjs', 'Current release source must document the logo-visibility repair', 'Current release source must document canonical identity');
replaceRequired('scripts/validate-current-release.mjs', "const CACHE_REVISION = 'v5.3.6-global-logo-r1'", "const CACHE_REVISION = 'v5.4-canonical-identity-r1'");
replaceRequired('scripts/validate-current-release.mjs', 'v5.3.6 cache revision missing', 'v5.4 cache revision missing');
replaceRequired('scripts/validate-current-release.mjs', 'v5.3.6 revision', 'v5.4 revision', true);
replaceRequired('scripts/validate-current-release.mjs', "'./assets/branding/temple-global-logo.webp'", "'./assets/branding/temple-global-logo-v5.4.webp'");
replaceRequired('scripts/validate-current-release.mjs', 'Global logo is not part of CORE_ASSETS', 'Canonical v5.4 logo is not part of CORE_ASSETS');
replaceRequired('scripts/validate-current-release.mjs', "'assets/branding/temple-global-logo.webp',", "'assets/branding/temple-global-logo-v5.4.webp',\n  'assets/branding/temple-app-icon-192-v5.4.png',");
replaceRequired('scripts/validate-current-release.mjs', "fs.existsSync('assets/branding/temple-global-logo.webp')", "fs.existsSync('assets/branding/temple-global-logo-v5.4.webp')");
replaceRequired('scripts/validate-current-release.mjs', "fs.statSync('assets/branding/temple-global-logo.webp')", "fs.statSync('assets/branding/temple-global-logo-v5.4.webp')");
replaceRequired('scripts/validate-current-release.mjs', "cacheRevision: 'v5.3.6-global-logo-r1'", "cacheRevision: 'v5.4-canonical-identity-r1'");

// Browser smoke test keeps its historical filename but validates v5.4 canonical resources.
replaceRequired('scripts/smoke-logo-visibility-v5.3.6.mjs', 'logo-visibility-v5.3.6', 'logo-visibility-v5.4', true);
replaceRequired('scripts/smoke-logo-visibility-v5.3.6.mjs', 'v5.3.6-global-logo-r1', 'v5.4-canonical-identity-r1', true);
replaceRequired('scripts/smoke-logo-visibility-v5.3.6.mjs', "fetch('./assets/branding/temple-global-logo.webp'", "fetch('./assets/branding/temple-global-logo-v5.4.webp'");
replaceRequired('scripts/smoke-logo-visibility-v5.3.6.mjs', "version.version==='5.3.6'", "version.version==='5.4.0'");
replaceRequired('scripts/smoke-logo-visibility-v5.3.6.mjs', "desktopBefore.panelBg.includes('temple-global-logo.webp')", "desktopBefore.panelBg.includes('temple-global-logo-v5.4.webp')");
replaceRequired('scripts/smoke-logo-visibility-v5.3.6.mjs', "desktopAfter.headerBg.includes('temple-global-logo.webp')", "desktopAfter.headerBg.includes('temple-app-icon-192-v5.4.png')");
replaceRequired('scripts/smoke-logo-visibility-v5.3.6.mjs', "x.logo.panelBg.includes('temple-global-logo.webp')", "x.logo.panelBg.includes('temple-global-logo-v5.4.webp')");

replaceRequired('.github/workflows/smoke-release-hardening-v5.2.8.yml', 'Smoke Release hardening v5.3.6', 'Smoke Release hardening v5.4');
replaceRequired('.github/workflows/smoke-release-hardening-v5.2.8.yml', 'v5.3.6-logo-visibility-screenshots', 'v5.4-canonical-identity-screenshots');
replaceRequired('.github/workflows/smoke-release-hardening-v5.2.8.yml', 'work/logo-visibility-v5.3.6/', 'work/logo-visibility-v5.4/');

write('docs/CANONICAL_IDENTITY_V5.4.md', `# Canonical Identity — Temple v5.4\n\nTemple v5.4 establishes the user-approved uploaded SOL-OM-ON / Ma'at artwork as the single canonical visual source for the website and installed PWA.\n\n## Authority\n\n- \`assets/branding/temple-global-logo-v5.4.webp\` is the versioned canonical web artwork.\n- \`assets/branding/temple-global-logo.webp\` is a compatibility copy of the same artwork, not a separate identity.\n- Launcher, maskable, Apple-touch, and runtime-header marks are technical crops/resizes derived only from the canonical source.\n- Legacy root icon filenames are retained for compatibility but their bytes are replaced by v5.4 derivatives.\n- The manifest points to versioned v5.4 icon URLs so installed clients can discover the identity change.\n- Service-worker cache ownership is rotated to \`v5.4-canonical-identity-r1\` to prevent stale v5.3.x branding from remaining authoritative.\n\n## Non-negotiable rule\n\nNo alternate/generated emblem may silently replace this identity. Future redesigns require explicit approval.\n`);

console.log(JSON.stringify({ ok: true, release: '5.4.0', cacheRevision: 'v5.4-canonical-identity-r1', identity: 'canonical-uploaded-SOL-OM-ON-Maat' }, null, 2));
