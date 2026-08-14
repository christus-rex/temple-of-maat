# Temple of Ma'at — Canonical Roadmap

_Last revised: 2026-08-14_

This file is the durable planning source for the Temple of Ma'at project. Conversation history may inspire work, but planned work is not canonical until it is recorded here or in a linked GitHub issue.

## Current release

### v5.2.8 — Temple Library & Portable Practice

v5.2.8 completes the stewardship-to-library release line with four integrated capabilities:

1. **Temple Library** — provenance-aware research records using the hierarchy `Library → Tradition → Source → Study → Discernment → Correspondences`.
2. **Portable Pilgrim Journey** — local JSON export/import with strict schema/version validation, preview-before-apply Replace, and non-destructive Merge.
3. **Offline ownership** — explicit full visual caching, progress/cancellation, storage status, and visual-only cleanup that preserves private Journey/reflection/study state.
4. **Release hardening** — repeatable service-worker upgrade, deep-link threshold, narrow-phone overlay/geometry, screenshot-evidence, and deployed-origin verification paths.

The release preserves the existing 72-chamber archive, Living Codex, unified dossiers, Parental Powers, collectible exports, manual threshold, private local study state, and device-local no-autoplay ritual media.

### v5.2.8 completed scope

- [x] Search across Library traditions, sources, studies, themes, and provenance layers.
- [x] Open source-linked study records while keeping source and interpretation distinct.
- [x] Bookmark Library records/passages locally.
- [x] Save private Library notes locally.
- [x] Attach a Library record to a chamber as an explicit Layer-4 correspondence rather than a historical identity claim.
- [x] Export personal Library state.
- [x] Keep large research indexes progressively loaded rather than bloating the initial PWA shell.
- [x] Preserve attribution/licensing/provenance metadata in the canonical Library schema.
- [x] Import/restore Pilgrim Journey JSON locally with preview and safe conflict handling.
- [x] Expose `Download Temple for Offline Use`, storage status, cancellation, and optional-visual cleanup.
- [x] Keep ritual audio outside service-worker Cache Storage.
- [x] Preserve private Journey/reflection/Library state when optional visual caches are cleared.
- [x] Add repeatable PR-head hardening and a post-deploy production-origin verifier.
- [x] Keep real Android/iOS/Desktop installed-device checks explicitly separate from browser emulation.

### Initial Library collections

The v5.2.8 Library foundation includes indexed research drawn from developed collections such as:

- Buddhist studies — *The Buddha's Path of Awakening*.
- Dead Sea Scrolls — comprehensive historical analysis.
- Dead Sea Scrolls — gematria discernment companion.
- Qur'an — Arabic source text with Pickthall translation.
- Qur'an — computational Abjad study.
- Biblia de Ferrara — primary facsimile/source tradition.
- Biblia de Ferrara — Spanish gematria/discernment study.

Future Enoch, Pistis Sophia, Jung, Egyptian, Mesopotamian, Ifá, and related collections can be prepared independently under the same provenance contract.

---

## NEXT — v5.3.0 Integrated Research Temple

Goal: integrate Chambers, Living Codex, Dossiers, Library, Journey state, and selected private study state into a coherent research-and-practice environment without collapsing provenance.

### Foundation first — canonical relationship edges

Before building the major visual interfaces, define one shared relationship model for all cross-record connections. A relationship should carry enough information to answer:

`source record → relationship type → target record → provenance layer → authority/confidence → source identifiers`

Relationship types may include thematic parallel, comparative similarity, methodological parallel, source-derived relation, and explicit Temple/personal correspondence. A visual edge must never imply direct historical influence or metaphysical identity merely because two records are connected.

Foundation status:

- [x] Define `temple-of-maat/relationship-graph-v1` as a separate cross-system graph rather than mutating the stable v5.2.8 Library catalog.
- [x] Define stable `chamber`, `codex`, `dossier`, and `library` endpoint namespaces.
- [x] Mechanically fix `historicalIdentity=false` and `metaphysicalIdentity=false` on every graph edge.
- [x] Define relation types, provenance layers, confidence, evidence basis, direction, and direct-historical-influence claim boundaries.
- [x] Seed only evidence-backed source→study and same-ordinal Temple architecture edges; do not invent symbolic Library→Chamber links for visual richness.
- [x] Keep the public canonical graph free of private Journey/reflection/Library-note state.
- [x] Resolve graph endpoints against the real 72 Chambers, 72 Living Codex rows, 72 Dossier rows, and current Library record IDs in CI.
- [x] Add negative validator guardrails for identity inflation, unresolved endpoints, private-state insertion, L4 omission, unsupported computational claims, and unsupported historical-influence claims.
- [ ] Add the shared runtime resolver/query module after the data/schema foundation is merged.

### Comparative Reading / Research Workspace

