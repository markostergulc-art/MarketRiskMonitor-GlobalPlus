from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
app=(root/'app.js').read_text()
assert 'function marketMacroChipsV124(c)' in app
assert "marketMacroChipV124('GDP',mac.gdp)" in app
assert "marketMacroChipV124('CPI',mac.inf)" in app
assert "marketMacroChipV124('UNEMP',mac.un)" in app
assert 'GDP N/A' not in app  # generated dynamically, no hardcoded values
assert 'market-macro-priority-v124' in app
# Cards use existing macroData; no World Bank fetch is introduced in marketCard helpers.
block=re.search(r'function marketMacroPeriodV124[\s\S]*?function marketCard\(c\)\{([\s\S]*?)\nfunction ',app)
assert block
assert 'fetchWithTimeout' not in block.group(0)
print('market_card_macro_priority_20260926: PASS')
