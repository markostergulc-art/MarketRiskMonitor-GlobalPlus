from pathlib import Path
import hashlib,re,sys,zipfile
old=Path('app.js.bak_v363').read_text()
new=Path('app.js').read_text()

def extract(src,name):
    p=src.find('function '+name+'(')
    if p<0: return None
    b=src.find('{',p); depth=0; q=None; esc=False; i=b
    while i<len(src):
        c=src[i]
        if q:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==q: q=None
        else:
            if c in "'\"`": q=c
            elif c=='{': depth+=1
            elif c=='}':
                depth-=1
                if depth==0:return src[p:i+1]
        i+=1
    return None

protected=[
 'leadingWarningLayerV65','globalRiskModelV65','buildCountries','renderEarly','renderEarlyWarning',
 'buildMacroCycle','renderMacroCycle','buildCrossAsset','scoreAuditSnapshotV56',
 'fred','ensureBondsV75','renderBondsV75','volatilityAlarmFromMetricsV361','ensureVolatilityV361','renderVolatilityV361',
 'etfRisk','dividendSafety','renderCommodities','buildCommodities','renderSP500','renderETFs'
]
# Some historical releases use slightly different function names; compare every protected name that exists in baseline.
passes=0; fails=0
for name in protected:
    a=extract(old,name); b=extract(new,name)
    if a is None:
        print('SKIP',name,'not in baseline'); continue
    if b is None:
        print('FAIL',name,'missing in current'); fails+=1; continue
    if hashlib.sha256(a.encode()).digest()==hashlib.sha256(b.encode()).digest():
        print('PASS',name,'byte-identical'); passes+=1
    else:
        print('FAIL',name,'changed'); fails+=1
# Critical independent T212 module must be byte-identical to BUILD113 source ZIP.
basezip=Path('/mnt/data/MarketRiskMonitor_GlobalPlus_v3.6.3_BUILD113_GrapheneOS_fix_source.zip')
if basezip.exists():
    with zipfile.ZipFile(basezip) as z:
        candidates=[n for n in z.namelist() if n.endswith('app/src/main/assets/t212_portfolio_v363.js')]
        if candidates:
            old_t=z.read(candidates[0]); new_t=Path('app/src/main/assets/t212_portfolio_v363.js').read_bytes()
            if old_t==new_t: print('PASS t212_portfolio_v363.js byte-identical'); passes+=1
            else: print('FAIL t212_portfolio_v363.js changed'); fails+=1
        else: print('FAIL baseline T212 module missing'); fails+=1
else:
    print('FAIL baseline source ZIP missing'); fails+=1
# Excel logic may only change release metadata. Strip expected version identity and compare.
def normalize_excel(s):
    s=re.sub(r"XLSX_VERSION_V362='[^']+'", "XLSX_VERSION_V362='VERSION'", s)
    s=re.sub(r"XLSX_VERSION_CODE_V362=\d+", "XLSX_VERSION_CODE_V362=0", s)
    s=re.sub(r"v3\.6\.\d+", "vVERSION", s)
    return s
if basezip.exists():
    with zipfile.ZipFile(basezip) as z:
        candidates=[n for n in z.namelist() if n.endswith('app/src/main/assets/excel_export_v362.js')]
        if candidates:
            a=normalize_excel(z.read(candidates[0]).decode()); b=normalize_excel(Path('app/src/main/assets/excel_export_v362.js').read_text())
            if a==b: print('PASS Excel exporter logic unchanged except version metadata'); passes+=1
            else: print('FAIL Excel exporter logic changed'); fails+=1
print(f'RESULT {passes}/{passes+fails}')
sys.exit(1 if fails else 0)
