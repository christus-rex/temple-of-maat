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
const BASE_DEPENDENCIES = [AUTHORITY_PATH, SCHEMA_PATH, REPORT_PATH, DOC_PATH, CHAMBERS_PATH, CODEX_PATH, DOSSIER_PATH, KERNEL_PATH, METHOD_REGISTRY_PATH, SOURCE_REGISTRY_PATH];
BASE_DEPENDENCIES.forEach((relative) => assert(fs.existsSync(file(relative)), `Pair Authority dependency missing: ${relative}`));

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
assert(authority.recordEncoding === 'columnar-v1', 'Pair Authority record encoding must remain columnar-v1.');

const expectedColumns = ['pairNumber','triplet','transliteration','normalizedAngel','suffix','constructedHebrew','tripletGematria','tripletDigitalRoot','fullGematria','fullDigitalRoot','currentDaemon','currentThirdName','twinStrength','twinExactCiphers','twinAngelVector','twinDaemonVector','positionalAngel','positionalDaemon','positionalReunitedName','positionalAngelVector','positionalDaemonVector','positionalExactCiphers','angelSpellingExact','daemonExact','synthesisNameExact','migrationStatus'];
assert(JSON.stringify(authority.recordColumns) === JSON.stringify(expectedColumns), 'Pair Authority column contract drifted.');
assert(Array.isArray(authority.recordShards) && authority.recordShards.length === 8, 'Pair Authority must list eight 9-record shards.');

const sourceIds = new Set(authority.sources.map((source) => source.id));
const methodIds = new Set(authority.methods.map((method) => method.id));
['shem-master-catalogue-v1','solomonic-pairing-codex-v1','effective-temple-canon-v1'].forEach((id) => assert(sourceIds.has(id), `Pair Authority missing governed source ${id}`));
['shem-triplet-hebrew-v1','gematria-twin-crossmatch-v1','temple-third-name-v1','solomonic-positional-four-cipher-v1','solomonic-reunited-name-v1'].forEach((id) => assert(methodIds.has(id), `Pair Authority missing governed method ${id}`));
assert(authority.authorityPolicy?.authoritativePairingForCurrentImplementation === 'gematria-twin-crossmatch-v1', 'Current pairing authority must remain the Master Catalogue gematria-twin cross-match.');
assert(authority.authorityPolicy?.comparisonPairSet === 'solomonic-positional-v1', 'Positional Codex pair set must remain comparison-only.');
assert(/silently substituted/i.test(authority.authorityPolicy?.migrationRule || ''), 'Migration rule must prohibit silent reconciliation.');
assert(/not proof/i.test(authority.authorityPolicy?.claimBoundary || ''), 'Pair Authority claim boundary must reject identity proof by numerical correspondence.');
assert(authority.currentImplementationContract?.pairMethod === 'gematria-twin-crossmatch-v1', 'Current implementation pair method drifted.');
assert(authority.currentImplementationContract?.namingMethod === 'temple-third-name-v1', 'Current implementation naming method drifted.');
assert(authority.positionalComparisonContract?.implementationStatus === 'COMPARISON_ONLY', 'Positional comparison contract must remain comparison-only.');
assert(authority.claimBoundary?.historicalIdentity === false && authority.claimBoundary?.metaphysicalIdentity === false, 'Historical/metaphysical identity boundaries must remain false.');
assert(authority.claimBoundary?.pairingIsHistoricalGoetiaClaim === false && authority.claimBoundary?.numericalCorrespondenceProvesIdentity === false, 'Goetia-history/numerical-proof boundaries must remain false.');
assert(authority.fieldProvenance?.['shem.*']?.sourceId === 'shem-master-catalogue-v1', 'Shem field provenance drifted.');
assert(authority.fieldProvenance?.['current.daemon|twin.*']?.sourceId === 'shem-master-catalogue-v1', 'Twin field provenance drifted.');
assert(authority.fieldProvenance?.['current.angel|daemon']?.sourceId === 'effective-temple-canon-v1', 'Current pair field provenance drifted.');
assert(authority.fieldProvenance?.['current.thirdName']?.sourceId === 'effective-temple-canon-v1', 'Current Third Name field provenance drifted.');
assert(authority.fieldProvenance?.['positional.*']?.sourceId === 'solomonic-pairing-codex-v1', 'Positional field provenance drifted.');

