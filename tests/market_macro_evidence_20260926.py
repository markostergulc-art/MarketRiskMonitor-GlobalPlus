from pathlib import Path
s=Path('app/src/main/assets/market_details_v310.js').read_text()
for field in ['Observation period','Observation date','Frequency','Unit','Provider','Series','Scope','Released','Retrieved','Used in model']:
    assert field in s, field
assert 'MARKET EVIDENCE · MACRO' in s
assert "macroEvidenceCardV124(code,g,'GDP Growth')" in s
assert "macroEvidenceCardV124(code,i,'Inflation')" in s
assert "macroEvidenceCardV124(code,u,'Unemployment')" in s
print('market_macro_evidence_20260926: PASS')
