'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35161_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
function extractFunction(text,name){let i=text.indexOf('async function '+name+'(');if(i<0)i=text.indexOf('function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function extractConst(text,name){let i=text.indexOf('const '+name+'=');if(i<0)return null;let d=0,sq=false,dq=false,tq=false,esc=false;for(let j=i;j<text.length;j++){let c=text[j];if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{'||c==='['||c==='(')d++;if(c==='}'||c===']'||c===')')d--;if(c===';'&&d===0)return text.slice(i,j+1)}return null}

ok(/versionCode\s+96\b/.test(gradle),'versionCode 96');
ok(/versionName\s+['"]3\.5\.1\.63['"]/.test(gradle),'versionName 3.5.1.63');
ok(html.includes('v3.5.1_63'),'visible header v3.5.1_63');
ok(/VERSION_NAME="3\.5\.1\.63"/.test(release)&&/VERSION_CODE="96"/.test(release),'release metadata v3.5.1.63 / 96');
ok(java.includes('MarketRiskMonitor/3.5.1.63'),'native user-agent v3.5.1.63');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.63',EXPORT_V47_CODE=96"),'export metadata v3.5.1.63 / 96');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded WebView JavaScript byte-identical to app.js');
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'Phase 12 introduces no new raw fetch call sites');

for(const n of ['globalRiskModel','globalFactorArchitectureV53','buildMacroCycle','fiscalScoreRowsV43','commodityShockRisk','commodityRegime','aggregateEquityInternalsV57','lagAwareCorrMatrixV58']){
 const a=extractFunction(src,n),b=extractFunction(base,n);ok(!!a&&a===b,'protected model function unchanged: '+n,sha(a)+' / '+sha(b));
}
for(const n of ['sourceRegistryEntryV62','classifyFetchFailureV62','validateFetchedPayloadV62','retryDelayV62','providerResilienceSnapshotV62'])ok(!!extractFunction(src,n),'Phase-12 helper present: '+n);
ok(!!extractConst(src,'SOURCE_RESILIENCE_REGISTRY_V62'),'provider resilience registry present');
ok(!!extractConst(src,'SOURCE_FALLBACK_CHAINS_V62'),'fallback-chain registry present');
ok(!!extractConst(src,'SOURCE_CLASS_ORDER_V62'),'five source classes present');

const ctx={console,Math,Number,String,Object,Array,SyntaxError};vm.createContext(ctx);
for(const n of ['SOURCE_QUALITY_V51','SOURCE_RESILIENCE_REGISTRY_V62','SOURCE_FALLBACK_CHAINS_V62','SOURCE_CLASS_ORDER_V62'])vm.runInContext(extractConst(src,n),ctx);
for(const n of ['providerQualityV51','sourceRegistryEntryV62','classifyFetchFailureV62','validateFetchedPayloadV62','retryDelayV62'])vm.runInContext(extractFunction(src,n),ctx);
let classes=vm.runInContext('Object.keys(SOURCE_CLASS_ORDER_V62)',ctx);
ok(classes.join(',')==='PRIMARY_OFFICIAL,PRIMARY_MARKET,INSTITUTIONAL,SECONDARY,UNOFFICIAL_FALLBACK','source taxonomy exactly matches Phase 12 requirement');
ok(vm.runInContext("sourceRegistryEntryV62('FRED').sourceClass",ctx)==='PRIMARY_OFFICIAL','FRED classified PRIMARY_OFFICIAL');
ok(vm.runInContext("sourceRegistryEntryV62('ECB').sourceClass",ctx)==='PRIMARY_OFFICIAL','ECB classified PRIMARY_OFFICIAL');
ok(vm.runInContext("sourceRegistryEntryV62('World Bank').sourceClass",ctx)==='PRIMARY_OFFICIAL','World Bank classified PRIMARY_OFFICIAL');
ok(vm.runInContext("sourceRegistryEntryV62('GIE').sourceClass",ctx)==='PRIMARY_OFFICIAL','GIE classified PRIMARY_OFFICIAL');
ok(vm.runInContext("sourceRegistryEntryV62('Cboe').sourceClass",ctx)==='PRIMARY_MARKET','Cboe classified PRIMARY_MARKET');
ok(vm.runInContext("sourceRegistryEntryV62('Yahoo Finance').sourceClass",ctx)==='PRIMARY_MARKET','Yahoo classified PRIMARY_MARKET, not official macro source');
ok(vm.runInContext("sourceRegistryEntryV62('World Gold Council').sourceClass",ctx)==='INSTITUTIONAL','World Gold Council classified INSTITUTIONAL');
ok(vm.runInContext("sourceRegistryEntryV62('Unknown').sourceClass",ctx)==='UNOFFICIAL_FALLBACK','unknown source degrades to UNOFFICIAL_FALLBACK');
ok(vm.runInContext("sourceRegistryEntryV62('FRED').critical",ctx)===true,'critical official source metadata retained');
ok(vm.runInContext("SOURCE_FALLBACK_CHAINS_V62.impliedVolatility.join('>')",ctx)==='Cboe>Yahoo Finance','implied-volatility fallback hierarchy explicit');

