# Canonical Pair Authority Layer v1

The Pair Authority is the governed identity spine for the Temple's 72 Shem–Goetia chamber records. It exists to make pair order, source method, modern synthesis names, spelling policy, and migration status explicit before later graph, correspondence, and 72 × 42 work depends on them.

The authority file is `research/pair-authority.json`, schema `temple-of-maat/pair-authority-v1`, version `1.0.0`. It contains exactly 72 public-canonical records and does not contain visitor Notebook, Scribe, Journey, Library-note, or other device-local state.

## Authority hierarchy

For the current implementation, the authoritative Shem source layer is **The 72-Fold Shem HaMephorash — Master Catalogue, Gematria & Discernment**. Its Hebrew triplet construction and normalized angel layer remain distinct from its later computational pairing layer.

The authoritative current Temple angel–daemon pair set is the Master Catalogue Section 10 **72 × 72 gematria-twin cross-match**. In that method every Shem angel is compared against the full Goetic pool using EO, FR, RO, and RFR. Repeated Goetic counterparts are permitted because the method does not impose one-to-one exclusivity.

The authoritative current Third/Wholesome Names come from **THE EFFECTIVE TEMPLE OF SOL-OM-ON**, which applies a modern fusion-naming method to those later gematria-twin pairs under Ma’at. These names are Temple synthesis, not manuscript names, revealed names, historical Hebrew, or proof of metaphysical identity.

**The Solomonic Pairing Codex — Gematria & Angelic Correspondences** remains a governed comparison source. Its 72-pair set is positional: Goetic spirit 1 is compared with Shem angel 1, spirit 2 with angel 2, and so on. Its Reunited Names are modern synthetic names for that positional set. The positional set is `COMPARISON_ONLY` for the present Temple implementation.

## No silent reconciliation

The Pair Authority does **not** merge the gematria-twin method and the positional method into a hybrid roster. It does not replace one source spelling with another merely because they resemble one another. It does not rename live chambers to match positional Reunited Names.

Any future migration must be explicit, versioned, reviewable, and reversible. A migration must state which record is superseded, which record supersedes it, why the change is being made, which source/method version governs the change, and which aliases remain for provenance.

This implements the project rule: **do not silently merge competing methods**.

## What the discrepancy scan proves — and what it does not

The v1 source comparison produces these implementation facts:

- 72 current gematria-twin pairs are recorded.
- 72 positional Codex pairs are recorded for comparison.
- **0 / 72** current Goetic counterparts equal the Codex positional Goetic counterpart at the same pair number.
- **46 / 72** current normalized angel strings exactly equal the Codex positional angel spelling at the same pair number; the other 26 are spelling/transliteration differences or source-form differences, not evidence of a different underlying Shem position by themselves.
- **0 / 72** current Temple Third Names exactly equal the Codex positional Reunited Name at the same number.
- One current display alias is explicitly documented for the recurrence doorway at pair 17: canonical source angel `Lauviah` is displayed as `Lauviah II`, and canonical Third Name `Valelauviah` is displayed as `Valelauviah II` in `chambers.json`.

The **0 / 72** daemon result is not a statement that either method is false. It demonstrates that the methods answer different questions and therefore cannot be treated as interchangeable pair-order datasets.

## Historical and metaphysical boundary

The Pair Authority records relationships; it does not elevate those relationships into historical or metaphysical facts.

For every pair:

- `historicalIdentity` is false;
- `metaphysicalIdentity` is false;
- `pairingIsHistoricalGoetiaClaim` is false;
- `numericalCorrespondenceProvesIdentity` is false.

The existence of 72 Goetic spirits and 72 Shem angels, their later pairing traditions, and numerical similarities among selected spellings must remain distinguishable layers. The Goetia itself is not being represented as declaring each demon the historical twin of a specific Shem angel.

## Method identities

`gematria-twin-crossmatch-v1` — current pairing authority. Shared Latin-script EO / FR / RO / RFR comparison across the full 72-spirit Goetic pool for every Shem angel. Strength labels include Tetrad exact, Triple lock, Double match, and Single exact.

