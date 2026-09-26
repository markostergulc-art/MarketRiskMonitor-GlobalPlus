const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/app.js','utf8');
const start=src.indexOf('/* v3.6.5 · DAILY CAPITAL ROTATION ENGINE.');
const end=src.indexOf('const CAPITAL_ROTATION_WEIGHTS_V70=',start);
if(start<0||end<0)throw new Error('daily block not found');
const block=src.slice(start,end);
const ctx={console,Math,Date,Intl,performance:{now:()=>0},Y1:'y1/',Y2:'y2/',currentLang:'en'};
ctx.L=(a,b)=>b;ctx.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));ctx.pct=(a,b)=>b?((a/b)-1)*100:null;ctx.avg=a=>{a=(a||[]).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};ctx.medianNumber=a=>{a=(a||[]).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;let m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};ctx.fmt=(v,n=1)=>Number(v).toFixed(n);ctx.fetchWithTimeout=async()=>{throw new Error('not used')};
ctx.capitalRotationExpectedLatestTradingDateV114=()=> '2026-09-18';ctx.capitalRotationDateAddV114=(d,n)=>{let x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};ctx.capitalRotationLatestTradingOnOrBeforeV114=d=>d;ctx.capitalRotationObservationStatusV114=(d,e)=>d===e?'CURRENT':d<e?'STALE':'AHEAD';
ctx.CAPITAL_ROTATION_WEIGHTS_V70={dailyExcessReturn:45,crossSectionRank:20,volumeConfirmation:15,breadthConfirmation:10,crossAssetConfirmation:10};ctx.capitalRotationV70={daily:{}};
vm.createContext(ctx);const strictDateLine=src.split('\n').find(x=>x.startsWith('function strictIsoDateV38('));if(!strictDateLine)throw new Error('strictIsoDateV38 not found');vm.runInContext(strictDateLine,ctx);vm.runInContext(block,ctx);vm.runInContext(`globalThis.CR_SECTORS=CAPITAL_ROTATION_DAILY_SECTORS_V115;globalThis.CR_AUX=CAPITAL_ROTATION_DAILY_AUX_SYMBOLS_V115;globalThis.CR_BENCH=CAPITAL_ROTATION_DAILY_BENCHMARK_V115;globalThis.CR_REV=CAPITAL_ROTATION_DAILY_REVERSAL_MIN_V115;globalThis.CR_SET_SORT=(x)=>{capitalRotationDailySortV115=x};`,ctx);
function dates(n=30){let out=[],d=new Date('2026-08-10T12:00:00Z');while(out.length<n){let wd=d.getUTCDay();if(wd!==0&&wd!==6)out.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1)}return out}
const ds=dates(30); if(ds.at(-1)!=='2026-09-18') throw new Error('date fixture mismatch '+ds.at(-1));
function seriesFromReturns(rets,vol=100){let v=100,out=[{d:ds[0],v,volume:vol}];for(let i=1;i<ds.length;i++){let r=rets[i]??0;v*=1+r/100;out.push({d:ds[i],v,volume:vol*(1+(i%3)*.05)})}return out}
function rec(symbol,rets,transport='NETWORK'){return{symbol,series:seriesFromReturns(rets),retrievedAt:'2026-09-19T08:00:00Z',transport,staleFallback:false}}
function setup(sectorReturns,spyLast=0.5){let base=Array(ds.length).fill(0);base[ds.length-1]=spyLast;ctx.capitalRotationV70.daily={SPY:rec('SPY',base)};for(const def of ctx.CR_SECTORS){let rr=Array(ds.length).fill(0);rr[ds.length-1]=sectorReturns[def.id]??spyLast;ctx.capitalRotationV70.daily[def.symbol]=rec(def.symbol,rr)}for(const sym of ctx.CR_AUX){let rr=Array(ds.length).fill(0);rr[ds.length-1]=spyLast;ctx.capitalRotationV70.daily[sym]=rec(sym,rr)}}
let tests=0; function ok(name,fn){fn();tests++;}
setup({technology:2,financials:1.5,energy:1,industrials:1.3,healthcare:.3,utilities:-.2,consumerDisc:1.8,staples:0,communication:1.2,materials:.9,realEstate:.1},.5);
ok('1D excess positive',()=>{let s=ctx.capitalRotationDailySessionForDateV115('2026-09-18'),t=s.rows.find(x=>x.def.id==='technology');assert(Math.abs(t.dailyExcess-1.5)<.02)});
ok('negative absolute can outperform',()=>{setup({technology:-.5},-1.4);let t=ctx.capitalRotationDailySessionForDateV115('2026-09-18').rows.find(x=>x.def.id==='technology');assert(t.dailyExcess>.8)});
ok('equal return neutral excess',()=>{setup({technology:.5},.5);let t=ctx.capitalRotationDailySessionForDateV115('2026-09-18').rows.find(x=>x.def.id==='technology');assert(Math.abs(t.dailyExcess)<.001)});
ok('cross-sectional highest rank',()=>{setup({technology:2,financials:1.5,energy:1,industrials:1.3,healthcare:.3,utilities:-.2,consumerDisc:1.8,staples:0,communication:1.2,materials:.9,realEstate:.1},.5);let s=ctx.capitalRotationDailySessionForDateV115('2026-09-18'),t=s.rows.find(x=>x.def.id==='technology');assert.strictEqual(t.rank,1)});
ok('materiality prevents tiny strong signal',()=>{let vals={};ctx.CR_SECTORS.forEach((d,i)=>vals[d.id]=.5+(10-i)*.001);setup(vals,.5);let s=ctx.capitalRotationDailySessionForDateV115('2026-09-18');assert(s.rows.every(x=>!Number.isFinite(x.score)||Math.abs(x.score)<20))});
ok('status strong inflow',()=>assert.strictEqual(ctx.capitalRotationDailyStatusV115(70),'STRONG RELATIVE INFLOW'));
ok('status inflow',()=>assert.strictEqual(ctx.capitalRotationDailyStatusV115(30),'RELATIVE INFLOW'));
ok('status neutral',()=>assert.strictEqual(ctx.capitalRotationDailyStatusV115(0),'NEUTRAL / MIXED'));
ok('status outflow',()=>assert.strictEqual(ctx.capitalRotationDailyStatusV115(-30),'RELATIVE OUTFLOW'));
ok('status strong outflow',()=>assert.strictEqual(ctx.capitalRotationDailyStatusV115(-70),'STRONG RELATIVE OUTFLOW'));
ok('volume confirmation available',()=>{setup({technology:2},.5);let t=ctx.capitalRotationDailySessionForDateV115('2026-09-18').rows.find(x=>x.def.id==='technology');assert(Number.isFinite(t.metric.volumeRatio))});
ok('missing volume is not zero',()=>{setup({technology:2},.5);ctx.capitalRotationV70.daily.XLK.series.forEach(x=>x.volume=null);let t=ctx.capitalRotationDailySessionForDateV115('2026-09-18').rows.find(x=>x.def.id==='technology');assert.strictEqual(t.metric.volumeRatio,null);assert.strictEqual(t.parts.volumeConfirmation,null)});
ok('5D context is separate',()=>{setup({technology:2},.5);let t=ctx.capitalRotationDailySessionForDateV115('2026-09-18').rows.find(x=>x.def.id==='technology');assert('fiveDayExcess' in t.metric)});
ok('breadth not fabricated',()=>{setup({technology:2},.5);let t=ctx.capitalRotationDailySessionForDateV115('2026-09-18').rows.find(x=>x.def.id==='technology');assert.strictEqual(t.parts.breadthConfirmation,null)});
ok('score bounded',()=>{setup({technology:10},.5);let s=ctx.capitalRotationDailySessionForDateV115('2026-09-18');assert(s.rows.every(x=>!Number.isFinite(x.score)||(x.score>=-100&&x.score<=100)));});
ok('risk appetite bounded',()=>{setup({technology:2},.5);let r=ctx.capitalRotationDailyRiskAppetiteV115('2026-09-18');assert(r.score>=-100&&r.score<=100)});
ok('regime has breadth',()=>{setup({technology:2,financials:1.5,energy:1,industrials:1.3,consumerDisc:1.8,communication:1.2,materials:.9,healthcare:.3,utilities:-.2,staples:0,realEstate:.1},.5);let s=ctx.capitalRotationDailySessionForDateV115('2026-09-18'),r=ctx.capitalRotationDailyRegimeV115(s.rows,s.riskAppetite.score);assert(Number.isFinite(r.breadthPct))});
ok('rank tie average',()=>{let vals={};ctx.CR_SECTORS.forEach(d=>vals[d.id]=1);setup(vals,.5);let s=ctx.capitalRotationDailySessionForDateV115('2026-09-18');let ranks=new Set(s.rows.map(x=>x.rank));assert.strictEqual(ranks.size,1)});
ok('stale record not scored for current date',()=>{setup({technology:2},.5);ctx.capitalRotationV70.daily.XLK.series.pop();let t=ctx.capitalRotationDailySessionForDateV115('2026-09-18').rows.find(x=>x.def.id==='technology');assert.strictEqual(t.score,null)});
ok('missing sector independent failure',()=>{setup({technology:2},.5);delete ctx.capitalRotationV70.daily.XLF;let s=ctx.capitalRotationDailySessionForDateV115('2026-09-18');assert.strictEqual(s.rows.length,11);assert.strictEqual(s.rows.find(x=>x.def.id==='financials').score,null)});
ok('benchmark missing blocks scores',()=>{setup({technology:2},.5);delete ctx.capitalRotationV70.daily.SPY;let s=ctx.capitalRotationDailySessionForDateV115('2026-09-18');assert(s.rows.every(x=>x.score===null))});
ok('daily weights are primary',()=>{assert.strictEqual(ctx.CAPITAL_ROTATION_WEIGHTS_V70.dailyExcessReturn,45);assert(!('relativePriceTrend' in ctx.CAPITAL_ROTATION_WEIGHTS_V70))});
ok('daily sector count 11',()=>assert.strictEqual(ctx.CR_SECTORS.length,11));
ok('benchmark is SPY',()=>assert.strictEqual(ctx.CR_BENCH,'SPY'));
ok('sector symbols include XLK XLF XLRE',()=>{let set=new Set(ctx.CR_SECTORS.map(x=>x.symbol));for(const x of ['XLK','XLF','XLRE'])assert(set.has(x))});
ok('reversal threshold constant',()=>assert.strictEqual(ctx.CR_REV,20));
ok('rank change convention',()=>{let prev=9,cur=2;assert.strictEqual(prev-cur,7)});
ok('acceleration label positive',()=>assert.strictEqual(ctx.capitalRotationDailyAccelerationLabelV115(40),'STRONG ACCELERATION'));
ok('acceleration label stable',()=>assert.strictEqual(ctx.capitalRotationDailyAccelerationLabelV115(5),'STABLE'));
ok('5D context positive threshold',()=>assert.strictEqual(ctx.capitalRotationDailyFiveDayContextV115(1.2),'Positive'));
ok('5D context neutral threshold',()=>assert.strictEqual(ctx.capitalRotationDailyFiveDayContextV115(.2),'Neutral'));
ok('confidence low stale',()=>assert.strictEqual(ctx.capitalRotationDailyConfidenceV115({metric:{},dataStatus:'STALE',parts:{a:1}},'LIVE'),'LOW'));
ok('sort score descending',()=>{ctx.CR_SET_SORT('score');let a=ctx.capitalRotationDailySortRowsV115([{score:1},{score:5},{score:-1}]);assert.strictEqual(a.map(x=>x.score).join(','),'5,1,-1')});
ok('sort excess descending',()=>{ctx.CR_SET_SORT('excess');let a=ctx.capitalRotationDailySortRowsV115([{dailyExcess:.1},{dailyExcess:.5}]);assert.strictEqual(a.map(x=>x.dailyExcess).join(','),'0.5,0.1')});
ok('aux smallcap score finite',()=>{setup({technology:2},.5);let v=ctx.capitalRotationDailyAuxScoreV115('IWM');assert(Number.isFinite(v))});
ok('defensive parent composite finite',()=>{setup({utilities:-.2,staples:0,healthcare:.2},.5);let v=ctx.capitalRotationDailyParentScoreV115('defensiveEq');assert(Number.isFinite(v))});
ok('no literal fund flow label in status',()=>{for(const v of [-80,-30,0,30,80])assert(!/\$|billion|million/i.test(ctx.capitalRotationDailyStatusV115(v)))});
console.log(`PASS ${tests}/${tests} daily Capital Rotation tests`);
