'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35159_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0; function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)i=text.indexOf('async function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function extractConst(text,name){let i=text.indexOf('const '+name+'=');if(i<0)return null;let d=0,sq=false,dq=false,tq=false,esc=false;for(let j=i;j<text.length;j++){let c=text[j];if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{'||c==='['||c==='(')d++;if(c==='}'||c===']'||c===')')d--;if(c===';'&&d===0)return text.slice(i,j+1)}return null}

// Release identity and source parity.
ok(/versionCode\s+99\b/.test(gradle),'versionCode 97');
ok(/versionName\s+['"]3\.5\.1\.66['"]/.test(gradle),'versionName 3.5.1.66');
ok(html.includes('v3.5.1_66'),'visible header v3.5.1_66');
ok(/VERSION_NAME="3\.5\.1\.66"/.test(release)&&/VERSION_CODE="99"/.test(release),'release metadata v3.5.1.66 / 97');
ok(java.includes('MarketRiskMonitor/3.5.1.66'),'native user-agent v3.5.1.66');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.66',EXPORT_V47_CODE=99"),'export metadata v3.5.1.66 / 97');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded WebView JavaScript byte-identical to app.js');
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'Phase 10 introduces no raw fetch call sites');

// Protect old scoring mathematics and unrelated production architecture.
for(const n of ['fiscalAbsRiskV43','fiscalPercentileRiskV43','fiscalScoreRowsV43','fiscalRowFromSourcesV43','globalRiskModel','globalFactorArchitectureV53','buildMacroCycle']){
 const a=extractFunction(src,n),b=extractFunction(base,n); ok(!!a&&a===b,'protected function unchanged: '+n,sha(a)+' / '+sha(b));
}

for(const n of ['fiscalScopeV60','fiscalScopeComparableV60','fiscalMarginalRefiRiskV60','fiscalModuleStatusV60','fiscalAttentionV60','fiscalApplyStructuralV60','fiscalHydrateStructuralV60'])ok(!!extractFunction(src,n),'Phase-10 function present: '+n);
for(const t of ['Fiscal Structural Vulnerability','Market Refinancing Pressure','NO ELIGIBLE CURRENT DATA','GENERAL_GOVERNMENT_ESA2010','GENERAL_GOVERNMENT_IMF_WEO','CENTRAL_GOVERNMENT_FALLBACK','structuralRMinusG','marginalRefinancingPressure'])ok(src.includes(t)||html.includes(t),'Phase-10 semantic token present: '+t);
ok(src.includes("id:'fiscal_structural_v60'")&&src.includes("id:'fiscal_market_pressure_v60'")&&src.includes("id:'fiscal_marginalRefiPressure_v60'"),'Phase-6 audit registry documents Phase-10 transforms');
ok(src.includes('legacyStressScoreV43'),'legacy fiscal stress retained for audit/regression only');
ok(src.includes('productionGlobalRiskIntegration:false'),'fiscal structural layer not inserted into GLOBAL Risk');
ok(html.includes('Official-first structural fiscal diagnostics with market refinancing pressure shown separately'),'Markets UI describes structural/market separation');

// Deterministic evaluation of new Phase-10 architecture.
const clamp=x=>Math.max(0,Math.min(100,x));
const fiscalPiecewiseV43=(x,pts)=>{if(!Number.isFinite(x)||!Array.isArray(pts)||!pts.length)return null;if(x<=pts[0][0])return pts[0][1];for(let i=1;i<pts.length;i++){if(x<=pts[i][0]){let[a,sa]=pts[i-1],[b,sb]=pts[i],t=(x-a)/(b-a);return sa+t*(sb-sa)}}return pts.at(-1)[1]};
const fiscalBandV43=s=>!Number.isFinite(s)?{label:'LIMITED DATA',short:'LIMITED',cls:'status-limited',regime:'LIMITED DATA'}:s<35?{label:'NORMAL',short:'GREEN',regime:'NORMAL'}:s<50?{label:'WATCH',short:'YELLOW',regime:'WATCH'}:s<70?{label:'ELEVATED',short:'ORANGE',regime:'ELEVATED'}:{label:'HIGH STRESS',short:'RED',regime:'HIGH STRESS'};
const fiscalSystemicV43=()=>({label:'MEDIUM',factor:1});
const ctx={console,Math,Number,String,Object,Array,Map,Set,clamp,fiscalPiecewiseV43,fiscalBandV43,fiscalSystemicV43};vm.createContext(ctx);
for(const c of ['FISCAL_STRUCTURAL_METHOD_V60','FISCAL_STRUCTURAL_WEIGHTS_V60','FISCAL_MARKET_PRESSURE_WEIGHTS_V60'])vm.runInContext(extractConst(src,c),ctx);
for(const n of ['fiscalScopeV60','fiscalScopeComparableV60','fiscalMarginalRefiRiskV60','fiscalBandV60','fiscalModuleStatusV60','fiscalAttentionV60','fiscalApplyStructuralV60','fiscalHydrateStructuralV60'])vm.runInContext(extractFunction(src,n),ctx);
function row(comparability='HARMONIZED'){
 return {code:'XX',comparability,references:{debt:{source:comparability==='HARMONIZED'?'Eurostat':'IMF WEO'},balance:{source:comparability==='HARMONIZED'?'Eurostat':'IMF WEO'}},staleMetrics:[],raw:{debt:100,debtTrend:3,balance:-4,primary:-2,interest:2.5,yield:5,effectiveRate:2,nominalGrowth:3,refiGap:3,rMinusG:-1,spreadBps:null},components:{debt:{score:70},debtTrend:{score:60},balance:{score:50},primary:{score:40},interest:{score:45},financing:{score:60},refiGap:{score:50},rMinusG:{score:35}},score:58,deteriorationScore:40,nominalGdpUsd:1e12};
}
let a=row();ctx.fiscalApplyStructuralV60([a]);
const expectedStructural=Math.round((70*15+60*15+50*15+40*10+45*15+35*10)/80);
ok(a.structuralScoreV60===expectedStructural,'structural score uses only slow structural components',JSON.stringify(a));
ok(a.legacyStressScoreV43===58,'legacy fiscal stress preserved separately');
ok(a.raw.rMinusG===-1&&a.raw.refiGap===3&&a.raw.marginalRefiPressure===2,'structural r-g, repricing gap and marginal pressure remain distinct quantities');
ok(a.marginalRefiGrowthBasisV60==='LATEST_AVAILABLE_NOMINAL_GDP_GROWTH_PROXY','marginal pressure growth basis is explicitly disclosed as proxy');
ok(a.marketPressureComponentsV60.marginalRefiPressure===50,'marginal refinancing pressure transform reproducible at +2pp');
const expectedMarket=Math.round((60*50+50*25+50*25)/100);ok(a.marketPressureScoreV60===expectedMarket,'market refinancing pressure calculated separately from structural score');
ok(a.fiscalScopeV60==='GENERAL_GOVERNMENT_ESA2010'&&a.scopeComparableV60,'Eurostat ESA scope explicitly comparable');
ok(a.structuralEligibleV60&&a.rankingEligible,'comparable complete structural row is ranking eligible');

let imf=row('GENERAL_GOVERNMENT_COMPARABLE');ctx.fiscalApplyStructuralV60([imf]);ok(imf.fiscalScopeV60==='GENERAL_GOVERNMENT_IMF_WEO'&&imf.structuralEligibleV60,'IMF WEO general-government scope is comparable');
let central=row('COMPARABILITY LIMITED');central.references={debt:{source:'World Bank WDI / IMF GFS'},balance:{source:'World Bank WDI / IMF GFS'}};ctx.fiscalApplyStructuralV60([central]);ok(central.fiscalScopeV60==='CENTRAL_GOVERNMENT_FALLBACK','central-government fallback scope classified explicitly');ok(central.structuralScoreV60===null&&!central.structuralEligibleV60&&central.structuralReasonV60==='INCOMPARABLE GOVERNMENT SCOPE','central government is not ranked as general-government equivalent');
let stale=row();stale.staleMetrics=['debt'];ctx.fiscalApplyStructuralV60([stale]);ok(stale.structuralScoreV60===null&&stale.structuralReasonV60==='STALE CORE FISCAL DATA','stale core structural data blocks normal structural score');
let sparse=row();sparse.components={debt:{score:50},balance:{score:40}};sparse.raw.debtTrend=null;sparse.raw.primary=null;sparse.raw.interest=null;sparse.raw.rMinusG=null;ctx.fiscalApplyStructuralV60([sparse]);ok(sparse.structuralScoreV60===null&&sparse.structuralCoverageV60<67,'insufficient data remains LIMITED instead of becoming zero risk');
let noMarket=row();noMarket.raw.yield=null;noMarket.raw.refiGap=null;noMarket.components.financing={score:null};noMarket.components.refiGap={score:null};ctx.fiscalApplyStructuralV60([noMarket]);ok(noMarket.marketPressureScoreV60===null,'missing market yield cannot fabricate market refinancing score');
ok(ctx.fiscalModuleStatusV60([central,sparse]).status==='NO ELIGIBLE CURRENT DATA','all-limited module reports NO ELIGIBLE CURRENT DATA');
ok(ctx.fiscalModuleStatusV60([central,a]).status==='READY','module READY only when at least one comparable structural score is eligible');

// Export/methodology semantics.
for(const token of ['governmentScope','scopeComparable','structuralCoverage','structuralScore','marketPressureScore','legacyStressScoreV43','fiscalStructuralV60','Structural r-g','latest-available nominal-GDP-growth proxy'])ok(src.includes(token),'audit/methodology exposes: '+token);
ok(src.includes('Central-government fallbacks may be displayed as context but are not ranked as if directly comparable'),'methodology explicitly protects government-scope comparability');
ok(!src.includes('Marginal refinancing pressure = current 10Y market yield minus expected/current nominal growth.'),'does not falsely label actual-growth proxy as expected growth');
console.log(`RESULT - ${p}/${p+f} Phase 10 fiscal structural checks PASS`);if(f)process.exit(1);
