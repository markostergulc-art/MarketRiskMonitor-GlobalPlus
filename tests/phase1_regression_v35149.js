'use strict';
const fs=require('fs'),crypto=require('crypto'),path=require('path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35148_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
let p=0,f=0;
function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++;}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++;}}
function sha(s){return crypto.createHash('sha256').update(s).digest('hex');}
function extractFunction(text,name){
  let i=text.indexOf('function '+name+'(');
  if(i<0) return null;
  let brace=text.indexOf('{',i), depth=0, sq=false,dq=false,tq=false,esc=false, line=false,block=false;
  for(let j=brace;j<text.length;j++){
    const c=text[j],n=text[j+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;j++}continue}
    if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`')){sq=dq=tq=false}continue}
    if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}
    if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return text.slice(i,j+1);
  }
  return null;
}
const protectedFns=['riskBand','weightedScore','globalRiskModel','globalContagion','marketMetrics','trendRisk','macroRiskFromWB','fxRisk','systemScoreForCountry','corrMatrix','correlationRegimeFromStats','correlationRegimeDiagnostic','weightedAvailable','inflationDetector','recessionLeadingAndComposite','buildMacroCycle','fiscalScoreRowsV43','fiscalFreshnessV44','fiscalPickReferenceV44','commodityShockRisk','buildCommodityIntelligence','equityInternalsRecord','aggregateEquityInternalsV42','sp500HiddenWeakness','companyCoreRiskParts','companyContextRisk','loadPriorityForV44','pumpLoadSchedulerV44','queueLoadV44','scheduleDeferredV44','scheduleAroundPageV44','refreshActiveV44','sparklineSvg','marketCardSparkPeriodV46','fetchWithTimeout'];
for(const n of protectedFns){const a=extractFunction(base,n),b=extractFunction(src,n);ok(!!a&&!!b&&a===b,'protected function byte-identical: '+n,a&&b?`${sha(a).slice(0,8)} != ${sha(b).slice(0,8)}`:'missing')}
// Versioning and canonical embedding
ok(/versionCode\s+82\b/.test(gradle),'versionCode 82');
ok(/versionName\s+['"]3\.5\.1\.49['"]/.test(gradle),'versionName 3.5.1.49');
ok(html.includes('v3.5.1_49'),'visible header v3.5.1_49');
const marker="<script>'use strict';"; const si=html.indexOf(marker); const se=html.indexOf('</script>',si);
const embedded=si>=0&&se>si ? html.slice(si+'<script>'.length,se) : '';
ok(embedded===src.trimEnd(),'embedded app.js byte-identical to canonical app.js');
ok(html.indexOf(marker)===html.lastIndexOf(marker),'canonical application script embedded once');
// Universe continuity
ok(src.includes("code:'HR'") && !src.includes("code:'BA'") && !src.includes('SASX-10'),'Croatia retained, Bosnia runtime config absent');
// Native export continuity in JS
for(const token of ['saveExportBlobV48','Android.saveExportFile','Preparing export','Saving file','methodologyMarkdownV47','auditSnapshotV47'])ok(src.includes(token),'v48 native export continuity: '+token);
// Phase 1 freshness architecture
for(const token of ['FRED_RUNTIME_META_V49','FRED_FREQUENCY_V49','FRED_RELEASE_RULES_V49','freshnessModelV49','freshnessFieldsV49','annotateMacroCycleFreshnessV49','OLD_BUT_CURRENT_RELEASE','expectedNextRelease','releaseStatus']) ok(src.includes(token),'freshness v49 token present: '+token);
ok(src.includes("NFCI:{nextLagDays:12") || src.includes("'NFCI':{nextLagDays:12") || src.includes('NFCI:{nextLagDays:12'),'NFCI cadence rule encoded');
ok(src.includes('DPSACBW027SBOG') && src.includes('nextLagDays:16'),'bank deposits cadence rule encoded');
// v45/v46 chart semantics preserved
ok(!!extractFunction(src,'setChartPeriodV45') && !!extractFunction(src,'chartPeriodTextV45'),'generic chart-period helper retained');
ok(!!extractFunction(src,'marketCardSparkPeriodV46'),'Markets-card sparkline period retained');
// No broad architecture changes in protected functions already establishes loading/financial continuity.
console.log(`RESULT - ${p}/${p+f} Phase 1 v3.5.1.49 consolidated regression checks PASS`);
if(f)process.exit(1);
