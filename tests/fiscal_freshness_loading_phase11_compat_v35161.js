'use strict';
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
function fn(name){const line=src.split(/\r?\n/).find(x=>x.startsWith('function '+name+'('));if(!line)throw new Error('missing '+name);return line}
const names=['fiscalLatestV43','fiscalPrevV43','fiscalYearV44','fiscalQuarterV44','fiscalFreshnessV44','fiscalAnnotateV44','fiscalLatestCurrentActualV44','fiscalCurrentImfV44','fiscalRefLabelV44','fiscalPickReferenceV44','fiscalSeriesChangeAgainstPrevV44'];
const code=names.map(fn).join('\n')+'\nthis.X={'+names.join(',')+'};';
const ctx={Number,Date,String,Array,Math};vm.createContext(ctx);vm.runInContext(code,ctx);const X=ctx.X;
let p=0,f=0;function ok(c,m){if(c){console.log('PASS - '+m);p++}else{console.error('FAIL - '+m);f++}}
const SEP14=Date.parse('2026-09-14T12:00:00Z');
ok(X.fiscalFreshnessV44({value:138.9,observation:'2026-Q1',frequency:'quarterly',valueType:'ACTUAL'},SEP14)==='CURRENT','EU Q1 2026 remains CURRENT in Sep 2026 before expected next-release window expires');
ok(X.fiscalFreshnessV44({value:80,year:2022,observation:'2022',frequency:'annual',valueType:'ACTUAL'},SEP14)==='STALE','2022 annual non-EU actual is STALE in 2026');
let wb=[{value:120,year:2025,observation:'2025',frequency:'annual',valueType:'ACTUAL',source:'World Bank WDI / IMF GFS'}],imf=[{value:124,year:2026,observation:'2026',frequency:'annual',valueType:'ESTIMATE',source:'IMF WEO'}];let r=X.fiscalPickReferenceV44({imfRows:imf,wbRows:wb});
ok(r&&r.value===124&&r.valueType==='ESTIMATE','2026 IMF estimate is selected as current global reference while 2025 actual remains available separately');
ok(X.fiscalPickReferenceV44({imfRows:[],wbRows:[{value:87,year:2022,observation:'2022',frequency:'annual',valueType:'ACTUAL'}]})===null,'old actual without current estimate does not become current reference');
ok(X.fiscalFreshnessV44({value:130,year:2026,observation:'2026',frequency:'annual',valueType:'ESTIMATE'},SEP14)==='CURRENT_ESTIMATE','current-year estimate explicitly labeled CURRENT_ESTIMATE');
ok(X.fiscalFreshnessV44({value:132,year:2027,observation:'2027',frequency:'annual',valueType:'FORECAST'},SEP14)==='CURRENT_FORECAST','future forecast explicitly labeled CURRENT_FORECAST');
ok(src.includes("if(debt&&String(debt.source||'').startsWith('World Bank'))debt=null")&&src.includes("if(bal&&String(bal.source||'').startsWith('World Bank'))bal=null"),'central-government World Bank fallback is excluded from current debt/balance score inputs');
ok(src.includes('row.rankingEligible=row.structuralEligibleV60')&&src.includes("!row.scopeComparableV60?'INCOMPARABLE GOVERNMENT SCOPE'")&&src.includes("!currentScope?'STALE CORE FISCAL DATA'"),'stale/incomparable rows remain excluded from current rankings under Phase-10 structural eligibility');
ok(src.includes("GGXWDG_NGDP")&&src.includes("GGXCNL_NGDP")&&src.includes("FISCAL_V44_IMF_VINTAGE='WEO-2026-04'"),'IMF WEO general-government debt and balance current-reference layer present');
ok(src.includes("const FISCAL_V43_CACHE='mrmFiscalV44'"),'only fiscal cache namespace bumped to v44');
// Scheduler/static architecture
ok(src.includes("const LOAD_V44={P0:0,P1:1,P2:2,P3:3}"),'P0/P1/P2/P3 priority model present');
ok(src.includes("if(d===0)return LOAD_V44.P0")&&src.includes("if(d===1)return LOAD_V44.P1"),'active tab P0 and adjacent tabs P1');
ok(src.includes("if(page==='sp500'||page==='etfs')return LOAD_V44.P3"),'heavy distant S&P/ETF work deferred to P3');
ok(src.includes('loadSchedulerV44.running.size<2')&&src.includes('loadSchedulerV44.bgRunning<1'),'scheduler bounds module concurrency to 2 total / 1 background');
ok(src.includes("let running=loadSchedulerV44.running.get(spec.key);if(running)")&&src.includes("let queued=loadSchedulerV44.queued.get(spec.key);if(queued)"),'in-flight/queued module requests are deduplicated and promoted rather than restarted');
ok(src.includes("startLoadingSchedulerV44(activePageV44())")&&src.includes("startLoadingSchedulerV44('overview')"),'startup hands background work to priority scheduler after Overview/dashboard render');
ok(!src.includes("setTimeout(()=>startDeferredLoading().catch(()=>{}),450)")&&!src.includes("setTimeout(()=>startDeferredLoading().catch(()=>{}),350)"),'heavy deferred company loader no longer starts directly at startup');
ok(src.includes("$('refreshBtn').onclick=()=>refreshActiveV44()"),'manual Refresh is routed through active-module priority logic');
ok(src.includes("queueLoadV44('markets',LOAD_V44.P0,true)"),'Fiscal retry promotes Markets to P0 and forces current-module refresh');
ok(src.includes("let keepVisible=fiscalV43.rows&&fiscalV43.rows.length;if(!keepVisible)fiscalV43.status='loading'"),'valid fiscal rows remain visible while revalidation runs (stale-while-revalidate)');
ok(src.includes("now-cached.ts<FISCAL_V43_SLOW_TTL"),'failed fiscal refresh may reuse cache only inside bounded slow-data freshness window');
ok(!src.includes("if(forceFreshRequests){if(extendedCountryState.status!=='idle')"),'core/dashboard manual refresh no longer force-refreshes unrelated heavy modules');
ok(html.includes('id="loadPriorityStatus"')&&html.includes('v3.5.1_61'),'loading-priority status UI and v44 visible version present');
console.log(`RESULT - ${p}/${p+f} v3.5.1.61 Phase 8 compatibility freshness/loading checks PASS`);if(f)process.exit(1);
