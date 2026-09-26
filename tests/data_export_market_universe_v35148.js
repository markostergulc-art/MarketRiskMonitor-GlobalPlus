const fs=require('fs'),crypto=require('crypto'),vm=require('vm');
const src=fs.readFileSync('app.js','utf8');
const base=fs.readFileSync('/mnt/data/mrm_v35147/baseline/app.js','utf8');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
let p=0,f=0; function ok(c,m){if(c){console.log('PASS - '+m);p++}else{console.error('FAIL - '+m);f++}}
function extract(text,name){let a=text.indexOf('function '+name+'(');if(a<0)a=text.indexOf('async function '+name+'(');if(a<0)return'';let par=text.indexOf('(',a),pd=0,q=null,e=false,b=-1;for(let i=par;i<text.length;i++){let c=text[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='(')pd++;else if(c===')'&&--pd===0){b=text.indexOf('{',i+1);break}}if(b<0)return'';let d=0;q=null;e=false;for(let i=b;i<text.length;i++){let c=text[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(a,i+1)}return''}
function hash(x){return crypto.createHash('sha256').update(x).digest('hex')}
const mc=(src.match(/const MARKET_CONFIG=\[(.*?)\n\];\n\/\/ v3\.5\.1_31/s)||[])[1]||'';
ok((mc.match(/\{code:'/g)||[]).length===36,'core market universe is 36 after legacy market removal');
ok((mc.match(/code:'HR'/g)||[]).length===1,'Croatia exists exactly once in core market config');
ok(!/code:'BA'|Bosnia|SASX/.test(mc),'removed market has no active core configuration');
ok(/function activeMarketConfig\(\)\{return MARKET_CONFIG\.slice\(\)\}/.test(src),'Croatia is no longer language-gated; full configured universe is always active');
ok(!/\bBA:\[\{s:"BHTSR"/.test(src),'removed market company-leader runtime entry is absent');
ok(!/code==='BA'|bosnia_limited/.test(src),'no special runtime LIMITED branch remains for removed market');
ok(!/Bosnia|Bosna|SASX/.test(src),'no current app.js user-facing/runtime reference to removed market remains');
ok(extract(src,'rehydrateCached').includes('wanted=activeMarketConfig()')&&extract(src,'rehydrateCached').includes('st.countries=wanted.map'),'cached snapshots are rebuilt from the current active universe and cannot resurrect removed market');
ok(extract(src,'fiscalUniverseV43').includes('[...MARKET_CONFIG,...EXTENDED_COUNTRY_CONFIG]'),'fiscal user-facing universe follows current market configuration');
ok(html.includes('downloadDataBtn')&&html.includes('downloadMethodologyBtn')&&html.includes('exportStatusV47'),'Settings contains data and methodology export controls');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.48',EXPORT_V47_CODE=81"),'export package is versioned v3.5.1.48 / 81');
const ex=extract(src,'exportDataV47'), meth=extract(src,'exportMethodologyV47');
ok(ex&&!/fetch\(|refreshAll\(|ensure[A-Z]/.test(ex),'current data export itself triggers no fetch/refresh/ensure call');
ok(meth&&!/fetch\(|refreshAll\(|ensure[A-Z]/.test(meth),'methodology export itself triggers no fetch/refresh/ensure call');
ok(src.includes("'data_snapshot.json'")&&src.includes("'markets.csv'")&&src.includes("'fiscal.csv'")&&src.includes("'metadata.json'")&&src.includes("'README.txt'"),'audit ZIP contains required normalized files');
ok(src.includes('EXPORT_SECRET_KEY_V47')&&src.includes('sanitizeExportV47'),'recursive secret sanitizer is present');
ok(src.includes('api[_-]?key')&&src.includes('authorization')&&src.includes('password')&&src.includes('access[_-]?token'),'credential-like export fields are denylisted');
ok(src.includes('function methodologyMarkdownV47')&&src.includes('${JSON.stringify(GLOBAL_WEIGHTS)}')&&src.includes('${JSON.stringify(INFLATION_WEIGHTS)}')&&src.includes('${JSON.stringify(EQUITY_INTERNAL_WEIGHTS)}'),'methodology is generated from runtime model constants where available');
ok(src.includes('fiscalScoreRowsV43()')&&src.includes('companyCoreRiskParts()')&&src.includes('dividendSafety()'),'methodology includes source-function traceability');
ok(/versionCode\s+81/.test(fs.readFileSync('app/build.gradle','utf8'))&&/versionName\s+'3\.5\.1\.48'/.test(fs.readFileSync('app/build.gradle','utf8')),'release metadata is v3.5.1.48 / versionCode 81');
ok(html.includes('v3.5.1_48'),'visible UI version is v3.5.1_48');
// Pure helper runtime checks.
const ctx={Blob,TextEncoder,console}; vm.createContext(ctx);
let helperChunk=src.slice(src.indexOf('const EXPORT_SECRET_KEY_V47='),src.indexOf('function downloadBlobV47('));
vm.runInContext(helperChunk.replace("const EXPORT_SECRET_KEY_V47","var EXPORT_SECRET_KEY_V47"),ctx);
let dirty={apiKey:'secret',Password:'x',token:'y',safe:1,nested:{authorization:'z',value:2}};let clean=ctx.sanitizeExportV47(dirty);ok(clean.safe===1&&clean.nested.value===2&&!('apiKey'in clean)&&!('Password'in clean)&&!('token'in clean)&&!('authorization'in clean.nested),'sanitizer removes secrets case-insensitively and preserves audit values');
let csv=ctx.csvV47([{a:'x,y',b:'\"quote\"',c:3}],['a','b','c']);ok(csv.includes('\"x,y\"')&&csv.includes('\"\"quote\"\"')&&csv.includes(',3'),'CSV exporter quotes tabular values correctly');
(async()=>{let z=ctx.zipStoreV47([{name:'a.txt',data:'alpha'},{name:'b.json',data:'{\"ok\":true}'}]);let buf=Buffer.from(await z.arrayBuffer());fs.writeFileSync('/mnt/data/mrm_v35148/test_export_v48.zip',buf);ok(buf.readUInt32LE(0)===0x04034b50&&buf.includes(Buffer.from('a.txt')),'ZIP writer produces standard ZIP local headers and filenames');
// Protected methodology/loading/graph functions remain byte-identical. Universe/render-specific functions are intentionally excluded.
const protectedFns=['globalRiskModel','globalContagion','marketMetrics','trendRisk','corrMatrix','correlationRegimeFromStats','correlationRegimeDiagnostic','buildMacroCycle','sp500HiddenWeakness','companyCoreRiskParts','companyContextRisk','commodityShockRisk','agsiApiJsonV33','parseAgsiPayloadV33','renderThinProgressV38','parseAgsiFacilityListingV37','buildAgsiFacilitiesV37','fiscalBandV43','fiscalScoreRowsV43','fiscalFreshnessV44','fiscalPickReferenceV44','loadPriorityForV44','pumpLoadSchedulerV44','queueLoadV44','scheduleDeferredV44','scheduleAroundPageV44','refreshActiveV44','updateLoadStatusV44','sparklineSvg','marketCardSparkPeriodV46'];
for(const n of protectedFns){let a=extract(src,n),b=extract(base,n);ok(a&&b&&hash(a)===hash(b),n+' byte-identical to v46')}
let st=html.indexOf("<script>'use strict';"),en=html.indexOf('</script>',st),embedded=html.slice(st+'<script>'.length,en);ok(embedded===src.trimEnd(),'embedded app.js is byte-identical to canonical app.js');
console.log(`RESULT - ${p}/${p+f} v3.5.1.48 export/universe checks PASS`);if(f)process.exit(1)})().catch(e=>{console.error(e);process.exit(1)});
