# Temple of Ma'at — Library Data Architecture

This directory defines the canonical data contract for the Temple Library before any public Library interface is built.

The governing hierarchy is:

`Library → Tradition → Source → Study → Discernment → Correspondences`

The model follows `GOVERNANCE.md`: **compare without collapsing**. A Library record may connect traditions, texts, calculations, interpretations, or chambers, but the connection must not erase provenance or silently convert symbolic correspondence into historical identity.

## Files

- `catalog.json` — canonical public Library registry. It begins empty by design; research collections enter only through reviewed ingestion work.
- `schema/temple-library.schema.json` — public research/catalog contract.
- `schema/personal-state.schema.json` — separate visitor-local bookmarks, notes, and private correspondences.
- `../scripts/fixtures/library-reference-catalog.json` — test-only fixture used to prove relationship and provenance validation.
- `../scripts/validate-library-v1.mjs` — dependency-free release validator.

## Stable identifiers

IDs are lowercase, namespaced, and immutable once published:

- `tradition.<slug>`
- `source.<slug>`
- `study.<slug>`
- `discernment.<slug>`
- `correspondence.<slug>`

Display titles may change without changing IDs. A record that has been cited or bookmarked must not be silently assigned a different stable ID.

## Four provenance layers

Every public research record declares one or more provenance layers:

- `L1` — Primary / Historical Source
- `L2` — Scholarly / Computational Analysis
- `L3` — Comparative Interpretation
- `L4` — Temple / Personal Symbolism

Layer 4 may reference Layers 1–3, but it never replaces or edits them.

## Record types

### Tradition

A taxonomy/lineage record used to group sources and studies. It is not proof that every source inside a tradition shares one historical origin.

### Source

A manuscript, artifact record, source text, translation, edition, facsimile, or defined corpus. Source records provide dedicated fields for:

- edition/corpus metadata;
- languages;
- repository or holding institution;
- external identifiers;
- attribution and licensing;
- public-exposure restrictions;
- hashes, byte counts, or record counts when reproducibility requires them.

Transformations are never written back into source text. A normalized/computational form belongs to a Study method record.

### Study

Historical synthesis, philological work, computation, gematria/Abjad analysis, statistical analysis, or other explicit analytical work. Studies can reference one or more Source IDs and can record:

- normalization profile;
- computational method;
- software/algorithm version;
- declared input fields;
- reproducibility notes.

### Discernment

An interpretive conclusion or contemplative reading derived from one or more studies/sources. It remains separately addressable so measured/computed values are not merged with interpretation.

### Correspondence

A typed edge between a Library record and either another Library record or a Temple chamber. Every correspondence includes `identityClaim: false` as a structural safeguard. A correspondence can express comparison, thematic resonance, symbolic association, historical influence, or textual relationship only when its evidence/layer supports that relation.

A chamber target uses stable chamber IDs `01` through `72`.

## Public catalog vs. private state

The public catalog **must not contain visitor notes or bookmarks**.

Private state uses `schema/personal-state.schema.json` and is intended for local-first storage. It includes:

- bookmarked record IDs;
- private notes;
- private Layer-4 correspondences;
- schema version and timestamps.

Private state is not uploaded or published merely because a Library record is public.

## Ingestion rule

Before a real research collection enters `catalog.json`, its ingestion issue must answer:

1. What source or source family is being represented?
2. What edition/corpus/version is used?
3. What transformations or normalization rules are applied?
4. Which statements belong to L1, L2, L3, or L4?
5. What attribution/license/public-exposure rules apply?
6. What integrity metadata is needed for reproducibility?
7. What correspondences are being proposed, and what do they *not* claim?

The initial ingestion work is tracked in GitHub issues #16–#19. The first visitor-facing Library interface is tracked separately in #20.

## Versioning

Schema identifiers use semantic schema names independent of the app release:

- public catalog: `temple-of-maat/library-v1`
- private state: `temple-of-maat/library-personal-state-v1`

Breaking schema changes require a new schema version and a documented migration path. App releases may advance without changing the Library schema.
