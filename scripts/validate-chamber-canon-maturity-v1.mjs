import fs from 'node:fs';

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const fail = (message) => {
  console.error(`CANON_MATURITY_ERROR: ${message}`);
  process.exitCode = 1;
};
const blank = (value) => typeof value === 'string' && value.trim().length === 0;
const present = (value) => value !== null && value !== undefined && !blank(value);
const eq = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const rowObject = (columns, row) => Object.fromEntries(columns.map((key, index) => [key, row[index]]));

const registryPath = 'research/chamber-canon-maturity.v1.json';
const chamberPath = 'chambers.json';
const pairAuthorityPath = 'research/pair-authority.json';

for (const path of [registryPath, chamberPath, 'research/relationship-graph.json', pairAuthorityPath]) {
  if (!fs.existsSync(path)) fail(`Missing required source: ${path}`);
}
if (process.exitCode) process.exit(process.exitCode);

const registry = readJson(registryPath);
const archive = readJson(chamberPath);
const pairAuthority = readJson(pairAuthorityPath);

if (registry.schema !== 'temple-of-maat/chamber-canon-maturity-v1') {
  fail(`Unexpected registry schema: ${registry.schema}`);
}
if (registry.version !== '1.0.0') fail(`Unexpected registry version: ${registry.version}`);
if (registry.policy?.missingHistoricalEvidence !== 'UNMAPPED') {
  fail('Missing historical evidence must resolve to UNMAPPED.');
}
if (registry.policy?.historicalIdentityDefault !== false) {
  fail('historicalIdentityDefault must be false.');
}
if (registry.policy?.metaphysicalIdentityDefault !== false) {
  fail('metaphysicalIdentityDefault must be false.');
}
if (registry.policy?.appendOnlyCanon !== true) fail('appendOnlyCanon must be true.');
if (registry.policy?.blankFieldsCountAsComplete !== false) {
  fail('Blank fields must not count as complete.');
}
if (registry.policy?.fabricatedProvenanceAllowed !== false) {
  fail('Fabricated provenance must not be allowed.');
}

const chambers = Array.isArray(archive.chambers) ? archive.chambers : [];
const expected = registry.chamberRange?.expectedCount;
if (expected !== 72) fail(`Registry expectedCount must remain 72, found ${expected}`);
if (archive.chamberCount !== 72) fail(`chambers.json chamberCount must remain 72, found ${archive.chamberCount}`);
if (chambers.length !== 72) fail(`chambers.json must contain 72 records, found ${chambers.length}`);

const numbers = chambers.map((record) => Number(record.number));
const unique = new Set(numbers);
if (unique.size !== 72) fail(`Chamber numbers are not unique: ${unique.size}/72 unique`);
for (let number = 1; number <= 72; number += 1) {
  if (!unique.has(number)) fail(`Missing chamber number ${number}`);
}

const requiredCoreFields = Array.isArray(registry.requiredCoreFields) ? registry.requiredCoreFields : [];
const missing = (record, field) => {
  if (!(field in record)) return true;
  return !present(record[field]);
};

for (const record of chambers) {
  const label = String(record.number).padStart(2, '0');
  if (record.id !== label) fail(`Chamber ${label} id must be ${label}, found ${record.id}`);

  for (const field of requiredCoreFields) {
    if (missing(record, field)) fail(`Chamber ${label} missing required core field ${field}`);
  }

  if (typeof record.fire !== 'object' || Array.isArray(record.fire)) {
    fail(`Chamber ${label} fire must be an object`);
  } else {
    for (const field of ['id', 'name', 'pillar']) {
      if (!(field in record.fire) || !present(record.fire[field])) {
        fail(`Chamber ${label} fire missing ${field}`);
      }
    }
  }

  if (typeof record.recurrence !== 'boolean') fail(`Chamber ${label} recurrence must be boolean`);
  if (typeof record.tetrad !== 'boolean') fail(`Chamber ${label} tetrad must be boolean`);
}

