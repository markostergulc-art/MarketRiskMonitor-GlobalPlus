#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, os, shutil, sqlite3, sys, tempfile
from pathlib import Path
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import economic_structure_snapshot as es

ASSET_DB=ROOT/'app/src/main/assets/economic_structure_snapshot.db'
ASSET_JSON=ROOT/'app/src/main/assets/economic_structure_snapshot.json'
REPORT_DIR=ROOT/'reports'

class RefreshError(RuntimeError): pass

def parse_iso(s):
    if not s: return None
    try: return datetime.fromisoformat(s.replace('Z','+00:00'))
    except Exception: return None

def snapshot_info(path=ASSET_DB, now=None):
    now=now or datetime.now(timezone.utc)
    if not path.exists(): return {'exists':False,'lastSuccessfulRefreshAt':None,'ageDays':None,'refreshRequired':True,'validationStatus':'MISSING'}
    try:
        db=es.connect(path)
        last=es.get_meta(db,'lastSuccessfulRefreshAt')
        val=es.get_meta(db,'validationStatus','UNKNOWN')
        dt=parse_iso(last)
        age=(now-dt).total_seconds()/86400 if dt else None
        return {'exists':True,'lastSuccessfulRefreshAt':last,'ageDays':age,'refreshRequired':age is None or age>=es.MAX_SNAPSHOT_AGE_DAYS or val!='PASS','validationStatus':val}
    except Exception as e:
        return {'exists':True,'lastSuccessfulRefreshAt':None,'ageDays':None,'refreshRequired':True,'validationStatus':'INVALID','error':str(e)}

def http_get(url, timeout=60, accept='application/json,text/csv,text/plain,*/*'):
    req=Request(url,headers={'User-Agent':'MarketRiskMonitor-EconomicStructure-BuildRefresh/1.0','Accept':accept})
    with urlopen(req,timeout=timeout) as r:
        return r.read(), dict(r.headers), getattr(r,'status',200)

def copy_existing_rows(old_db, new_db):
    if not old_db.exists(): return
    old=es.connect(old_db)
    # Snapshot content is copied first so provider-specific refreshers can replace domains atomically.
    for c in old.execute('SELECT * FROM country'):
        new_db.execute('INSERT OR REPLACE INTO country(country_code,iso3,country_name,surface) VALUES(?,?,?,?)',(c['country_code'],c['iso3'],c['country_name'],c['surface']))
    for d in old.execute('SELECT * FROM domain_status'):
        new_db.execute('''INSERT OR REPLACE INTO domain_status(country_code,domain,status,observation_period,provider,dataset,source_retrieved_at,snapshot_refreshed_at,error)
                          VALUES(?,?,?,?,?,?,?,?,?)''',tuple(d[k] for k in d.keys()))
    for o in old.execute('SELECT * FROM observation ORDER BY id'):
        cols=[k for k in o.keys() if k!='id']; vals=[o[k] for k in cols]
        new_db.execute(f"INSERT INTO observation({','.join(cols)}) VALUES({','.join('?' for _ in cols)})",vals)

def set_domain_status(db,cc,domain,status,refreshed_at,observation_period=None,provider=None,dataset=None,source_retrieved_at=None,error=None):
    db.execute('''INSERT INTO domain_status(country_code,domain,status,observation_period,provider,dataset,source_retrieved_at,snapshot_refreshed_at,error)
                  VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(country_code,domain) DO UPDATE SET status=excluded.status,observation_period=excluded.observation_period,
                  provider=excluded.provider,dataset=excluded.dataset,source_retrieved_at=excluded.source_retrieved_at,snapshot_refreshed_at=excluded.snapshot_refreshed_at,error=excluded.error''',
               (cc,domain,status,observation_period,provider,dataset,source_retrieved_at,refreshed_at,error))

def clear_domain(db,cc,domain):
    db.execute('DELETE FROM observation WHERE country_code=? AND domain=?',(cc,domain))