function err(code,status,name,msg){let e=new Error(msg||code);if(code)e.code=code;if(status!==undefined)e.status=status;if(name)e.name=name;return e}
ok(vm.runInContext("classifyFetchFailureV62(Object.assign(new Error('x'),{name:'AbortError'}))",ctx)==='TIMEOUT','timeout classified');
ok(vm.runInContext("classifyFetchFailureV62(Object.assign(new Error('HTTP 429'),{status:429}))",ctx)==='HTTP_429','HTTP 429 classified');
ok(vm.runInContext("classifyFetchFailureV62(Object.assign(new Error('HTTP 503'),{status:503}))",ctx)==='HTTP_5XX','HTTP 5xx classified');
ok(vm.runInContext("classifyFetchFailureV62(Object.assign(new Error('HTTP 404'),{status:404}))",ctx)==='HTTP_4XX','HTTP 4xx classified');
ok(vm.runInContext("classifyFetchFailureV62(Object.assign(new Error('bad json'),{code:'MALFORMED_JSON'}))",ctx)==='MALFORMED_JSON','malformed JSON classified');
ok(vm.runInContext("classifyFetchFailureV62(Object.assign(new Error('empty'),{code:'EMPTY_RESPONSE'}))",ctx)==='EMPTY_RESPONSE','empty response classified');
ok(vm.runInContext("classifyFetchFailureV62(new Error('Failed to fetch'))",ctx)==='NETWORK','network failure classified');
let emptyRejected=false;try{vm.runInContext("validateFetchedPayloadV62('', 'text')",ctx)}catch(e){emptyRejected=e.code==='EMPTY_RESPONSE'}ok(emptyRejected,'blank text response rejected before caching');
let nullRejected=false;try{vm.runInContext("validateFetchedPayloadV62(null, 'json')",ctx)}catch(e){nullRejected=e.code==='EMPTY_RESPONSE'}ok(nullRejected,'null JSON response rejected before caching');
ok(vm.runInContext("retryDelayV62(Object.assign(new Error('x'),{status:429}),0)",ctx)>0,'429 gets bounded backoff');
ok(vm.runInContext("retryDelayV62(Object.assign(new Error('x'),{status:429,retryAfterMs:999999}),0)",ctx)<=2500,'Retry-After is capped');
ok(vm.runInContext("retryDelayV62(Object.assign(new Error('x'),{status:404}),0)",ctx)===0,'non-transient 4xx receives no retry delay');

const fetchFn=extractFunction(src,'fetchWithTimeout');
ok(fetchFn.includes("attempts=(forceFreshRequests||force)?3:2"),'central transport uses bounded retry count');
ok(fetchFn.includes("validateFetchedPayloadV62(data,type);if(!nativeCache)writeHttpCache"),'payload validated before cache write');
ok(fetchFn.includes("!['MALFORMED_JSON','EMPTY_RESPONSE'].includes(classifyFetchFailureV62(e))"),'malformed/empty payloads do not enter retry loop');
ok(fetchFn.includes('lastFailureClass=classifyFetchFailureV62'),'provider diagnostics retain failure class');
ok(fetchFn.indexOf('let stale=readHttpCache')>fetchFn.indexOf('for(let attempt=0;attempt<attempts;attempt++)'),'stale cache is fallback after live attempts');

const best=extractFunction(src,'bestSeries'),yahoo=extractFunction(src,'yahoo'),food=extractFunction(src,'buildFoodV34');
ok(best.indexOf('cboeHistory')<best.indexOf('yahoo('),'Cboe attempted before Yahoo fallback');
ok(yahoo.includes('for(const base of [Y1,Y2])'),'Yahoo query1/query2 endpoint failover retained');
ok(food.indexOf('FAO_FOOD_PRICE_CSV')<food.indexOf('FAO_FOOD_PRICE_PAGE'),'FAO official CSV precedes official HTML fallback');

