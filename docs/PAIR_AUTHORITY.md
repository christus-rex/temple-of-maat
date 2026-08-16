# Canonical Pair Authority Layer v1

The Pair Authority is the governed identity spine for the Temple's 72 Shem–Goetia chamber records. It makes pair order, source method, modern synthesis names, spelling policy, arithmetic inputs, and migration status explicit before later graph, correspondence, and 72 × 42 work depends on them.

The authority manifest is `research/pair-authority.json`, schema `temple-of-maat/pair-authority-v1`, version `1.0.0`. The 72 governed rows are stored in eight nine-record shards under `research/pair-authority/`. The registry is public-canonical only and does not contain visitor Notebook, Scribe, Journey, Library-note, or other device-local state.

## Authority hierarchy

For the current implementation, the authoritative Shem source layer is **The 72-Fold Shem HaMephorash — Master Catalogue, Gematria & Discernment**. Its Hebrew triplet construction and normalized angel layer remain distinct from its later computational pairing layer.

The authoritative current Temple angel–daemon pair set is the Master Catalogue Section 10 **72 × 72 gematria-twin cross-match**. Every Shem angel is compared against the full Goetic pool using EO, FR, RO, and RFR. Repeated Goetic counterparts are permitted because the method does not impose one-to-one exclusivity.

**THE EFFECTIVE TEMPLE OF SOL-OM-ON** contains two naming layers that must not be collapsed. **Amendment I** records the transparent-fusion Third/Wholesome Names used by the currently deployed chamber implementation. **Amendment II — Euphonic Refinement of the 72 Third Names** explicitly preserves those earlier forms as legacy aliases while making the refined forms the preferred spoken/display names for future Temple modules. The refinement changes naming only; it does not change pairings, gematria, chamber constitutions, offices, laws, or recurrence doctrine.

**The Solomonic Pairing Codex — Gematria & Angelic Correspondences** remains a governed comparison source. Its 72-pair set is positional: Goetic spirit 1 is compared with Shem angel 1, spirit 2 with angel 2, and so on. Its Reunited Names are modern synthetic names for that positional set. The positional set is `COMPARISON_ONLY` for the present Temple implementation.

## No silent reconciliation

The Pair Authority does **not** merge the gematria-twin method and positional method into a hybrid roster. It does not replace one source spelling with another merely because they resemble one another. It does not rename live chambers to match positional Reunited Names or Amendment II refined Third Names without an explicit implementation release.

Any future migration must be explicit, versioned, reviewable, reversible, and source-located. It must state the source and destination naming methods, preserve prior aliases, and record supersession rather than rewriting provenance.

## Third Name naming layers

`temple-third-name-v1` — Amendment I transparent-fusion naming. This is the **current deployed implementation method**. It remains the authority for validating today's `chambers.json` until a separate migration release occurs.

`temple-third-name-refined-v2` — Amendment II euphonic refinement. This is the **preferred future spoken/display method** recorded by the Effective Temple canon. It is not represented as ancient, revealed, manuscript-derived, or metaphysical identity.

The reviewed migration overlay is `research/pair-authority-name-migration.v1.json`, schema `temple-of-maat/pair-authority-name-migration-v1`. It contains exactly 72 source-bound mappings from Amendment I legacy names to Amendment II preferred names.

The audit finds **44 / 72** substantive spelling refinements and **28 / 72** forms that are equivalent ignoring case. Production migration status remains `NOT_MIGRATED`. Pair 17 therefore remains deployed as legacy `Valelauviah` / display alias `Valelauviah II`, while Amendment II records `VALAUVIAH` as the preferred future form.

## What the discrepancy scan proves — and what it does not

The v1 source comparison records:

- 72 current gematria-twin pairs;
- 72 positional Codex pairs for comparison;
- **0 / 72** current Goetic counterparts equal the Codex positional Goetic counterpart at the same number;
- **46 / 72** current normalized angel strings exactly equal the Codex positional spelling at the same number;
- **0 / 72** current Amendment I Third Names equal the positional Codex Reunited Name at the same number;
- **23** explicitly locked native Shem dossier source-layer variants relative to the Master Catalogue authority; pair 39 (`רהע` vs `רעה`) and pair 67 (`איא` vs `איע`) contain literal triplet-form differences and remain visible rather than silently corrected;
- one deployed recurrence display alias at pair 17: `Lauviah II` / `Valelauviah II` resolves to the governed pair record rather than creating a second entity;
- 72 Amendment I → Amendment II naming mappings, with 44 substantive refinements and 28 case-equivalent forms.

