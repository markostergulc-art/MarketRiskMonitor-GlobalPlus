'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35157_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0; function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)i=text.indexOf('async function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function extractConstStatement(text,name){let i=text.indexOf('const '+name+'=');if(i<0)return null;let d1=0,d2=0,d3=0,sq=false,dq=false,tq=false,esc=false;for(let j=i;j<text.length;j++){let c=text[j];if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='[')d1++;if(c===']')d1--;if(c==='{')d2++;if(c==='}')d2--;if(c==='(')d3++;if(c===')')d3--;if(c===';'&&d1===0&&d2===0&&d3===0)return text.slice(i,j+1)}return null}
function extractMarketConfig(text){let i=text.indexOf('const MARKET_CONFIG=[');if(i<0)return null;let j=text.indexOf('\n\n];',i);if(j<0)j=text.indexOf('\n];',i);if(j<0)return null;return text.slice(i,j+(text.startsWith('\n\n];',j)?4:3)).replace(/\n\n];$/,'\n];')}

// Release identity + canonical asset parity.
ok(/versionCode\s+97\b/.test(gradle),'versionCode 97');
ok(/versionName\s+['"]3\.5\.1\.64['"]/.test(gradle),'versionName 3.5.1.64');
ok(html.includes('v3.5.1_64'),'visible header v3.5.1_64');
ok(/VERSION_NAME="3\.5\.1\.64"/.test(release)&&/VERSION_CODE="97"/.test(release),'release metadata v3.5.1.64 / 97');
ok(java.includes('MarketRiskMonitor/3.5.1.64'),'native user-agent version 3.5.1.64');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.64',EXPORT_V47_CODE=97"),'export metadata v3.5.1.64 / 97');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded WebView JavaScript byte-identical to canonical app.js');
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'no new raw fetch call sites');

// Preserve descriptive correlation implementation byte-for-byte.
for(const n of ['returns','pearson','alignedCorr','corrMatrix','correlationPairStats','correlationRegimeFromStats','correlationRegimeDiagnostic']){
  const a=extractFunction(src,n),b=extractFunction(base,n);ok(!!a&&a===b,'descriptive correlation function unchanged: '+n,sha(a)+' / '+sha(b));
}

// Phase-8 functions and semantics are present.
for(const n of ['correlationSessionV58','correlationAlignmentRuleV58','lagAwarePairsV58','lagAwareCorrV58','lagAwareCorrMatrixV58','lagAwareCorrelationRegimeDiagnosticV58'])ok(!!extractFunction(src,n),'Phase-8 function present: '+n);
ok(src.includes("CORRELATION_SYSTEMIC_WINDOW_V58=60"),'GLOBAL systemic correlation window fixed at 60D');
ok(src.includes("CORRELATION_ALIGNMENT_METHOD_V58='LAG-AWARE-REGIONAL-V1'"),'methodology version is explicit');
ok(src.includes('noLookahead:true'),'no-lookahead property explicitly exported');

// Evaluate the correlation engine in isolation.
const avg=a=>{let x=(a||[]).filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null};
const ctx={console,Math,Number,String,Object,Array,Map,Set,avg}; vm.createContext(ctx);
vm.runInContext(extractMarketConfig(src),ctx);
vm.runInContext(extractFunction(src,'activeMarketConfig'),ctx);
for(const n of ['returns','pearson','alignedCorr','correlationPairStats','correlationRegimeFromStats','corrMatrix','correlationRegimeDiagnostic'])vm.runInContext(extractFunction(src,n),ctx);
// The first const statement defines both window and method; second is session map.
vm.runInContext(extractConstStatement(src,'CORRELATION_SYSTEMIC_WINDOW_V58'),ctx);
vm.runInContext(extractConstStatement(src,'CORRELATION_SESSION_V58'),ctx);
for(const n of ['correlationSessionV58','correlationAlignmentRuleV58','lagAwarePairsV58','lagAwareCorrV58','lagAwareCorrMatrixV58','lagAwareCorrelationRegimeDiagnosticV58'])vm.runInContext(extractFunction(src,n),ctx);
const marketCodes=vm.runInContext('MARKET_CONFIG.map(x=>x.code)',ctx), sessionMap=vm.runInContext('CORRELATION_SESSION_V58',ctx);
ok(marketCodes.every(c=>sessionMap[c]),'every active core market has explicit trading-session mapping',marketCodes.filter(c=>!sessionMap[c]).join(','));
ok(new Set(Object.values(sessionMap)).size===3,'three session groups are defined');
const rule=(a,b)=>ctx.correlationAlignmentRuleV58(a,b);
ok(rule('US','JP').mode==='PREVIOUS_AMERICAS_CLOSE','US↔Japan uses previous Americas close');
ok(rule('JP','US').mode==='PREVIOUS_AMERICAS_CLOSE','Japan↔US rule is symmetric by asset order');
ok(rule('DE','JP').mode==='SAME_DATE','Europe↔Asia uses fixed same-date later-session transmission rule');
ok(rule('US','DE').mode==='SAME_DATE','US↔Europe uses same-date overlap rule');
ok(rule('US','CA').mode==='SAME_DATE','same-session Americas pair remains same-date');
ok(new Set([rule('US','JP').mode,rule('DE','JP').mode,rule('US','DE').mode]).size>1,'no universal lag is applied to all region pairs');
ok(rule('US','JP').noLookahead&&rule('DE','JP').noLookahead&&rule('US','DE').noLookahead,'every alignment rule is marked no-lookahead');

