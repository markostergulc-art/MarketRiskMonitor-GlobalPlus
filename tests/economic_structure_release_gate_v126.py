#!/usr/bin/env python3
from pathlib import Path
import sys,sqlite3,json
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es
import refresh_economic_structure as rr
p=ROOT/'app/src/main/assets/economic_structure_snapshot.db';assert p.exists()
u=es.parse_market_universe(ROOT/'app.js');db=es.connect(p);errs=es.validate_db(db,u);assert not errs,errs
assert es.get_meta(db,'validationStatus')=='PASS'
info=rr.snapshot_info(p);assert not info['refreshRequired'],info
assert (ROOT/'app/src/main/assets/economic_structure_snapshot_v126.js').exists()
rt=(ROOT/'app/src/main/assets/economic_structure_v126.js').read_text();assert 'fetch(' not in rt and 'fetchWithTimeout' not in rt
html=(ROOT/'app/src/main/assets/index.html').read_text();assert 'economic_structure_snapshot_v126.js' in html and 'economic_structure_v126.js' in html and 'economic_structure_v125.js' not in html
print('economic_structure_release_gate_v126: PASS',len(u),'countries ageDays=',round(info['ageDays'],3))
