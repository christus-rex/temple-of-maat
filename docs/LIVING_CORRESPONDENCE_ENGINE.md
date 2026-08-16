# Living Correspondence Engine v1

Schema: `temple-of-maat/living-correspondence-engine-v1`  
Version: `1.0.0`  
Privacy: `public-canonical-only`

## Purpose

The Living Correspondence Engine is a governed field ledger between the Temple's public canonical records and later comparative study. Its first rule is **absence is data**. A field is populated only when a reviewed canonical input supports the assignment. An empty field is not an invitation for the runtime to guess.

The engine follows the Temple research order:

`Source → Historical Scholarship → Later Correspondence → Computational Correspondence → Current Implementation → Temple Synthesis / Practice`

These layers remain distinct in both data and presentation. A Temple synthesis must not be restated as ancient history, and a computational equality must not be restated as metaphysical identity.

## Field contract

Every ledger exposes the same thirteen fields:

1. `deity-archetype`
2. `angel`
3. `inverse-shadow`
4. `jungian-function`
5. `ifs-part`
6. `element`
7. `planet`
8. `number`
9. `gematria`
10. `scripture-parallels`
11. `maat-declaration`
12. `meditation`
13. `ethical-action`

Each field carries a value or explicit absence, assignment status, evidence layer, provenance classes, source references, claim IDs, method references, boundaries, and a human-readable note.

Statuses are `REVIEWED`, `UNASSIGNED`, `UNMAPPED`, and `NO REVIEWED CLAIM`.

## v1 governed assignments

For chamber records, the stable chamber number and current angel are exposed as current implementation facts. The current daemon/twin is exposed only as the Temple's governed computational counterpart under `gematria-twin-crossmatch-v1`; the UI explicitly warns that this is not historical Goetia twinship, ontological evil, metaphysical identity, or spiritual rank.

Where the Knowledge Kernel contains a reviewed chamber-law claim, the law may appear under `ethical-action` as a **Temple Synthesis / Practice** prompt. It is not presented as an ancient instruction. Chambers without a reviewed Kernel law may display their current implementation law with a visible note that a separate Kernel claim is not yet attached.

Pair Authority naming migration is provenance only. Amendment I deployed Third Names and Amendment II preferred-future forms remain separate. `implementationMigrated = false` remains authoritative until a future versioned migration explicitly changes it.

## Deliberate absences

The engine does not infer deity/archetype, Jungian function, IFS part, element, planet, gematria total, scripture parallel, Ma’at declaration, or meditation simply because traditions, numbers, names, graph nodes, or themes appear visually close.

The `maat-declaration` field is explicitly `UNMAPPED` under **OPEN-004**. A reproducible reviewed method for the proposed 72×42 matrix must exist before any chamber-to-declaration assignment can be implemented. The engine does not infer that matrix from ordinal arithmetic or symbolic resonance.

A source-to-study relationship such as Qur’an source → Abjad study is source dependency, not a scripture parallel. Likewise, a graph path is connectivity only unless the individual stored edge establishes a stronger claim.

Gematria is especially method-bound. Pair Authority may document computational methods, but this engine does not copy a number into a correspondence field unless a reviewed field-level calculation is mapped to the selected record with its method version and spelling/normalization policy.

## Evidence boundaries

The following are always false in v1:

- visual pattern = evidence;
- shared number = identity;
- historical identity inferred from correspondence;
- metaphysical identity inferred from correspondence;
- private state = canonical evidence;
- OPEN-004 Ma’at mapping complete.

No intelligence or archetype in this interface replaces evidence, conscience, or the visitor's sovereignty. The purpose of the engine is comparison with boundaries, not rank-making or revelation claims.

## Privacy

The engine reads only public canonical inputs: Living Temple Map / Relationship Browser records, Pair Authority, Pair Authority naming migration, and the public Knowledge Kernel seed.

It does **not** read Journey reflections, Library private notes/correspondences, Research Notebook entries, Nabu–Thoth Scribe threads, `localStorage`, `sessionStorage`, or IndexedDB. It performs no network writes. Its export is a `temple-of-maat/correspondence-bundle-v1` bundle containing only the selected public ledger.

Future private overlays must be opt-in and device-local. They may indicate that private work is attached to a canonical record, but private text may never become a public graph edge, Kernel claim, or canonical correspondence assignment.

## Activation

The module is deliberately non-autoloading. `scripts/v5.3-threshold.js` does not import it. It appears only after explicit research installation and adds no bottom-dock control. Explicit installation may also install the Living Temple Map dependency and add one Library-footer launcher for the Correspondence Engine.

## Accessibility and mobile

The field ledger uses ordinary semantic controls and cards rather than a visual-only constellation. At narrow widths the controls and cards collapse to one column. Browser validation covers desktop, 412 px, and 360 px, including viewport containment, private-marker isolation, Pair Authority naming boundaries, explicit unresolved fields, and no unexpected network writes.

## Governing sentence

**The engine records what the Temple can presently support, and it records what the Temple cannot presently support. It does not manufacture the missing middle.**
