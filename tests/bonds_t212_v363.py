from pathlib import Path
import re, hashlib, sys
root=Path(__file__).resolve().parents[1]
app=(root/'app.js').read_text()
idx=(root/'app/src/main/assets/index.html').read_text()
base=(root/'app_v35175_baseline.js').read_text()
checks=[]
def ck(name,cond):
    checks.append((name,bool(cond)))
    if not cond: print('FAIL',name)

def func(src,name):
    pos=src.find('function '+name+'(')
    if pos<0: return None
    b=src.find('{',pos); depth=0; quote=None; esc=False; template=False
    i=b
    while i<len(src):
        c=src[i]
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
        elif template:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c=='`': template=False
        else:
            if c in "'\"": quote=c
            elif c=='`': template=True
            elif c=='{': depth+=1
            elif c=='}':
                depth-=1
                if depth==0:return src[pos:i+1]
        i+=1
    return None
protected=['globalRiskModelV65','capitalRotationRegimeV70','capitalStressTypeV70','capitalRotationAssetScoreV70','capitalRotationSnapshotV70','ensureCapitalRotationV70','buildCountries','renderEarly','buildMacroCycle','renderMacroCycle','renderCommodities','buildCrossAsset','scoreAuditSnapshotV56','fred']
for n in protected:
    ck('protected '+n,func(app,n)==func(base,n))
ck('current release identity',"EXPORT_V47_VERSION='3.6.3',EXPORT_V47_CODE=113" in app)
ck('bonds nav','data-page="bonds"' in idx and 'id="bonds" class="page"' in idx)
ck('bonds renderer','function renderBondsV75' in app and 'function ensureBondsV75' in app)
for sid in ['DGS3MO','DGS2','DGS5','DGS10','DGS30','DFII5','DFII10','T5YIE','T10YIE','BAMLC0A0CM','BAMLH0A0HYM2','BAMLHE00EHYIOAS','IRLTLT01FRM156N','IRLTLT01ITM156N','IRLTLT01ESM156N','IRLTLT01GBM156N','IRLTLT01JPM156N']:
    ck('series '+sid,sid in app)
for sid in ['A610.000000WT0202','A620.000000WT0505','A630.000000WT1010','A640.000000WT3030']:
    ck('Bundesbank '+sid,sid in app)
for etf in ['SGOV','SHY','IEF','TLT','TIP','LQD','HYG','VAGF.L']:
    ck('ETF '+etf,re.search(r"s:'"+re.escape(etf)+r"'",app) is not None)
ck('no numeric bond score','Bond Risk Score' not in app and 'bondScoreV75' not in app)
ck('T212 badge hidden',"function trading212BadgeV74(symbol){if(!trading212ConfiguredV74()||!['ready','loading'].includes(trading212V74.status))return'';" in app)
ck('T212 secure indexeddb','t212FallbackSaveV75' in app and "name:'AES-GCM'" in app and 'indexedDB.open' in app)
ck('T212 no plaintext localstorage credentials',not re.search(r"localStorage\.setItem\([^\n]*(t212|Trading212).*(key|secret)",app,re.I))
ck('T212 test hidden initial','id="testT212SettingsBtnV73"' in idx and 'data-t212-refresh style="display:none"' in idx)
ck('T212 remove hidden initial','data-t212-clear style="display:none"' in idx)
ck('T212 hidden dynamically',"test.style.display=configured?'':'none'" in app and "clear.style.display=configured?'':'none'" in app)
ck('T212 uses instruments','/api/v0/equity/metadata/instruments' in app)
ck('T212 not positions','/api/v0/equity/positions' not in app)
ck('source app embedded',idx.count(app)==1)
# new tab must not contaminate risk model names
ck('bond early read only','bondEarlyContextV75' in app and 'earlyWarningLayersV52' in func(app,'bondEarlyContextV75'))
ck('Bundesbank provider',"return'Deutsche Bundesbank'" in app)
passed=sum(v for _,v in checks)
print(f'{passed}/{len(checks)} PASS')
if passed!=len(checks): sys.exit(1)