function parseCipherList(value) { return value ? String(value).split(',').filter(Boolean) : []; }
function parseVector(value, label) {
  const values = String(value).split('/').map(Number);
  assert(values.length === 4 && values.every(Number.isFinite), `${label}: invalid four-cipher vector ${value}`);
  return { EO: values[0], FR: values[1], RO: values[2], RFR: values[3] };
}
function decodeRow(row, shardPath, rowIndex) {
  assert(Array.isArray(row) && row.length === expectedColumns.length, `${shardPath} row ${rowIndex + 1}: expected ${expectedColumns.length} fields, found ${row?.length}`);
  const value = Object.fromEntries(expectedColumns.map((column, index) => [column, row[index]]));
  const n = Number(value.pairNumber);
  assert(Number.isInteger(n) && n >= 1 && n <= 72, `${shardPath} row ${rowIndex + 1}: invalid pair number ${value.pairNumber}`);
  return {
    recordId: `pair.${String(n).padStart(2, '0')}`,
    pairNumber: n,
    shem: {
      triplet: value.triplet, transliteration: value.transliteration, normalizedAngel: value.normalizedAngel,
      suffix: value.suffix, constructedHebrew: value.constructedHebrew,
      tripletGematria: Number(value.tripletGematria), tripletDigitalRoot: Number(value.tripletDigitalRoot),
      fullGematria: Number(value.fullGematria), fullDigitalRoot: Number(value.fullDigitalRoot)
    },
    current: { angel: value.normalizedAngel, daemon: value.currentDaemon, thirdName: value.currentThirdName },
    twin: { strength: value.twinStrength, exactCiphers: parseCipherList(value.twinExactCiphers), angelVector: parseVector(value.twinAngelVector, `pair ${n} angel`), daemonVector: parseVector(value.twinDaemonVector, `pair ${n} twin`) },
    positional: { angel: value.positionalAngel, daemon: value.positionalDaemon, reunitedName: value.positionalReunitedName, angelVector: parseVector(value.positionalAngelVector, `pair ${n} positional angel`), daemonVector: parseVector(value.positionalDaemonVector, `pair ${n} positional daemon`), exactCiphers: parseCipherList(value.positionalExactCiphers) },
    divergence: { angelSpellingExact: value.angelSpellingExact, daemonExact: value.daemonExact, synthesisNameExact: value.synthesisNameExact, migrationStatus: value.migrationStatus },
    aliases: authority.aliases?.[`pair.${String(n).padStart(2, '0')}`] || null
  };
}

const records = [];
let expectedStart = 1;
for (const descriptor of authority.recordShards) {
  assert(descriptor.start === expectedStart && descriptor.end === descriptor.start + 8 && descriptor.count === 9, `Invalid Pair Authority shard range ${descriptor.path}`);
  assert(fs.existsSync(file(descriptor.path)), `Missing Pair Authority shard ${descriptor.path}`);
  const shard = json(descriptor.path);
  assert(shard.schema === 'temple-of-maat/pair-authority-shard-v1' && shard.version === authority.version && shard.authoritySchema === authority.schema, `${descriptor.path}: shard contract mismatch.`);
  assert(JSON.stringify(shard.recordColumns) === JSON.stringify(expectedColumns), `${descriptor.path}: column contract mismatch.`);
  assert(Array.isArray(shard.records) && shard.records.length === descriptor.count, `${descriptor.path}: shard count mismatch.`);
  const decoded = shard.records.map((row, index) => decodeRow(row, descriptor.path, index));
  assert(decoded[0].pairNumber === descriptor.start && decoded.at(-1).pairNumber === descriptor.end, `${descriptor.path}: decoded range mismatch.`);
  records.push(...decoded);
  expectedStart = descriptor.end + 1;
}
assert(records.length === 72 && expectedStart === 73, `Pair Authority must decode exactly 72 records, found ${records.length}`);
assert(unique(records.map((record) => record.recordId)) && unique(records.map((record) => record.pairNumber)), 'Pair Authority record IDs and pair numbers must be unique.');
const byNumber = new Map(records.map((record) => [record.pairNumber, record]));
for (let n = 1; n <= 72; n += 1) {
  const record = byNumber.get(n);
  assert(record, `Missing Pair Authority record ${n}`);
  assert(record.divergence.daemonExact === false, `Pair ${n}: current and positional daemon unexpectedly match.`);
  assert(record.divergence.synthesisNameExact === false, `Pair ${n}: current Third Name and positional Reunited Name unexpectedly match.`);
}

