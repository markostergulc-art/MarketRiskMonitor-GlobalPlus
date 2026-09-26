#!/usr/bin/env python3
from pathlib import Path
import sys,sqlite3,json,re
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es
import refresh_economic_structure as rr
u=es.parse_market_universe(ROOT/'app.js'); assert len(u)==86
p=ROOT/'app/src/main/assets/economic_structure_snapshot.db';db=es.connect(p)
assert not es.validate_db(db,u)
assert es.get_meta(db,'validationStatus')=='PASS'
assert not rr.snapshot_info(p)['refreshRequired']
# all 86 countries have all controlled domains
assert db.execute('select count(*) from country').fetchone()[0]==86
assert db.execute('select count(*) from domain_status').fetchone()[0]==86*len(es.DOMAINS)
# NULL must not have been turned into a numeric zero placeholder
assert db.execute("select count(*) from observation where value_num is null and value_text is null").fetchone()[0]==0
# all numeric records carry provider, period and snapshot provenance
assert db.execute("select count(*) from observation where value_num is not null and (provider='' or observation_period is null or snapshot_refreshed_at='')").fetchone()[0]==0
rt=(ROOT/'app/src/main/assets/economic_structure_v126.js').read_text()
assert 'fetch(' not in rt and 'fetchWithTimeout' not in rt and 'XMLHttpRequest' not in rt
for host in ('comtradeapi.un.org','api.data.apps.fao.org','sciencebase.gov','api.worldbank.org'):
 assert host not in rt
idx=(ROOT/'app/src/main/assets/index.html').read_text()
assert '<script src="economic_structure_snapshot_v126.js"></script>' in idx
assert '<script src="economic_structure_v126.js"></script>' in idx
# scoring freeze: no new snapshot module referenced by core scoring source
app=(ROOT/'app.js').read_text()
for forbidden in ('economic_structure_snapshot','MRMEconomicStructureSnapshot'):
 assert forbidden not in app
print('economic_structure_final_acceptance_v126: PASS')
