# Temple of Ma'at — Knowledge Kernel v1

_Last revised: 2026-08-14 · schema v1.0.0_

The Knowledge Kernel is the v5.3 foundation beneath the future Temple Graph, Correspondence Engine, Parallel Text Viewer, Scribe workspace, pilgrimage logic, and research exports.

Its purpose is simple: **preserve what kind of thing a claim is before the Temple connects it to anything else.**

The visible visitor flow may remain:

**Library → Graph → Correspondence → Pilgrimage → Integration**

The internal research flow is stricter:

**Source Registry → Records → Claims → Provenance → Concepts → Relationships → Practice → Conduct**

## Files

- `research/knowledge-kernel/temple-knowledge.schema.json` — public canonical schema.
- `research/knowledge-kernel/source-registry.v1.json` — source and project-artifact registry.
- `research/knowledge-kernel/method-registry.v1.json` — versioned computational methods.
- `research/knowledge-kernel/seed.v1.json` — representative migration seed.
- `scripts/validate-knowledge-kernel-v1.mjs` — semantic validator.

The kernel does **not** replace `library/catalog.json`, `chambers.json`, or `research/relationship-graph.json`. Those remain authoritative for their own record systems. The kernel provides a normalized cross-system contract that can point back to them.

## Provenance classes

Every record and claim declares one or more of these classes:

- `source` — source text, artifact, preserved edition, or direct source record.
- `historical-scholarship` — contextual, philological, historical, or source-critical analysis.
- `later-correspondence` — a later occult/comparative correspondence system that is not the original source layer.
- `temple-synthesis` — an explicitly modern Temple interpretation, correspondence, concept, name, or architecture.
- `current-implementation` — a fact about what the published Temple currently stores or renders.
- `user-prompt-derived` — a requirement originating in explicit project/user direction rather than an ancient or scholarly source.

A modern Temple synthesis must never be silently promoted into the `source` class.

## Claims are first-class records

A knowledge record is not enough. The same entity can carry several different kinds of claims at once.

Example: a chamber may have a current implementation law; a source passage may have a historical locator; a later study may propose a comparison; a Temple record may add a symbolic correspondence. These claims must remain distinguishable.

Every claim therefore stores:

- subject;
- predicate;
- object;
- claim type;
- provenance;
- confidence;
- evidence/source references;
- limitations;
- identity/influence boundaries.

The fixed boundaries `historicalIdentity: false` and `metaphysicalIdentity: false` prevent a relationship or numerical equality from automatically becoming an identity claim.

## Source text modes

Passage/declaration content declares a mode:

- `exact-source` — exact wording from a source edition, with rights/translation context when relevant.
- `careful-paraphrase` — source-grounded paraphrase, explicitly not a quotation.
- `normalized-temple-language` — modern Temple wording used for a practice/indexing layer.
- `locator-only` — the kernel stores a source location but does not reproduce text.

This distinction is required for the Forty-Two Hall. The seed Ma'at declarations deliberately use `normalized-temple-language`; they are **not** presented as a unique canonical English translation of Book of the Dead Spell 125.

## Versioned methods, not forced reconciliation

The first registry preserves two coexisting gematria methods:

1. `method.gematria.master-catalogue.v1` — angel Hebrew Mispar Hechrachi + daemon English Ordinal + compound + reduction.
2. `method.gematria.solomonic-pairing.v1` — shared Latin-script EO / FR / RO / RFR with optional length-normalized Reunited Name classification.

The Temple must not silently merge these methods. Calculations must carry the method ID and exact spelling/normalization assumptions that produced the result.

## Seed migration

The first seed intentionally stays small and reviewable:

- 3 current chambers: 01 Bifruiah, 02 Orialiel, 03 Andritael;
- 3 provisional Ma'at declaration records grounded in the Spell 125 declaration-of-innocence complex but stored as normalized Temple wording;
- 3 source-passage records: Ptahhotep §20 careful paraphrase, Book of the Dead Spell 125 careful summary, and a short exact Pickthall excerpt from Qur'an 49:13;
- concept nodes for Truth, Justice, Listening, and Conduct;
- reviewed structural/textual/comparative/symbolic claims;
- both current gematria methods.

This seed is not intended to be visually impressive. It exists to prove that the data model can distinguish source, scholarship, implementation, and synthesis before scaling.

## Relationship Graph integration

`research/relationship-graph.json` remains the edge store for cross-record navigation. A future graph revision should be able to reference Kernel `claimId` values as evidence without duplicating the claim text.

The graph must continue to obey its existing rule: **compare without collapsing**. Knowledge Kernel claims make that rule machine-readable before a line is rendered between nodes.

## Next migration gates

Before the kernel scales beyond the seed:

1. lock a versioned authoritative 72-pair dataset;
2. define aliases/supersession for production Third Names versus newer Reunited Names;
3. add source locators/page or manuscript references as records move into production;
4. create a reproducible mapping method before any 72 × 42 matrix is generated;
5. reject graph edges that lack a resolvable evidence claim or source;
6. keep private visitor journals, pilgrimage state, bookmarks, and local media out of the public canonical kernel.

## Release rule

The Knowledge Kernel is foundational data infrastructure. Schema changes require explicit versioning and migration notes. A migration may preserve or weaken confidence; it must never silently strengthen a symbolic/comparative claim into a historical claim.
