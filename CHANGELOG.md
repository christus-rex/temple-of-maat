# Changelog

## v6.1.5 — Play/Pause Ritual rollback
- Reverted the Play/Pause handler introduced in commit `265445c`.
- Pause once again stops the active ritual graph and clears scheduled ambience without suspending the shared `AudioContext`.
- The next Play creates a fresh ritual graph instead of resuming a retained graph and restarting schedulers against it.
- Added a regression check and bumped the service-worker cache namespace to v6.1.5.

## v6.1.4 — Renderer crash hotfix
- Stopped the archive renderer from observing and rescheduling its own DOM changes.
- Avoided rewriting unchanged card, progress, and artifact-sheet content.
- Deferred Codex and Seal Library image construction until each panel is open, and released those grids when closed.
- Marked large portrait and seal images for lazy loading and asynchronous decoding.
- Added automated regression guards and bumped the service-worker cache namespace to v6.1.4.

## v6.1.3 — Simplified seals with human-origin motif
- Fixed the Play/Pause Ritual control so Pause suspends the entire `AudioContext` immediately instead of resuming first and only fading the bass drone.
- Clears scheduled harp, flute, and water timers while paused so they cannot accumulate in the background.
- Resume reuses the existing ritual audio graph and restarts the ambient schedulers without creating a duplicate bass drone.
- Bumped the service-worker cache namespace to v6.1.3.

## v6.1.0 — Visible Temple version
- Added a persistent `Temple v6.1.0` badge across the application.
- Tapping the badge shows the full build identifier and source package.
- Added version visibility to the Temple Entrance, Archive Console, and site-admin footer card.
- Exposed `window.TempleVersion` for debugging/support.
- Bumped the service-worker cache namespace to v6.1 so installed PWAs can distinguish the update.

## 6.0.0 — 2026-08-13

- Externalized 77 WebP artworks and 72 transparent seal PNGs from `index.html`.
- Moved compiled application JavaScript and runtime patches into `/assets/js/`.
- Moved styles into `/assets/css/`.
- Added a PWA-native Temple Entrance with continue/random/codex/seal-library controls.
- Added local last-chamber history.
- Added the 72/72 completion state and downloadable completion certificate.
- Added lazy image decoding/loading helpers.
- Added a downloadable master ZIP containing all 72 transparent seals plus manifest and copyright notice.
- Added canonical/social metadata, `robots.txt`, and `sitemap.xml`.
- Added automated PWA validation via GitHub Actions.
- Upgraded the service-worker cache namespace to v6 and preserved runtime asset caching.
