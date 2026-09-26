'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
let p=0,f=0;function ok(c,n,d=''){if(c){console.log('PASS - '+n);p++}else{console.error('FAIL - '+n+(d?' :: '+d:''));f++}}
function extractFunction(text,name){let i=text.indexOf('function '+name+'(');if(i<0)return null;let b=text.indexOf('{',i),d=0,sq=false,dq=false,tq=false,esc=false,line=false,block=false;for(let j=b;j<text.length;j++){let c=text[j],n=text[j+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;j++}continue}if(sq||dq||tq){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if((sq&&c==="'")||(dq&&c==='"')||(tq&&c==='`'))sq=dq=tq=false;continue}if(c==='/'&&n==='/'){line=true;j++;continue}if(c==='/'&&n==='*'){block=true;j++;continue}if(c==="'"){sq=true;continue}if(c==='"'){dq=true;continue}if(c==='`'){tq=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(i,j+1)}return null}
const names=['earlyClassMetaV52','earlySignalClassificationV52','isEarlyCompositeV52','annotateEarlySemanticsV52','earlyClassScoreV52','earlyWarningLayersV52'];
for(const n of names)ok(!!extractFunction(src,n),'function present: '+n);
const ctx={console,Math,Number,String,Object,Array,RegExp,EARLY_SIGNAL_CLASSES_V52:['LEADING','EARLY_CONFIRMATION','CURRENT_STRESS','LATE_CONFIRMATION','STRUCTURAL'],avg:a=>{let x=(a||[]).filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:null}};
vm.createContext(ctx);vm.runInContext(names.map(n=>extractFunction(src,n)).join('\n')+';this.classify=earlySignalClassificationV52;this.layers=earlyWarningLayersV52;',ctx);
const cls=(name,trend='')=>ctx.classify({name,trend}).signalClass;
ok(cls('Sahm Rule','Recession')==='LATE_CONFIRMATION','Sahm is late confirmation',cls('Sahm Rule','Recession'));
ok(cls('Sahm recession confirmation','Recession / labor')==='LATE_CONFIRMATION','Sahm macro row is late confirmation');
ok(cls('US 10Y–2Y','Yield curve')==='LEADING','10Y-2Y is leading');
ok(cls('10Y–3M curve recession signal','Recession / yield curve')==='LEADING','10Y-3M is leading');
ok(cls('OECD US Composite Leading Indicator','Recession / leading index')==='LEADING','OECD CLI is leading');
ok(cls('SLOOS · C&I lending standards','Bank credit availability')==='LEADING','SLOOS lending standards are leading');
ok(cls('Initial claims trend','Labor')==='LEADING','initial claims are leading');
ok(cls('Building-permits cycle','Recession / housing')==='LEADING','building permits are leading');
ok(cls('VIX','Volatility')==='CURRENT_STRESS','VIX is current stress');
ok(cls('SOFR − IORB funding spread','USD funding')==='CURRENT_STRESS','funding spread is current stress');
ok(cls('NFCI','Financial conditions')==='CURRENT_STRESS','NFCI is current stress');
ok(cls('Market breadth','Breadth')==='EARLY_CONFIRMATION','breadth is early confirmation');
ok(cls('US HY OAS','Credit')==='EARLY_CONFIRMATION','HY OAS is early confirmation');
ok(cls('Payroll & manufacturing-hours momentum','Recession / labor')==='EARLY_CONFIRMATION','payroll/hours is early confirmation');
ok(cls('Business-loan delinquency','Bank credit')==='LATE_CONFIRMATION','loan delinquency is late confirmation');
ok(cls('CFTC commodity crowding','Positioning')==='STRUCTURAL','crowding is structural');
ok(cls('Recession Detector Composite','Recession / macro')==='LATE_CONFIRMATION','recession composite is not treated as leading');
ok(cls('Inflation Detector Composite','Macro / inflation')==='CURRENT_STRESS','inflation composite is current stress');
const rows=[
 {name:'US 10Y–2Y',trend:'Yield curve',score:20},
 {name:'Sahm Rule',trend:'Recession',score:100},
 {name:'VIX',trend:'Volatility',score:80},
 {name:'Market breadth',trend:'Breadth',score:60},
 {name:'CFTC commodity crowding',trend:'Positioning',score:70}
];
const l=ctx.layers(rows);
ok(l.leadingWarningScore===20,'late Sahm cannot inflate Leading Warning',String(l.leadingWarningScore));
ok(l.currentStressScore===80,'Current Stress independent',String(l.currentStressScore));
ok(Math.abs(l.confirmationScore-74)<1e-9,'Confirmation uses 65/35 early/late category weights',String(l.confirmationScore));
ok(l.structuralVulnerabilityScore===70,'Structural layer independent');
ok(l.hasSingleCompositeScore===false,'no single Early Warning total');
const comp=ctx.layers([{name:'VIX',trend:'Volatility',score:20},{name:'Volatility Composite',trend:'Volatility',score:100}]);
ok(comp.currentStressScore===20,'composite excluded when raw class signal exists',String(comp.currentStressScore));
ok(comp.categories.CURRENT_STRESS.compositesExcluded===1,'composite exclusion is auditable');
ok(src.includes("confirmationWeights:{EARLY_CONFIRMATION:65,LATE_CONFIRMATION:35}"),'confirmation weights explicit in source');
ok(src.includes("hasSingleCompositeScore:false"),'single aggregate explicitly disabled');
console.log(`RESULT - ${p}/${p+f} Phase 4 semantic checks PASS`);if(f)process.exit(1);
