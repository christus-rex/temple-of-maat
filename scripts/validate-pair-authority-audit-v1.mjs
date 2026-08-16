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
const MIGRATION_PATH = 'research/pair-authority-name-migration.v1.json';
const MIGRATION_SCHEMA_PATH = 'research/pair-authority-name-migration.v1.schema.json';
const CHAMBERS_PATH = 'chambers.json';
for (const relative of [AUTHORITY_PATH, MIGRATION_PATH, MIGRATION_SCHEMA_PATH, CHAMBERS_PATH]) {
  assert(fs.existsSync(file(relative)), `Pair Authority audit dependency missing: ${relative}`);
}

const authority = json(AUTHORITY_PATH);
const migration = json(MIGRATION_PATH);
const migrationSchema = json(MIGRATION_SCHEMA_PATH);
const chambersPayload = json(CHAMBERS_PATH);
const chambers = Array.isArray(chambersPayload) ? chambersPayload : chambersPayload.chambers;

assert(authority.schema === 'temple-of-maat/pair-authority-v1', 'Pair Authority manifest schema drifted.');
assert(authority.authorityPolicy?.nameMigrationRegistry === MIGRATION_PATH, 'Pair Authority must link the reviewed Third Name migration registry.');
assert(authority.authorityPolicy?.authoritativeThirdNameMethod === 'temple-third-name-v1', 'Deployed Third Name authority must remain Amendment I until an explicit migration release.');
assert(authority.authorityPolicy?.preferredCanonicalThirdNameMethod === 'temple-third-name-refined-v2', 'Amendment II must remain the preferred future Third Name method.');
assert(authority.currentImplementationContract?.namingMethod === 'temple-third-name-v1', 'Current implementation naming method must remain legacy Amendment I.');
assert(authority.currentImplementationContract?.preferredFutureNamingMethod === 'temple-third-name-refined-v2', 'Current implementation must point to the Amendment II future naming method.');
assert(authority.currentImplementationContract?.nameMigrationStatus === 'NOT_MIGRATED', 'This audit release must not silently migrate live chamber names.');
assert(authority.methods.some((method) => method.id === 'temple-third-name-refined-v2'), 'Pair Authority is missing temple-third-name-refined-v2.');
assert(authority.fieldProvenance?.['preferred.thirdName']?.sourceId === 'effective-temple-canon-v1', 'Preferred Third Name provenance must point to the Effective Temple canon.');

assert(migrationSchema.properties?.schema?.const === 'temple-of-maat/pair-authority-name-migration-v1', 'Third Name migration schema contract drifted.');
assert(migrationSchema.properties?.version?.const === '1.0.0', 'Third Name migration schema version drifted.');
assert(migration.schema === 'temple-of-maat/pair-authority-name-migration-v1', 'Unexpected Third Name migration schema.');
assert(migration.version === '1.0.0' && migration.privacy === 'public-canonical-only', 'Third Name migration version/privacy drifted.');
assert(migration.sourceId === 'effective-temple-canon-v1', 'Third Name migration must remain source-bound to the Effective Temple canon.');
assert(migration.legacyMethod === 'temple-third-name-v1' && migration.preferredMethod === 'temple-third-name-refined-v2', 'Third Name migration method identities drifted.');
assert(/AMENDMENT I/i.test(migration.sourceLocators?.legacy || '') && /AMENDMENT II/i.test(migration.sourceLocators?.preferred || ''), 'Third Name migration must preserve Amendment I and II source locators.');
assert(migration.summary?.recordCount === 72 && migration.summary?.implementationMigrated === false, 'Third Name migration summary contract drifted.');
assert(Array.isArray(migration.records) && migration.records.length === 72, 'Third Name migration must contain exactly 72 records.');
assert(unique(migration.records.map((record) => record.recordId)) && unique(migration.records.map((record) => record.pairNumber)), 'Third Name migration IDs/pair numbers must be unique.');

const columns = authority.recordColumns;
assert(Array.isArray(columns) && columns.length === 26, 'Pair Authority column contract must contain 26 fields.');
const index = Object.fromEntries(columns.map((column, i) => [column, i]));
const requiredColumns = ['pairNumber','triplet','normalizedAngel','constructedHebrew','tripletGematria','tripletDigitalRoot','fullGematria','fullDigitalRoot','currentDaemon','currentThirdName','twinStrength','twinExactCiphers','twinAngelVector','twinDaemonVector','positionalAngel','positionalDaemon','positionalAngelVector','positionalDaemonVector','positionalExactCiphers'];
requiredColumns.forEach((column) => assert(Number.isInteger(index[column]), `Pair Authority audit missing column ${column}.`));

