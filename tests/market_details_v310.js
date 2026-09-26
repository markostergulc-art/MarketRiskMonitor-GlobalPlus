const fs=require('fs'),vm=require('vm'),assert=require('assert');
const app=fs.readFileSync('app.js','utf8');
const mod=fs.readFileSync('app/src/main/assets/market_details_v310.js','utf8');
const m=app.match(/const MARKET_CONFIG=\[([\s\S]*?)\n\];/);assert(m,'MARKET_CONFIG not found');
const MARKET_CONFIG=vm.runInNewContext('['+m[1]+']');
assert.strictEqual(MARKET_CONFIG.length,36,'core market universe must remain 36');
const fakeCountries=MARKET_CONFIG.map(c=>({...c,macroData:{gdp:{year:2025,value:1.2,observation:'2025',source:'World Bank',sourceUrl:'https://api.worldbank.org/',retrievedAt:'2026-09-26T00:00:00Z'},inf:{year:2025,value:2.3,observation:'2025',source:'World Bank'},un:{year:2025,value:4.5,observation:'2025',source:'World Bank'}}}));
const ctx={window:{appState:{countries:fakeCountries}},appState:{countries:fakeCountries},MARKET_CONFIG,activeMarketConfig:()=>MARKET_CONFIG.slice(),localStorage:{getItem:()=>null,setItem:()=>{}},freshnessModelV49:()=>({freshnessStatus:'CURRENT'}),console};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext(mod,ctx);
const api=ctx.window.MRMMarketDetailsV310;assert(api,'module missing');
assert.strictEqual(api.allContracts().length,36,'every core market needs contract');
for(const c of MARKET_CONFIG){let contract=api.marketContract(c.code);assert(contract&&contract.core.gdpGrowth.id==='NY.GDP.MKTP.KD.ZG',c.code+' GDP config');let mm=api.modelMetrics(c.code),g=mm.gdpGrowth,i=mm.inflation,u=mm.unemployment;assert(g&&g.value===1.2&&g.usedInModel===(c.code!=='US'&&c.code!=='DE'),c.code+' GDP core reuse');assert(contract.core.inflation.id==='FP.CPI.TOTL.ZG',c.code+' inflation config');assert(i&&i.value===2.3&&i.usedInModel===(c.code!=='US'&&c.code!=='DE'),c.code+' inflation core reuse');assert(contract.core.unemployment.id==='SL.UEM.TOTL.ZS',c.code+' unemployment config');assert(u&&u.value===4.5&&u.usedInModel===(c.code!=='US'&&c.code!=='DE'),c.code+' unemployment core reuse');}
console.log('market_details_v310 phase5: PASS · 36/36 GDP + inflation + unemployment contracts');
