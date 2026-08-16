import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIVING_CORRESPONDENCE_ENGINE_SCHEMA,
  LIVING_CORRESPONDENCE_ENGINE_VERSION,
  CORRESPONDENCE_FIELDS,
  CORRESPONDENCE_STATUSES,
  buildCorrespondenceLedger
} from './v5.3.4-living-correspondence-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const engineSource = read('scripts/v5.3.4-living-correspondence-engine.mjs');
const thresholdSource = read('scripts/v5.3-threshold.js');
const docs = read('docs/LIVING_CORRESPONDENCE_ENGINE.md');
const styles = read('styles/v5.3.4-living-correspondence-engine.css');

const expectedFields = [
  'deity-archetype', 'angel', 'inverse-shadow', 'jungian-function', 'ifs-part',
  'element', 'planet', 'number', 'gematria', 'scripture-parallels',
  'maat-declaration', 'meditation', 'ethical-action'
];

const kernel = {
  claims: [{
    claimId: 'claim.chamber.01.current-law',
    subjectId: 'chamber.01',
    predicate: 'has-law',
    object: { literal: 'INITIATE WITHOUT ERASURE' },
    claimType: 'structural',
    provenanceClasses: ['current-implementation', 'temple-synthesis'],
    status: 'reviewed',
    methodRef: null,
    evidence: { sourceRefs: ['source.temple.chambers-v3'] },
    boundaries: { historicalIdentity: false, metaphysicalIdentity: false, directHistoricalInfluence: 'not-claimed' }
  }]
};
const pairAuthority = { summary: { currentImplementationUsesRefinedNames: false } };
const pairMigration = {
  recordId: 'pair.01', pairNumber: 1, angel: 'Vehuiah', daemon: 'Bifrons',
  legacyThirdName: 'Bifruiah', preferredRefinedThirdName: 'BIFRUIAH', migrationStatus: 'ALIAS_EQUIVALENT'
};
const chamber = buildCorrespondenceLedger({
  endpoint: { namespace: 'chamber', recordId: '01' },
  resolvedRecord: { number: 1, thirdName: 'Bifruiah', angel: 'Vehuiah', daemon: 'Bifrons', law: 'INITIATE WITHOUT ERASURE' },
  pairAuthority, pairMigration, kernel
});
const source = buildCorrespondenceLedger({
  endpoint: { namespace: 'library', recordId: 'source.quran-tanzil-pickthall-edition' },
  resolvedRecord: { title: "The Qur'an — Arabic Source Text with Pickthall Translation" },
  pairAuthority, pairMigration: null, kernel
});
const byField = Object.fromEntries(chamber.fields.map((field) => [field.field, field]));
const sourceByField = Object.fromEntries(source.fields.map((field) => [field.field, field]));

const assertions = {
  schema: LIVING_CORRESPONDENCE_ENGINE_SCHEMA === 'temple-of-maat/living-correspondence-engine-v1' && LIVING_CORRESPONDENCE_ENGINE_VERSION === '1.0.0',
  exactFieldContract: JSON.stringify(CORRESPONDENCE_FIELDS) === JSON.stringify(expectedFields),
  publicCanonicalOnly: chamber.privacy === 'public-canonical-only' && /public-canonical-only/.test(engineSource),
  nonAutoloading: !thresholdSource.includes('v5.3.4-living-correspondence-engine'),
  noPrivateReads: !/localStorage|sessionStorage|indexedDB|TempleResearchNotebook|TempleScribeWorkspace/.test(engineSource),
  noNetworkWrites: !/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i.test(engineSource),
  currentNumberReviewed: byField.number.value === 1 && byField.number.status === CORRESPONDENCE_STATUSES.reviewed,
  governedAngelReviewed: byField.angel.value === 'Vehuiah' && byField.angel.status === CORRESPONDENCE_STATUSES.reviewed,
  counterpartComputational: byField['inverse-shadow'].value === 'Bifrons' && byField['inverse-shadow'].layer === 'computational' && /not historical Goetia twinship/i.test(byField['inverse-shadow'].note),
  lawAsTemplePractice: byField['ethical-action'].value === 'INITIATE WITHOUT ERASURE' && byField['ethical-action'].layer === 'synthesis' && byField['ethical-action'].claimIds.includes('claim.chamber.01.current-law'),
  maatOpen004Boundary: byField['maat-declaration'].status === CORRESPONDENCE_STATUSES.unmapped && /OPEN-004/.test(byField['maat-declaration'].note),
  jungUnassigned: byField['jungian-function'].status === CORRESPONDENCE_STATUSES.unassigned,
  ifsUnassigned: byField['ifs-part'].status === CORRESPONDENCE_STATUSES.unassigned,
  deityUnassigned: byField['deity-archetype'].status === CORRESPONDENCE_STATUSES.unassigned,
  elementUnassigned: byField.element.status === CORRESPONDENCE_STATUSES.unassigned,
  planetUnassigned: byField.planet.status === CORRESPONDENCE_STATUSES.unassigned,
  gematriaRequiresFieldMapping: byField.gematria.status === CORRESPONDENCE_STATUSES.noClaim && /method version/i.test(byField.gematria.note),
  sourceDependencyNotParallel: sourceByField['scripture-parallels'].status === CORRESPONDENCE_STATUSES.noClaim && /Source-dependency graph edges are not scripture parallels/.test(sourceByField['scripture-parallels'].note),
  migrationNotApplied: chamber.pairMigration?.deployedThirdName === 'Bifruiah' && chamber.pairMigration?.preferredFutureThirdName === 'BIFRUIAH' && chamber.pairMigration?.implementationMigrated === false,
  explicitBoundaries: chamber.boundaries?.sharedNumberIsIdentity === false && chamber.boundaries?.historicalIdentityInferred === false && chamber.boundaries?.metaphysicalIdentityInferred === false && chamber.boundaries?.privateStateIsEvidence === false,
  docsDiscernment: /absence is data/i.test(docs) && /OPEN-004/.test(docs) && /does not infer/i.test(docs),
  mobileStyles: /@media\(max-width:520px\)/.test(styles) && /grid-template-columns:1fr/.test(styles)
};

const failedAssertions = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
console.log(JSON.stringify({
  ok: failedAssertions.length === 0,
  failedAssertions,
  assertions,
  schema: LIVING_CORRESPONDENCE_ENGINE_SCHEMA,
  version: LIVING_CORRESPONDENCE_ENGINE_VERSION,
  fieldCount: CORRESPONDENCE_FIELDS.length,
  reviewedChamberFields: chamber.fields.filter((field) => field.status === CORRESPONDENCE_STATUSES.reviewed).map((field) => field.field),
  unresolvedChamberFields: chamber.fields.filter((field) => field.status !== CORRESPONDENCE_STATUSES.reviewed).map((field) => `${field.field}:${field.status}`),
  maatMappingComplete: chamber.boundaries.open004MaatMappingComplete
}, null, 2));
if (failedAssertions.length) process.exitCode = 1;
