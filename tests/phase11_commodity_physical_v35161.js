'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35160_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)i=text.indexOf('async function '+name+'(');if(i<0)return null;let bp=text.indexOf('){',i),b=bp>=0?bp+1:text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function extractConst(text,name){let i=text.indexOf('const '+name+'=');if(i<0)return null;let d=0,sq=false,dq=false,tq=false,esc=false;for(let j=i;j<text.length;j++){let c=text[j];if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{'||c==='['||c==='(')d++;if(c==='}'||c===']'||c===')')d--;if(c===';'&&d===0)return text.slice(i,j+1)}return null}

ok(/versionCode\s+94\b/.test(gradle),'versionCode 94');
ok(/versionName\s+['"]3\.5\.1\.61['"]/.test(gradle),'versionName 3.5.1.61');
ok(html.includes('v3.5.1_61'),'visible header v3.5.1_61');
ok(/VERSION_NAME="3\.5\.1\.61"/.test(release)&&/VERSION_CODE="94"/.test(release),'release metadata v3.5.1.61 / 94');
ok(java.includes('MarketRiskMonitor/3.5.1.61'),'native user-agent v3.5.1.61');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.61',EXPORT_V47_CODE=94"),'export metadata v3.5.1.61 / 94');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded WebView JavaScript byte-identical to app.js');
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'Phase 11 introduces no raw fetch call sites');

// Price-risk and global production mathematics remain untouched.
for(const n of ['commodityShockRisk','commodityRegime','buildCommodityOverviewV32','globalFactorArchitectureV53','globalRiskModel']){
 const a=extractFunction(src,n),b=extractFunction(base,n);ok(!!a&&a===b,'protected price/global function unchanged: '+n,sha(a)+' / '+sha(b));
}
for(const n of ['gasPhysicalMetricsV61','euGasPhysicalSnapshotV61','usGasPhysicalSnapshotV61','usOilPhysicalSnapshotV61','commodityPhysicalSnapshotV61','physicalSectionTitleV61','priceSectionTitleV61'])ok(!!extractFunction(src,n),'Phase-11 function present: '+n);
ok(!!extractConst(src,'COMMODITY_PHYSICAL_METHOD_V61'),'Phase-11 methodology version constant present');
ok(!!extractConst(src,'COMMODITY_PHYSICAL_RULES_V61'),'Phase-11 rules constant present');
ok(src.includes('productionGlobalRiskIntegration:false'),'physical supply layer explicitly diagnostic-only');
ok(!extractFunction(src,'globalFactorArchitectureV53').includes('commodityPhysicalSnapshotV61'),'physical metrics are not silently inserted into GLOBAL Risk');

// Deterministic transform checks.
const ctx={console,Math,Number,String,Object,Array};vm.createContext(ctx);vm.runInContext(extractFunction(src,'gasPhysicalMetricsV61'),ctx);
let m=vm.runInContext('gasPhysicalMetricsV61({stock:68,capacity:100,fill:null,netFlow:1000,yearAgoFill:60,seasonalAvg5:70,seasonalPercentile:40,consumption:365,observationDate:"2026-09-13",consumptionReliable:true})',ctx);
ok(Math.abs(m.fillPct-68)<1e-9,'fill = stock/WGV when provider fill absent');
ok(Math.abs(m.vsFiveYearSeasonalAveragePP+2)<1e-9,'5Y seasonal deviation reproduced in percentage points');
ok(Math.abs(m.yoyFillPP-8)<1e-9,'YoY fill difference reproduced in percentage points');
ok(Math.abs(m.storageVelocityPctWgvPerDay-1)<1e-9,'storage velocity converts GWh/day over TWh WGV correctly');
ok(Math.abs(m.daysOfDemandCoverage-68)<1e-9,'days-of-demand = stock / annual demand * 365');
ok(m.boundedProgressFields.join(',')==='fillPct,seasonalPercentile','only fill and percentile declared bounded progress fields');
ok(m.nonProgressFields.includes('daysOfDemandCoverage')&&m.nonProgressFields.includes('storageVelocityPctWgvPerDay'),'days/velocity explicitly non-progress metrics');
let miss=vm.runInContext('gasPhysicalMetricsV61({stock:68,capacity:100,fill:68,consumption:null,consumptionReliable:false})',ctx);
ok(miss.daysOfDemandCoverage===null&&miss.annualDemandCoveragePct===null,'missing/unreliable demand denominator never becomes zero coverage');

