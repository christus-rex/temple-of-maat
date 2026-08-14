from pathlib import Path

path = Path('scripts/smoke-v5.2.5.mjs')
source = path.read_text(encoding='utf-8')
old = """  await context.addInitScript(() => {\n    localStorage.removeItem('temple_v525_pilgrim_journey');\n    localStorage.removeItem('temple_last_chamber');\n  });"""
new = """  await context.addInitScript(() => {\n    if (sessionStorage.getItem('tm525-smoke-initialized')) return;\n    localStorage.removeItem('temple_v525_pilgrim_journey');\n    localStorage.removeItem('temple_last_chamber');\n    sessionStorage.setItem('tm525-smoke-initialized', '1');\n  });"""
if source.count(old) != 1:
    raise SystemExit(f'Expected one initial-state block, found {source.count(old)}')
source = source.replace(old, new, 1)
source = source.replace("  // Keep IndexedDB across reload while no longer clearing journey state in init script.\n  await context.addInitScript(() => {});\n", "  // Keep IndexedDB and localStorage across reload; sessionStorage prevents the first-load reset from running twice.\n", 1)
path.write_text(source, encoding='utf-8')
