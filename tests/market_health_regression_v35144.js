'use strict';
const fs=require('fs');
const vm=require('vm');
const src=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const lines=src.split(/\r?\n/);
function lineStarting(prefix){const l=lines.find(x=>x.startsWith(prefix)); if(!l)throw new Error('Missing source line: '+prefix); return l;}
const code=[
  lineStarting('function avg('),
  lineStarting('function riskBand('),
  lineStarting('function equityGlobalEligibilityV42('),
  lineStarting('const EQUITY_GLOBAL_MIN_COVERAGE_PCT_V42='),
  lineStarting('function aggregateEquityInternalsV42('),
  lineStarting('function unavailableEquityInternalsV42(')
].join('\n')+`\nthis.__v42={avg,riskBand,equityGlobalEligibilityV42,aggregateEquityInternalsV42,unavailableEquityInternalsV42,EQUITY_GLOBAL_MIN_COVERAGE_PCT_V42};`;
const ctx={Number,Math}; vm.createContext(ctx); vm.runInContext(code,ctx);
const {riskBand,equityGlobalEligibilityV42,aggregateEquityInternalsV42,unavailableEquityInternalsV42,EQUITY_GLOBAL_MIN_COVERAGE_PCT_V42}=ctx.__v42;
let pass=0,fail=0;
function ok(cond,msg){if(cond){console.log('PASS - '+msg);pass++;}else{console.error('FAIL - '+msg);fail++;}}
function series(n){return Array.from({length:n},(_,i)=>({d:`2026-01-${String((i%28)+1).padStart(2,'0')}`,v:100+i}));}
function market(code,n=80){return {code,series:series(n)};}
function rec(score=40,coverage=80,extra={}){return {score,coverage,regime:'MIXED',...extra};}

// Norway source validity / status semantics.
ok(src.includes("code:'NO'") && src.includes("symbol:'OSEAX.OL'"),'Norway uses Yahoo Oslo All-share ticker OSEAX.OL');
ok(!src.includes("symbol:'^OSEAX'"),'obsolete Norway ^OSEAX ticker removed');
ok(riskBand(50).label==='ORANGE' && riskBand(null).label==='N/A','orange remains a real score band; missing data maps to neutral N/A');
ok(src.includes("limitedData=!!c.limited||!m"),'market card uses LIMITED DATA when headline market metrics are absent');

// Scenario A: 36 valid markets.
let countries=Array.from({length:36},(_,i)=>market('M'+i));
let by=Object.fromEntries(countries.map(c=>[c.code,rec(40,80)]));
let a=aggregateEquityInternalsV42(countries,by);
ok(a.score===40 && a.validMarkets===36 && a.totalMarkets===36,'Scenario A: 36 valid markets produce valid Global Market Health');

// Scenario B: Bosnia / one limited market cannot poison denominator.
let ba={code:'BA',series:[]};
let b=aggregateEquityInternalsV42([...countries,ba],{...by,BA:unavailableEquityInternalsV42(ba,'INSUFFICIENT_HISTORY')});
ok(b.score===a.score && b.validMarkets===36 && b.totalMarkets===37,'Scenario B: Bosnia missing internals does not alter valid aggregate score');
ok(b.limitedMarkets.some(x=>x.code==='BA'),'Bosnia is explicitly classified as limited/ineligible for the affected aggregate');

// Scenario C: NaN cannot propagate.
let byNaN={...by,M0:rec(NaN,80)};
let c=aggregateEquityInternalsV42(countries,byNaN);
ok(Number.isFinite(c.score) && c.validMarkets===35,'Scenario C: NaN market score is excluded and cannot propagate globally');

