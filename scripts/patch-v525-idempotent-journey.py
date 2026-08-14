from pathlib import Path

path = Path('scripts/v5.2.5-living-temple.js')
source = path.read_text(encoding='utf-8')
old = '''  function markVisited(number) {
    const valid = chamberNumber(number);
    if (!valid || !document.body.classList.contains('temple-app-ready')) return;
    if (!state.started) {
      state.started = true;
      state.startedAt = state.startedAt || new Date().toISOString();
    }
    state.current = valid;
    if (!state.visited.includes(valid)) state.visited = [...state.visited, valid].sort((a, b) => a - b);
    persist();
    if (journeyLayer && !journeyLayer.hidden) renderJourney();
  }
'''
new = '''  function markVisited(number) {
    const valid = chamberNumber(number);
    if (!valid || !document.body.classList.contains('temple-app-ready')) return false;
    let changed = false;
    if (!state.started) {
      state.started = true;
      state.startedAt = state.startedAt || new Date().toISOString();
      changed = true;
    }
    if (state.current !== valid) {
      state.current = valid;
      changed = true;
    }
    if (!state.visited.includes(valid)) {
      state.visited = [...state.visited, valid].sort((a, b) => a - b);
      changed = true;
    }
    if (!changed) return false;
    persist();
    if (journeyLayer && !journeyLayer.hidden) renderJourney();
    return true;
  }
'''
if source.count(old) != 1:
    raise SystemExit(f'Expected one markVisited block, found {source.count(old)}')
source = source.replace(old, new, 1)
old_refresh = '''  function refreshJourneyButton() {
    const node = document.getElementById('tm525-journey-button');
    if (node) node.textContent = state.started ? `Journey ${progressText()}` : 'Begin Journey';
  }
'''
new_refresh = '''  function refreshJourneyButton() {
    const node = document.getElementById('tm525-journey-button');
    if (!node) return;
    const nextText = state.started ? `Journey ${progressText()}` : 'Begin Journey';
    if (node.textContent !== nextText) node.textContent = nextText;
  }
'''
if source.count(old_refresh) != 1:
    raise SystemExit(f'Expected one refreshJourneyButton block, found {source.count(old_refresh)}')
source = source.replace(old_refresh, new_refresh, 1)
path.write_text(source, encoding='utf-8')