// Dynamic transport simulations.
async function transportScenario(sequence,{stale=null,type='json'}={}){
 let calls=0,writes=0,recorded=[],cacheReads=0;
 const c={console,Math,Number,String,Object,Array,SyntaxError,AbortController,setTimeout,clearTimeout,performance,location:{hostname:'web.test'},forceFreshRequests:false,refreshInFlight:false,providerHealth:{},
   readHttpCache:(url,t,allowStale)=>{cacheReads++;return allowStale&&stale?{data:stale,age:999,source:'persistent'}:null},
   recordProviderCache:(url,age,isStale)=>{c.providerHealth.FRED={success:0,fail:0,cache:1,fallbackUsed:!!isStale};recorded.push('cache');return'FRED'},
   recordProvider:(url,success,latency,error='')=>{let q=c.providerHealth.FRED||(c.providerHealth.FRED={success:0,fail:0});success?q.success++:q.fail++;q.lastError=error;recorded.push(success?'ok':'fail');return'FRED'},
   writeHttpCache:()=>{writes++},loadUiNetworkV45:()=>{},refreshProgressNetwork:()=>{},providerTtl:()=>1000,waitV54:async()=>{},
   fetch:async()=>{let item=sequence[Math.min(calls,sequence.length-1)];calls++;if(item.throw)throw item.throw;return {ok:item.ok!==false,status:item.status||200,headers:{get:k=>item.retryAfter&&k==='Retry-After'?String(item.retryAfter):null},json:async()=>{if(item.jsonError)throw item.jsonError;return item.data===undefined?{ok:true}:item.data},text:async()=>item.data===undefined?'ok':item.data}}
 };
 vm.createContext(c);
 for(const n of ['classifyFetchFailureV62','validateFetchedPayloadV62','retryDelayV62','transientFetchErrorV54'])vm.runInContext(extractFunction(src,n),c);
 vm.runInContext(fetchFn,c);
 let result,error=null;try{result=await c.fetchWithTimeout('https://fred.stlouisfed.org/test',type,10,true,false)}catch(e){error=e}
 return{calls,writes,recorded,cacheReads,result,error,health:c.providerHealth.FRED||{}};
}
(async()=>{
 let a=await transportScenario([{ok:false,status:429,retryAfter:0},{data:{ok:1}}]);
 ok(a.calls===2&&a.result.ok===1,'HTTP 429 retries once then succeeds');
 ok(a.writes===1&&a.recorded.includes('ok'),'successful retry caches only validated payload');
 let to=new Error('timed out');to.name='AbortError';let b=await transportScenario([{throw:to},{data:{ok:2}}]);
 ok(b.calls===2&&b.result.ok===2,'timeout is isolated by bounded retry');
 let c=await transportScenario([{ok:false,status:503},{data:{ok:3}}]);
 ok(c.calls===2&&c.result.ok===3,'HTTP 5xx is isolated by bounded retry');
 let malformed=new SyntaxError('Unexpected token < in JSON');let d=await transportScenario([{jsonError:malformed}],{stale:{cached:1}});
 ok(d.calls===1&&d.result.cached===1,'malformed JSON falls back to stale cache without retry storm');
 ok(d.writes===0&&d.health.lastFailureClass==='MALFORMED_JSON','malformed payload is not written to cache and is diagnosed');
 let e=await transportScenario([{data:''}],{stale:{cached:2},type:'text'});
 ok(e.calls===1&&e.result.cached===2,'empty text response falls back to stale cache');
 ok(e.writes===0&&e.health.lastFailureClass==='EMPTY_RESPONSE','empty response is not written to cache and is diagnosed');
 let f1=await transportScenario([{ok:false,status:404}]);
 ok(f1.calls===1&&!!f1.error,'non-transient HTTP 4xx fails only its request without retries');
 ok(f1.health.lastFailureClass==='HTTP_4XX','HTTP 4xx failure class retained in provider health');

 const refresh=extractFunction(src,'refreshAll')||'';
 ok(refresh.includes("catch(e){console.warn('FRED module failed'"),'FRED failure isolated inside refresh');
 ok(refresh.includes("catch(e){console.warn('Country module failed'"),'country module failure isolated inside refresh');
 ok(refresh.includes("catch(e){console.warn('Cross-asset module failed'"),'cross-asset failure isolated inside refresh');
 ok(refresh.includes("catch(e){console.warn('Equity internals failed'"),'equity internals failure isolated inside refresh');
 ok(refresh.includes("catch(e){console.warn('Macro-cycle module failed'"),'macro failure isolated inside refresh');
 ok(src.includes('sourceResilienceV62:providerResilienceSnapshotV62()'),'source resilience diagnostics included in data export');
 ok(src.includes('PRIMARY_OFFICIAL, PRIMARY_MARKET, INSTITUTIONAL, SECONDARY or UNOFFICIAL_FALLBACK'),'methodology export documents source classes');
 ok(!extractConst(src,'SOURCE_RESILIENCE_REGISTRY_V62').includes('ApiKey')&&!extractConst(src,'SOURCE_RESILIENCE_REGISTRY_V62').includes('token'),'Phase 12 registry/export introduces no secret fields');
 console.log(`\nPhase 12 source resilience: ${p} passed, ${f} failed`);if(f)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
