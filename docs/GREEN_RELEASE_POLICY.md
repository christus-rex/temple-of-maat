# Temple Green Release Policy

A Temple revision is **green** only when the same `main` commit has passed the complete publication chain below. A successful source build by itself is not a green release.

## Required gates

1. **Source CI** — syntax, current-release invariants, Signature Book/mobile hardening, performance/accessibility quality budgets, and the v5 structural contract all pass.
2. **GitHub Pages** — Pages reports the exact same commit as built/deployed.
3. **Deployed-origin verification** — the live Temple is opened from the public Pages origin after exact-SHA deployment and passes responsive browser verification at 320, 360, 412, 430, 768, and desktop widths.
4. **Runtime/PWA identity** — the live portal reports the expected `version.json` release/build and is controlled by the Temple service worker.
5. **Visual/runtime integrity** — Visitor Signature Book containment, chamber and overlay geometry, image loading, console/page errors, threshold behavior, and deployed chant transport pass; screenshot evidence is preserved as a workflow artifact.

## Canonical health state

Machine-readable health is stored on the dedicated `temple-status` branch in `temple-health.json`. This keeps status writes away from the deployable `main` branch while giving connector clients one stable health record.

`green_release` is true only when:

- `ci.status == "success"`
- `pages.status` is `"built"` or `"success"`
- `deployed_visual.status == "success"`
- `ci.commit == pages.commit == deployed_visual.commit`

The matching commit is also written to `green_release_commit`.

## Connector-readable beacons

- Issue **#67** — source CI beacon
- Issue **#68** — GitHub Pages beacon
- Issue **#71** — deployed-origin verification beacon

These human-readable beacons mirror the machine state and remain available even when workflow-run enumeration is incomplete.

## Release rule

Do not describe a revision as fully deployed, verified, or green until all three commit-bearing gates—CI, Pages, and deployed-origin verification—refer to the same SHA. Pending, stale, skipped, or mismatched states are not green.
