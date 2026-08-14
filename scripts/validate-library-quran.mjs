import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };
const readJson = (relative) => JSON.parse(fs.readFileSync(file(relative), 'utf8'));

const catalog = readJson('library/catalog.json');
const sourceIndex = readJson('library/sources/quran-tanzil-pickthall.index.json');
const studyIndex = readJson('library/studies/quran-abjad.index.json');
const sw = fs.readFileSync(file('sw.js'), 'utf8');

const tradition = catalog.traditions.find((item) => item.id === 'tradition.islamic-scripture');
const source = catalog.sources.find((item) => item.id === 'source.quran-tanzil-pickthall-edition');
const study = catalog.studies.find((item) => item.id === 'study.quran-abjad-gematria');
if (!tradition || !source || !study) fail('Qur\'an tradition/source/study records are incomplete');

if (!source.provenanceLayers.includes('L1')) fail('Qur\'an source edition must include L1');
if (!source.traditionIds.includes(tradition.id)) fail('Qur\'an source is not linked to the Islamic-scripture tradition');
if (source.integrity?.recordCount !== 6236) fail('Qur\'an source record count must remain 6,236');
if (source.integrity?.sha256 !== '7628eeb5456a994b6aca2336d316e6cf37dd4a9aec118de6553552d49c2f10ca') fail('Qur\'an Arabic source hash drifted');
if (source.rights?.publicExposure !== 'metadata-only') fail('Qur\'an Library source must remain metadata-only in the initial shell');
for (const marker of ['Tanzil Project','Creative Commons Attribution 3.0','Pickthall','Project Gutenberg','public domain in the United States']) {
  if (!(source.rights?.attribution || '').includes(marker) && !(source.rights?.license || '').includes(marker)) fail(`Qur'an attribution/license marker missing: ${marker}`);
}

if (study.provenanceLayers.length !== 1 || study.provenanceLayers[0] !== 'L2') fail('Qur\'an Abjad study must remain exactly L2');
if (!study.sourceIds.includes(source.id) || !study.traditionIds.includes(tradition.id)) fail('Qur\'an Abjad study is not linked to its source/tradition');
if (study.normalizationProfile?.preservesOriginal !== true) fail('Abjad normalization must explicitly preserve the original source');
if (!Array.isArray(study.normalizationProfile?.rules) || study.normalizationProfile.rules.length !== 7) fail('Abjad normalization must keep all seven declared rule groups');
if (!/source edition remains unchanged/i.test(study.normalizationProfile?.sourcePolicy || '')) fail('Abjad study must keep analytical normalization separate from the source edition');
if (!/Arithmetic patterns are not independent proof/i.test(study.summary || '')) fail('Abjad study summary lacks doctrine/code restraint');

if (sourceIndex.sourceId !== source.id) fail('Qur\'an source index points to the wrong source record');
if (sourceIndex.sourceBasis?.pageCount !== 466) fail('Qur\'an source volume must remain 466 pages');
if (sourceIndex.sourceBasis?.analyticalNormalizationApplied !== false) fail('Qur\'an source edition must not receive analytical normalization');
if (sourceIndex.sourceBasis?.fullTextBundledInTempleShell !== false) fail('Full Qur\'an source must not enter the initial PWA shell');
if (!/outer whitespace only/i.test(sourceIndex.sourceBasis?.arabicReproductionPolicy || '')) fail('Arabic source reproduction policy drifted');
if (sourceIndex.corpusIntegrity?.arabic?.records !== 6236 || sourceIndex.corpusIntegrity?.pickthall?.records !== 6236) fail('Arabic/Pickthall 6,236-verse audits must match');
if (sourceIndex.corpusIntegrity?.arabic?.sha256 !== '7628eeb5456a994b6aca2336d316e6cf37dd4a9aec118de6553552d49c2f10ca') fail('Arabic source-index hash drifted');
if (sourceIndex.corpusIntegrity?.pickthall?.sha256 !== '3b96fa3ad318ab9d91db53b25100d5169fafe3a1ecb993e7c36ffff55bf9d8bc') fail('Pickthall/Gutenberg source-index hash drifted');
if (sourceIndex.rights?.tanzil?.license !== 'Creative Commons Attribution 3.0') fail('Tanzil CC BY 3.0 license metadata drifted');
if ((sourceIndex.rights?.tanzil?.terms || []).length < 3) fail('Tanzil reproduced terms-of-use metadata is incomplete');
if (!/Public domain in the United States/i.test(sourceIndex.rights?.pickthall?.status || '')) fail('Pickthall public-domain attribution is missing');

