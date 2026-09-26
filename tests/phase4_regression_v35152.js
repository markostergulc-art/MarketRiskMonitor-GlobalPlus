'use strict';
const fs=require('fs'),crypto=require('crypto'),path=require('path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35151_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
let p=0,f=0;
function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex')}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}

const protectedFns=[
  'riskBand','weightedScore','globalRiskModel','globalContagion','marketMetrics','trendRisk','macroRiskFromWB','fxRisk','systemScoreForCountry',
  'corrMatrix','correlationRegimeFromStats','correlationRegimeDiagnostic','weightedAvailable','inflationDetector','recessionLeadingAndComposite','buildMacroCycle',
  'fiscalScoreRowsV43','fiscalFreshnessV44','fiscalPickReferenceV44','commodityShockRisk','buildCommodityIntelligence','equityInternalsRecord','aggregateEquityInternalsV42',
  'sp500HiddenWeakness','companyCoreRiskParts','companyContextRisk','loadPriorityForV44','pumpLoadSchedulerV44','queueLoadV44','scheduleDeferredV44','scheduleAroundPageV44',
  'refreshActiveV44','sparklineSvg','marketCardSparkPeriodV46','fetchWithTimeout','freshnessModelV49','freshnessFieldsV49','annotateMacroCycleFreshnessV49','countryCoverageV50',
  'countryConfidenceV51','globalConfidenceV51','providerQualityV51','confidenceCompositeV51','usEarly','completeEarly','enrichEarlySources'
];
for(const n of protectedFns){const a=extractFunction(base,n),b=extractFunction(src,n);ok(!!a&&!!b&&a===b,'protected unchanged: '+n,a&&b?sha(a).slice(0,8)+' != '+sha(b).slice(0,8):'missing')}

ok(/versionCode\s+85\b/.test(gradle),'versionCode 85');
ok(/versionName\s+['"]3\.5\.1\.52['"]/.test(gradle),'versionName 3.5.1.52');
ok(html.includes('v3.5.1_52'),'visible header v3.5.1_52');
ok(/VERSION_NAME="3\.5\.1\.52"/.test(release),'release script versionName 3.5.1.52');
ok(/VERSION_CODE="85"/.test(release),'release script versionCode 85');

const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src.trimEnd(),'embedded app.js byte-identical');
ok(html.indexOf(marker)===html.lastIndexOf(marker),'application script embedded once');

for(const n of ['earlyClassMetaV52','earlySignalClassificationV52','annotateEarlySemanticsV52','earlyDisplayRowsV52','earlyClassScoreV52','earlyWarningLayersV52'])ok(!!extractFunction(src,n),'Phase-4 function present: '+n);
for(const cls of ['LEADING','EARLY_CONFIRMATION','CURRENT_STRESS','LATE_CONFIRMATION','STRUCTURAL'])ok(src.includes(cls),'signal class present: '+cls);
ok(src.includes("L('Vodeće upozorenje','Leading Warning')")&&src.includes("L('Trenutni stres','Current Stress')")&&src.includes("L('Potvrda','Confirmation')")&&src.includes("L('Strukturna ranjivost','Structural Vulnerability')"),'four semantic layer cards present');
ok(src.includes('hasSingleCompositeScore:false'),'single misleading aggregate explicitly disabled');
ok(src.includes('EARLY_CONFIRMATION:65')&&src.includes('LATE_CONFIRMATION:35')&&src.includes('ec*65')&&src.includes('lc*35'),'confirmation weighting explicit');
ok(src.includes('semanticUiOnlyV52'),'display-only semantic rows are marked');

ok(src.includes("code:'HR'")&&!src.includes("code:'BA'")&&!src.includes('SASX-10'),'Croatia retained and Bosnia absent');
ok(src.includes('Android.saveExportFile')&&src.includes('saveExportBlobV48'),'native export bridge retained');
ok(src.includes('COUNTRY_MIN_EFFECTIVE_COVERAGE_V50=50')&&src.includes('GLOBAL_MIN_EFFECTIVE_COVERAGE_V50=50'),'Phase-2 eligibility gates retained');
ok(src.includes('countryConfidenceV51')&&src.includes('globalConfidenceV51'),'Phase-3 confidence retained');

ok(extractFunction(base,'globalRiskModel')===extractFunction(src,'globalRiskModel'),'GLOBAL Risk production model byte-identical to v3.5.1.51');
ok(extractFunction(base,'recessionLeadingAndComposite')===extractFunction(src,'recessionLeadingAndComposite'),'recession mathematical model byte-identical');
ok(extractFunction(base,'inflationDetector')===extractFunction(src,'inflationDetector'),'inflation mathematical model byte-identical');
ok(extractFunction(base,'fetchWithTimeout')===extractFunction(src,'fetchWithTimeout'),'network-request architecture unchanged');
ok((src.match(/fetch\(/g)||[]).length===(base.match(/fetch\(/g)||[]).length,'no additional fetch call sites');

// Ensure the Phase-4 code did not add Early classification fields to globalRiskModel input semantics.
const gr=extractFunction(src,'globalRiskModel')||'';
ok(!/signalClass|earlyWarningLayersV52|earlyClassScoreV52/.test(gr),'GLOBAL Risk does not consume Phase-4 timing classes');

// Methodology/export audit must contain timing semantics without secrets.
ok(src.includes('earlyWarningSummary')&&src.includes('signalClass')&&src.includes('timingMeaning')&&src.includes('classReason'),'methodology/export includes Early timing audit fields');
ok(!/api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{12,}/i.test(src),'no obvious hard-coded API secret added');

console.log(`RESULT - ${p}/${p+f} Phase 4 v3.5.1.52 regression checks ${f?'FAIL':'PASS'}`);if(f)process.exit(1);