function allowed(record, field, actual) {
  if (actual === record.current[field]) return true;
  const aliases = record.aliases?.[field];
  return Array.isArray(aliases) && aliases.includes(actual);
}
const chamberRecords = Array.isArray(chambers) ? chambers : chambers.chambers;
assert(Array.isArray(chamberRecords) && chamberRecords.length === 72, 'chambers.json must contain 72 records.');
for (const chamber of chamberRecords) {
  const n = Number(chamber.number ?? chamber.num);
  const record = byNumber.get(n);
  assert(record, `chambers.json contains unknown chamber ${n}`);
  assert(allowed(record, 'angel', chamber.angel), `Chamber ${n}: angel ${chamber.angel} is not canonical or an approved implementation alias.`);
  assert(chamber.daemon === record.current.daemon, `Chamber ${n}: daemon ${chamber.daemon} diverges from Pair Authority ${record.current.daemon}.`);
  assert(allowed(record, 'thirdName', chamber.thirdName), `Chamber ${n}: Third Name ${chamber.thirdName} is not canonical or an approved implementation alias.`);
}

function parseLivingCodex(source) {
  const match = source.match(/const RAW = `([\s\S]*?)`;/);
  assert(match, 'Living Codex RAW table could not be located.');
  return match[1].trim().split(/\r?\n/).filter(Boolean).map((row, index) => {
    const columns = row.split('|');
    assert(columns.length === 15, `Living Codex RAW row ${index + 1} must contain 15 fields.`);
    return { number: Number(columns[0]), triplet: columns[1], angel: columns[5], daemon: columns[10], strength: columns[11], exactCiphers: parseCipherList(columns[12]), angelVector: parseVector(columns[13], `Living Codex ${index + 1} angel`), daemonVector: parseVector(columns[14], `Living Codex ${index + 1} twin`) };
  });
}
function sameVector(a, b) { return ['EO','FR','RO','RFR'].every((key) => a?.[key] === b?.[key]); }
const codexRows = parseLivingCodex(codexJs);
assert(codexRows.length === 72, `Living Codex must expose 72 records, found ${codexRows.length}`);
for (const row of codexRows) {
  const record = byNumber.get(row.number);
  assert(row.triplet === record.shem.triplet, `Living Codex ${row.number}: Hebrew triplet drift.`);
  assert(row.angel === record.current.angel, `Living Codex ${row.number}: angel drift.`);
  assert(row.daemon === record.current.daemon, `Living Codex ${row.number}: gematria twin drift.`);
  assert(row.strength === record.twin.strength, `Living Codex ${row.number}: strength drift.`);
  assert(JSON.stringify(row.exactCiphers) === JSON.stringify(record.twin.exactCiphers), `Living Codex ${row.number}: exact-cipher list drift.`);
  assert(sameVector(row.angelVector, record.twin.angelVector), `Living Codex ${row.number}: angel vector drift.`);
  assert(sameVector(row.daemonVector, record.twin.daemonVector), `Living Codex ${row.number}: daemon vector drift.`);
}