function dates(n){let out=[],t=Date.UTC(2026,0,1);for(let i=0;i<n;i++){out.push(new Date(t+i*86400000).toISOString().slice(0,10))}return out}
function prices(returnDates,rs){let p=100,out=[{d:new Date(Date.parse(returnDates[0]+'T00:00:00Z')-86400000).toISOString().slice(0,10),v:p}];for(let i=0;i<rs.length;i++){p*=Math.exp(rs[i]);out.push({d:returnDates[i],v:p})}return out}
const ds=dates(100);
const usR=ds.map((_,i)=>0.009*Math.sin(i*1.731)+0.006*Math.cos(i*.773)+0.002*Math.sin(i*.213));
const jpR=ds.map((_,i)=>i?usR[i-1]:0.011);
const deR=jpR.map((v,i)=>v*.95+0.0003*Math.sin(i));
const us=prices(ds,usR),jp=prices(ds,jpR),de=prices(ds,deR);
const naiveUJ=ctx.alignedCorr(us,jp,60), lagUJ=ctx.lagAwareCorrV58(us,jp,'US','JP',60);
ok(Number.isFinite(naiveUJ)&&Math.abs(naiveUJ)<0.45,'synthetic US↔Japan same-date correlation is intentionally weak',String(naiveUJ));
ok(Number.isFinite(lagUJ.correlation)&&lagUJ.correlation>0.995,'lag-aware US↔Japan recovers previous-close relationship',String(lagUJ.correlation));
ok(lagUJ.pairsUsed>=55,'lag-aware US↔Japan retains sufficient observations',String(lagUJ.pairsUsed));
const pairsUJ=ctx.lagAwarePairsV58(us,jp,'US','JP',60);
ok(pairsUJ.pairs.every(x=>x.aDate<x.bDate),'US observation is strictly earlier than paired Japan observation');
ok(new Set(pairsUJ.pairs.map(x=>x.aDate)).size===pairsUJ.pairs.length,'previous Americas close is not reused across multiple Asian dates');
const pairsJU=ctx.lagAwarePairsV58(jp,us,'JP','US',60);
ok(pairsJU.pairs.every(x=>x.bDate<x.aDate),'reverse-order Japan↔US pairing still uses earlier US date');
// Europe↔Asia and US↔Europe have declared fixed rules; systemic equals descriptive when SAME_DATE.
const nDJ=ctx.alignedCorr(de,jp,60),sDJ=ctx.lagAwareCorrV58(de,jp,'DE','JP',60).correlation;
ok(Math.abs(nDJ-sDJ)<1e-12,'Europe↔Asia systemic result follows declared same-date rule');
const nUD=ctx.alignedCorr(us,de,60),sUD=ctx.lagAwareCorrV58(us,de,'US','DE',60).correlation;
ok(Math.abs(nUD-sUD)<1e-12,'US↔Europe systemic result follows declared same-date overlap rule');

