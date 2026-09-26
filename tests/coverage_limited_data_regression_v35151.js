'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
const names=['freshnessUsableV50','countryCoverageV50','earlyFreshRatioV50','countryFreshRatioV50','globalRiskModel'];
let code='';for(const n of names){const x=extractFunction(src,n);if(x)code+=x+'\n';}
const ctx={console,Math,Number,String,Object,Array,RegExp,GLOBAL_WEIGHTS:{creditFunding:25,volatility:15,equity:10,macro:15,liquidity:10,rates:8,fx:7,commodities:5,correlation:5},COUNTRY_MIN_EFFECTIVE_COVERAGE_V50:50,COUNTRY_MIN_FACTOR_GROUPS_V50:3,COUNTRY_FACTOR_GROUPS_V50:{market:['market','technical'],macro:['macro'],credit:['credit'],liquidity:['liquidity'],valuation:['valuation'],systemic:['systemic']},GLOBAL_MIN_EFFECTIVE_COVERAGE_V50:50,GLOBAL_MIN_FACTOR_GROUPS_V50:5,providerHealth:{FRED:{success:1},Yahoo:{success:1},WB:{success:1}},globalConfidenceV51:(components,coverage)=>({label:coverage&&coverage.eligible?'HIGH':'LIMITED',score:coverage&&coverage.eligible?90:null,components:{},sourceQuality:{grade:'A'}}),avg:a=>{let v=(a||[]).filter(Number.isFinite);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null},clamp:x=>Math.max(0,Math.min(100,x)),getWeights:()=>({market:25,macro:20,credit:15,liquidity:15,valuation:10,technical:10,systemic:5})};
vm.createContext(ctx);vm.runInContext(code+';this.cc=countryCoverageV50;this.gr=globalRiskModel;',ctx);
function country(subs,fresh,raw={available:5,expected:5}){return{subscores:subs,factorFreshnessV50:fresh,rawCoverageV50:raw}}
let c=ctx.cc(country({market:20,macro:30,credit:40,liquidity:25,valuation:30,technical:20,systemic:15},{market:'CURRENT',macro:'OLD_BUT_CURRENT_RELEASE',credit:'CURRENT',liquidity:'CURRENT',valuation:'CURRENT',technical:'CURRENT',systemic:'CURRENT'}));
ok(c.eligible===true,'complete country passes eligibility',JSON.stringify(c));
ok(c.dataCoverage===100&&c.factorCoverage===100&&c.freshnessCoverage===100,'three country coverage semantics distinct and complete',JSON.stringify(c));
c=ctx.cc(country({market:20,macro:null,credit:null,liquidity:null,valuation:null,technical:20,systemic:null},{market:'CURRENT',technical:'CURRENT'},{available:1,expected:5}));
ok(c.eligible===false,'insufficient partial country becomes LIMITED DATA eligible=false',JSON.stringify(c));
ok(c.effectiveWeightedCoverage===35&&c.factorGroups===1,'partial diagnostic coverage computed without zero-fill',JSON.stringify(c));
c=ctx.cc(country({market:20,macro:35,credit:null,liquidity:25,valuation:null,technical:20,systemic:15},{market:'CURRENT',macro:'OLD_BUT_CURRENT_RELEASE',liquidity:'CURRENT',technical:'CURRENT',systemic:'CURRENT'},{available:4,expected:5}));
ok(c.eligible===true&&c.effectiveWeightedCoverage===75&&c.factorGroups===4,'renormalized normal country allowed only after gate',JSON.stringify(c));
c=ctx.cc(country({market:20,macro:35,credit:null,liquidity:25,valuation:null,technical:20,systemic:15},{market:'STALE',macro:'OLD_BUT_CURRENT_RELEASE',liquidity:'STALE',technical:'STALE',systemic:'STALE'},{available:4,expected:5}));
ok(c.eligible===false&&c.freshnessCoverage===20,'stale weighted inputs reduce freshness coverage and block normal color',JSON.stringify(c));
// Global complete fixture: every component has all its candidate slots and fresh supports.
const countries=[{subscores:{market:30,macro:35,liquidity:25,systemic:20},factorFreshnessV50:{market:'CURRENT',macro:'OLD_BUT_CURRENT_RELEASE',liquidity:'CURRENT',systemic:'CURRENT'}}];
const early=[
{name:'HY OAS',trend:'Credit',score:30,freshness:'CURRENT'},
{name:'VIX',trend:'Volatility',score:25,freshness:'CURRENT'},
{name:'Yield curve',trend:'Rates',score:20,freshness:'CURRENT'},
{name:'Trade signal',trend:'Trade',score:35,freshness:'CURRENT'},
{name:'Inflation Detector Composite',trend:'Macro / inflation',score:40,freshness:'CURRENT'},
{name:'Financial stress',trend:'Financial stress',score:25,freshness:'CURRENT'},
{name:'Oil risk',trend:'Commodity',score:45,freshness:'CURRENT'}];
const cross={components:{creditFunding:30,breadth:25,optionsStress:20,breadthStress:35,rates:30,fxStress:25,commodity:40,hedgeStress:30}};
let g=ctx.gr(countries,early,cross,{average:.4},20);
ok(g.eligible===true,'complete GLOBAL fixture passes coverage gate',JSON.stringify(g));
ok(g.factorCoverage===100&&g.dataCoverage===100&&g.freshnessCoverage===100&&g.sourceValidityCoverage===100,'GLOBAL exposes separate complete coverage metrics',JSON.stringify(g));
ok(g.coverage===g.effectiveCoverage,'legacy global coverage field now maps to explicit effective coverage');
// Numeric GLOBAL score invariance: Phase 2 changes coverage semantics, not the finite-input score formula.
const baseSrc=fs.readFileSync(path.join(__dirname,'..','app_v35149_baseline.js'),'utf8');
const oldGR=extractFunction(baseSrc,'globalRiskModel');
const oldCtx={console,Math,Number,String,Object,Array,RegExp,GLOBAL_WEIGHTS:ctx.GLOBAL_WEIGHTS,providerHealth:ctx.providerHealth,avg:ctx.avg,clamp:ctx.clamp,categoryAvg:(a,p)=>ctx.avg((a||[]).filter(p).map(x=>x.score))};
vm.createContext(oldCtx);vm.runInContext(oldGR+';this.gr0=globalRiskModel;',oldCtx);
const oldG=oldCtx.gr0(countries,early,cross,{average:.4},20);
ok(oldG.score===g.score,'GLOBAL numeric score unchanged for identical finite inputs',oldG.score+' vs '+g.score);

