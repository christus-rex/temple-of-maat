# Temple of Ma'at — Integrated Research Relationship Graph

_Last revised: 2026-08-14 · foundation schema v1.0.0_

The v5.3 relationship graph is the shared cross-record architecture for the future Integrated Research Temple. It exists so the Comparative Reading Workspace, unified research search, exports, and the 72-node Temple Map can all consume **one provenance-bearing relationship model** instead of inventing separate connection logic.

The governing rule is the same rule used by the Temple Library and research governance:

> **Compare without collapsing.** A relationship can be meaningful without implying identity, authorship, prophecy, reincarnation, supernatural rank, bloodline, or direct historical influence.

## Why this graph is separate from the Library catalog

`library/catalog.json` remains the canonical catalog for Library traditions, sources, studies, and discernments. Its existing correspondence structures are intentionally Library-centric.

`research/relationship-graph.json` is a separate cross-system graph because v5.3 must connect records that do not all live in the Library:

- Temple Chambers;
- Living Codex records;
- Shem Dossiers;
- Temple Library records.

The graph does **not** replace any of those canonical record stores. It stores edges only. Each endpoint resolves back to its authoritative record system.

## Public canonical graph only

The graph declares:

`privacy: public-canonical-only`

Private visitor state must never be serialized into the public graph. This includes:

- Pilgrim Journey reflections;
- private Library notes;
- device-local bookmarks/favorites when they are visitor-specific;
- local media state;
- localStorage or IndexedDB payloads;
- personally entered text that has not been deliberately promoted into a reviewed public record.

Future UI may **overlay** private state at runtime on the visitor's device, but that overlay must stay separate from `research/relationship-graph.json`.

## Endpoint namespaces

Every edge endpoint contains a `namespace` and a stable `recordId`.

### `chamber`

- canonical resolver: `chambers.json`
- key: `num`
- stable IDs: `01` through `72`

### `codex`

- canonical resolver: `scripts/v5.2.4-living-codex.js`
- key: `number`
- stable IDs: `01` through `72`

### `dossier`

- canonical resolver: `scripts/v5.2.6-shem-dossiers.js`
- key: `number`
- stable IDs: `01` through `72`

### `library`

- canonical resolver: `library/catalog.json`
- key: `id`
- record families include `tradition.*`, `source.*`, `study.*`, and `discernment.*`

The first graph release does not create a fifth namespace for private visitor records.

## Provenance layers

Every edge declares one or more of the existing canonical provenance layers:

1. **L1 — Primary / Historical Source**  
   Source text, artifact, manuscript, preserved edition, or direct data record.

2. **L2 — Scholarly / Computational Analysis**  
   Historical analysis, linguistic method, transparent calculation, tables, or reproducible transformation.

3. **L3 — Comparative Interpretation**  
   Cross-tradition or cross-source comparison in which both similarity and difference remain visible.

4. **L4 — Temple / Personal Symbolism**  
   Temple architecture, contemplative correspondence, or personal symbolism. L4 never overrides L1–L3.

An edge may span several layers when the connected record itself spans several layers, but the edge summary and evidence must still say what is actually being asserted.

## Relation types

### `study-uses-source`

A directed edge from a Library `source.*` record to a Library `study.*` record when the study explicitly identifies that source or source family as an input.

Requirements:

- directed;
- source → study;
- includes L1 and L2;
- evidence includes source/catalog metadata or declared computational/scholarly basis;
- does not claim direct historical influence merely because a modern study analyzes an ancient source.

### `record-layer-alignment`

An internal Temple architecture edge joining distinct presentation layers that intentionally share a stable Temple record ordinal, for example Chamber 01 ↔ Codex 01.

Requirements:

- L4;
- `claimClass: structural`;
- evidence includes `temple-architecture`;
- never rendered as independent historical evidence.

### `textual-relationship`

A source-supported textual relationship such as manuscript dependence, shared textual family, explicit quotation, or another philologically defensible relation.

The exact evidence must be named. Similar vocabulary alone is not enough.

### `historical-context`

A historically supported contextual relation: same period, social world, archaeological setting, textual milieu, or documented institutional context.

Context is not authorship and is not necessarily influence.

### `historical-influence`

A strong relation type reserved for a documented or responsibly provisional influence claim.

Requirements:

- `directHistoricalInfluence` must be `supported` or `provisional`, never `not-claimed`;
- evidence must include historical or scholarly source support;
- confidence cannot be `symbolic`;
- L4-only evidence is insufficient.

### `methodological-parallel`

A comparison of methods rather than doctrines or identities: for example, two studies may each separate source text from analytical normalization.

