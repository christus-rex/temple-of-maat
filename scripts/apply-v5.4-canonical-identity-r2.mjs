import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourcePath = path.resolve('scripts/apply-v5.4-canonical-identity.mjs');
const original = fs.readFileSync(sourcePath, 'utf8');
const obsoleteStrictAltMarker = "replaceRequired('index.html', 'alt=\"Temple of Ma\\'at emblem\"', 'alt=\"Temple of SOL-OM-ON — Ma\\'at emblem\"');\n";
const patched = original.replace(obsoleteStrictAltMarker, '');
if (patched === original) throw new Error('Expected obsolete index alt marker was not found in rollout script');
const tempPath = path.resolve('scripts/.apply-v5.4-canonical-identity-runtime.mjs');
fs.writeFileSync(tempPath, patched);
try {
  await import(`${pathToFileURL(tempPath).href}?v=${Date.now()}`);
} finally {
  fs.rmSync(tempPath, { force: true });
}
