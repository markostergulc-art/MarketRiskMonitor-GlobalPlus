#!/usr/bin/env python3
from __future__ import annotations
import json, re, sqlite3, hashlib
from pathlib import Path
from datetime import datetime, timezone

SCHEMA_VERSION=1
MAX_SNAPSHOT_AGE_DAYS=30
DOMAINS=("composition","exports","destinations","imports","minerals","agriculture","tourism")

def utc_now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')

def parse_market_universe(app_js: Path):
    s=app_js.read_text(encoding='utf-8')
    out=[]; seen=set()
    for const_name,surface in (("MARKET_CONFIG","core"),("EXTENDED_COUNTRY_CONFIG","extended")):
        m=re.search(rf"const\s+{const_name}\s*=\s*\[(.*?)\n\s*\];",s,re.S)
        if not m: raise RuntimeError(f"Cannot locate {const_name}")
        for obj in re.finditer(r"\{([^{}]+)\}",m.group(1)):
            txt=obj.group(1)
            def val(k):
                mm=re.search(rf"(?:^|,)\s*{re.escape(k)}\s*:\s*'([^']*)'",txt)
                return mm.group(1) if mm else None
            code,iso=val('code'),val('iso')
            if not code or not iso or code in seen: continue
            out.append({'code':code,'iso3':iso,'name':val('name') or code,'surface':surface})
            seen.add(code)
    return out

def connect(path: Path):
    db=sqlite3.connect(path)
    db.row_factory=sqlite3.Row
    return db

def create_schema(db: sqlite3.Connection):
    db.executescript('''
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS snapshot_meta(
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS country(
      country_code TEXT PRIMARY KEY,
      iso3 TEXT NOT NULL,
      country_name TEXT NOT NULL,
      surface TEXT NOT NULL CHECK(surface IN ('core','extended'))
    );
    CREATE TABLE IF NOT EXISTS domain_status(
      country_code TEXT NOT NULL,
      domain TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('VERIFIED SNAPSHOT','PARTIAL','N/A')),
      observation_period TEXT,
      provider TEXT,
      dataset TEXT,
      source_retrieved_at TEXT,
      snapshot_refreshed_at TEXT NOT NULL,
      error TEXT,
      PRIMARY KEY(country_code,domain),
      FOREIGN KEY(country_code) REFERENCES country(country_code) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS observation(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country_code TEXT NOT NULL,
      domain TEXT NOT NULL,
      metric TEXT NOT NULL,
      label TEXT,
      value_num REAL,
      value_text TEXT,
      unit TEXT,
      rank INTEGER,
      observation_period TEXT,
      observation_date TEXT,
      provider TEXT NOT NULL,
      dataset TEXT NOT NULL,
      series_code TEXT,
      classification TEXT,
      source_url TEXT,
      source_retrieved_at TEXT NOT NULL,
      snapshot_refreshed_at TEXT NOT NULL,
      extra_json TEXT,
      FOREIGN KEY(country_code) REFERENCES country(country_code) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_obs_country_domain_rank ON observation(country_code,domain,rank);
    CREATE INDEX IF NOT EXISTS idx_obs_country_metric ON observation(country_code,metric);
    CREATE INDEX IF NOT EXISTS idx_domain_status_country ON domain_status(country_code,domain);
    ''')
    set_meta(db,'schemaVersion',str(SCHEMA_VERSION))

def set_meta(db,key,value):
    db.execute("INSERT INTO snapshot_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",(key,str(value)))

def get_meta(db,key,default=None):
    row=db.execute("SELECT value FROM snapshot_meta WHERE key=?",(key,)).fetchone()
    return row['value'] if row else default

def initialize_countries(db, universe, refreshed_at):
    for c in universe:
        db.execute("INSERT OR REPLACE INTO country(country_code,iso3,country_name,surface) VALUES(?,?,?,?)",(c['code'],c['iso3'],c['name'],c['surface']))
        for d in DOMAINS:
            db.execute('''INSERT OR IGNORE INTO domain_status(country_code,domain,status,snapshot_refreshed_at,error)
                          VALUES(?,?, 'N/A', ?, 'No validated snapshot record')''',(c['code'],d,refreshed_at))

def validate_db(db, expected_universe=None):
    errors=[]
    sv=get_meta(db,'schemaVersion')
    if sv!=str(SCHEMA_VERSION): errors.append(f'schemaVersion={sv}')
    countries=db.execute("SELECT country_code,iso3,surface FROM country ORDER BY country_code").fetchall()
    if expected_universe is not None:
        exp={x['code']:(x['iso3'],x['surface']) for x in expected_universe}
        got={r['country_code']:(r['iso3'],r['surface']) for r in countries}
        if got!=exp: errors.append(f'universe mismatch expected={len(exp)} got={len(got)}')
    for r in countries:
        n=db.execute("SELECT COUNT(*) n FROM domain_status WHERE country_code=?",(r['country_code'],)).fetchone()['n']
        if n!=len(DOMAINS): errors.append(f"{r['country_code']} domain_status {n}/{len(DOMAINS)}")
    bad=db.execute("SELECT COUNT(*) n FROM observation WHERE value_num IS NULL AND value_text IS NULL").fetchone()['n']
    if bad: errors.append(f'{bad} empty observations')
    bad=db.execute("SELECT COUNT(*) n FROM observation WHERE provider='' OR dataset='' OR source_retrieved_at='' OR snapshot_refreshed_at=''").fetchone()['n']
    if bad: errors.append(f'{bad} observations missing provenance')
    return errors

def project_for_webview(db):
    meta={r['key']:r['value'] for r in db.execute('SELECT key,value FROM snapshot_meta')}
    countries={}
    for c in db.execute('SELECT * FROM country ORDER BY country_code'):
        cc=c['country_code']; domains={}
        for ds in db.execute('SELECT * FROM domain_status WHERE country_code=? ORDER BY domain',(cc,)):
            domains[ds['domain']]={k:ds[k] for k in ds.keys() if k not in ('country_code','domain')}
            domains[ds['domain']]['rows']=[]
        for o in db.execute('SELECT * FROM observation WHERE country_code=? ORDER BY domain, COALESCE(rank,999999), id',(cc,)):
            rec={k:o[k] for k in o.keys() if k not in ('id','country_code','domain')}
            if rec.get('extra_json'):
                try: rec['extra']=json.loads(rec.pop('extra_json'))
                except Exception: pass
            domains.setdefault(o['domain'],{'status':'PARTIAL','rows':[]})['rows'].append(rec)
        countries[cc]={'iso3':c['iso3'],'name':c['country_name'],'surface':c['surface'],'domains':domains}
    return {'schema':'MRM_ECONOMIC_STRUCTURE_SNAPSHOT_V1','meta':meta,'countries':countries}

def write_projection(db, path: Path):
    obj=project_for_webview(db)
    data=json.dumps(obj,ensure_ascii=False,separators=(',',':'),sort_keys=True).encode('utf-8')
    path.write_bytes(data)
    return hashlib.sha256(data).hexdigest(), len(data)


def write_js_projection(db, path: Path):
    obj=project_for_webview(db)
    payload=json.dumps(obj,ensure_ascii=False,separators=(',',':'),sort_keys=True)
    text="window.MRMEconomicStructureSnapshot="+payload+";\n"
    path.write_text(text,encoding='utf-8')
    data=text.encode('utf-8')
    return hashlib.sha256(data).hexdigest(),len(data)
