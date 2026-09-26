/* Market Risk Monitor Global+ v3.6.2 build 112
 * Full XLSX runtime report export.
 * Export-only feature: reads current in-memory/cache state and performs ZERO network requests.
 */
(function(){
'use strict';
const XLSX_REPORT_SCHEMA_V362='MRM-FULL-XLSX-1.0';
const XLSX_MIME_V362='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLSX_VERSION_V362='2026.09.26.3';
const XLSX_VERSION_CODE_V362=126;
const XLSX_NOTICE_V362='LIVE RUNTIME SNAPSHOT — generated only from data already loaded or cached in the application. Export triggers no network request; unavailable fields remain blank/N/A.';

function xFinite(v){return Number.isFinite(Number(v))&&v!==''&&v!==null&&v!==undefined}
function xNum(v){return xFinite(v)?Number(v):null}
function xPct(v){return xFinite(v)?Number(v)/100:null}
function xText(v){if(v===null||v===undefined)return'';if(typeof v==='string')return v;if(typeof v==='number'||typeof v==='boolean')return String(v);try{return JSON.stringify(v)}catch(_){return String(v)}}
function xJoin(v,sep=' | '){if(Array.isArray(v))return v.filter(x=>x!==null&&x!==undefined&&x!=='').map(xText).join(sep);return xText(v)}
function xIso(v){if(!v)return'';try{let d=new Date(v);return Number.isFinite(d.getTime())?d.toISOString():String(v)}catch(_){return String(v)}}
function xScoreStatus(v){let n=xNum(v);if(n===null)return'N/A';try{return riskBand(n).label}catch(_){return n<25?'GREEN':n<45?'LIGHT GREEN':n<60?'ORANGE':n<75?'DARK ORANGE':'RED'}}
function xSafe(fn,fallback=null){try{return fn()}catch(_){return fallback}}
function xObject(v){return v&&typeof v==='object'?v:{}}
function xFresh(ts){let t=Number(ts);if(!Number.isFinite(t))return'N/A';let age=Date.now()-t;return age<6*3600000?'CURRENT':age<24*3600000?'CACHED':'STALE'}
function xProviderFromRec(rec){return rec&&rec.status==='ready'?'Yahoo Finance':(rec&&rec.status==='static'?'Static metadata':'')}
function xT212(symbol){let v=xSafe(()=>trading212TradableV74(symbol),null);return v===true?'AVAILABLE':v===false?'NOT AVAILABLE':'NOT LOADED'}
function xAlarm(metrics,opts={}){return xSafe(()=>volatilityAlarmFromMetricsV361(metrics,opts),{label:'INSUFFICIENT DATA',volScore:null,downsideScore:null,confidence:'INSUFFICIENT',volTrend:'N/A',rv20:null,rv60:null,ewma:null,reasons:[],offsets:[],horizon:'1–4W'})}
function xCompanyAlarm(entry,ctx={}){return xSafe(()=>companyVolatilityAlarmV361(entry,ctx),xAlarm(null))}
function xCompanyContext(entry,ctx={}){return xSafe(()=>companyContextRisk(entry,ctx),{score:null,core:null,relative:null})}
function xAllStockEntries(){
  let map=new Map(),add=e=>{if(e&&e.s&&!map.has(e.s))map.set(e.s,e)};
  if(typeof SP500_ALL!=='undefined')SP500_ALL.forEach(add);
  if(typeof COUNTRY_LEADERS!=='undefined')Object.values(COUNTRY_LEADERS||{}).forEach(rows=>(rows||[]).forEach(add));
  if(typeof GLOBAL_INDUSTRY_LEADERS!=='undefined')Object.values(GLOBAL_INDUSTRY_LEADERS||{}).forEach(rows=>(rows||[]).forEach(add));
  let etfs=new Set(typeof ETF_UNIVERSE!=='undefined'?(ETF_UNIVERSE||[]).map(x=>x.s):[]);
  return [...map.values()].filter(e=>!etfs.has(e.s));
}
function xCompanyRec(symbol){return typeof companySummaries!=='undefined'&&companySummaries?companySummaries[symbol]:null}
function xLoadedStockRows(){
  return xAllStockEntries().map(entry=>({entry,rec:xCompanyRec(entry.s)})).filter(x=>x.rec&&x.rec.status==='ready');
}
function xEtfRows(){return typeof ETF_UNIVERSE!=='undefined'?(ETF_UNIVERSE||[]):[]}
function xSectorRows(){return typeof VOLATILITY_SECTOR_UNIVERSE_V361!=='undefined'?(VOLATILITY_SECTOR_UNIVERSE_V361||[]):[]}
function xCoverage(v){let n=xNum(v);if(n===null)return null;return n>1?n/100:n}
function xStatusFromLoad(s){let t=String(s||'').toUpperCase();if(!t)return'N/A';if(t==='READY'||t==='LIVE'||t==='AVAILABLE')return'LIVE';if(t==='CACHED')return'CACHED';if(t==='ERROR'||t==='FAILED')return'ERROR';if(t==='IDLE'||t==='NOT_LOADED')return'NOT LOADED';return t}

function buildCoverV362(){
  let g=xObject(typeof appState!=='undefined'?appState.global:null),l=xObject(g.layersV65),cur=xObject(l.currentCondition),warn=xObject(l.leadingWarning),str=xObject(l.structuralVulnerability),con=xObject(l.contagionAmplifier);
  return [
    ['Application version',XLSX_VERSION_V362,'INFO'],
    ['Version code',XLSX_VERSION_CODE_V362,'INFO'],
    ['Report schema',XLSX_REPORT_SCHEMA_V362,'INFO'],
    ['Generated',new Date().toISOString(),'INFO'],
    ['Global Risk',xNum(g.score),g.band&&g.band.label||xScoreStatus(g.score)],
    ['Current Condition',xNum(cur.score),xScoreStatus(cur.score)],
    ['Early Warning',xNum(warn.score),xScoreStatus(warn.score)],
    ['Structural Vulnerability',xNum(str.score),xScoreStatus(str.score)],
    ['Contagion',xNum(con.score),xScoreStatus(con.score)],
    ['Global Volatility',globalVolatilitySummaryV362().score,globalVolatilitySummaryV362().status]
  ];
}
function globalVolatilitySummaryV362(){
  let vals=[];
  for(const {entry,rec} of xLoadedStockRows()){let a=xCompanyAlarm(entry,{country:xSafe(()=>companyHomeCountry(entry.s),''),industry:xSafe(()=>companyIndustryTheme(entry.s),'')});if(xFinite(a.volScore))vals.push(Number(a.volScore))}
  for(const e of xEtfRows()){let r=xCompanyRec(e.s);if(r&&r.status==='ready'){let a=xAlarm(r);if(xFinite(a.volScore))vals.push(Number(a.volScore))}}
  for(const c of (typeof appState!=='undefined'&&appState.countries||[])){if(c&&c.metrics){let a=xAlarm(c.metrics,{series:c.series});if(xFinite(a.volScore))vals.push(Number(a.volScore))}}
  let score=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null;
  return{score,status:xScoreStatus(score),count:vals.length};
}
function volatilityAlarmCountsV362(){
  let counts={'HIGH RISK':0,'ELEVATED RISK':0,'WATCH':0,'LOW RISK':0,'INSUFFICIENT DATA':0,'HIGH VOL · NO DOWNSIDE CONFIRMATION':0};
  let add=a=>{let k=String(a&&a.label||'INSUFFICIENT DATA').toUpperCase();counts[k]=(counts[k]||0)+1};
  xLoadedStockRows().forEach(({entry})=>add(xCompanyAlarm(entry,{country:xSafe(()=>companyHomeCountry(entry.s),''),industry:xSafe(()=>companyIndustryTheme(entry.s),'')})));
  xEtfRows().forEach(e=>{let r=xCompanyRec(e.s);if(r&&r.status==='ready')add(xAlarm(r))});
  (typeof appState!=='undefined'&&appState.countries||[]).forEach(c=>{if(c&&c.metrics)add(xAlarm(c.metrics,{series:c.series}))});
  return counts;
}
function buildExecV362(){
  let g=xObject(typeof appState!=='undefined'?appState.global:null),l=xObject(g.layersV65),counts=volatilityAlarmCountsV362(),loaded=xLoadedStockRows().length+xEtfRows().filter(e=>{let r=xCompanyRec(e.s);return r&&r.status==='ready'}).length;
  let rows=[
    ['Global Risk',xNum(g.score),g.band&&g.band.label||xScoreStatus(g.score),xCoverage(g.effectiveCoverage),g.confidence||'',g.eligibleV50===false?'Limited by coverage/eligibility gate':'Current runtime composite','','HIGH RISK',counts['HIGH RISK']||0],
    ['Current Condition',xNum(l.currentCondition&&l.currentCondition.score),xScoreStatus(l.currentCondition&&l.currentCondition.score),xCoverage(l.currentCondition&&l.currentCondition.effectiveCoverage),g.confidence||'','GA2 current-condition layer','','ELEVATED RISK',counts['ELEVATED RISK']||0],
    ['Early Warning',xNum(l.leadingWarning&&l.leadingWarning.score),xScoreStatus(l.leadingWarning&&l.leadingWarning.score),xCoverage(l.leadingWarning&&l.leadingWarning.coveragePct),g.confidence||'','GA2 leading-warning layer','','WATCH',counts.WATCH||0],
    ['Structural Vulnerability',xNum(l.structuralVulnerability&&l.structuralVulnerability.score),xScoreStatus(l.structuralVulnerability&&l.structuralVulnerability.score),xCoverage(l.structuralVulnerability&&l.structuralVulnerability.coveragePct),g.confidence||'','GA2 structural layer','','LOW RISK',counts['LOW RISK']||0],
    ['Volatility alarms loaded',loaded,loaded?'INFO':'N/A',null,'',`Loaded stock + ETF observations: ${loaded}`,'','INSUFFICIENT DATA',counts['INSUFFICIENT DATA']||0],
    ['Global Volatility',globalVolatilitySummaryV362().score,globalVolatilitySummaryV362().status,null,'',`Average vol-pressure diagnostic across ${globalVolatilitySummaryV362().count} loaded entities`,'','HIGH VOL · NO DOWNSIDE CONFIRMATION',counts['HIGH VOL · NO DOWNSIDE CONFIRMATION']||0]
  ];
  return rows;
}
function buildGlobalRiskV362(){
  let rows=xSafe(()=>globalRiskAuditRowsV47(),[])||[];
  return rows.map(r=>[r.label||r.component,'',xNum(r.score),xPct(r.weight),xNum(r.contribution),r.status||xScoreStatus(r.score),xCoverage(r.componentCompleteness??r.effectiveCoverage),r.confidence||r.modelConfidence||'',r.component==='FINAL'?'Composite':xJoin((r.subfactors||[]).map(s=>s.provider||s.source||s.name).filter(Boolean))]);
}
function buildEarlyV362(){
  return (xSafe(()=>earlyAuditRowsV47(),[])||[]).map(r=>[r.layerRole||r.signalClass||'',r.category||r.signalClass||'',r.signal||r.name||'',xNum(r.rawValue??r.value),r.unit||'',xNum(r.score),r.status||xScoreStatus(r.score),r.direction||r.thresholdContext||'',xPct(r.weight),r.observationDate||'',r.provider||r.source||'',r.freshness||'',r.confidence||'',r.timingMeaning||r.meaning||'']);
}
function buildMarketsV362(){
  let fiscalMap=new Map((xSafe(()=>fiscalAuditRowsV47(),[])||[]).map(r=>[r.countryCode,r]));
  return (typeof appState!=='undefined'&&appState.countries||[]).filter(Boolean).map(c=>{
    let m=xObject(c.metrics),f=fiscalMap.get(c.code),a=xAlarm(m,{series:c.series}),q=xObject(c.quality),cv=xObject(c.coverageV50);
    return[c.name||c.code,c.index||'',c.symbol||'',xNum(m.value),xPct(m.d1),xPct(m.m1),xPct(m.m3),xPct(m.ytd),xPct(m.y1),xPct(m.rv20),xPct(m.draw52),xNum(c.subscores&&c.subscores.market),xNum(f&&f.structuralScore),xNum(c.risk),c.limited?'LIMITED DATA':(c.band&&c.band.label||xScoreStatus(c.risk)),xNum(a.volScore),xNum(a.downsideScore),a.label||'',a.confidence||'',q.source||c.provider||'',q.date||m.date||'',q.freshness||''];
  });
}
function buildStocksV362(){
  return xLoadedStockRows().map(({entry,rec})=>{
    let country=xSafe(()=>companyHomeCountry(entry.s),''),industry=xSafe(()=>companyIndustryTheme(entry.s),''),ctx=xCompanyContext(entry,{country,industry}),a=xCompanyAlarm(entry,{country,industry}),div=xObject(rec.dividend);
    return[entry.s,rec.name||rec.shortName||entry.n||entry.s,country,entry.sector||industry||'',rec.currency||'',xNum(rec.value),xPct(rec.d1),xPct(rec.m1),xPct(rec.m3),xPct(rec.ytd),xPct(rec.y1),xPct(rec.dist50),xPct(rec.dist200),xPct(rec.draw52),xPct(rec.rv20),xPct(rec.rv60),xNum(rec.coreRisk??rec.risk),xNum(ctx.score),xNum(a.volScore),xNum(a.downsideScore),a.label||'',a.horizon||'',a.confidence||'',xJoin(a.reasons,'; '),xJoin(a.offsets,'; '),xPct(div.ttmYield),xT212(entry.s),xStatusFromLoad(rec.status),xProviderFromRec(rec),xFresh(rec.ts)];
  });
}
function buildStockDetailV362(){
  let out=[];
  if(typeof companyDetailCache!=='undefined'&&companyDetailCache&&typeof companyDetailCache.forEach==='function')companyDetailCache.forEach((rec,symbol)=>{
    if(!rec||rec.status!=='ready')return;let m=xObject(rec.metrics),entry=xSafe(()=>companyEntryFor(symbol,rec.context||{}),{s:symbol,n:rec.name||symbol});
    out.push([symbol,rec.name||symbol,'LIVE',m.date||'',xPct(m.m6),xPct(m.rv60),xPct(m.maxDrawdown5y),xNum(m.high52),xNum(m.low52),xNum(m.coreRisk),xPct(m.dist50),xPct(m.dist200),'YES',rec.meta&&rec.meta.source||rec.meta&&rec.meta.sourceDetail||'Yahoo Finance']);
  });
  if(!out.length)out.push(['','','NOT LOADED','','','','','','','','','','NO','Open stock/ETF detail first to populate heavy 5Y fields']);
  return out;
}
function buildEtfsV362(){
  return xEtfRows().map(e=>{let r=xCompanyRec(e.s),ready=r&&r.status==='ready',a=ready?xAlarm(r):xAlarm(null),div=ready?xObject(r.dividend):{};return[e.s,e.n||e.s,e.group||'',e.benchmark||'',e.policy||'',ready?r.currency||'':'',ready?xNum(r.value):null,ready?xPct(r.d1):null,ready?xPct(r.m1):null,ready?xPct(r.m3):null,ready?xPct(r.ytd):null,ready?xPct(r.y1):null,ready?xPct(r.draw52):null,ready?xPct(r.rv20):null,ready?xPct(r.rv60):null,ready?xNum(xSafe(()=>etfRisk(e),r.coreRisk??r.risk)):null,xNum(a.volScore),xNum(a.downsideScore),a.label||'',a.confidence||'',xPct(div.ttmYield),xT212(e.s),ready?'LIVE':'NOT LOADED',ready?'Yahoo Finance':'',ready?xFresh(r.ts):''];});
}
function buildDividendsV362(){
  let rows=[],seen=new Set();
  for(const {entry,rec} of xLoadedStockRows()){let d=xObject(rec.dividend);if(!d.payer&&!xFinite(d.ttmYield)&&!xFinite(d.ttmAmount))continue;seen.add(entry.s);rows.push([entry.s,rec.name||entry.n||entry.s,'STOCK','DISTRIBUTING',d.frequency||'',xNum((d.latest&&d.latest.amount)??d.latestAmount),d.latest&&d.latest.date||d.latestDate||'',xNum(d.ttmCount),xPct(d.ttmYield),rec.currency||'',d.payer?'AVAILABLE':'LIMITED','Yahoo Finance',xFresh(rec.ts)])}
  for(const e of xEtfRows()){let rec=xCompanyRec(e.s),d=xObject(rec&&rec.dividend);if(!rec||rec.status!=='ready')continue;if(seen.has(e.s))continue;rows.push([e.s,e.n||e.s,'ETF',e.policy||'',e.frequency||d.frequency||'',xNum((d.latest&&d.latest.amount)??d.latestAmount),d.latest&&d.latest.date||d.latestDate||'',xNum(d.ttmCount),xPct(d.ttmYield),rec.currency||'',d.payer||e.policy==='DIST'?'AVAILABLE':e.policy==='ACC'?'REINVESTED':'LIMITED','Yahoo Finance',xFresh(rec.ts)])}
  if(!rows.length)rows.push(['','','','','','','','','','','NOT LOADED','','']);
  return rows;
}
function buildSectorsV362(){
  let rows=[];
  for(const e of xSectorRows()){
    let r=xCompanyRec(e.s);if(!r||r.status!=='ready')continue;let a=xAlarm(r),breadth=null;
    let stockEntries=xAllStockEntries().filter(x=>(x.sector||'')===e.n),loaded=stockEntries.map(x=>xCompanyRec(x.s)).filter(x=>x&&x.status==='ready'&&xFinite(x.m3));
    if(loaded.length)breadth=loaded.filter(x=>Number(x.m3)>0).length/loaded.length;
    rows.push(['US',e.n,e.s,xPct(r.m1),xPct(r.m3),null,xPct(r.rv20),xPct(r.draw52),breadth,null,xNum(r.coreRisk??r.risk),xNum(a.volScore),xNum(a.downsideScore),a.label||'',stockEntries.length?loaded.length/stockEntries.length:null,a.confidence||'',r.date||'']);
  }
  if(!rows.length)rows.push(['US','','','', '', '', '', '', '', '', '', '', '', 'INSUFFICIENT DATA',null,'INSUFFICIENT','']);
  return rows;
}
function volatilityRowsV362(){
  let rows=[];
  for(const {entry,rec} of xLoadedStockRows()){
    let country=xSafe(()=>companyHomeCountry(entry.s),''),sector=entry.sector||xSafe(()=>companyIndustryTheme(entry.s),''),a=xCompanyAlarm(entry,{country,industry:sector});
    rows.push(['STOCK',rec.name||entry.n||entry.s,entry.s,country,sector,xPct(rec.rv20),xPct(rec.rv60),xPct(a.ewma),xPct(rec.m1),xPct(rec.m3),xPct(rec.draw52),xPct(rec.dist50),xPct(rec.dist200),xNum(a.volScore),xNum(a.downsideScore),a.label||'',a.volTrend||'',a.horizon||'',a.confidence||'',xJoin(a.reasons,'; '),xJoin(a.offsets,'; '),rec.date||'']);
  }
  for(const e of xEtfRows()){
    let r=xCompanyRec(e.s);if(!r||r.status!=='ready')continue;let a=xAlarm(r);rows.push(['ETF',e.n,e.s,e.domicile||'',e.group||'',xPct(r.rv20),xPct(r.rv60),xPct(a.ewma),xPct(r.m1),xPct(r.m3),xPct(r.draw52),xPct(r.dist50),xPct(r.dist200),xNum(a.volScore),xNum(a.downsideScore),a.label||'',a.volTrend||'',a.horizon||'',a.confidence||'',xJoin(a.reasons,'; '),xJoin(a.offsets,'; '),r.date||'']);
  }
  for(const e of xSectorRows()){
    let r=xCompanyRec(e.s);if(!r||r.status!=='ready')continue;let a=xAlarm(r);rows.push(['SECTOR',e.n,e.s,'US',e.n,xPct(r.rv20),xPct(r.rv60),xPct(a.ewma),xPct(r.m1),xPct(r.m3),xPct(r.draw52),xPct(r.dist50),xPct(r.dist200),xNum(a.volScore),xNum(a.downsideScore),a.label||'',a.volTrend||'',a.horizon||'',a.confidence||'',xJoin(a.reasons,'; '),xJoin(a.offsets,'; '),r.date||'']);
  }
  for(const c of (typeof appState!=='undefined'&&appState.countries||[])){
    if(!c||!c.metrics)continue;let m=c.metrics,a=xAlarm(m,{series:c.series});rows.push(['MARKET',c.name||c.code,c.symbol||'',c.code,'',xPct(m.rv20),xPct(a.rv60),xPct(a.ewma),xPct(m.m1),xPct(m.m3),xPct(m.draw52),xPct(m.dist50),xPct(m.dist200),xNum(a.volScore),xNum(a.downsideScore),a.label||'',a.volTrend||'',a.horizon||'',a.confidence||'',xJoin(a.reasons,'; '),xJoin(a.offsets,'; '),m.date||c.quality&&c.quality.date||'']);
  }
  return rows.length?rows:[['','','','','','','','','','','','','','','','INSUFFICIENT DATA','','','INSUFFICIENT','','','']];
}
function buildMacroV362(){
  return (xSafe(()=>macroAuditRowsV47(),[])||[]).map(r=>[r.family||'',r.indicator||'',r.countryRegion||'',xNum(r.rawValue),r.unit||'',xNum(r.transformedValue),null,xNum(r.contribution),xScoreStatus(r.transformedValue),r.rawValue!==null&&r.rawValue!==undefined?1:0,r.confidence||'',r.provider||'',r.observationDate||'',r.freshness||'']);
}
function buildFiscalV362(){
  return (xSafe(()=>fiscalAuditRowsV47(),[])||[]).map(r=>[r.country||r.countryCode,xPct(r.debtGdp),xPct(r.fiscalBalance),xPct(r.primaryBalance),xPct(r.interestBurden),xPct(r.sovereignYield),xNum(r.spreadBps),xPct(r.averageDebtCost),xPct(r.nominalGrowth),xPct(r.structuralRMinusG),xNum(r.structuralScore),r.structuralStatus||xScoreStatus(r.structuralScore),xNum(r.marketPressureScore),xCoverage(r.structuralCoverage),r.structuralEligible?'HIGH':r.scopeComparable?'MEDIUM':'LIMITED',r.provider||'',r.observationDate||'',r.comparability||r.governmentScope||'']);
}
function buildBondsV362(){
  let d=typeof bondsV75!=='undefined'&&bondsV75?bondsV75.data:null,out=[];
  let add=(section,metric,m)=>{if(!m){out.push([section,metric,null,null,null,null,null,'N/A','','']);return}out.push([section,metric,xNum(m.value),xNum(m.d1),xNum(m.w1),xNum(m.m1),xPct(m.percentile),m.status||'INFO',m.date||'',m.source||m.detail||''])};
  if(!d)return[['BONDS','Module not loaded',null,null,null,null,null,'NOT LOADED','','Open/refresh Bonds to populate this module; Excel export itself performs no fetch.']];
  [['US Treasury 3M','US3M'],['US Treasury 2Y','US2'],['US Treasury 5Y','US5'],['US Treasury 10Y','US10'],['US Treasury 30Y','US30']].forEach(([n,k])=>add('U.S. Treasury',n,d.us&&d.us[k]));
  [['Germany 2Y','de2'],['Germany 5Y','de5'],['Germany 10Y','de10'],['Germany 30Y','de30']].forEach(([n,k])=>add('Germany',n,d.germany&&d.germany[k]));
  [['France vs Germany 10Y','fr'],['Italy vs Germany 10Y','it'],['Spain vs Germany 10Y','es']].forEach(([n,k])=>add('Sovereign spread',n,d.sovereign&&d.sovereign[k]));
  [['US IG OAS','usIg'],['US HY OAS','usHy'],['Euro HY OAS','euroHy']].forEach(([n,k])=>add('Credit',n,d.credit&&d.credit[k]));
  [['US 5Y real yield','real5'],['US 10Y real yield','real10'],['US 5Y breakeven','be5'],['US 10Y breakeven','be10']].forEach(([n,k])=>add('Real / inflation',n,d.real&&d.real[k]));
  add('Global','UK 10Y',d.global&&d.global.uk10);add('Global','Japan 10Y',d.global&&d.global.jp10);
  (d.etfs||[]).forEach(e=>out.push(['Bond ETF',e.n||e.s,xNum(e.value),null,null,xPct(e.m1),null,e.status||'N/A',e.date||'','Yahoo Finance']));
  return out;
}
function commodityPhysicalRowsV362(){
  let p=xSafe(()=>commodityPhysicalSnapshotV61(),null),out=[];
  const add=(module,metric,current,previous,change,unit,status,provider,obs,coverage,fresh)=>out.push([module,metric,xNum(current),xNum(previous),xNum(change),unit,status,provider,obs,xCoverage(coverage),fresh]);
  if(p&&p.usOil&&p.usOil.status==='AVAILABLE'){
    let x=p.usOil;add('U.S. Oil','SPR stock',x.sprStockMMbbl,null,null,'MMbbl','AVAILABLE',x.source,x.observationDate,null,'');add('U.S. Oil','SPR capacity',x.sprCapacityMMbbl,null,null,'MMbbl','INFO',x.source,x.observationDate,null,'');add('U.S. Oil','SPR fill',x.sprFillPct,null,null,'%',xScoreStatus(100-(x.sprFillPct||0)),x.source,x.observationDate,null,'');add('U.S. Oil','Commercial crude weekly change',null,null,x.commercialCrudeWeeklyChangeMMbbl,'MMbbl','INFO',x.source,x.observationDate,null,'');add('U.S. Oil','Cushing weekly change',null,null,x.cushingWeeklyChangeMMbbl,'MMbbl','INFO',x.source,x.observationDate,null,'');add('U.S. Oil','Gasoline weekly change',null,null,x.gasolineWeeklyChangeMMbbl,'MMbbl','INFO',x.source,x.observationDate,null,'');add('U.S. Oil','Distillate weekly change',null,null,x.distillateWeeklyChangeMMbbl,'MMbbl','INFO',x.source,x.observationDate,null,'');
  }
  if(p&&p.usGas&&p.usGas.status==='AVAILABLE'){
    let x=p.usGas;add('U.S. Gas','Working gas storage',x.stockBcf,null,x.weeklyFlowBcf,'Bcf','AVAILABLE',x.source,x.observationDate,null,'');add('U.S. Gas','Working gas capacity',x.capacityBcf,null,null,'Bcf','INFO',x.source,x.observationDate,null,'');add('U.S. Gas','Storage fill',x.fillPct,null,null,'%','AVAILABLE',x.source,x.observationDate,null,'');add('U.S. Gas','vs year ago',x.vsYearAgoPct,null,null,'%','INFO',x.source,x.observationDate,null,'');add('U.S. Gas','vs 5Y seasonal avg',x.vsFiveYearSeasonalAveragePct,null,null,'%','INFO',x.source,x.observationDate,null,'');
  }
  if(p&&p.euGas&&p.euGas.status==='AVAILABLE'){
    let x=p.euGas;add('EU Gas','Stored gas',x.stock??x.stockTWh??x.stockValue,null,x.netFlow??x.netFlowTWh,'TWh','AVAILABLE',x.source,x.observationDate,null,'');add('EU Gas','Storage capacity',x.capacity??x.capacityTWh,null,null,'TWh','INFO',x.source,x.observationDate,null,'');add('EU Gas','Storage fill',x.fillPct,null,null,'%','AVAILABLE',x.source,x.observationDate,null,'');add('EU Gas','vs year ago',x.vsYearAgoPct,null,null,'%','INFO',x.source,x.observationDate,null,'');add('EU Gas','vs 5Y seasonal avg',x.vsFiveYearSeasonalAveragePct,null,null,'%','INFO',x.source,x.observationDate,null,'');add('EU Gas','Seasonal percentile',x.seasonalPercentile,null,null,'%','INFO',x.source,x.observationDate,null,'');add('EU Gas','Days of demand coverage',x.daysOfDemandCoverage,null,null,'days','INFO',x.source,x.observationDate,null,'');
  }
  let summary=xSafe(()=>commodityAuditRowsV47(),[])||[];
  for(const r of summary){if(out.some(x=>x[0]===r.module))continue;out.push([r.module,'Module summary',xNum(r.value),null,null,r.unit||'',xStatusFromLoad(r.status),r.provider||'',r.observationDate||'',xCoverage(r.coverage),''])}
  return out.length?out:[['Commodities','No module loaded',null,null,null,'','NOT LOADED','','',null,'']];
}
function buildCapitalRotationV362(){
  let snap=xSafe(()=>capitalRotationSnapshotV70(),null);if(!snap)return[['Rotation','No runtime state','','N/A',null,'INSUFFICIENT DATA','','','','','','','','']];
  let rows=[];
  for(const a of snap.assets||[]){let d=a.def||{},m=a.metric||a.record&&a.record.metric||{};rows.push(['Asset',d.n||d.label||d.id||'',d.s||'',a.status||'',xNum(a.score),a.confidence||'',a.confirmation||'',xPct(m.m1),xPct(m.m3),xPct(m.rv20),xNum(m.marketCap),m.currency||'',m.date||'',xJoin(a.support,'; ')])}
  for(const r of snap.regions||[])rows.push(['Region',r.label||r.id||'','',r.status||'',xNum(r.score),'','','','','','','',snap.marketThrough||'',r.source||'']);
  return rows.length?rows:[['Rotation','','','N/A',null,'INSUFFICIENT DATA','','','','','','','','']];
}
function buildCorrelationsV362(){
  return (xSafe(()=>correlationAuditRowsV47(),[])||[]).map(r=>{
    if(r.assetA==='GLOBAL'&&r.assetB==='AVERAGE')return[r.assetA,r.assetB,xNum(r.avg20),xNum(r.avg60),xNum(r.avg120),xNum(r.acceleration),r.regime||r.systemicRegime||'',1,'',`Same-date average; systemic=${xText(r.systemicLagAdjusted)}`];
    let w=Number(r.windowDays),v=xNum(r.correlation);return[r.assetA,r.assetB,w===20?v:null,w===60?v:null,w===120?v:null,null,r.regime||'',1,'',r.alignmentRule||r.alignmentMode||''];
  });
}
function buildDataQualityV362(){
  let snap=xSafe(()=>providerResilienceSnapshotV62(),{registry:{},health:{},fallbackChains:{}}),out=[];
  for(const [name,reg] of Object.entries(snap.registry||{})){
    let h=(snap.health||{})[name]||{},tot=(h.success||0)+(h.fail||0),status=(h.success||0)>0?'LIVE':(h.cache||0)>0?'CACHED':(h.fail||0)>0?'ERROR':'NOT USED',coverage=tot?(h.success||0)/tot:null;
    out.push([reg.domain||'',name,reg.sourceClass||'',name,status,h.lastOk?xIso(h.lastOk):'',h.lastOk?xIso(h.lastOk):'',Number.isFinite(h.cacheAge)?Math.round(h.cacheAge/60000)+' min':'',h.cache||0,coverage,reg.grade||'',reg.fallbackPolicy||'',h.lastError||h.lastFailureClass||'']);
  }
  if(!out.length)out.push(['','','','','NOT LOADED','','','','',null,'','','']);
  return out;
}
function buildMethodologyV362(){
  let snap=xSafe(()=>methodologyV2SnapshotV67(),null),models=snap&&snap.models||[];
  return models.map(m=>[m.name||m.id||'',m.purpose||'',xJoin(m.rawIndicators),xText(m.transformation),xText(m.weights),xText(m.thresholdsWindow),xText(m.missingDataTreatment),xText(m.coverage),xText(m.confidence),xText(m.aggregation||m.scoreDirection||'')]);
}
const SOURCE_URLS_V362={
 'Eurostat':'https://ec.europa.eu/eurostat/','FRED':'https://fred.stlouisfed.org/','ECB':'https://data.ecb.europa.eu/','World Bank':'https://api.worldbank.org/','IMF':'https://www.imf.org/','CFTC':'https://www.cftc.gov/','OFR':'https://www.financialresearch.gov/','US Treasury Fiscal Data':'https://fiscaldata.treasury.gov/','New York Fed':'https://www.newyorkfed.org/','EIA':'https://www.eia.gov/','US Department of Energy':'https://www.energy.gov/','FAO':'https://www.fao.org/','GIE':'https://agsi.gie.eu/','Zagreb Stock Exchange':'https://zse.hr/','Cboe':'https://www.cboe.com/','Yahoo Finance':'https://finance.yahoo.com/','World Gold Council':'https://www.gold.org/','Composite':'','Secondary':'','Unknown':''
};
function buildSourcesV362(){
  let snap=xSafe(()=>providerResilienceSnapshotV62(),{registry:{},health:{}}),out=[];
  for(const [name,reg] of Object.entries(snap.registry||{})){
    let h=(snap.health||{})[name]||{},status=(h.success||0)>0?'LIVE':(h.cache||0)>0?'CACHED':(h.fail||0)>0?'ERROR':'REGISTERED';
    out.push([reg.domain||'',name,reg.sourceClass||'',reg.domain||'','Provider-native',SOURCE_URLS_V362[name]||'',name==='GIE'?'Optional API key where configured':'Public / app-configured',status,reg.fallbackPolicy||'',`Quality ${reg.grade||''}; score ${xText(reg.qualityScore)}`]);
  }
  return out;
}
function buildCalcSnapshotsV39(){
  let xs=window.MRMIntelligenceV39&&MRMIntelligenceV39.loadSnapshots?MRMIntelligenceV39.loadSnapshots():[];
  return xs.map(x=>[x.calculationId,x.calculatedAt,x.appVersion,x.modelVersion,x.globalScore,x.displayBand,x.currentCondition,x.warningAdjustment,x.structuralAdjustment,x.preAmplifier,x.contagionMultiplier,x.coverage,x.dataQuality,x.configHash,x.inputSetHash]);
}
function buildChangeLedgerV39(){
  let xs=window.MRMIntelligenceV39&&MRMIntelligenceV39.loadChangeEvents?MRMIntelligenceV39.loadChangeEvents():[];
  return xs.map(x=>[x.type,x.title||x.metricId,x.metricId||'',x.oldValue,x.newValue,x.observationDate,x.marketMeaning===true?'MARKET':x.marketMeaning===false?'NON-MARKET':'',x.detail||'',x.beforeCalculationId||'',x.afterCalculationId||'']);
}
function buildEvidenceV39(){
  if(!(window.MRMIntelligenceV39&&MRMIntelligenceV39.evidenceFor))return [];
  let targets=['GLOBAL',...(typeof globalCurrentDriverRowsV66==='function'?globalCurrentDriverRowsV66(appState&&appState.global||{}).map(x=>'GLOBAL_DRIVER:'+x.key):[]),...(appState&&appState.countries||[]).filter(x=>x&&x.code).map(x=>'COUNTRY:'+x.code),...(appState&&appState.early||[]).filter(x=>x&&x.name).map(x=>'EARLY:'+x.name)],rows=[];
  for(let t of targets){let e=MRMIntelligenceV39.evidenceFor(t,appState);if(!e)continue;let inputs=e.inputs&&e.inputs.length?e.inputs:[{}];for(let x of inputs)rows.push([e.targetId,e.title,e.score,e.status,e.modelId,e.modelVersion,e.calculationId,x.metricId||'',x.value,x.unit,x.provider||x.source,x.seriesId,x.scope,x.observationDate,x.releaseAt,x.sourceRetrievedAt,x.transportState,x.freshness,x.eligibleForCurrentScore===false?'EXCLUDED':'INCLUDED',x.exclusionReason||'',e.reliability&&e.reliability.dataQuality,e.reliability&&e.reliability.coverage,e.reliability&&e.reliability.signalAgreement,e.reliability&&e.reliability.empiricalValidation]);}
  return rows;
}
function buildAlertsV39(){
  let x=window.MRMSmartAlertsV39&&MRMSmartAlertsV39.exportSnapshot?MRMSmartAlertsV39.exportSnapshot():{events:[]};
  return (x.events||[]).map(e=>[e.alertId,e.createdAt,e.type,e.ruleId,e.state,(e.metricIds||[]).join('; '),e.previousValue,e.newValue,e.observationAt,e.calculationId,e.triggerReason,e.evidenceSummary,e.confirmationCount,e.cooldownUntil,e.resolvedAt||'',e.resolutionReason||'']);
}
function buildMetadataV362(){
  return[
    ['Application','Market Risk Monitor Global+'],['Version',XLSX_VERSION_V362],['VersionCode',XLSX_VERSION_CODE_V362],['Package','com.marko.marketrisk.globalplus'],['Report schema',XLSX_REPORT_SCHEMA_V362],['Generated at',new Date().toISOString()],['State calculated at',typeof appState!=='undefined'&&appState.generatedAt||''],['Dynamic data rule','All market/macro values are read from currently loaded/cache runtime state; export performs zero network requests.'],['Missing-data rule','Missing/unloaded values remain blank/N/A and are never replaced with fabricated zeroes.'],['Security','Credential-like fields and API secrets are not exported.'],['Report mode','LIVE RUNTIME SNAPSHOT'],['Workbook template','Business blue/gray/black/white/orange with standard red/amber/green status semantics.']
  ];
}

function sheetSpecsV362(){
 return [
  {name:'00 REPORT COVER',title:'Market Risk Monitor Global+',subtitle:'FULL MARKET RISK REPORT',headers:['Metric','Value','Status'],rows:buildCoverV362(),statusCols:[2]},
  {name:'01 EXEC DASHBOARD',title:'Executive Dashboard',subtitle:'Current cross-module risk state and alarm counts',headers:['Metric','Value','Status','Coverage','Confidence','Comment','','Alarm status','Count'],rows:buildExecV362(),percentCols:[3],statusCols:[2,7]},
  {name:'02 GLOBAL RISK',title:'Global Risk',subtitle:'GA2 component audit and weighted contribution',headers:['Component','Raw value','Score','Weight','Contribution','Status','Coverage','Confidence','Source'],rows:buildGlobalRiskV362(),percentCols:[3,6],statusCols:[5]},
  {name:'03 EARLY WARNING',title:'Early Warning',subtitle:'Leading, confirmation, current-stress and structural signals',headers:['Timing','Category','Signal','Value','Unit','Score','Status','Direction','Weight','Observation','Provider','Freshness','Confidence','Interpretation'],rows:buildEarlyV362(),percentCols:[8],statusCols:[6,11,12]},
  {name:'04 MARKETS',title:'Markets',subtitle:'Country/index market diagnostics',headers:['Country','Index','Symbol','Latest','1D','1M','3M','YTD','1Y','RV20','52W DD','Market score','Fiscal','Country risk','Risk band','Vol risk','Downside','Alarm','Confidence','Provider','Observation','Freshness'],rows:buildMarketsV362(),percentCols:[4,5,6,7,8,9,10],statusCols:[14,17,18,21]},
  {name:'05 STOCKS',title:'Stocks',subtitle:'Loaded stock intelligence; no fetch is triggered by report generation',headers:['Ticker','Company','Country','Sector','CCY','Price','1D','1M','3M','YTD','1Y','vs 50DMA','vs 200DMA','52W DD','RV20','RV60','Core risk','Context risk','Vol risk','Downside','Alarm','Horizon','Confidence','Reasons','Offsets','TTM yield','T212','Status','Provider','Freshness'],rows:buildStocksV362(),percentCols:[6,7,8,9,10,11,12,13,14,15,25],statusCols:[20,22,26,27,29]},
  {name:'06 STOCK DETAIL',title:'Stock Detail',subtitle:'Heavy 5Y fields only for detail records already loaded in this app session/cache',headers:['Ticker','Company','Status','Observation','6M','RV60','5Y max DD','52W high','52W low','Core risk','vs 50DMA','vs 200DMA','Detail loaded','Provider'],rows:buildStockDetailV362(),percentCols:[4,5,6,10,11],statusCols:[2,12]},
  {name:'07 ETF INTELLIGENCE',title:'ETF Intelligence',subtitle:'Global ETF universe with loaded runtime metrics',headers:['Ticker','ETF','Category','Exposure','Income','CCY','Price','1D','1M','3M','YTD','1Y','52W DD','RV20','RV60','Risk','Vol risk','Downside','Alarm','Confidence','TTM yield','T212','Status','Provider','Freshness'],rows:buildEtfsV362(),percentCols:[7,8,9,10,11,12,13,14,20],statusCols:[18,19,21,22,24]},
  {name:'08 DIVIDENDS',title:'Dividends',subtitle:'Loaded distribution data for stocks and ETFs',headers:['Ticker','Instrument','Type','Income policy','Frequency','Last distribution','Last date','TTM distributions','TTM yield','CCY','Coverage','Provider','Freshness'],rows:buildDividendsV362(),percentCols:[8],statusCols:[10,12]},
  {name:'09 SECTORS INDUSTRIES',title:'Sectors & Industries',subtitle:'Loaded sector proxy diagnostics',headers:['Market','Sector / industry','Proxy','1M','3M','Relative 3M','RV20','52W DD','Breadth','Driver corr 60D','Risk','Vol risk','Downside','Alarm','Coverage','Confidence','Observation'],rows:buildSectorsV362(),percentCols:[3,4,5,6,7,8,14],statusCols:[13,15]},
  {name:'10 VOLATILITY DOWNSIDE',title:'Volatility & Downside',subtitle:'VA1.0 additive alarm layer; existing risk scores remain unchanged',headers:['Type','Entity','Ticker','Market','Sector','RV20','RV60','EWMA vol','1M','3M','52W DD','vs 50DMA','vs 200DMA','Vol risk','Downside','Alarm','Trend','Horizon','Confidence','Reasons','Offsets','Observation'],rows:volatilityRowsV362(),percentCols:[5,6,7,8,9,10,11,12],statusCols:[15,16,18]},
  {name:'11 MACRO',title:'Macro',subtitle:'Current macro-cycle inputs and audited transforms',headers:['Family','Indicator','Region','Value','Unit','Score','Weight','Contribution','Regime','Coverage','Confidence','Provider','Observation','Freshness'],rows:buildMacroV362(),percentCols:[9],statusCols:[8,10,13]},
  {name:'12 FISCAL SOVEREIGN',title:'Fiscal & Sovereign',subtitle:'Structural fiscal vulnerability separated from market refinancing pressure',headers:['Country','Debt/GDP','Fiscal balance','Primary balance','Interest burden','10Y yield','Spread bp','Debt cost','Nominal growth','r-g','Structural score','Status','Market pressure','Coverage','Confidence','Provider','Observation','Comparability'],rows:buildFiscalV362(),percentCols:[1,2,3,4,5,7,8,9,13],statusCols:[11,14]},
  {name:'13 BONDS',title:'Bonds',subtitle:'Rates, sovereign spreads, credit and bond ETF observations already loaded',headers:['Section','Metric','Value','1D bp','1W bp','1M bp','Percentile','Status','Observation','Provider'],rows:buildBondsV362(),percentCols:[6],statusCols:[7]},
  {name:'14 COMMODITIES',title:'Commodities',subtitle:'Physical and market commodity state; no fabricated fill percentages',headers:['Module','Metric','Current','Previous','Change','Unit','Status','Provider','Observation','Coverage','Freshness'],rows:commodityPhysicalRowsV362(),percentCols:[9],statusCols:[6,10]},
  {name:'15 CAPITAL ROTATION',title:'Capital Rotation',subtitle:'Regime projection; not measured fund flow',headers:['Section','Entity','Ticker','Status','Score','Confidence','Confirmation','1M','3M','RV20','Market cap','CCY','Observation','Details'],rows:buildCapitalRotationV362(),percentCols:[7,8,9],statusCols:[3,5,6]},
  {name:'16 CORRELATIONS',title:'Correlations',subtitle:'Same-date descriptive correlations plus systemic alignment context',headers:['Asset A','Asset B','20D','60D','120D','Acceleration','Regime','Coverage','Confidence','Observation'],rows:buildCorrelationsV362(),percentCols:[7],statusCols:[6,8]},
  {name:'17 DATA QUALITY',title:'Data Quality',subtitle:'Provider resilience, cache/fallback and current runtime health',headers:['Module','Entity','Metric','Provider','Status','Observation','Retrieved','Freshness','Cache','Coverage','Confidence','Fallback','Failure reason'],rows:buildDataQualityV362(),percentCols:[9],statusCols:[4,10]},
  {name:'18 METHODOLOGY',title:'Methodology',subtitle:'Model inventory from methodology v2 export',headers:['Model','Purpose','Inputs','Transformation','Weights','Threshold / lookback','Missing data','Coverage','Confidence','Output'],rows:buildMethodologyV362(),statusCols:[8]},
  {name:'19 SOURCES',title:'Sources',subtitle:'Registered provider/source catalog and runtime status',headers:['Module','Provider','Dataset','Series / endpoint','Frequency','Source URL','Auth','Status','Fallback','Notes'],rows:buildSourcesV362(),statusCols:[7]},
  {name:'20 REPORT METADATA',title:'Report Metadata',subtitle:'Workbook generation and governance metadata',headers:['Key','Value'],rows:buildMetadataV362(),statusCols:[]},
  {name:'21 CALC SNAPSHOTS',title:'Calculation Snapshots',subtitle:'Immutable completed-calculation context; HTTP prefetch alone creates no row',headers:['Calculation ID','Calculated at','App version','Model version','GLOBAL','Band','Current condition','Warning add','Structural add','Pre-amplifier','Contagion multiplier','Coverage','Data quality','Config hash','Input-set hash'],rows:buildCalcSnapshotsV39(),percentCols:[11],statusCols:[5]},
  {name:'22 CHANGE LEDGER',title:'Change Ledger',subtitle:'Input-state changes classified separately from score accounting',headers:['Type','Title','Metric','Old','New','Observation','Meaning','Detail','Before calculation','After calculation'],rows:buildChangeLedgerV39(),statusCols:[0,6]},
  {name:'23 EVIDENCE',title:'Evidence',subtitle:'Metric provenance, eligibility and four separate reliability dimensions',headers:['Target','Result','Score','Status','Model','Model version','Calculation','Metric','Value','Unit','Provider','Series','Scope','Observation','Release','Retrieved','Transport','Freshness','Eligibility','Exclusion reason','Data quality','Coverage','Signal agreement','Empirical validation'],rows:buildEvidenceV39(),percentCols:[21],statusCols:[3,16,17,18,23]},
  {name:'24 ALERTS',title:'Alert Center',subtitle:'Market-risk and data-health events with evidence and lifecycle state',headers:['Alert ID','Created','Type','Rule','State','Metrics','Previous','New','Observation','Calculation','Trigger','Evidence summary','Confirmations','Cooldown until','Resolved at','Resolution reason'],rows:buildAlertsV39(),statusCols:[2,4]}
 ];
}

function xmlEscV362(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function colNameV362(n){let s='';for(let x=n+1;x;x=Math.floor((x-1)/26))s=String.fromCharCode(65+(x-1)%26)+s;return s}
function statusStyleV362(v){let s=String(v||'').toUpperCase();if(!s)return null;if(/ERROR|FAIL|HIGH RISK|\bRED\b|DARK ORANGE|OFFLINE/.test(s))return 10;if(/ELEVATED|WATCH|ORANGE|LATE|STALE|DEGRADED|NOT CONFIRMED/.test(s))return 11;if(/LOW RISK|GREEN|LIVE|AVAILABLE|CURRENT|READY|ONLINE|CONFIRMED/.test(s))return 12;if(/NOT LOADED|INSUFFICIENT|LIMITED|N\/A|UNKNOWN|REGISTERED/.test(s))return 13;return 14}
function cellXmlV362(ref,v,style){
  if(v===null||v===undefined||v==='')return `<c r="${ref}" s="${style}"></c>`;
  if(typeof v==='number'&&Number.isFinite(v))return `<c r="${ref}" s="${style}"><v>${v}</v></c>`;
  if(typeof v==='boolean')return `<c r="${ref}" s="${style}" t="b"><v>${v?1:0}</v></c>`;
  let t=String(v);return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscV362(t)}</t></is></c>`;
}
function columnWidthV362(headers,rows,i){let max=String(headers[i]||'').length;for(const r of rows.slice(0,250)){let v=r&&r[i];if(v!==null&&v!==undefined)max=Math.max(max,String(v).length)}return Math.min(38,Math.max(9,max+2))}
function sheetXmlV362(spec,index){
  let headers=spec.headers||[],rows=spec.rows||[],lastCol=colNameV362(Math.max(0,headers.length-1)),lastRow=4+rows.length,mergeLast=spec.name==='01 EXEC DASHBOARD'?'F':lastCol;
  let cols=headers.map((_,i)=>`<col min="${i+1}" max="${i+1}" width="${columnWidthV362(headers,rows,i)}" customWidth="1"/>`).join('');
  let row1=`<row r="1" ht="28" customHeight="1">${cellXmlV362('A1',spec.title,1)}</row>`;
  let row2=`<row r="2" ht="22" customHeight="1">${cellXmlV362('A2',spec.subtitle,2)}</row>`;
  let row3=`<row r="3" ht="30" customHeight="1">${cellXmlV362('A3',XLSX_NOTICE_V362,3)}</row>`;
  let row4=`<row r="4" ht="24" customHeight="1">${headers.map((h,i)=>cellXmlV362(colNameV362(i)+'4',h,4)).join('')}</row>`;
  let percent=new Set(spec.percentCols||[]),status=new Set(spec.statusCols||[]),body=rows.map((r,ri)=>{
    let excelRow=ri+5,zebra=ri%2===1,cells=headers.map((_,ci)=>{let v=r&&r[ci],st=percent.has(ci)?(zebra?8:7):(zebra?6:5);if(status.has(ci)){let ss=statusStyleV362(v);if(ss!==null)st=ss}return cellXmlV362(colNameV362(ci)+excelRow,v,st)}).join('');return `<row r="${excelRow}">${cells}</row>`;
  }).join('');
  let merges=`<mergeCells count="3"><mergeCell ref="A1:${mergeLast}1"/><mergeCell ref="A2:${mergeLast}2"/><mergeCell ref="A3:${mergeLast}3"/></mergeCells>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${cols}</cols><sheetData>${row1}${row2}${row3}${row4}${body}</sheetData>${merges}<autoFilter ref="A4:${lastCol}${Math.max(4,lastRow)}"/><pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`;
}
function stylesXmlV362(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.0%;[Red]-0.0%"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="18"/><name val="Aptos Display"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FF0F2740"/><sz val="10"/><name val="Aptos"/></font></fonts><fills count="10"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F2740"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0F2F5"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F1F8"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF245B8A"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF7F8FA"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF6D9D9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFBE8C9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDFF2E6"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD8DEE6"/></left><right style="thin"><color rgb="FFD8DEE6"/></right><top style="thin"><color rgb="FFD8DEE6"/></top><bottom style="thin"><color rgb="FFD8DEE6"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="15"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="6" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="6" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="7" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="8" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="9" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`}
function workbookXmlV362(specs){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000"/></bookViews><sheets>${specs.map((s,i)=>`<sheet name="${xmlEscV362(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><calcPr calcId="191029"/></workbook>`}
function workbookRelsV362(specs){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${specs.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${specs.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`}
function contentTypesV362(specs){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${specs.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`}
function rootRelsV362(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`}
function corePropsV362(){let now=new Date().toISOString();return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Market Risk Monitor Global+ Full Report</dc:title><dc:creator>Market Risk Monitor Global+</dc:creator><cp:lastModifiedBy>Market Risk Monitor Global+</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`}
function appPropsV362(specs){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Market Risk Monitor Global+</Application><AppVersion>${XLSX_VERSION_V362}</AppVersion><TitlesOfParts><vt:vector size="${specs.length}" baseType="lpstr">${specs.map(s=>`<vt:lpstr>${xmlEscV362(s.name)}</vt:lpstr>`).join('')}</vt:vector></TitlesOfParts></Properties>`}
function xlsxBlobV362(specs){
  let files=[{name:'[Content_Types].xml',data:contentTypesV362(specs)},{name:'_rels/.rels',data:rootRelsV362()},{name:'docProps/core.xml',data:corePropsV362()},{name:'docProps/app.xml',data:appPropsV362(specs)},{name:'xl/workbook.xml',data:workbookXmlV362(specs)},{name:'xl/_rels/workbook.xml.rels',data:workbookRelsV362(specs)},{name:'xl/styles.xml',data:stylesXmlV362()}];
  specs.forEach((s,i)=>files.push({name:`xl/worksheets/sheet${i+1}.xml`,data:sheetXmlV362(s,i)}));
  let b=zipStoreV47(files);return b.slice(0,b.size,XLSX_MIME_V362);
}
async function exportExcelReportV362(){
  try{
    setExportStatusV47(L('Priprema punog Excel izvještaja…','Preparing full Excel report…'));
    let specs=sheetSpecsV362(),blob=xlsxBlobV362(specs),stamp=exportTimestampV47(),name=`MarketRiskMonitor_GlobalPlus_Full_Report_v${XLSX_VERSION_V362}_${stamp}.xlsx`;
    if(blob.size>11.5*1024*1024)throw new Error(L('Excel izvještaj je prevelik za sigurni native download limit.','Excel report exceeds the safe native download limit.'));
    let saved=await saveExportBlobV48(blob,name,XLSX_MIME_V362);
    setExportStatusV47(saved.native?L('Excel spremljen: ','Excel saved: ')+saved.name:L('Excel preuzimanje je pokrenuto.','Excel download started.'));
  }catch(e){setExportStatusV47(L('Excel export nije uspio: ','Excel export failed: ')+String(e&&e.message||e),false)}
}
function bindExcelExportV362(){let b=document.getElementById('downloadExcelBtn');if(b)b.onclick=exportExcelReportV362}
window.exportExcelReportV362=exportExcelReportV362;
window.__MRM_XLSX_TEST__={sheetSpecsV362,xlsxBlobV362,stylesXmlV362,sheetXmlV362};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindExcelExportV362,{once:true});else bindExcelExportV362();
})();
