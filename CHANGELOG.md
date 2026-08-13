# Changelog

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
