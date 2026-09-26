'use strict';
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
const base=fs.readFileSync(path.join(root,'app_v35166_baseline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const gradle=fs.readFileSync(path.join(root,'app/build.gradle'),'utf8');
const release=fs.readFileSync(path.join(root,'build_release.sh'),'utf8');
const java=fs.readFileSync(path.join(root,'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function extractFunction(text,name){let starts=['function '+name+'(','async function '+name+'('],i=-1;for(const st of starts){i=text.indexOf(st);if(i>=0)break}if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
function section(text,a,b){let i=text.indexOf(a),j=b?text.indexOf(b,i+1):-1;return i<0?'':text.slice(i,j<0?text.length:j)}
// Release identity and WebView parity.
ok(/versionCode\s+100\b/.test(gradle),'versionCode 100');
ok(/versionName\s+['"]3\.5\.1\.67['"]/.test(gradle),'versionName 3.5.1.67');
ok(html.includes('v3.5.1_67'),'visible header v3.5.1_67');
ok(/VERSION_NAME="3\.5\.1\.67"/.test(release)&&/VERSION_CODE="100"/.test(release),'release metadata 3.5.1.67 / 100');
ok(release.includes('versionCode[[:space:]]\\+100'),'release self-check expects versionCode 100');
ok(java.includes('MarketRiskMonitor/3.5.1.67'),'native UA v3.5.1.67');
ok(src.includes("const EXPORT_V47_VERSION='3.5.1.67',EXPORT_V47_CODE=100"),'export metadata 3.5.1.67 / 100');
let si=html.indexOf('<script>'),se=html.indexOf('</script>',si+8);ok(si>=0&&html.slice(si+8,se)===src,'embedded WebView JS byte-identical to app.js');
ok((src.match(/\bfetch\(/g)||[]).length===(base.match(/\bfetch\(/g)||[]).length,'Phase17 adds no raw fetch callsite');
ok((src.match(/\bfetch\(/g)||[]).length===6,'raw fetch count remains 6');
// Phase17 is audit/export only: protect production and Phase16 presentation logic byte-for-byte.
for(const n of ['riskBand','weightedScore','globalRiskModel','globalFactorArchitectureV53','globalContagion','buildMacroCycle','fiscalScoreRowsV43','commodityShockRisk','aggregateEquityInternalsV57','lagAwareCorrMatrixV58','stabilizedBandV63','currentMacroScoreV65','currentGlobalConditionV65','leadingWarningLayerV65','fiscalGlobalStructuralAggregateV65','structuralVulnerabilityLayerV65','contagionAmplifierV65','globalRiskModelV65','safeGlobalRiskModelV65','globalUiLabelV66','globalCurrentDriverRowsV66','globalExplanationDataV66','globalLayerRowsV66'])ok(extractFunction(src,n)===extractFunction(base,n),'protected function unchanged: '+n);
// New Methodology V2 functions and constants.
ok(src.includes("const METHODOLOGY_EXPORT_V2_SCHEMA_V67='METHODOLOGY_EXPORT_V2'"),'Methodology V2 schema id');
ok(src.includes("const METHODOLOGY_EXPORT_V2_METHOD_V67='METHOD-V2-1'"),'Methodology V2 method id');
for(const n of ['methodUniqueV67','methodLatestDateV67','methodAvgV67','earlyWarningClassificationV67','correlationMethodologyV67','phase5DependencyV67','globalDependencyTreeV67','methodologyV2ModelsV67','methodologyV2SnapshotV67','methodologyV2MarkdownV67'])ok(!!extractFunction(src,n),'Phase17 helper present: '+n);ok(src.includes('function methodologyV2ModelRecordV67('),'Phase17 helper present: methodologyV2ModelRecordV67');ok(src.includes('function methodMdValueV67('),'Phase17 helper present: methodMdValueV67');
const rec=(src.match(/^function methodologyV2ModelRecordV67.*$/m)||[''])[0];
for(const field of ['purpose','rawIndicators','provider','observationDate','frequency','freshnessMethod','transformation','scoreDirection','thresholdsWindow','weights','missingDataTreatment','eligibilityGates','coverage','confidence','aggregation'])ok(rec.includes(field+':'),'required model field: '+field);
ok(rec.includes('sourceFunctions'),'source-function audit trail included');
const models=extractFunction(src,'methodologyV2ModelsV67');
for(const id of ['country_market_risk','global_equity_internals','us_macro_cycle','global_macro_cycle','early_warning_layers','fiscal_structural','fiscal_market_pressure','commodity_price_risk','commodity_physical_risk','correlation_descriptive','correlation_systemic','global_risk_ga2','company_risk','etf_risk','dividend_safety','score_hysteresis','historical_validation','source_resilience'])ok(models.includes("id:'"+id+"'"),'model inventory includes '+id);
ok((models.match(/methodologyV2ModelRecordV67\(\{id:/g)||[]).length>=18,'at least 18 explicit model records');
ok(models.includes("usMacro=macro.filter(x=>x.family!=='regional_macro')"),'U.S. macro export excludes regional-global rows');
ok(models.includes("globalMacroRows=macro.filter(x=>x.family==='regional_macro')"),'Global Macro export uses regional macro rows');
// Full GA2 dependency tree.
const tree=extractFunction(src,'globalDependencyTreeV67');
for(const token of ['currentGlobalCondition','leadingWarning','structuralVulnerability','contagionAmplifier','phase5FactorTree','legacyComparison'])ok(tree.includes(token),'GLOBAL dependency tree includes '+token);
ok(tree.includes('GLOBAL_CURRENT_WEIGHTS_V65')&&tree.includes('GLOBAL_WARNING_WEIGHTS_V65')&&tree.includes('GLOBAL_STRUCTURAL_WEIGHTS_V65'),'dependency tree exposes production weights');
ok(tree.includes('GLOBAL_WARNING_MAX_ADD_V65')&&tree.includes('GLOBAL_STRUCTURAL_MAX_ADD_V65')&&tree.includes('GLOBAL_CONTAGION_MAX_MULTIPLIER_V65'),'dependency tree exposes GA2 caps');
ok(tree.includes('low correlation never subtracts'),'contagion dependency rule states non-cancellation');
// Early Warning normalized classifications.
const ew=extractFunction(src,'earlyWarningClassificationV67');
for(const [internal,out] of [['LEADING','leading'],['EARLY_CONFIRMATION','confirmation'],['LATE_CONFIRMATION','confirmation'],['CURRENT_STRESS','current stress'],['STRUCTURAL','structural']])ok(ew.includes(internal+":'"+out+"'"),'Early Warning class mapping '+internal+' -> '+out);
ok(ew.includes('internalClass:r.signalClass'),'internal warning class preserved');
// Correlation methodology exact disclosures.
const cm=extractFunction(src,'correlationMethodologyV67');
ok(cm.includes('ln(P_t / P_{t-1})'),'correlation export states log-return calculation');
ok(cm.includes('same-calendar-date'),'correlation export states descriptive same-date alignment');
ok(cm.includes('ASIA_PACIFIC ↔ AMERICAS'),'correlation export states Asia/Americas timezone rule');
ok(cm.includes('strictly before the Asian observation date'),'correlation export forbids look-ahead by wording');
ok(cm.includes('diagnosticDays:[20,60,120]'),'correlation export states diagnostic 20/60/120 windows');
ok(cm.includes('systemicProductionDays:CORRELATION_SYSTEMIC_WINDOW_V58'),'correlation export links systemic production window');
ok(cm.includes('minimumPairsForPearson:10'),'correlation export states minimum Pearson pairs');
// Standalone and Current Data exports.
const snap=extractFunction(src,'methodologyV2SnapshotV67'),md=extractFunction(src,'methodologyV2MarkdownV67'),exp=extractFunction(src,'exportMethodologyV47'),data=extractFunction(src,'exportDataV47'),audit=extractFunction(src,'auditSnapshotV47');
ok(snap.includes('models,globalRiskDependencyTree:globalDependencyTreeV67()'),'snapshot includes models + dependency tree');
ok(snap.includes('earlyWarningSignalClassification:earlyWarningClassificationV67()'),'snapshot includes Early Warning classification');
ok(snap.includes('correlationMethodology:correlationMethodologyV67()'),'snapshot includes correlation methodology');
ok(snap.includes('missingNeverZero:true')&&snap.includes('noNetworkDuringExport:true'),'snapshot declares missing/no-network data-quality rules');
ok(md.includes('## Model inventory'),'markdown has model inventory');
ok(md.includes('## GLOBAL Risk — full dependency tree'),'markdown has GLOBAL dependency tree');
ok(md.includes('## Early Warning — signal classification'),'markdown has Early Warning classification');
ok(md.includes('## Correlation methodology'),'markdown has correlation methodology');
for(const label of ['Purpose','Raw indicators','Provider','Observation date','Frequency','Freshness method','Transformation','Score direction','Thresholds / window','Weights','Missing-data treatment','Eligibility gates','Coverage','Confidence','Aggregation'])ok(md.includes('- '+label+':'),'markdown field emitted: '+label);
ok(md.includes('methodologyMarkdownV47()')&&md.includes('methodologyTransformsMarkdownV56()')&&md.includes('historicalValidationMethodologyV64()')&&md.includes('globalArchitectureMethodologyV65()'),'detailed prior methodology/transform appendices preserved');
ok(exp.includes('Methodology_V2_v${EXPORT_V47_VERSION}'),'standalone Methodology filename identifies V2');
ok(!exp.includes('fetch(')&&!md.includes('fetch(')&&!snap.includes('fetch('),'Methodology export path contains no raw network call');
ok(data.includes("name:'methodology_v2.json'")&&data.includes("name:'methodology_v2.md'"),'Current Data ZIP includes Methodology V2 JSON + Markdown');
ok(audit.includes('methodologyV2:methodologyV2SnapshotV67()'),'audit snapshot embeds Methodology V2');
// Pure helper fixtures.
let recFn=(src.match(/^function methodologyV2ModelRecordV67.*$/m)||[''])[0];let helperCode=extractFunction(src,'methodUniqueV67')+'\n'+extractFunction(src,'methodLatestDateV67')+'\n'+extractFunction(src,'methodAvgV67')+'\n'+recFn+'\nreturn {methodUniqueV67,methodLatestDateV67,methodAvgV67,methodologyV2ModelRecordV67};';
let hp=Function(helperCode)();
ok(JSON.stringify(hp.methodUniqueV67(['B','A','B','']))===JSON.stringify(['A','B']),'unique helper deterministic/sorted');
ok(hp.methodLatestDateV67(['2026-01-01','bad','2026-09-14'])==='2026-09-14','latest observation-date helper');
ok(hp.methodLatestDateV67([])===null,'missing observation date remains null');
ok(hp.methodAvgV67([50,70,null,'bad'])===60,'average helper uses finite Number values consistently');
let rr=hp.methodologyV2ModelRecordV67({id:'x',name:'X'});ok(rr.id==='x'&&rr.observationDate===null&&Array.isArray(rr.rawIndicators),'model record defaults missing evidence to null/empty, not zero risk');
// Early Warning deterministic fixture.
let ewApi=Function("function earlyAuditRowsV47(){return [{signal:'Curve',signalClass:'LEADING',layerRole:'warning',timingMeaning:'forward',provider:'FRED',observationDate:'2026-09-01',frequency:'daily',freshness:'CURRENT',confidence:'HIGH',score:60},{signal:'Credit',signalClass:'CURRENT_STRESS',score:null}]}\n"+ew+'\nreturn earlyWarningClassificationV67;')();
let er=ewApi();ok(er.length===2&&er[0].classification==='leading'&&er[1].classification==='current stress','Early Warning fixture normalized deterministically');ok(er[1].score===null,'missing warning score remains null');
// Correlation deterministic fixture.
let cmApi=Function("const CORRELATION_ALIGNMENT_METHOD_V58='SESSION-LAG-V1',CORRELATION_SESSION_V58={US:'AMERICAS'},CORRELATION_SYSTEMIC_WINDOW_V58=60;let corrWindow=120;"+cm+';return correlationMethodologyV67;')();let cr=cmApi();ok(cr.windows.descriptiveSelectedDays===120&&cr.windows.systemicProductionDays===60,'correlation window fixture');ok(cr.productionUse.includes('lag-aware systemic correlation'),'correlation production use separated from descriptive matrix');
console.log(`RESULT - ${p}/${p+f} Phase 17 Methodology Export V2 checks PASS`);if(f)process.exit(1);
