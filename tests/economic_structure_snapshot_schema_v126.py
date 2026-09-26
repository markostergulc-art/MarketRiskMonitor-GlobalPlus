#!/usr/bin/env python3
from pathlib import Path
import sys, tempfile, sqlite3
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es
u=es.parse_market_universe(ROOT/'app.js')
assert len(u)==86,(len(u),u[:2])
assert sum(x['surface']=='core' for x in u)==36
assert sum(x['surface']=='extended' for x in u)==50
with tempfile.TemporaryDirectory() as td:
 p=Path(td)/'x.db'; db=es.connect(p); es.create_schema(db); es.initialize_countries(db,u,'2026-09-26T00:00:00Z'); db.commit()
 assert es.validate_db(db,u)==[]
 assert db.execute('SELECT COUNT(*) FROM domain_status').fetchone()[0]==86*7
 names={r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='index'")}
 assert 'idx_obs_country_domain_rank' in names
 sha,size=es.write_projection(db,Path(td)/'x.json'); assert len(sha)==64 and size>1000
 print('economic_structure_snapshot_schema_v126: PASS',len(u),'countries')
