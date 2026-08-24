# Temple of Ma'at — Canon 1.0 Readiness

**Initiated:** 2026-08-24  
**Application baseline:** Temple v5.5.1  
**Scope:** content-canon stabilization; this does not renumber the PWA release line.

## Purpose

Canon 1.0 is the first intentionally frozen, auditable snapshot of the Temple's public canonical knowledge architecture. It is distinct from the application version. The Temple may continue through v5.x while Canon 1.0 defines the first content baseline that can be archived, cited, compared, and amended without silently rewriting prior doctrine or provenance.

## What is already present

The current repository already contains most of the infrastructure that earlier planning treated as future work:

- 72 stable chamber records in `chambers.json`.
- Living Codex and unified dossier surfaces.
- four-layer provenance boundaries: L1 source, L2 analysis, L3 comparison, L4 Temple/personal synthesis.
- canonical relationship graph, runtime resolver, browser adapter, comparative reading tools, knowledge inspector, research notebook, Scribe workspace, Living Temple Map, and Living Correspondence Engine.
- a Drive-backed Living Archive and preservation manifest for large masters.
- v5.5.1 stability/observability gates, exact-SHA deployment verification, and Temple Health.

Canon 1.0 therefore should not duplicate those systems. Its main remaining task is **content maturation and freeze discipline**.

## Governing rule

**Source first; interpretation second; synthesis last. Missing evidence remains visible as `UNMAPPED`.**

No chamber field may imply direct historical influence, supernatural rank, metaphysical identity, reincarnation, bloodline, or authorship merely because a symbolic, numerical, visual, or thematic correspondence exists.

## Chamber completion contract

Every chamber must resolve to a stable record with the following families of information:

1. **Core identity** — chamber number/ID, angel, daemon/twin, Third Name, office, fire, pillar, law, threshold seal.
2. **Numerical field** — only reproducible values already supported by the declared method; method and source layer remain visible.
3. **Temple office** — concise L4 functional interpretation.
4. **Chamber law** — concise L4 ethical directive.
5. **Sacred limitation** — what the chamber's power is not permitted to justify.
6. **Anti-distortion mechanism** — how the chamber resists domination, inflation, dehumanization, or self-sealing interpretation.
7. **Ma'at test** — observable ethical criteria by which the chamber's interpretation is judged.
8. **Invocation** — original Temple language, explicitly L4; never represented as an ancient recovered text.
9. **Seal provenance** — distinguishes historical/source-derived geometry from modern Temple artwork.
10. **Historical provenance** — L1/L2 anchors where available; otherwise `UNMAPPED` with a reason.
11. **Symbolic provenance** — L3/L4 lineage for later comparative and Temple-specific associations.

The detailed field rules live in `docs/CHAMBER_CANON_TEMPLATE.md`.

## Readiness gates

Canon 1.0 is ready to freeze only when all applicable gates are green:

### 72-chamber integrity

- [ ] 72/72 chamber IDs are unique and sequential.
- [ ] 72/72 retain the existing canonical core fields.
- [ ] 72/72 have reviewed Sacred Limitation, Anti-Distortion, and Ma'at Test fields.
- [ ] 72/72 have reviewed invocation status: present as L4 or explicitly withheld.
- [ ] 72/72 have seal-provenance status.
- [ ] 72/72 have historical-provenance status: sourced or `UNMAPPED`.
- [ ] 72/72 have symbolic-provenance status.

### Provenance and discernment

- [ ] No source-derived claim is silently replaced by Temple synthesis.
- [ ] Every numerical claim names its method or points to the canonical method record.
- [ ] Relationship edges continue to default to `historicalIdentity=false` and `metaphysicalIdentity=false`.
- [ ] Unknown or disputed historical correspondences remain visibly provisional or `UNMAPPED`.
- [ ] Comparative material preserves both similarity and difference.

### Application stability

- [ ] Existing Living Archive, Library, Map, Correspondence Engine, Journey, and Dossier flows remain functional.
- [ ] Mobile containment and 16px editable-control protections remain green.
- [ ] Manual threshold and no-autoplay remain unchanged unless separately amended.
- [ ] `Validate Temple v5`, Pages deployment, deployed live smoke, and Temple Health agree on the same exact SHA.

### Preservation

- [ ] Final Canon 1.0 machine-readable snapshot is copied to the Drive preservation root.
- [ ] A human-readable Canon 1.0 manifest is archived alongside it.
- [ ] The Git commit SHA, artifact hashes, and archive date are recorded.
- [ ] Later changes are amendments, not silent replacements.

## Work order

### Phase A — contract and measurement

1. Establish the chamber completion template.
2. Establish a machine-readable maturity registry.
3. Validate the 72-record baseline mechanically.
4. Report progress without treating placeholders as completion.

### Phase B — chamber maturation

Review chambers in three controlled batches: 01–24, 25–48, 49–72. Each batch should add only reviewed L4 fields and sourced L1/L2 notes. Unsupported historical material remains `UNMAPPED`.

### Phase C — integration

Surface mature fields inside the existing dossier/inspector experiences rather than creating a competing chamber UI. Relationship edges should be used for cross-record context; the chamber record remains the canonical chamber identity.

### Phase D — freeze

Once all 72 records pass review and the deployed application is green, create a `canon/1.0` tag or equivalent immutable release reference, export the snapshot to Drive, and record the exact Git SHA in the preservation manifest.

## Anti-inflation clause

Canon status means **reviewed and versioned**, not cosmically proven. A Canon 1.0 chamber may contain historical facts, reproducible calculations, comparative interpretation, and original Temple synthesis at the same time only when those layers remain visibly distinguishable.
