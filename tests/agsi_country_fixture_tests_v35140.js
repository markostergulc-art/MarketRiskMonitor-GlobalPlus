'use strict';
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('app.js','utf8');
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/gie_agsi_country_v35140.json','utf8'));
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
const names=['cacheHash','v37Num','v37CountryCode','v37CountryName','parseAgsiFacilityListingV37','discoverAgsiCountryCodesV40','parseAgsiCountryCurrentV40','v40CountryProgressV40'];
const context={console,URL,Intl,currentLang:'en',AGSI_EU27_V37:new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'])};
vm.createContext(context); vm.runInContext(names.map(extract).join('\n'),context);
let pass=0,fail=0;
function check(name,cond,detail=''){if(cond){console.log('PASS -',name);pass++;}else{console.log('FAIL -',name,detail);fail++;}}
const disc=context.discoverAgsiCountryCodesV40(fixture.listing);
check('EU discovery includes DE/FR',JSON.stringify(disc.codes)===JSON.stringify(['DE','FR']),JSON.stringify(disc.codes));
check('non-EU GB/UA excluded',!disc.codes.includes('GB')&&!disc.codes.includes('UA'));
let x=context.parseAgsiCountryCurrentV40(fixture.normal,'DE');
check('normal country stock',x.stock===137.0);
check('normal country WGV',x.capacity===247.5);
check('normal official fill retained',Math.abs(x.fill-55.35)<1e-9);
check('free capacity calculated',Math.abs(x.freeCapacity-110.5)<1e-9);
check('valid progress eligible',Math.abs(context.v40CountryProgressV40(x)-55.35)<1e-9);
x=context.parseAgsiCountryCurrentV40(fixture.missingFull,'DE');
check('missing full computed from stock/WGV',Math.abs(x.fill-50)<1e-9);
x=context.parseAgsiCountryCurrentV40(fixture.missingCapacity,'DE');
check('missing WGV preserved as null',x.capacity===null);
check('missing WGV has no progress bar',context.v40CountryProgressV40(x)===null);
x=context.parseAgsiCountryCurrentV40(fixture.over100,'DE');
check('>100 raw fill not silently clamped',x.fill===101);
check('>100 remains progress input for anomaly renderer',context.v40CountryProgressV40(x)===101);
x=context.parseAgsiCountryCurrentV40(fixture.duplicateDate,'DE');
check('duplicate date prefers confirmed status',x.status==='C'&&x.stock===50);
check('observation date retained',x.d==='2026-09-10');
// Source invariants for orchestration/failure isolation.
check('bounded country concurrency = 4',/mapLimit\(discovery\.codes,4,/.test(src));
check('country worker isolates failures',/failed\.push\(\{country:code,error:v40SafeError\(e\)\}\);return null/.test(src));
check('country cache TTL = 6h',/commodityV40\.euGasCountries[\s\S]*Date\.now\(\)-s\.loadedAt<6\*60\*60\*1000/.test(src));
check('overview lazy integration',/commodityViewV19==='overview'\)jobs\.push\(ensureEuGasCountriesV40\(force\)\)/.test(src));
check('shared progress renderer used',/renderThinProgressV38\(progress,'storage'\)/.test(src));
check('no hardcoded current country capacity values',!/247\.5/.test(src));
check('summary totals use complete WGV/stock pairs only',/pairedItems=items\.filter\(x=>Number\.isFinite\(x\.capacity\)&&x\.capacity>0&&Number\.isFinite\(x\.stock\)\)/.test(src));
console.log(`RESULT ${pass}/${pass+fail} PASS`); if(fail)process.exit(1);
