'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35163_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0; function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function sha(x){return crypto.createHash('sha256').update(x||'').digest('hex').slice(0,12)}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)i=text.indexOf('async function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function extractConst(text,name){let i=text.indexOf('const '+name+'=');if(i<0)return null;let d=0,sq=false,dq=false,tq=false,esc=false;for(let j=i;j<text.length;j++){let c=text[j];if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{'||c==='['||c==='(')d++;if(c==='}'||c===']'||c===')')d--;if(c===';'&&d===0)return text.slice(i,j+1)}return null}

ok(/versionCode\s+100\b/.test(gradle),'versionCode 97');
ok(/versionName\s+['"]3\.5\.1\.67['"]/.test(gradle),'versionName 3.5.1.67');
ok(html.includes('v3.5.1_67'),'visible header v3.5.1_67');
ok(/VERSION_NAME="3\.5\.1\.67"/.test(release)&&/VERSION_CODE="100"/.test(release),'release metadata v3.5.1.67 / 97');
ok(java.includes('MarketRiskMonitor/3.5.1.67'),'native user-agent v3.5.1.67');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.67',EXPORT_V47_CODE=100"),'export metadata v3.5.1.67 / 97');
const marker="<script>'use strict';",si=html.indexOf(marker),se=html.lastIndexOf('</script>'),embedded=si>=0&&se>si?html.slice(si+8,se):'';
ok(embedded===src,'embedded WebView JavaScript byte-identical to app.js');
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'Phase 13 introduces no raw fetch call sites');

// Core score mathematics and raw band thresholds must remain byte-identical.
for(const n of ['riskBand','weightedScore','globalRiskModel','globalFactorArchitectureV53','globalContagion','buildMacroCycle','fiscalScoreRowsV43','commodityShockRisk','aggregateEquityInternalsV57','lagAwareCorrMatrixV58']){
 const a=extractFunction(src,n),b=extractFunction(base,n); ok(!!a&&a===b,'protected numeric/model function unchanged: '+n,sha(a)+' / '+sha(b));
}

for(const n of ['bandIndexV63','bandFromLabelV63','scoreFlappingAnalysisV63','stabilizedBandV63','statusPillFromBandV63','statusBandColorV63'])ok(!!extractFunction(src,n),'Phase-13 helper present: '+n);
ok(!!extractConst(src,'SCORE_HYSTERESIS_METHOD_V63'),'Phase-13 methodology constant present');
ok(src.includes("SCORE_HYSTERESIS_METHOD_V63='HYSTERESIS_V1_RUNTIME_FLAP_GATED'"),'hysteresis explicitly runtime-flap-gated');
ok(src.includes('HYSTERESIS_BOUNDARIES_V63=[25,45,60,75]'),'raw band boundaries explicitly documented');
ok(src.includes('HYSTERESIS_EXIT_GAP_V63=3'),'3-point de-escalation buffer documented');
ok(src.includes('HYSTERESIS_FLAP_ZONE_V63=5'),'near-boundary flap zone documented');
ok(src.includes('HYSTERESIS_LOOKBACK_V63=20'),'20-observation lookback documented');
ok(src.includes('HYSTERESIS_MIN_CROSSINGS_V63=3'),'minimum three near-boundary crossings required');

// Pure-function validation in isolation.
const ctx={Math,Number,String,Object,Array}; vm.createContext(ctx);
vm.runInContext(extractFunction(src,'riskBand'),ctx);
const constLine=src.match(/const SCORE_HYSTERESIS_METHOD_V63=.*?;/)[0]; vm.runInContext(constLine,ctx);
for(const n of ['bandIndexV63','bandFromLabelV63','scoreFlappingAnalysisV63','stabilizedBandV63'])vm.runInContext(extractFunction(src,n),ctx);
function ev(code){return vm.runInContext(code,ctx)}

ok(ev("riskBand(24.999).label")==='GREEN'&&ev("riskBand(25).label")==='LIGHT GREEN','raw 25 threshold unchanged');
ok(ev("riskBand(44.999).label")==='LIGHT GREEN'&&ev("riskBand(45).label")==='ORANGE','raw 45 threshold unchanged');
ok(ev("riskBand(59.999).label")==='ORANGE'&&ev("riskBand(60).label")==='DARK ORANGE','raw 60 threshold unchanged');
ok(ev("riskBand(74.999).label")==='DARK ORANGE'&&ev("riskBand(75).label")==='RED','raw 75 threshold unchanged');

let fl=ev('scoreFlappingAnalysisV63([58,61,59,62,58,61])');
ok(fl.flappingDetected===true,'repeated near-boundary 60 crossings detected as flapping');
ok(fl.crossingsByBoundary[60]>=3,'60 boundary records at least three crossings');
let calm=ev('scoreFlappingAnalysisV63([35,38,41,44,47,50,53])');
ok(calm.flappingDetected===false,'single directional threshold pass is not flapping');
let big=ev('scoreFlappingAnalysisV63([40,80,40,80,40,80])');
ok(big.flappingDetected===false,'large genuine regime jumps are not misclassified as boundary chatter');
let wrongBoundary=ev('scoreFlappingAnalysisV63([43,46,44,47,43,46])');
ok(wrongBoundary.flappingDetected===true&&wrongBoundary.crossingsByBoundary[45]>=3,'45 boundary can independently detect flapping');

let worsen=ev("stabilizedBandV63(61,'ORANGE',[58,61,59,62,58,61])");
ok(worsen.band.label==='DARK ORANGE'&&!worsen.hysteresisApplied,'worsening escalation at 60 is immediate even during flapping');
ok(worsen.reason==='WORSENING_ESCALATES_IMMEDIATELY','worsening transition reason explicit');
let redEntry=ev("stabilizedBandV63(75,'DARK ORANGE',[73,76,74,77,73,75])");
ok(redEntry.band.label==='RED'&&!redEntry.hysteresisApplied,'legitimate RED entry at 75 is never delayed');
let hold=ev("stabilizedBandV63(74,'RED',[73,76,74,77,73,76,74])");
ok(hold.band.label==='RED'&&hold.rawBand==='DARK ORANGE'&&hold.hysteresisApplied,'RED de-escalation held inside exit buffer after observed flapping');
ok(hold.exitThreshold===72,'RED exit threshold is transparent at 72 after 3-point buffer');
let clear=ev("stabilizedBandV63(72,'RED',[73,76,74,77,73,76,72])");
ok(clear.band.label==='DARK ORANGE'&&!clear.hysteresisApplied,'RED exits once score clears the 72 buffer');
let noflap=ev("stabilizedBandV63(74,'RED',[78,77,76,75,74])");
ok(noflap.band.label==='DARK ORANGE'&&!noflap.hysteresisApplied,'no history of flapping means no hysteresis hold');
let deep=ev("stabilizedBandV63(50,'RED',[73,76,74,77,73,76,50])");
ok(deep.band.label==='ORANGE'&&!deep.hysteresisApplied,'large risk improvement is not artificially delayed');
let missing=ev("stabilizedBandV63(null,'RED',[73,76,74,77])");
ok(missing.band.label==='N/A','missing score remains N/A and is never stabilized into a false risk status');

// Integration: numeric score + status metadata are stored independently.
const fin=extractFunction(src,'finalizeCountries'),hist=extractFunction(src,'historySave'),evt=extractFunction(src,'eventHistory'),refresh=extractFunction(src,'refreshAll');
ok(fin.includes('c.risk=weightedScore(c.subscores)'),'country numeric score calculation retained before status stabilization');
ok(fin.includes('stabilizedBandV63(c.risk,previousBand,[...histValues,c.risk])'),'country status uses actual local score history plus current observation');
ok(fin.includes('c.rawBandV63=rawBand')&&fin.includes('c.previousBandV63=previousBand'),'country stores raw and previous band separately');
ok(fin.includes('hysteresisApplied:stab.hysteresisApplied'),'country stores whether hysteresis was actually applied');
ok(refresh.includes('globalScore=model.score'),'GLOBAL numeric score remains direct model score');
ok(refresh.includes('stabilizedBandV63(globalScore,previousGlobalBandV63'),'GLOBAL display band stabilized separately from numeric score');
ok(refresh.includes('historySave(model.eligible?globalScore:null')&&refresh.includes('global.hysteresisV63'),'history save receives raw numeric GLOBAL score plus separate band metadata');
ok(hist.includes('global:globalScore')&&hist.includes('globalBand')&&hist.includes('countryBands'),'history stores numeric score, global band metadata and country band metadata');
ok(hist.includes('previousBand')&&hist.includes('hysteresisApplied')&&hist.includes('exitThreshold'),'history persists previous/current transition diagnostics');
ok(evt.includes('globalBand.currentBand')&&evt.includes('countryBands'),'event history reports stabilized displayed transitions rather than raw chatter');

// UI / export consistency while preserving score number.
ok(src.includes('statusPillFromBandV63(c.band,c.risk)'),'country cards/details use stabilized display status');
ok(src.includes("statusBandColorV63(g.band,g.score)"),'GLOBAL gauge color follows stabilized display status');
ok(src.includes('rawRiskBand:')&&src.includes('previousRiskBand:')&&src.includes('hysteresisReason:'),'audit export includes raw/current/previous band diagnostics');
ok(src.includes('scoreHysteresisV63:{methodologyVersion:SCORE_HYSTERESIS_METHOD_V63'),'audit metadata includes Phase-13 method parameters');
ok(src.includes('numericScoreChanged:false'),'audit metadata explicitly states numeric score is unchanged');
ok(src.includes('Large genuine regime moves are therefore not counted as threshold chatter'),'methodology documents anti-false-flap guard');
ok(src.includes('Worsening transitions always occur immediately at the original threshold'),'methodology documents no crisis-entry delay');

// Synthetic comparison: raw band chatter vs flap-gated hysteresis.
function simulate(seq,initial='ORANGE'){
 let prev=initial,history=[],rawChanges=0,stableChanges=0,rawPrev=ctx.riskBand(seq[0]).label;
 for(const score of seq){let raw=ctx.riskBand(score).label;if(raw!==rawPrev)rawChanges++;rawPrev=raw;let r=ctx.stabilizedBandV63(score,prev,[...history,score]);if(r.band.label!==prev)stableChanges++;prev=r.band.label;history.push(score)}
 return{rawChanges,stableChanges,last:prev};
}
let sim=simulate([59,61,59,62,59,61,59,61,58,61,57,61,56]);
ok(sim.rawChanges>=8,'fixture contains repeated raw band chatter');
ok(sim.stableChanges<sim.rawChanges,'flap-gated hysteresis reduces status transitions after evidence accumulates',JSON.stringify(sim));
let crisis=simulate([50,55,59,60,68,74,75,82],'ORANGE');
ok(crisis.last==='RED','rapid crisis fixture still reaches RED immediately');

console.log(`RESULT - ${p}/${p+f} Phase 13 compatibility under Phase 14 ${f?'FAIL':'PASS'}`); if(f)process.exit(1);
