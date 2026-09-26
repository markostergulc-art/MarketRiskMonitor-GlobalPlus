const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('app/src/main/assets/economic_structure_v125.js','utf8');
const store=new Map();
const ctx={window:{},console,Set,URLSearchParams,Promise,Date,JSON,Number,String,Object,Array,Math,encodeURIComponent,
 localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
 activeMarketConfig:()=>[{code:'DE',wb:'DEU'}],EXTENDED_COUNTRY_CONFIG:[],fetchWithTimeout:async()=>{throw Error('not used')}};
vm.createContext(ctx);vm.runInContext(src,ctx);const E=ctx.window.MRMEconomicStructure;
const common={reporterCode:276,period:2024,flowCode:'X'};
const good={reporterCode:276,period:'2024',flowCode:'X',partnerCode:0,partner2Code:0,customsCode:'C00',motCode:0,aggrLevel:2,cmdCode:'87',cmdDesc:'Vehicles',classificationCode:'H6',primaryValue:200};
const dupTransport={...good,motCode:3200,primaryValue:900};
const dupCustoms={...good,customsCode:'C20',primaryValue:800};
const good84={...good,cmdCode:'84',cmdDesc:'Machinery',primaryValue:300};
const rows=[good,dupTransport,dupCustoms,good84];
const parsed=E.parseHs2Rows(rows,common);
assert.equal(parsed.length,2);assert.equal(parsed[0].cmdCode,'84');assert.equal(parsed[1].cmdCode,'87');
assert(E.comtradeExactTotalRow(good,{...common,partnerCode:0,aggrLevel:2}));
assert(!E.comtradeExactTotalRow(dupTransport,{...common,partnerCode:0,aggrLevel:2}));
const total={...good,cmdCode:'TOTAL',cmdDesc:'All Commodities',aggrLevel:0,primaryValue:1000};
assert.equal(E.parseWorldTotal([total,{...total,motCode:1000,primaryValue:5000}],common).primaryValue,1000);
const d1={...total,partnerCode:250,partnerDesc:'France',primaryValue:150};
const d2={...total,partnerCode:0,partnerDesc:'World',primaryValue:1000};
const d3={...total,partnerCode:999,partnerDesc:'Areas nes',primaryValue:900};
const dest=E.parseDestinationRows([d1,d2,d3],common);assert.equal(dest.length,1);assert.equal(dest[0].partnerDesc,'France');
assert.equal(E.comtradeReporter('DEU'),276);assert.equal(E.comtradeReporter('HRV'),191);
assert(E.comtradeUrl({reporterCode:276,cmdCode:'AG2',customsCode:'C00',motCode:0,partner2Code:0}).includes('customsCode=C00'));
console.log('economic structure trade parser: PASS');


(async()=>{
 const store2=new Map();
 const ctx2={window:{},console,Set,URLSearchParams,Promise,Date,JSON,Number,String,Object,Array,Math,encodeURIComponent,
  localStorage:{getItem:k=>store2.has(k)?store2.get(k):null,setItem:(k,v)=>store2.set(k,v),removeItem:k=>store2.delete(k)},
  activeMarketConfig:()=>[{code:'DE',wb:'DEU'}],EXTENDED_COUNTRY_CONFIG:[],
  fetchWithTimeout:async (u,t,to,tr,force,diag)=>{
    diag.transport='NETWORK';diag.sourceRetrievedAt='2026-09-26T10:00:00Z';
    const q=new URL(u).searchParams, flow=q.get('flowCode'), cmd=q.get('cmdCode');
    const base={reporterCode:276,period:'2024',flowCode:flow,partner2Code:0,customsCode:'C00',motCode:0};
    if(flow==='X'&&cmd==='AG2')return {data:[
      {...base,partnerCode:0,aggrLevel:2,cmdCode:'84',cmdDesc:'Machinery',classificationCode:'H6',primaryValue:300},
      {...base,partnerCode:0,aggrLevel:2,cmdCode:'87',cmdDesc:'Vehicles',classificationCode:'H6',primaryValue:200}
    ]};
    if(flow==='X'&&cmd==='TOTAL')return {data:[
      {...base,partnerCode:0,partnerDesc:'World',aggrLevel:0,cmdCode:'TOTAL',cmdDesc:'All Commodities',primaryValue:1000},
      {...base,partnerCode:250,partnerDesc:'France',aggrLevel:0,cmdCode:'TOTAL',cmdDesc:'All Commodities',primaryValue:150}
    ]};
    if(flow==='M'&&cmd==='AG2')return {data:[
      {...base,partnerCode:0,aggrLevel:2,cmdCode:'27',cmdDesc:'Mineral fuels',classificationCode:'H6',primaryValue:100}
    ]};
    if(flow==='M'&&cmd==='TOTAL')return {data:[
      {...base,partnerCode:0,partnerDesc:'World',aggrLevel:0,cmdCode:'TOTAL',cmdDesc:'All Commodities',primaryValue:400}
    ]};
    throw Error('unexpected query '+u);
  }};
 vm.createContext(ctx2);vm.runInContext(src,ctx2);const E2=ctx2.window.MRMEconomicStructure;
 const out=await E2.loadTradeForPeriod({iso3:'DEU'},2024);
 assert.equal(out.totalExports.value,1000);
 assert.equal(out.topExports[0].hsCode,'84');assert.equal(out.topExports[0].sharePct,30);
 assert.equal(out.exportDestinations[0].partner,'France');assert.equal(out.exportDestinations[0].sharePct,15);
 assert.equal(out.totalImports.value,400);assert.equal(out.topImports[0].sharePct,25);
 assert.equal(out.topExports[0].shareObservation.value,30);
 console.log('economic structure trade share reconstruction: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
