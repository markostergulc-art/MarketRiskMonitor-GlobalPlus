const fs=require('fs'),vm=require('vm'),assert=require('assert');
let pass=0,fail=0;function ok(n,c,d=''){if(c){console.log('PASS',n);pass++}else{console.error('FAIL',n,d);fail++}}
global.window=global;
global.document={getElementById(){return null},createElement(){return {id:'',textContent:'',style:{}}},head:{appendChild(){}},querySelectorAll(){return []}};
global.setTimeout=(fn)=>1;global.L=(a,b)=>b;global.esc=s=>String(s);global.currentLang='en';
global.capitalRotationDailyStatusClassV115=()=>'';global.capitalRotationDailyLabelV115=d=>d.labelEn;global.capitalRotationScoreBarV70=()=>'<i></i>';
global.capitalRotationDailySortRowsV115=rows=>rows;global.capitalRotationDailySortV115='score';global.renderCapitalRotationV70=function(){};
const src=fs.readFileSync('app/src/main/assets/capital_rotation_ui_v367.js','utf8');vm.runInThisContext(src,{filename:'capital_rotation_ui_v367.js'});
const T=global.__CR117_TEST__;if(!T)throw new Error('CR117 test API missing');
const defs=['Technology','Financials','Energy','Industrials','Healthcare','Utilities','Consumer Discretionary','Consumer Staples','Communication Services','Materials','Real Estate'].map((x,i)=>({id:'s'+i,labelEn:x,labelHr:x,symbol:'X'+i}));
const rows=defs.map((def,i)=>({def,status:'RELATIVE INFLOW',confidence:'HIGH',score:50-i,rank:i+1,rankChange:0,previousScore:40-i,acceleration:10,persistence:'ONE-DAY SIGNAL',metric:{sectorReturn:1,benchmarkReturn:.5,fiveDayExcess:.2,date:'2026-09-18'},dailyExcess:.5,history5:[]}));
const html=T.sectorList({current:{rows}});
for(const name of defs.map(x=>x.labelEn)){let count=(html.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;ok(name+' appears once',count===1,count)}
ok('One details card per sector',(html.match(/data-cr117-sector=/g)||[]).length===11);
ok('Contributor placeholder inside same sector',(html.match(/id="cr116_attr_/g)||[]).length===11);
ok('No strongest-signal duplicate section',!src.includes('STRONGEST DAILY SIGNALS'));
ok('No separate sector-details duplicate section',!src.includes('SECTOR DETAILS'));
ok('No legacy representative-groups section',!src.includes('capitalRotationRepresentativesSectionV71'));
ok('Tap details message present',/Tap a sector for all metrics/.test(html));
console.log(`RESULT ${pass}/${pass+fail} passed`);process.exit(fail?1:0);
