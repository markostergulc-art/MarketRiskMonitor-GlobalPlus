'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
let pass=0,fail=0;function ok(c,n){if(c){console.log('PASS - '+n);pass++}else{console.error('FAIL - '+n);fail++}}
function extractFunction(text,name){let needles=['function '+name+'(','async function '+name+'('],i=-1;for(const needle of needles){i=text.indexOf(needle);if(i>=0)break}if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}

ok(/versionCode\s+101\b/.test(gradle),'versionCode 101');
ok(/versionName\s+['"]3\.5\.1\.68['"]/.test(gradle),'versionName 3.5.1.68');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.68',EXPORT_V47_CODE=101"),'export metadata 3.5.1.68 / 101');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded WebView JavaScript byte-identical to canonical app.js');

const countryFn=extractFunction(src,'countryScoreTracesV56');
ok(!!countryFn,'countryScoreTracesV56 restored');
ok(src.indexOf('function countryScoreTracesV56')<src.indexOf('function scoreAuditSnapshotV56'),'country trace function defined before export snapshot');
ok(/\.\.\.countryScoreTracesV56\(\)/.test(extractFunction(src,'scoreAuditSnapshotV56')||''),'scoreAuditSnapshotV56 consumes country traces');
const cctx={appState:{countries:[{code:'CN',name:'China',subscores:{market:40},risk:44,coverageV50:{eligible:true},quality:{source:'Yahoo Finance',date:'2026-09-15'}}]},getWeights:()=>({market:1}),scoreTraceV56:x=>x};vm.createContext(cctx);vm.runInContext(countryFn,cctx);let traces=cctx.countryScoreTracesV56();
ok(Array.isArray(traces)&&traces.length===1,'country trace export returns loaded countries');
ok(traces[0].indicator==='CN Country Risk'&&traces[0].riskScore===44,'country trace preserves country risk data');

const helper=extractFunction(src,'yahooPrimaryHistoryV68');
ok(!!helper,'CN/PH targeted Yahoo history recovery helper present');
async function helperCase(symbol,failRanges){let calls=[];let ctx={yahoo:async(s,r)=>{calls.push([s,r]);if(failRanges.includes(r))throw new Error('fail '+r);return [{d:'2026-09-15',v:1},{d:'2026-09-14',v:1},{d:'2026-09-13',v:1},{d:'2026-09-12',v:1},{d:'2026-09-11',v:1}]}};vm.createContext(ctx);vm.runInContext(helper,ctx);let value,error=null;try{value=await ctx.yahooPrimaryHistoryV68(symbol)}catch(e){error=e}return{calls,value,error}}
(async()=>{
 let a=await helperCase('000300.SS',['3y']);ok(!a.error&&a.calls.map(x=>x[1]).join(',')==='3y,2y','China falls back 3y -> 2y on Yahoo only');
 let b=await helperCase('PSEI.PS',['3y','2y']);ok(!b.error&&b.calls.map(x=>x[1]).join(',')==='3y,2y,1y','Philippines falls back 3y -> 2y -> 1y on Yahoo only');
 let c=await helperCase('^GSPC',['3y']);ok(!!c.error&&c.calls.length===1&&c.calls[0][1]==='3y','non-target symbol receives no fallback behavior');
 const build=extractFunction(src,'buildCountries')||'';
 ok(build.includes("cfg.code==='CN'||cfg.code==='PH'")&&build.includes('yahooPrimaryHistoryV68(cfg.symbol)'),'buildCountries targets recovery only to CN/PH');
 ok(build.includes("else raw[cfg.code]=await yahoo(cfg.symbol,'3y')"),'all other primary markets retain existing 3y Yahoo path');
 ok(src.includes("symbol:'000300.SS'")&&src.includes("symbol:'PSEI.PS'"),'China/PSEi tickers unchanged');
 ok(src.includes("fx:'CNY=X'")&&src.includes("fx:'PHP=X'"),'CN/PH FX tickers unchanged');
 console.log(`RESULT - ${pass}/${pass+fail} hotfix checks ${fail?'FAIL':'PASS'}`);if(fail)process.exit(1);
})();
