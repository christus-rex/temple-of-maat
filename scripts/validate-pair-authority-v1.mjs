import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const read = (relative) => fs.readFileSync(file(relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));
const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const unique = (values) => new Set(values).size === values.length;

const AUTHORITY_PATH = 'research/pair-authority.json';
const SCHEMA_PATH = 'research/pair-authority.schema.json';
const REPORT_PATH = 'research/pair-authority-discrepancy-report.json';
const DOC_PATH = 'docs/PAIR_AUTHORITY.md';
const CHAMBERS_PATH = 'chambers.json';
const CODEX_PATH = 'scripts/v5.2.4-living-codex.js';
const DOSSIER_PATH = 'scripts/v5.2.6-shem-dossiers.js';
const KERNEL_PATH = 'research/knowledge-kernel/seed.v1.json';
const METHOD_REGISTRY_PATH = 'research/knowledge-kernel/method-registry.v1.json';
const SOURCE_REGISTRY_PATH = 'research/knowledge-kernel/source-registry.v1.json';

for (const relative of [
  AUTHORITY_PATH, SCHEMA_PATH, REPORT_PATH, DOC_PATH, CHAMBERS_PATH,
  CODEX_PATH, DOSSIER_PATH, KERNEL_PATH, METHOD_REGISTRY_PATH, SOURCE_REGISTRY_PATH
]) {
  assert(fs.existsSync(file(relative)), `Pair Authority dependency missing: ${relative}`);
}

const authority = json(AUTHORITY_PATH);
const schema = json(SCHEMA_PATH);
const report = json(REPORT_PATH);
const chambers = json(CHAMBERS_PATH);
const codexJs = read(CODEX_PATH);
const dossierJs = read(DOSSIER_PATH);
const kernel = json(KERNEL_PATH);
const methods = json(METHOD_REGISTRY_PATH);
const sources = json(SOURCE_REGISTRY_PATH);
const docs = read(DOC_PATH);

assert(schema.properties?.schema?.const === 'temple-of-maat/pair-authority-v1', 'Pair Authority schema contract mismatch.');
assert(schema.properties?.version?.const === '1.0.0', 'Pair Authority schema version mismatch.');
assert(authority.schema === 'temple-of-maat/pair-authority-v1', `Unexpected Pair Authority schema: ${authority.schema}`);
assert(authority.version === '1.0.0', `Unexpected Pair Authority version: ${authority.version}`);
assert(authority.privacy === 'public-canonical-only', 'Pair Authority must remain public-canonical-only.');
assert(/^\d{4}-\d{2}-\d{2}$/.test(authority.updated || ''), 'Pair Authority updated must use YYYY-MM-DD.');
assert(Array.isArray(authority.records) && authority.records.length === 72, `Pair Authority must contain exactly 72 records, found ${authority.records?.length}`);
assert(unique(authority.records.map((record) => record.recordId)), 'Pair Authority record IDs must be unique.');
assert(unique(authority.records.map((record) => record.pairNumber)), 'Pair Authority pair numbers must be unique.');

const sourceIds = new Set(authority.sources.map((source) => source.id));
const methodIds = new Set(authority.methods.map((method) => method.id));
for (const required of ['shem-master-catalogue-v1', 'solomonic-pairing-codex-v1', 'effective-temple-canon-v1']) {
  assert(sourceIds.has(required), `Pair Authority missing governed source ${required}`);
}
for (const required of ['shem-triplet-hebrew-v1', 'gematria-twin-crossmatch-v1', 'temple-third-name-v1', 'solomonic-positional-four-cipher-v1', 'solomonic-reunited-name-v1']) {
  assert(methodIds.has(required), `Pair Authority missing governed method ${required}`);
}

assert(authority.authorityPolicy?.authoritativePairingForCurrentImplementation === 'gematria-twin-crossmatch-v1', 'Current pairing authority must remain the Master Catalogue gematria-twin cross-match.');
assert(authority.authorityPolicy?.comparisonPairSet === 'solomonic-positional-v1', 'Positional Codex pair set must remain comparison-only.');
assert(/No pair, spelling, Third Name, or Reunited Name may be silently substituted/i.test(authority.authorityPolicy?.migrationRule || ''), 'Migration rule must prohibit silent reconciliation.');
assert(/not proof/i.test(authority.authorityPolicy?.claimBoundary || ''), 'Pair Authority claim boundary must reject identity proof by numerical correspondence.');

