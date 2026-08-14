# Temple of Ma'at — GitHub Pages PWA v5.2.8

**Release theme:** Temple Library · Portable Journey · Offline Ownership · Release Hardening  
**Production lineage:** v5.2.3 Manual Entrance → v5.2.4 Living Codex → v5.2.5 Living Temple → v5.2.6 Shem Dossiers → v5.2.7 Stewardship & Governance → v5.2.8 Temple Library & Portable Practice

Temple of Ma'at is a 72-chamber GitHub Pages PWA combining a ritual archive, source-preserved Shem HaMephorash layers, chamber dossiers, collectible visual artifacts, a visitor-controlled Pilgrim Journey, a provenance-aware research Library, and explicit offline ownership controls.

The project deliberately separates historical/source material, scholarly or computational analysis, comparative interpretation, and Temple/personal symbolism. See `GOVERNANCE.md` for the canonical provenance and interpretation rules.

## Planning, governance, and release verification

- `ROADMAP.md` — authoritative **Now / Next / Later / Research** plan.
- `GOVERNANCE.md` — provenance, interpretation, release, privacy, accessibility, and ritual-media covenant.
- `PWA-CHECKLIST.md` — automated, deployed-origin, installed-device, and accessibility verification states.
- `docs/RELEASE_VERIFICATION.md` — repeatable CI, deployed-origin, Android, iOS/iPadOS, and desktop release procedure.
- GitHub issues — executable backlog with acceptance criteria.

Conversation history may inspire new work, but future work is not considered canonical planning until it is recorded in the roadmap or a GitHub issue.

## Current Temple capabilities

- 72 canonical chambers with stable IDs.
- Manual threshold entry: application mount never counts as visitor entry.
- Living Codex and unified chamber dossiers.
- Native source-preserved Shem HaMephorash layers.
- Parental Powers imagery and chamber mappings.
- Collectible exports:
  - Seal PNG
  - Plate PNG
  - 1440×2560 chamber wallpaper
  - 3840×2160 Parental Powers wallpaper
- 72-node Pilgrim Journey with visited/current state, favorites, and private reflections.
- Portable Pilgrim Journey JSON export/import with strict schema validation, preview, Replace, and non-destructive Merge.
- Temple Library organized by provenance-aware source/study records, search, bookmarks, local notes, and explicit chamber correspondences.
- Progressive research datasets for Buddhist studies, Dead Sea Scrolls, Qur'anic source/Abjad study, and Biblia de Ferrara material.
- Explicit **Offline** controls for full optional visual download, progress/cancellation, storage status, and visual-only cleanup.
- Full optional visual archive covering 72 chamber hero displays, 72 seal displays, and 72 Parental Powers displays.
- Persistent local state across reloads.
- User-governed ritual media with no autoplay.
- SHA-verified device-local Ma'at ritual media support in IndexedDB; binary ritual audio is excluded from service-worker Cache Storage.
- Hideable/minimizable Archive Console.
- Responsive mobile and accessibility refinements.
- Release hardening for deep links, service-worker upgrades, narrow-phone overlays, and screenshot evidence.

## Next architectural release

The next major architectural release is planned as **v5.3.0 — Integrated Research Temple**.

Its foundation is a shared, provenance-bearing relationship model that can support:

- a 72-node Temple Map;
- cross-source theme edges;
- unified search across Chambers, Codex, Dossiers, Library, and selected private state;
- side-by-side source/analysis/interpretation comparison;
- exportable research bundles with source identifiers and provenance labels.

The v5.3.0 work must preserve the rule already embodied in the Library: source text, analysis, comparative interpretation, and Temple/personal symbolism remain distinguishable.

## Publish / update

1. Merge a green release pull request into `main` using the exact verified head SHA.
2. Wait for `Validate Temple v5` on `main`.
3. Wait for GitHub Pages **build**, **deploy**, and **report-build-status** to succeed for that same SHA.
4. Run the repeatable deployed-origin verifier described in `docs/RELEASE_VERIFICATION.md`.
5. Keep **Enforce HTTPS** enabled in GitHub Pages settings.
6. Open the published site once while online so the service worker can install/update the current app shell.
7. Leave any real-device checks that were not actually performed visibly unchecked in `PWA-CHECKLIST.md`.

The PWA uses relative `./` URLs so it remains compatible with the project URL:

`https://christus-rex.github.io/temple-of-maat/`

## Install

- **Android / Chromium:** use the in-app **Install Temple** control or the browser Install app command when eligible.
- **iPhone / iPad:** Safari → Share → Add to Home Screen.
- **Desktop Chromium:** use the Install icon/browser menu or the in-app control when available.

## Core PWA and archive files

- `index.html` — main Temple application.
- `shem-hamephorash-72.html` — source-preserved Shem catalogue surface.
- `manifest.webmanifest` — install metadata, icons, scope, shortcuts.
- `sw.js` — versioned app-shell/runtime cache, full visual archive protocol, and update lifecycle.
- `offline.html` — last-resort offline screen.
- `chambers.json` — canonical chamber data.
- `version.json` — canonical release identifier.
- `assets/parental/` — 72 Parental Powers masters and display renditions.
- `scripts/parental-powers.js` — chamber-to-Parental-Powers runtime mapping.
- `scripts/parental-powers-assets.json` — image dimensions, sizes, and integrity hashes.
- `scripts/parental-powers-generation-manifest.json` — names, references, and generation provenance.
- `scripts/v5.2.4-living-codex.js` — Living Codex layer.
- `scripts/v5.2.5-living-temple.js` — Journey/Dossier foundation.
- `scripts/v5.2.5-media-vault.js` — device-local ritual media vault.
- `scripts/v5.2.8-temple-library.js` — visitor-facing Library layer.
- `scripts/v5.2.8-journey-import.js` — local Journey portability layer.
- `scripts/v5.2.8-offline-controls.js` — visitor-facing offline ownership layer.
- `scripts/v5.3-threshold.js` — manual threshold and progressive enhancement layer.
- `docs/RELEASE_VERIFICATION.md` — release verification procedure.
- `.nojekyll` — prevents Jekyll processing.
- `COPYRIGHT.md` — copyright and third-party rights notice.

## Release discipline

A production release should:

1. originate on a feature branch;
2. preserve canonical chamber/source counts;
3. pass source validators;
4. pass browser regression tests for affected behavior;
5. preserve manual entrance and no-autoplay unless explicitly amended in the roadmap;
6. preserve collectible exports and private/local state boundaries;
7. change the service-worker namespace when the shell changes;
8. merge only after the exact release head is green;
9. verify final `main`, GitHub Pages deployment, and the deployed origin;
10. distinguish emulated-browser evidence from real installed-device evidence.

## Site administration

**Site Administrator:** Alberto Ramirez  
**Contact:** christus.kalki888@gmail.com

## Copyright

Copyright © 2026 Alberto Ramirez. All rights reserved.

See `COPYRIGHT.md` for the full notice and third-party rights statement.