// Official GIE homepage fixture observed 2026-09-13: preserve exact published fill semantics.
const gieFixture=[['EU',769.87,68.04],['DE',137.62,55.6],['IT',171.70,84.4],['FR',94.48,76.27],['NL',75.09,52.13]];
for(const [code,stock,fill] of gieFixture){let cap=stock/(fill/100),x=vm.runInContext(`gasPhysicalMetricsV61({stock:${stock},capacity:${cap},fill:${fill},consumptionReliable:false})`,ctx);ok(Math.abs(x.fillPct-fill)<1e-9,'official GIE fill preserved: '+code)}

// Country parser preserves official demand and flow fields.
const parseCtx={console,Math,Number,String,Object,Array,v37Num:x=>{let n=Number(x);return Number.isFinite(n)?n:null},v37CountryName:(x,c)=>c};vm.createContext(parseCtx);vm.runInContext(extractFunction(src,'parseAgsiCountryCurrentV40'),parseCtx);
let row=vm.runInContext(`parseAgsiCountryCurrentV40({data:[{gasDayStart:'2026-09-13',gasInStorage:'137.62',workingGasVolume:'247.5179856',full:'55.6',consumption:'850',consumptionFull:'16.1906',injection:'800',withdrawal:'280',status:'C'}]},'DE')`,parseCtx);
ok(row.code==='DE'&&row.stock===137.62&&row.fill===55.6,'country parser preserves official stock/fill');
ok(row.consumption===850&&row.consumptionFull===16.1906,'country parser preserves AGSI previous-year consumption fields');
ok(row.netFlow===520&&row.injection===800&&row.withdrawal===280,'country parser preserves and derives physical flow fields');

// Aggregation/UI/export contract.
let build=extractFunction(src,'buildEuGasCountriesV40');
ok(build.includes('consumptionReliable=stockItems.length>0&&consumptionPairs.length===stockItems.length'),'EU days coverage requires complete stock-country consumption denominator');
ok(build.includes('consumptionDays=consumption>0?365*storedWithConsumption/consumption:null'),'EU country aggregation uses explicit days-of-demand formula');
ok(build.includes('validFlow')&&build.includes('validConsumption'),'country aggregation exposes denominator/flow diagnostics');
let countryCard=extractFunction(src,'euGasCountryCardV40');
ok(countryCard.includes('days avg.')&&countryCard.includes('% WGV/d'),'country cards expose days coverage and storage velocity');
let euHtml=extractFunction(src,'euGasHtmlV33');
ok(euHtml.includes('Seasonal historical percentile')&&euHtml.includes('Versus 5-year seasonal average'),'EU Gas view exposes seasonal percentile and 5Y seasonal deviation');
ok(euHtml.includes('Days-of-demand coverage')&&euHtml.includes('% WGV/d'),'EU Gas view exposes days coverage and injection/withdrawal velocity');
ok(euHtml.includes("ss.percentile,'percentile'")&&!euHtml.includes("phys.daysOfDemandCoverage,'storage'"),'unbounded days/velocity are not rendered as fill progress bars');
ok(src.includes("PHYSICAL SUPPLY RISK")&&src.includes("PRICE / MARKET RISK"),'UI clearly separates physical supply from price/market risk');
ok(src.includes('physicalV61:commodityPhysicalSnapshotV61()'),'data snapshot exports Phase-11 physical metrics');
ok(src.includes('commodities.physicalV61 separates physical supply/storage metrics'),'data ZIP README documents physical/price separation');
ok(src.includes('EU aggregate days-of-demand is reported only when every loaded stock country has a valid AGSI consumption denominator'),'methodology documents conservative denominator rule');
ok(src.includes('Only fill % and seasonal percentile use 0–100 progress bars'),'methodology documents bounded-progress policy');

console.log(`RESULT - ${p}/${p+f} Phase 11 commodity physical checks PASS`);if(f)process.exit(1);