let gp=ctx.gr([{subscores:{market:30,macro:null,liquidity:null,systemic:null},factorFreshnessV50:{market:'CURRENT'}}],[],null,{average:null},null);
ok(gp.eligible===false&&gp.factorGroups<5,'partial GLOBAL fixture becomes LIMITED DATA eligible=false',JSON.stringify(gp));
ok(gp.score!==0,'missing GLOBAL data is never converted to zero',JSON.stringify(gp));
// Source/UI semantics
for(const token of ['dataCoverage','factorCoverage','freshnessCoverage','effectiveWeightedCoverage','LIMITED DATA','COUNTRY_MIN_FACTOR_GROUPS_V50','GLOBAL_MIN_FACTOR_GROUPS_V50'])ok(src.includes(token),'Phase-2 token present: '+token);
ok(src.includes("for(const c of countries)if(Number.isFinite(c.risk)&&!c.limited)"),'limited countries excluded from Top Risk ranking');
ok(src.includes("appState.global||appState.global.limited"),'global alert suppressed when coverage-limited');
ok(src.includes('legacy cache requires Phase-2 coverage recalculation'),'legacy cache cannot resurrect normal status without coverage metadata');
console.log(`RESULT - ${p}/${p+f} Phase 2 coverage/LIMITED DATA regression checks PASS`);if(f)process.exit(1);