const byNumber = new Map(authority.records.map((record) => [record.pairNumber, record]));
for (let n = 1; n <= 72; n += 1) {
  const record = byNumber.get(n);
  assert(record, `Missing Pair Authority record ${n}`);
  assert(record.recordId === `pair.${String(n).padStart(2, '0')}`, `Pair ${n}: unstable recordId ${record.recordId}`);
  assert(record.shem?.normalizedAngel === record.currentImplementation?.angel, `Pair ${n}: canonical Shem angel and current Temple angel must agree exactly.`);
  assert(record.currentImplementation?.pairMethod === 'gematria-twin-crossmatch-v1', `Pair ${n}: current pair method drifted.`);
  assert(record.currentImplementation?.namingMethod === 'temple-third-name-v1', `Pair ${n}: current naming method drifted.`);
  assert(record.positionalComparison?.implementationStatus === 'COMPARISON_ONLY', `Pair ${n}: positional set must remain comparison-only.`);
  assert(record.claimBoundary?.historicalIdentity === false, `Pair ${n}: historical identity must be false.`);
  assert(record.claimBoundary?.metaphysicalIdentity === false, `Pair ${n}: metaphysical identity must be false.`);
  assert(record.claimBoundary?.pairingIsHistoricalGoetiaClaim === false, `Pair ${n}: Goetia twinship historical claim must be false.`);
  assert(record.claimBoundary?.numericalCorrespondenceProvesIdentity === false, `Pair ${n}: numerical correspondence must not prove identity.`);
  assert(record.provenance?.shem?.sourceId === 'shem-master-catalogue-v1', `Pair ${n}: Shem provenance source drifted.`);
  assert(record.provenance?.gematriaTwin?.sourceId === 'shem-master-catalogue-v1', `Pair ${n}: twin provenance source drifted.`);
  assert(record.provenance?.currentTemplePair?.sourceId === 'effective-temple-canon-v1', `Pair ${n}: current pair provenance source drifted.`);
  assert(record.provenance?.positionalComparison?.sourceId === 'solomonic-pairing-codex-v1', `Pair ${n}: positional provenance source drifted.`);
}

function allowed(record, field, actual) {
  if (actual === record.currentImplementation[field]) return true;
  const aliases = record.currentImplementation.aliases?.[field];
  return Array.isArray(aliases) && aliases.includes(actual);
}

const chamberRecords = Array.isArray(chambers) ? chambers : chambers.chambers;
assert(Array.isArray(chamberRecords) && chamberRecords.length === 72, 'chambers.json must contain 72 records.');
for (const chamber of chamberRecords) {
  const n = Number(chamber.number ?? chamber.num);
  const record = byNumber.get(n);
  assert(record, `chambers.json contains unknown chamber ${n}`);
  assert(allowed(record, 'angel', chamber.angel), `Chamber ${n}: angel ${chamber.angel} is not canonical or an approved implementation alias.`);
  assert(chamber.daemon === record.currentImplementation.daemon, `Chamber ${n}: daemon ${chamber.daemon} diverges from Pair Authority ${record.currentImplementation.daemon}.`);
  assert(allowed(record, 'thirdName', chamber.thirdName), `Chamber ${n}: Third Name ${chamber.thirdName} is not canonical or an approved implementation alias.`);
}

