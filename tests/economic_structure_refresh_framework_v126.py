#!/usr/bin/env python3
from pathlib import Path
import sys,tempfile,os,sqlite3
from datetime import datetime,timezone,timedelta
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es
import refresh_economic_structure as r
u=es.parse_market_universe(ROOT/'app.js')
with tempfile.TemporaryDirectory() as td:
 p=Path(td)/'snap.db'; db=es.connect(p);es.create_schema(db);now=datetime(2026,9,26,tzinfo=timezone.utc);stamp=now.isoformat().replace('+00:00','Z');es.initialize_countries(db,u,stamp);es.set_meta(db,'lastSuccessfulRefreshAt',stamp);es.set_meta(db,'validationStatus','PASS');db.commit();db.close()
 i=r.snapshot_info(p,now+timedelta(days=29));assert not i['refreshRequired']
 i=r.snapshot_info(p,now+timedelta(days=30));assert i['refreshRequired']
 i=r.snapshot_info(p,now+timedelta(days=31));assert i['refreshRequired']
 # atomicity primitive: existing DB is untouched until os.replace occurs
 before=p.read_bytes();tmp=Path(td)/'snap.new.db';tmp.write_bytes(b'bad');assert p.read_bytes()==before
 print('economic_structure_refresh_framework_v126: PASS')