const rows = [];
for (const descriptor of authority.recordShards || []) {
  assert(fs.existsSync(file(descriptor.path)), `Missing Pair Authority shard ${descriptor.path}`);
  const shard = json(descriptor.path);
  assert(JSON.stringify(shard.recordColumns) === JSON.stringify(columns), `${descriptor.path}: column contract drifted.`);
  assert(Array.isArray(shard.records) && shard.records.length === descriptor.count, `${descriptor.path}: record count drifted.`);
  rows.push(...shard.records);
}
assert(rows.length === 72, `Expected 72 Pair Authority rows, found ${rows.length}.`);
const byNumber = new Map(rows.map((row) => [Number(row[index.pairNumber]), row]));
assert(byNumber.size === 72, 'Pair Authority pair numbers must remain unique.');

const latinLetters = (value) => String(value || '').toUpperCase().replace(/[^A-Z]/g, '');
const digitalRoot = (value) => {
  const n = Math.abs(Number(value));
  if (!Number.isFinite(n) || n === 0) return 0;
  return 1 + ((Math.trunc(n) - 1) % 9);
};
const ordinal = (letter) => letter.charCodeAt(0) - 64;
const reverseOrdinal = (letter) => 27 - ordinal(letter);
const fullReductionValue = (value) => 1 + ((value - 1) % 9);
const cipherVector = (name) => {
  const letters = [...latinLetters(name)];
  return {
    EO: letters.reduce((sum, letter) => sum + ordinal(letter), 0),
    FR: letters.reduce((sum, letter) => sum + fullReductionValue(ordinal(letter)), 0),
    RO: letters.reduce((sum, letter) => sum + reverseOrdinal(letter), 0),
    RFR: letters.reduce((sum, letter) => sum + fullReductionValue(reverseOrdinal(letter)), 0)
  };
};
const CIPHERS = ['EO','FR','RO','RFR'];
const parseVector = (value, label) => {
  const parts = String(value || '').split('/').map(Number);
  assert(parts.length === 4 && parts.every(Number.isFinite), `${label}: invalid stored cipher vector ${value}`);
  return Object.fromEntries(CIPHERS.map((cipher, i) => [cipher, parts[i]]));
};
const exactCiphers = (left, right) => CIPHERS.filter((cipher) => left[cipher] === right[cipher]);
const parseCipherList = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const sameVector = (left, right) => CIPHERS.every((cipher) => left[cipher] === right[cipher]);
const strengthFor = (count) => ({0:'No exact',1:'Single exact',2:'Double match',3:'Triple lock',4:'Tetrad exact'})[count];

const HEBREW = {
  'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,
  'י':10,'כ':20,'ך':20,'ל':30,'מ':40,'ם':40,'נ':50,'ן':50,'ס':60,
  'ע':70,'פ':80,'ף':80,'צ':90,'ץ':90,'ק':100,'ר':200,'ש':300,'ת':400
};
const hebrewGematria = (value, label) => [...String(value || '')].reduce((sum, letter) => {
  assert(Object.hasOwn(HEBREW, letter), `${label}: unsupported Hebrew character ${letter}`);
  return sum + HEBREW[letter];
}, 0);

let arithmeticRows = 0;
for (let n = 1; n <= 72; n += 1) {
  const row = byNumber.get(n);
  assert(row, `Missing Pair Authority row ${n}.`);
  const tripletTotal = hebrewGematria(row[index.triplet], `pair ${n} triplet`);
  const fullTotal = hebrewGematria(row[index.constructedHebrew], `pair ${n} constructed Hebrew`);
  assert(tripletTotal === Number(row[index.tripletGematria]), `Pair ${n}: triplet Mispar Hechrechi recomputation mismatch.`);
  assert(fullTotal === Number(row[index.fullGematria]), `Pair ${n}: constructed-Hebrew Mispar Hechrechi recomputation mismatch.`);
  assert(digitalRoot(tripletTotal) === Number(row[index.tripletDigitalRoot]), `Pair ${n}: triplet digital root mismatch.`);
  assert(digitalRoot(fullTotal) === Number(row[index.fullDigitalRoot]), `Pair ${n}: full-name digital root mismatch.`);

  const currentAngel = cipherVector(row[index.normalizedAngel]);
  const currentDaemon = cipherVector(row[index.currentDaemon]);
  const storedCurrentAngel = parseVector(row[index.twinAngelVector], `pair ${n} current angel`);
  const storedCurrentDaemon = parseVector(row[index.twinDaemonVector], `pair ${n} current daemon`);
  assert(sameVector(currentAngel, storedCurrentAngel), `Pair ${n}: independently recomputed current angel vector mismatch.`);
  assert(sameVector(currentDaemon, storedCurrentDaemon), `Pair ${n}: independently recomputed current daemon vector mismatch.`);
  const currentExact = exactCiphers(currentAngel, currentDaemon);
  assert(JSON.stringify(currentExact) === JSON.stringify(parseCipherList(row[index.twinExactCiphers])), `Pair ${n}: current exact-cipher list does not follow recomputed values.`);
  assert(row[index.twinStrength] === strengthFor(currentExact.length), `Pair ${n}: strength label does not match ${currentExact.length} exact ciphers.`);

  const positionalAngel = cipherVector(row[index.positionalAngel]);
  const positionalDaemon = cipherVector(row[index.positionalDaemon]);
  const storedPositionalAngel = parseVector(row[index.positionalAngelVector], `pair ${n} positional angel`);
  const storedPositionalDaemon = parseVector(row[index.positionalDaemonVector], `pair ${n} positional daemon`);
  assert(sameVector(positionalAngel, storedPositionalAngel), `Pair ${n}: independently recomputed positional angel vector mismatch.`);
  assert(sameVector(positionalDaemon, storedPositionalDaemon), `Pair ${n}: independently recomputed positional daemon vector mismatch.`);
  const positionalExact = exactCiphers(positionalAngel, positionalDaemon);
  assert(JSON.stringify(positionalExact) === JSON.stringify(parseCipherList(row[index.positionalExactCiphers])), `Pair ${n}: positional exact-cipher list does not follow recomputed values.`);
  arithmeticRows += 1;
}

