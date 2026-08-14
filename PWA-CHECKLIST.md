# Temple of Ma'at — PWA Verification Matrix

_Last revised: 2026-08-14 · v5.2.8 release candidate_

This file distinguishes **automated release guarantees** from checks that still require a deployed origin or a real installed device. A checked item must have a known verification path; do not mark an item complete merely because source code appears to support it.

Repeatable procedures and failure-evidence rules live in `docs/RELEASE_VERIFICATION.md`.

## Automated / repository-verified

- [x] `manifest.webmanifest` is present and uses GitHub Pages-safe relative start URL/scope.
- [x] `sw.js` uses the v5.2.8 versioned cache namespace.
- [x] Canonical chamber data contains 72 stable chamber records.
- [x] Manual threshold remains locked until explicit visitor entry.
- [x] Deep-link chamber navigation remains behind the manual threshold.
- [x] Simulated prior v5.2.7 service-worker control can upgrade to the v5.2.8 worker/cache namespace.
- [x] The v5.2.7 → v5.2.8 service-worker update/reload does not bypass manual entry.
- [x] `#chamber-42` remains hidden behind the threshold and opens Chamber 42 only after explicit Continue.
- [x] Journey/chamber state persists across reload in browser smoke coverage.
- [x] Favorites and reflections persistence is protected by the Living Temple release tests.
- [x] Portable Journey import rejects incompatible archives without mutation and restores supported state exactly with Replace.
- [x] Safe Journey Merge preserves an existing conflicting local reflection.
- [x] Temple Library search/reading and private personal-state boundaries have browser coverage.
- [x] Seal PNG collectible path is preserved.
- [x] Plate PNG collectible path is preserved.
- [x] Chamber wallpaper export remains 1440×2560.
- [x] Parental Powers wallpaper export remains 3840×2160.
- [x] Ritual media does not autoplay.
- [x] Play / Pause / Stop ritual controls are preserved.
- [x] Device-local Ma'at media integrity metadata is retained.
- [x] Binary ritual media bypasses service-worker Cache Storage; only integrity metadata is part of the shell cache.
- [x] Visitor-facing **Offline** controls expose full optional visual download, progress/status, cancellation, browser storage estimates, and visual-only cleanup.
- [x] Full optional visual caching covers 72 chamber hero displays, 72 seal displays, and 72 Parental Powers displays.
- [x] Service-worker-controlled browser smoke proves representative chamber, seal, and Parental Powers assets can be fetched after the browser is switched offline.
- [x] Optional visual-cache cleanup leaves the app shell cached and preserves Pilgrim Journey favorites/reflections.
- [x] Offline shell reload remains behind the manual threshold after optional visual cleanup.
- [x] 320 px, 360 px, and 412 px Chromium mobile regression profiles are covered by the v5.2.8 hardening workflow.
- [x] Hardening checks reject horizontal document overflow and require chamber-artifact/image geometry to remain inside those phone viewports.
- [x] Library, Journey, and Offline panels are checked for narrow-phone horizontal usability.
- [x] Hardening screenshots are preserved by CI even when the hardening job fails.
- [x] A successful `pages build and deployment` run on `main` automatically triggers the exact-SHA `Verify Deployed Temple v5.2.8` workflow.
- [x] The deployed verifier checks out `workflow_run.head_sha` rather than a later moving `main` ref.
- [x] Archive Console hide/minimize behavior remains part of the public application contract.
- [x] `COPYRIGHT.md` is present in the repository.
- [x] Site administrator and contact information are documented in the repository.

## Deployed-origin checks

Run these after every production promotion when the release affects the shell, service worker, manifest, routing, or critical interaction behavior. For v5.2.8, a successful GitHub Pages deployment automatically launches **Verify Deployed Temple v5.2.8** against the exact deployed SHA; `workflow_dispatch` remains available as a manual fallback/re-check path.