function parseDossier(source) {
  const match = source.match(/const DATA = Object\.freeze\((\[[\s\S]*?\])\);/);
  assert(match, 'Shem Dossier DATA array could not be located.');
  return JSON.parse(match[1]);
}
function normalizeHebrew(value) { return String(value || '').replace(/[ךםןףץ]/g, (char) => ({ ך:'כ', ם:'מ', ן:'נ', ף:'פ', ץ:'צ' })[char]); }
const dossierRows = parseDossier(dossierJs);
assert(dossierRows.length === 72, `Shem Dossier must expose 72 records, found ${dossierRows.length}`);
const dossierVariants = [];
for (const row of dossierRows) {
  const record = byNumber.get(Number(row.num));
  assert(record, `Shem Dossier contains unknown record ${row.num}`);
  const rootExact = normalizeHebrew(row.root) === normalizeHebrew(record.shem.triplet);
  const angelExact = row.nameEn === record.shem.normalizedAngel;
  const constructedHebrewExact = normalizeHebrew(row.fullHe) === normalizeHebrew(record.shem.constructedHebrew);
  if (!rootExact || !angelExact || !constructedHebrewExact) {
    dossierVariants.push({
      pairNumber:Number(row.num),
      rootExact, dossierTriplet:row.root, authorityTriplet:record.shem.triplet,
      angelExact, dossierAngel:row.nameEn, authorityAngel:record.shem.normalizedAngel,
      constructedHebrewExact, dossierConstructedHebrew:row.fullHe, authorityConstructedHebrew:record.shem.constructedHebrew
    });
  }
}
const dossierVariantColumns = ['pairNumber','dossierTriplet','dossierAngel','dossierConstructedHebrew','authorityTriplet','authorityAngel','authorityConstructedHebrew'];
assert(JSON.stringify(report.dossierVariantColumns) === JSON.stringify(dossierVariantColumns), 'Discrepancy report dossier-variant column contract is stale.');
const dossierVariantRows = dossierVariants.map((variant) => [
  variant.pairNumber, variant.dossierTriplet, variant.dossierAngel, variant.dossierConstructedHebrew,
  variant.authorityTriplet, variant.authorityAngel, variant.authorityConstructedHebrew
]);
assert(report.summary.nativeDossierVariantCount === dossierVariants.length, 'Discrepancy report dossier-variant count is stale.');
assert(JSON.stringify(report.dossierSourceVariants) === JSON.stringify(dossierVariantRows), 'Native Shem dossier source variants changed. Review and update provenance explicitly rather than silently accepting the drift.');

const kernelChambers = kernel.records.filter((record) => record.entityType === 'chamber');
for (const kernelRecord of kernelChambers) {
  const n = Number(kernelRecord.attributes?.number);
  const record = byNumber.get(n);
  assert(record, `Knowledge Kernel contains unknown chamber ${n}`);
  assert(allowed(record, 'angel', kernelRecord.attributes?.angel), `Knowledge Kernel chamber ${n}: angel drift.`);
  assert(kernelRecord.attributes?.daemon === record.current.daemon, `Knowledge Kernel chamber ${n}: daemon drift.`);
  assert(allowed(record, 'thirdName', kernelRecord.attributes?.thirdName), `Knowledge Kernel chamber ${n}: Third Name drift.`);
}
const methodRegistryIds = new Set(methods.methods.map((method) => method.id));
assert(methodRegistryIds.has('method.gematria.master-catalogue.v1'), 'Knowledge Kernel must retain the existing Master Catalogue mixed-script method.');
assert(methodRegistryIds.has('method.gematria.solomonic-pairing.v1'), 'Knowledge Kernel must retain the existing Solomonic four-cipher method.');
const sourceRegistryIds = new Set(sources.sources.map((source) => source.id));
assert(sourceRegistryIds.has('source.shem.master-catalogue'), 'Knowledge Kernel source registry must retain the Shem Master Catalogue.');
assert(sourceRegistryIds.has('source.solomonic.pairing-codex'), 'Knowledge Kernel source registry must retain the Solomonic Pairing Codex.');