Methodological similarity does not imply historical contact.

### `thematic-parallel`

A thematic relationship such as justice, wisdom, compassion, exile, covenant, liberation, or cosmic order.

A thematic parallel must preserve differences in historical setting and meaning.

### `comparative-similarity`

A reviewed cross-record comparison that goes beyond a single shared tag. It belongs primarily to L3 and should name both similarity and limitation.

### `computational-correspondence`

A reproducible numerical or computational relation under a declared method.

Requirements:

- evidence includes `computational-result`;
- calculations or normalization profiles remain externally inspectable;
- arithmetic equality proves arithmetic equality only;
- never implies metaphysical or historical identity.

### `temple-correspondence`

An explicit Temple/personal symbolic edge.

Requirements:

- must include L4;
- evidence must include `temple-architecture` or `personal-symbolism`;
- confidence should normally be `symbolic`, `exploratory`, or at most `supported` when a reviewed Temple interpretation warrants it;
- it must never be rendered with the visual grammar used for source-derived historical relations.

## Claim boundary

Every edge contains a `claimBoundary` object.

Two fields are permanently fixed by the schema:

- `historicalIdentity: false`
- `metaphysicalIdentity: false`

This is intentional. The graph is a relationship system, not an identity-equation engine.

`directHistoricalInfluence` is separately declared as:

- `not-claimed`;
- `supported`;
- `provisional`.

A future graph renderer must expose this distinction. A visible line between two nodes must never, by itself, imply influence.

## Confidence

Confidence describes the **edge claim**, not the worth of the traditions or people represented by its endpoints.

- `established` — directly supported by the canonical record architecture or explicit source/study dependency.
- `supported` — good evidence exists, while interpretive judgment remains.
- `provisional` — evidence supports consideration but meaningful uncertainty remains.
- `exploratory` — a comparison is worth investigating but should not be presented as settled.
- `symbolic` — deliberately contemplative/Temple-level correspondence rather than a historical assertion.

## Evidence

Every edge must identify at least one evidence basis and at least one `sourceRef`.

Allowed evidence bases:

- `primary-source`
- `scholarly-source`
- `catalog-metadata`
- `computational-result`
- `comparative-analysis`
- `temple-architecture`
- `personal-symbolism`

A `sourceRef` may be a canonical record ID or a repository path. It should be specific enough that a validator or future reader can recover the basis of the edge.

## Seed-edge policy

The foundation graph begins conservatively.

The first edges are limited to:

- explicit Library source → study dependencies already recorded in the Library catalog;
- internal same-ordinal Chamber/Codex/Dossier alignment examples already defined by the Temple architecture.

No new Library → Chamber symbolic relationship is invented merely to make the graph visually rich. Such edges should be added only when the underlying Temple correspondence has been explicitly reviewed and can be labeled L4.

## Visual rendering rules for future v5.3 UI

The future Temple Map and Comparative Reading Workspace must use visual distinctions that preserve provenance. At minimum:

- source-derived historical/textual edges must look different from L4 Temple correspondences;
- symbolic edges must not visually imply stronger authority than historical/source edges;
- direction must be visible when the edge is directed;
- confidence and claim class must be inspectable without opening developer tools;
- a keyboard-accessible non-graph list must expose the same relationships;
- disabling animation must not hide relationship meaning;
- graph filtering must not silently remove provenance labels from the remaining edges.

The graph is optional navigation and research context. It must never become the only way to reach a Chamber or source record.

## Versioning and migration

The graph has its own schema/version identity independent of the PWA release number.

Current:

- schema: `temple-of-maat/relationship-graph-v1`
- version: `1.0.0`

Future schema changes must:

1. preserve the original graph artifact in version control;
2. add an explicit deterministic migration when automatic migration is safe;
3. validate all endpoints and edges after migration;
4. disclose dropped, renamed, or transformed fields;
5. never infer a stronger claim class or confidence during migration;
6. never promote an L4 symbolic edge into a historical relation automatically;
7. reject unknown relation semantics rather than guessing.

## Architectural consumers

The intended v5.3 consumers are:

1. **Comparative Reading / Research Workspace** — query endpoints, show provenance, compare records, and export relationship-aware research bundles.
2. **Unified research search** — surface matching edges alongside records without merging the underlying records.
3. **72-node Temple Map** — render Chambers and cross-source connections using the same edge contract.
4. **Research export** — preserve stable endpoint IDs, relation type, provenance layers, evidence references, and claim boundaries.

Those consumers should share the same resolver and graph data. No consumer should maintain a private second copy of relationship semantics.
