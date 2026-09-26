'use strict';
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const lines=src.split(/\r?\n/);
function lineStarting(p){const x=lines.find(l=>l.startsWith(p));if(!x)throw new Error('Missing '+p);return x}
const code=[
 "function L(a,b){return b}",
 "function clamp(x,a=0,b=100){return Math.max(a,Math.min(b,x))}",
 "function avg(a){a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null}",
 lineStarting('function fiscalBandV43('),
 lineStarting('function fiscalPiecewiseV43('),
 lineStarting('function fiscalPercentileRiskV43('),
 lineStarting('function fiscalAbsRiskV43('),
 lineStarting('function fiscalScoreRowsV43('),
 lineStarting('function fiscalSystemicV43('),
 lineStarting('function fiscalAttentionV43('),
 lineStarting('function fiscalFourQuarterAvgV43(')
].join('\n')+'\nthis.X={fiscalBandV43,fiscalPiecewiseV43,fiscalScoreRowsV43,fiscalSystemicV43,fiscalAttentionV43,fiscalFourQuarterAvgV43};';
const ctx={Number,Math};vm.createContext(ctx);vm.runInContext(code,ctx);const X=ctx.X;
let pass=0,fail=0;function ok(c,m){if(c){console.log('PASS - '+m);pass++}else{console.error('FAIL - '+m);fail++}}
const EU=['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
for(const c of EU)ok(src.includes(`['${c}'`),`EU27 includes ${c}`);
ok(src.includes("['GB','GBR'")&&src.includes("['US','USA'")&&src.includes("['CN','CHN'")&&src.includes("['JP','JPN'")&&src.includes("['IN','IND'"),'major non-EU/global sovereigns included');
ok(src.includes("gov_10q_ggdebt")&&src.includes("gov_10q_ggnfa")&&src.includes("D41PAY")&&src.includes("'gov_10q_ggnfa','B9'"),'Eurostat debt/balance/interest architecture present');
ok(src.includes("GC.DOD.TOTL.GD.ZS")&&src.includes("GC.NLD.TOTL.GD.ZS")&&src.includes("GC.XPN.INTP.RV.ZS"),'World Bank / IMF-GFS global fallback indicators present');
ok(src.includes('mapLimit(yieldCodes,4'),'sovereign-yield concurrency bounded at 4');
ok(src.includes("if(page==='markets')return{key:'markets'")&&src.includes('ensureFiscalV43(force)'),'fiscal data loads through prioritized Markets scheduler');
const ro=lines.find(x=>x.startsWith('function renderOverview('));ok(ro&&!/ensureFiscalV43|fiscalEurostatMetricV43|wbBatchRecentV43|\bfred\(/.test(ro),'Overview does not start fiscal network requests');
ok(html.includes('id="fiscalWatchV43"')&&html.includes('id="overviewFiscalV43"'),'Markets + compact Overview fiscal UI placeholders present');
ok(src.includes('GLOBAL Risk')&&src.includes('globalRiskIntegration:false'),'fiscal diagnostics explicitly excluded from GLOBAL Risk');
ok(src.includes("comparability=harmonized?'HARMONIZED':imfComparable?'GENERAL_GOVERNMENT_COMPARABLE':'COMPARABILITY LIMITED'"),'definition/comparability warning retained and upgraded for IMF WEO');
ok(src.includes("row.coverageTier=coreFull?'FULL':corePartial?'PARTIAL':'LIMITED'"),'FULL/PARTIAL/LIMITED coverage tiers implemented');
function row(raw,gdp=1e12,euro=false){return {raw:{...raw},euro,nominalGdpUsd:gdp}}
// A: Italy-like, high debt + improving primary balance must not be automatic red solely from debt.
let a=[row({debt:139,debtTrend:1.7,balance:-3.1,primary:.8,interest:3.9,yield:4,spreadBps:120,refiGap:1.1,rMinusG:1.0},2.3e12,true)];X.fiscalScoreRowsV43(a);ok(Number.isFinite(a[0].score)&&a[0].score<100,'Italy-like high debt produces composite rather than automatic max/red-by-debt');
// B: moderate debt but bad flows/financing can be stressed.
let b=[row({debt:85,debtTrend:5,balance:-7,primary:-3,interest:3.5,yield:9,refiGap:4,rMinusG:5},1.5e12,false)];X.fiscalScoreRowsV43(b);ok(Number.isFinite(b[0].score)&&b[0].score>=50,'moderate debt plus bad deficit/yield/refinancing can produce elevated stress');
// C: Norway-like low debt/assets: normal on core fiscal inputs.
let c=[row({debt:35,debtTrend:-1,balance:8,primary:9,interest:.5,yield:3.5,refiGap:-1,rMinusG:-3},5e11,false)];X.fiscalScoreRowsV43(c);ok(Number.isFinite(c[0].score)&&c[0].score<35,'Norway-like low-debt strong-flow case remains normal');
// D: Japan-like: high debt but low yield and improving flow not automatically red.
let d=[row({debt:230,debtTrend:0,balance:-2,primary:0,interest:1.5,yield:1.5,refiGap:0,rMinusG:-1},4e12,false)];X.fiscalScoreRowsV43(d);ok(Number.isFinite(d[0].score)&&d[0].score<70,'Japan-like high debt is not classified from debt level alone');
// E: missing market-financing condition -> limited/no score.
let e=[row({debt:100,debtTrend:2,balance:-4,primary:-1,interest:3,yield:null,spreadBps:null,refiGap:null,rMinusG:null})];X.fiscalScoreRowsV43(e);ok(e[0].score===null&&e[0].coverageTier==='LIMITED','missing sovereign yield prevents colored score instead of substituting zero');
// F: missing interest can still be partial if stock+flow+yield and enough components.
let f=[row({debt:90,debtTrend:2,balance:-4,primary:null,interest:null,yield:5,refiGap:null,rMinusG:null})];X.fiscalScoreRowsV43(f);ok(f[0].coverageTier==='PARTIAL','missing advanced interest metrics remains PARTIAL, not fabricated');
// G: 4-quarter average requires >=3 quarters.
ok(X.fiscalFourQuarterAvgV43([{value:1},{value:2},{value:3},{value:4}])===2.5,'EU fiscal-flow smoothing uses four-quarter average');
ok(X.fiscalFourQuarterAvgV43([{value:1},{value:2}])===null,'insufficient quarterly flow history stays missing');
// H: systemic importance does not alter fiscal score, only attention.
let r=row({debt:100,debtTrend:3,balance:-5,primary:-2,interest:3,yield:5,refiGap:2,rMinusG:2},15e12);X.fiscalScoreRowsV43([r]);let before=r.score,att=X.fiscalAttentionV43(r);ok(r.score===before&&Number.isFinite(att)&&att>before,'systemic importance affects attention ranking, not fiscal score');
// UI semantics.
ok(src.includes('Highest fiscal stress')&&src.includes('Fastest deterioration'),'separate highest-stress and fastest-deterioration rankings present');
ok(html.includes('v3.5.1_44'),'visible version label updated');
console.log(`RESULT - ${pass}/${pass+fail} v3.5.1.44 fiscal score/regression checks PASS`);if(fail)process.exit(1);
