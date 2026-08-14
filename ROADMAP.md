# Temple of Ma'at — Canonical Roadmap

_Last revised: 2026-08-14_

This file is the durable planning source for the Temple of Ma'at project. Conversation history may inspire work, but planned work is not canonical until it is recorded here or in a linked GitHub issue.

## Current release

### v5.2.6 — Shem Dossiers

Current production state includes the 72-chamber archive, manual threshold entry, Living Codex, unified chamber dossiers, Parental Powers imagery, collectible exports, Pilgrim Journey state, favorites/reflections, PWA/offline support, and device-local ritual media handling.

The release line must not be retroactively renamed. New stewardship work begins at v5.2.7.

---

## NOW — v5.2.7 Stewardship & Governance

Goal: give the expanding Temple a durable operating structure before adding another major research surface.

### Documentation and release truth

- [ ] Keep `README.md` synchronized with the canonical `version.json` release.
- [ ] Maintain this `ROADMAP.md` as the authoritative Now / Next / Later plan.
- [ ] Maintain `GOVERNANCE.md` for provenance, source integrity, ethical interpretation, release control, and ritual-media rules.
- [ ] Convert unresolved work into GitHub issues with explicit acceptance criteria.
- [ ] Replace stale checklist assumptions with verified / pending / manual states.

### Regression and stewardship

- [ ] Preserve manual entrance on every load unless a future release explicitly changes the rule.
- [ ] Preserve all verified collectible exports: Seal PNG, Plate PNG, chamber wallpaper, and Parental Powers wallpaper.
- [ ] Preserve 72 canonical chamber records and Shem source layers.
- [ ] Preserve Journey state, favorites, reflections, and exportability.
- [ ] Preserve no-autoplay for ritual media.
- [ ] Keep device-local media private unless the visitor explicitly chooses another storage model.
- [ ] Require source-level validation and browser regression testing before release promotion.

### Planning deliverable

v5.2.7 is complete when the repository itself answers four questions without relying on chat history:

1. What is currently canonical?
2. What is being built next?
3. What evidence and interpretation rules govern additions?
4. What tests must pass before publication?

---

## NEXT — v5.2.8 Temple Library

Goal: create a scholarly and contemplative library that expands beyond the 72 chambers without forcing external traditions into chamber identities.

### Library architecture

Use the hierarchy:

`Library → Tradition → Source → Study → Discernment → Correspondences`

Every library object should retain a stable identifier and provenance layer.

### Initial research collections

Candidate collections already developed outside the repository include:

- Buddhist studies — *The Buddha's Path of Awakening*.
- Dead Sea Scrolls — comprehensive historical analysis.
- Dead Sea Scrolls — gematria discernment companion.
- Qur'an — Arabic source text with Pickthall translation.
- Qur'an — computational Abjad study.
- Biblia de Ferrara — primary facsimile/source tradition.
- Biblia de Ferrara — Spanish gematria/discernment study.
- Future Enoch, Pistis Sophia, Jung, Egyptian, Mesopotamian, Ifá, and related research collections.

### Required source layers

Each Library item must visibly distinguish:

1. **Primary / Historical Source** — source text, artifact, manuscript, translation, or preserved edition.
2. **Scholarly / Computational Analysis** — historical analysis, linguistic method, tables, calculations, reproducible transformations.
3. **Comparative Interpretation** — cross-tradition comparison where similarities and differences remain visible.
4. **Temple / Personal Symbolism** — contemplative or personal correspondence that never overrides the first three layers.

### Library interface scope

- [ ] Search across traditions, sources, titles, themes, and provenance layers.
- [ ] Open source-linked study records.
- [ ] Bookmark passages or study records.
- [ ] Attach a Library record to a chamber as a correspondence without claiming historical identity.
- [ ] Save private study notes locally.
- [ ] Export notes and Library bookmarks.
- [ ] Keep large source corpora progressively loaded rather than bloating the initial PWA shell.
- [ ] Preserve attribution and licensing metadata for every imported source.

---

## LATER — v5.3.0 Integrated Research Temple

Goal: integrate chamber practice, the Living Codex, Journey state, and the Temple Library into a coherent research-and-practice environment.

### Major architectural work

- [ ] 72-node Temple Map showing current, visited, bookmarked, and completed chambers.
- [ ] Cross-source theme graph connecting chambers to Library records without collapsing provenance.
- [ ] Unified search across Chambers, Codex, Dossiers, Library, reflections, and bookmarks.
- [ ] Research workspace for comparing two or more records side by side.
- [ ] Exportable research bundles with source citations and interpretation-layer labels.
- [ ] Public/private boundary controls for personal notes and ritual state.
- [ ] Rich social preview and public discovery layer where appropriate.
- [ ] Sitemap / robots / structured metadata review.

### Major-version rule

v5.3.0 should represent an architectural change, not merely visual polish. It should only ship when the Library and governance foundations are stable.

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

Every production release should satisfy all applicable gates:

### Source integrity

- Canonical records have stable counts and IDs.
- Source-derived facts are not silently replaced by interpretive claims.
- Gematria / numerological matches remain labeled as correspondences, not proof of identity, destiny, authorship, or historical causation.
- Primary-source wording, normalization rules, and computational assumptions are documented where relevant.

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
- Pull request describes source and UX implications.
- Production promotion occurs only after the exact release head is green.

---

## Planning discipline

When a new idea appears, classify it before implementation:

- **Now** — necessary for the current release.
- **Next** — already approved for the next release.
- **Later** — valuable, but not required yet.
- **Research** — content or methodology work that can mature independently of UI implementation.

Avoid growing `index.html` or runtime complexity merely because a new study exists. The Temple should remain navigable as its archive grows.
