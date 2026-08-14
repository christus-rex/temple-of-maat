# Temple of Ma'at — Canonical Roadmap

_Last revised: 2026-08-14_

This file is the durable planning source for the Temple of Ma'at project. Conversation history may inspire work, but planned work is not canonical until it is recorded here or in a linked GitHub issue.

## Current production release

### v5.2.7 — Stewardship & Governance

Current production state includes the 72-chamber archive, manual threshold entry, Living Codex, unified chamber dossiers, native Shem layers, Parental Powers imagery, collectible exports, Pilgrim Journey state, favorites/reflections, PWA/offline support, device-local ritual media handling, a canonical roadmap, governance covenant, verification matrix, and release-enforced stewardship documentation.

Release history is not retroactively renamed. The next production release remains v5.2.8.

---

## COMPLETED — v5.2.7 Stewardship & Governance

The repository now answers without relying on chat history:

1. What is currently canonical?
2. What is being built next?
3. What evidence and interpretation rules govern additions?
4. What tests must pass before publication?

Completed stewardship deliverables include:

- [x] `README.md` synchronized to the release lineage.
- [x] `ROADMAP.md` established as the authoritative Now / Next / Later plan.
- [x] `GOVERNANCE.md` established for provenance, source integrity, ethical interpretation, release control, and ritual-media rules.
- [x] Durable GitHub backlog with explicit acceptance criteria.
- [x] Verification matrix separating automated, deployed-origin, and device/manual checks.
- [x] Release validator protecting documentation truth and inherited Temple invariants.

---

## NOW — v5.2.8 Temple Library

Goal: create a scholarly and contemplative Library that expands beyond the 72 chambers without forcing external traditions into chamber identities.

### Phase A — Library data model and provenance schema — issue #15

Architecture:

`Library → Tradition → Source → Study → Discernment → Correspondences`

Foundation contract:

- [x] Stable namespaced identifiers for every Library record type.
- [x] Machine-readable public catalog schema: `temple-of-maat/library-v1`.
- [x] Separate visitor-private schema: `temple-of-maat/library-personal-state-v1`.
- [x] Explicit relationships between traditions, sources, studies, discernments, and correspondences.
- [x] Source edition/corpus/repository/identifier metadata fields.
- [x] Attribution/license/public-exposure fields.
- [x] Integrity metadata for hashes, byte counts, and record counts.
- [x] Normalization and computational-method records kept separate from source records.
- [x] Chamber correspondences structurally constrained to IDs `01`–`72` and `identityClaim: false`.
- [x] Private notes/bookmarks structurally excluded from the public catalog.
- [x] Dependency-free CI validator with positive and negative contract tests.
- [ ] Merge issue #15 foundation after exact PR head is green.

The canonical public registry begins empty. Research does not become a Library record merely because it exists outside the repository; each collection enters through its own reviewed ingestion issue.

### Phase B — Initial research ingestion

- [ ] #16 — Buddhist research collection beginning with *The Buddha's Path of Awakening*.
- [ ] #17 — Dead Sea Scrolls historical and gematria collections.
- [ ] #18 — Qur'an source edition and reproducible Abjad study.
- [ ] #19 — Biblia de Ferrara source tradition and gematria study.

Candidate future collections include Enoch, Pistis Sophia, Jung, Egyptian, Mesopotamian, Ifá, and related research.

### Required source layers

Every Library research item must visibly distinguish:

1. **L1 — Primary / Historical Source** — source text, artifact, manuscript, translation, preserved edition, or defined corpus.
2. **L2 — Scholarly / Computational Analysis** — historical analysis, linguistic method, tables, calculations, reproducible transformations.
3. **L3 — Comparative Interpretation** — cross-tradition comparison where similarities and differences remain visible.
4. **L4 — Temple / Personal Symbolism** — contemplative or personal correspondence that never overrides the first three layers.

### Phase C — Visitor-facing Library interface

