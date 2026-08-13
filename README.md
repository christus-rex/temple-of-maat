# Temple of Ma'at — GitHub Pages PWA v6.1.5

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
The running app displays `Temple v6.1.5` in a persistent badge. Tap it to inspect the build identifier and source. The same version is also shown in the Temple Entrance, Archive Console, and site-admin footer.


## Ritual audio control rollback (v6.1.5)

Play/Pause Ritual once again stops the current ritual graph and scheduled ambience on Pause, then creates a fresh graph on the next Play. The control no longer suspends and resumes the shared `AudioContext`.


## Renderer crash hotfix (v6.1.4)

Runtime rendering now ignores its own DOM updates, avoids rewriting unchanged card text, and builds the Codex and Seal Library only while those panels are open. Large seal images are marked for lazy asynchronous decoding before their sources are assigned.
