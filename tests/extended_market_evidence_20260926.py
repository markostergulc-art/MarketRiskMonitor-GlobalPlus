from pathlib import Path
s=Path('app.js').read_text()
assert "extendedCountryMacroChipV124('GDP',mac.gdp)" in s
assert "extendedCountryMacroChipV124('CPI',mac.inf)" in s
assert "extendedCountryMacroChipV124('UNEMP',mac.un)" in s
assert 'MARKET EVIDENCE · MACRO' in s
for x in ['Observation period','Observation date','Frequency','Provider','Series','Scope','Retrieved','Extended macro factor score','Normalized weight','Contribution','Used in GLOBAL / core country risk']:
    assert x in s,x
assert "openExtendedCountry(el.dataset.watchCode)" in s
print('extended_market_evidence_20260926: PASS')
