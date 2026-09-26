const fs=require('fs');
const src=fs.readFileSync('app.js','utf8');
function extract(name){
 const re=new RegExp('(?:async\\s+)?function\\s+'+name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\s*\\('),m=re.exec(src); if(!m) throw new Error('missing '+name);
 const start=m.index, brace=src.indexOf('{',m.index+m[0].length); let depth=0,q=null,esc=false;
 for(let i=brace;i<src.length;i++){const c=src[i]; if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue;} if(c==='\''||c==='"'||c==='`'){q=c;continue;} if(c==='{')depth++; else if(c==='}'&&--depth===0)return src.slice(start,i+1);}
 throw new Error('unclosed '+name);
}
const funcs=['commodityHtmlText','v19Num','v24IsoDate','v24RowsFromCsv','v24FindCsvMetric','parseUsOilWpsrV24','parseUsGasWeeklyV24','parseAgsiPayloadV33','c32PctRank','v34CsvCells','v34MonthlyPct','v34IndexStats','parseFaoFoodCsvV34','parseFaoFoodPageV34','v34DimEntries','v34JsonStatValue','v34FindDim','v34SingleDim','v34BaseCoord','v34Series','v34PctChangeSeries','v34Median','v34OilFlow','v34OilProduct','v34OilUnit','parseEurostatOilAggregateV34','parseEurostatOilMinimumV34','parseEurostatOilCountryStocksV34','parseEurostatOilDaysV34'];
for(const n of funcs) eval(extract(n));
let pass=0,fail=0;function check(n,c){if(c){console.log('PASS - '+n);pass++}else{console.log('FAIL - '+n);fail++}}
function throws(fn){try{fn();return false}catch(e){return true}}
const oil=fs.readFileSync('tests/fixtures/eia_wpsr_table4_sample.csv','utf8');
const gas=JSON.parse(fs.readFileSync('tests/fixtures/eia_wngsr_sample.json','utf8'));
const agsi=JSON.parse(fs.readFileSync('tests/fixtures/gie_agsi_eu_sample.json','utf8'));
const faoCsv=fs.readFileSync('tests/fixtures/v35134/fao_food_price_indices_sample.csv','utf8');
const faoPage=fs.readFileSync('tests/fixtures/v35134/fao_current_page_sample.txt','utf8');
const oilAgg=JSON.parse(fs.readFileSync('tests/fixtures/v35134/eurostat_nrg_stk_oilm_aggregate.json','utf8'));
const oilCountries=JSON.parse(fs.readFileSync('tests/fixtures/v35134/eurostat_nrg_stk_oilm_countries.json','utf8'));
const oemAgg=JSON.parse(fs.readFileSync('tests/fixtures/v35134/eurostat_nrg_stk_oem_aggregate.json','utf8'));
const oemCountries=JSON.parse(fs.readFileSync('tests/fixtures/v35134/eurostat_nrg_stk_oem_countries.json','utf8'));

let o=parseUsOilWpsrV24(oil); check('US Oil normal response unchanged',o.date==='2026-09-04'&&o.commercial.current===424.069&&o.cushing.current===21.824);
let g=parseUsGasWeeklyV24(gas); check('US Gas normal response unchanged',g.date==='2026-09-04'&&g.total.current===3254&&g.total.fiveYear===3106);
let a=parseAgsiPayloadV33(agsi); check('AGSI normal response unchanged',a.gasDay==='2026-09-12'&&a.rows.length===3&&a.rows.at(-1).fill===78.17);
check('AGSI invalid key classification unchanged',throws(()=>parseAgsiPayloadV33({error:'Access denied: invalid API key'})));

let f=parseFaoFoodCsvV34(faoCsv);check('FAO CSV normal response',f.date==='2026-08'&&f.food.current===133.3&&f.cereals.current===116.3&&f.vegetableOils.current===196.9&&f.sugar.current===106.4);
check('FAO CSV monthly change',Math.abs(f.food.momPct-((133.3-130.8)/130.8*100))<1e-9);
check('FAO CSV BOM accepted',parseFaoFoodCsvV34('\uFEFF'+faoCsv).food.current===133.3);
check('FAO CSV blank line accepted',parseFaoFoodCsvV34(faoCsv.replace('\n2025-01','\n\n2025-01')).food.current===133.3);
let missing=faoCsv.replace(/2026-08,133\.3,127\.9,119\.2,116\.3,196\.9,106\.4/,'2026-08,133.3,127.9,,116.3,196.9,106.4');let mf=parseFaoFoodCsvV34(missing);check('FAO CSV missing field remains null, never zero',mf.dairy.current===null&&mf.dairy.momPct===null&&mf.dairy.position12m===null);
check('FAO CSV renamed expected column fails closed',throws(()=>parseFaoFoodCsvV34(faoCsv.replace('Food Price Index','Food Index'))));
check('FAO CSV malformed numeric fails closed',throws(()=>parseFaoFoodCsvV34(faoCsv.replace('2026-08,133.3','2026-08,bad'))));
check('FAO CSV empty fails closed',throws(()=>parseFaoFoodCsvV34('')));
check('FAO CSV HTML/error page fails closed',throws(()=>parseFaoFoodCsvV34('<html>Access denied</html>')));
let fh=parseFaoFoodPageV34(faoPage);check('FAO official-page fallback parses current prose',fh.date==='2026-09-04'&&fh.food.current===133.3&&fh.sugar.current===106.4);

let ea=parseEurostatOilAggregateV34(oilAgg);check('Eurostat EU aggregate parses',ea.emergencyKt>108000&&ea.commercialKt>46000&&ea.observation==='2026-08');
check('Eurostat monthly/yoy analytics calculate',Number.isFinite(ea.monthlyPct)&&Number.isFinite(ea.yoyPct));
check('Eurostat product composition parses',ea.products.crude&&Number.isFinite(ea.products.crude.emergency.v)&&ea.products.diesel&&Number.isFinite(ea.products.diesel.emergency.v));
let em=parseEurostatOilMinimumV34(oemAgg);check('Eurostat minimum compliance stock parses',em.current.d==='2026-06'&&em.current.v===96800);
let ec=parseEurostatOilCountryStocksV34(oilCountries);check('Eurostat country stocks EU27 only',ec.length===3&&!ec.some(x=>x.geo==='AL'));
check('Eurostat country reporting lag preserved',ec.find(x=>x.geo==='FR').observation==='2026-05');
check('Eurostat provisional status preserved',ec.find(x=>x.geo==='AT').status==='p');
let ed=parseEurostatOilDaysV34(oemCountries);check('Eurostat country days parses legal method',ed.find(x=>x.geo==='AT').days===95&&ed.find(x=>x.geo==='AT').requiredDays===90&&ed.find(x=>x.geo==='AT').bufferDays===5);
check('Eurostat inland consumption threshold',ed.find(x=>x.geo==='FR').days===64&&ed.find(x=>x.geo==='FR').requiredDays===61&&ed.find(x=>x.geo==='FR').observation==='2026-05');
check('Eurostat daily denominators not misread as days',!ed.some(x=>x.days===28.5||x.days===31.2));
check('Eurostat null JSON-stat value stays missing',(()=>{let x=JSON.parse(JSON.stringify(oilCountries));let idx=x.value.findIndex(v=>v===23000);x.value[idx]=null;let r=parseEurostatOilCountryStocksV34(x).find(z=>z.geo==='DE');return r&&r.emergencyKt!==0})());
check('Eurostat missing dimension fails closed',throws(()=>parseEurostatOilAggregateV34({class:'dataset',id:['time'],size:[1],dimension:{time:{category:{index:{'2026-01':0},label:{'2026-01':'2026-01'}}}},value:[1]})));
check('Eurostat renamed emergency flow fails closed',(()=>{let x=JSON.parse(JSON.stringify(oilAgg));x.dimension.stk_flow.category.label.STKCL_EU_EMERG='Unknown stock category';return throws(()=>parseEurostatOilAggregateV34(x))})());

const fw=extract('fetchWithTimeout');check('Existing timeout/stale-cache path retained',fw.includes('AbortController')&&fw.includes('readHttpCache(url,type,true)'));
const vf=extract('v34ObservedFetch');check('v34 provider cache-first + stale fallback',vf.includes("state:'CACHED'")&&vf.includes("state:'STALE'")&&vf.includes('AbortController'));
console.log(`RESULT: ${pass}/${pass+fail} PASS`);process.exit(fail?1:0);
