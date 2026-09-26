const fs=require('fs'),crypto=require('crypto');
const src=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const base=fs.readFileSync('app_v35149_baseline.js','utf8');
let p=0,f=0;function ok(c,m){if(c){console.log('PASS - '+m);p++}else{console.error('FAIL - '+m);f++}}
function extract(text,name){let a=text.indexOf('function '+name+'(');if(a<0)a=text.indexOf('async function '+name+'(');if(a<0)return'';let par=text.indexOf('(',a),pd=0,q=null,e=false,b=-1;for(let i=par;i<text.length;i++){let c=text[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='\"'||c==="'"||c==='`'){q=c;continue}if(c==='(')pd++;else if(c===')'&&--pd===0){b=text.indexOf('{',i+1);break}}if(b<0)return'';let d=0;q=null;e=false;for(let i=b;i<text.length;i++){let c=text[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='\"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(a,i+1)}return''}
function hash(x){return crypto.createHash('sha256').update(x).digest('hex')}
// Execute only the pure chart-period helpers with small stubs.
const helperNames=['chartDateV45','chartFrequencyV45','chartDateLabelV45','chartExpectedDaysV45','chartPeriodTextV45'];
let helperCode=helperNames.map(n=>extract(src,n)).join('\n');
let currentLang='en';function L(hr,en){return currentLang==='hr'?hr:en}function locale(){return currentLang==='hr'?'hr-HR':'en-US'}function chartRangeHintV45(){return''}
eval(helperCode);
let dailyDates=[];for(let i=0;i<10;i++){let d=new Date(Date.UTC(2025,8,14+i));dailyDates.push({d:d.toISOString().slice(0,10),v:i+1})}dailyDates.push({d:'2026-09-14',v:20});let daily=[{data:dailyDates}];
let t=chartPeriodTextV45(daily,{rangeLabel:'1Y'},null);
ok(t.includes('1Y')&&t.includes('Daily')&&t.includes('2025')&&t.includes('2026'),'1Y chart exposes named range, frequency and actual date interval');
let short=[{data:[{d:'2026-01-12',v:1},{d:'2026-09-14',v:2}]}];
ok(chartPeriodTextV45(short,{rangeLabel:'1Y'},null).includes('data available'),'requested 1Y with materially shorter data window is not misrepresented');
ok(chartFrequencyV45(['2026-01-01','2026-04-01','2026-07-01','2026-10-01'])==='Quarterly','quarterly frequency inference');
ok(chartFrequencyV45(['2026-01-01','2026-02-01','2026-03-01'])==='Monthly','monthly frequency inference');
ok(src.includes("setChartPeriodV45(canvas,defs,opts)"),'shared drawLineChart adds period label to all shared charts');
ok(extract(src,'drawHistory').includes('setChartPeriodV45'),'custom Global Risk history chart adds period label');
ok(src.includes("chartRangeHintV45")&&src.includes("#marketChartControls .chart-btn.active")&&src.includes("#stockChartControls .chart-btn.active")&&src.includes("#etfChartControls .chart-btn.active"),'dynamic range controls feed the period label');
ok(src.includes("id==='euGasFillChart')return'5Y'")&&src.includes("id==='commodityTrendChart')return'1Y'"),'fixed 5Y EU Gas and 1Y commodity chart ranges are labeled');
ok(html.includes('.chart-period-v45'),'period labels have compact mobile CSS');

ok(src.includes('const loadUiV45=')&&src.includes('loadUiDescribeUrlV45'),'presentation-only loading observer exists');
ok(extract(src,'updateLoadStatusV44').includes('load-progress-v45'),'loading observer renders a real progress bar');
ok(extract(src,'updateLoadStatusV44').includes('indeterminate'),'unknown totals use indeterminate progress');
ok(extract(src,'updateLoadStatusV44').includes('progress.done/progress.total'),'known totals use real done/total progress');
ok(extract(src,'updateLoadStatusV44').includes("live.provider")&&extract(src,'updateLoadStatusV44').includes("live.dataset"),'loading UI exposes provider and dataset');
ok(extract(src,'refreshProgressNetwork').includes('loadUiDescribeUrlV45'),'existing refresh progress now shows provider plus dataset');
ok(extract(src,'fetchWithTimeout').includes('loadUiNetworkV45')&&!extract(src,'loadUiNetworkV45').includes('fetch('),'observer watches existing requests and creates no network request');
ok(extract(src,'updateLoadStatusV44').includes('Prikazani spremljeni podaci')||extract(src,'updateLoadStatusV44').includes('Showing cached data'),'cached-data refresh state is visible');
ok(html.includes('.load-progress-v45')&&html.includes('@keyframes mrmLoadSweepV45'),'loading observer has determinate/indeterminate mobile styling');

const sched=['loadPriorityForV44','pumpLoadSchedulerV44','queueLoadV44','scheduleDeferredV44','scheduleAroundPageV44','refreshActiveV44'];
for(const n of sched)ok(hash(extract(src,n))===hash(extract(base,n)),n+' scheduler logic byte-identical to v44');
const protectedFns=['globalContagion','marketMetrics','trendRisk','corrMatrix','correlationRegimeFromStats','correlationRegimeDiagnostic','buildMacroCycle','sp500HiddenWeakness','companyCoreRiskParts','companyContextRisk','fiscalFreshnessV44','fiscalPickReferenceV44','fiscalBandV43','fiscalScoreRowsV43'];
for(const n of protectedFns)ok(hash(extract(src,n))===hash(extract(base,n)),n+' protected methodology unchanged');
ok(!extract(src,'updateLoadStatusV44').includes('fetch('),'progress UI itself performs zero network calls');
ok(/versionCode\s+83/.test(fs.readFileSync('app/build.gradle','utf8'))&&/versionName\s+'3.5.1.50'/.test(fs.readFileSync('app/build.gradle','utf8')),'v3.5.1.50 / versionCode 82 source metadata');
ok(html.includes('v3.5.1_50'),'visible version label is v3.5.1_50');
let st=html.lastIndexOf("<script>'use strict';"),en=html.indexOf('</script>',st),embedded=html.slice(st+'<script>'.length,en);ok(embedded===src.trimEnd(),'embedded app.js byte-identical to canonical app.js');
console.log(`RESULT - ${p}/${p+f} v3.5.1.50 graph/loading UI regression checks PASS`);if(f)process.exit(1);