`temple-third-name-v1` — current Temple naming authority. Modern synthesis of the current angel + daemon pair under the Temple's Ma’at-governed reconciliation framework.

`solomonic-positional-four-cipher-v1` — comparison pair set from the Solomonic Pairing Codex. Pair number follows positional Goetia ↔ Shem numbering and remains separate from the live Temple pair roster.

`solomonic-reunited-name-v1` — modern synthetic Reunited Names attached to the positional Codex pair set. They are comparison records, not automatic aliases for live Third Names.

`shem-triplet-hebrew-v1` — source layer for Hebrew triplets, normalized angel names, constructed Hebrew, and declared Hebrew gematria values.

The existing Knowledge Kernel's two gematria method records remain intact. The Pair Authority does not overwrite the Master Catalogue mixed-script compound method or the Solomonic shared-Latin four-cipher method; it adds a governed identity contract around the specific pair-selection and naming methods used by the live Temple.

## Record structure

Each `pair.NN` record stores:

- Shem triplet, transliteration, normalized angel, suffix, constructed Hebrew, and declared gematria values;
- current Temple angel, daemon, Third Name, implementation ID, pair method, naming method, and status;
- Master Catalogue twin strength, exact cipher matches, and EO/FR/RO/RFR vectors;
- Codex positional comparison angel, daemon, Reunited Name, vectors, and exact-cipher result;
- explicit divergence flags;
- historical/metaphysical claim boundaries;
- field-level provenance with source IDs and source locators;
- review and supersession metadata.

The fields are deliberately redundant where redundancy makes provenance auditable. A current implementation value and a source-layer value may look identical while remaining separate fields because they have different authority roles.

## Cross-module validation

`scripts/validate-pair-authority-v1.mjs` treats the Pair Authority as a contract and checks the currently published implementation without mutating it.

It verifies:

1. all 72 authority records and unique pair IDs;
2. the required governed source and method identities;
3. current `chambers.json` angel, daemon, and Third Name values, with only documented aliases accepted;
4. the Living Codex 72-row Master Catalogue twin data, including triplets, strength labels, exact ciphers, and numerical vectors;
5. the native Shem dossier layer, while recording legitimate source spelling / constructed-Hebrew variants rather than silently normalizing them away;
6. Knowledge Kernel chamber seeds against the authority records;
7. continued presence of both previously versioned Knowledge Kernel gematria methods;
8. the discrepancy report counts and the **0 / 72** positional-daemon invariant;
9. absence of private visitor-state keys from the public authority artifacts.

A mismatch fails validation. The validator does not rewrite the source module that disagrees.

## Spelling policy

Spellings and transliterations materially affect numerical results. Therefore the authority stores exact source forms and source locators instead of choosing one universal spelling and retroactively applying it everywhere.

The Shem dossier can preserve historical/project spelling variants such as I/J/Y or V/U/W forms. Such a variant is not automatically a migration. If the exact spelling participates in a calculation, the method/version and exact calculation input must travel with the result.

## Alias and supersession policy

An **alias** is an explicitly documented display or historical variant that continues to resolve to the same governed record. Pair 17's `Lauviah II` / `Valelauviah II` recurrence display is the v1 example.

A **supersession** changes which governed record or name is preferred for a future implementation version. Supersession must never delete the former record. `supersedes` and `supersededBy` remain empty in v1 because this release establishes authority and discrepancy visibility; it does not perform a migration.

## Relationship to future Temple work

The Pair Authority should be consulted before:

- adding pair-derived Knowledge Graph edges;
- expanding the Living Correspondence Engine;
- changing chamber identities or Third Names;
- creating aliases to positional Reunited Names;
- generating the 72 × 42 / 3,024-intersection matrix.

The authority layer is intentionally a data-and-validation release rather than a visual redesign. The next visual graph can therefore distinguish **source**, **later correspondence**, **computation**, and **Temple synthesis** without building on an ambiguous pair roster.

## Governing rule

**Correspondence is not identity. Computation is not revelation. A current implementation is not an ancient source. Record without erasing; migrate without hiding provenance.**
