const fs=require('fs'),vm=require('vm');
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const document={readyState:'loading',addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return[]},createElement(){return{style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},querySelectorAll(){return[]}}},head:{appendChild(){}},body:{appendChild(){}}};
const c={console,Date,Math,Number,JSON,String,Promise,Set,Map,Array,Object,WeakSet,localStorage,document,navigator:{userAgent:'node'},window:null,appState:null,corrWindow:60,currentLang:'en'};c.window=c;vm.createContext(c);
vm.runInContext(fs.readFileSync('app/src/main/assets/intelligence_v39.js','utf8'),c);
vm.runInContext(fs.readFileSync('app/src/main/assets/smart_alerts_v39.js','utf8'),c);
let pass=0,fail=0;function ok(name,v){console.log((v?'PASS ':'FAIL ')+name);v?pass++:fail++}
function mkState(score,cur,warn,struct,mult,inputs,band='YELLOW'){
 return {global:{score,band:{label:band},architectureVersion:'GA2-v65',effectiveCoverage:90,confidenceV51:{score:88,components:{agreement:70}},formulaV65:{warningAdjustment:warn,structuralAdjustment:struct,preAmplifier:cur+warn+struct,contagionMultiplier:mult,rule:'test'},layersV65:{currentCondition:{score:cur},leadingWarning:{score:50},structuralVulnerability:{score:50},contagionAmplifier:{score:50}}},early:inputs,countries:[],providers:{},generatedAt:new Date().toISOString()};
}
const in1=[{name:'TEST MARKET',value:100,score:30,unit:'idx',source:'Yahoo Finance',date:'2026-09-25',retrievedAt:'2026-09-25T18:00:00Z',eligibleForCurrentScore:true,freshness:'CURRENT',dataKind:'MARKET'}];
const in2=[{...in1[0],value:110,score:40,date:'2026-09-26',retrievedAt:'2026-09-26T18:00:00Z'}];
let a=c.MRMIntelligenceV39.buildSnapshot(mkState(33,30,2,1,1.0,in1),'test'),b=c.MRMIntelligenceV39.buildSnapshot(mkState(39,32,3,2,1.05,in2),'test');
let d=c.MRMIntelligenceV39.compare(a,b),sum=d.accounting.reduce((n,x)=>n+x.effect,0);
ok('score delta exact',d.scoreDelta===6);
ok('GA2 accounting reconciles displayed delta',Math.abs(sum-d.scoreDelta)<1e-9);
ok('market move classified',d.events.some(x=>x.type==='MARKET_MOVE'&&x.marketMeaning===true));
let ev=c.MRMIntelligenceV39.evidenceFor('EARLY:TEST MARKET',mkState(33,30,2,1,1.0,in1));
ok('evidence preserves provider',ev&&ev.inputs[0].provider==='Yahoo Finance');
ok('evidence preserves observation',ev&&ev.inputs[0].observationDate==='2026-09-25');
ok('evidence separates empirical validation',ev&&ev.reliability.empiricalValidation==='NOT_YET_SUFFICIENT');
// source loss is non-market
let lost=[{...in1[0],value:null,score:null,eligibleForCurrentScore:false,freshness:'STALE',reason:'too old'}],dl=c.MRMIntelligenceV39.compare(a,c.MRMIntelligenceV39.buildSnapshot(mkState(29,29,0,0,1,lost),'test'));
ok('source loss classified',dl.events.some(x=>x.type==='SOURCE_LOSS'));
ok('source loss is non-market',dl.events.filter(x=>x.type==='SOURCE_LOSS').every(x=>x.marketMeaning===false));
// revision same observation date
let rev=[{...in1[0],value:102,score:31}],dr=c.MRMIntelligenceV39.compare(a,c.MRMIntelligenceV39.buildSnapshot(mkState(34,31,2,1,1,rev),'test'));
ok('revision same period classified',dr.events.some(x=>x.type==='REVISION'));
// a newly released observation is still a release even if its numeric value is unchanged
let sameValRelease=[{...in1[0],date:'2026-09-26',retrievedAt:'2026-09-26T18:00:00Z'}],dsame=c.MRMIntelligenceV39.compare(a,c.MRMIntelligenceV39.buildSnapshot(mkState(33,30,2,1,1.0,sameValRelease),'test'));
ok('same-value new observation classified as release/move',dsame.events.some(x=>x.type==='MARKET_MOVE'&&x.unchangedValue===true));
// smart alert invariant: integrity breaks suppress market-risk delta
store.clear();
let lossIntel={snapshot:{...b,calculationId:'losscalc',globalScore:28,coverage:70},change:{...dl,scoreDelta:-5,coverageDelta:-20,afterCalculationId:'losscalc'},daily:null,weekly:null};
let lossAlerts=c.MRMSmartAlertsV39._test.evaluateSystem(lossIntel,mkState(28,28,0,0,1,lost));
ok('source loss emits DATA_HEALTH',lossAlerts.some(x=>x.type==='DATA_HEALTH'&&x.ruleId==='SOURCE_LOSS'));
ok('source loss does not emit MARKET_RISK',!lossAlerts.some(x=>x.type==='MARKET_RISK'));
// recovery remains data-health only
let recChange={comparable:true,scoreDelta:6,coverageDelta:20,events:[{type:'SOURCE_RECOVERY',metricId:'TEST MARKET',marketMeaning:false}]};
let recAlerts=c.MRMSmartAlertsV39._test.evaluateSystem({snapshot:{...b,calculationId:'reccalc',globalScore:39,coverage:90},change:recChange},mkState(39,32,3,2,1.05,in2));
ok('source recovery emits DATA_HEALTH',recAlerts.some(x=>x.ruleId==='SOURCE_RECOVERY'&&x.type==='DATA_HEALTH'));
ok('source recovery not a market shock',!recAlerts.some(x=>x.type==='MARKET_RISK'));
// normal comparable large move can be market alert: populate prior snapshot through public afterCalculation before alert engine call
store.clear();
let s1=mkState(30,30,0,0,1,in1,'YELLOW');c.MRMIntelligenceV39.afterCalculation(s1,{trigger:'test'});
let s2=mkState(36,36,0,0,1,[{...in1[0],value:111,date:'2026-09-26'}],'YELLOW');let intel2=c.MRMIntelligenceV39.afterCalculation(s2,{trigger:'test'});
let logged=c.MRMSmartAlertsV39.events();
ok('comparable significant delta emits market alert',logged.some(x=>x.ruleId==='GLOBAL_SIGNIFICANT_DELTA'&&x.type==='MARKET_RISK'));
// watch target persistence
c.MRMSmartAlertsV39.watchTarget('EARLY:TEST MARKET','Test Market');
ok('watch target added',c.MRMSmartAlertsV39.watches().some(x=>x.target==='EARLY:TEST MARKET'));
// market watch confirmation must compare repeated observations to the original pending baseline,
// not to the immediately previous observation (otherwise confirmation can never complete).
store.clear();
c.MRMSmartAlertsV39.watchTarget('EARLY:TEST MARKET','Test Market');
let w0=mkState(30,30,0,0,1,[{...in1[0],score:30,value:100,date:'2026-09-24'}]);c.MRMIntelligenceV39.afterCalculation(w0,{trigger:'test'});
let w1=mkState(38,38,0,0,1,[{...in1[0],score:40,value:110,date:'2026-09-25'}]);c.MRMIntelligenceV39.afterCalculation(w1,{trigger:'test'});
let w2=mkState(39,39,0,0,1,[{...in1[0],score:41,value:111,date:'2026-09-26'}]);c.MRMIntelligenceV39.afterCalculation(w2,{trigger:'test'});
ok('market watch requires and completes two-observation confirmation',c.MRMSmartAlertsV39.events().some(x=>x.ruleId==='WATCH_SIGNIFICANT_CHANGE'&&x.confirmationCount>=2));
console.log(`RESULT ${pass}/${pass+fail} PASS`);process.exit(fail?1:0);
