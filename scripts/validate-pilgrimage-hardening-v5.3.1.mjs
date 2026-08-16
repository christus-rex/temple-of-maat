import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const hardening = read('scripts/v5.3.1-pilgrimage-hardening.js');
const navigation = read('scripts/v5.3-pilgrimage-navigation.js');

const assertions = {
  hardeningLoadedByNavigation: navigation.includes('./scripts/v5.3.1-pilgrimage-hardening.js'),
  storageProbePresent: hardening.includes('__tm53_probe__') && hardening.includes('probeStorage'),
  postWriteVerificationPresent: hardening.includes('diskMatchesApi') && hardening.includes('recordMatchesDisk'),
  explicitStorageFailureFeedback: hardening.includes('Private route changes were not written to device storage'),
  liveStorageStatus: hardening.includes('data-pilgrimage-storage-status') || hardening.includes('pilgrimageStorageStatus'),
  routeTransitionScrollReset: hardening.includes('temple:pilgrimage-route-change') && hardening.includes('scrollRouteToTop'),
  documentScrollLock: hardening.includes('tm53-pilgrimage-scroll-lock') && hardening.includes('overflow: hidden !important'),
  panelOverscrollContained: hardening.includes('overscroll-behavior: contain'),
  escapeProtectsDirtyRecord: hardening.includes('interceptEscape') && hardening.includes('formDirty'),
  privateStateKeysOnly: hardening.includes('temple_pilgrimage_enoch_v1') && hardening.includes('temple_pilgrimage_pistis_sophia_v1')
};

const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
const ok = failedAssertions.length === 0;
console.log(JSON.stringify({ ok, failedAssertions, assertions }, null, 2));
if (!ok) process.exitCode = 1;
