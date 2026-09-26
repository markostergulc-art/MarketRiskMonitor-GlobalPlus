const fs=require('fs');
const src=fs.readFileSync(process.argv[2]||'app.js','utf8');
let pass=0,fail=0;
function ok(cond,msg){if(cond){console.log('PASS',msg);pass++}else{console.error('FAIL',msg);fail++}}
ok(src.includes("TRADING212_INSTRUMENTS_DIRECT_V74='https://live.trading212.com/api/v0/equity/metadata/instruments'"),'uses Trading 212 tradable-instruments catalog');
ok(!src.includes('https://live.trading212.com/api/v0/equity/positions'),'does not use Trading 212 positions endpoint');
ok(!/trading212HoldingV72|PORTFELJ UČITAN|IN PORTFOLIO|NOT HELD/.test(src),'old portfolio-position semantics removed from runtime');
ok(src.includes("T212 ✓ DOSTUPNO")&&src.includes("T212 × NEDOSTUPNO"),'Croatian tradability labels present');
ok(src.includes("T212 ✓ TRADABLE")&&src.includes("T212 × NOT AVAILABLE"),'English tradability labels present');
ok(src.includes("t212-tradable")&&src.includes("t212-unavailable"),'distinct availability classes present');
ok(src.includes('function sp500StockRow')&&/function sp500StockRow[^\n]+trading212BadgeV74/.test(src),'S&P 500 rows include availability badge');
ok(/function companyRowHtml[^\n]+trading212BadgeV74/.test(src),'country/industry stock rows include availability badge');
ok(/function stockDetailShell[^\n]+trading212BadgeV74/.test(src)&&/function stockDetailHtml[^\n]+trading212BadgeV74/.test(src),'stock detail includes availability badge');
ok(/function etfRow[^\n]+trading212BadgeV74/.test(src),'ETF rows include availability badge');
ok(/function etfDetailHtml[^\n]+trading212BadgeV74/.test(src)&&/function openEtfDetail[^\n]+trading212BadgeV74/.test(src),'ETF detail/loading/error paths include availability badge');
ok(/function capitalRotationRepRowV71[^\n]+trading212BadgeV74/.test(src),'Capital Rotation equity representatives include badge');
ok(/function capitalRotationProxyHtmlV72[^\n]+trading212BadgeV74/.test(src),'Capital Rotation ETF proxies include badge');
ok(src.includes('restoreTrading212CredentialsV75')&&src.includes('if(trading212ConfiguredV74())await ensureTrading212AvailabilityV74(false)'), 'global startup restores credentials then loads availability catalog when configured');
ok(src.includes("EXPORT_V47_VERSION='3.10',EXPORT_V47_CODE=123"),'release export identity is 3.10 / 123');
// Evaluate only the new T212 block and test symbol matching without network.
const a=src.indexOf('// v3.5.1.74 · Trading 212 instrument tradability');
const b=src.indexOf('function capitalRotationProxyHtmlV72',a);
let block=src.slice(a,b);
let test=block+`\ntrading212V74.status='ready';\nconst idx=trading212InstrumentIndexV74([\n {ticker:'AAPL_US_EQ',shortName:'AAPL',name:'Apple Inc',type:'STOCK'},\n {ticker:'VWRL_GB_EQ',shortName:'VWRL',name:'Vanguard FTSE All-World',type:'ETF'},\n {ticker:'BRKb_US_EQ',shortName:'BRKb',name:'Berkshire Hathaway B',type:'STOCK'},\n {ticker:'7203_JP_EQ',shortName:'7203',name:'Toyota',type:'STOCK'},\n {ticker:'SAPd_DE_EQ',shortName:'SAP',name:'SAP SE',type:'STOCK'},\n {ticker:'VUSAl_EQ',shortName:'',name:'Vanguard S&P 500 UCITS ETF',type:'ETF'},\n {ticker:'SXR8d_EQ',shortName:'',name:'iShares Core S&P 500 UCITS ETF',type:'ETF'}\n]);\ntrading212V74.symbols=idx.symbols;\nglobalThis.__t212={n:idx.instruments.length,a:trading212TradableV74('AAPL'),v:trading212TradableV74('VWRL.L'),b:trading212TradableV74('BRK-B'),j:trading212TradableV74('7203.T'),sap:trading212TradableV74('SAP.DE'),vusa:trading212TradableV74('VUSA.L'),sx:trading212TradableV74('SXR8.DE'),no:trading212TradableV74('ZZZZ')};`;
global.L=(a,b)=>a; global.esc=x=>String(x); global.$=()=>null; global.window={};
try{eval(test);ok(global.__t212.n===7,'instrument parser accepts catalog rows');ok(global.__t212.a&&global.__t212.v&&global.__t212.b&&global.__t212.j&&global.__t212.sap&&global.__t212.vusa&&global.__t212.sx,'ticker normalization matches US/EU/JP/ETF/class-share and T212 European-listing suffix forms');ok(global.__t212.no===false,'missing ticker is correctly not available after catalog load')}catch(e){console.error(e);ok(false,'instrument parser runtime test')}
console.log(`RESULT ${pass}/${pass+fail}`);process.exit(fail?1:0);
