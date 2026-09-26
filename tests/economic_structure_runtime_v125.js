const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('app/src/main/assets/economic_structure_v125.js','utf8');
function make(fetcher, store=new Map()){
 const ctx={window:{},console,Set,URLSearchParams,Promise,Date,JSON,Number,String,Object,Array,Math,encodeURIComponent,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
  activeMarketConfig:()=>[{code:'HR',wb:'HRV'},{code:'DE',wb:'DEU'},{code:'FR',wb:'FRA'}],EXTENDED_COUNTRY_CONFIG:[],fetchWithTimeout:fetcher};
 vm.createContext(ctx);vm.runInContext(src,ctx);return {E:ctx.window.MRMEconomicStructure,ctx,store};
}
(async()=>{
 let urls=[];
 let {E}=make(async (u,t,to,tr,force,diag)=>{urls.push(u);diag.transport='NETWORK';diag.sourceRetrievedAt='2026-09-26T10:00:00Z';return [{lastupdated:'2026-09-01'},[{date:'2025',value:12.3}]]});
 assert.equal(E.state.requests,0,'zero startup requests');
 await E.loadBroadStructure('DE');assert.equal(urls.length,4);assert(urls.every(u=>u.includes('/DEU/')));assert(!urls.some(u=>u.includes('/FRA/')),'country isolation');
 // Fresh cache avoids refetch.
 const n=urls.length;await E.loadBroadStructure('DE');assert.equal(urls.length,n);
 // Stale cache is exposed before refresh completes and then refreshed.
 const old=new Map(); const oldRec={schema:'economicStructure:v1',countryCode:'DE',domain:'broadStructure',retrievedAt:'2025-01-01T00:00:00Z',data:{domain:'broadStructure',status:'READY',retrievedAt:'2025-01-01T00:00:00Z',observationPeriod:'2023',data:{servicesPctGdp:{value:60}},contextOnly:true}};old.set('economicStructure:v1:DE:broadStructure',JSON.stringify(oldRec));
 let resolve; const pending=new Promise(r=>resolve=r), hit=[];let x=make(async (u,t,to,tr,force,diag)=>{hit.push(u);await pending;diag.transport='NETWORK';return [{},[{date:'2025',value:10}]]},old);let pr=x.E.loadBroadStructure('DE');assert.equal(x.E.get('DE').broadStructure.status,'STALE');resolve();await pr;assert.equal(hit.length,4);
 // Domain isolation: WB fails while FAO agriculture still succeeds.
 const fao=fs.readFileSync('tests/fixtures/economic_structure/fao_croatia_2024_actual.csv','utf8');let y=make(async (u,t,to,tr,force,diag)=>{if(u.includes('worldbank'))throw Error('WB down'); if(u.includes('api.data.apps.fao.org')){diag.transport='NETWORK';return fao} throw Error('unexpected')});let rr=await Promise.allSettled([y.E.loadBroadStructure('HR'),y.E.loadAgriculture('HR')]);assert.equal(rr[0].status,'fulfilled');assert.equal(y.E.get('HR').broadStructure.status,'N/A');assert.equal(y.E.get('HR').agriculture.status,'READY');
 console.log('economic structure runtime/cache/isolation: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