function parseLivingCodex(source) {
  const match = source.match(/const RAW = `([\s\S]*?)`;/);
  assert(match, 'Living Codex RAW table could not be located.');
  return match[1].trim().split(/\r?\n/).filter(Boolean).map((row, index) => {
    const columns = row.split('|');
    assert(columns.length === 15, `Living Codex RAW row ${index + 1} must contain 15 fields.`);
    const vector = (value) => {
      const nums = value.split('/').map(Number);
      assert(nums.length === 4 && nums.every(Number.isFinite), `Living Codex vector parse failed at row ${index + 1}`);
      return { EO: nums[0], FR: nums[1], RO: nums[2], RFR: nums[3] };
    };
    return {
      number: Number(columns[0]),
      triplet: columns[1],
      angel: columns[5],
      daemon: columns[10],
      strength: columns[11],
      exactCiphers: columns[12].split(',').filter(Boolean),
      angelVector: vector(columns[13]),
      daemonVector: vector(columns[14])
    };
  });
}
function sameVector(a, b) {
  return ['EO', 'FR', 'RO', 'RFR'].every((key) => a?.[key] === b?.[key]);
}
const codexRows = parseLivingCodex(codexJs);
assert(codexRows.length === 72, `Living Codex must expose 72 records, found ${codexRows.length}`);
for (const row of codexRows) {
  const record = byNumber.get(row.number);
  assert(record, `Living Codex contains unknown record ${row.number}`);
  assert(row.triplet === record.shem.triplet, `Living Codex ${row.number}: Hebrew triplet drift.`);
  assert(row.angel === record.currentImplementation.angel, `Living Codex ${row.number}: angel drift.`);
  assert(row.daemon === record.currentImplementation.daemon, `Living Codex ${row.number}: gematria twin drift.`);
  assert(row.strength === record.twinEvidence.strength, `Living Codex ${row.number}: strength drift.`);
  assert(JSON.stringify(row.exactCiphers) === JSON.stringify(record.twinEvidence.exactCiphers), `Living Codex ${row.number}: exact-cipher list drift.`);
  assert(sameVector(row.angelVector, record.twinEvidence.angelVector), `Living Codex ${row.number}: angel vector drift.`);
  assert(sameVector(row.daemonVector, record.twinEvidence.daemonVector), `Living Codex ${row.number}: daemon vector drift.`);
}

