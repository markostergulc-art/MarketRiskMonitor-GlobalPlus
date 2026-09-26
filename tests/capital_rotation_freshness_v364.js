const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('app.js','utf8');
let pass=0,fail=0;
function ok(name,cond,detail=''){if(cond){console.log('PASS',name);pass++;}else{console.error('FAIL',name,detail);fail++;}}
function eq(name,a,b){ok(name,a===b,`expected ${b}, got ${a}`)}
function fnText(name){const p=src.indexOf('function '+name+'(');if(p<0)throw new Error('missing '+name);let b=src.indexOf('{',p),depth=0,q=null,esc=false;for(let i=b;i<src.length;i++){let c=src[i];if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')depth++;else if(c==='}'&&--depth===0)return src.slice(p,i+1)}throw new Error('unterminated '+name)}
// Runtime helpers used by the extracted production functions.
global.pct=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&b!==0?(a/b-1)*100:null;
global.avg=a=>{a=a.filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};
global.std=a=>{a=a.filter(Number.isFinite);if(a.length<2)return null;let m=global.avg(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1))};
global.CAPITAL_ROTATION_TIMEZONE_V114='America/New_York';
global.CAPITAL_ROTATION_CLOSE_MINUTES_V114=16*60+10;
for(const n of ['capitalRotationDateAddV114','capitalRotationYmdV114','capitalRotationNthWeekdayV114','capitalRotationLastWeekdayV114','capitalRotationObservedFixedV114','capitalRotationEasterSundayV114','capitalRotationHolidaySetForYearV114','capitalRotationIsUsMarketHolidayV114','capitalRotationIsTradingDateV114','capitalRotationLatestTradingOnOrBeforeV114','capitalRotationNyPartsV114','capitalRotationExpectedLatestTradingDateV114','capitalRotationNormalizedSeriesV114','capitalRotationLatestCommonDateV114','capitalRotationTradingReturnV114','capitalRotationMarketMetricsV114','capitalRotationObservationStatusV114','capitalRotationRecordDataStatusV114','capitalRotationOverallDataStatusV114']) vm.runInThisContext(fnText(n));

// 1-6 calendar / latest completed session.
eq('Saturday resolves to Friday',capitalRotationExpectedLatestTradingDateV114(Date.parse('2026-09-19T16:00:00Z')),'2026-09-18');
eq('Sunday resolves to Friday',capitalRotationExpectedLatestTradingDateV114(Date.parse('2026-09-20T16:00:00Z')),'2026-09-18');
eq('Friday before NY close resolves to Thursday',capitalRotationExpectedLatestTradingDateV114(Date.parse('2026-09-18T17:00:00Z')),'2026-09-17');
eq('Friday after NY close resolves to Friday',capitalRotationExpectedLatestTradingDateV114(Date.parse('2026-09-18T21:00:00Z')),'2026-09-18');
eq('Labor Day resolves to previous Friday',capitalRotationExpectedLatestTradingDateV114(Date.parse('2026-09-07T21:00:00Z')),'2026-09-04');
ok('Good Friday recognized',capitalRotationIsUsMarketHolidayV114('2026-04-03'));

// 7-11 series hygiene / aligned dates.
let dup=[{d:'2026-09-17',v:100},{d:'2026-09-18',v:101},{d:'2026-09-18',v:102},{d:'2026-09-19',v:500}];
let nd=capitalRotationNormalizedSeriesV114(dup,'2026-09-18');
eq('Duplicate date de-duplicated and future session excluded',nd.length,2);
eq('Last duplicate wins',nd.at(-1).v,102);
let sA=[{d:'2026-09-16',v:10},{d:'2026-09-17',v:11},{d:'2026-09-18',v:12}],sB=[{d:'2026-09-16',v:20},{d:'2026-09-17',v:21}];
eq('Latest common date alignment',capitalRotationLatestCommonDateV114([sA,sB],'2026-09-18'),'2026-09-17');
eq('No common date returns null',capitalRotationLatestCommonDateV114([[{d:'2026-09-18',v:1}],[{d:'2026-09-17',v:2}]]),null);
let seq=[];for(let i=0;i<30;i++)seq.push({d:`2026-08-${String(i+1).padStart(2,'0')}`,v:100+i});
let five=capitalRotationTradingReturnV114(seq,5), expected5=(129/124-1)*100;
ok('5-session return uses observations, not calendar subtraction',Math.abs(five-expected5)<1e-9,`${five} vs ${expected5}`);
let twenty=capitalRotationTradingReturnV114(seq,20),expected20=(129/109-1)*100;
ok('20-session return uses observations',Math.abs(twenty-expected20)<1e-9,`${twenty} vs ${expected20}`);