assert(report.schema === 'temple-of-maat/pair-authority-discrepancy-report-v1' && report.version === '1.0.0', 'Unexpected Pair Authority discrepancy-report contract.');
assert(report.authoritySchema === authority.schema && report.authorityVersion === authority.version, 'Discrepancy report must identify the exact authority contract.');
assert(Array.isArray(report.positionalDivergences) && report.positionalDivergences.length === 72, 'Discrepancy report must retain all 72 positional comparisons.');
const recomputed = {
  daemonExact: records.filter((record) => record.current.daemon === record.positional.daemon).length,
  angelExact: records.filter((record) => record.current.angel === record.positional.angel).length,
  thirdNameExact: records.filter((record) => record.current.thirdName === record.positional.reunitedName).length
};
assert(recomputed.daemonExact === 0, `Current gematria-twin and positional daemon sets unexpectedly overlap at ${recomputed.daemonExact} positions; review method boundaries before changing this invariant.`);
assert(report.summary.gematriaTwinVsPositionalDaemonExactMatches === recomputed.daemonExact, 'Discrepancy report daemon-match count is stale.');
assert(report.summary.gematriaTwinVsPositionalDaemonDivergences === 72 - recomputed.daemonExact, 'Discrepancy report daemon-divergence count is stale.');
assert(report.summary.currentVsPositionalAngelExactSpellings === recomputed.angelExact, 'Discrepancy report angel exact-spelling count is stale.');
assert(report.summary.currentThirdNameVsPositionalReunitedExactMatches === recomputed.thirdNameExact, 'Discrepancy report synthesis-name count is stale.');
assert(authority.summary.currentDaemonMatchesPositionalExact === recomputed.daemonExact && authority.summary.currentAngelMatchesPositionalExact === recomputed.angelExact && authority.summary.currentThirdNameMatchesPositionalReunitedExact === recomputed.thirdNameExact, 'Pair Authority summary is stale.');

const pair17 = byNumber.get(17);
assert(pair17.current.angel === 'Lauviah' && pair17.current.thirdName === 'Valelauviah', 'Pair 17 canonical recurrence identity drifted.');
assert(pair17.aliases?.angel?.includes('Lauviah II') && pair17.aliases?.thirdName?.includes('Valelauviah II'), 'Pair 17 recurrence aliases are required.');
assert(Object.keys(authority.supersession?.supersedes || {}).length === 0 && Object.keys(authority.supersession?.supersededBy || {}).length === 0, 'v1 must not silently supersede any pair record.');
assert(/do not silently (?:reconcile|merge)|no silent reconciliation/i.test(docs), 'Pair Authority docs must preserve the no-silent-reconciliation rule.');
assert(docs.includes('0 / 72'), 'Pair Authority docs must make the complete daemon pair-set divergence visible.');
assert(/comparison[-_ ]only/i.test(docs), 'Pair Authority docs must label the positional set as comparison-only.');
const publicSerialized = JSON.stringify({ authority, shards: authority.recordShards.map((descriptor) => json(descriptor.path)), report });
['temple_research_notebook_v1','temple_scribe_workspace_v1','temple_v525_pilgrim_journey','temple_library_personal_state_v1'].forEach((marker) => assert(!publicSerialized.includes(marker), `Public Pair Authority contains private-state marker ${marker}`));

console.log(JSON.stringify({ ok:true, schema:authority.schema, version:authority.version, recordCount:records.length, currentImplementation:authority.authorityPolicy.currentImplementationId, currentPairMethod:authority.authorityPolicy.authoritativePairingForCurrentImplementation, positionalComparison:authority.authorityPolicy.comparisonPairSet, positionalDaemonExactMatches:recomputed.daemonExact, positionalAngelExactSpellings:recomputed.angelExact, positionalReunitedNameExactMatches:recomputed.thirdNameExact, documentedRecurrenceAliases:authority.summary.documentedRecurrenceAliases, dossierVariantCount:dossierVariants.length, dossierVariants, kernelChambersChecked:kernelChambers.map((record) => record.recordId) }, null, 2));