- [ ] Unified search across chamber metadata, Codex records, dossiers, Library records, bookmarks, and explicitly selected private notes.
- [ ] Show result type and provenance before opening a result.
- [ ] Compare source text, scholarly/computational analysis, comparative interpretation, and Temple/personal symbolism side by side without merging them into one record.
- [ ] Support tablet/desktop comparison with a usable stacked mobile fallback.
- [ ] Export research bundles with stable source identifiers, citations, and provenance labels.
- [ ] Exclude private notes/reflections from exports unless the visitor explicitly selects them.

### 72-node Temple Map

- [ ] Show all 72 chambers as optional navigable nodes.
- [ ] Distinguish current, visited, favorite/bookmarked, and unvisited state.
- [ ] Open the chamber/dossier from a node.
- [ ] Connect chambers to Library/Codex records only through explicit provenance-bearing relationship edges.
- [ ] Filter by tradition, source layer, theme, and chamber.
- [ ] Provide keyboard-accessible non-graph navigation.
- [ ] Remain usable under reduced-motion settings without requiring force-directed animation.
- [ ] Progressively load large Library graph data.

### Major-version rule

v5.3.0 is an architectural release, not visual polish. It should begin only after v5.2.8 release identity, service-worker upgrade behavior, deployed-origin verification, and the Library provenance foundation are stable.

---

## RESEARCH — independent content maturation

Research can advance without forcing a UI release. A study may be prepared, verified, and indexed before it becomes publicly navigable.

Priority themes:

- Ma'at as ethical and cosmological order.
- Shem HaMephorash source history and later angelological layers.
- Enoch and Second Temple literature.
- Dead Sea Scrolls and Qumran context.
- Pistis Sophia and late antique Christian/Gnostic traditions.
- Buddhist ethics, meditation, and liberation traditions.
- Qur'anic source text and transparent Abjad computation.
- Sephardic/Ferrara textual transmission.
- Jungian psychology and symbolic interpretation.
- Egyptian and Mesopotamian textual/cosmological studies.
- Ifá and other comparative contemplative/divinatory systems with explicit provenance boundaries.

---

## Canonical provenance layers

Every research-facing feature must keep these layers distinguishable:

1. **Layer 1 — Primary / Historical Source** — source text, artifact, manuscript, translation, preserved edition, or direct data record.
2. **Layer 2 — Scholarly / Computational Analysis** — historical analysis, linguistic method, tables, calculations, reproducible transformations.
3. **Layer 3 — Comparative Interpretation** — cross-tradition comparison where both similarities and differences remain visible.
4. **Layer 4 — Temple / Personal Symbolism** — contemplative or personal correspondence that never overrides Layers 1–3.

The governing rule remains: **compare without collapsing**.

---

## Release gates

Every production release should satisfy all applicable gates.

### Source integrity

- Canonical records retain stable counts and IDs.
- Source-derived facts are not silently replaced by interpretive claims.
- Gematria/numerological equality is described as equality under the stated method, not proof of identity, destiny, authorship, supernatural rank, or historical causation.
- Primary-source wording, normalization rules, computational assumptions, attribution, and licensing remain visible where applicable.

### UX and accessibility

- Manual threshold behavior remains intact unless a future approved release explicitly changes it.
- Deep links do not expose chamber artifacts before explicit entry.
- Mobile navigation remains usable.
- Hero faces/core visual subjects remain visible on small screens.
- Keyboard/focus behavior remains functional.
- Reduced-motion behavior remains respected.

### Collectibles

- Seal PNG export works.
- Plate PNG export works.
- 1440×2560 chamber wallpaper export works.
- 3840×2160 Parental Powers wallpaper export works.

### PWA, persistence, and offline ownership

- Shell-changing releases use a new service-worker namespace.
- A prior installed worker can update without bypassing the manual threshold.
- Offline fallback remains valid.
- Journey state, favorites, and reflections survive reload.
- Optional visual-cache clearing never erases private study state.
- Binary ritual media remains outside service-worker Cache Storage.
- Deployed-origin verification is run after Pages promotion.
- Real installed-device checks are never inferred from Chromium emulation.

### Ritual media

- No autoplay.
- Play / Pause / Stop remain explicit visitor actions.
- Device-local media stays local unless the visitor explicitly changes that model.
- Canonical media fingerprints remain intact when integrity verification is used.

### Release process

- Work lands on a feature branch.
- Source validators pass.
- Affected browser regression suites pass on the exact PR head.
- Failure logs/screenshots are preserved before fixing regressions.
- Pull requests describe source, privacy, PWA, and UX implications.
- Production promotion uses the exact verified head SHA.
- `main` validation and GitHub Pages build/deploy/report succeed after merge.
- The repeatable deployed-origin verifier succeeds before the release is declared published.

See `PWA-CHECKLIST.md` and `docs/RELEASE_VERIFICATION.md` for the executable verification process.

---

## Planning discipline

When a new idea appears, classify it before implementation:

- **Current** — already part of the released/promotion candidate contract.
- **Next** — approved work for the next architectural release.
- **Later** — valuable, but not required by the next release.
- **Research** — content/methodology work that can mature independently.

Avoid growing `index.html`, the service-worker shell, or runtime complexity merely because a new study exists. The Temple should become easier—not harder—to navigate, verify, preserve, and understand as its archive grows.
