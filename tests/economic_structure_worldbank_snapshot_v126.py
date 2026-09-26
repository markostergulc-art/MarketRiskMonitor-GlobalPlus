#!/usr/bin/env python3
from pathlib import Path
import sys,tempfile,json
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es
from economic_structure_refresh_providers import refresh_worldbank
u=[{'code':'DE','iso3':'DEU','name':'Germany','surface':'core'}]
def http(url,**kw):
 ind=url.split('/indicator/')[1].split('?')[0]
 vals={'NV.AGR.TOTL.ZS':1.0,'NV.IND.TOTL.ZS':25.0,'NV.IND.MANF.ZS':18.0,'NV.SRV.TOTL.ZS':69.0,'ST.INT.ARVL':100.0,'ST.INT.RCPT.CD':200.0,'ST.INT.RCPT.XP.ZS':3.0}
 body=[{},[{'date':'2024','value':vals[ind]}]]
 return json.dumps(body).encode(),{},200
with tempfile.TemporaryDirectory() as td:
 db=es.connect(Path(td)/'x.db');es.create_schema(db);es.initialize_countries(db,u,'2026-09-26T00:00:00Z')
 from refresh_economic_structure import clear_domain,set_domain_status,insert_obs
 refresh_worldbank(db,u,'2026-09-26T00:00:00Z',http,{'clear_domain':clear_domain,'set_domain_status':set_domain_status,'insert_obs':insert_obs})
 assert db.execute("select count(*) from observation where domain='composition'").fetchone()[0]==4
 assert db.execute("select count(*) from observation where domain='tourism'").fetchone()[0]==3
 assert db.execute("select status from domain_status where country_code='DE' and domain='tourism'").fetchone()[0]=='VERIFIED SNAPSHOT'
 print('economic_structure_worldbank_snapshot_v126: PASS')