- [ ] GitHub Pages URL loads over HTTPS on the exact v5.2.8 release SHA.
- [ ] `version.json` on production reports `5.2.8 / 2026-08-14-v5.2.8-library-journey-offline-hardening`.
- [ ] `manifest.webmanifest` returns successfully from the deployed origin.
- [ ] `sw.js` controls the deployed production page without browser-console errors.
- [ ] `#chamber-42` pauses at the threshold, then opens Chamber 42 after explicit Continue.
- [ ] 360 px and 412 px deployed-origin mobile runs have no horizontal chamber/overlay overflow.
- [ ] Library, Journey, and Offline overlays open and close on the deployed mobile-origin verification route.
- [ ] **Offline** panel opens after explicit Temple entry and reports storage/cache status from the deployed service worker.
- [ ] Full optional visual download completes or reports a clear recoverable failure without breaking the normal shell.
- [ ] Clearing optional offline visuals does not erase Journey state or reflections.
- [ ] Seal PNG download works from the deployed origin.
- [ ] Plate PNG download works from the deployed origin.
- [ ] 1440×2560 chamber wallpaper download works from the deployed origin.
- [ ] 3840×2160 Parental Powers wallpaper download works from the deployed origin.
- [ ] Archive Console minimize / hide / restore works on the deployed build.
- [ ] Footer displays **Site Administrator: Alberto Ramirez** and clickable **christus.kalki888@gmail.com**.
- [ ] Footer displays © 2026 Alberto Ramirez. All rights reserved.

## Installed-PWA checks

These require an actual installable browser/device environment and must not be claimed solely from source inspection or Chromium viewport emulation.

- [ ] Install control appears when the app is eligible and not already installed.
- [ ] Android/Chromium installation completes on a physical Android device.
- [ ] iOS/iPadOS Add to Home Screen launches the Temple correctly on a physical Apple device.
- [ ] Desktop Chromium installation completes as an installed app.
- [ ] Installed app launches in standalone mode.
- [ ] **Download Temple for Offline Use** completes on an installed build with representative chamber, seal, and Parental Powers visuals available offline.
- [ ] Open online once, switch the physical device offline, and reload successfully.
- [ ] Offline reload opens the cached Temple or offline fallback as intended.
- [ ] Chamber/Journey state remains after closing and reopening the installed PWA.
- [ ] Device-local Ma'at ritual media remains available after closing/reopening, when installed by the visitor.
- [ ] An older installed v5.2.7 build visibly/update-correctly moves to v5.2.8.
- [ ] Updating a real installed PWA does not bypass the manual entrance covenant.

## Mobile accessibility checks

Automated Chromium geometry is evidence for layout regressions, not a substitute for physical-device inspection.

- [x] Representative 320/360/412 px automated widths keep the tested chamber artifact and loaded Parental Powers visual inside the viewport.
- [x] Library, Journey, and Offline overlays have automated narrow-phone no-horizontal-overflow coverage.
- [ ] Physical Android phone keeps hero faces / central subjects visibly centered in representative chambers.
- [ ] Physical iPhone/iPad keeps hero faces / central subjects visibly centered in representative chambers.
- [ ] Primary controls maintain comfortable real-device touch targets.
- [ ] Codex, Journey, Dossier, Collect, Chant, Library, and Offline overlays remain closable on physical mobile devices without trapped controls.
- [ ] Keyboard focus is visibly usable on supported desktop browsers.
- [ ] Reduced-motion preference suppresses nonessential ceremonial animation in a real browser setting.
- [ ] Forced-colors/high-contrast mode retains understandable controls.

## Release rule

A source-level or emulated-browser check can prevent regressions, but it is not a substitute for installed-device testing. For v5.2.8, merge only after the exact PR head passes every applicable automated workflow; then require `main` validation, GitHub Pages build/deploy/report, and the exact-SHA deployed-origin verifier before declaring the production release published. Physical-device items that were not actually performed remain unchecked.
