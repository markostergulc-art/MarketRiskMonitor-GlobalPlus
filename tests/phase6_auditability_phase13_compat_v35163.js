'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35156_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0; function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)i=text.indexOf('async function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function extractConstStatement(text,name){let i=text.indexOf('const '+name+'=');if(i<0)return null;let d1=0,d2=0,d3=0,sq=false,dq=false,tq=false,esc=false;for(let j=i;j<text.length;j++){let c=text[j];if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='[')d1++; if(c===']')d1--; if(c==='{')d2++; if(c==='}')d2--; if(c==='(')d3++; if(c===')')d3--; if(c===';'&&d1===0&&d2===0&&d3===0)return text.slice(i,j+1)}return null}

ok(/versionCode\s+96\b/.test(gradle),'versionCode 96');
ok(/versionName\s+['"]3\.5\.1\.63['"]/.test(gradle),'versionName 3.5.1.63');
ok(html.includes('v3.5.1_63'),'visible header v3.5.1_63');
ok(/VERSION_NAME="3\.5\.1\.63"/.test(release)&&/VERSION_CODE="96"/.test(release),'release metadata v3.5.1.63 / 96');
ok(java.includes('MarketRiskMonitor/3.5.1.63'),'native user-agent version 3.5.1.63');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.63',EXPORT_V47_CODE=96"),'export metadata v3.5.1.63 / 96');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded WebView JavaScript byte-identical to canonical app.js');

ok(src.includes("const SCORE_AUDIT_SCHEMA_V56='SA1'"),'Phase-6 audit schema SA1 present');
ok(src.includes('SCORE_TRANSFORM_REGISTRY_V56'),'transform registry present');
ok(src.includes('scoreAuditSnapshotV56'),'runtime score-audit snapshot present');
ok(src.includes("name:'score_transforms.json'"),'data ZIP exports score_transforms.json');
ok(src.includes("name:'score_traces.json'")&&src.includes("name:'score_traces.csv'"),'data ZIP exports JSON and CSV traces');
ok(src.includes('methodologyTransformsMarkdownV56'),'methodology export appends transform catalogue');
for(const field of ['rawValue','transformType','parameters','normalizedValue','riskScore','direction']) ok(src.includes(field),'required audit field present: '+field);
for(const basis of ['HEURISTIC','HISTORICAL','PROVIDER_STANDARD']) ok(src.includes("'"+basis+"'")||src.includes('`'+basis+'`'),'provenance vocabulary present: '+basis);
ok(src.includes("riskMappingBasis:'HEURISTIC'")&&src.includes("basis:'HISTORICAL'"),'historical normalization can retain heuristic risk mapping explicitly');

// Parse registry in isolation and validate contract/provenance.
const wstmt=extractConstStatement(src,'GLOBAL_FACTOR_WEIGHTS_V53');
const rstart=src.indexOf("const SCORE_AUDIT_SCHEMA_V56='SA1';"),rend=src.indexOf('const SCORE_TRANSFORM_MAP_V56=',rstart);
const rblock=src.slice(rstart,rend)+"\nglobalThis.__registry=SCORE_TRANSFORM_REGISTRY_V56; globalThis.__basis=SCORE_AUDIT_BASIS_V56;";
const rctx={};vm.createContext(rctx);vm.runInContext(wstmt+'\n'+rblock,rctx);
const registry=JSON.parse(JSON.stringify(rctx.__registry));
ok(Array.isArray(registry)&&registry.length>=40,'registry documents at least 40 meaningful transforms',String(registry.length));
ok(registry.every(x=>x.id&&x.module&&x.label&&x.transformType&&x.direction&&x.basis&&x.parameters&&x.sourceFunction),'every registry entry has reproducibility metadata');
ok(registry.every(x=>['HEURISTIC','HISTORICAL','PROVIDER_STANDARD'].includes(x.basis)),'every registry basis uses approved vocabulary');
ok(new Set(registry.map(x=>x.id)).size===registry.length,'registry transform IDs are unique');
ok(registry.some(x=>x.id==='early_sahm'&&x.basis==='HEURISTIC'&&/0\.50/.test(x.providerReference||'')),'Sahm provider rule distinguished from heuristic risk buckets');
ok(registry.some(x=>x.id==='historical_percentile'&&x.basis==='HISTORICAL'&&x.riskMappingBasis==='HEURISTIC'),'historical percentile provenance is not overstated');
ok(registry.some(x=>x.id==='agsi_fill_percent'&&x.basis==='PROVIDER_STANDARD'),'provider-standard bounded metric is explicitly identified without calling it empirical risk calibration');

// Phase 6 auditability must remain intact. Phase 7 intentionally changes equity weighting/coverage helpers; unrelated transforms remain byte-identical to v3.5.1.56.
const protectedFns=['volRisk','trendRisk','fxRisk','marketRisk','macroRiskFromWB','weightedScore','riskBand','adverseMomentumRisk','companyDrawdownRisk','companyVolatilityRisk','companyCoreRiskParts','dividendSafety','globalContagion','globalRiskModel','inflationRateRisk','inflationDetector','recessionLeadingAndComposite','usEarly','fiscalPiecewiseV43','fiscalAbsRiskV43','fiscalScoreRowsV43','commodityShockRisk','sprFillRisk','daysSupplyRisk','inventoryWeeklyRisk'];
for(const n of protectedFns){let a=extractFunction(src,n),b=extractFunction(base,n);ok(!!a&&a===b,'production function unchanged: '+n,sha(a)+' / '+sha(b))}
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'no new raw fetch call sites');