// 12-17 freshness classifications.
eq('Current observation classified CURRENT',capitalRotationObservationStatusV114('2026-09-18','2026-09-18'),'CURRENT');
eq('Older observation classified STALE',capitalRotationObservationStatusV114('2026-09-17','2026-09-18'),'STALE');
eq('Missing observation classified ERROR',capitalRotationObservationStatusV114(null,'2026-09-18'),'ERROR');
let metric={date:'2026-09-18'};
eq('Fresh network record classified LIVE',capitalRotationRecordDataStatusV114([{metric,transport:'NETWORK',staleFallback:false}],metric,'2026-09-18'),'LIVE');
eq('Fresh cache record classified CACHED',capitalRotationRecordDataStatusV114([{metric,transport:'HTTP_MEMORY_CACHE',staleFallback:false}],metric,'2026-09-18'),'CACHED');
eq('Old network observation still classified STALE',capitalRotationRecordDataStatusV114([{metric:{date:'2026-09-17'},transport:'NETWORK',staleFallback:false}],{date:'2026-09-17'},'2026-09-18'),'STALE');
eq('Mixed current/stale inputs classified PARTIAL',capitalRotationRecordDataStatusV114([{metric:{date:'2026-09-18'},transport:'NETWORK'},{metric:{date:'2026-09-17'},transport:'NETWORK'}],metric,'2026-09-18'),'PARTIAL');
eq('Overall mixed module classified PARTIAL',capitalRotationOverallDataStatusV114([{dataStatus:'LIVE'},{dataStatus:'STALE'}]),'PARTIAL');

// 18+ source-level guarantees: test the actual production source, not replicas.
ok('Methodology/cache schema bumped to CR1.1-FRESHNESS',src.includes("CAPITAL_ROTATION_METHOD_V70='CR1.1-FRESHNESS'"));
ok('Manual/forced asset load propagates force to Yahoo',/yahoo\(symbol,'1y',forceNetwork,diagnostic\)/.test(src));
ok('Forced Capital Rotation refresh calls forced network asset load',/capitalRotationLoadAssetV70\(def,true\)/.test(src));
ok('Cache-first path schedules background network validation',/capitalRotationCacheNeedsValidationV114\(cached\).*ensureCapitalRotationV70\(true,true\)/s.test(src));
ok('Freshness validation TTL is five minutes',src.includes('CAPITAL_ROTATION_BACKGROUND_VALIDATE_TTL_V114=5*60*1000'));
ok('Yahoo propagates force into fetch layer',/fetchWithTimeout\(url,'json',14000,false,force,attemptDiag\)/.test(src));
ok('Retrieval timestamp is stored separately from market observation',src.includes('retrievedAt')&&src.includes('expectedObservation'));
ok('Stale HTTP fallback explicitly marked',src.includes("transport:'STALE_HTTP_CACHE'")&&src.includes('staleFallback:true'));
ok('Native proxy fallback is distinguished from a fresh native cache hit',src.includes("nativeReason==='upstream-error'||nativeReason==='bridge-exception'")&&src.includes("'STALE_NATIVE_CACHE'"));
ok('Conservative Data through uses oldest required component date',/marketThrough:marketDates\.length\?marketDates\[0\]:null/.test(src));
ok('UI exposes expected latest session',src.includes('Expected latest session'));
ok('UI exposes LIVE/CACHED/STALE/PARTIAL counters',src.includes('snap.freshnessCounts.LIVE')&&src.includes('snap.freshnessCounts.CACHED')&&src.includes('snap.freshnessCounts.STALE')&&src.includes('snap.freshnessCounts.PARTIAL'));
ok('No capital-flow wording falsely claims measured flows',src.includes('Projection only: never represents measured fund flows'));
ok('Release identity advanced to v3.6.4 / 114',src.includes("EXPORT_V47_VERSION='3.6.4',EXPORT_V47_CODE=114"));

console.log(`RESULT ${pass}/${pass+fail}`);process.exit(fail?1:0);
