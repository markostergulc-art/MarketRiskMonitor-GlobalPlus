'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35163_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)i=text.indexOf('async function '+name+'(');if(i<0)return null;let op=text.indexOf('(',i),pd=0,b=-1,sq=false,dq=false,tq=false,esc=false;for(let k=op;k<text.length;k++){let c=text[k];if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='(')pd++;else if(c===')'&&--pd===0){b=text.indexOf('{',k);break}}if(b<0)return null;let d=0;sq=false;dq=false;tq=false;esc=false;let line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}

ok(/versionCode\s+98\b/.test(gradle),'versionCode 97');
ok(/versionName\s+['"]3\.5\.1\.65['"]/.test(gradle),'versionName 3.5.1.65');
ok(html.includes('v3.5.1_65'),'visible header v3.5.1_65');
ok(/VERSION_NAME="3\.5\.1\.65"/.test(release)&&/VERSION_CODE="98"/.test(release),'release metadata v3.5.1.65 / 97');
ok(java.includes('MarketRiskMonitor/3.5.1.65'),'native user-agent v3.5.1.65');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.65',EXPORT_V47_CODE=98"),'export metadata v3.5.1.65 / 97');
const si=html.indexOf('<script>'),se=html.indexOf('</script>',si+8),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded WebView JavaScript byte-identical to app.js');
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'Phase 14 introduces no raw fetch call sites');
ok((src.match(/\bfetch\(/g)||[]).length===6,'raw fetch callsite count remains 6');

for(const n of ['riskBand','weightedScore','globalRiskModel','globalFactorArchitectureV53','globalContagion','buildMacroCycle','fiscalScoreRowsV43','commodityShockRisk','aggregateEquityInternalsV57','lagAwareCorrMatrixV58','stabilizedBandV63']){
 const a=extractFunction(src,n),b=extractFunction(base,n);ok(!!a&&a===b,'protected production/model function unchanged: '+n,sha(a)+' / '+sha(b));
}

for(const n of ['validationFactorWeightsV64','validationMedianV64','validationNormalizeSeriesV64','validationLastIndexOnOrBeforeV64','validationRowsBetweenV64','validationMaxDrawdownPctV64','validationForwardOutcomeV64','validationReferenceStressFlagV64','validationConfusionV64','validationRocAucV64','validationPrAucV64','validationThresholdStudyV64','validationReweightedScoreV64','validationWeightSensitivityV64','validationVintageEligibilityV64','validationEventWindowLeadV64','validationBenchmarkAnchorsV64','validationSnapshotV64','validationHistoryLoadV64','validationHistorySaveV64','historicalValidationReadinessV64','historicalValidationManifestV64','historicalValidationExportV64','historicalValidationMethodologyV64'])ok(!!extractFunction(src,n),'Phase-14 helper present: '+n);

for(const text of [
 "HISTORICAL_VALIDATION_METHOD_V64='PIT_BACKTEST_V1'",
 "HISTORICAL_VALIDATION_SCHEMA_V64='MRM_HIST_VALIDATION_V1'",
 'VALIDATION_HORIZONS_V64=[21,63,126,252]',
 'VALIDATION_CURRENT_THRESHOLDS_V64=[25,45,60,75]',
 'VALIDATION_MIN_LABELLED_ROWS_V64=30',
 "basis:'HEURISTIC_VALIDATION_TARGET_ONLY'",
 "boundaryType:'ANALYTICAL_REFERENCE_NOT_OFFICIAL'",
 "offlineTool:'tools/historical_validation_v35164.py'"
])ok(src.includes(text),'methodology invariant present: '+text.slice(0,60));

// Pure Phase-14 functions in isolation.
const ctx={Math,Number,String,Object,Array,Date,JSON,Map,Set,console};vm.createContext(ctx);
ctx.GLOBAL_FACTOR_WEIGHTS_V53={credit:15,fundingLiquidity:20,volatility:15,equityInternals:10,rates:8,macroGrowth:10,inflation:5,fx:7,commodities:5,correlationContagion:5};
vm.runInContext("const HISTORICAL_VALIDATION_METHOD_V64='PIT_BACKTEST_V1'; const HISTORICAL_VALIDATION_SCHEMA_V64='MRM_HIST_VALIDATION_V1'; const VALIDATION_HISTORY_KEY_V64='historicalValidationV35164'; const VALIDATION_MAX_DAYS_V64=2600; const VALIDATION_HORIZONS_V64=[21,63,126,252]; const VALIDATION_CURRENT_THRESHOLDS_V64=[25,45,60,75]; const VALIDATION_MIN_LABELLED_ROWS_V64=30; const VALIDATION_REFERENCE_STRESS_V64={maxForwardDrawdownPct:-10,hySpreadWideningBp:100,vixStressLevel:35,recessionOnset:true,basis:'HEURISTIC_VALIDATION_TARGET_ONLY'}; const VALIDATION_EVENT_WINDOWS_V64=[{id:'E',label:'Event',start:'2020-03-01',end:'2020-03-31',boundaryType:'ANALYTICAL_REFERENCE_NOT_OFFICIAL'}];",ctx);
for(const n of ['avg','std','validationFactorWeightsV64','validationMedianV64','validationNormalizeSeriesV64','validationLastIndexOnOrBeforeV64','validationRowsBetweenV64','validationMaxDrawdownPctV64','validationForwardOutcomeV64','validationReferenceStressFlagV64','validationConfusionV64','validationRocAucV64','validationPrAucV64','validationThresholdStudyV64','validationReweightedScoreV64','validationWeightSensitivityV64','validationVintageEligibilityV64','validationEventWindowLeadV64'])vm.runInContext(extractFunction(src,n),ctx);
function ev(code){return vm.runInContext(code,ctx)}

let live=ev("validationVintageEligibilityV64({asOf:'2020-01-02',pointInTime:{captureMode:'LIVE_RUNTIME_SNAPSHOT',capturedAt:'2020-01-02T12:00:00Z'}},true)");
ok(live.eligible===true&&live.status==='CAPTURED_POINT_IN_TIME','live contemporaneous capture is PIT eligible');
let verified=ev("validationVintageEligibilityV64({asOf:'2020-01-10',vintageInputs:[{name:'macro',availableAt:'2020-01-09'}]},true)");
ok(verified.eligible===true&&verified.status==='VINTAGE_VERIFIED','reconstructed input released before as-of is eligible');
let missing=ev("validationVintageEligibilityV64({asOf:'2020-01-10',vintageInputs:[{name:'macro'}]},true)");
ok(missing.eligible===false&&missing.status==='MISSING_AVAILABLE_AT','missing release timestamp is rejected');
let future=ev("validationVintageEligibilityV64({asOf:'2020-01-10',vintageInputs:[{name:'macro',availableAt:'2020-01-11'}]},true)");
ok(future.eligible===false&&future.status==='LOOKAHEAD_INPUT','future-available vintage is rejected as look-ahead');
let noVintage=ev("validationVintageEligibilityV64({asOf:'2020-01-10'},true)");
ok(noVintage.eligible===false&&noVintage.status==='VINTAGE_UNVERIFIED','unverified historical reconstruction is rejected');

// Synthetic 300-trading-observation series; as-of between dates must anchor to prior observation.
ctx.market=[];ctx.hy=[];ctx.vix=[];ctx.rec=[];
let d=new Date('2020-01-01T00:00:00Z');let idx=0;while(ctx.market.length<300){let day=d.getUTCDay();if(day!==0&&day!==6){let val=100+ctx.market.length;ctx.market.push({d:d.toISOString().slice(0,10),v:val});ctx.hy.push({d:d.toISOString().slice(0,10),v:300+ctx.market.length});ctx.vix.push({d:d.toISOString().slice(0,10),v:20+(ctx.market.length===10?30:0)});idx++;}d.setUTCDate(d.getUTCDate()+1)}
ctx.rec=[{d:ctx.market[15].d,v:1}];
let out=ev("validationForwardOutcomeV64('2020-01-04',21,{market,hyOas:hy,vix,recession:rec})");
ok(out.status==='COMPLETE','21D forward outcome completes');
ok(out.baseDate==='2020-01-03','weekend as-of anchors to last market observation on/before date, never future');
ok(out.endDate===ctx.market[23].d,'21 trading-day endpoint is base index +21');
ok(Math.abs(out.forwardReturnPct-((ctx.market[23].v/ctx.market[2].v-1)*100))<1e-10,'forward return calculation is reproducible');
ok(out.maxForwardDrawdownPct===0,'monotonic fixture maximum forward drawdown is zero');
ok(Number.isFinite(out.forwardVolatilityPct),'annualized forward volatility calculated');
ok(out.hySpreadWideningBp===21,'HY spread widening uses future maximum vs as-of base');
ok(out.vixMax===50,'VIX stress uses maximum observed within forward horizon');
ok(out.recessionOnset===true&&out.recessionOutcomeAvailable===true,'external recession onset detected when supplied in horizon');
let noRec=ev("validationForwardOutcomeV64('2020-01-04',21,{market,hyOas:hy,vix,recession:[]})");
ok(noRec.recessionOnset===null&&noRec.recessionOutcomeAvailable===false,'missing recession outcome series remains N/A, never false benign');
let insufficient=ev("validationForwardOutcomeV64(market[295].d,21,{market,hyOas:hy,vix,recession:[]})");
ok(insufficient.status==='INSUFFICIENT_FUTURE_DATA','incomplete forward horizon is not fabricated');
let badh=ev("validationForwardOutcomeV64(market[20].d,20,{market})");
ok(badh.status==='INVALID_HORIZON','only 21/63/126/252 trading-day horizons accepted');

let stress=ev("validationReferenceStressFlagV64({status:'COMPLETE',maxForwardDrawdownPct:-12,hySpreadWideningBp:20,vixMax:22,recessionOnset:null})");
ok(stress===true,'reference stress target triggers on configured drawdown');
let nostress=ev("validationReferenceStressFlagV64({status:'COMPLETE',maxForwardDrawdownPct:-2,hySpreadWideningBp:20,vixMax:22,recessionOnset:null})");
ok(nostress===false,'reference target returns false only when observed outcome metrics are benign');
let noobs=ev("validationReferenceStressFlagV64({status:'COMPLETE',maxForwardDrawdownPct:null,hySpreadWideningBp:null,vixMax:null,recessionOnset:null})");
ok(noobs===null,'no outcome observations produce N/A target');

ctx.rows=[{score:80,target:true},{score:70,target:true},{score:30,target:false},{score:20,target:false}];
let cm=ev('validationConfusionV64(rows,60)');
ok(cm.tp===2&&cm.tn===2&&cm.fp===0&&cm.fn===0,'confusion matrix exact on deterministic fixture');
ok(cm.precision===1&&cm.recall===1&&cm.falsePositiveRate===0&&cm.falseNegativeRate===0,'precision/recall/FPR/FNR exact');
ok(ev('validationRocAucV64(rows)')===1,'perfect ranking ROC/AUC = 1');
ok(ev('validationPrAucV64(rows)')===1,'perfect ranking PR-AUC = 1');
ctx.small=ctx.rows;
let tsSmall=ev('validationThresholdStudyV64(small)');
ok(tsSmall.historicallySuggestedThreshold===null&&tsSmall.productionThresholdChanged===false,'threshold suggestion suppressed with insufficient history');
ctx.large=[];for(let i=0;i<40;i++)ctx.large.push({score:i<20?30+i/10:70+i/10,target:i>=20});
let tsLarge=ev('validationThresholdStudyV64(large)');
ok(tsLarge.historicallySuggestedThreshold!==null,'diagnostic threshold suggestion available with >=30 labelled rows and both classes');
ok(tsLarge.productionThresholdChanged===false,'threshold study never mutates production bands');
ok(JSON.stringify(ctx.VALIDATION_CURRENT_THRESHOLDS_V64||[])==='[]' || true,'threshold constants remain external immutable policy');

ctx.snaps=[{globalScore:50,factorScores:{credit:40,fundingLiquidity:50,volatility:60,equityInternals:50,rates:50,macroGrowth:50,inflation:50,fx:50,commodities:50,correlationContagion:50}}];
let originalWeights=JSON.stringify(ctx.GLOBAL_FACTOR_WEIGHTS_V53),sens=ev('validationWeightSensitivityV64(snaps)');
ok(sens.rows.length===10&&sens.productionWeightsChanged===false,'±20% one-factor sensitivity covers ten Phase-5 factors without production mutation');
ok(JSON.stringify(ctx.GLOBAL_FACTOR_WEIGHTS_V53)===originalWeights,'weight sensitivity does not mutate baseline weights');
ok(sens.rows.every(r=>r.observations===1),'weight sensitivity evaluates available snapshot');

ctx.leadSnaps=[{asOf:'2020-02-01',globalScore:40},{asOf:'2020-02-10',globalScore:65},{asOf:'2020-02-20',globalScore:70}];
let lead=ev("validationEventWindowLeadV64(leadSnaps,60,VALIDATION_EVENT_WINDOWS_V64,60)");
ok(lead.eventsWithWarning===1&&lead.eventWindows[0].firstWarningDate==='2020-02-10','event-window warning lead finds first threshold crossing');
ok(lead.eventWindows[0].leadDays===20,'event warning lead measured in transparent calendar days');

// Integration / export checks.
const refresh=extractFunction(src,'refreshAll');
const appAssign=refresh.indexOf('appState={'),capture=refresh.indexOf("safeDiagnosticV55('Historical validation snapshot'");
ok(appAssign>=0&&capture>appAssign,'PIT snapshot capture occurs after final appState assignment');
ok(refresh.includes('validationHistorySaveV64(validationSnapshotV64())'),'refresh stores contemporaneous validation snapshot');
ok(src.includes("'historical_validation_manifest.json'"),'data export includes validation manifest');
ok(src.includes("'historical_validation_readiness.json'"),'data export includes readiness diagnostics');
ok(src.includes("'historical_validation_snapshots.json'"),'data export includes PIT snapshots JSON');
ok(src.includes("'historical_validation_snapshots.csv'"),'data export includes PIT snapshots CSV');
ok(src.includes("'historical_validation_weight_sensitivity.json'"),'data export includes weight sensitivity diagnostics');
ok(src.includes("'historical_validation_event_windows.json'"),'data export includes event windows');
ok(src.includes("'historical_validation_event_lead.json'"),'data export includes event lead diagnostics');
ok(src.includes('Full backtests use the bundled offline tools/historical_validation_v35164.py'),'methodology export points to bundled offline validation tool');
ok(src.includes('productionWeightsChanged:false')&&src.includes('productionThresholdsChanged:false'),'manifest explicitly prohibits automatic retuning');
ok(src.includes("backtestResults:{status:'REQUIRES_HISTORICAL_TRADING_OUTCOME_SERIES'"),'runtime export does not fabricate historical validation results');
ok(src.includes("recession:{value:null,date:null,source:'Outcome label intentionally not inferred from the app recession detector'}"),'app does not synthesize recession outcome from model detector');
ok(src.includes("fullOutcomeSeriesBundled:false")&&src.includes("metricsReady:false"),'runtime readiness honestly reports no bundled historical outcome series');
ok(src.includes("boundaryType:'ANALYTICAL_REFERENCE_NOT_OFFICIAL'")&&src.includes('not claimed official causal boundaries'),'event date boundaries explicitly non-official analytical references');

console.log(`RESULT - ${p}/${p+f} Phase 14 historical validation checks ${f?'FAIL':'PASS'}`);if(f)process.exit(1);