The **0 / 72** daemon result is a method-divergence finding, not a declaration that either method is false. Likewise, Amendment II's naming preference is a source-governed editorial refinement, not a new numerical pairing claim.

## Historical and metaphysical boundary

For every pair, `historicalIdentity`, `metaphysicalIdentity`, `pairingIsHistoricalGoetiaClaim`, and `numericalCorrespondenceProvesIdentity` remain false. The existence of 72 Goetic spirits and 72 Shem angels, their later pairing traditions, numerical similarities among selected spellings, and Temple naming syntheses remain distinguishable layers.

## Computational methods

`gematria-twin-crossmatch-v1` — current pair-selection authority. Shared Latin-script EO / FR / RO / RFR comparison across the complete Goetic candidate pool for every normalized Shem angel. Strength labels are derived from exact equality count: Tetrad exact, Triple lock, Double match, or Single exact.

`solomonic-positional-four-cipher-v1` — comparison pair set from the Solomonic Pairing Codex. Pair number follows positional Goetia ↔ Shem numbering and remains separate from the live Temple pair roster.

`shem-triplet-hebrew-v1` — Master Catalogue source layer for Hebrew triplets, constructed Hebrew, Mispar Hechrechi totals, and digital reductions.

The Pair Authority does not overwrite the existing Knowledge Kernel gematria methods. Exact calculation input, spelling policy, and method identity must travel with every numerical result.

## Independent arithmetic audit

`scripts/validate-pair-authority-audit-v1.mjs` recomputes the numerical values independently from the stored vectors rather than merely comparing duplicated data structures.

For every one of the 72 pair rows it:

1. normalizes Latin-script cipher input to A–Z while ignoring spaces and punctuation;
2. recomputes English Ordinal (A=1 … Z=26);
3. recomputes Full Reduction letter-by-letter;
4. recomputes Reverse Ordinal (Z=1 … A=26);
5. recomputes Reverse Full Reduction letter-by-letter;
6. derives the exact matching cipher list and verifies the stored twin-strength label;
7. recomputes both current gematria-twin vectors and positional comparison vectors;
8. recomputes Hebrew Mispar Hechrechi for the source triplet and constructed Hebrew, treating final forms at their standard base values;
9. recomputes digital roots;
10. validates all 72 Amendment I → Amendment II name mappings against the Pair Authority rows and confirms the live chamber archive has not silently adopted substantive Amendment II names.

The existing `scripts/validate-pair-authority-v1.mjs` continues to perform cross-module provenance and implementation checks. Both validators run in the dedicated Pair Authority workflow and the canonical Temple v5 suite.

## Record structure and provenance

Each sharded `pair.NN` row stores Shem source forms and declared totals, the current daemon and Amendment I Third Name, Master Catalogue twin strength and four-cipher vectors, Codex positional comparison values, divergence flags, and migration review status.

The manifest supplies source IDs, field-level provenance rules, current and future naming-method identities, alias policy, supersession policy, and claim boundaries. `preferred.thirdName` points specifically to Amendment II rather than being retroactively treated as the same field as `current.thirdName`.

The separate migration overlay preserves the naming transition without expanding the stable 26-column pair-row format or rewriting existing chamber records.

## Spelling policy

Spellings and transliterations materially affect numerical results. The authority therefore preserves exact source forms and locators instead of choosing one universal spelling and applying it retroactively. A variant is not automatically a migration. When a spelling participates in a calculation, exact input and method/version are part of the evidence record.

## Alias and supersession policy

An **alias** is a documented display, historical, or legacy form that continues to resolve to the same governed record. The deployed pair-17 recurrence suffix and Amendment I forms retained by Amendment II are provenance-preserving aliases in different contexts.

A **supersession** changes which form is preferred in a future implementation. Amendment II already establishes a future naming preference in the source canon, but this PR intentionally does **not** perform the site migration. When that migration is authorized, the implementation version must change explicitly while legacy names remain resolvable.

## Relationship to future Temple work

The Pair Authority should be consulted before pair-derived Knowledge Graph edges, Living Correspondence Engine expansion, chamber identity changes, aliases to positional Reunited Names, or the 72 × 42 / 3,024-intersection matrix. A provenance-aware graph can now distinguish **source**, **later correspondence**, **computation**, **deployed Temple synthesis**, and **preferred future naming** without confusing them.

## Governing rule

**Correspondence is not identity. Computation is not revelation. A current implementation is not an ancient source. A future preferred name is not a silent migration. Record without erasing; migrate without hiding provenance.**