- [ ] #20 — Search and reading interface.
- [ ] Search across traditions, sources, titles, themes, and provenance layers.
- [ ] Open source-linked study records without bloating the initial PWA shell.
- [ ] Bookmark passages or study records locally.
- [ ] Attach a Library record to a chamber as a correspondence without claiming historical identity.
- [ ] Save private study notes locally.
- [ ] Export notes and Library bookmarks explicitly.
- [ ] Preserve attribution and licensing metadata wherever source material is exposed.

### Supporting v5.2.8 work

- [ ] #21 — Journey import/restore and portable personal archive.
- [ ] #22 — Visible full-offline download controls and storage status.
- [ ] #23 — Formal deployed-origin and mobile PWA regression runs.

---

## LATER — v5.3.0 Integrated Research Temple

Goal: integrate chamber practice, the Living Codex, Journey state, and Temple Library into a coherent research-and-practice environment.

### Major architectural work

- [ ] #24 — 72-node Temple Map and cross-source theme graph.
- [ ] #25 — Unified search and comparison workspace across Temple records.
- [ ] Exportable research bundles with source identifiers and interpretation-layer labels.
- [ ] Public/private boundary controls for personal notes and ritual state.
- [ ] Rich social preview and public discovery layer where appropriate.
- [ ] Sitemap / robots / structured metadata review.

### Major-version rule

v5.3.0 should represent an architectural change, not merely visual polish. It should only ship when Library provenance, search, and ingestion foundations are stable.

---

## Research backlog

Research can advance independently of UI releases. A study can be prepared, verified, and indexed before it becomes visible in the public Temple.

Priority research themes:

- Ma'at as ethical and cosmological order.
- Shem HaMephorash source history and later angelological layers.
- Enoch and Second Temple literature.
- Dead Sea Scrolls and Qumran context.
- Pistis Sophia and late antique Christian/Gnostic traditions.
- Buddhist ethics, meditation, and liberation traditions.
- Qur'anic source text and transparent Abjad computation.
- Sephardic/Ferrara textual transmission.
- Jungian psychology and symbolic interpretation.
- Comparative ritual, divination, and contemplative systems with explicit provenance boundaries.

---

## Release gates

Every production release should satisfy all applicable gates.

### Source integrity

- Canonical records have stable counts and IDs.
- Source-derived facts are not silently replaced by interpretive claims.
- Gematria / numerological matches remain labeled as correspondences, not proof of identity, destiny, authorship, or historical causation.
- Primary-source wording, normalization rules, and computational assumptions are documented where relevant.
- Library source records retain L1 and cannot absorb visitor-private state.

### UX and accessibility

- Manual threshold behavior is preserved when required by the release.
- Mobile navigation remains usable.
- Hero faces and core visual subjects remain visible on small screens.
- Keyboard and focus behavior remain functional.
- Reduced-motion behavior remains respected.

### Collectibles

- Seal PNG export works.
- Plate PNG export works.
- 1440×2560 chamber wallpaper export works.
- 3840×2160 Parental Powers wallpaper export works.

### PWA and persistence

- Service-worker namespace changes with releases that alter the shell.
- Offline fallback remains valid.
- Journey state survives reload.
- Favorites and reflections survive reload.
- Update flow does not silently trap users on stale assets.

### Ritual media

- No autoplay.
- Play / Pause / Stop remain explicit visitor actions.
- Device-local media stays local unless the visitor explicitly changes that model.
- Canonical media fingerprints are retained when integrity verification is used.

### Release process

- Work lands on a feature branch.
- Validators pass.
- Browser smoke tests pass for affected behavior.
- Pull request describes source, privacy, and UX implications.
- Production promotion occurs only after the exact release head is green.

---

## Planning discipline

When a new idea appears, classify it before implementation:

- **Now** — necessary for the current release.
- **Next** — already approved for the next release.
- **Later** — valuable, but not required yet.
- **Research** — content or methodology work that can mature independently of UI implementation.

Avoid growing `index.html` or runtime complexity merely because a new study exists. The Temple should remain navigable as its archive grows.