const requiredExpanded = [
  'numericalField',
  'sacredLimitation',
  'antiDistortionMechanism',
  'maatTest',
  'invocation',
  'sealProvenance',
  'historicalProvenance',
  'symbolicProvenance',
  'review'
];
const declaredExpanded = new Set(registry.expandedCanonFields || []);
for (const field of requiredExpanded) {
  if (!declaredExpanded.has(field)) fail(`Registry missing expanded canon field ${field}`);
}

const allowedStates = new Set(registry.allowedCompletionStates || []);
for (const state of ['REVIEWED', 'UNMAPPED', 'WITHHELD', 'NOT_APPLICABLE']) {
  if (!allowedStates.has(state)) fail(`Registry missing completion state ${state}`);
}

const batches = Array.isArray(registry.batchPlan) ? registry.batchPlan : [];
const expectedBatches = [
  ['A', 1, 24],
  ['B', 25, 48],
  ['C', 49, 72]
];
for (const [id, first, last] of expectedBatches) {
  const batch = batches.find((entry) => entry.id === id);
  if (!batch || batch.first !== first || batch.last !== last) {
    fail(`Batch ${id} must cover ${first}-${last}`);
  }
}

function loadPairRows(first, last) {
  const rows = new Map();
  for (const shard of pairAuthority.recordShards || []) {
    if (shard.end < first || shard.start > last) continue;
    if (!fs.existsSync(shard.path)) {
      fail(`Missing Pair Authority shard: ${shard.path}`);
      continue;
    }
    const source = readJson(shard.path);
    for (const row of source.records || []) {
      const record = rowObject(source.recordColumns || [], row);
      if (record.pairNumber >= first && record.pairNumber <= last) rows.set(record.pairNumber, record);
    }
  }
  return rows;
}

