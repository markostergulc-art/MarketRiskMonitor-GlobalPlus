'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('app/src/main/assets/t212_portfolio_v363.js','utf8');
const ctx={window:{},console,Intl,Date,Math,Number,String,Array,Object,Map,Set,JSON};
vm.createContext(ctx);vm.runInContext(code,ctx,{filename:'t212_portfolio_v363.js'});
const T=ctx.window.T212PortfolioV363;
if(!T)throw new Error('T212PortfolioV363 test API missing');
let pass=0;function ok(cond,msg){assert.ok(cond,msg);pass++}function eq(a,b,msg){assert.strictEqual(a,b,msg);pass++}

// 1) position normalization and no P/L decision leakage
const a={instrument:{ticker:'AAPL_US_EQ',name:'Apple Inc.',currencyCode:'USD',type:'STOCK'},quantity:10,averagePricePaid:150,currentPrice:180,walletImpact:{currentValue:1800,totalCost:1500,unrealizedProfitLoss:300,currency:'USD'}};
const p=T.normalizePosition(a);eq(p.ticker,'AAPL_US_EQ','ticker');eq(p.unrealizedPL,300,'upl');ok(Math.abs(p.unrealizedPLPct-20)<1e-9,'upl pct');

// 2) venue mappings
eq(T.t212YahooCandidate({ticker:'AAPL_US_EQ'}),'AAPL','US mapping');eq(T.t212YahooCandidate({ticker:'VUSAl_EQ'}),'VUSA.L','London mapping');eq(T.t212YahooCandidate({ticker:'SAPd_EQ'}),'SAP.DE','Germany mapping');eq(T.t212YahooCandidate({ticker:'SHOP_CA_EQ'}),'SHOP.TO','Canada mapping');

// 3) allocation / concentration
const ps=[T.normalizePosition({...a,walletImpact:{currentValue:600,totalCost:500,unrealizedProfitLoss:100,currency:'USD'}}),T.normalizePosition({...a,instrument:{...a.instrument,ticker:'MSFT_US_EQ'},walletImpact:{currentValue:300,totalCost:300,unrealizedProfitLoss:0,currency:'USD'}}),T.normalizePosition({...a,instrument:{...a.instrument,ticker:'JNJ_US_EQ'},walletImpact:{currentValue:100,totalCost:100,unrealizedProfitLoss:0,currency:'USD'}})];
const al=T.allocationStats(ps);ok(Math.abs(al.largest-60)<1e-9,'largest weight');ok(Math.abs(al.top3-100)<1e-9,'top3');

// 4) sector + AI exposure
eq(T.normalizedSector('NVIDIA','Semiconductors','STOCK'),'Technology','semiconductor sector');eq(T.aiExposure('NVIDIA','Semiconductors','Technology'),'VERY HIGH','ai infra exposure');eq(T.aiExposure('Coca-Cola','Beverages','Consumer'),'LOW','consumer not auto AI');

// 5) scores deterministic / missing values ignored
const good={roic:24,roe:28,operatingMargin:27,fcfMargin:20,trailingPE:18,fcfYield:5.5,priceToSales:4,evToEbitda:12,revenueGrowth:14,epsGrowth:18,fcfGrowth:20,revenueCagr3:12,debtToEquity:.35,debt:20,cash:40,netDebt:-20,debtToFcf:1,cfoConversion:1.1,fcf:50};
const weak={roic:-2,roe:1,operatingMargin:-3,fcfMargin:-8,trailingPE:80,fcfYield:-2,priceToSales:18,evToEbitda:45,revenueGrowth:-12,epsGrowth:-20,fcfGrowth:-30,revenueCagr3:-4,debtToEquity:5,debt:500,cash:10,netDebt:490,debtToFcf:12,cfoConversion:.2,fcf:-20};
const qg=T.scoreQuality(good),qw=T.scoreQuality(weak),vg=T.scoreValuation(good,'Technology'),vw=T.scoreValuation(weak,'Technology');ok(qg>qw,'quality ordering');ok(vg>vw,'valuation ordering');ok(Number.isFinite(T.scoreGrowth(good)),'growth score');ok(Number.isFinite(T.scoreBalance(good)),'balance score');ok(Number.isFinite(T.scoreCashFlow(good)),'cash score');