def insert_obs(db,cc,domain,metric,label,value_num,value_text,unit,rank,period,obs_date,provider,dataset,series_code,classification,source_url,source_retrieved_at,snapshot_refreshed_at,extra=None):
    if value_num is None and value_text is None: return
    db.execute('''INSERT INTO observation(country_code,domain,metric,label,value_num,value_text,unit,rank,observation_period,observation_date,provider,dataset,series_code,classification,source_url,source_retrieved_at,snapshot_refreshed_at,extra_json)
                  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
               (cc,domain,metric,label,value_num,value_text,unit,rank,period,obs_date,provider,dataset,series_code,classification,source_url,source_retrieved_at,snapshot_refreshed_at,json.dumps(extra,ensure_ascii=False,separators=(',',':')) if extra is not None else None))

def refresh_providers(db,universe,refreshed_at,provider_filter=None):
    # Provider implementations are deliberately separate and independently fail-closed.
    from economic_structure_refresh_providers import PROVIDERS
    results=[]
    names=list(PROVIDERS)
    if provider_filter: names=[n for n in names if n in provider_filter]
    for name in names:
        fn=PROVIDERS[name]
        try:
            res=fn(db,universe,refreshed_at,http_get=http_get,helpers={'clear_domain':clear_domain,'set_domain_status':set_domain_status,'insert_obs':insert_obs}) or {}
            usable=True
            if name=='worldbank': usable=(int(res.get('compositionFull',0))+int(res.get('compositionPartial',0)))>0
            elif name=='comtrade': usable=int(res.get('countriesWithTrade',0))>0
            elif name=='usgs': usable=int(res.get('countriesWithMinerals',0))>0
            elif name=='faostat': usable=int(res.get('countriesWithAgriculture',0))>0
            results.append({'provider':name,'status':'PASS' if usable else 'FAIL',**res,**({} if usable else {'error':'Provider returned no validated country data'})})
        except Exception as e:
            results.append({'provider':name,'status':'FAIL','error':str(e)})
    return results

def write_reports(db,results,refreshed_at):
    REPORT_DIR.mkdir(exist_ok=True)
    day=refreshed_at[:10].replace('-','')
    cov=REPORT_DIR/f'ECONOMIC_STRUCTURE_COVERAGE_{day}.csv'
    rows=db.execute('''SELECT c.country_code,c.iso3,c.surface,d.domain,d.status,d.observation_period,d.provider,d.error
                       FROM country c JOIN domain_status d ON d.country_code=c.country_code ORDER BY c.country_code,d.domain''').fetchall()
    cov.write_text('country_code,iso3,surface,domain,status,observation_period,provider,error\n'+'\n'.join(','.join('"'+str(r[k] or '').replace('"','""')+'"' for k in r.keys()) for r in rows)+'\n',encoding='utf-8')
    rp=REPORT_DIR/f'ECONOMIC_STRUCTURE_REFRESH_REPORT_{day}.md'
    counts={r['status']:r['n'] for r in db.execute('SELECT status,COUNT(*) n FROM domain_status GROUP BY status')}
    rp.write_text('# Economic Structure Refresh Report\n\n'+f'- Snapshot refreshed: `{refreshed_at}`\n- Providers: `{json.dumps(results,ensure_ascii=False)}`\n- Domain status counts: `{json.dumps(counts,sort_keys=True)}`\n- Countries: `{db.execute("SELECT COUNT(*) FROM country").fetchone()[0]}`\n- Observations: `{db.execute("SELECT COUNT(*) FROM observation").fetchone()[0]}`\n',encoding='utf-8')
    return cov,rp

def perform_refresh(force=False,provider_filter=None):
    universe=es.parse_market_universe(ROOT/'app.js')
    started=es.utc_now_iso(); ASSET_DB.parent.mkdir(parents=True,exist_ok=True)
    tmp=ASSET_DB.with_suffix('.new.db'); tmp_json=ASSET_JSON.with_suffix('.new.json')
    if tmp.exists(): tmp.unlink()
    db=es.connect(tmp); es.create_schema(db); es.initialize_countries(db,universe,started); copy_existing_rows(ASSET_DB,db)
    # authoritative universe always wins after copying any prior snapshot
    es.initialize_countries(db,universe,started)
    es.set_meta(db,'snapshotVersion',started[:10]+'.1')
    es.set_meta(db,'lastRefreshStartedAt',started)
    es.set_meta(db,'validationStatus','BUILDING')
    db.commit()
    results=refresh_providers(db,universe,started,provider_filter)
    failed=[x for x in results if x['status']=='FAIL']
    if failed:
        db.close()
        # temp files are intentionally retained for forensic inspection; the verified asset DB is untouched.
        raise RefreshError('Required provider refresh failed: '+', '.join(x['provider']+': '+x.get('error','unknown') for x in failed))
    completed=es.utc_now_iso()
    es.set_meta(db,'refreshCompletedAt',completed)
    es.set_meta(db,'countryCount',str(len(universe)))
    es.set_meta(db,'domainCount',str(len(es.DOMAINS)))
    es.set_meta(db,'recordCount',str(db.execute('SELECT COUNT(*) FROM observation').fetchone()[0]))
    errors=es.validate_db(db,universe)
    # A provider failure may produce N/A/PARTIAL, but structural DB validation must pass.
    if errors:
        es.set_meta(db,'validationStatus','FAIL'); db.commit(); raise RefreshError('; '.join(errors))
    es.set_meta(db,'lastSuccessfulRefreshAt',completed)
    es.set_meta(db,'validationStatus','PASS'); db.commit()
    sha,size=es.write_projection(db,tmp_json)
    es.set_meta(db,'projectionSha256',sha); es.set_meta(db,'projectionBytes',str(size)); db.commit()
    write_reports(db,results,completed)
    db.close()
    # atomic replace on same filesystem
    os.replace(tmp,ASSET_DB); os.replace(tmp_json,ASSET_JSON)
    return {'status':'PASS','providers':results,'lastSuccessfulRefreshAt':completed,'db':str(ASSET_DB),'projection':str(ASSET_JSON),'providerFailures':failed}

def main():
    ap=argparse.ArgumentParser(); g=ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--check',action='store_true'); g.add_argument('--refresh',action='store_true'); g.add_argument('--force',action='store_true')
    ap.add_argument('--provider',action='append',help='Limit refresh to provider key (development only)')
    args=ap.parse_args(); info=snapshot_info()
    if args.check:
        print(json.dumps(info,indent=2)); return 2 if info['refreshRequired'] else 0
    if args.refresh and not info['refreshRequired']:
        print(json.dumps({'status':'SKIPPED','reason':'snapshot younger than 30 days',**info},indent=2)); return 0
    try:
        print(json.dumps(perform_refresh(force=args.force,provider_filter=set(args.provider or [])),indent=2)); return 0
    except Exception as e:
        print(json.dumps({'status':'BLOCKED','error':str(e)},indent=2),file=sys.stderr); return 3
if __name__=='__main__': raise SystemExit(main())