function validateReviewedBatch(batch) {
  if (!present(batch.manifest) || !fs.existsSync(batch.manifest)) {
    fail(`Reviewed Batch ${batch.id} must name an existing manifest.`);
    return 0;
  }
  const manifest = readJson(batch.manifest);
  if (manifest.schema !== 'temple-of-maat/chamber-canon-batch-v1') {
    fail(`Batch ${batch.id} manifest schema mismatch: ${manifest.schema}`);
  }
  if (manifest.version !== '1.0.0' || manifest.batch !== batch.id || manifest.status !== 'REVIEWED') {
    fail(`Batch ${batch.id} manifest identity/status mismatch.`);
  }
  if (!eq(manifest.range, [batch.first, batch.last])) {
    fail(`Batch ${batch.id} manifest range mismatch.`);
  }

  const expectedColumns = [
    'number',
    'id',
    'coreRecord',
    'codexRecord',
    'pairAuthorityRecord',
    'reviewStatus',
    'canonVersion',
    ...requiredExpanded
  ];
  if (!eq(manifest.recordColumns, expectedColumns)) {
    fail(`Batch ${batch.id} recordColumns do not match the Canon 1.0 contract.`);
  }

  const profiles = manifest.profiles || {};
  const maatProfile = profiles['maat-test-v1'];
  if (maatProfile?.layer !== 'L4' || !Array.isArray(maatProfile.questions) || maatProfile.questions.length < 5) {
    fail(`Batch ${batch.id} missing the five-question Ma'at baseline.`);
  }
  const claimProfile = profiles['pair-authority-v1'];
  for (const key of [
    'historicalIdentity',
    'metaphysicalIdentity',
    'pairingIsHistoricalGoetiaClaim',
    'numericalCorrespondenceProvesIdentity'
  ]) {
    if (claimProfile?.[key] !== false) fail(`Batch ${batch.id} claim boundary ${key} must remain false.`);
  }
  if (profiles.SEAL_MOTIF_AUDIT_PENDING?.state !== 'UNMAPPED' ||
      !present(profiles.SEAL_MOTIF_AUDIT_PENDING?.reason)) {
    fail(`Batch ${batch.id} seal audit placeholder must remain explicit UNMAPPED with a reason.`);
  }

  const records = [];
  for (const shard of manifest.recordShards || []) {
    if (!fs.existsSync(shard.path)) {
      fail(`Missing Batch ${batch.id} shard: ${shard.path}`);
      continue;
    }
    const source = readJson(shard.path);
    if (source.schema !== 'temple-of-maat/chamber-canon-batch-shard-v1' ||
        source.version !== manifest.version ||
        source.batch !== batch.id) {
      fail(`Batch ${batch.id} shard identity mismatch: ${shard.path}`);
    }
    if (!eq(source.recordColumns, manifest.recordColumns)) {
      fail(`Batch ${batch.id} shard columns mismatch: ${shard.path}`);
    }
    const decoded = (source.records || []).map((row) => rowObject(source.recordColumns, row));
    if (decoded.length !== shard.count) {
      fail(`Batch ${batch.id} shard ${shard.path} expected ${shard.count} records, found ${decoded.length}`);
    }
    records.push(...decoded);
  }

  const expectedCount = batch.last - batch.first + 1;
  if (records.length !== expectedCount) {
    fail(`Batch ${batch.id} must contain ${expectedCount} expanded records, found ${records.length}`);
  }
  const recordNumbers = new Set(records.map((record) => Number(record.number)));
  if (recordNumbers.size !== expectedCount) fail(`Batch ${batch.id} expanded chamber numbers are not unique.`);
  for (let number = batch.first; number <= batch.last; number += 1) {
    if (!recordNumbers.has(number)) fail(`Batch ${batch.id} missing expanded chamber ${number}`);
  }

  const pairRows = loadPairRows(batch.first, batch.last);
  if (pairRows.size !== expectedCount) {
    fail(`Batch ${batch.id} expected ${expectedCount} Pair Authority rows, found ${pairRows.size}.`);
  }
  const cipherOrder = ['EO', 'FR', 'RO', 'RFR'];

  for (const record of records) {
    const number = Number(record.number);
    const label = String(number).padStart(2, '0');
    const core = chambers.find((item) => Number(item.number) === number);
    const pair = pairRows.get(number);
    if (!core || !pair) continue;

    if (record.id !== label) fail(`Expanded chamber ${label} id mismatch.`);
    if (record.coreRecord !== `chambers.json#chamber-${label}`) {
      fail(`Expanded chamber ${label} coreRecord pointer mismatch.`);
    }
    if (record.codexRecord !== `scripts/v5.2.4-living-codex.js#pair-${label}`) {
      fail(`Expanded chamber ${label} codexRecord pointer mismatch.`);
    }
    if (record.pairAuthorityRecord !== `pair.${label}`) {
      fail(`Expanded chamber ${label} Pair Authority pointer mismatch.`);
    }
    if (record.reviewStatus !== 'REVIEWED' || !present(record.canonVersion)) {
      fail(`Expanded chamber ${label} must be REVIEWED with a canonVersion.`);
    }

    const aliases = record.numericalField?.implementationAliases;
    if (number === 17) {
      if (core.daemon !== pair.currentDaemon ||
          !aliases?.angel?.includes(core.angel) ||
          !aliases?.thirdName?.includes(core.thirdName)) {
        fail('Chamber 17 deployed recurrence aliases are not preserved explicitly.');
      }
    } else if (core.angel !== pair.normalizedAngel ||
               core.daemon !== pair.currentDaemon ||
               core.thirdName !== pair.currentThirdName) {
      fail(`Chamber ${label} core identity diverges from Pair Authority without an approved alias.`);
    }

    for (const field of requiredExpanded) {
      const value = record[field];
      if (!value || typeof value !== 'object' || !allowedStates.has(value.state)) {
        fail(`Expanded chamber ${label} ${field} lacks an allowed explicit completion state.`);
      }
    }

    const numerical = record.numericalField;
    const shem = numerical?.shem || {};
    const twin = numerical?.twin || {};
    const expectedShem = {
      methodId: 'shem-triplet-hebrew-v1',
      sourceId: 'shem-master-catalogue-v1',
      locator: `§4 No. ${label}`,
      triplet: pair.triplet,
      transliteration: pair.transliteration,
      angelInput: pair.normalizedAngel,
      suffix: pair.suffix,
      constructedHebrew: pair.constructedHebrew,
      tripletGematria: pair.tripletGematria,
      tripletDigitalRoot: pair.tripletDigitalRoot,
      fullGematria: pair.fullGematria,
      fullDigitalRoot: pair.fullDigitalRoot
    };
    const expectedTwin = {
      methodId: 'gematria-twin-crossmatch-v1',
      sourceId: 'shem-master-catalogue-v1',
      locator: `§10.3 No. ${label}`,
      angelInput: pair.normalizedAngel,
      daemonInput: pair.currentDaemon,
      cipherOrder,
      angelVector: String(pair.twinAngelVector).split('/').map(Number),
      daemonVector: String(pair.twinDaemonVector).split('/').map(Number),
      exactCiphers: String(pair.twinExactCiphers || '').split(',').filter(Boolean),
      strength: pair.twinStrength
    };
    if (numerical?.state !== 'REVIEWED' || numerical?.layer !== 'L2' ||
        !eq(shem, expectedShem) || !eq(twin, expectedTwin)) {
      fail(`Expanded chamber ${label} numerical field does not reproduce Pair Authority exactly.`);
    }
    if (numerical.claimBoundaryRef !== 'pair-authority-v1') {
      fail(`Expanded chamber ${label} numerical claim boundary is missing.`);
    }

    if (!present(record.sacredLimitation?.text)) fail(`Expanded chamber ${label} Sacred Limitation is blank.`);
    if (!present(record.antiDistortionMechanism?.practice)) fail(`Expanded chamber ${label} Anti-Distortion practice is blank.`);
    if (record.maatTest?.baselineRef !== 'maat-test-v1' || !present(record.maatTest?.additionalQuestion)) {
      fail(`Expanded chamber ${label} Ma'at Test is incomplete.`);
    }
    if (record.invocation?.composition !== 'modern-original-temple' || !present(record.invocation?.text)) {
      fail(`Expanded chamber ${label} invocation must be explicit modern/original Temple language.`);
    }
    if (record.sealProvenance?.state !== 'UNMAPPED' ||
        record.sealProvenance?.reasonCode !== 'SEAL_MOTIF_AUDIT_PENDING') {
      fail(`Expanded chamber ${label} seal provenance must stay visibly UNMAPPED until motif audit.`);
    }
    if (record.historicalProvenance?.pairingStatus !==
        'MODERN_COMPUTATIONAL_CORRESPONDENCE_NOT_ORIGINAL_GOETIA_TWIN_CLAIM' ||
        record.historicalProvenance?.thirdNameStatus !== 'MODERN_TEMPLE_SYNTHESIS') {
      fail(`Expanded chamber ${label} historical provenance boundary is weakened.`);
    }
    if (record.symbolicProvenance?.profileRef !== 'temple-symbolic-profile-v1') {
      fail(`Expanded chamber ${label} symbolic provenance profile is missing.`);
    }
    if (record.review?.profileRef !== 'canon-review-profile-v1' ||
        !Array.isArray(record.review?.openQuestions) ||
        !Array.isArray(record.review?.amendments)) {
      fail(`Expanded chamber ${label} review block is incomplete.`);
    }
  }

  return records.length;
}

let expandedReviewed = 0;
for (const batch of batches) {
  if (batch.status === 'REVIEWED') expandedReviewed += validateReviewedBatch(batch);
}
if (registry.baseline?.expandedReviewedCount !== expandedReviewed) {
  fail(`Registry expandedReviewedCount=${registry.baseline?.expandedReviewedCount}, validated ${expandedReviewed}.`);
}
if (expandedReviewed > 0 && expandedReviewed < 72 && registry.baseline?.expandedCanonStatus !== 'IN_REVIEW') {
  fail('Expanded canon must report IN_REVIEW until all 72 chambers are reviewed.');
}
if (expandedReviewed === 72 && registry.baseline?.expandedCanonStatus !== 'REVIEWED') {
  fail('A complete 72/72 expanded canon must report REVIEWED.');
}

if (process.exitCode) process.exit(process.exitCode);

console.log('Canon 1.0 chamber maturity baseline: PASS');
console.log(`Core chamber integrity: ${chambers.length}/72`);
console.log(`Expanded canon target families: ${declaredExpanded.size}`);
console.log(`Expanded Canon reviewed: ${expandedReviewed}/72`);
for (const batch of batches) {
  console.log(`Batch ${batch.id}: ${batch.status}`);
}
