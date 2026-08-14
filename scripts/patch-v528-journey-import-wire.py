#!/usr/bin/env python3
from pathlib import Path

# Wire Journey importer into the progressive enhancement loader.
threshold_path = Path('scripts/v5.3-threshold.js')
threshold = threshold_path.read_text(encoding='utf-8')
loader = "    loadEnhancement('./scripts/v5.2.8-journey-import.js', 'journey-import');\n"
marker = "    loadEnhancement('./scripts/v5.2.8-temple-library.js', 'temple-library');\n"
if loader not in threshold:
    if marker not in threshold:
        raise SystemExit('Temple Library loader marker not found')
    threshold = threshold.replace(marker, marker + loader, 1)
    threshold_path.write_text(threshold, encoding='utf-8')

# Remove stale chamber hash before writing/restoring state, so the old in-memory
# Journey hash handler cannot refresh imported timestamps during reload.
import_path = Path('scripts/v5.2.8-journey-import.js')
source = import_path.read_text(encoding='utf-8')
old = """      const next = normalizePayload(plan.result);\n      localStorage.setItem(STATE_KEY, JSON.stringify(next));\n      localStorage.setItem(LAST_CHAMBER_KEY, String(next.current));\n      sessionStorage.setItem(RESULT_KEY, JSON.stringify({ strategy: plan.strategy, chamber: next.current, restoredAt: new Date().toISOString() }));\n      // replaceState updates the URL without firing the old Journey hash handler, so\n      // the imported state cannot be overwritten by the pre-reload in-memory state.\n      history.replaceState(null, '', `${location.pathname}${location.search}#chamber-${String(next.current).padStart(2, '0')}`);\n      location.reload();\n"""
new = """      const next = normalizePayload(plan.result);\n      // Remove any stale chamber hash without firing hashchange before writing the\n      // imported archive. The next manual entrance will use temple_last_chamber.\n      history.replaceState(null, '', `${location.pathname}${location.search}`);\n      localStorage.setItem(STATE_KEY, JSON.stringify(next));\n      localStorage.setItem(LAST_CHAMBER_KEY, String(next.current));\n      sessionStorage.setItem(RESULT_KEY, JSON.stringify({ strategy: plan.strategy, chamber: next.current, restoredAt: new Date().toISOString() }));\n      location.reload();\n"""
if old in source:
    source = source.replace(old, new, 1)
elif "history.replaceState(null, '', `${location.pathname}${location.search}`);" not in source:
    raise SystemExit('Journey applyPlan restore block not found')
import_path.write_text(source, encoding='utf-8')

# Add static Journey portability validation to the canonical validator chain.
workflow_path = Path('.github/workflows/validate-v5.yml')
workflow = workflow_path.read_text(encoding='utf-8')
validation = '      - run: node scripts/validate-journey-import-v1.mjs\n'
if validation not in workflow:
    marker = '      - run: node scripts/validate-library-ui.mjs\n'
    if marker not in workflow:
        raise SystemExit('Library UI validator marker not found')
    workflow = workflow.replace(marker, marker + validation, 1)
    workflow_path.write_text(workflow, encoding='utf-8')
