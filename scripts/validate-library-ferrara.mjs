import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };
const readJson = (relative) => JSON.parse(fs.readFileSync(file(relative), 'utf8'));

const catalog = readJson('library/catalog.json');
const sourceIndex = readJson('library/sources/biblia-ferrara-amsterdam-1646.index.json');
const studyIndex = readJson('library/studies/verdad-hebrayca-ferrara.index.json');
const sw = fs.readFileSync(file('sw.js'), 'utf8');

const tradition = catalog.traditions.find((item) => item.id === 'tradition.sephardic-biblical-translation');
const source = catalog.sources.find((item) => item.id === 'source.biblia-ferrara-amsterdam-1646-facsimile');
const study = catalog.studies.find((item) => item.id === 'study.verdad-hebrayca-ferrara-gematria');
const discernment = catalog.discernments.find((item) => item.id === 'discernment.ferrara-symbolic-resonance');
if (!tradition || !source || !study || !discernment) fail('Ferrara tradition/source/study/discernment records are incomplete');

if (source.provenanceLayers.length !== 1 || source.provenanceLayers[0] !== 'L1') fail('Ferrara facsimile must remain exactly L1');
if (!source.traditionIds.includes(tradition.id)) fail('Ferrara source is not linked to its tradition');
if (source.rights?.publicExposure !== 'metadata-only') fail('Ferrara facsimile must remain metadata-only in the public Library');
if (source.integrity?.recordCount !== 639) fail('Ferrara consultation facsimile must remain the complete 639-page project source');
for (const marker of ['personal/non-commercial', 'no automated requests', 'preserve Google attribution/watermark', 'jurisdiction']) {
  if (!(source.rights?.notes || '').includes(marker)) fail(`Ferrara source-use term missing: ${marker}`);
}
if (!/Amsterdam.*5406.*1646/i.test(source.sourceMetadata?.edition || '') && !/Amsterdam.*5406.*1646/i.test(source.sourceMetadata?.dateLabel || '')) fail('Ferrara Amsterdam 5406/1646 edition provenance is missing');
if (!/1553/.test(source.sourceMetadata?.dateLabel || '')) fail('Ferrara 1553 textual-lineage anchor is missing');

if (!study.provenanceLayers.includes('L2') || !study.provenanceLayers.includes('L4')) fail('Verdad Hebrayca study must retain L2 computation and L4 contemplation');
if (study.provenanceLayers.includes('L1')) fail('Verdad Hebrayca study must not masquerade as the L1 facsimile');
if (!study.sourceIds.includes(source.id) || !study.traditionIds.includes(tradition.id)) fail('Verdad Hebrayca study must link to the Ferrara source/tradition');
if (study.normalizationProfile?.preservesOriginal !== true) fail('Spanish analysis must explicitly preserve the source record');
if (!/TRADUZIDA/.test(JSON.stringify(study.normalizationProfile)) || !/HEBRAYCA/.test(JSON.stringify(study.normalizationProfile))) fail('Historical TRADUZIDA / HEBRAYCA spellings must remain explicit');
if (!/Standard Hebrew Gematria/i.test(study.computationalMethod?.method || '')) fail('Distinct Hebrew numerical profile is missing from study metadata');
if (!/not evidence|not.*historical|historical evidence/i.test(study.computationalMethod?.reproducibilityNote || '')) fail('Ferrara method must separate arithmetic from historical evidence');

if (discernment.provenanceLayers.length !== 1 || discernment.provenanceLayers[0] !== 'L4') fail('Ferrara symbolic resonance must remain exactly L4');
if (!discernment.studyIds.includes(study.id) || !discernment.sourceIds.includes(source.id)) fail('Ferrara L4 discernment links are incomplete');

if (sourceIndex.sourceId !== source.id) fail('Ferrara source index points to the wrong source record');
if (sourceIndex.sourceBasis?.pageCount !== 639 || sourceIndex.sourceBasis?.fullTextBundledInTempleShell !== false) fail('Ferrara source-index shell boundary drifted');
const witness = (sourceIndex.titlePageWitness?.sourceFaithfulLines || []).join(' ');
for (const marker of ['BIBLIA', 'ESPAÑOLA', 'Traduzida', 'verdad Hebrayca', 'AMSTERDAM', '5406']) {
  if (!witness.includes(marker)) fail(`Ferrara source-faithful title witness missing: ${marker}`);
}
const terms = sourceIndex.digitizationUseTerms || {};
if (terms.fileUse !== 'personal/non-commercial') fail('Ferrara digitization file-use restriction drifted');
if (!/automated requests/i.test(terms.automatedRequests || '')) fail('Ferrara no-automated-request term is missing');
if (!/attribution.*watermark/i.test(terms.attribution || '')) fail('Ferrara Google attribution/watermark term is missing');
if (!/metadata-only/i.test(terms.templeExposure || '')) fail('Ferrara public exposure must remain metadata-only');

