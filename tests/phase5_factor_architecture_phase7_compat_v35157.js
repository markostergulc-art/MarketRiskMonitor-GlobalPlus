'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
const fnames=['factorRowsV53','factorRowsMatchV53','factorSubRowsV53','factorSubValueV53','factorRecordV53','factorContributionV53','legacyGlobalRiskV52','globalFactorArchitectureV53','globalRiskModel'];
for(const n of fnames)ok(!!extractFunction(src,n),'function present: '+n);
const legacy={creditFunding:25,volatility:15,equity:10,macro:15,liquidity:10,rates:8,fx:7,commodities:5,correlation:5};
const weights={credit:15,fundingLiquidity:20,volatility:15,equityInternals:10,rates:8,macroGrowth:10,inflation:5,fx:7,commodities:5,correlationContagion:5};
const labels={credit:'Credit',fundingLiquidity:'Funding & Liquidity',volatility:'Volatility',equityInternals:'Equity Internals',rates:'Rates',macroGrowth:'Macro Growth',inflation:'Inflation',fx:'FX',commodities:'Commodities',correlationContagion:'Correlation / Contagion'};
const avg=a=>{let x=(a||[]).filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null},clamp=x=>Math.max(0,Math.min(100,x));
const ctx={console,Math,Number,String,Object,Array,RegExp,Set,GLOBAL_LEGACY_WEIGHTS_V52:legacy,GLOBAL_FACTOR_WEIGHTS_V53:weights,GLOBAL_FACTOR_LABELS_V53:labels,GLOBAL_FACTOR_ARCHITECTURE_V53:'FA1',GLOBAL_MIN_EFFECTIVE_COVERAGE_V50:50,GLOBAL_MIN_FACTOR_GROUPS_V50:5,providerHealth:{FRED:{success:1},Yahoo:{success:1},ECB:{success:1}},avg,clamp,freshnessUsableV50:x=>x==='CURRENT'||x==='OLD_BUT_CURRENT_RELEASE',earlyFreshRatioV50:r=>{let x=(r||[]).filter(z=>Number.isFinite(z.score));return x.length?x.filter(z=>['CURRENT','OLD_BUT_CURRENT_RELEASE'].includes(z.freshnessStatus||z.freshness)).length/x.length:null},countryFreshRatioV50:(cs,k)=>{let x=(cs||[]).filter(c=>Number.isFinite(c.subscores&&c.subscores[k]));return x.length?x.filter(c=>['CURRENT','OLD_BUT_CURRENT_RELEASE'].includes(c.factorFreshnessV50&&c.factorFreshnessV50[k])).length/x.length:null},globalConfidenceV51:(components,coverage)=>({label:coverage.eligible?'HIGH':'LIMITED',score:coverage.eligible?90:30,components:{},sourceQuality:{grade:'A'}}),aggregateEquityInternalsV57:(countries,byCode)=>({score:avg((countries||[]).map(c=>c&&c.equityInternals&&c.equityInternals.score)),weightedCoveragePct:100,methodologyVersion:'RW1',representedRegions:7,totalRegions:7,missingRegionWeightPct:0,legacyEqualMarketScore:avg((countries||[]).map(c=>c&&c.equityInternals&&c.equityInternals.score)),differenceFromEqualMarket:0,regions:[]})};
vm.createContext(ctx);for(const n of fnames)vm.runInContext(extractFunction(src,n),ctx);
ok(Object.values(weights).reduce((a,b)=>a+b,0)===100,'new factor weights sum to 100');
ok(weights.credit+weights.fundingLiquidity===legacy.creditFunding+legacy.liquidity,'credit/funding/liquidity broad weight budget preserved');
ok(weights.macroGrowth+weights.inflation===legacy.macro,'macro broad weight budget preserved');
ok(weights.volatility===legacy.volatility&&weights.equityInternals===legacy.equity&&weights.rates===legacy.rates&&weights.fx===legacy.fx&&weights.commodities===legacy.commodities&&weights.correlationContagion===legacy.correlation,'other broad weight budgets preserved');
const C='CURRENT';
const early=[
 ['US HY OAS','Credit',45],['US IG OAS','Credit',35],['HYG realized volatility','Credit volatility',40],['LQD realized volatility','Credit volatility',30],['Bank Credit Stress Composite','Bank credit',50],['Property & CRE Stress Composite','Credit',55],['NBFI & Leveraged-Finance Stress Composite','Credit',45],
 ['SOFR − IORB funding spread','USD funding',35],['OBFR − IORB funding spread','USD funding',32],['Commercial paper − T-bill','Funding',38],['USD Liquidity Plumbing Composite','Liquidity',30],['Global USD Funding Proxy Composite','USD funding',42],['NFCI','Financial conditions',28],['STLFSI4','Financial stress',25],['OFR Financial Stress Index','Financial stress',30],
 ['VIX','Volatility',40],['VIX cross-asset','Volatility',40],['VIX / VIX3M term structure','Volatility',35],['VIX9D / VIX event-risk ratio','Volatility',45],['VVIX · volatility of volatility','Volatility',50],['SKEW · tail-hedging demand','Volatility',30],['MOVE','Rates volatility',55],['MOVE cross-asset','Rates volatility',55],['Cross-Asset Volatility Breadth','Systemic breadth',45],
 ['Equity Breadth & Concentration Composite','Equity concentration',48],['Core Sovereign Bond Stress Composite','Rates',44],['Treasury Auction Demand Composite','Rates',46],['Euro Sovereign Fragmentation Composite','Rates',40],['US 10Y–2Y','Yield curve',35],
 ['Recession Detector Composite','Recession / macro',42],['Global Trade & Shipping Stress Composite','Trade / shipping',38],['Inflation Detector Composite','Macro / inflation',50],['Diversification & Carry Stress Composite','Cross-asset transmission',40],
 ['OVX · Oil volatility','Commodity',50],['VXUNG · Natural gas volatility','Commodity',48],['US crude inventories','Commodity',42],['GVZ · Gold volatility','Commodity',40],['VXSLV · Silver volatility','Commodity',43],['Gold / Silver ratio','Commodity',38],['Copper / Gold ratio','Commodity',45],['COR1M · Implied equity correlation','Correlation',47],['Structural Financial Vulnerability Composite','Structural vulnerability',52]
].map(([name,trend,score])=>({name,trend,score,freshness:C}));
const countries=[{subscores:{market:35,macro:40,liquidity:30,systemic:32},factorFreshnessV50:{market:C,macro:C,liquidity:C,systemic:C},equityInternals:{score:42},metrics:{draw52:-4}},{subscores:{market:40,macro:45,liquidity:35,systemic:38},factorFreshnessV50:{market:C,macro:C,liquidity:C,systemic:C},equityInternals:{score:46},metrics:{draw52:-9}}];
const cross={components:{creditFunding:42,breadth:45,optionsStress:40,breadthStress:48,rates:44,fxStress:40,commodity:45,hedgeStress:38}},corr={average:.48};
const r=ctx.globalRiskModel(countries,early,cross,corr);
ok(r.architectureVersion==='FA1','factor architecture version exposed');
ok(r.score===42,'deterministic new GLOBAL fixture score',String(r.score));
ok(r.legacyComparison.oldGlobalRisk===41,'legacy v3.5.1.52 fixture reproduced',String(r.legacyComparison.oldGlobalRisk));
ok(r.legacyComparison.difference===1,'old/new difference exported',String(r.legacyComparison.difference));
ok(r.legacyComparison.weightPreservingSplit===true,'weight-preserving split explicitly declared');
ok(Object.keys(r.components).length===10,'ten production factor families');
ok(r.diagnosticFactors.structuralFinancial.weight===0,'structural financial vulnerability diagnostic-only in Phase 5');
ok(!Object.prototype.hasOwnProperty.call(weights,'fiscalStructural'),'fiscal structural factor not prematurely production-weighted');
const contrib=Object.values(r.factorContributions).filter(Number.isFinite).reduce((a,b)=>a+b,0);
ok(Math.abs(contrib-r.score)<1,'factor contributions reconcile to rounded GLOBAL score',String(contrib));
ok(r.factorDetails.credit.expectedSubfactors===5&&r.factorDetails.credit.availableSubfactors===5,'credit grouped into five bounded subfamilies');
ok(r.factorDetails.volatility.expectedSubfactors===4,'volatility raw signals grouped into four subfamilies');
ok(r.factorDetails.volatility.subfactors.find(x=>x.key==='optionsShape').inputCount===4,'four option signals collapse into one options subfactor');
// Duplicate identical option rows do not gain an extra factor-family vote.
const dup=early.concat([{name:'VIX9D / VIX event-risk ratio',trend:'Volatility',score:45,freshness:C},{name:'VVIX · volatility of volatility',trend:'Volatility',score:50,freshness:C}]);
const rd=ctx.globalRiskModel(countries,dup,cross,corr);
ok(rd.components.volatility===r.components.volatility,'duplicate identical correlated rows do not increase volatility factor weight',`${rd.components.volatility} vs ${r.components.volatility}`);
// Missing families are not zero-filled; eligibility protects limited data.
const sparseEarly=early.filter(x=>['VIX','VIX cross-asset','VIX / VIX3M term structure','VIX9D / VIX event-risk ratio','VVIX · volatility of volatility','SKEW · tail-hedging demand','MOVE','MOVE cross-asset','Cross-Asset Volatility Breadth'].includes(x.name));
const sparse=ctx.globalRiskModel([],sparseEarly,{components:{}},{average:null});
ok(sparse.factorGroups<5&&!sparse.eligible&&sparse.limited,'insufficient factor families => LIMITED DATA');
ok(!Number.isFinite(sparse.components.credit),'missing credit remains missing, not zero');
ok(src.includes('Structural Financial Vulnerability')&&src.includes('diagnosticFactors'),'structural diagnostic is auditable');
console.log(`RESULT - ${p}/${p+f} Phase 5 factor architecture checks under Phase 7 ${f?'FAIL':'PASS'}`);if(f)process.exit(1);
