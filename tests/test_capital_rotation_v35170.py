from pathlib import Path
import re, subprocess, textwrap, json, sys
src=Path('/mnt/data/mrm70_work/app.js').read_text()
a=src.index('/* v3.5.1.70 · CAPITAL ROTATION')
b=src.index('function renderAll(){',a)
mod=src[a:b]
pre=r'''
'use strict';
let currentLang='en';
const store={};
function safeGet(k){return store[k]||null} function safeSet(k,v){store[k]=v}
function L(hr,en){return currentLang==='hr'?hr:en}
function avg(a){let x=a.filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null}
function clamp(v,a=0,b=100){return Math.max(a,Math.min(b,v))}
function fmt(v,d=1){return Number.isFinite(v)?Number(v).toFixed(d):'N/A'}
function esc(s){return String(s??'')}
function $(id){return null}
async function mapLimit(items,limit,worker){return Promise.all(items.map(worker))}
async function yahoo(){throw new Error('stub')}
function marketMetrics(s){if(!s||s.length<5)return null;let a=s.at(-1),b=s.at(-2);return {date:a.d,value:a.v,d1:(a.v/b.v-1)*100,m1:2,m3:4,y1:6,dist50:1,dist200:2,draw52:-3,rv20:18}}
let appState={countries:[],global:null,early:[],corrSystemic:{average:.65},corr:null};
'''
post=r'''
function assert(c,m){if(!c)throw new Error(m)}
// Gate: missing Early Warning must never fabricate projection.
appState.global={layersV65:{leadingWarning:{score:null,eligible:false,coveragePct:0},currentCondition:{score:60},structuralVulnerability:{score:60},contagionAmplifier:{score:70}}};
let r=capitalRotationRegimeV70();assert(!r.eligible&&r.score===null,'EW gate failed');
// Risk-off growth shock: TLT should be more constructive than HY.
appState.global={layersV65:{leadingWarning:{score:80,eligible:true,coveragePct:100},currentCondition:{score:70},structuralVulnerability:{score:60},contagionAmplifier:{score:75}}};
appState.early=[{name:'Initial Claims recession growth',score:85},{name:'Building Permits growth',score:80}];
for(const d of CAPITAL_ROTATION_UNIVERSE_V70){capitalRotationV70.assets[d.id]={metric:{date:'2026-09-15',m1:2,m3:4,rv20:18},status:'LIVE'}}
r=capitalRotationRegimeV70();let st=capitalStressTypeV70();assert(r.eligible&&st.key==='GROWTH','growth regime classification failed');
let tlt=capitalRotationAssetScoreV70(CAPITAL_ROTATION_UNIVERSE_V70.find(x=>x.id==='longTreasury'),r,st);
let hy=capitalRotationAssetScoreV70(CAPITAL_ROTATION_UNIVERSE_V70.find(x=>x.id==='highYield'),r,st);
assert(tlt.score>hy.score,'growth-shock differentiation failed');
assert(hy.score<0,'HY outflow pressure expected under stress');
// Inflation shock: long duration must not be automatically positive.
appState.early=[{name:'CPI inflation pressure',score:88},{name:'PCE inflation',score:84}];
st=capitalStressTypeV70();assert(st.key==='INFLATION','inflation classification failed');
tlt=capitalRotationAssetScoreV70(CAPITAL_ROTATION_UNIVERSE_V70.find(x=>x.id==='longTreasury'),r,st);
let gold=capitalRotationAssetScoreV70(CAPITAL_ROTATION_UNIVERSE_V70.find(x=>x.id==='gold'),r,st);
assert(gold.score>tlt.score,'inflation shock should differentiate gold from long duration');
assert(tlt.score<20,'long-duration Treasuries must not receive automatic inflow bias under inflation shock');
// China regional series with only one observation must remain insufficient.
appState.countries=[{code:'CN',risk:55,series:[{d:'2026-09-15',v:100}]}];
let regs=capitalRotationRegionalV70(), cn=regs.find(x=>x.label==='China');assert(cn&&cn.score===null&&cn.status==='INSUFFICIENT DATA','China single-observation gate failed');
// Cache aggregate empty input must return null, never throw.
assert(capitalRotationAggregateMetricV70([],1)===null,'empty aggregate failed');
console.log('CAPITAL_ROTATION_V70_TESTS_PASS');
'''
js=pre+mod+post
p=Path('/mnt/data/rotation_v70_test.js'); p.write_text(js)
r=subprocess.run(['node',str(p)],capture_output=True,text=True)
print(r.stdout,end=''); print(r.stderr,end='',file=sys.stderr)
sys.exit(r.returncode)
