from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {count}")
    return source.replace(old, new, 1)


index = Path("index.html")
html = index.read_text(encoding="utf-8")

metadata = """<title>Temple of Ma'at — 72 Chamber Archive</title>
  <meta name="description" content="Enter the Temple of Ma'at, an interactive 72-chamber archive of symbolic correspondences, Egypto-Solomonic seals, chamber laws, collectibles, and ritual soundscape.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="https://christus-rex.github.io/temple-of-maat/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Temple of Ma'at">
  <meta property="og:title" content="Temple of Ma'at — 72 Chamber Archive">
  <meta property="og:description" content="An interactive 72-chamber Temple of Ma'at archive with symbolic correspondences, seals, collectibles, chamber laws, and ritual soundscape.">
  <meta property="og:url" content="https://christus-rex.github.io/temple-of-maat/">
  <meta property="og:image" content="https://christus-rex.github.io/temple-of-maat/icon-512.png">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:image:alt" content="Temple of Ma'at emblem">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Temple of Ma'at — 72 Chamber Archive">
  <meta name="twitter:description" content="Explore the interactive 72-chamber Temple of Ma'at archive.">
  <meta name="twitter:image" content="https://christus-rex.github.io/temple-of-maat/icon-512.png">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Temple of Ma'at — 72 Chamber Archive","url":"https://christus-rex.github.io/temple-of-maat/","applicationCategory":"EducationalApplication","operatingSystem":"Any","description":"An interactive 72-chamber archive of symbolic correspondences, Egypto-Solomonic seals, chamber laws, collectibles, and ritual soundscape."}</script>"""
html = replace_once(html, '<title>React Artifact</title>', metadata, 'metadata')

enhancement_assets = """<link rel="stylesheet" href="./styles/v5.3-threshold.css">
<script defer src="./scripts/v5.3-threshold.js"></script>

</head>"""
html = replace_once(html, '</head>', enhancement_assets, 'enhancement assets')

static_entry = """<a class="temple-skip-link" href="#root">Skip to the interactive Temple</a>
  <main id="temple-static-entry" aria-labelledby="temple-static-title">
    <section class="temple-static-entry__panel">
      <p class="temple-static-entry__eyebrow">The Living Archive · 72 Chambers</p>
      <h1 id="temple-static-title">Temple of Ma'at</h1>
      <p class="temple-static-entry__lead">An interactive symbolic archive of chamber laws, angelic and daemonic correspondences, Egypto-Solomonic seals, parental powers, collectibles, and ritual soundscape.</p>
      <nav class="temple-static-entry__actions" aria-label="Temple entry options">
        <a class="temple-static-entry__action" data-temple-entry="guided" href="#chamber-01">Begin at Chamber 01</a>
        <a class="temple-static-entry__action temple-static-entry__action--secondary" data-temple-entry="explore" href="#root">Explore the 72 Chambers</a>
      </nav>
      <p class="temple-static-entry__status" role="status" aria-live="polite">Opening the interactive Temple…</p>
    </section>
  </main>
  <div id="root"></div>
  <noscript>
    <section aria-label="JavaScript notice" style="padding:1rem;background:#071019;color:#fff;text-align:center">The interactive archive requires JavaScript. The Temple overview above remains available as a static entrance.</section>
  </noscript>"""
html = replace_once(html, '<div id="root"></div>', static_entry, 'static entrance')
index.write_text(html, encoding="utf-8")

validator = Path("scripts/validate-v5.mjs")
text = validator.read_text(encoding="utf-8")
text = replace_once(
    text,
    "if (!/temple-maat-pwa-v5\\.[12]/.test(serviceWorker)) fail('Service worker cache namespace is not v5.1 or v5.2');",
    "if (!/temple-maat-pwa-v5\\.[123]/.test(serviceWorker)) fail('Service worker cache namespace is not v5.1, v5.2, or v5.3');",
    "validator cache namespace",
)
text = replace_once(
    text,
    "if (!serviceWorker.includes(\"fetch('./scripts/v5.1-asset-manifest.json'\")) fail('Service worker does not load the v5.1 display-asset manifest for offline caching');",
    "if (!serviceWorker.includes(\"'./scripts/v5.1-asset-manifest.json'\")) fail('Service worker does not load the v5.1 display-asset manifest for offline caching');",
    "validator manifest loader",
)
validator.write_text(text, encoding="utf-8")

print("v5.3 review patch applied")
