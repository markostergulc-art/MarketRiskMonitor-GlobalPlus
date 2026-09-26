#!/usr/bin/env python3
from pathlib import Path
import sys,tempfile,urllib.parse
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es
from economic_structure_refresh_providers import refresh_faostat,fao_query
from refresh_economic_structure import clear_domain,set_domain_status,insert_obs
q=fao_query(191)
assert "item_code NOT IN ('1717','1804'" in q
assert "item_code NOT IN (1717,1804" not in q
u=[{'code':'HR','iso3':'HRV','name':'Croatia','surface':'core'}]
csv=b'''faostat,m49_code,country_name_en,item_code,item,year,yield_kg_ha,yield_kg_ha_flag,production_tonnes,production_tonnes_flag,area_harvested_ha,area_harvested_ha_flag\n2,191,Croatia,56,Maize (corn),2024,,,901590,A,,\n2,191,Croatia,15,Wheat,2024,,,830000,A,,\n2,191,Croatia,1717,Cereals total,2024,,,9999999,A,,\n'''
def http(url,**kw):return csv,{},200
with tempfile.TemporaryDirectory() as td:
 db=es.connect(Path(td)/'x.db');es.create_schema(db);es.initialize_countries(db,u,'2026-09-26T00:00:00Z')
 refresh_faostat(db,u,'2026-09-26T00:00:00Z',http,{'clear_domain':clear_domain,'set_domain_status':set_domain_status,'insert_obs':insert_obs})
 rows=db.execute("select label,value_num,unit,extra_json from observation where domain='agriculture' order by rank").fetchall();assert len(rows)==2
 assert rows[0]['label']=='Maize (corn)' and rows[0]['value_num']==901590 and rows[0]['unit']=='t'
 print('economic_structure_faostat_snapshot_v126: PASS')
