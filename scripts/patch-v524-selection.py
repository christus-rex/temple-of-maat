from pathlib import Path

path = Path('scripts/v5.2.4-living-codex.js')
source = path.read_text(encoding='utf-8')
old = '''    layer.addEventListener('temple:codex-open', () => {
      search.value = '';
      renderList();
      selectRecord(currentNumber(), false);
    });'''
new = '''    layer.addEventListener('temple:codex-open', () => {
      search.value = '';
      renderList();
      // Honor an explicitly requested record; openCodex(number) sets selectedNumber first.
      selectRecord(selectedNumber || currentNumber(), false);
    });'''
if source.count(old) != 1:
    raise SystemExit(f'Expected exactly one Codex-open selection block, found {source.count(old)}')
path.write_text(source.replace(old, new, 1), encoding='utf-8')
