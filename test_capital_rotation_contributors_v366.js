const fs=require('fs'),vm=require('vm');
let pass=0,fail=0;
function ok(name,cond,detail=''){ if(cond){console.log('PASS',name);pass++} else {console.error('FAIL',name,detail);fail++} }
function near(a,b,eps=1e-8){return Number.isFinite(a)&&Math.abs(a-b)<=eps}

global.window=global;
global.document={
  getElementById(){return null},
  createElement(){return {id:'',textContent:'',style:{}}},
  head:{appendChild(){}},
  querySelectorAll(){return []}
};
global.localStorage={getItem(){return null},setItem(){},removeItem(){}};
global.L=(hr,en)=>en;
global.setTimeout=(fn)=>{ /* no DOM async work in tests */ return 1 };
global.clearTimeout=()=>{};
global.CAPITAL_ROTATION_DAILY_SECTORS_V115=[];
const src=fs.readFileSync('app/src/main/assets/capital_rotation_contributors_v366.js','utf8');
vm.runInThisContext(src,{filename:'capital_rotation_contributors_v366.js'});
const T=global.__CR116_TEST__;
if(!T) throw new Error('CR116 test API not exposed');

function holding(t,w,name=t){return {ticker:t,yahoo:t,name,weight:w}}
function ret(v){return {ret:v}}
function analysis(holds, pairs, sector=1, spy=.5){return T.analyze(holds,new Map(pairs),{sectorReturn:sector},{sectorReturn:spy})}

ok('Yahoo class-share normalization',T.yahooSymbol('BRK.B')==='BRK-B');
ok('Yahoo ordinary ticker unchanged',T.yahooSymbol('xom')==='XOM');

let h=Array.from({length:10},(_,i)=>holding('B'+i,10));
let a=analysis(h,h.map((x,i)=>[x.ticker,ret(1.0+i*0.03)]),.8,.3);
ok('Broad rally valid count',a.validCount===10);
ok('Broad rally positive breadth 100%',near(a.positivePct,100));
ok('Broad rally outperform-SPY 100%',near(a.outperformSpyPct,100));
ok('Broad rally positive weight 100%',near(a.positiveWeightPct,100));
ok('Broad rally weighted coverage 100%',near(a.weightedCoverage,100));
ok('Broad rally classified BROAD',a.breadth==='BROAD',a.breadth);
ok('Contribution uses ETF weight',near(a.topPositive[0].contribution,.127),a.topPositive[0].contribution);
ok('Top positive contributor sorted',a.topPositive[0].ticker==='B9');

h=[holding('MEGA',80),holding('B',4),holding('C',4),holding('D',4),holding('E',4),holding('F',4)];
a=analysis(h,[['MEGA',ret(3)],['B',ret(-.2)],['C',ret(-.1)],['D',ret(-.2)],['E',ret(.1)],['F',ret(-.1)]],1,.4);
ok('Narrow move detects mega-cap domination',a.megaCapDominated===true);
ok('Narrow move breadth concentrated',['NARROW','HIGHLY CONCENTRATED'].includes(a.breadth),a.breadth);
ok('Mega contributor has largest contribution',a.topPositive[0].ticker==='MEGA');
ok('Negative contributors present',a.topNegative.length>=1);

h=[holding('A',5),holding('B',15),holding('C',80)];
a=analysis(h,[['A',ret(1)],['B',ret(1)]],.5,.2);
ok('Missing large constituent weighted coverage 20%',near(a.weightedCoverage,20),a.weightedCoverage);
ok('Missing large constituent confidence LOW',T.attributionConfidence(a,'LIVE')==='LOW');
a=analysis(h,[['A',ret(1)],['B',ret(1)],['C',ret(1)]],.5,.2);
ok('All weights valid coverage 100%',near(a.weightedCoverage,100));
ok('Small universe confidence not falsely HIGH',T.attributionConfidence(a,'LIVE')==='MEDIUM');
ok('Stale holdings force LOW confidence',T.attributionConfidence(a,'STALE')==='LOW');

h=Array.from({length:10},(_,i)=>holding('S'+i,10));
a=analysis(h,h.map((x,i)=>[x.ticker,ret(i%2?1.2:.8)]),.5,.2);
ok('10 constituents high coverage can be HIGH confidence',T.attributionConfidence(a,'LIVE')==='HIGH');
ok('Sector relative excess calculation',near(a.rows[0].sectorExcess,.3),a.rows[0].sectorExcess);
ok('SPY relative excess calculation',near(a.rows[0].spyExcess,.6),a.rows[0].spyExcess);

let ds=T.driverSummary([
 {signal:1.2,direction:1,label:'WTI'},
 {signal:.8,direction:1,label:'Brent'},
 {signal:.4,direction:1,label:'Gas'}
],70);
ok('Positive sector + positive drivers confirms',ds.status==='STRONG CONFIRMATION'||ds.status==='CONFIRMATION',ds.status);
ok('Three usable drivers confidence HIGH',ds.confidence==='HIGH');
ds=T.driverSummary([{signal:-1.5,direction:1},{signal:-.8,direction:1}],60);
ok('Positive sector + negative drivers diverges',ds.status.includes('DIVERGENCE'),ds.status);
ds=T.driverSummary([{signal:-1.0,direction:1},{signal:-.7,direction:1}],-60);
ok('Negative sector + negative drivers confirms',ds.status.includes('CONFIRMATION'),ds.status);
ds=T.driverSummary([],60);
ok('No drivers status N/A',ds.status==='N/A');
ok('No drivers low confidence',ds.confidence==='LOW');

ok('Energy has WTI driver',T.driverMap.energy.some(x=>x.symbol==='CL=F'));
ok('Energy has Brent driver',T.driverMap.energy.some(x=>x.symbol==='BZ=F'));
ok('Energy has natural gas driver',T.driverMap.energy.some(x=>x.symbol==='NG=F'));
ok('Materials has copper driver',T.driverMap.materials.some(x=>x.symbol==='HG=F'));
ok('Technology has semiconductor driver',T.driverMap.technology.some(x=>x.symbol==='SOXX'));
ok('Financials has regional bank/credit confirmation',T.driverMap.financials.some(x=>x.symbol==='KRE')&&T.driverMap.financials.some(x=>x.symbol==='HYG'));

(async()=>{
  const b=fs.readFileSync('tests/fixtures/cr116_holdings_test.xlsx');
  const parsed=await T.parseHoldingsXlsx(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'XLK');
  ok('XLSX parser reads six holdings',parsed.holdings.length===6,parsed.holdings.length);
  ok('XLSX parser extracts as-of date',parsed.asOf==='2026-09-18',parsed.asOf);
  ok('XLSX parser normalizes decimal weight to percent',near(parsed.holdings.find(x=>x.ticker==='BBB').weight,20));
  ok('XLSX parser normalizes BRK.B Yahoo symbol',parsed.holdings.find(x=>x.ticker==='BRK.B').yahoo==='BRK-B');
  ok('XLSX parser skips non-data/header rows',parsed.holdings.every(x=>x.name&&x.ticker));
  console.log(`RESULT ${pass}/${pass+fail} passed`);
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2)});
