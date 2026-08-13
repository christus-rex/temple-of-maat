# Temple of Ma'at — GitHub Pages PWA v6.1

Published target: `https://christus-rex.github.io/temple-of-maat/`

## Architecture

The v6 build removes all embedded base64 artwork from `index.html`. The 72 chamber portraits and 72 seals are now real cacheable files under `assets/heroes/` and `assets/seals/`. Application/runtime code and CSS are split into `assets/js/` and `assets/css/`.

### Key additions

- PWA-native Temple Entrance
- Continue Last Chamber / Random Chamber
- 72/72 completion state and PNG completion certificate
- modular hero/seal asset library
- complete 72-seal ZIP download (`downloads/Temple-of-Maat-72-Egypto-Solomonic-Seals.zip`)
- service-worker v6 offline/runtime caching
- search/social metadata and sitemap
- GitHub Actions validation

## Site administration

**Site Administrator:** Alberto Ramirez  
**Contact:** christus.kalki888@gmail.com

## Copyright

Copyright © 2026 Alberto Ramirez. All rights reserved. See `COPYRIGHT.md`.

## GitHub Pages

Publish from `main` → `/(root)` with HTTPS enabled. The manifest and service worker use relative paths and remain compatible with the project path `/temple-of-maat/`.


## Visible version identity
The running app displays `Temple v6.1.0` in a persistent badge. Tap it to inspect the build identifier and source. The same version is also shown in the Temple Entrance, Archive Console, and site-admin footer.
