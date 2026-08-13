# Temple of Ma’at v6.1.3 — Debug Report

Build: `2026-08-13-pwa-v6.1.3-seal-download-debug`

## Fixed

1. **Archive Console — Download 72 Seals**
   - v6 modularized seals into external PNG files.
   - The older ZIP builder still required embedded `data:` URLs.
   - It now accepts both external same-origin assets and legacy data URLs.

2. **Individual seal download consistency**
   - The download action now uses the exact canonical PNG shown in the Seal Library whenever available.
   - Canvas rendering remains only as a fallback.

3. **Human-origin seal assets**
   - 72/72 PNGs verified at 2048×2048 RGBA with transparency.
   - Every `chambers.json` seal path matches the runtime asset map.

## Validation

- JavaScript syntax: PASS
- JSON parse: PASS
- `chambers.json`: 72 chambers, no missing hero/seal paths
- Hero assets: 72/72 present
- Seal assets: 72/72 present
- Master seal ZIP: 72 PNG seals + manifest + copyright; ZIP CRC PASS
- Local HTTP asset test: 159/159 requested core/hero/seal/download paths returned HTTP 200
- Ritual audio pause fix carried forward: app bundle still suspends the `AudioContext` on Pause and resumes the same graph without duplicating the bass drone

## Environment limitation

A full Playwright/Chromium navigation test could not be performed in this execution environment because local browser navigation is blocked by administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). Static/runtime-path validation and local HTTP asset verification were completed instead.