if (studyIndex.studyId !== study.id || studyIndex.sourceBasis?.sourceTextKeptSeparate !== true || studyIndex.sourceBasis?.fullSourceTextBundled !== false) fail('Verdad Hebrayca source/study separation drifted');
const spanish = studyIndex.methodProfiles?.spanish26Letter;
const hebrew = studyIndex.methodProfiles?.hebrewStandard;
if (!spanish || !hebrew || spanish.name === hebrew.name) fail('Spanish and Hebrew numerical methods must remain distinct named profiles');
if (!/A=1/.test(spanish.ordinal || '') || !/A=26/.test(spanish.reverseOrdinal || '')) fail('Spanish Ordinal / Reverse Ordinal rules are incomplete');
const spanishRules = (spanish.normalization || []).join(' ');
for (const marker of ['spaces and punctuation', 'accented vowels', 'Ñ as N', 'TRADUZIDA', 'HEBRAYCA']) {
  if (!spanishRules.includes(marker)) fail(`Spanish normalization marker missing: ${marker}`);
}
if (!/twenty-two Hebrew letters/i.test(hebrew.rule || '')) fail('Standard Hebrew gematria rule is incomplete');

const normalizeSpanish = (value) => value
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/Ñ/g, 'N')
  .replace(/[^A-Z]/g, '');
const ordinal = (value) => [...normalizeSpanish(value)].reduce((sum, letter) => sum + letter.charCodeAt(0) - 64, 0);

const units = studyIndex.titleArchitecture?.units || [];
if (units.length !== 3) fail('Ferrara title architecture must keep first, second, and combined units');
const expected = [
  { letters: 22, total: 197 },
  { letters: 44, total: 394 },
  { letters: 66, total: 591 }
];
units.forEach((unit, index) => {
  const letters = normalizeSpanish(unit.calculationString).length;
  const total = ordinal(unit.calculationString);
  if (letters !== expected[index].letters || unit.normalizedLetters !== letters) fail(`Ferrara title unit ${index + 1} letter count does not reproduce: ${letters}`);
  if (total !== expected[index].total || unit.ordinal !== total) fail(`Ferrara title unit ${index + 1} ordinal does not reproduce: ${total}`);
});
if (expected[1].letters !== expected[0].letters * 2 || expected[2].letters !== expected[0].letters * 3) fail('Ferrara 22/44/66 1:2:3 relation failed');
if (expected[1].total !== expected[0].total * 2 || expected[2].total !== expected[0].total * 3) fail('Ferrara 197/394/591 1:2:3 relation failed');
if (studyIndex.titleArchitecture?.authorialIntentClaim !== false) fail('Ferrara title architecture must explicitly deny an authorial-intent claim');
if (!/not.*evidence|does not treat|not.*engineered/i.test(studyIndex.titleArchitecture?.interpretiveLimit || '')) fail('Ferrara title architecture needs an interpretive restraint');

const hebrewRefs = new Map((hebrew.referenceValues || []).map((item) => [item.transliteration, item.value]));
for (const [name, value] of [['ECHAD',13],['AHAVAH',13],['YHWH',26],['ADAM',45],['ELOHIM',86],['OR',207],['EMET',441],['CHOKHMAH',73],['TORAH',611],['SHALOM',376]]) {
  if (hebrewRefs.get(name) !== value) fail(`Ferrara Hebrew reference value drifted: ${name}`);
}

const policy = (studyIndex.ruleOfDiscernment || []).join(' ');
for (const marker of ['spelling and cipher are fixed', 'not changed merely to force', 'symbolic interpretation', 'not proof of authorial intent']) {
  if (!policy.includes(marker)) fail(`Ferrara discernment rule missing: ${marker}`);
}
if (!/contempt, paranoia, isolation, or domination/i.test(studyIndex.ethicalBoundary || '')) fail('Ferrara ethical anti-distortion boundary is missing');

const ferraraCorrespondences = catalog.correspondences.filter((item) => [source.id, study.id, discernment.id].includes(item.fromRecordId));
if (ferraraCorrespondences.length !== 0) fail('Ferrara ingestion must not create chamber correspondences in this phase');

for (const asset of ['library/sources/biblia-ferrara-amsterdam-1646.index.json','library/studies/verdad-hebrayca-ferrara.index.json']) {
  if (sw.includes(asset)) fail(`${asset} must remain outside the initial service-worker app shell`);
}

const forbiddenKeys = new Set(['fullText', 'sourceText', 'chapterText', 'bodyText']);
const walk = (value, trail = 'root') => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${trail}[${index}]`));
  for (const [key, item] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) fail(`Full-source payload key ${key} is forbidden in lightweight Ferrara metadata at ${trail}`);
    walk(item, `${trail}.${key}`);
  }
};
walk(sourceIndex, 'sourceIndex');
walk(studyIndex, 'studyIndex');

console.log(`Validated Ferrara Library ingestion: 639-page L1 Amsterdam 5406/1646 facsimile metadata, Google digitization-use restrictions, distinct Spanish/Hebrew profiles, recomputed 22/44/66 and 197/394/591 title architecture, symbolic-not-causal restraint, no full source shell payload, and no chamber identity links.`);
