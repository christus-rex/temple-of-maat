import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };
const readJson = (relative) => JSON.parse(fs.readFileSync(file(relative), 'utf8'));
const catalog = readJson('library/catalog.json');
const historical = readJson('library/studies/dead-sea-scrolls-comprehensive.index.json');
const gematria = readJson('library/studies/dead-sea-scrolls-gematria.index.json');

const tradition = catalog.traditions.find((item) => item.id === 'tradition.second-temple-judaism');
const source = catalog.sources.find((item) => item.id === 'source.dead-sea-scrolls-qumran-corpus');
const historicalStudy = catalog.studies.find((item) => item.id === 'study.dead-sea-scrolls-comprehensive-analysis');
const gematriaStudy = catalog.studies.find((item) => item.id === 'study.dead-sea-scrolls-gematria-companion');
const personal = catalog.discernments.find((item) => item.id === 'discernment.dead-sea-scrolls-personal-ethical-correspondence');

if (!tradition) fail('Second Temple Judaism tradition record is missing');
if (!source) fail('Dead Sea Scrolls source-family record is missing');
if (!historicalStudy || !gematriaStudy) fail('Both Dead Sea Scrolls studies are required');
if (!personal) fail('Dead Sea Scrolls L4 personal/ethical discernment record is missing');

if (source.provenanceLayers.length !== 1 || source.provenanceLayers[0] !== 'L1') fail('Qumran source-family record must remain exactly L1');
if (source.rights?.publicExposure !== 'metadata-only') fail('Qumran source-family record must remain metadata-only');
if (!source.traditionIds.includes(tradition.id)) fail('Qumran source family is not linked to the Second Temple tradition');
if (!['Hebrew','Aramaic','Greek'].every((lang) => source.languages.includes(lang))) fail('Qumran source languages are incomplete');

if (!['L2','L3','L4'].every((layer) => historicalStudy.provenanceLayers.includes(layer))) fail('Historical study must preserve L2/L3/L4 analytical layers');
if (historicalStudy.provenanceLayers.includes('L1')) fail('Modern historical study must not masquerade as the L1 manuscript corpus');
if (!historicalStudy.sourceIds.includes(source.id)) fail('Historical study is not linked to the shared Qumran source family');
if (!historicalStudy.traditionIds.includes(tradition.id)) fail('Historical study is not linked to the Second Temple tradition');

if (!gematriaStudy.provenanceLayers.includes('L2') || !gematriaStudy.provenanceLayers.includes('L4')) fail('Gematria study must preserve L2 computation and L4 personal correspondence');
if (gematriaStudy.provenanceLayers.includes('L1') || gematriaStudy.provenanceLayers.includes('L3')) fail('Gematria study must not claim L1 source status or L3 historical theology');
if (!gematriaStudy.sourceIds.includes(source.id) || !gematriaStudy.traditionIds.includes(tradition.id)) fail('Gematria study must share the same Qumran source/tradition family');
if (!/modern English/i.test(gematriaStudy.summary || '')) fail('Gematria study must explicitly identify the English ciphers as modern');
if (!/not evidence|rather than evidence/i.test(gematriaStudy.summary || '')) fail('Gematria study must explicitly deny identity-proof use of numerical equality');

if (personal.provenanceLayers.length !== 1 || personal.provenanceLayers[0] !== 'L4') fail('Personal relevance must remain exactly L4');
if (!personal.studyIds.includes(historicalStudy.id) || !personal.studyIds.includes(gematriaStudy.id)) fail('L4 discernment must link both studies');

const dssCorrespondences = catalog.correspondences.filter((item) => [historicalStudy.id, gematriaStudy.id, personal.id].includes(item.fromRecordId));
if (dssCorrespondences.length !== 0) fail('Dead Sea Scrolls ingestion must not create chamber correspondences in this phase');