// Matrix and diagnostic behavior.
const series={US:us,JP:jp,DE:de};
const sys=ctx.lagAwareCorrMatrixV58(series,60);
ok(sys.lagAdjusted===true&&sys.descriptive===false,'systemic matrix metadata identifies lag-aware/non-descriptive methodology');
ok(sys.window===60&&sys.methodologyVersion==='LAG-AWARE-REGIONAL-V1','systemic matrix exposes fixed window and methodology version');
let iUS=sys.labels.indexOf('US'),iJP=sys.labels.indexOf('JP'),iDE=sys.labels.indexOf('DE');
ok(Math.abs(sys.mat[iUS][iJP]-sys.mat[iJP][iUS])<1e-12,'systemic matrix remains symmetric');
ok(sys.ruleCounts.PREVIOUS_AMERICAS_CLOSE>0&&sys.ruleCounts.SAME_DATE>0,'matrix reports both lag and same-date rule counts');
ok(sys.totalPairs>sys.validPairs&&sys.validPairs>=3,'missing market series reduce systemic pair coverage rather than becoming zero correlations');
ok(sys.pairCoveragePct>0&&sys.pairCoveragePct<100,'partial fixture produces explicit partial systemic coverage');
const diag=ctx.lagAwareCorrelationRegimeDiagnosticV58(series);
ok(diag.systemic===true&&diag.lagAdjusted===true&&diag.noLookahead===true,'systemic diagnostic flags lag-aware and no-lookahead semantics');
ok(Array.isArray(diag.representativeComparisons)&&diag.representativeComparisons.length===3,'required US↔Asia / Europe↔Asia / US↔Europe comparisons exported');
const dUSJP=diag.representativeComparisons.find(x=>x.a==='US'&&x.b==='JP');
ok(dUSJP&&dUSJP.lagAdjusted>dUSJP.naiveSameDate,'US↔Asia diagnostic exposes naive vs lag-adjusted difference');
const dDEJP=diag.representativeComparisons.find(x=>x.a==='DE'&&x.b==='JP');
ok(dDEJP&&Math.abs(dDEJP.lagAdjusted-dDEJP.naiveSameDate)<1e-12,'Europe↔Asia comparison transparently shows unchanged fixed same-date rule');
const dUSDE=diag.representativeComparisons.find(x=>x.a==='US'&&x.b==='DE');
ok(dUSDE&&Math.abs(dUSDE.lagAdjusted-dUSDE.naiveSameDate)<1e-12,'US↔Europe comparison transparently shows same-date overlap rule');

// Production wiring: descriptive UI remains separate; systemic layer drives GLOBAL contagion paths.
ok(src.includes('corr=corrMatrix(corrSeries,corrWindow)')&&src.includes('corrDiagnostic=correlationRegimeDiagnostic(corrSeries)'),'refresh still builds descriptive same-date correlation');
ok(src.includes('corrSystemic=lagAwareCorrMatrixV58(corrSeries,CORRELATION_SYSTEMIC_WINDOW_V58)')&&src.includes('corrSystemicDiagnostic=lagAwareCorrelationRegimeDiagnosticV58(corrSeries)'),'refresh builds separate systemic lag-aware correlation');
ok(src.includes('finalizeCountries(countries,corr)'),'country-systemic legacy path remains on descriptive matrix');
ok(src.includes('finalizeCrossAsset(crossAsset,countries,corrSystemic)'),'cross-asset systemic layer receives lag-aware matrix');
ok(src.includes('globalContagion(corrSystemic,countries)'),'GLOBAL contagion receives lag-aware matrix');
ok(src.includes('safeGlobalRiskModelV54(countries,combinedEarly,crossAsset,corrSystemic)'),'GLOBAL risk correlation factor receives lag-aware matrix');
ok(src.includes('hiddenRiskAnomaly(countries,combinedEarly,crossAsset,corrSystemic)'),'hidden-risk systemic diagnostic receives lag-aware matrix');
ok(src.includes('corrSystemic,corrSystemicDiagnostic'),'systemic matrix and diagnostic retained in app state');
// UI correlation-window changes must remain exploratory only.
const windowHandler=src.match(/document\.querySelectorAll\('\[data-cw\]'\)[\s\S]{0,1600}/)?.[0]||'';
ok(!windowHandler.includes('globalContagion(')&&!windowHandler.includes('corrSystemic='),'descriptive window selector cannot silently mutate GLOBAL systemic correlation');

// UI and exports make the distinction explicit.
for(const token of ['SYSTEMIC CORRELATION','DESCRIPTIVE CORRELATION','Lag-adjusted correlation regime','Descriptive same-date matrix','GLOBAL systemic calculation uses the separate 60D lag-aware matrix'])ok(src.includes(token),'UI distinction present: '+token);
ok(src.includes("Descriptive Correlation History")&&src.includes('Same-date 20D / 60D / 120D'),'history explicitly labeled descriptive same-date');
ok(src.includes('systemicLagAdjusted')&&src.includes('descriptiveSameDate')&&src.includes('alignmentMode'),'correlation export contains descriptive/systemic values plus alignment metadata');
ok(src.includes('correlationSystemicV58')&&src.includes('sessionMap:CORRELATION_SESSION_V58'),'audit metadata exports systemic session mapping');
ok(src.includes('SYSTEMIC correlation uses ${CORRELATION_ALIGNMENT_METHOD_V58}')&&src.includes('Pairing never uses a future observation'),'methodology export documents timezone alignment and no-lookahead rule');
ok(src.includes('The descriptive same-date matrix is not used as the realized-correlation input to GLOBAL contagion.'),'methodology states GLOBAL contagion input separation');

console.log(`RESULT - ${p}/${p+f} Phase 8 correlation/timezone checks ${f?'FAIL':'PASS'}`);if(f)process.exit(1);
