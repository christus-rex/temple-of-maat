#!/usr/bin/env python3
from pathlib import Path

path = Path('scripts/v5.3-threshold.js')
text = path.read_text(encoding='utf-8')
marker = "      style.textContent = `\n        /* The chamber artifact already contains its own Collect and download controls.\n"
if marker not in text:
    raise SystemExit('Artifact interaction guard marker not found')
rule = "      style.textContent = `\n        /* Manual threshold covenant: runtime chamber artifacts may mount from a URL hash,\n           but they must never be visible or intercept the explicit entrance gesture. */\n        body:not(.temple-app-ready) .tm2-artifact-backdrop {\n          visibility: hidden !important;\n          pointer-events: none !important;\n        }\n\n        /* The chamber artifact already contains its own Collect and download controls.\n"
if 'body:not(.temple-app-ready) .tm2-artifact-backdrop' not in text:
    text = text.replace(marker, rule, 1)
    path.write_text(text, encoding='utf-8')
