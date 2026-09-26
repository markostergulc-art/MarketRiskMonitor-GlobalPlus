#!/usr/bin/env python3
from pathlib import Path
import sys,tempfile,json,urllib.parse
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es
from economic_structure_refresh_providers import refresh_comtrade
from refresh_economic_structure import clear_domain,set_domain_status,insert_obs
u=[{'code':'DE','iso3':'DEU','name':'Germany','surface':'core'}]
def row(flow,partner,aggr,cmd,val,desc='x',customs='C00',mot=0,p2=0):
 return {'reporterCode':276,'period':'2025','flowCode':flow,'partnerCode':partner,'partnerDesc':('World' if partner==0 else 'France'),'partner2Code':p2,'customsCode':customs,'motCode':mot,'aggrLevel':aggr,'cmdCode':cmd,'cmdDesc':desc,'primaryValue':val}
def http(url,**kw):
 q=urllib.parse.parse_qs(urllib.parse.urlsplit(url).query);flow=q['flowCode'][0];cmd=q['cmdCode'][0]
 if flow=='X' and cmd=='AG2': data=[row('X',0,2,'87',200,'Vehicles'),row('X',0,2,'84',100,'Machinery'),row('X',0,2,'87',999,'BAD','C20',0,0)]
 elif flow=='X': data=[row('X',0,0,'TOTAL',1000,'All'),row('X',250,0,'TOTAL',300,'France'),row('X',250,0,'TOTAL',999,'BAD','C00',9200,0)]
 elif flow=='M' and cmd=='AG2': data=[row('M',0,2,'27',400,'Fuel')]
 else: data=[row('M',0,0,'TOTAL',800,'All')]
 return json.dumps({'data':data}).encode(),{},200
with tempfile.TemporaryDirectory() as td:
 db=es.connect(Path(td)/'x.db');es.create_schema(db);es.initialize_countries(db,u,'2026-09-26T00:00:00Z')
 refresh_comtrade(db,u,'2026-09-26T00:00:00Z',http,{'clear_domain':clear_domain,'set_domain_status':set_domain_status,'insert_obs':insert_obs})
 ex=db.execute("select label,value_num,extra_json from observation where domain='exports' order by rank").fetchall();assert len(ex)==2 and ex[0]['value_num']==200
 assert abs(json.loads(ex[0]['extra_json'])['sharePct']-20)<1e-9
 ds=db.execute("select value_num from observation where domain='destinations'").fetchall();assert len(ds)==1 and ds[0][0]==300
 im=db.execute("select value_num from observation where domain='imports'").fetchone()[0];assert im==400
 print('economic_structure_comtrade_snapshot_v126: PASS')
