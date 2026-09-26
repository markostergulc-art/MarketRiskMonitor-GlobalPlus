'use strict';
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('app.js','utf8');
function extract(name){
  let p=src.indexOf('function '+name); if(p<0)p=src.indexOf('async function '+name); if(p<0)throw new Error('missing '+name);
  const b=src.indexOf('{',p); let depth=0,q=null,esc=false,i=b;
  for(;i<src.length;i++){
    const c=src[i];
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue;}
    if(c==='"'||c==="'"||c==='`'){q=c;continue;}
    if(c==='{')depth++; else if(c==='}'&&--depth===0){i++;break;}
  }
  return src.slice(p,i);
}
const names=['v37Num','v37CountryName','parseAgsiCountryCurrentV40'];
const context={console,Intl,currentLang:'en'};
vm.createContext(context); vm.runInContext(names.map(extract).join('\n'),context);
let pass=0,fail=0;
function check(name,cond,detail=''){if(cond){console.log('PASS -',name);pass++;}else{console.log('FAIL -',name,detail);fail++;}}
const base={data:[{name:'Germany',code:'DE',gasDayStart:'2026-09-10',gasInStorage:'138.0',workingGasVolume:'247.5',full:'55.76',consumption:'903.9',consumptionFull:'15.27',trend:'0.10',status:'C'}]};
let x=context.parseAgsiCountryCurrentV40(base,'DE');
check('AGSI annual consumption parsed',Math.abs(x.consumption-903.9)<1e-9,x.consumption);
check('AGSI consumptionFull parsed',Math.abs(x.consumptionFull-15.27)<1e-9,x.consumptionFull);
check('coverage days arithmetic',Math.round(365*x.consumptionFull/100)===56,365*x.consumptionFull/100);
const fallback={data:[{name:'Germany',code:'DE',gasDayStart:'2026-09-10',gasInStorage:'138.0',workingGasVolume:'247.5',full:'55.76',consumption:'864',consumptionFull:null,status:'C'}]};
x=context.parseAgsiCountryCurrentV40(fallback,'DE');
check('missing consumptionFull computed from stock/consumption',Math.abs(x.consumptionFull-(100*138/864))<1e-9,x.consumptionFull);
const zero={data:[{name:'Germany',code:'DE',gasDayStart:'2026-09-10',gasInStorage:'138.0',workingGasVolume:'247.5',full:'55.76',consumption:'0',consumptionFull:null,status:'C'}]};
x=context.parseAgsiCountryCurrentV40(zero,'DE');
check('zero consumption does not divide by zero',x.consumptionFull===null,x.consumptionFull);
const missing={data:[{name:'Germany',code:'DE',gasDayStart:'2026-09-10',gasInStorage:'138.0',workingGasVolume:'247.5',full:'55.76',status:'C'}]};
x=context.parseAgsiCountryCurrentV40(missing,'DE');
check('missing consumption remains missing',x.consumption===null&&x.consumptionFull===null,JSON.stringify(x));
check('card displays annual demand coverage only when consumption exists',/demandLine=Number\.isFinite\(x\.consumption\)/.test(src));
check('coverage uses no new progress bar',!/renderThinProgressV38\(coverage/.test(src));
check('coverage semantic note present',/annual-average-rate equivalent, not an estimate of winter autonomy/.test(src));
check('AGSI country request architecture unchanged',/mapLimit\(discovery\.codes,4,/.test(src)&&/agsiApiJsonV33\(url,force\)/.test(src));
console.log(`RESULT ${pass}/${pass+fail} PASS`); if(fail)process.exit(1);
