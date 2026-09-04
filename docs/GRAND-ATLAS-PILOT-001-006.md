# Grand Atlas Pilot — Chambers 001–006

## Purpose

This pilot operationalizes the Visual Canon Foundation for the first six chambers without falsely marking nonexistent artwork as canonical.

The pilot is intentionally metadata-first. It reserves stable canonical asset paths, exposes the chamber teaching and provenance fields required by the future Grand Atlas, and keeps all four visual layers in `DRAFT` until real files have been produced and audited.

## Pilot chambers

| Chamber | Angel | Daemon | Modern synthesis name | Office | Core teaching |
|---|---|---|---|---|---|
| 001 | Vehuiah | Bifrons | Bifruiah | Keeper of Remembered Beginnings | INITIATE WITHOUT ERASURE |
| 002 | Jeliel | Orias | Orialiel | Steward of Concordant Authority | AUTHORITY SERVES HARMONY |
| 003 | Sitael | Andras | Andritael | Warden of Necessary Endings | END WHAT DEVOURS LIFE |
| 004 | Elemiah | Berith | Berelmiah | Keeper of Revalued Direction | POWER BOWS TO RIGHT ORDER |
| 005 | Mahasiah | Gamigin | Gamiasiah | Curator of Healing Memory | MEMORY HEALS WHEN WITNESSED |
| 006 | Lelahel | Vapula | Vapulahel | Artificer of Beneficent Craft | CRAFT WITHOUT DOMINION |

The values above are copied from `chambers.json`. Pairing and synthesis governance should also be read with `docs/PAIR_AUTHORITY.md`.

## Reserved visual package

Each pilot chamber now has stable reserved targets for:

1. Final Seal
2. Invocation Seal
3. Entity Depiction
4. Chamber Artwork

The naming pattern follows `docs/VISUAL-CANON-FOUNDATION.md` and uses the chamber number as the immutable anchor.

Example:

`assets/visual-canon/ch001/CH001_VEHUIAH_FINAL-SEAL_v1.0.png`

No reserved path implies that the file currently exists.

## Provenance boundary

For the pilot data layer:

- traditional angel and daemon names remain inherited labels from their respective source traditions;
- the chamber pairing, synthesis name, office, law, threshold-seal naming, visual system, and Atlas architecture are treated as modern Temple synthesis unless separately sourced;
- comparison does not establish identity, supernatural rank, prophecy, reincarnation, common origin, or historical authorship.

The pilot therefore exposes both `TRADITIONAL_INTERPRETATION` and `MODERN_TEMPLE_SYNTHESIS` as provenance layers rather than collapsing them.

## Completion state

All six records are currently:

`PILOT_METADATA_READY`

Their four visual assets remain:

`DRAFT`

A chamber must not move to canonical completion until:

- all four actual files exist;
- each file has a corresponding visual-canon metadata record;
- historical-vs-modern labeling is reviewed;
- mobile legibility is checked;
- metadata audit passes;
- accepted files are archived without duplicates;
- Drive/archive identifiers are recorded when available;
- Grand Atlas references resolve to the accepted assets.

## Grand Atlas contract demonstrated by this pilot

The data file `data/grand-atlas-pilot-001-006.json` proves the minimum chamber-facing contract for the first six records:

- stable chamber number and ID;
- angel, daemon, and modern synthesis name;
- office;
- Fire and pillar;
- core teaching;
- threshold-seal name;
- provenance layers;
- source references;
- four reserved canonical visual paths;
- explicit completion state.

## Next execution step

Produce Chamber 001 as the first full visual package, audit it against `data/visual-canon-v1.schema.json`, then use the accepted design language to generate Chambers 002–006. The pilot should be corrected before any pattern is propagated to Chambers 007–072.

---

**Rule:** metadata may reserve a future canonical location, but only an audited, archived, accepted asset may carry `CANONICAL` status.
