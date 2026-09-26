from pathlib import Path
import subprocess, tempfile, hashlib, re, sys, json
root=Path(__file__).resolve().parents[1]
app=(root/'app.js').read_text()
base=(root/'app_v35175_baseline.js').read_text()
idx=(root/'app/src/main/assets/index.html').read_text()
checks=[]
def ck(name, cond):
    checks.append((name,bool(cond)))
    print(('PASS' if cond else 'FAIL'), name)

def func_line(src,name):
    starts=[src.find('function '+name+'('),src.find('async function '+name+'(')]
    starts=[p for p in starts if p>=0]
    if not starts:return None
    p=min(starts)
    q=src.find('\nfunction ',p+1); qa=src.find('\nasync function ',p+1)
    ends=[x for x in (q,qa) if x>=0]
    e=min(ends) if ends else len(src)
    return src[p:e]

# release identity / embedding
ck('version 3.6.3 / code 113', "EXPORT_V47_VERSION='3.6.3',EXPORT_V47_CODE=113" in app)
ck('gradle version', 'versionCode 113' in (root/'app/build.gradle').read_text() and "versionName '3.6.3'" in (root/'app/build.gradle').read_text())
ck('visible header v3.6.3', 'v3.6.3</div>' in idx and 'v3.5.1_75</div>' not in idx)
ck('canonical app embedded exactly once', idx.count(app)==1)
ck('node syntax', subprocess.run(['node','--check',str(root/'app.js')],capture_output=True).returncode==0)

# tab + engine
for needle,label in [
    ('data-page="volatility"','volatility nav'),('id="volatility" class="page"','volatility page'),
    ('VOLATILITY_ALARM_METHOD_V361','alarm method'),('function volatilityAlarmFromMetricsV361','alarm engine'),
    ('function renderVolatilityV361','volatility renderer'),('function ensureVolatilityV361','lazy sector loader')]:
    ck(label, needle in (idx if needle.startswith(('data-page','id=')) else app))
ck('Energy sector explicitly covered', "{s:'XLE',n:'Energy'}" in app)
ck('all 11 US sector proxies covered', all(("{s:'%s'"%s) in app for s in ['XLK','XLE','XLF','XLV','XLI','XLP','XLY','XLU','XLB','XLRE','XLC']))

# badges in all requested renderer classes
for fn in ['sp500StockRow','companyRowHtml','etfRow','marketCard','industrySectionInner','capitalRotationRepRowV71']:
    txt=func_line(app,fn) or ''
    ck(fn+' has volatility alarm', 'volatilityAlarm' in txt)
ck('stock shell has detailed alarm', 'volatilityAlarmExplainV361' in (func_line(app,'stockDetailShell') or ''))
ck('stock detail has detailed alarm', 'volatilityAlarmExplainV361' in (func_line(app,'stockDetailHtml') or ''))
ck('market detail has detailed alarm', 'volatilityAlarmExplainV361' in (func_line(app,'openMarket') or '') and 'volAlarm=marketVolatilityAlarmV361(c)' in (func_line(app,'openMarket') or ''))

# semantics: high vol alone cannot be HIGH RISK; no fake decline probabilities
engine=func_line(app,'volatilityAlarmFromMetricsV361') or ''
ck('high-vol-only branch exists', "level='volonly'" in engine and "VISOKA VOL. · BEZ POTVRDE PADA" in engine)
ck('HIGH RISK requires downside threshold', "downsideScore>=78" in engine)
ck('no user-facing calibrated downside probability', not re.search(r'(stress probability\s*[:=]|probability of decline\s*[:=]|vjerojatnost pada\s*[:=])', app, re.I))
ck('qualitative horizon disclosed', "VOLATILITY_ALARM_HORIZON_V361='1–4W'" in app)

# company summary adds RV60 but existing company risk formula is protected
ck('RV60 persisted in company summaries', 'rv60:annualizedVolatility(series,60)' in (func_line(app,'companyFromSeries') or ''))

# runtime logic sanity test from actual engine function
runtime = r'''
const L=(a,b)=>a;
const avg=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};
function weightedCompanyScore(parts,weights){let n=0,d=0;for(const[k,w]of Object.entries(weights)){let v=parts[k];if(Number.isFinite(v)){n+=v*w;d+=w}}return d?Math.round(n/d):null}
function adverseMomentumRisk(v){if(!Number.isFinite(v))return null;return v>=5?15:v>=1?25:v>=-2?45:v>=-6?65:82}
function companyDrawdownRisk(v){if(!Number.isFinite(v))return null;let d=Math.abs(Math.min(0,v));return d<5?18:d<10?32:d<20?50:d<30?68:d<45?82:92}
function companyVolatilityRisk(v){if(!Number.isFinite(v))return null;return v<15?18:v<25?35:v<40?55:v<60?72:88}
function volAccelerationRiskV361(rv20,rv60){if(!Number.isFinite(rv20)||!Number.isFinite(rv60)||rv60<=0)return null;let q=rv20/rv60;return q<.82?18:q<.95?30:q<1.08?45:q<1.25?60:q<1.5?75:90}
function volatilityTrendV361(rv20,rv60){if(!Number.isFinite(rv20)||!Number.isFinite(rv60)||rv60<=0)return'N/A';let q=rv20/rv60;return q>=1.12?'RISING':q<=.88?'FALLING':'STABLE'}
function rv60FromSeriesV361(){return null} function ewmaVolatilityV361(){return null}
const VOLATILITY_ALARM_HORIZON_V361='1–4W',VOLATILITY_ALARM_METHOD_V361='VA1.0';
'''+engine+r'''
let highVolNoDown=volatilityAlarmFromMetricsV361({rv20:75,rv60:35,m1:8,m3:16,draw52:-3,dist50:6,dist200:12});
let highDown=volatilityAlarmFromMetricsV361({rv20:62,rv60:35,m1:-12,m3:-24,draw52:-38,dist50:-15,dist200:-22});
let low=volatilityAlarmFromMetricsV361({rv20:12,rv60:13,m1:5,m3:12,draw52:-2,dist50:5,dist200:10});
console.log(JSON.stringify({highVolNoDown,highDown,low}));
'''
try:
    out=subprocess.check_output(['node','-e',runtime],text=True)
    r=json.loads(out.strip().splitlines()[-1])
    ck('runtime high vol without downside is not red high risk', r['highVolNoDown']['level']=='volonly')
    ck('runtime severe downside becomes high/elevated', r['highDown']['level'] in ('high','elevated'))
    ck('runtime benign case is low/watch, not high', r['low']['level'] in ('low','watch'))
except Exception as e:
    print('runtime error',e)
    ck('runtime alarm sanity',False)

# protected functions must remain byte-identical with v3.5.1.75
protected=['globalRiskModelV65','capitalRotationRegimeV70','capitalStressTypeV70','capitalRotationAssetScoreV70','capitalRotationSnapshotV70','ensureCapitalRotationV70','buildCountries','renderEarly','buildMacroCycle','renderMacroCycle','renderCommodities','buildCrossAsset','scoreAuditSnapshotV56','fred']
for n in protected:
    ck('protected '+n, func_line(base,n)==func_line(app,n))

passed=sum(v for _,v in checks)
print(f'RESULT {passed}/{len(checks)} PASS')
if passed!=len(checks): sys.exit(1)