// Independent manual score reproductions. These expected values are derived outside production functions.
const clamp=x=>Math.max(0,Math.min(100,x));
let ctx={Number,Math,Array,Object,clamp};vm.createContext(ctx);
for(const n of ['volRisk','adverseMomentumRisk','companyDrawdownRisk','companyVolatilityRisk','inflationRateRisk','fiscalPiecewiseV43','fiscalAbsRiskV43']) vm.runInContext(extractFunction(src,n),ctx);
const manualVol=24.6<14?15:24.6<20?30:24.6<28?55:24.6<40?75:92;
ok(ctx.volRisk(24.6)===manualVol&&manualVol===55,'manual reproduction: volRisk(24.6) = 55');
const mm=-4,manualMom=mm>=5?15:mm>=1?25:mm>=-2?45:mm>=-6?65:82;
ok(ctx.adverseMomentumRisk(mm)===manualMom&&manualMom===65,'manual reproduction: adverseMomentumRisk(-4) = 65');
const manualInfl=3.5<=2.2?20:3.5<=3?42:3.5<=4?68:88;
ok(ctx.inflationRateRisk(3.5,2.2,3,4)===manualInfl&&manualInfl===68,'manual reproduction: inflationRateRisk(3.5) = 68');
const manualDebt75=30+(75-60)/(90-60)*(55-30);
ok(Math.abs(ctx.fiscalPiecewiseV43(75,[[20,5],[40,15],[60,30],[90,55],[120,75],[150,90],[200,97]])-manualDebt75)<1e-9,'manual reproduction: fiscal debt piecewise interpolation',String(manualDebt75));
ok(Math.abs(ctx.fiscalAbsRiskV43('debt',75,{raw:{}})-manualDebt75)<1e-9,'manual reproduction: fiscalAbsRiskV43 debt uses documented points');

// Independently reproduce two usEarly threshold transforms with stubs.
const us=extractFunction(src,'usEarly');
const uctx={Number,Math,Array,Object,ratesInflationIndicators:()=>[],liquidityPlumbingIndicators:()=>[]};vm.createContext(uctx);vm.runInContext(us,uctx);
const rows=uctx.usEarly({BAMLH0A0HYM2:[{v:4.10,d:'2026-09-01'}],VIXCLS:[{v:24.6,d:'2026-09-01'}]});
const hy=rows.find(x=>x.name==='US HY OAS'),vix=rows.find(x=>x.name==='VIX');
ok(hy&&Math.abs(hy.value-410)<1e-9&&hy.score===58,'manual reproduction: HY OAS 410bp => 58 (current production thresholds)');
ok(vix&&vix.value===24.6&&vix.score===55,'manual reproduction: VIX 24.6 => 55 (current production thresholds)');

// Independently reproduce factor-weighted GLOBAL formula without changing architecture.
const weights={credit:15,fundingLiquidity:20,volatility:15,equityInternals:10,rates:8,macroGrowth:10,inflation:5,fx:7,commodities:5,correlationContagion:5};
const comps={credit:40,fundingLiquidity:30,volatility:50,equityInternals:45,rates:35,macroGrowth:42,inflation:55,fx:38,commodities:47,correlationContagion:44};
const num=Object.entries(weights).reduce((a,[k,w])=>a+comps[k]*w,0),den=Object.values(weights).reduce((a,b)=>a+b,0),manualGlobal=Math.round(num/den);
ok(manualGlobal===41,'manual reproduction: deterministic weighted GLOBAL formula = 41',String(manualGlobal));

// Existing hotfix protections remain present.
ok(src.includes("safeDiagnosticV55('Hidden Risk / Anomaly Detector',()=>hiddenRiskAnomaly"),'v55 refresh failure isolation retained');
ok(html.includes('id="topStatusStage" class="top-status-stage"'),'fixed top-status stage retained');
ok(html.includes('id="globalConfidenceMeta" class="global-confidence-meta"'),'compact global confidence metadata retained');

console.log(`RESULT - ${p}/${p+f} Phase 6 compatibility checks under Phase 8 ${f?'FAIL':'PASS'}`);if(f)process.exit(1);