// Scenario D: zero observations excluded.
let z=[...countries.slice(0,35),{code:'ZERO',series:[]}];
let bz={...Object.fromEntries(countries.slice(0,35).map(x=>[x.code,rec(41,75)])),ZERO:rec(90,90)};
let d=aggregateEquityInternalsV42(z,bz);
ok(d.validMarkets===35 && d.limitedMarkets.some(x=>x.code==='ZERO'&&x.reason==='INSUFFICIENT_HISTORY'),'Scenario D: zero-history market excluded even if a stray score exists');

// Scenario E: genuinely insufficient global coverage -> N/A.
let sparse=Array.from({length:37},(_,i)=>market('S'+i,i<14?80:0));
let sparseBy=Object.fromEntries(sparse.map((x,i)=>[x.code,i<14?rec(35,70):unavailableEquityInternalsV42(x,'INSUFFICIENT_HISTORY')]));
let e=aggregateEquityInternalsV42(sparse,sparseBy);
ok(EQUITY_GLOBAL_MIN_COVERAGE_PCT_V42===40 && e.minimumMarkets===15 && e.validMarkets===14 && e.score===null,'Scenario E: <40% valid-market coverage yields Global Market Health N/A');

// Fault isolation metadata.
let errCountries=[market('A'),market('BAD'),market('C')];
let errBy={A:rec(30,80),BAD:{...unavailableEquityInternalsV42(null,'MARKET_INTERNAL_ERROR','boom'),error:'boom'},C:rec(50,80)};
let er=aggregateEquityInternalsV42(errCountries,errBy);
ok(er.errorMarkets.includes('BAD') && Number.isFinite(er.score),'per-market internal error is isolated and successful markets remain usable');

// Eligibility minimums.
let el=equityGlobalEligibilityV42(market('X',59),rec(30,80));
ok(!el.eligible && el.reason==='INSUFFICIENT_HISTORY','per-market global-health eligibility requires >=60 valid observations');

// Bosnia config is intentionally limited, not fabricated.
ok(src.includes("code:'BA'") && src.includes("provider:'sase'") && src.includes("limited:true"),'Bosnia remains an explicit limited-data SASE market');

// Overview redesign / no duplicated market grid.
ok(!html.includes('id="overviewMarkets"'),'Overview no longer contains duplicated full markets list');
for(const id of ['overviewAttention','overviewMarketsSummary','overviewMarketHealth','overviewEarly','overviewMacro','overviewCorrelation','overviewCommodities','overviewEquity','overviewRiskDrivers'])
  ok(html.includes(`id="${id}"`),`Overview contains ${id} executive card`);
ok(src.includes("commodityV40.euGasCountries.data.items") && src.includes('deGas.consumptionFull'),'Overview reuses loaded Germany AGSI storage coverage from v3.5.1.41 data shape');
const renderOverviewLine=lineStarting('function renderOverview(');
ok(!/fetchWithTimeout|\byahoo\(|\bensure[A-Z]/.test(renderOverviewLine),'Overview presentation adds no new direct network/fetch calls');
ok(html.includes('.eq-na-compact') && html.includes('.overview-empty'),'compact N/A / insufficient-data presentation exists');
ok(html.includes('status-limited'),'neutral LIMITED DATA status styling retained');
ok(src.includes("[data-overview-nav]") && src.includes('navTo(b.dataset.overviewNav)'),'Overview detail buttons reuse existing navigation');

// Canonical source embedding and version.
ok(html.split("<script>'use strict';").length-1===1,'canonical application script embedded exactly once');
ok(html.includes('v3.5.1_44'),'user-visible version label updated to v3.5.1_44');
ok(src.includes("window.MRMV42Diagnostics"),'Norway/Bosnia diagnostics exposed internally without normal UI clutter');
ok(src.includes('validMarkets:s.equity.validMarkets') && src.includes('minimumMarkets:s.equity.minimumMarkets'),'Global Market Health eligibility metadata survives snapshot persistence');

console.log(`RESULT - ${pass}/${pass+fail} v3.5.1.44 market-health/Overview regression checks PASS`);
if(fail)process.exit(1);
