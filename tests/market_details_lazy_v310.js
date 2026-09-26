const fs=require('fs'),vm=require('vm'),assert=require('assert');
const app=fs.readFileSync('app.js','utf8'),mod=fs.readFileSync('app/src/main/assets/market_details_v310.js','utf8');
const m=app.match(/const MARKET_CONFIG=\[([\s\S]*?)\n\];/),markets=vm.runInNewContext('['+m[1]+']');
const countries=markets.map(c=>({...c,macroData:{gdp:{year:2025,value:1,observation:'2025',source:'World Bank'},inf:{year:2025,value:2,observation:'2025',source:'World Bank'},un:{year:2025,value:3,observation:'2025',source:'World Bank'}}}));
const calls=[],store={};let resolveDE;
async function fetchWithTimeout(url){calls.push(url);if(url.includes('/DEU/')&&url.includes('NY.GDP.MKTP.CD'))return await new Promise(r=>{resolveDE=()=>r([{},[{countryiso3code:'DEU',date:'2025',value:5000000000000}]])});let iso=(url.match(/country\/([^/]+)/)||[])[1]||'X';return [{},[{countryiso3code:iso,date:'2025',value:1000000000}]]}
const ctx={window:{appState:{countries}},appState:{countries},activeMarketConfig:()=>markets.slice(),localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},freshnessModelV49:()=>({freshnessStatus:'CURRENT'}),fetchWithTimeout,console,setTimeout,clearTimeout,Date};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext(mod,ctx);const api=ctx.window.MRMMarketDetailsV310;
(async()=>{
 assert.strictEqual(calls.length,0,'module load must not fetch');
 let us=await api.activate('US');assert.strictEqual(calls.filter(x=>x.includes('/USA/')).length,3,'opening US fetches only three US context metrics');assert(us.context.nominalGdp&&us.context.gdpPerCapita&&us.context.tradePctGdp,'US context metrics');let before=calls.length;await api.activate('US');assert.strictEqual(calls.length,before,'fresh context cache prevents duplicate provider requests');
 let pde=api.activate('DE');await new Promise(r=>setImmediate(r));let phr=api.activate('HR');let hr=await phr;assert.strictEqual(api.state.activeCode,'HR','HR becomes active');resolveDE();await pde;assert.strictEqual(api.state.activeCode,'HR','late DE response cannot change active market');assert(api.getMarketState('DE').context.nominalGdp,'late DE result can enter DE cache/state');
 assert(!calls.some(x=>x.includes('/JPN/')||x.includes('/CHN/')),'unopened markets are not fetched');
 console.log('market_details_lazy_v310: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
