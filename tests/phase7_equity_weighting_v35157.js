'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function extractConst(text,name,terminator=';'){let token='const '+name+'=',i=text.indexOf(token);if(i<0)return null;let j=text.indexOf(terminator,i);return j<0?null:text.slice(i,j+terminator.length)}
function extractMarketConfig(text){let i=text.indexOf('const MARKET_CONFIG=[');if(i<0)return null;let j=text.indexOf('\n\n];',i);if(j<0)j=text.indexOf('\n];',i);if(j<0)return null;return text.slice(i,j+(text.startsWith('\n\n];',j)?4:3)).replace(/\n\n];$/,'\n];')}
const names=['equityGlobalEligibilityV42','aggregateEquityInternalsV42','cappedNormalizeV57','equityRegionV57','aggregateEquityInternalsV57'];
for(const n of names)ok(!!extractFunction(src,n),'function present: '+n);
for(const n of ['EQUITY_REGION_WEIGHTS_V57','EQUITY_MARKET_REGION_V57','EQUITY_MARKET_IMPORTANCE_V57'])ok(src.includes('const '+n+'='),'constant present: '+n);
ok(src.includes("EQUITY_INTRA_REGION_MAX_SHARE_V57=.70"),'70% intra-region cap declared');
ok(src.includes("EQUITY_GLOBAL_MIN_REGIONS_V57=3"),'minimum 3 represented regions declared');
ok(src.includes("EQUITY_GLOBAL_MIN_WEIGHTED_COVERAGE_PCT_V57=40"),'weighted coverage gate declared');
const avg=a=>{let x=(a||[]).filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null},clamp=x=>Math.max(0,Math.min(100,x));
const ctx={console,Math,Number,String,Object,Array,RegExp,Set,Map,avg,clamp};vm.createContext(ctx);
let mc=extractMarketConfig(src);if(!mc){console.error('FAIL - MARKET_CONFIG extraction');process.exit(1)}vm.runInContext(mc,ctx);
for(const n of ['EQUITY_REGION_WEIGHTS_V57','EQUITY_MARKET_REGION_V57','EQUITY_MARKET_IMPORTANCE_V57'])vm.runInContext(extractConst(src,n),ctx);
vm.runInContext("const EQUITY_GLOBAL_MIN_COVERAGE_PCT_V42=40; const EQUITY_INTRA_REGION_MAX_SHARE_V57=.70,EQUITY_GLOBAL_MIN_REGIONS_V57=3,EQUITY_GLOBAL_MIN_WEIGHTED_COVERAGE_PCT_V57=40,EQUITY_REGION_METHOD_V57='RW1';",ctx);
for(const n of names)vm.runInContext(extractFunction(src,n),ctx);
const rw=vm.runInContext('EQUITY_REGION_WEIGHTS_V57',ctx),rm=vm.runInContext('EQUITY_MARKET_REGION_V57',ctx),imp=vm.runInContext('EQUITY_MARKET_IMPORTANCE_V57',ctx),markets=vm.runInContext('MARKET_CONFIG',ctx);
ok(Object.values(rw).reduce((a,b)=>a+b,0)===100,'regional weights sum to 100');
ok(Object.keys(rw).length===7,'seven economic regions');
const unmapped=markets.filter(x=>!rm[x.code]||!Number.isFinite(imp[x.code])||imp[x.code]<=0).map(x=>x.code);
ok(unmapped.length===0,'every active core market mapped to region + positive importance',unmapped.join(','));
function countriesAndScores(fn,coverageFn=()=>100){let countries=markets.map(c=>({...c,series:Array.from({length:60},(_,i)=>({d:'2026-01-'+String((i%28)+1).padStart(2,'0'),v:100+i}))})),byCode={};for(const c of countries)byCode[c.code]={score:fn(c),coverage:coverageFn(c),regime:fn(c)>=60?'BROAD EQUITY STRESS':'HEALTHY PARTICIPATION'};return{countries,byCode}}
function run(fn,coverageFn){let {countries,byCode}=countriesAndScores(fn,coverageFn);return ctx.aggregateEquityInternalsV57(countries,byCode)}
let normal=run(()=>30);ok(normal.score===30,'normal regime remains 30',String(normal.score));ok(normal.legacyEqualMarketScore===30,'normal legacy equal-market score remains 30');ok(normal.weightedCoveragePct===100&&normal.representedRegions===7,'complete universe = 100% weighted coverage / 7 regions');
let us=run(c=>c.code==='US'?90:30);ok(us.legacyEqualMarketScore===32,'US-only stress legacy equal-market score = 32',String(us.legacyEqualMarketScore));ok(us.score===40,'US-only stress regional score = 40',String(us.score));ok(us.score>us.legacyEqualMarketScore,'US receives more importance than a single small equal-weight market');let na=us.regions.find(r=>r.region==='North America'),usrow=na.markets.find(x=>x.code==='US');ok(usrow.normalizedShare<=.7000001,'US intra-region share capped at 70%',String(usrow.normalizedShare));ok(rw['North America']*usrow.normalizedShare<=16.8001,'US maximum direct global regional share <= 16.8%',String(rw['North America']*usrow.normalizedShare));
let eu=run(c=>rm[c.code]==='Europe'?80:30);ok(eu.legacyEqualMarketScore===49,'Europe-only stress legacy equal-market score = 49',String(eu.legacyEqualMarketScore));ok(eu.score===42,'Europe-only stress regional score = 42',String(eu.score));
let asia=run(c=>['Developed Asia-Pacific','China / Hong Kong','Emerging Asia'].includes(rm[c.code])?80:30);ok(asia.legacyEqualMarketScore===47,'Asia-only stress legacy equal-market score = 47',String(asia.legacyEqualMarketScore));ok(asia.score===50,'Asia-only stress regional score = 50',String(asia.score));
let hr=run(c=>c.code==='HR'?90:30),de=run(c=>c.code==='DE'?90:30);ok(hr.score<de.score,'small Croatia market does not equal Germany in global equity weighting',`${hr.score} vs ${de.score}`);
// Missing China/HK: region weight is disclosed and score is renormalized, not zero-filled.
let {countries:mcountries,byCode:mby}=countriesAndScores(()=>30);for(const code of ['CN','HK'])mby[code]={score:null,coverage:0,regime:'N/A'};let miss=ctx.aggregateEquityInternalsV57(mcountries,mby);ok(miss.score===30,'missing whole region is not interpreted as zero risk',String(miss.score));ok(miss.missingRegionWeightPct===12&&miss.renormalized,'missing China/HK 12% regional weight disclosed');ok(miss.weightedCoveragePct===88,'missing region lowers weighted coverage to 88%',String(miss.weightedCoveragePct));
// Only North America + Europe is not sufficient for a global label even though their fixed weight is 48%.
let {countries:fewc,byCode:fewb}=countriesAndScores(c=>['North America','Europe'].includes(rm[c.code])?35:null,c=>['North America','Europe'].includes(rm[c.code])?100:0);let few=ctx.aggregateEquityInternalsV57(fewc,fewb);ok(few.representedRegions===2,'two-region fixture representedRegions = 2');ok(few.score===null,'two-region fixture fails global eligibility gate');
// Coverage is confidence/data quality, not a score substitute.
let half=run(()=>30,()=>50);ok(half.score===30,'50% internal coverage does not change risk score itself');ok(half.weightedCoveragePct===50,'50% internal coverage is preserved as weighted coverage');
ok(src.includes("equityRegionalV57=aggregateEquityInternalsV57")&&src.includes("regionally weighted country equity-internals scores"),'GLOBAL equity factor consumes regional aggregate');
ok(src.includes('legacyEqualMarketScore')&&src.includes('differenceFromEqualMarket'),'before/after equal-market diagnostics exported');
ok(src.includes('missingRegionWeightPct')&&src.includes('renormalizationFactor'),'missing regional weight / renormalization disclosure exported');
console.log(`RESULT - ${p}/${p+f} Phase 7 equity weighting checks ${f?'FAIL':'PASS'}`);if(f)process.exit(1);
