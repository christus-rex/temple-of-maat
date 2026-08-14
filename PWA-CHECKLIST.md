# Temple of Ma'at — PWA Verification Matrix

_Last revised: 2026-08-14_

This file distinguishes **automated release guarantees** from checks that still require a real installed-device or deployed-origin verification. A checked item should have a known verification path; do not mark items complete merely because the code appears to support them.

## Automated / repository-verified

- [x] `manifest.webmanifest` is present and uses GitHub Pages-safe relative start URL/scope.
- [x] `sw.js` is present and uses a versioned Temple v5 cache namespace.
- [x] Canonical chamber data contains 72 stable chamber records.
- [x] Manual threshold remains locked until explicit visitor entry.
- [x] Deep-link chamber navigation remains behind the manual threshold.
- [x] Journey/chamber state persists across reload in browser smoke coverage.
- [x] Favorites and reflections persistence is protected by the Living Temple release tests.
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
- [x] Archive Console hide/minimize behavior remains part of the public application contract.
- [x] `COPYRIGHT.md` is present in the repository.
- [x] Site administrator and contact information are documented in the repository.

## Deployed-origin checks

Run these after every production promotion when the release affects the shell, service worker, manifest, or routing.

- [ ] GitHub Pages URL loads over HTTPS on the exact release SHA.
- [ ] `manifest.webmanifest` returns successfully from the deployed origin.
- [ ] `sw.js` registers without browser-console errors.
- [ ] A deep link such as `#chamber-01` pauses at the threshold, then opens the intended chamber after explicit entry.
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

These require an actual installable browser/device environment and should not be claimed solely from source inspection.

- [ ] Install control appears when the app is eligible and not already installed.
- [ ] Android/Chromium installation completes.
- [ ] iOS/iPadOS Add to Home Screen launches the Temple correctly.
- [ ] Desktop Chromium installation completes.
- [ ] Installed app launches in standalone mode.
- [ ] **Download Temple for Offline Use** completes on an installed build with representative chamber, seal, and Parental Powers visuals available offline.
- [ ] Open online once, switch device offline, and reload successfully.
- [ ] Offline reload opens the cached Temple or the offline fallback as intended.
- [ ] Chamber/Journey state remains after closing and reopening the installed PWA.
- [ ] Device-local Ma'at ritual media remains available after closing/reopening, when installed by the visitor.
- [ ] A service-worker namespace bump presents the expected update lifecycle to an older installed build.
- [ ] Updating the installed PWA does not bypass the manual entrance covenant.

## Mobile accessibility checks

- [ ] Common phone widths keep hero faces / central subjects visible.
- [ ] Primary controls maintain usable touch targets.
- [ ] Codex, Journey, Dossier, Collect, Chant, Library, and Offline overlays remain closable without horizontal overflow.
- [ ] Keyboard focus is visible on supported desktop browsers.
- [ ] Reduced-motion preference suppresses nonessential ceremonial animation.
- [ ] Forced-colors/high-contrast mode retains understandable controls.

## Release rule

A source-level check can prevent regressions, but it is not a substitute for installed-device testing. If a release changes only documentation, the automated gate may be sufficient; if it changes the PWA shell or interaction behavior, run the applicable deployed-origin and device checks before declaring those behaviors re-verified.
