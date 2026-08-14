import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = (relative) => path.join(root, ...relative.split('/'));
const fail = (message) => { throw new Error(message); };
const readJson = (relative) => JSON.parse(fs.readFileSync(file(relative), 'utf8'));

const catalog = readJson('library/catalog.json');
const index = readJson('library/studies/buddhas-path-of-awakening.index.json');

const tradition = catalog.traditions.find((item) => item.id === 'tradition.buddhism');
if (!tradition) fail('Buddhist tradition record is missing');
if (tradition.type !== 'tradition' || !tradition.provenanceLayers.includes('L2')) fail('Buddhist tradition provenance/type drifted');

const study = catalog.studies.find((item) => item.id === 'study.buddhas-path-of-awakening');
if (!study) fail("The Buddha's Path of Awakening study record is missing");
if (study.type !== 'study') fail('Buddha collection must remain a study record');
if (study.provenanceLayers.length !== 1 || study.provenanceLayers[0] !== 'L2') fail('Buddha study must remain an L2 study record');
if (!study.traditionIds.includes('tradition.buddhism')) fail('Buddha study is not linked to the Buddhism tradition');
if (study.contentLocation !== 'library/studies/buddhas-path-of-awakening.index.json') fail('Buddha study contentLocation drifted');
if (!Array.isArray(study.bibliography) || study.bibliography.length < 10) fail('Buddha study bibliography/source map is incomplete');

const chamberLinks = catalog.correspondences.filter((item) => item.fromRecordId === study.id && item.target?.kind === 'chamber');
if (chamberLinks.length !== 0) fail('Buddha study ingestion must not create chamber identity/correspondence links in this phase');

if (index.schema !== 'temple-of-maat/library-study-index-v1') fail('Unexpected Buddha study index schema');
if (index.studyId !== study.id) fail('Buddha study index does not point to the catalog study');
if (index.sourceBasis?.pageCount !== 58) fail('Buddha study source page count must remain 58');
if (index.sourceBasis?.fullTextBundled !== false) fail('Buddha study full text must not be bundled into the Library index');
if (index.sourceBasis?.publicExposure !== 'metadata-and-index-only') fail('Buddha study public exposure boundary drifted');

if (!Array.isArray(index.parts) || index.parts.length !== 5) fail(`Expected 5 parts, found ${index.parts?.length}`);
if (!Array.isArray(index.chapters) || index.chapters.length !== 29) fail(`Expected 29 indexed chapters, found ${index.chapters?.length}`);
if (!Array.isArray(index.appendices) || index.appendices.length !== 3) fail(`Expected 3 appendices, found ${index.appendices?.length}`);

const chapterNumbers = index.chapters.map((item) => item.number);
if (new Set(chapterNumbers).size !== 29 || chapterNumbers.some((number, idx) => number !== idx + 1)) fail('Buddha chapter sequence must be 1–29 without gaps');
if (index.chapters.some((item, idx, rows) => idx > 0 && item.pageStart < rows[idx - 1].pageStart)) fail('Buddha chapter page starts must be monotonic');
if (index.chapters.some((item) => !item.title || !Array.isArray(item.keywords) || item.keywords.length === 0)) fail('Every Buddha chapter needs a searchable title and keywords');

const early = index.chapters.filter((item) => item.number <= 21);
const later = index.chapters.filter((item) => item.number >= 22 && item.number <= 26);
const practice = index.chapters.filter((item) => item.number >= 27);
if (!early.every((item) => item.stratum === 'early-buddhist-core')) fail('Parts I–III must remain in the early-Buddhist orientation stratum');
if (!later.every((item) => item.stratum === 'later-buddhist-developments')) fail('Part IV must remain explicitly later-Buddhist development');
if (!practice.every((item) => item.stratum === 'integrated-practice-manual')) fail('Part V must remain an integrated study/practice synthesis');

const strata = new Map(index.strata.map((item) => [item.id, item]));
for (const id of ['early-buddhist-core', 'later-buddhist-developments', 'integrated-practice-manual']) {
  if (!strata.has(id)) fail(`Missing Buddha historical/study stratum ${id}`);
}
if (!/historical developments/i.test(strata.get('later-buddhist-developments').note || '')) fail('Later Buddhist material must remain explicitly historical development');
if (!/not.*verbatim|rather than verbatim/i.test(strata.get('later-buddhist-developments').note || '')) fail('Later Buddhist material must not be presented as verbatim historical-Buddha speech');

const caveats = (index.editorialCaveats || []).join(' ');
for (const marker of ['Pali Nikayas', 'Chinese Agamas', 'historical developments', 'educational and contemplative', 'medical or mental-health care', 'paraphrases']) {
  if (!caveats.includes(marker)) fail(`Buddha editorial caveat missing: ${marker}`);
}

if ((index.sourceMap?.earlyBuddhistDiscourses || []).length < 10) fail('Early Buddhist source map is incomplete');
if ((index.sourceMap?.laterDevelopmentResources || []).length < 3) fail('Later-development source map is incomplete');
if ((index.sourceMap?.scholarlyOrientation || []).length < 1) fail('Scholarly orientation source is missing');

const forbiddenKeys = new Set(['fullText', 'content', 'bodyText', 'chapterText']);
const walk = (value, trail = 'root') => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach((item, indexValue) => walk(item, `${trail}[${indexValue}]`));
  for (const [key, item] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) fail(`Full-text payload key ${key} is forbidden in lightweight index at ${trail}`);
    walk(item, `${trail}.${key}`);
  }
};
walk(index);

const bytes = fs.statSync(file('library/studies/buddhas-path-of-awakening.index.json')).size;
if (bytes > 40000) fail(`Buddha lightweight index grew unexpectedly large: ${bytes} bytes`);

console.log(`Validated Buddhist Library ingestion: ${index.parts.length} parts, ${index.chapters.length} chapters, ${index.appendices.length} appendices; early/later strata explicit; full text excluded; no chamber identity links.`);