if (historical.studyId !== historicalStudy.id || historical.sourceBasis?.pageCount !== 45 || historical.sourceBasis?.fullTextBundled !== false) fail('Historical index source boundary drifted');
if (historical.parts?.length !== 4 || historical.chapters?.length !== 30) fail('Historical index must preserve 4 parts and 30 chapters');
if (historical.chapters.some((item, index) => item.number !== index + 1)) fail('Historical chapter sequence must be 1–30');
if (!historical.chapters.filter((item) => item.number <= 18 || item.number >= 26).every((item) => item.layer === 'L2')) fail('Historical/artifact/preservation chapters must remain L2');
if (!historical.chapters.filter((item) => [19,20].includes(item.number)).every((item) => item.layer === 'L3')) fail('Comparative theology chapters 19–20 must remain L3');
if (!historical.chapters.filter((item) => item.number >= 21 && item.number <= 25).every((item) => item.layer === 'L4')) fail('Personal/ethical chapters 21–25 must remain L4');
if (!historical.chapters.every((item) => Array.isArray(item.sourceNoteKeys))) fail('Historical chapters must support per-section source-note keys');
if (!/Compare without collapsing/i.test(historical.governingRule || '')) fail('Historical compare-without-collapsing rule is missing');

const requiredSubjects = ['great-isaiah-scroll','community-rule','damascus-document','pesher-habakkuk','war-scroll','temple-scroll','hodayot','enoch-jubilees','copper-scroll'];
const subjects = new Set((historical.manuscriptSubjects || []).map((item) => item.key));
for (const key of requiredSubjects) if (!subjects.has(key)) fail(`Required manuscript subject is not indexable: ${key}`);
if (Object.keys(historical.sourceNotes || {}).length !== 17) fail('Historical selected source-note map must preserve all 17 notes');

if (gematria.studyId !== gematriaStudy.id || gematria.sourceBasis?.pageCount !== 43 || gematria.sourceBasis?.fullTextBundled !== false) fail('Gematria index source boundary drifted');
if (gematria.parts?.length !== 5 || gematria.chapters?.length !== 25) fail('Gematria index must preserve 5 parts and 25 chapters');
if (gematria.chapters.some((item, index) => item.number !== index + 1)) fail('Gematria chapter sequence must be 1–25');
if (!gematria.chapters.filter((item) => item.number <= 15 || item.number >= 24).every((item) => item.layer === 'L2')) fail('Gematria method/field/control chapters must remain L2');
if (!gematria.chapters.filter((item) => item.number >= 16 && item.number <= 23).every((item) => item.layer === 'L4')) fail('Gematria personal-correspondence/practice chapters 16–23 must remain L4');
if (!gematria.chapters.every((item) => Array.isArray(item.sourceNoteKeys))) fail('Gematria chapters must support per-section source-note keys');

const limits = (gematria.publicationLimits || []).join(' ');
for (const marker of ['modern comparison systems','Digital roots are modern','not presented as ancient Qumran practice','No surviving Qumran manuscript','not proof of authorship','never settles a historical claim']) {
  if (!limits.includes(marker)) fail(`Gematria restraint marker missing: ${marker}`);
}
const systems = gematria.methods?.englishCiphers?.systems || [];
for (const system of ['English Ordinal','Full Reduction','Reverse Ordinal','Reverse Reduction']) if (!systems.includes(system)) fail(`Missing English cipher: ${system}`);
if (!/standard values/i.test(gematria.methods?.hebrewGematria?.rule || '')) fail('Hebrew gematria standard-value rule is missing');
if (!/Repeatedly sum decimal digits/i.test(gematria.methods?.digitalRoots?.rule || '')) fail('Digital-root method is not explicit');
if (!/None of these grades establishes supernatural or historical identity/i.test(gematria.methods?.evidenceHierarchy?.limit || '')) fail('Gematria evidence hierarchy lacks identity restraint');

const forbiddenKeys = new Set(['fullText','content','bodyText','chapterText']);
const walk = (value, trail = 'root') => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${trail}[${index}]`));
  for (const [key, item] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) fail(`Full-text payload key ${key} is forbidden in lightweight index at ${trail}`);
    walk(item, `${trail}.${key}`);
  }
};
walk(historical, 'historical');
walk(gematria, 'gematria');

for (const relative of ['library/studies/dead-sea-scrolls-comprehensive.index.json','library/studies/dead-sea-scrolls-gematria.index.json']) {
  const bytes = fs.statSync(file(relative)).size;
  if (bytes > 50000) fail(`${relative} exceeded lightweight metadata budget: ${bytes} bytes`);
}

console.log(`Validated Dead Sea Scrolls Library ingestion: one L1 Qumran source family, two linked studies, ${historical.chapters.length} historical chapters, ${gematria.chapters.length} gematria chapters, explicit L2/L3/L4 separation, nine required manuscript subjects indexable, per-section source-note storage, no full text, and no chamber identity links.`);