if (!Array.isArray(sourceIndex.surahs) || sourceIndex.surahs.length !== 114) fail(`Expected 114 surah TOC records, found ${sourceIndex.surahs?.length}`);
if (sourceIndex.surahs.some((item, index) => item.number !== index + 1)) fail('Surah index must remain sequential 1–114');
if (sourceIndex.surahs.some((item, index, rows) => index > 0 && item.pageStart < rows[index - 1].pageStart)) fail('Surah page starts must be monotonic');
if (sourceIndex.surahs[0]?.pageStart !== 7 || sourceIndex.surahs[113]?.pageStart !== 466) fail('Surah TOC page boundaries drifted');
if (sourceIndex.searchAddressing?.ayahRecordCount !== 6236 || sourceIndex.searchAddressing?.addressFormat !== 'surah:ayah') fail('Surah/ayah addressing contract is incomplete');
if (!/full verse text is loaded only/i.test(sourceIndex.searchAddressing?.initialShellBehavior || '')) fail('Surah/ayah search must remain lazy rather than bundling full source text');

if (studyIndex.studyId !== study.id || studyIndex.sourceBasis?.pageCount !== 41 || studyIndex.sourceBasis?.sourceTextKeptSeparate !== true) fail('Qur\'an Abjad study source boundary drifted');
if (studyIndex.corpusAudit?.surahs !== 114 || studyIndex.corpusAudit?.ayahs !== 6236) fail('Abjad corpus audit must remain 114 surahs / 6,236 ayahs');
if (studyIndex.hashes?.arabicCorpusSha256 !== sourceIndex.corpusIntegrity.arabic.sha256 || studyIndex.hashes?.gutenbergSourceSha256 !== sourceIndex.corpusIntegrity.pickthall.sha256) fail('Study/source corpus hashes no longer match');
if (studyIndex.hashes?.analysisDataSha256 !== 'f713bda3d9280a05f42c4c7cd892a47ae39495e4a0f7aa12e73a06a03f600a66') fail('Abjad analysis-data hash drifted');
if (studyIndex.normalizationProfile?.rules?.length !== 7) fail('Abjad study index must preserve all seven normalization rules');

const rules = JSON.stringify(studyIndex.normalizationProfile.rules);
for (const marker of ['Harakat / recitation marks','أ إ آ ٱ','Alif maqsura ى','Hamza carriers ؤ / ئ','Ta marbuta ة','Standalone hamza ء','Spaces / punctuation']) {
  if (!rules.includes(marker)) fail(`Abjad normalization marker missing: ${marker}`);
}
const policy = (studyIndex.claimsPolicy || []).join(' ');
for (const marker of ['not a substitute for tafsir','cannot by itself prove doctrine, prophecy, divine intention, or a hidden code','Digital roots are a modern reflection device','Code claims are tested, not assumed','Arithmetic identity proves arithmetic identity']) {
  if (!policy.includes(marker)) fail(`Abjad claims-policy marker missing: ${marker}`);
}

const quranCorrespondences = catalog.correspondences.filter((item) => [source.id, study.id].includes(item.fromRecordId));
if (quranCorrespondences.length !== 0) fail('Qur\'an ingestion must not create chamber/personal correspondences in this phase');

for (const asset of ['library/sources/quran-tanzil-pickthall.index.json','library/studies/quran-abjad.index.json']) {
  if (sw.includes(asset)) fail(`${asset} must remain outside the initial service-worker app shell`);
}

const forbiddenKeys = new Set(['fullText','verseText','arabicText','translationText','bodyText']);
const walk = (value, trail = 'root') => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${trail}[${index}]`));
  for (const [key, item] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) fail(`Substantial source-text payload key ${key} is forbidden in lightweight metadata at ${trail}`);
    walk(item, `${trail}.${key}`);
  }
};
walk(sourceIndex, 'sourceIndex');
walk(studyIndex, 'studyIndex');

console.log(`Validated Qur'an Library ingestion: 6,236 Arabic + 6,236 Pickthall records, 114-surah lazy address index, dual source hashes + analysis hash, explicit seven-rule Abjad normalization, Tanzil/Pickthall attribution, arithmetic restraint, no full source shell payload, and no chamber identity links.`);
