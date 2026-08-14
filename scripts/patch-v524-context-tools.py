from pathlib import Path

js_path = Path('scripts/v5.2.4-living-codex.js')
js = js_path.read_text(encoding='utf-8')
old = '''  function injectChamberTools() {
    const artifact = document.querySelector('#tm2-artifact.open');
    if (!artifact || artifact.querySelector('.tm524-chamber-tools')) return;
    const host = artifact.firstElementChild || artifact;
    const tools = el('div', 'tm524-chamber-tools');
    tools.append(
      button('Open Codex Record', () => openCodex(currentNumber()), 'tm524-chamber-tool'),
      button('Collect', () => openVault(currentNumber()), 'tm524-chamber-tool')
    );
    host.appendChild(tools);
  }

  function onChamberChange() {
    const number = chamberFromHash();
    if (number) rememberChamber(number);
    injectChamberTools();
  }

  function initObserver() {
    if (artifactObserver || !document.body) return;
    artifactObserver = new MutationObserver(() => {
      if (document.querySelector('#tm2-artifact.open')) {
        onChamberChange();
      }
    });
    artifactObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
'''
new = '''  function syncContextTools() {
    const artifact = document.querySelector('#tm2-artifact.open');
    let tools = document.getElementById('tm524-context-tools');
    if (!artifact) {
      tools?.remove();
      return;
    }
    if (tools) return;
    tools = el('div', 'tm524-chamber-tools');
    tools.id = 'tm524-context-tools';
    tools.setAttribute('aria-label', 'Current chamber Codex tools');
    tools.append(
      button('Open Codex Record', () => openCodex(currentNumber()), 'tm524-chamber-tool'),
      button('Collect', () => openVault(currentNumber()), 'tm524-chamber-tool')
    );
    // Keep Temple enhancements outside the React-owned artifact subtree.
    document.body.appendChild(tools);
  }

  function onChamberChange() {
    const number = chamberFromHash();
    if (number) rememberChamber(number);
    syncContextTools();
  }

  function initObserver() {
    if (artifactObserver || !document.body) return;
    artifactObserver = new MutationObserver(syncContextTools);
    artifactObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
'''
if old not in js:
    raise SystemExit('Expected v5.2.4 chamber-tool block not found')
js_path.write_text(js.replace(old, new, 1), encoding='utf-8')

css_path = Path('styles/v5.2.4-living-codex.css')
css = css_path.read_text(encoding='utf-8')
old_css = '''.tm524-chamber-tools {
  position: sticky;
  z-index: 15;
  top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  width: fit-content;
  margin: 8px 8px 8px auto;
  pointer-events: auto;
}
'''
new_css = '''body:not(.temple-app-ready) .tm524-chamber-tools { display: none !important; }
.tm524-chamber-tools {
  position: fixed;
  z-index: 8750;
  top: max(14px, env(safe-area-inset-top));
  right: max(14px, env(safe-area-inset-right));
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  width: fit-content;
  pointer-events: auto;
}
'''
if old_css not in css:
    raise SystemExit('Expected v5.2.4 chamber-tool CSS block not found')
css = css.replace(old_css, new_css, 1)
css = css.replace('''  .tm524-chamber-tools { position: static; flex-wrap: wrap; margin: 8px; }''', '''  .tm524-chamber-tools { top: auto; right: max(8px, env(safe-area-inset-right)); bottom: calc(max(8px, env(safe-area-inset-bottom)) + 66px); left: max(8px, env(safe-area-inset-left)); width: auto; justify-content: center; flex-wrap: wrap; }''', 1)
css_path.write_text(css, encoding='utf-8')
