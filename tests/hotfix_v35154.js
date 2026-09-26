'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35153_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
ok(/versionCode\s+87\b/.test(gradle),'versionCode 87');
ok(/versionName\s+['"]3\.5\.1\.54['"]/.test(gradle),'versionName 3.5.1.54');
ok(html.includes('v3.5.1_54'),'visible header v3.5.1_54');
ok(/VERSION_NAME="3\.5\.1\.54"/.test(release)&&/VERSION_CODE="87"/.test(release),'release metadata v3.5.1.54 / 87');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded app.js byte-identical');
ok(html.includes('id="topStatusStage" class="top-status-stage"'),'fixed top status stage present');
ok(/\.top-status-stage\{[^}]*height:112px/.test(html),'desktop status stage reserves fixed height');
ok(html.includes('.top-status-stage>.refresh-status,.top-status-stage>.deferred-status{position:absolute!important'),'status cards overlay instead of stacking');
ok(src.includes("const STATUS_STAGE_IDS_V54=['refreshProgress','deferredStatus','loadPriorityStatus']"),'single status-slot controller present');
ok(src.includes("statusStageReconcileV54()"),'status stage reconciliation wired');
ok(src.includes("refreshProgressState.active=false;renderRefreshProgress()"),'completed refresh hands slot to deferred/background loader without collapsing');
ok(src.includes("safeRenderModuleV54")&&extractFunction(src,'renderAll').includes("failed.push(name)"),'renderer failure isolation enabled');
ok(src.includes('unavailableGlobalModelV54')&&src.includes('LIMITED DATA instead of an endless Loading state'),'no-snapshot refresh failure renders deterministic LIMITED state');
ok(extractFunction(base,'globalRiskModel')===extractFunction(src,'globalRiskModel'),'Phase 5 GLOBAL Risk math unchanged',sha(extractFunction(base,'globalRiskModel'))+' / '+sha(extractFunction(src,'globalRiskModel')));
for(const n of ['factorRecordV53','globalFactorArchitectureV53','countryCoverageV50','confidenceCompositeV51','earlyWarningLayersV52'])ok(extractFunction(base,n)===extractFunction(src,n),'methodology unchanged: '+n);
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'no additional raw fetch call sites');
ok(src.includes('transientFetchErrorV54')&&src.includes("attempts=(forceFreshRequests||force)?2:1"),'transient forced refresh retry enabled');
ok(src.includes('publicreportinghub.cftc.gov/resource/72hh-3qpy.json')&&src.includes('publicreporting.cftc.gov/resource/72hh-3qpy.json')&&src.includes('f_disagg.txt'),'CFTC official fallback chain retained/expanded');
ok(java.includes('publicreportinghub.cftc.gov'),'native allowlist includes current CFTC hub');
ok(java.includes('if (status >= 200 && status < 300) dbExecutor.execute'),'native cache is written only for successful upstream responses');
ok(java.includes('cachedResponseV54')&&java.includes('X-MRM-Native-Cache')&&java.includes('X-MRM-Cache-Age-Ms'),'native stale-cache fallback carries provenance metadata');
ok(java.includes('setConnectTimeout(15000)')&&java.includes('setReadTimeout(25000)'),'native provider timeouts hardened');
ok(java.includes('MarketRiskMonitor/3.5.1.54'),'native user-agent version updated');
ok(!/api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{12,}/i.test(src+java),'no obvious embedded API secret');
console.log(`RESULT - ${p}/${p+f} v3.5.1.54 hotfix checks ${f?'FAIL':'PASS'}`);if(f)process.exit(1);
