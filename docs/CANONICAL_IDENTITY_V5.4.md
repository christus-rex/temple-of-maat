# Canonical Identity — Temple v5.4

Temple v5.4 establishes the user-approved uploaded SOL-OM-ON / Ma'at artwork as the single canonical visual source for the website and installed PWA.

## Authority

- `assets/branding/temple-global-logo-v5.4.webp` is the versioned canonical web artwork.
- `assets/branding/temple-global-logo.webp` is a compatibility copy of the same artwork, not a separate identity.
- Launcher, maskable, Apple-touch, and runtime-header marks are technical crops/resizes derived only from the canonical source.
- Legacy root icon filenames are retained for compatibility but their bytes are replaced by v5.4 derivatives.
- The manifest points to versioned v5.4 icon URLs so installed clients can discover the identity change.
- Service-worker cache ownership is rotated to `v5.4-canonical-identity-r1` to prevent stale v5.3.x branding from remaining authoritative.

## Non-negotiable rule

No alternate/generated emblem may silently replace this identity. Future redesigns require explicit approval.
