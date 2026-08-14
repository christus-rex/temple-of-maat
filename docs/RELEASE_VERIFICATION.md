# Temple of Ma'at — Release Verification Runbook

_Last revised: 2026-08-14 · release candidate v5.2.8_

This runbook is the operational companion to `PWA-CHECKLIST.md`. It separates what CI can prove from what must be checked on the deployed origin or on a real installed device. A release is not considered verified merely because source code appears correct.

## 1. Release-candidate gate

Run on the exact pull-request head before merge.

Required automated workflows:

- `Validate Temple v5`
- `Smoke Temple v5.2.4`
- `Smoke Temple v5.2.5`
- `Smoke Temple Library v5.2.8`
- `Smoke Journey import v5.2.8`
- `Smoke Offline ownership v5.2.8`
- `Verify wallpaper downloads`
- `Smoke Release hardening v5.2.8`

The hardening smoke adds the checks not covered by the inherited suites:

- a simulated prior v5.2.7 service worker controls the origin first;
- that registration updates to the v5.2.8 namespace;
- the old cache namespace is retired;
- the update/reload does not set `temple-app-ready` or remove `inert` before an explicit entry gesture;
- a `#chamber-42` deep link remains behind the threshold and then opens Chamber 42 only after explicit Continue;
- 320 px, 360 px, and 412 px phone viewports have no horizontal document overflow;
- chamber-artifact imagery remains inside the viewport and loaded;
- Library, Journey, and Offline overlays remain horizontally usable/closable on narrow phones;
- screenshot evidence is written to `work/release-hardening/` and uploaded by CI.

Do not merge if any required workflow is red. Preserve the first failing logs/screenshots before making a corrective commit.

## 2. Post-merge deployed-origin gate

After the exact release candidate is merged to `main`:

1. Wait for `Validate Temple v5` on `main` to succeed.
2. Wait for GitHub Pages **build**, **deploy**, and **report-build-status** to succeed for the same `main` SHA.
3. A successful `pages build and deployment` run on `main` automatically triggers `Verify Deployed Temple v5.2.8`.
4. The verifier checks out the exact `workflow_run.head_sha` that Pages deployed, so later changes to `main` cannot change the verifier code used to judge that deployment.
5. Keep the deployed-origin screenshot artifact with the release evidence.
6. `workflow_dispatch` remains available as an explicit fallback or re-check path.

Default production origin:

`https://christus-rex.github.io/temple-of-maat/`

The deployed verifier checks:

- `version.json` reports the expected release version/build;
- the production service worker controls the page;
- the manual threshold is held on a normal load;
- a Chamber 42 deep link is not exposed before entry;
- explicit Continue opens Chamber 42;
- representative 360 px and 412 px mobile captures have no horizontal overflow;
- Library, Journey, and Offline overlays can open and close after entry;
- no page-level JavaScript errors occur during the verification journey.

A failed deployed-origin check is a release failure even if the pull-request CI was green. Record the run URL, failing assertion, console/page error, and screenshot artifact before changing production code.

## 3. Android / Chromium installed-PWA check

Use a current Android Chromium browser on a physical phone when available.

1. Open the deployed origin over HTTPS.
2. Confirm the static/manual threshold appears before the interactive Temple.
3. Install from the in-app/browser install surface.
4. Close the browser tab and launch the installed Temple from the home screen/app launcher.
5. Confirm standalone display and manual threshold.
6. Navigate to a chamber and save a Journey favorite plus a short reflection.
7. Open **Offline** → **Download Temple for Offline Use** and let the visual archive complete.
8. Enable airplane mode or otherwise remove network access.
9. Relaunch the installed Temple.
10. Confirm the threshold still appears, then explicitly enter.
11. Confirm the saved Journey favorite/reflection remains.
12. Confirm a chamber hero/display, its seal, and its Parental Powers visual load offline.
13. Confirm Seal PNG, Plate PNG, 1440×2560 chamber wallpaper, and 3840×2160 Parental Powers wallpaper controls remain reachable.
14. Open and close Library, Journey, Codex, Dossier, Collect, Chant, and Offline surfaces; verify no control is trapped beneath a viewport edge.
15. Install the canonical Ma'at ritual media only by explicit local selection; confirm it remains paused after installation/relaunch and Play/Pause/Stop remain explicit.
16. Use **Clear Optional Offline Visuals** and confirm Journey/reflection data remains.

Record device model, Android version, browser version, installed/display result, and any screenshot needed to explain a failure.

## 4. iPhone / iPad — Safari Add to Home Screen

Safari/iOS cannot be faithfully represented by Chromium emulation. Treat this as a real-device gate when iOS/iPadOS is available.

1. Open the deployed origin in Safari.
2. Share → **Add to Home Screen**.
3. Launch from the home-screen icon.
4. Confirm the manual threshold; mounting the app must not count as entry.
5. Test a chamber deep link by opening the deployed URL with `#chamber-42`, then launching/returning to the installed app as the OS permits. Confirm Chamber 42 is not exposed until explicit entry.
6. Enter and inspect chamber imagery at portrait width; the principal subject/face should remain visibly centered rather than being cropped beyond the mobile frame.
7. Open Library, Journey, Codex, Dossier, Collect, Chant, and Offline surfaces and verify they can be closed without horizontal scrolling.
8. Save Journey state, fully close the home-screen app, reopen it, and confirm persistence.
9. Exercise Offline download while online, then remove network access and relaunch.
10. Confirm no ritual audio starts automatically.

Record iPhone/iPad model, iOS/iPadOS version, Safari version where exposed, and evidence for any failure.

## 5. Desktop Chromium installed-PWA check

1. Open production in Chrome/Edge/Chromium.
2. Install the Temple.
3. Launch the installed window and confirm standalone display plus manual threshold.
4. Test `#chamber-42` deep link → threshold → explicit Continue → Chamber 42.
5. Confirm Archive Console minimize/hide/restore.
6. Confirm Journey persistence across close/relaunch.
7. Confirm Offline full visual download and an offline reload.
8. Confirm collectible downloads and ritual-media controls.
9. If upgrading an older installed build, accept/activate the update and verify the next load still stops at the threshold.

## 6. Failure-evidence rule

Before fixing a release failure, preserve enough evidence to reconstruct it:

- exact commit SHA;
- workflow/run/job URL or physical-device details;
- failing assertion or visible symptom;
- viewport/device/browser;
- relevant console/page errors;
- screenshot(s) or downloaded artifact metadata when applicable.

CI hardening screenshots are intentionally uploaded even on failure (`if: always()`). Do not replace a failing assertion with a weaker assertion merely to turn CI green; first determine whether the failure is a product regression or a harness race.

## 7. Release promotion

Promote only when:

1. the exact PR head is green across every applicable automated gate;
2. the PR is no longer draft;
3. the release version and service-worker namespace agree;
4. the merge uses the verified head SHA;
5. `main` validation succeeds after merge;
6. GitHub Pages build/deploy/report succeeds for the merge SHA;
7. the automatically triggered exact-SHA deployed-origin verification run succeeds (or the manual fallback is deliberately run and succeeds);
8. real-device checks are recorded when a suitable device is available, and any unperformed device checks remain visibly unchecked rather than being inferred from emulation.

The v5.2.8 release must preserve the governance covenant: manual entry, no autoplay, private local study state, provenance boundaries, canonical chamber counts, and verified collectible dimensions.
