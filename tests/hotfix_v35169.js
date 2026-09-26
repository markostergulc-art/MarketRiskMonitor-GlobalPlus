'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
let pass=0,fail=0;function ok(c,n){if(c){console.log('PASS - '+n);pass++}else{console.error('FAIL - '+n);fail++}}
function extractFunction(text,name){const re=new RegExp('(?:async\\s+)?function\\s+'+name+'\\s*\\('),m=re.exec(text);if(!m)return null;let i=m.index,b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}

ok(/versionCode\s+102\b/.test(gradle),'versionCode 102');
ok(/versionName\s+['"]3\.5\.1\.69['"]/.test(gradle),'versionName 3.5.1.69');
ok(html.includes('v3.5.1_69'),'visible header v3.5.1_69');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.69',EXPORT_V47_CODE=102"),'export metadata 3.5.1.69 / 102');
ok(release.includes('VERSION_NAME="3.5.1.69"')&&release.includes('VERSION_CODE="102"'),'release metadata 3.5.1.69 / 102');
ok(java.includes('MarketRiskMonitor/3.5.1.69'),'native UA v3.5.1.69');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
ok(scripts.length>=2&&scripts.at(-1)[1]===src,'embedded WebView JS byte-identical to canonical app.js');

const validFn=extractFunction(src,'validPrimaryMarketHistoryV69');
ok(!!validFn&&validFn.includes('series.length>=5'),'CN/PH recovery rejects <5 observations');
ok(src.includes("symbol:'000300.SS'")&&src.includes("symbol:'PSEI.PS'"),'China and Philippines primary symbols unchanged');
ok(src.includes("fx:'CNY=X'")&&src.includes("fx:'PHP=X'"),'CN/PH FX symbols unchanged');
const build=extractFunction(src,'buildCountries')||'';
ok(build.includes("cfg.code==='CN'||cfg.code==='PH'")&&build.includes('yahooPrimaryHistoryV69(cfg.symbol)'),'targeted CN/PH history helper wired only for CN/PH');
ok(build.includes("else raw[cfg.code]=await yahoo(cfg.symbol,'3y')"),'all other primary markets retain existing Yahoo path');
const primary=extractFunction(src,'yahooPrimaryHistoryV69')||'';
ok(primary.includes("['3y','2y','1y']")&&primary.includes('yahooPeriodHistoryV69')&&primary.includes('yahooHistoryPageV69'),'CN/PH recovery chain includes validated range + explicit-period + Yahoo history page');
ok((extractFunction(src,'yahooPeriodHistoryV69')||'').includes('force')||src.includes("fetchWithTimeout(url,'json',16000,false,true)"),'explicit-period recovery bypasses stale cache');
ok((extractFunction(src,'yahooHistoryPageV69')||'').includes('finance.yahoo.com/quote/'),'Yahoo page fallback remains Yahoo / same primary index');
ok(java.includes('"finance.yahoo.com"'),'full-source native proxy allowlists Yahoo history host');

const fred=extractFunction(src,'fred')||'';
ok(fred.includes('alfred.stlouisfed.org/graph/alfredgraph.csv'),'FRED transport has ALFRED current-vintage fallback');
ok(fred.includes('vintage_date=')&&fred.includes('cosd=')&&fred.includes('coed='),'ALFRED fallback preserves bounded observation/vintage dates');
ok(src.includes('let FRED_GRAPH_BLOCKED_V69=false')&&fred.includes('FRED_GRAPH_BLOCKED_V69=true'),'HTTP 403 circuit breaker present');
ok(fred.includes("Number(e&&e.status)===403"),'circuit breaker opens only on HTTP 403');
ok(fred.includes("source:'FRED'")&&fred.includes('fallbackUsed'),'fallback preserves FRED source semantics and marks fallback');
ok(java.includes('h.endsWith(".stlouisfed.org")'),'ALFRED host remains within existing St. Louis Fed allowlist');

const refreshIdx=src.indexOf('architectureVersion:model.architectureVersion,layersV65:model.layersV65');
ok(refreshIdx>=0,'refresh state copies layersV65 from final model');
ok(src.includes('layerCoverage:model.layerCoverage')&&src.includes('layerAvailability:model.layerAvailability'),'refresh state copies layer coverage/availability');
ok(src.includes('layerCoverageWeights:model.layerCoverageWeights')&&src.includes('formulaV65:model.formulaV65'),'refresh state copies final layer weights/formula');
const layerRows=extractFunction(src,'globalLayerRowsV66')||'';
ok(layerRows.includes('currentCondition')&&layerRows.includes('leadingWarning')&&layerRows.includes('structuralVulnerability')&&layerRows.includes('contagionAmplifier'),'Overview still renders exactly the four existing GA2 layers');

ok(fs.existsSync(path.join(root,'signing/MarketRiskMonitor_GlobalPlus_release.p12')),'release PKCS#12 included in source bundle');
ok(fs.existsSync(path.join(root,'signing/keystore.properties')),'keystore.properties included in source bundle');
ok(release.includes('$ROOT/signing/keystore.properties'),'release build defaults to bundled signing configuration');

console.log(`RESULT - ${pass}/${pass+fail} v3.5.1.69 targeted hotfix checks ${fail?'FAIL':'PASS'}`);if(fail)process.exit(1);
