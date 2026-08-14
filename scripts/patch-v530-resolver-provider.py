#!/usr/bin/env python3
from pathlib import Path

path = Path('scripts/v5.3.0-relationship-resolver.mjs')
source = path.read_text(encoding='utf-8')

old = """  for (const [namespace, provider] of Object.entries(options.providers || {})) registerProvider(namespace, provider);\n\n  function registerProvider(namespace, provider) {\n"""
new = """  function registerProvider(namespace, provider) {\n"""
if old not in source:
    raise SystemExit('Initial provider registration block not found')
source = source.replace(old, new, 1)

old = """  const api = Object.freeze({\n"""
if old not in source:
    raise SystemExit('API construction marker not found')
# Keep api const semantics; initial providers are installed after construction.

old_return = """  });\n\n  return api;\n}\n"""
new_return = """  });\n\n  // Construction-time providers must be installed after `api` exists because\n  // registerProvider intentionally returns the API for fluent late registration.\n  for (const [namespace, provider] of Object.entries(options.providers || {})) {\n    registerProvider(namespace, provider);\n  }\n\n  return api;\n}\n"""
if old_return not in source:
    raise SystemExit('API return block not found')
source = source.replace(old_return, new_return, 1)

path.write_text(source, encoding='utf-8')