let substantive = 0;
let aliases = 0;
const migrationByNumber = new Map();
for (const record of migration.records) {
  const n = Number(record.pairNumber);
  assert(record.recordId === `pair.${String(n).padStart(2, '0')}`, `Migration pair ${n}: record ID drifted.`);
  assert(n >= 1 && n <= 72 && Number.isInteger(n), `Migration record has invalid pair number ${record.pairNumber}.`);
  const row = byNumber.get(n);
  assert(record.angel === row[index.normalizedAngel], `Migration pair ${n}: angel does not match Pair Authority source row.`);
  assert(record.daemon === row[index.currentDaemon], `Migration pair ${n}: daemon does not match Pair Authority source row.`);
  assert(record.legacyThirdName === row[index.currentThirdName], `Migration pair ${n}: Amendment I legacy Third Name does not match deployed authority row.`);
  const same = record.legacyThirdName.toLocaleLowerCase('en-US') === record.preferredRefinedThirdName.toLocaleLowerCase('en-US');
  assert(record.sameIgnoringCase === same, `Migration pair ${n}: sameIgnoringCase is stale.`);
  assert(record.migrationStatus === (same ? 'ALIAS_EQUIVALENT' : 'PENDING_IMPLEMENTATION_MIGRATION'), `Migration pair ${n}: migration status is inconsistent.`);
  if (same) aliases += 1; else substantive += 1;
  migrationByNumber.set(n, record);
}
assert(substantive === 44 && aliases === 28, `Third Name refinement count drifted: ${substantive} substantive / ${aliases} alias-equivalent.`);
assert(migration.summary.substantiveSpellingChanges === substantive && migration.summary.sameIgnoringCase === aliases, 'Third Name migration summary counts are stale.');
assert(authority.summary?.refinedThirdNameSubstantiveChanges === substantive && authority.summary?.refinedThirdNameSameIgnoringCase === aliases, 'Pair Authority refinement summary counts are stale.');
assert(authority.summary?.currentImplementationUsesRefinedNames === false, 'Pair Authority must not claim the current implementation already uses Amendment II names.');
assert(migrationByNumber.get(17)?.preferredRefinedThirdName === 'VALAUVIAH', 'Pair 17 Amendment II preferred Third Name must remain VALAUVIAH.');

assert(Array.isArray(chambers) && chambers.length === 72, 'chambers.json must contain 72 records for migration boundary validation.');
for (const chamber of chambers) {
  const n = Number(chamber.number ?? chamber.num);
  const migrationRecord = migrationByNumber.get(n);
  assert(migrationRecord, `chambers.json contains unknown chamber ${n}.`);
  if (!migrationRecord.sameIgnoringCase) {
    assert(String(chamber.thirdName || '').toLocaleLowerCase('en-US') !== migrationRecord.preferredRefinedThirdName.toLocaleLowerCase('en-US'), `Chamber ${n}: Amendment II preferred name was silently migrated into the live chamber archive.`);
  }
}

const publicAuditText = JSON.stringify({authority, migration});
for (const marker of ['temple_research_notebook','temple_scribe_workspace','temple_pilgrimage','temple_library_','localStorage','indexedDB']) {
  assert(!publicAuditText.includes(marker), `Public Pair Authority audit artifacts leaked private-state marker ${marker}.`);
}

console.log(JSON.stringify({
  ok:true,
  schema:'temple-of-maat/pair-authority-audit-v1',
  pairRecords:72,
  arithmeticRowsVerified:arithmeticRows,
  latinCipherSystems:['EO','FR','RO','RFR'],
  hebrewMethod:'Mispar Hechrechi',
  refinedNameRecords:72,
  substantiveRefinedNames:substantive,
  aliasEquivalentRefinedNames:aliases,
  implementationMigrated:false,
  pair17PreferredRefinedThirdName:migrationByNumber.get(17).preferredRefinedThirdName
}, null, 2));
