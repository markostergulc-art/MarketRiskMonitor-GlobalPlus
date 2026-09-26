from pathlib import Path
s=Path('app/src/main/assets/market_details_v310.js').read_text()
for x in ['Factor freshness','Freshness eligible','Country model eligible','Eligibility / exclusion','Context cache','Detail load state']:
    assert x in s,x
assert 'Context-only by methodology' in s
assert 'Macro factor freshness is not eligible for current effective coverage' in s
print('market_source_eligibility_20260926: PASS')
