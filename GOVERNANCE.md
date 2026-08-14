# Temple of Ma'at — Governance Covenant

_Last revised: 2026-08-14_

The Temple of Ma'at is both a software project and an interpretive archive. Governance therefore protects two things at once: **technical integrity** and **discernment integrity**.

This document defines the rules that future releases, research additions, and ritual features should follow.

## 1. Ma'at as the governing standard

Within the project, Ma'at is operationalized as truthfulness, balance, accountability, proportion, non-harm, and correction.

A feature, claim, or symbolic correspondence is not strengthened by being dramatic. It is strengthened when its source, method, limits, and consequences remain visible.

## 2. Compare without collapsing

The Temple may compare religions, manuscripts, psychological systems, mystical traditions, computational patterns, and personal symbolism. Comparison does not erase difference.

A shared word, number, symbol, role, or archetype does **not** by itself establish that two historical figures, texts, traditions, gods, angels, demons, or concepts are identical.

When traditions are brought into correspondence, the interface and documentation should preserve:

- historical period;
- language;
- source tradition;
- textual context;
- later interpretive development;
- modern Temple interpretation.

## 3. Four provenance layers

Every research object should be assigned one or more visible layers.

### Layer 1 — Primary / Historical Source

Examples: manuscript text, facsimile, canonical source text, archaeological artifact record, historical edition, or attributed translation.

Rules:

- Preserve wording and attribution.
- Preserve source licensing and citation requirements.
- Do not silently normalize or modernize source text.
- If a transformation is required for search or computation, retain the original separately.

### Layer 2 — Scholarly / Computational Analysis

Examples: historical synthesis, philological notes, gematria tables, Abjad totals, metadata, statistics, normalization rules.

Rules:

- State the method before presenting conclusions.
- Make calculations reproducible where practical.
- Record spelling and normalization choices.
- Distinguish measured values from interpretation.

### Layer 3 — Comparative Interpretation

Examples: Buddhist–Jungian comparison, Qumran–Christian parallels, Egyptian–Mesopotamian comparison, symbolic resonance across traditions.

Rules:

- Similarity and difference must both remain visible.
- Later concepts must not be projected backward without labeling the comparison as diachronic.
- A plausible thematic analogy is not evidence of direct historical dependence.

### Layer 4 — Temple / Personal Symbolism

Examples: chamber correspondences, contemplative readings, personal gematria, ritual associations, archetypal mirrors.

Rules:

- Label the layer clearly.
- It may inspire practice or reflection, but it never overrides Layers 1–3.
- Personal symbolism must not be presented as proof of reincarnation, bloodline, supernatural rank, prophecy, authorship, or exclusive historical identity.

## 4. Gematria, Abjad, numerology, and computational correspondence

Numerical equality proves numerical equality under the stated method. It does not independently prove metaphysical identity or historical causation.

Every numerical study should record, when applicable:

- exact spelling;
- alphabet/cipher;
- normalization rules;
- punctuation/space treatment;
- final-letter rules;
- diacritic treatment;
- source corpus/version;
- hash or integrity metadata for reproducible corpora;
- strength of match.

Preferred evidence hierarchy:

1. exact, reproducible multi-field or multi-cipher match;
2. exact single-field match;
3. structural relation or adjacency;
4. root-pattern or thematic resonance.

Interpretive confidence should decrease as mathematical specificity decreases.

## 5. Canonical chamber integrity

The 72 chambers are canonical project records.

Changes to chamber names, numbering, source triplets, angel names, daemon/twin correspondences, Third Names, Offices, Laws, Pillars, or source provenance require explicit review.

Rules:

- Stable chamber IDs remain `01` through `72`.
- No chamber is silently deleted or renumbered.
- Historical source layers and later Temple layers remain separately addressable.
- A later correction should preserve a record of what changed and why.

## 6. Manual threshold covenant

The entrance is a visitor-controlled threshold.

Unless a future roadmap item explicitly changes this behavior:

- every fresh load pauses at the entrance;
- application mount does not count as visitor entry;
- deep links do not bypass the threshold;
- the visitor must perform an explicit entry action;
- ritual audio never starts as a side effect of entering.

## 7. Ritual media covenant

Ritual audio is always user-governed.

- No autoplay.
- Play, Pause, and Stop remain explicit controls.
- Volume changes may persist locally.
- Device-local audio remains private to the device unless the visitor explicitly chooses another model.
- If a canonical media fingerprint is used, integrity verification must not silently substitute another file.
- Failure to load media must not block access to the Temple.

## 8. Personal data and private practice

Journey state, favorites, reflections, bookmarks, and personal study notes are private by default.

- Local-first storage is preferred for personal practice data.
- Export must be explicit.
- Future cloud synchronization requires a separate design decision and clear consent.
- Public social/share features must not expose private reflections by default.

## 9. Collectible continuity

Existing collectible exports are part of the public contract:

- Seal PNG;
- Plate PNG;
- 1440×2560 chamber wallpaper;
- 3840×2160 Parental Powers wallpaper.

A future release must not remove or silently change these outputs without a roadmap decision and migration note.

## 10. Accessibility and mobile integrity

Ceremonial design does not excuse inaccessible interaction.

At minimum:

- important controls remain keyboard reachable;
- visible focus is retained;
- reduced-motion preferences are respected;
- tap targets remain usable on mobile;
- text remains readable at small breakpoints;
- hero faces and central subjects are not accidentally cropped out on common phone screens;
- dialogs and overlays have understandable close paths.

## 11. Release governance

Production changes follow a gated process:

1. Create a feature branch.
2. Implement the smallest coherent release scope.
3. Add or update source-level validators.
4. Add or update browser regression tests for affected behavior.
5. Open a pull request describing technical, source, and interpretive changes.
6. Resolve failures before promotion.
7. Promote only a green, immutable release head.
8. Verify the final `main` build and GitHub Pages deployment.

Temporary repair workflows and patch scripts should be removed before the release head is considered clean.

## 12. Documentation truth

`version.json`, `README.md`, `ROADMAP.md`, release validators, and the deployed site should not contradict one another.

If implementation advances beyond documentation, documentation debt becomes a release-blocking stewardship item rather than an indefinitely deferred cleanup.

## 13. Research ingestion covenant

A study may enter the Library only when the project can answer:

- What is the source?
- What edition or corpus is used?
- What transformations were applied?
- Which claims are historical, computational, comparative, or personal?
- What attribution or licensing terms apply?
- What parts are safe to expose publicly?
- How does the item connect to chambers without collapsing provenance?

Large source corpora should not be added to the initial app shell merely because they are important. Progressive loading and explicit offline-download choices are preferred.

## 14. Anti-distortion rule

The Temple should resist four recurring distortions:

1. **Source collapse** — merging historically distinct layers into one claim.
2. **Numerical inflation** — treating coincidence as proof.
3. **Authority inflation** — treating symbolic identification as rank or entitlement.
4. **UX inflation** — adding so many ritual or visual layers that the archive becomes difficult to use.

The corrective question is simple: **Does this addition increase truth, clarity, responsibility, and usable depth?**

## 15. Amendment rule

This covenant may evolve. Material changes should be made through a pull request and summarized in the roadmap or release notes so governance itself remains accountable.
