# Temple of Ma'at — GitHub Pages PWA v5.2

This folder is ready to publish from the root of a GitHub Pages repository.

## Publish / update

1. Upload **all files in this folder** to the repository root.
2. In GitHub: **Settings → Pages → Build and deployment**.
3. Choose **Deploy from a branch**, select `main`, and choose `/(root)`.
4. Enable **Enforce HTTPS** when available.
5. Open the published site once while online. The service worker will cache the app shell for later offline use.

The manifest and service worker deliberately use relative `./` URLs, so the PWA works at a GitHub Pages project URL such as:

`https://USERNAME.github.io/temple-of-maat/`

## Install

- Android / Chromium: use the in-app **Install Temple** control or the browser's Install app command.
- iPhone / iPad: open the site in Safari → Share → Add to Home Screen.
- Desktop Chromium: use the Install icon / browser menu or the in-app control when available.

## PWA files

- `index.html` — latest Temple build with hideable/minimizable Archive Console plus PWA runtime UI
- `manifest.webmanifest` — install metadata, app icons, scope, shortcuts
- `sw.js` — versioned offline cache + update lifecycle
- `offline.html` — last-resort offline screen
- `icon-192.png`, `icon-512.png` — standard app icons
- `icon-maskable-512.png` — maskable icon for adaptive launchers
- `apple-touch-icon.png` — iOS home-screen icon
- `chambers.json` — canonical chamber data
- `assets/parental/` — 72 Parental Powers masters and display renditions
- `scripts/parental-powers.js` — chamber-to-wallpaper runtime map
- `scripts/parental-powers-assets.json` — image dimensions, sizes, and integrity hashes
- `scripts/parental-powers-generation-manifest.json` — names, references, and generation provenance
- The 72 Parental Powers wallpapers are visible after the hero gallery in a horizontal, touch-friendly scrolling rail. Temple v5.2.3 mounts only nearby previews, caches wallpapers on demand, and provides a verified one-click ZIP containing all 72 high-resolution wallpapers.
- `version.json` — build identifier
- `.nojekyll` — prevents Jekyll processing on GitHub Pages
- `COPYRIGHT.md` — copyright and third-party rights notice

## Updating later

When replacing `index.html`, also change the `VERSION` value near the top of `sw.js` (for example `v4-2026-08-20`). Browsers will then recognize a new service-worker build and the Temple's update prompt can activate it.


## Site administration

**Site Administrator:** Alberto Ramirez  
**Contact:** christus.kalki888@gmail.com


## Copyright

Copyright © 2026 Alberto Ramirez. All rights reserved.

See `COPYRIGHT.md` for the full notice and third-party rights statement.