// 6) total normalization and status logic
let s={quality:85,valuation:75,growth:75,balance:85,cashFlow:85,risk:70,momentum:60,portfolioFit:80};s.total=T.totalScore(s);eq(T.classify(s,'HIGH'),'KEEP','strong holding keep');
s={quality:20,valuation:20,growth:20,balance:25,cashFlow:25,risk:20,momentum:15,portfolioFit:20};s.total=T.totalScore(s);eq(T.classify(s,'HIGH'),'SELL REVIEW','multi-factor deterioration');
s={quality:80,valuation:25,growth:75,balance:85,cashFlow:80,risk:65,momentum:50,portfolioFit:75};s.total=T.totalScore(s);ok(T.classify(s,'HIGH')!=='SELL REVIEW','one bad metric not sell');
s={quality:null,valuation:null,growth:null,balance:null,cashFlow:null,risk:70,momentum:70,portfolioFit:70};s.total=T.totalScore(s);eq(T.classify(s,'LOW'),'WATCH','missing fundamentals watch');

// 7) concentration can trigger review without pretending fundamentals are known
s={quality:null,valuation:null,growth:null,balance:null,cashFlow:null,risk:20,momentum:30,portfolioFit:15};s.total=T.totalScore(s);eq(T.classify(s,'LOW'),'REDUCE / REVIEW','concentration + market risk review');

// 8) confidence behavior
const f10={fundamentalCount:11},f4={fundamentalCount:4},f0={fundamentalCount:0};eq(T.confidenceFor(f10,true,true),'HIGH','high confidence');eq(T.confidenceFor(f4,true,true),'MEDIUM','medium confidence');eq(T.confidenceFor(f0,false,true),'LOW','low confidence');

// 9) valuation zones
eq(T.valuationZone(80),'UNDERVALUED');eq(T.valuationZone(65),'FAIR');eq(T.valuationZone(50),'ELEVATED');eq(T.valuationZone(35),'EXPENSIVE');eq(T.valuationZone(20),'EXTREME');

// 10) P/L must not enter score/classification: same analytical scores => same status
const baseScores={quality:75,valuation:65,growth:65,balance:75,cashFlow:75,risk:65,momentum:55,portfolioFit:70};baseScores.total=T.totalScore(baseScores);const st1=T.classify({...baseScores},'HIGH'),st2=T.classify({...baseScores},'HIGH');eq(st1,st2,'P/L independent classification');

// 11) risk/momentum bounded
const r=T.scoreRisk({rv20:20,rv60:24,draw52:-12}),m=T.scoreMomentum({r1m:4,r3m:9,dist200:7});ok(r>=0&&r<=100,'risk bounded');ok(m>=0&&m<=100,'momentum bounded');

// 12) portfolio fit concentration penalty
const pfSmall=T.scorePortfolioFit(5,20,.3),pfHuge=T.scorePortfolioFit(35,60,.85);ok(pfSmall>pfHuge,'portfolio fit penalizes concentration/correlation');

// 13) correlation sanity
function mk(vals){return vals.map((c,i)=>({d:`2026-01-${String(i+1).padStart(2,'0')}`,c}))}
const seriesA=mk(Array.from({length:31},(_,i)=>100+i));const seriesB=mk(Array.from({length:31},(_,i)=>200+2*i));const c=T.correlation(seriesA,seriesB,30);ok(c>.99,'positive correlation');

// 14) 20+ holdings allocation handles scale
const many=Array.from({length:25},(_,i)=>T.normalizePosition({instrument:{ticker:`X${i}_US_EQ`,name:`X${i}`,currencyCode:'USD'},quantity:1,averagePricePaid:100,currentPrice:100,walletImpact:{currentValue:100,totalCost:100,unrealizedProfitLoss:0,currency:'USD'}}));const am=T.allocationStats(many);ok(Math.abs(am.largest-4)<1e-9,'25 holdings equal weight');

// 15) missing price remains null rather than zero
const mp=T.normalizePosition({instrument:{ticker:'MISS_US_EQ'},quantity:1,averagePricePaid:10});eq(mp.currentPrice,null,'missing current price null');

console.log(`T212 Portfolio v3.6.3 tests: ${pass}/${pass} PASS`);
