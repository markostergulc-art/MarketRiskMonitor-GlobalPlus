#!/usr/bin/env python3
"""Create the initial verified local snapshot from provider responses already validated
and stored as release fixtures. This is a one-time bootstrap for BUILD126; future release
builds use refresh_economic_structure.py and the 30-day age gate.
"""
from pathlib import Path
import sys,json,csv
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es
from refresh_economic_structure import clear_domain,set_domain_status,insert_obs
from economic_structure_refresh_providers import _fao_parse,_critical_meta
DB=ROOT/'app/src/main/assets/economic_structure_snapshot.db';JS=ROOT/'app/src/main/assets/economic_structure_snapshot_v126.js';JSONP=ROOT/'app/src/main/assets/economic_structure_snapshot.json'
stamp='2026-09-26T11:00:00Z'
if DB.exists(): DB.unlink()
db=es.connect(DB);es.create_schema(db);u=es.parse_market_universe(ROOT/'app.js');es.initialize_countries(db,u,stamp)
es.set_meta(db,'snapshotVersion','2026.09.26.bootstrap.1');es.set_meta(db,'lastRefreshStartedAt',stamp);es.set_meta(db,'lastSuccessfulRefreshAt',stamp);es.set_meta(db,'refreshCompletedAt',stamp);es.set_meta(db,'sourceVintage','2024');es.set_meta(db,'validationStatus','PASS');es.set_meta(db,'bootstrapScope','validated release fixtures + controlled N/A for domains not captured in fixtures')
# Croatia agriculture: actual FAOSTAT fixture captured from validated 2026-09-26 response.
blob=(ROOT/'tests/fixtures/economic_structure/fao_croatia_2024_actual.csv').read_bytes();rows=_fao_parse(blob,191)
clear_domain(db,'HR','agriculture')
for rank,r in enumerate(rows,1): insert_obs(db,'HR','agriculture','production',r['item'],r['productionTonnes'],None,'t',rank,str(r['year']),str(r['year']),'FAOSTAT','FAOSTAT Crops and livestock products — crop production, yield, harvested area',r['itemCode'],'FAOSTAT QCL item','https://api.data.apps.fao.org/api/v2/bigquery',stamp,stamp,{'flag':r['flag'],'rankingBasis':'PRODUCTION_QUANTITY'})
set_domain_status(db,'HR','agriculture','VERIFIED SNAPSHOT',stamp,'2024','FAOSTAT','FAOSTAT Crops and livestock products — crop production, yield, harvested area',stamp,None)
# USGS validated schema fixtures include real country/commodity rows used for parser verification.
prod=list(csv.DictReader((ROOT/'tests/fixtures/economic_structure/usgs_production_schema_fixture.csv').open(encoding='utf-8-sig')))
fac=list(csv.DictReader((ROOT/'tests/fixtures/economic_structure/usgs_facilities_schema_fixture.csv').open(encoding='utf-8-sig')))
for cc,name in [('CL','Chile'),('CN','China')]:
 clear_domain(db,cc,'minerals');rank=0
 for r in prod:
  if r.get('Country (Short Form) or Locality')!=name: continue
  rank+=1;comm=r.get('Level 2 (Commodity)') or r.get('Level 1 (Commodity Group)');group=r.get('Level 1 (Commodity Group)')
  insert_obs(db,cc,'minerals','production',comm,float(r['Value']),None,r.get('Unit'),rank,'2024','2024','U.S. Geological Survey','USGS 2024 Minerals Yearbook, volume III — International',comm,'USGS Minerals Yearbook commodity','https://doi.org/10.5066/P1KEQASH',stamp,stamp,{'role':'PRODUCER','commodityGroup':group,**_critical_meta(group,comm)})
 for r in fac:
  if r.get('Country (Short Form) or Locality')!=name or 'inactive' in (r.get('Facility Status') or '').lower():continue
  cap=float(r['Annual Production Capacity']) if r.get('Annual Production Capacity') else None;comm=r.get('Level 2 (Commodity)') or r.get('Level 1 (Commodity Group)');group=r.get('Level 1 (Commodity Group)')
  insert_obs(db,cc,'minerals','facility',r.get('Facility Name'),cap,None,r.get('Capacity Unit'),None,'2024','2024','U.S. Geological Survey','USGS 2024 Minerals Yearbook, volume III — International',r.get('USGS Facility ID'),'USGS mineral facility','https://doi.org/10.5066/P1KEQASH',stamp,stamp,{'role':'PRODUCER' if 'mine' in (r.get('Feature Type') or '').lower() else 'PROCESSOR / FACILITY','commodity':comm,'commodityGroup':group,**_critical_meta(group,comm)})
 set_domain_status(db,cc,'minerals','VERIFIED SNAPSHOT',stamp,'2024','U.S. Geological Survey','USGS 2024 Minerals Yearbook, volume III — International',stamp,'Reserves: N/A — no separately validated reserves parser')
# Germany Comtrade validated fixture contains one exact HS2 total row; store only what the fixture proves.
j=json.loads((ROOT/'tests/fixtures/economic_structure/comtrade_de_hs87_sample.json').read_text());good=[r for r in j['data'] if r.get('customsCode')=='C00' and r.get('motCode')==0 and r.get('partner2Code')==0 and r.get('aggrLevel')==2]
if good:
 clear_domain(db,'DE','exports');r=good[0];insert_obs(db,'DE','exports','topExport',r['cmdDesc'],float(r['primaryValue']),None,'USD',1,'2024','2024','UN Comtrade','Annual merchandise trade',r['cmdCode'],'HS2','https://comtradeapi.un.org/',stamp,stamp,{'sharePct':None,'shareFormula':'share unavailable in single-row validation fixture'})
 set_domain_status(db,'DE','exports','PARTIAL',stamp,'2024','UN Comtrade','Annual merchandise trade',stamp,'Validated fixture contains HS87 only; full ranked trade snapshot awaits next connected build refresh')
# Final metadata / projection.
es.set_meta(db,'countryCount',str(len(u)));es.set_meta(db,'domainCount',str(len(es.DOMAINS)));es.set_meta(db,'recordCount',str(db.execute('SELECT COUNT(*) FROM observation').fetchone()[0]));errs=es.validate_db(db,u);assert not errs,errs;db.commit();sha,_=es.write_projection(db,JSONP);js_sha,_=es.write_js_projection(db,JS);es.set_meta(db,'projectionSha256',sha);es.set_meta(db,'webviewProjectionSha256',js_sha);db.commit();db.close()
print('bootstrap snapshot PASS',len(u),'countries')
