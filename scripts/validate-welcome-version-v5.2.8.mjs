import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { throw new Error(message); };

const version = JSON.parse(read('version.json'));
const threshold = read('scripts/v5.3-threshold.js');
const css = read('styles/v5.3-threshold.css');
const sw = read('sw.js');

if (version.version !== '5.2.8') fail(`Expected canonical portal version 5.2.8, found ${version.version}`);

for (const marker of [
  'async function installPortalVersionBadge()',
  "fetch('./version.json', { cache: 'no-store' })",
  "badge.textContent = `PORTAL v${version}`",
  "badge.setAttribute('aria-label', `Temple portal version ${version}`)",
  'badge.title = `Build ${release.build}`',
  'installPortalVersionBadge();'
]) {
  if (!threshold.includes(marker)) fail(`Welcome portal-version behavior missing: ${marker}`);
}

for (const marker of [
  '.temple-static-entry__version',
  'color: #f3dfaa',
  'text-transform: uppercase'
]) {
  if (!css.includes(marker)) fail(`Welcome portal-version styling missing: ${marker}`);
}

if (!sw.includes("'./version.json'")) fail('version.json must remain in the service-worker core shell');
if (!sw.includes("'./scripts/v5.3-threshold.js'")) fail('threshold script must remain in the service-worker core shell');
if (!sw.includes("'./styles/v5.3-threshold.css'")) fail('threshold stylesheet must remain in the service-worker core shell');
if (!sw.includes('Shell revision r4: mobile dock alignment, chant web fallback, strict core install, fresh release identity, and isolated cache promotion.')) fail('Service-worker r4 shell refresh marker missing for welcome version rollout');
if (!sw.includes('function isReleaseIdentity(url)')) fail('Portal version must use the service-worker release-identity network-first path');

console.log(JSON.stringify({
  ok: true,
  portalVersion: version.version,
  build: version.build,
  source: 'version.json',
  welcomeLabel: `PORTAL v${version.version}`,
  offlineCore: true,
  freshReleaseIdentity: true
}, null, 2));
