'use strict';
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('app.js','utf8'), lines=src.split('\n');
let pass=0,fail=0;
function ok(name,cond,detail=''){if(cond){console.log('PASS',name);pass++}else{console.error('FAIL',name,detail);fail++}}
function context(extra={}){let c={console,Date,Math,Number,JSON,String,Promise,Set,Map,Array,Object,WeakSet,...extra};vm.createContext(c);return c}
function lineFn(c,name){let l=lines.find(x=>x.startsWith('function '+name+'(')||x.startsWith('async function '+name+'('));if(!l)throw Error('missing '+name);vm.runInContext(l,c);return l}
function fnText(name){let l=lines.find(x=>x.startsWith('function '+name+'(')||x.startsWith('async function '+name+'('));if(!l)throw Error('missing '+name);return l}
(async()=>{
  // F10 shared references are not cycles; true cycles still stop safely.
  let c=context({EXPORT_SECRET_KEY_V47:/pass(word)?|secret|token|api.?key/i});lineFn(c,'sanitizeExportV47');let shared={value:42};let clean=c.sanitizeExportV47({a:shared,b:shared});ok('F10 shared reference preserved',clean.a.value===42&&clean.b.value===42&&clean.b!=='[Circular]',JSON.stringify(clean));let cyc={x:1};cyc.self=cyc;ok('F10 true cycle contained',c.sanitizeExportV47(cyc).self==='[Circular]');

  // F05 strict dates / numbers / null normalization.
  c=context();lineFn(c,'strictIsoDateV38');lineFn(c,'zseDate');lineFn(c,'zseNumber');lineFn(c,'methodLatestDateV67');
  ok('F05 invalid CROBEX date rejected',c.zseDate('2026-31-08')===null,c.zseDate('2026-31-08'));
  ok('F05 Croatian D.M.Y date accepted',c.zseDate('31.08.2026')==='2026-08-31',c.zseDate('31.08.2026'));
  ok('F05 empty ZSE number remains missing',c.zseNumber('')===null,c.zseNumber(''));
  ok('F05 EU decimal format parsed',Math.abs(c.zseNumber('4.400,57')-4400.57)<1e-9,c.zseNumber('4.400,57'));
  ok('F05 ISO decimal parsed without x1000 heuristic',Math.abs(c.zseNumber('4.40057')-4.40057)<1e-9,c.zseNumber('4.40057'));
  ok('F05 invalid date cannot win latest-date sort',c.methodLatestDateV67(['2026-09-25','2026-31-08'])==='2026-09-25');
  lineFn(c,'validationNormalizeSeriesV64');lineFn(c,'capitalRotationDailyNormalizeSeriesV115');
  ok('F05 validation null does not become zero',c.validationNormalizeSeriesV64([{d:'2026-09-25',value:null}]).length===0);
  ok('F05 rotation null does not become zero',c.capitalRotationDailyNormalizeSeriesV115([{d:'2026-09-25',v:null}]).length===0);
  ok('F05 legitimate zero survives normalization',c.capitalRotationDailyNormalizeSeriesV115([{d:'2026-09-25',v:0}])[0].v===0);

  // F06 freshness / eligibility is explicit and fail-closed.
  c=context({FRED_RELEASE_RULES_V49:{}});lineFn(c,'strictIsoDateV38');lineFn(c,'normalizeFrequencyV49');lineFn(c,'addUtcDaysV49');lineFn(c,'freshnessUsableV50');lineFn(c,'freshnessModelV49');
  let future=c.freshnessModelV49({observationDate:'2030-01-01',frequency:'daily',nowMs:Date.parse('2026-09-26T12:00:00Z')});
  ok('F06 future observation rejected',future.freshnessStatus==='UNKNOWN'&&future.eligibleForCurrentScore===false,JSON.stringify(future));
  let annual=c.freshnessModelV49({observationDate:'2010-12-31',frequency:'annual',nowMs:Date.parse('2026-09-26T12:00:00Z')});
  ok('F06 unverified ancient annual observation rejected',annual.freshnessStatus==='UNKNOWN'&&annual.eligibleForCurrentScore===false,JSON.stringify(annual));
  let verified=c.freshnessModelV49({observationDate:'2025-12-31',frequency:'annual',latestReleaseVerified:true,nowMs:Date.parse('2026-09-26T12:00:00Z')});
  ok('F06 verified latest annual release can remain eligible',verified.eligibleForCurrentScore===true,JSON.stringify(verified));
  c.avg=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};lineFn(c,'factorRecordV53');
  ok('F06 stale factor excluded from aggregate',c.factorRecordV53('a','a',10,[{score:90,freshnessRatio:0},{score:10,freshnessRatio:1}]).score===10);

  // F05/F06 commodity helper rejects undated current observations.
  c=context();lineFn(c,'strictIsoDateV38');lineFn(c,'commodityFreshDate');lineFn(c,'unavailableCommodityField');lineFn(c,'parsedCommodityField');
  ok('F05/F06 undated commodity is not live',c.parsedCommodityField({latest:42,date:null}).live===false);

  // F03 Bonds must fail closed.
  c=context();lineFn(c,'bondSlopeV75');lineFn(c,'bondCurveClassV75');lineFn(c,'bondRegimeV75');
  ok('F03 empty bond curve N/A',c.bondCurveClassV75({}).shape==='N/A',c.bondCurveClassV75({}).shape);
  ok('F03 one-slope bond curve PARTIAL',c.bondCurveClassV75({US10:{value:4},US2:{value:3}}).shape==='PARTIAL',c.bondCurveClassV75({US10:{value:4},US2:{value:3}}).shape);
  ok('F03 empty bond regime N/A',c.bondRegimeV75({us:{},sovereign:{},credit:{},real:{},curve:{}})==='N/A');

  // F02 stale cache has a hard maximum age.
  c=context({responseCache:new Map(),HTTP_STALE_HARD_LIMIT_V38:7*86400000,providerTtl:()=>1000,cachePersistent:()=>false,safeGet:()=>null});lineFn(c,'readHttpCache');
  c.responseCache.set('json|https://example.test',{ts:Date.now()-8*86400000,data:{old:true}});
  ok('F02 ancient in-memory stale cache expires',c.readHttpCache('https://example.test','json',true)===null);
  c.responseCache.set('json|https://example.test',{ts:Date.now()-2*86400000,data:{cached:true}});
  let cached=c.readHttpCache('https://example.test','json',true);ok('F02 allowable cache preserves source timestamp',!!cached&&cached.sourceRetrievedAt!==cached.readAt&&cached.source==='memory',JSON.stringify(cached));

  // F01 current-energy quote eligibility is separate from retained history.
  c=context({FRED_RELEASE_RULES_V49:{}});lineFn(c,'strictIsoDateV38');lineFn(c,'normalizeFrequencyV49');lineFn(c,'addUtcDaysV49');lineFn(c,'freshnessUsableV50');lineFn(c,'freshnessModelV49');lineFn(c,'sourceMeta');lineFn(c,'v20ValidSeries');lineFn(c,'energyQuoteEligibilityV38');
  let old=[{d:'2020-01-01',v:60},{d:'2020-01-08',v:60}];old.meta={seriesId:'DCOILWTICO',sourceRetrievedAt:'2020-01-09T00:00:00Z',transport:'CACHE'};
  let gate=c.energyQuoteEligibilityV38(old,Date.parse('2026-09-26T12:00:00Z'));ok('F01 old energy history not eligible as current quote',gate.eligible===false&&gate.observationDate==='2020-01-08',JSON.stringify(gate));
  let energyHtml=fnText('energyPriceHtmlV24');ok('F01 refresh failure disclosed with retained history',/Refresh failed|Osvježavanje nije uspjelo/.test(energyHtml)&&/not eligible as a current quote/.test(energyHtml),energyHtml.slice(0,250));

  // F07 paired EU numerator/denominator only.
  let eu=src.slice(src.indexOf('function gasPhysicalMetricsV61('),src.indexOf('function usGasPhysicalSnapshotV61('));
  c=context({commodityV19:{euGas:{data:{current:{stock:800,capacity:1000,fill:80,d:'2026-09-24'},seasonal:{}}}},commodityV40:{euGasCountries:{data:{totals:{stored:100,consumption:500,consumptionReliable:true,consumptionCountries:1,storedCountries:1}}}},COMMODITY_PHYSICAL_METHOD_V61:'TEST'});vm.runInContext(eu,c);ok('F07 mismatched EU gas scope rejected',c.euGasPhysicalSnapshotV61().daysOfDemandCoverage===null,JSON.stringify(c.euGasPhysicalSnapshotV61()));
  c.commodityV40.euGasCountries.data.totals={storedWithConsumption:100,consumption:500,consumptionReliable:true,consumptionCountries:1,storedCountries:1};ok('F07 compatible paired EU scope computes 73 days',Math.abs(c.euGasPhysicalSnapshotV61().daysOfDemandCoverage-73)<1e-9,c.euGasPhysicalSnapshotV61().daysOfDemandCoverage);

  // F08 dividend history minimum gate.
  c=context({L:(hr,en)=>en,clamp:(v,a=0,b=100)=>Math.max(a,Math.min(b,v))});for(const n of ['weightedCompanyScore','dividendValidEvents','dividendMedian','dividendFrequency','dividendAnnualTotals','dividendCagr'])lineFn(c,n);vm.runInContext(src.slice(src.indexOf('function dividendHistoryStats('),src.indexOf('function dividendSummaryFromSeries(')),c);
  let one=c.dividendSafety({metrics:{value:100,coreRisk:10},meta:{dividends:[{d:new Date().toISOString().slice(0,10),amount:2}]}});ok('F08 one dividend cannot produce GOOD/HIGH',one.score===null&&one.eligibleForSafetyScore===false&&!['GOOD','HIGH'].includes(one.label),JSON.stringify(one));
  const t212=fs.readFileSync('app/src/main/assets/t212_portfolio_v363.js','utf8');let tc=context({tr:(hr,en)=>en,fmtPctN:String,fmtN:(v,n)=>Number(v).toFixed(n)});let rstart=t212.indexOf('function reasonsFor('),rend=t212.indexOf('function triggersFor(');vm.runInContext(t212.slice(rstart,rend),tc);let reasons=tc.reasonsFor({fundamentals:{},scores:{quality:null,valuation:null,growth:null,balance:null,cashFlow:null,risk:null,portfolioFit:null},position:{weight:null}});ok('F08 missing T212 fundamentals create no adverse claim',!reasons.some(x=>/elevated valuation|weak or slowing|elevated leverage|weak cash-flow|volatility|concentration/i.test(x)),JSON.stringify(reasons));

  // F04/F12 Global Shortage integration: old observations/cache excluded; decimal band contract.
  function shortage(overrides={}){let v=context({window:{},document:{getElementById:()=>null,addEventListener:()=>{},head:{appendChild:()=>{}},createElement:()=>({})},localStorage:{getItem:()=>null,setItem:()=>{}},...overrides});v.window.window=v.window;vm.runInContext(fs.readFileSync('app/src/main/assets/global_shortage_v369.js','utf8'),v);return v.window.GlobalShortageV369}
  let m=shortage({ensureUsOilV24:async()=>({stocks:{date:'2020-01-01',distillate:{current:70,previous:100,yearAgo:100},jet:{current:70,previous:100,yearAgo:100}},retrievedAt:'2020-01-02T00:00:00Z'}),ensureUsGasV24:async()=>{throw Error('offline')},agsiKeyConfigured:()=>false});await m.init();let diesel=m.state.items.find(x=>x.id==='diesel');ok('F04 old shortage observation not scored',diesel.score===null&&diesel.status==='N/A',JSON.stringify(diesel));
  let oldSnap={version:'GS1.0',generatedAt:'2020-01-02T00:00:00Z',sourcesOk:1,sourcesFailed:0,items:[{id:'diesel',name:'Diesel',category:'Energy / Refined Products',score:80,status:'CRITICAL',confidence:'MEDIUM',evidence:[],observation:'2020-01-01'}]};m=shortage({localStorage:{getItem:()=>JSON.stringify(oldSnap),setItem:()=>{}},ensureUsOilV24:async()=>{throw Error('offline')},ensureUsGasV24:async()=>{throw Error('offline')},agsiKeyConfigured:()=>false});await m.init();diesel=m.state.items.find(x=>x.id==='diesel');ok('F04 expired shortage cache not scored',diesel.score===null&&diesel.status==='N/A',JSON.stringify(diesel));ok('F12 decimal 19.5 is NORMAL',m.statusForScore(19.5)==='NORMAL',m.statusForScore(19.5));ok('F12 20.0 begins WATCH',m.statusForScore(20)==='WATCH',m.statusForScore(20));
  m=shortage({ensureUsOilV24:async()=>{throw Error('offline')},ensureUsGasV24:async()=>{throw Error('offline')},agsiKeyConfigured:()=>false});await m.init();let sum=m.getSnapshot().summary;ok('F04 empty shortage remains N/A/null',sum.headlineStatus==='N/A'&&sum.score===null,JSON.stringify(sum));

  // F09/F11 audit/export contract: source checks plus real sanitizer test above.
  const ca=fnText('commodityAuditRowsV47'),ga=fnText('globalRiskAuditRowsV47');
  ok('F09 commodity export uses metric-level physical paths',/od\.date/.test(ca)&&/gw\.date/.test(ca)&&/ec\.d/.test(ca)&&/sourceRetrievedAt/.test(ca));
  ok('F09 export does not synthesize retrievedAt at export time',!ca.includes('new Date('),ca.slice(0,220));
  ok('F11 GA2 export separates legacy rows',ga.includes("model:'PHASE5_LEGACY'")&&ga.includes('differenceFromPhase5')&&ga.includes("model:'GA2_CURRENT'"));
  let fiscalFn=fnText('fiscalCountryDetailHtmlV43');ok('F11 fiscal structural description matches GA2 architecture',/GA2 structural layer/.test(fiscalFn)&&!/Structural sovereign\/fiscal layer — excluded/.test(fiscalFn),fiscalFn.slice(0,260));

  // F13 release identity / versioned test contract.
  let gradle=fs.readFileSync('app/build.gradle','utf8');ok('F13 release identity is 3.8 / 121',/versionCode\s+121/.test(gradle)&&/versionName\s+'3\.8'/.test(gradle));
  ok('F13 package id unchanged',/applicationId\s+'com\.marko\.marketrisk\.globalplus'/.test(gradle));

  console.log(`RESULT ${pass}/${pass+fail} passed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
