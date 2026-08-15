import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const moduleText = read('scripts/v5.3.0-comparative-reading.mjs');
const css = read('styles/v5.3.0-comparative-reading.css');
const docs = read('docs/COMPARATIVE_READING.md');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(moduleText.includes("COMPARATIVE_READING_SCHEMA = 'temple-of-maat/comparative-reading-v1'"), 'Comparative Reading schema constant missing.');
assert(moduleText.includes("COMPARATIVE_READING_VERSION = '1.0.0'"), 'Comparative Reading version constant missing.');
assert(moduleText.includes("installTempleRelationshipBrowserAdapter"), 'Comparative Reading must consume the governed browser adapter.');
assert(moduleText.includes("adapter.between(leftValue, rightValue)"), 'Comparative Reading must use exact canonical relationship lookup.');
assert(moduleText.includes("adapter.shortestPath(leftValue, rightValue)"), 'Comparative Reading must use resolver connectivity rather than inventing paths.');
assert(moduleText.includes('No direct canonical relationship edge exists between these records. The workspace will not invent one.'), 'No-direct-edge boundary missing.');
assert(moduleText.includes('Connectivity Only · Not Causality'), 'Connectivity/cause warning missing.');
assert(moduleText.includes('Historical identity') && moduleText.includes('Metaphysical identity') && moduleText.includes('Direct historical influence'), 'Claim-boundary fields must be visible.');
assert(moduleText.includes('Evidence basis') && moduleText.includes('Evidence note') && moduleText.includes('Source references') && moduleText.includes('Limitations'), 'Evidence fields must be visible.');
assert(moduleText.includes("privacy: 'public-canonical-only'"), 'Comparative Reading privacy declaration missing.');
assert(!/localStorage\.|indexedDB\.|TemplePilgrimJourney\.state|TempleLibrary\.state/.test(moduleText), 'Comparative Reading must not read private state APIs.');
assert(!/fetch\([^\n]*method\s*:\s*['\"](?:POST|PUT|PATCH|DELETE)/i.test(moduleText), 'Comparative Reading must not issue write requests.');
assert(moduleText.includes("launch.dataset.templeComparativeLauncher = 'library'"), 'Comparative Reading must integrate inside Library rather than add a dock control.');
assert(!moduleText.includes('tm524-dock'), 'Comparative Reading must not add another bottom-dock control.');
assert(css.includes('@media(max-width:760px)'), 'Comparative Reading requires narrow-screen layout.');
assert(css.includes('min-height:48px') || css.includes('height:44px'), 'Comparative Reading controls require touch-target sizing.');
assert(docs.includes('Connectivity only — not causality.'), 'Documentation must preserve connectivity warning.');
assert(docs.includes('does not write to localStorage, IndexedDB'), 'Documentation must state the private-state write boundary.');
assert(docs.includes('does not auto-load the module'), 'Documentation must state staged/non-autoload status.');

console.log(JSON.stringify({
  ok: true,
  schema: 'temple-of-maat/comparative-reading-v1',
  version: '1.0.0',
  privacy: 'public-canonical-only',
  autoLoad: false,
  dockControlAdded: false
}, null, 2));
