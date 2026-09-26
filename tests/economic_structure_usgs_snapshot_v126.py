#!/usr/bin/env python3
from pathlib import Path
import sys,tempfile
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es
from economic_structure_refresh_providers import refresh_usgs,USGS_PRODUCTION_URL,USGS_FACILITIES_URL
from refresh_economic_structure import clear_domain,set_domain_status,insert_obs
u=[{'code':'DE','iso3':'DEU','name':'Germany','surface':'core'}]
prod='''Country (Short Form) or Locality,Level 1 (Commodity Group),Level 2 (Commodity),Time Period,Year,Data Type,Value,Unit,Level 3 (Type),Level 4 (Phase),Level 5 (Form),Value Notes\nGermany,Potash,Potash,2024,2024,Production,1000,metric tons,,,,\nGermany,Rare earths,Rare earths,2024,2024,Production,5,metric tons,,,,\n'''.encode()
fac='''USGS Facility ID,Country (Short Form) or Locality,Facility Name,Feature Type,Level 1 (Commodity Group),Level 2 (Commodity),Annual Production Capacity,Capacity Unit,Facility Status,Major Operating Company\nDEU001,Germany,Test Mine,Mine,Potash,Potash,1200,metric tons,assumed active,Co\nDEU002,Germany,Old Mine,Mine,Potash,Potash,900,metric tons,inactive,Co\n'''.encode()
def http(url,**kw):return (prod if url==USGS_PRODUCTION_URL else fac),{},200
with tempfile.TemporaryDirectory() as td:
 db=es.connect(Path(td)/'x.db');es.create_schema(db);es.initialize_countries(db,u,'2026-09-26T00:00:00Z')
 refresh_usgs(db,u,'2026-09-26T00:00:00Z',http,{'clear_domain':clear_domain,'set_domain_status':set_domain_status,'insert_obs':insert_obs})
 a=db.execute("select metric,label,value_num,extra_json from observation where country_code='DE' and domain='minerals'").fetchall();assert len(a)==3
 assert any(r['metric']=='production' and r['label']=='Rare earths' for r in a)
 assert any(r['metric']=='facility' and r['label']=='Test Mine' for r in a)
 assert not any(r['label']=='Old Mine' for r in a)
 st=db.execute("select error from domain_status where country_code='DE' and domain='minerals'").fetchone()[0];assert 'Reserves: N/A' in st
 print('economic_structure_usgs_snapshot_v126: PASS')
