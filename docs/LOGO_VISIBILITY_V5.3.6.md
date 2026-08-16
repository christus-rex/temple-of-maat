# Logo Visibility Hotfix v5.3.6

The v5.3.5 emblem file was present in `main`, but the PWA service worker still used the older v5.2.8 cache identity. Existing clients could therefore remain pinned to a stale shell/CSS cache while the new branding asset was not part of the strict core precache.

v5.3.6 fixes that deployment mismatch by:

- rotating the service-worker cache identity;
- precaching `assets/branding/temple-global-logo.webp` as a core asset;
- keeping the dedicated emblem as the primary image;
- layering the already-core-cached `icon-512.png` underneath as a visual fallback in both threshold and runtime header branding;
- advancing `version.json` to 5.3.6.

The goal is that a visitor never sees an empty framed seal while an old service worker is being replaced.
