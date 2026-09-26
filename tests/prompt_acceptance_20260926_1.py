from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
app=(root/'app.js').read_text()
idx=(root/'app/src/main/assets/index.html').read_text()
mod=(root/'app/src/main/assets/market_details_v310.js').read_text()
gradle=(root/'app/build.gradle').read_text()
# 1 versioning
assert "versionName '2026.09.26.1'" in gradle
assert 'versionCode 124' in gradle
assert '· 2026.09.26.1</div>' in idx
assert '· v3.10</div>' not in idx
# 2 core card priority
for x in ["marketMacroChipV124('GDP',mac.gdp)","marketMacroChipV124('CPI',mac.inf)","marketMacroChipV124('UNEMP',mac.un)"]:
    assert x in app
# 3 extended cards priority and explicit N/A helper
for x in ["extendedCountryMacroChipV124('GDP',mac.gdp)","extendedCountryMacroChipV124('CPI',mac.inf)","extendedCountryMacroChipV124('UNEMP',mac.un)"]:
    assert x in app
assert "${esc(label)} N/A" in app
# 4 market-level evidence button removed from core cards
m=re.search(r'function marketCard\(c\)\{([\s\S]*?)\nfunction globalDriverRowHtmlV66',app); assert m
assert 'EVIDENCE</button>' not in m.group(0)
assert 'data-evidence-target="COUNTRY:' not in m.group(0)
# 5 whole card click -> details for core + extended
assert "document.querySelectorAll('.market-card').forEach(el=>el.onclick=()=>openMarket(el.dataset.code))" in app
assert "document.querySelectorAll('.extended-market-card').forEach(el=>el.onclick=()=>openExtendedCountry(el.dataset.watchCode))" in app
# 6 detailed evidence fields core
for x in ['Observation period','Observation date','Frequency','Provider','Series','Scope','Released','Retrieved','Used in model','Eligibility / exclusion']:
    assert x in mod,x
assert 'RISK / HEALTH MODEL EVIDENCE' in mod
assert 'Normalized weight' in mod and 'Contribution' in mod
# 7 extended detailed evidence
for x in ['Extended macro factor score','Used in GLOBAL / core country risk','Reconstructed macro score']:
    assert x in app,x
# 8 evidence/provenance infrastructure retained
assert 'currentEvidence' in app
assert 'calculationSnapshots' in app
# 9 no new fetch in card render helper
cardblock=re.search(r'function marketMacroPeriodV124[\s\S]*?function globalDriverRowHtmlV66',app); assert cardblock
assert 'fetchWithTimeout' not in cardblock.group(0)
print('prompt_acceptance_20260926_1: PASS')
