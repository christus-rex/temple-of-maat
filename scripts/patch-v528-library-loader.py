#!/usr/bin/env python3
from pathlib import Path

path = Path('scripts/v5.3-threshold.js')
text = path.read_text(encoding='utf-8')
marker = "    loadEnhancement('./scripts/v5.2.5-media-vault.js', 'media-vault');\n"
addition = "    loadEnhancement('./scripts/v5.2.8-temple-library.js', 'temple-library');\n"
if addition not in text:
    if marker not in text:
        raise SystemExit('Expected threshold enhancement marker not found')
    text = text.replace(marker, marker + addition, 1)
    path.write_text(text, encoding='utf-8')
