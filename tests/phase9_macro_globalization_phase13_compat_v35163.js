'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35158_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)i=text.indexOf('async function '+name+'(');if(i<0)return null;let bp=text.indexOf('){',i),b=bp>=0?bp+1:text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function extractConstStatement(text,name){let i=text.indexOf('const '+name+'=');if(i<0)return null;let d1=0,d2=0,d3=0,sq=false,dq=false,tq=false,esc=false;for(let j=i;j<text.length;j++){let c=text[j];if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='[')d1++;if(c===']')d1--;if(c==='{')d2++;if(c==='}')d2--;if(c==='(')d3++;if(c===')')d3--;if(c===';'&&d1===0&&d2===0&&d3===0)return text.slice(i,j+1)}return null}

// Release identity and asset parity.
ok(/versionCode\s+96\b/.test(gradle),'versionCode 96');
ok(/versionName\s+['"]3\.5\.1\.63['"]/.test(gradle),'versionName 3.5.1.63');
ok(html.includes('v3.5.1_63'),'visible header v3.5.1_63');
ok(/VERSION_NAME="3\.5\.1\.63"/.test(release)&&/VERSION_CODE="96"/.test(release),'release metadata v3.5.1.63 / 96');
ok(java.includes('MarketRiskMonitor/3.5.1.63'),'native user-agent version 3.5.1.63');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.63',EXPORT_V47_CODE=96"),'export metadata v3.5.1.63 / 96');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded WebView JavaScript byte-identical to canonical app.js');
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'no new raw fetch call sites');

// Non-negotiable US / GLOBAL production compatibility.
for(const n of ['buildMacroCycle','inflationDetector','recessionLeadingAndComposite','globalFactorArchitectureV53','globalRiskModel']){
  const a=extractFunction(src,n),b=extractFunction(base,n);ok(!!a&&a===b,'protected production function unchanged: '+n,sha(a)+' / '+sha(b));
}

// Phase-9 contract and sources.
for(const n of ['macroGrowthRiskV59','macroUnemploymentRiskV59','macroCliRiskV59','macroIndustrialRiskV59','macroRegionRecordV59','buildUsMacroCycleV59','buildEuroMacroCycleV59','buildChinaMacroCycleV59','buildJapanMacroCycleV59','aggregateGlobalMacroV59','buildGlobalMacroCycleV59','macroGlobalAuditRowsV59','macroGlobalScoreTracesV59'])ok(!!extractFunction(src,n),'Phase-9 function present: '+n);
for(const id of ['CHNLOLITOAASTSAM','JPNLOLITOAASTSAM','CP0000EZCCM086NEST','JPNPRINTO01GYSAM'])ok(src.includes("'"+id+"'"),'required Phase-9 FRED series configured: '+id);
ok(src.includes("worldBankMacroBundleV59('EMU')"),'Euro Area uses World Bank EMU aggregate rather than Germany as sole proxy');
ok(src.includes("productionGlobalRiskIntegration:false"),'Global Macro explicitly not silently inserted into production GLOBAL Risk');
ok(html.includes('id="globalMacroHeroV59"')&&html.includes('id="macroRegionalGridV59"'),'Macro UI exposes Global Macro and regional cycle containers');
ok(src.includes('globalMacroCycleV59:s.globalMacroCycleV59||null'),'Global Macro persists in snapshot state');
ok(src.includes('macroGlobalV59:appState.globalMacroCycleV59'),'audit snapshot exports Global Macro state');
ok(src.includes("id:'macro_global_cycle'")&&src.includes("id:'macro_regional_cycle'"),'Phase-6 registry documents Phase-9 transforms');

// Evaluate new architecture deterministically.
const clamp=x=>Math.max(0,Math.min(100,x));
const avg=a=>{let x=(a||[]).filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null};
const weightedAvailable=(items,weights)=>{let num=0,den=0,total=Object.values(weights).reduce((a,b)=>a+b,0);for(const [k,w] of Object.entries(weights)){let v=items[k];if(Number.isFinite(v)){num+=v*w;den+=w}}return{score:den?Math.round(num/den):null,coverage:total?Math.round(100*den/total):0,availableWeight:den,totalWeight:total}};
const pct=(a,b)=>(a&&b)?(a/b-1)*100:null;
const inflationRateRisk=(v,low=2.2,mid=3,high=4)=>!Number.isFinite(v)?null:v<=low?20:v<=mid?42:v<=high?68:88;
const freshnessWorstV50=a=>a&&a.length?(a.includes('STALE')?'STALE':a.includes('UNKNOWN')?'UNKNOWN':'CURRENT'):'UNKNOWN';
const wbFreshnessV50=()=> 'OLD_BUT_CURRENT_RELEASE';
const freshnessModelV49=()=>({freshnessStatus:'CURRENT'});
const sourceMeta=s=>s&&s.meta||{};
const ctx={console,Math,Number,String,Object,Array,Map,Set,clamp,avg,weightedAvailable,pct,inflationRateRisk,freshnessWorstV50,wbFreshnessV50,freshnessModelV49,sourceMeta};vm.createContext(ctx);
for(const c of ['MACRO_GLOBAL_METHOD_V59','MACRO_REGION_WEIGHTS_V59','MACRO_REGION_LABELS_V59','MACRO_GLOBAL_MIN_REGIONS_V59','MACRO_REGION_COMPONENT_WEIGHTS_V59']){let x=extractConstStatement(src,c);if(!x)throw new Error('missing const '+c);vm.runInContext(x,ctx)}
// the minimum-regions statement also declares coverage threshold in same statement
if(typeof ctx.MACRO_GLOBAL_MIN_WEIGHTED_COVERAGE_V59==='undefined')vm.runInContext("globalThis.MACRO_GLOBAL_MIN_WEIGHTED_COVERAGE_V59=65",ctx);
for(const n of ['macroGrowthRiskV59','macroUnemploymentRiskV59','macroCliRiskV59','macroIndustrialRiskV59','macroRegionRegimeV59','macroRegionConfidenceV59','macroWbRowV59','macroFredRowV59','macroRegionRecordV59','macroCountryBundleV59','buildUsMacroCycleV59','buildEuroMacroCycleV59','buildChinaMacroCycleV59','buildJapanMacroCycleV59','aggregateGlobalMacroV59'])vm.runInContext(extractFunction(src,n),ctx);
const rw=vm.runInContext('MACRO_REGION_WEIGHTS_V59',ctx);ok(Object.values(rw).reduce((a,b)=>a+b,0)===100,'regional macro weights sum to 100');ok(rw.US===40&&rw.EA===25&&rw.CN===25&&rw.JP===10,'transparent structural regional weights are stable');
ok(ctx.macroGrowthRiskV59(5,5)===20&&ctx.macroGrowthRiskV59(1,5)===75,'growth stress is region-neutral-rate aware');
ok(ctx.macroUnemploymentRiskV59(7,6,8)===50,'unemployment threshold transform reproducible');
ok(ctx.macroIndustrialRiskV59(-3)===80,'Japan industrial-production transform reproducible');
const cliSeries=[{d:'2026-03-01',v:99.1},{d:'2026-04-01',v:99.0},{d:'2026-05-01',v:98.9},{d:'2026-06-01',v:98.7}];
const cli=ctx.macroCliRiskV59(cliSeries);ok(cli.score===93&&Math.abs(cli.delta3m+0.4)<1e-9,'CLI level + 3M momentum transform reproducible',JSON.stringify(cli));

const legacy={score:37,regime:'SOFT-LANDING / NORMAL',inflation:{score:32,coverage:90,confidence:'HIGH',rows:[{score:30,freshness:'CURRENT'}]},recession:{score:42,coverage:80,confidence:'HIGH',rows:[{score:40,freshness:'CURRENT'}]}};
const us=ctx.buildUsMacroCycleV59(legacy);ok(us.score===legacy.score&&us.regime===legacy.regime&&us.legacyCompatible===true,'US regional wrapper reproduces legacy score/regime exactly');

// Euro remains computable without Germany CLI: EMU aggregate + HICP are sufficient.
function metaSeries(vals,id){let a=vals.map((v,i)=>({d:`${2025+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}-01`,v}));a.meta={seriesId:id,sourceDetail:'FRED '+id};return a}
const hicp=metaSeries([100,100.1,100.2,100.3,100.4,100.5,100.6,100.7,100.8,100.9,101,101.1,102.2],'CP0000EZCCM086NEST');
const emu={gdp:{value:1.4,year:2025,observation:'2025'},inf:{value:2.3,year:2025,observation:'2025'},un:{value:6.4,year:2025,observation:'2025'}};
const euro=ctx.buildEuroMacroCycleV59({CP0000EZCCM086NEST:hicp,DEULOLITOAASTSAM:[]},[],emu);
ok(euro.eligible&&euro.coverage===80,'Euro Area remains eligible without Germany CLI when aggregate Euro data are available',JSON.stringify(euro));
ok(euro.germanyProxyOnly===false&&euro.rows.filter(x=>Number.isFinite(x.score)).length===3,'Germany is context, not sole Euro proxy');
ok(euro.rows.find(x=>x.key==='inflation').provider==='FRED','current Euro HICP preserves FRED/Eurostat provenance');
const euroFallback=ctx.buildEuroMacroCycleV59({CP0000EZCCM086NEST:[],DEULOLITOAASTSAM:[]},[],emu);ok(euroFallback.rows.find(x=>x.key==='inflation').provider==='World Bank','Euro inflation fallback preserves World Bank provenance');

// China/Japan confidence is not presented as high-frequency US parity.
const cnCountry={code:'CN',macroData:{gdp:{value:4.7,year:2025,observation:'2025'},inf:{value:1.2,year:2025,observation:'2025'},un:{value:5.2,year:2025,observation:'2025'}}};
const jpCountry={code:'JP',macroData:{gdp:{value:0.8,year:2025,observation:'2025'},inf:{value:2.8,year:2025,observation:'2025'},un:{value:2.7,year:2025,observation:'2025'}}};
const cnCli=metaSeries([99.2,99.1,99.0,98.9],'CHNLOLITOAASTSAM'),jpCli=metaSeries([100.0,100.1,100.2,100.3],'JPNLOLITOAASTSAM'),jpIp=metaSeries([1.0,1.2,0.8,0.7],'JPNPRINTO01GYSAM');
const cn=ctx.buildChinaMacroCycleV59({CHNLOLITOAASTSAM:cnCli},[cnCountry]),jp=ctx.buildJapanMacroCycleV59({JPNLOLITOAASTSAM:jpCli,JPNPRINTO01GYSAM:jpIp},[jpCountry]);
ok(cn.confidence==='MEDIUM'&&cn.sourceFrequency==='ANNUAL-DOMINANT','China annual-dominant source mix lowers confidence parity');
ok(jp.confidence==='MEDIUM'&&jp.sourceFrequency==='MIXED MONTHLY/ANNUAL','Japan mixed-frequency source mix is disclosed');

// Global aggregation: missing regions are not zero and eligibility is explicit.
const mk=(code,score,coverage=100,confidence='MEDIUM')=>({code,score,coverage,confidence,eligible:Number.isFinite(score)});
let g=ctx.aggregateGlobalMacroV59([mk('US',30,100,'HIGH'),mk('EA',40),mk('CN',50),mk('JP',60)]);
ok(g.score===41&&g.availableWeight===100&&g.missingRegionWeightPct===0,'full four-region Global Macro weighted score reproducible',JSON.stringify(g));
let g3=ctx.aggregateGlobalMacroV59([mk('US',30,100,'HIGH'),mk('EA',40),mk('CN',50),mk('JP',null,0,'LIMITED')]);
const expected3=Math.round((30*40+40*25+50*25)/90);ok(g3.score===expected3&&g3.availableWeight===90&&g3.missingRegionWeightPct===10&&g3.renormalized,'three-region score renormalizes only with missing weight disclosed',JSON.stringify(g3));
let g2=ctx.aggregateGlobalMacroV59([mk('US',30),mk('EA',40),mk('CN',null,0,'LIMITED'),mk('JP',null,0,'LIMITED')]);ok(g2.score===null&&g2.diagnosticScore!==null&&g2.eligible===false,'two-region coverage cannot produce normal Global Macro score');
let lowcov=ctx.aggregateGlobalMacroV59([mk('US',30,45,'LIMITED'),mk('EA',40,45,'LIMITED'),mk('CN',50,45,'LIMITED'),mk('JP',60,45,'LIMITED')]);ok(lowcov.score===null&&lowcov.weightedCoveragePct===45,'low weighted data coverage blocks normal Global Macro status');

// Exports/methodology expose semantics and do not imply Phase-9 production integration.
for(const token of ['macroGlobalizationV59','macroGlobalV59','Global Macro Cycle','missingRegionWeightPct','productionGlobalRiskIntegration:false','World Bank EMU','Germany is not the non-U.S. proxy'])ok(src.includes(token),'Phase-9 audit/methodology token present: '+token);
console.log(`RESULT - ${p}/${p+f} Phase 9 macro globalization checks PASS`);if(f)process.exit(1);
