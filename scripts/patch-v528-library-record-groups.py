#!/usr/bin/env python3
from pathlib import Path

path = Path('scripts/v5.2.8-temple-library.js')
text = path.read_text(encoding='utf-8')
old = "  function publicRecords(data) {\n    return TYPES.flatMap((type) => Array.isArray(data?.[`${type}s`]) ? data[`${type}s`] : []);\n  }\n"
new = "  function publicRecords(data) {\n    const groups = {\n      tradition: 'traditions',\n      source: 'sources',\n      study: 'studies',\n      discernment: 'discernments',\n      correspondence: 'correspondences'\n    };\n    return TYPES.flatMap((type) => Array.isArray(data?.[groups[type]]) ? data[groups[type]] : []);\n  }\n"
if old not in text:
    raise SystemExit('Expected publicRecords implementation not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
