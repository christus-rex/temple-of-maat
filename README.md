# Temple of Ma'at — GitHub Pages PWA v5.2.7

**Release theme:** Stewardship & Governance  
**Production lineage:** v5.2.3 Manual Entrance → v5.2.4 Living Codex → v5.2.5 Living Temple → v5.2.6 Shem Dossiers → v5.2.7 Stewardship & Governance

Temple of Ma'at is a 72-chamber GitHub Pages PWA combining a ritual archive, source-preserved Shem HaMephorash layers, chamber dossiers, collectible visual artifacts, a visitor-controlled Pilgrim Journey, and an expanding research architecture.

The project deliberately separates historical/source material, scholarly or computational analysis, comparative interpretation, and Temple/personal symbolism. See `GOVERNANCE.md` for the canonical provenance and interpretation rules.

## Planning and governance

- `ROADMAP.md` — authoritative **Now / Next / Later / Research** plan.
- `GOVERNANCE.md` — provenance, interpretation, release, privacy, accessibility, and ritual-media covenant.
- `PWA-CHECKLIST.md` — verified, pending, and manual deployment checks.
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
- 72-node Pilgrim Journey.
- Visited/current state, favorites, reflections, and Journey export.
- Persistent local state across reloads.
- User-governed ritual media with no autoplay.
- SHA-verified device-local Ma'at ritual media support.
- Progressive PWA/offline support.
- Hideable/minimizable Archive Console.
- Responsive mobile and accessibility refinements.

## Next architectural release

The next feature release after stewardship is planned as **v5.2.8 — Temple Library**.

The Library will use the hierarchy:

`Library → Tradition → Source → Study → Discernment → Correspondences`

It is intended to host research collections without forcing historically distinct traditions into chamber identities. See `ROADMAP.md` for scope and release gates.

## Publish / update

1. Merge a green release pull request into `main`.
2. In GitHub: **Settings → Pages → Build and deployment**.
3. Use **Deploy from a branch**, `main`, `/(root)`.
4. Keep **Enforce HTTPS** enabled when available.
5. Verify the exact release SHA passes the repository validator and the Pages deployment succeeds.
6. Open the published site once while online so the service worker can install/update the current app shell.

The PWA uses relative `./` URLs so it remains compatible with a GitHub Pages project URL such as:

`https://USERNAME.github.io/temple-of-maat/`

## Install

- **Android / Chromium:** use the in-app **Install Temple** control or the browser Install app command.
- **iPhone / iPad:** Safari → Share → Add to Home Screen.
- **Desktop Chromium:** use the Install icon/browser menu or the in-app control when available.

## Core PWA and archive files

- `index.html` — main Temple application.
- `shem-hamephorash-72.html` — source-preserved Shem catalogue surface.
- `manifest.webmanifest` — install metadata, icons, scope, shortcuts.
- `sw.js` — versioned app-shell/runtime cache and update lifecycle.
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
- `scripts/v5.3-threshold.js` — manual threshold and progressive enhancement layer.
- `.nojekyll` — prevents Jekyll processing.
- `COPYRIGHT.md` — copyright and third-party rights notice.

## Release discipline

A production release should:

1. originate on a feature branch;
2. preserve canonical chamber/source counts;
3. pass source validators;
4. pass browser regression tests for affected behavior;
5. preserve manual entrance and no-autoplay unless explicitly amended in the roadmap;
6. preserve collectible exports;
7. merge only after the exact release head is green;
8. verify final `main` and GitHub Pages deployment.

When the application shell changes, bump the service-worker cache namespace so installed PWAs can recognize the new build.

## Site administration

**Site Administrator:** Alberto Ramirez  
**Contact:** christus.kalki888@gmail.com

## Copyright

Copyright © 2026 Alberto Ramirez. All rights reserved.

See `COPYRIGHT.md` for the full notice and third-party rights statement.
