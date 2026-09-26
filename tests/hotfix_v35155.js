'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base54=fs.readFileSync(path.join(root,'app_v35154_baseline.js'),'utf8');
const good49=fs.readFileSync(path.join(root,'app_v35149_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)i=text.indexOf('async function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
ok(/versionCode\s+88\b/.test(gradle),'versionCode 88');
ok(/versionName\s+['"]3\.5\.1\.55['"]/.test(gradle),'versionName 3.5.1.55');
ok(html.includes('v3.5.1_55'),'visible header v3.5.1_55');
ok(/VERSION_NAME="3\.5\.1\.55"/.test(release)&&/VERSION_CODE="88"/.test(release),'release metadata v3.5.1.55 / 88');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.55',EXPORT_V47_CODE=88"),'export metadata v3.5.1.55 / 88');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded app.js byte-identical');

// Root-cause regression: v54 called hiddenRiskAnomaly but its definition had been lost.
ok(!extractFunction(base54,'hiddenRiskAnomaly'),'v54 baseline reproduces missing hiddenRiskAnomaly definition');
ok(!!extractFunction(src,'hiddenRiskAnomaly'),'hiddenRiskAnomaly restored');
ok(!!extractFunction(src,'anomalyFamily'),'anomalyFamily dependency restored');
ok(extractFunction(src,'hiddenRiskAnomaly')===extractFunction(good49,'hiddenRiskAnomaly'),'restored hidden-risk implementation is byte-identical to last known-good baseline',sha(extractFunction(src,'hiddenRiskAnomaly'))+' / '+sha(extractFunction(good49,'hiddenRiskAnomaly')));
ok(extractFunction(src,'anomalyFamily')===extractFunction(good49,'anomalyFamily'),'restored anomaly-family mapping is byte-identical to last known-good baseline');
const refresh=extractFunction(src,'refreshAll')||'';
ok(refresh.includes("safeDiagnosticV55('Hidden Risk / Anomaly Detector',()=>hiddenRiskAnomaly"),'optional hidden-risk diagnostic cannot abort refresh');
ok(src.includes("function safeDiagnosticV55(name,fn,fallback=null){try{return fn()}catch(e)"),'diagnostic failure guard present');

// Mobile GLOBAL card layout regression.
ok(html.includes('id="globalConfidenceMeta" class="global-confidence-meta"'),'separate confidence/coverage metadata slot present');
ok(html.includes('.global-regime{font-size:18px!important'),'GLOBAL regime has compact heading style');
ok(html.includes('.global-confidence-meta{font-size:10.5px'),'confidence/coverage rendered as secondary metadata');
const over=extractFunction(src,'renderOverview')||'';
ok(over.includes("$('globalRegime').textContent=t('regime')+': '+b.regime;"),'GLOBAL H2 contains regime only');
ok(over.includes("let globalMeta=$('globalConfidenceMeta')"),'GLOBAL confidence/coverage written to separate element');
ok(!over.includes("b.regime+' · '+L('Pouzdanost','Confidence')"),'old giant H2 content removed');

// Fixed refresh stage from v54 remains intact.
ok(html.includes('id="topStatusStage" class="top-status-stage"'),'fixed top status stage retained');
ok(/\.top-status-stage\{[^}]*height:112px/.test(html),'desktop status slot height retained');
ok(html.includes('.top-status-stage>.refresh-status,.top-status-stage>.deferred-status{position:absolute!important'),'status cards continue to overlay, not stack');

// Methodology must not change in this corrective hotfix.
for(const n of ['globalRiskModel','factorRecordV53','globalFactorArchitectureV53','countryCoverageV50','confidenceCompositeV51','earlyWarningLayersV52']){
  ok(extractFunction(base54,n)===extractFunction(src,n),'methodology unchanged: '+n,sha(extractFunction(base54,n))+' / '+sha(extractFunction(src,n)));
}
ok((src.match(/\bfetch\(/g)||[]).length===(base54.match(/\bfetch\(/g)||[]).length,'no additional raw fetch call sites');
ok(java.includes('MarketRiskMonitor/3.5.1.55'),'native source user-agent version updated');
ok(!/api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{12,}/i.test(src+java),'no obvious embedded API secret');

// Execute restored diagnostic with minimal deterministic fixtures: it must return, not throw.
try{
  const anomalyFamily=eval('('+extractFunction(src,'anomalyFamily')+')');
  const clamp=x=>Math.max(0,Math.min(100,x));
  const avg=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};
  const riskBand=x=>({label:Number.isFinite(x)?(x>=75?'RED':x>=60?'DARK ORANGE':x>=45?'ORANGE':'GREEN'):'N/A'});
  const currentLang='en';
  const hiddenRiskAnomaly=eval('('+extractFunction(src,'hiddenRiskAnomaly')+')');
  const countries=[{code:'US',risk:42,subscores:{market:30}},{code:'DE',risk:50,subscores:{market:35}},{code:'HR',risk:40,subscores:{market:32}}];
  const early=[{name:'HY Credit',trend:'credit',score:68},{name:'VIX',trend:'volatility',score:62},{name:'Breadth',trend:'breadth',score:64},{name:'MOVE',trend:'rates',score:58}];
  const out=hiddenRiskAnomaly(countries,early,null,{average:.42});
  ok(out&&out.name==='Hidden Risk / Anomaly Detector'&&Number.isFinite(out.score),'restored hidden-risk diagnostic executes on deterministic fixture');
}catch(e){ok(false,'restored hidden-risk diagnostic executes on deterministic fixture',String(e&&e.stack||e))}

console.log(`RESULT - ${p}/${p+f} v3.5.1.55 corrective hotfix checks ${f?'FAIL':'PASS'}`);if(f)process.exit(1);