function parseDossier(source) {
  const match = source.match(/const DATA = Object\.freeze\((\[[\s\S]*?\])\);/);
  assert(match, 'Shem Dossier DATA array could not be located.');
  return JSON.parse(match[1]);
}
function normalizeHebrew(value) {
  return String(value || '').replace(/[ךםןףץ]/g, (char) => ({ ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' })[char]);
}
const dossierRows = parseDossier(dossierJs);
assert(dossierRows.length === 72, `Shem Dossier must expose 72 records, found ${dossierRows.length}`);
const dossierVariants = [];
for (const row of dossierRows) {
  const record = byNumber.get(Number(row.num));
  assert(record, `Shem Dossier contains unknown record ${row.num}`);
  assert(normalizeHebrew(row.root) === normalizeHebrew(record.shem.triplet), `Shem Dossier ${row.num}: source triplet differs beyond final-letter normalization.`);
  if (row.nameEn !== record.shem.normalizedAngel || normalizeHebrew(row.fullHe) !== normalizeHebrew(record.shem.constructedHebrew)) {
    dossierVariants.push({
      pairNumber: Number(row.num),
      dossierAngel: row.nameEn,
      authorityAngel: record.shem.normalizedAngel,
      dossierConstructedHebrew: row.fullHe,
      authorityConstructedHebrew: record.shem.constructedHebrew
    });
  }
}

const kernelChambers = kernel.records.filter((record) => record.entityType === 'chamber');
for (const kernelRecord of kernelChambers) {
  const n = Number(kernelRecord.attributes?.number);
  const record = byNumber.get(n);
  assert(record, `Knowledge Kernel contains unknown chamber ${n}`);
  assert(allowed(record, 'angel', kernelRecord.attributes?.angel), `Knowledge Kernel chamber ${n}: angel drift.`);
  assert(kernelRecord.attributes?.daemon === record.currentImplementation.daemon, `Knowledge Kernel chamber ${n}: daemon drift.`);
  assert(allowed(record, 'thirdName', kernelRecord.attributes?.thirdName), `Knowledge Kernel chamber ${n}: Third Name drift.`);
}

const methodRegistryIds = new Set(methods.methods.map((method) => method.id));
assert(methodRegistryIds.has('method.gematria.master-catalogue.v1'), 'Knowledge Kernel must retain the existing Master Catalogue mixed-script method.');
assert(methodRegistryIds.has('method.gematria.solomonic-pairing.v1'), 'Knowledge Kernel must retain the existing Solomonic four-cipher method.');
const sourceRegistryIds = new Set(sources.sources.map((source) => source.id));
assert(sourceRegistryIds.has('source.shem.master-catalogue'), 'Knowledge Kernel source registry must retain the Shem Master Catalogue.');
assert(sourceRegistryIds.has('source.solomonic.pairing-codex'), 'Knowledge Kernel source registry must retain the Solomonic Pairing Codex.');

assert(report.schema === 'temple-of-maat/pair-authority-discrepancy-report-v1', 'Unexpected Pair Authority discrepancy-report schema.');
assert(report.version === '1.0.0', 'Unexpected Pair Authority discrepancy-report version.');
assert(report.authoritySchema === authority.schema && report.authorityVersion === authority.version, 'Discrepancy report must identify the exact authority contract.');
assert(Array.isArray(report.positionalDivergences) && report.positionalDivergences.length === 72, 'Discrepancy report must retain all 72 positional comparisons.');

const recomputed = {
  daemonExact: authority.records.filter((record) => record.currentImplementation.daemon === record.positionalComparison.daemon).length,
  angelExact: authority.records.filter((record) => record.currentImplementation.angel === record.positionalComparison.angel).length,
  thirdNameExact: authority.records.filter((record) => record.currentImplementation.thirdName === record.positionalComparison.reunitedName).length
};
assert(recomputed.daemonExact === 0, `Current gematria-twin and positional daemon sets unexpectedly overlap at ${recomputed.daemonExact} positions; review method boundaries before changing this invariant.`);
assert(report.summary.gematriaTwinVsPositionalDaemonExactMatches === recomputed.daemonExact, 'Discrepancy report daemon-match count is stale.');
assert(report.summary.gematriaTwinVsPositionalDaemonDivergences === 72 - recomputed.daemonExact, 'Discrepancy report daemon-divergence count is stale.');
assert(report.summary.currentVsPositionalAngelExactSpellings === recomputed.angelExact, 'Discrepancy report angel exact-spelling count is stale.');
assert(report.summary.currentThirdNameVsPositionalReunitedExactMatches === recomputed.thirdNameExact, 'Discrepancy report synthesis-name count is stale.');

const pair17 = byNumber.get(17);
assert(pair17.currentImplementation.angel === 'Lauviah', 'Pair 17 canonical recurrence angel must remain Lauviah.');
assert(pair17.currentImplementation.thirdName === 'Valelauviah', 'Pair 17 canonical recurring Third Identity must remain Valelauviah.');
assert(pair17.currentImplementation.aliases?.angel?.includes('Lauviah II'), 'Pair 17 must preserve Lauviah II as an implementation alias.');
assert(pair17.currentImplementation.aliases?.thirdName?.includes('Valelauviah II'), 'Pair 17 must preserve Valelauviah II as an implementation alias.');

assert(/do not silently (?:reconcile|merge)|no silent reconciliation/i.test(docs), 'Pair Authority docs must preserve the no-silent-reconciliation rule.');
assert(docs.includes('0 / 72'), 'Pair Authority docs must make the complete daemon pair-set divergence visible.');
assert(/comparison[-_ ]only/i.test(docs), 'Pair Authority docs must label the positional set as comparison-only.');
assert(!JSON.stringify(authority).includes('temple_research_notebook_v1'), 'Public Pair Authority must not contain private Notebook state.');
assert(!JSON.stringify(authority).includes('temple_scribe_workspace_v1'), 'Public Pair Authority must not contain private Scribe state.');

console.log(JSON.stringify({
  ok: true,
  schema: authority.schema,
  version: authority.version,
  recordCount: authority.records.length,
  currentImplementation: authority.authorityPolicy.currentImplementationId,
  currentPairMethod: authority.authorityPolicy.authoritativePairingForCurrentImplementation,
  positionalComparison: authority.authorityPolicy.comparisonPairSet,
  positionalDaemonExactMatches: recomputed.daemonExact,
  positionalAngelExactSpellings: recomputed.angelExact,
  positionalReunitedNameExactMatches: recomputed.thirdNameExact,
  documentedRecurrenceAliases: report.summary.documentedImplementationAliases,
  dossierVariantCount: dossierVariants.length,
  dossierVariants,
  kernelChambersChecked: kernelChambers.map((record) => record.recordId)
}, null, 2));
