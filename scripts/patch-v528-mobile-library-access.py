#!/usr/bin/env python3
from pathlib import Path

# 1) Keep Library reachable on mobile while the wallpaper hotfix intentionally hides the bottom dock.
js_path = Path('scripts/v5.2.8-temple-library.js')
js = js_path.read_text(encoding='utf-8')
needle = "  function installLauncher() {\n    const installIntoDock = () => {\n"
replacement = "  function installLauncher() {\n    if (!document.querySelector('[data-temple-library-launcher=\"artifact-mobile\"]')) {\n      const artifactLauncher = button('Library', () => openLibrary(), 'tm528-artifact-launcher');\n      artifactLauncher.dataset.templeLibraryLauncher = 'artifact-mobile';\n      artifactLauncher.setAttribute('aria-label', 'Open Temple Library');\n      document.body.append(artifactLauncher);\n    }\n\n    const installIntoDock = () => {\n"
if 'artifact-mobile' not in js:
    if needle not in js:
        raise SystemExit('installLauncher marker not found')
    js = js.replace(needle, replacement, 1)
    js_path.write_text(js, encoding='utf-8')

# 2) Style the artifact-local mobile launcher away from bottom wallpaper/download controls.
css_path = Path('styles/v5.2.8-temple-library.css')
css = css_path.read_text(encoding='utf-8')
addition = ".tm528-artifact-launcher{display:none;position:fixed;left:max(12px,env(safe-area-inset-left));top:max(72px,calc(env(safe-area-inset-top) + 72px));z-index:8905;border:1px solid rgba(212,175,55,.42);border-radius:999px;background:rgba(10,9,7,.94);color:#f5e6c8;padding:9px 11px;font:700 10px/1.2 ui-monospace,monospace;letter-spacing:.04em;box-shadow:0 8px 24px rgba(0,0,0,.38);backdrop-filter:blur(10px)}.tm528-artifact-launcher:focus-visible{outline:2px solid #d4af37;outline-offset:3px}@media(max-width:760px){body.temple-app-ready.temple-artifact-open:not(.temple-library-open) .tm528-artifact-launcher{display:inline-flex}}\n"
if '.tm528-artifact-launcher{' not in css:
    css_path.write_text(css.rstrip() + addition, encoding='utf-8')

# 3) Browser smoke accepts the dock launcher on desktop or artifact-local launcher on mobile.
smoke_path = Path('scripts/smoke-library-v5.2.8.mjs')
smoke = smoke_path.read_text(encoding='utf-8')
smoke = smoke.replace(
    "await page.waitForFunction(() => Boolean(document.querySelector('[data-temple-library-launcher=\"dock\"]')?.offsetParent), { timeout: 15000 });",
    "await page.waitForFunction(() => [...document.querySelectorAll('[data-temple-library-launcher]')].some((node) => node.offsetParent), { timeout: 15000 });"
)
smoke = smoke.replace(
    "await page.locator('[data-temple-library-launcher=\"dock\"]').click();",
    "await page.locator('[data-temple-library-launcher]:visible').first().click();"
)
smoke = smoke.replace(
    "launcherVisible: Boolean(document.querySelector('[data-temple-library-launcher=\"dock\"]')?.offsetParent)",
    "launcherVisible: [...document.querySelectorAll('[data-temple-library-launcher]')].some((node) => node.offsetParent)"
)
smoke_path.write_text(smoke, encoding='utf-8')

# 4) The canonical chant MP3 is intentionally not bundled; ignore only its expected aborted request in wallpaper diagnostics.
wall_path = Path('scripts/diagnose-live-wallpapers.mjs')
wall = wall_path.read_text(encoding='utf-8')
old = "  page.on('requestfailed', (request) => errors.push(`requestfailed: ${request.url()} :: ${request.failure()?.errorText}`));\n"
new = "  page.on('requestfailed', (request) => {\n    const url = request.url();\n    const errorText = request.failure()?.errorText || '';\n    if (url.includes('/assets/audio/maat-forty-two-declarations.mp3') && errorText.includes('ERR_ABORTED')) return;\n    errors.push(`requestfailed: ${url} :: ${errorText}`);\n  });\n"
if old in wall:
    wall = wall.replace(old, new, 1)
elif "maat-forty-two-declarations.mp3" not in wall:
    raise SystemExit('Wallpaper requestfailed diagnostic marker not found')
wall_path.write_text(wall, encoding='utf-8')
