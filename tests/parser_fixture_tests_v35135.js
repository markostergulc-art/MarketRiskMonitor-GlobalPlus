const fs=require('fs');
const src=fs.readFileSync('app.js','utf8');
function extract(name){
 const re=new RegExp('(?:async\\s+)?function\\s+'+name.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\s*\\('),m=re.exec(src); if(!m) throw new Error('missing '+name);
 const start=m.index, brace=src.indexOf('{',m.index+m[0].length); let depth=0,q=null,esc=false;
 for(let i=brace;i<src.length;i++){const c=src[i];if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}if(c==='\''||c==='"'||c==='`'){q=c;continue}if(c==='{')depth++;else if(c==='}'&&--depth===0)return src.slice(start,i+1)}throw new Error('unclosed '+name);
}
const funcs=['c32PctRank','v34MonthlyPct','v34DimEntries','v34JsonStatValue','v34FindDim','v34SingleDim','v34BaseCoord','v34Series','v34PctChangeSeries','v34Median','v34OilFlow','v34OilProduct','v34OilUnit','parseEurostatOilCountryStocksV34','parseEurostatOilDaysV34','v35Eu27','v35EurostatOilDefs','v35AggregateOil','v35OemMinimumAggregate','v35ProductBreakdown','v35EurostatUrl','v35ClassifyFetchError'];
for(const n of funcs) eval(extract(n));
let pass=0,fail=0;function check(n,c){if(c){console.log('PASS - '+n);pass++}else{console.log('FAIL - '+n);fail++}}
function throws(fn){try{fn();return false}catch(e){return true}}
const oilCountries=JSON.parse(fs.readFileSync('tests/fixtures/v35134/eurostat_nrg_stk_oilm_countries.json','utf8'));
const oemCountries=JSON.parse(fs.readFileSync('tests/fixtures/v35134/eurostat_nrg_stk_oem_countries.json','utf8'));
const defs=v35EurostatOilDefs(oilCountries);
check('Probe schema discovers official unit',defs.unit.code==='THS_T');
check('Probe schema discovers total product',defs.total.code==='O4000');
check('Probe schema discovers emergency flow',defs.emergency.code==='STKCL_EU_EMERG');
check('Probe schema discovers commercial flow',defs.commercial.code==='STKCL_COM');
check('Repeated Eurostat filters preserved',(()=>{let u=v35EurostatUrl('https://x',{geo:['DE','FR'],lastTimePeriod:3});return /geo=DE/.test(u)&&/geo=FR/.test(u)&&/lastTimePeriod=3/.test(u)})());
let agg=v35AggregateOil(oilCountries,defs,2);
check('EU aggregate built from country observations, not fake EU27 geo',agg.observation==='2026-06'&&agg.coverageEmergency>=2&&Number.isFinite(agg.emergencyKt));
check('EU aggregate coverage always explicit',agg.intended===27&&Number.isInteger(agg.coverageEmergency));
check('Missing country remains missing / no zero fabrication',(()=>{let x=JSON.parse(JSON.stringify(oilCountries));let idx=x.value.findIndex(v=>v===23000);if(idx>=0)x.value[idx]=null;let a=v35AggregateOil(x,v35EurostatOilDefs(x),2);return Number.isFinite(a.emergencyKt)&&a.emergencyKt!==0})());
check('Insufficient coverage fails closed',throws(()=>v35AggregateOil(oilCountries,defs,20)));
let oemMin=JSON.parse(JSON.stringify(oemCountries));oemMin.value[1]=30000;oemMin.value[3]=40000;oemMin.value[5]=25000;let min=v35OemMinimumAggregate(oemMin,2);
check('OEM minimum stock quantity aggregates country data',min.v===95000&&min.coverage===3&&min.d==='2026-06');
check('OEM missing minimum quantity fails closed',throws(()=>v35OemMinimumAggregate(oemCountries,2)));
let days=parseEurostatOilDaysV34(oemCountries);
check('OEM country days preserves 90-day net-import method',days.some(x=>x.requiredDays===90));
check('OEM country days preserves 61-day inland-consumption method',days.some(x=>x.requiredDays===61));
check('OEM daily denominators are not misread as cover days',!days.some(x=>x.days===28.5||x.days===31.2));
check('Unknown/renamed emergency flow fails closed',(()=>{let x=JSON.parse(JSON.stringify(oilCountries));x.dimension.stk_flow.category.label.STKCL_EU_EMERG='Unknown';return throws(()=>v35EurostatOilDefs(x))})());
check('HTTP error classification',v35ClassifyFetchError(Object.assign(new Error('HTTP 400'),{code:'HTTP_ERROR'}))==='HTTP_ERROR');
check('CORS/network error classification',v35ClassifyFetchError(new TypeError('Failed to fetch'))==='NETWORK_OR_CORS');
check('Timeout classification',v35ClassifyFetchError(Object.assign(new Error('aborted'),{name:'AbortError'}))==='TIMEOUT');
// Food fixtures retained from v34
for(const n of ['v34CsvCells','v34MonthlyPct','v34IndexStats','parseFaoFoodCsvV34','parseFaoFoodPageV34']) eval(extract(n));
const faoCsv=fs.readFileSync('tests/fixtures/v35134/fao_food_price_indices_sample.csv','utf8');
let f=parseFaoFoodCsvV34(faoCsv);
check('FAO official CSV parser current fixture',f.date==='2026-08'&&f.food.current===133.3&&f.cereals.current===116.3&&f.vegetableOils.current===196.9);
check('FAO HTML-as-CSV fails closed',throws(()=>parseFaoFoodCsvV34('<html>error</html>')));
check('FAO renamed column fails closed',throws(()=>parseFaoFoodCsvV34(faoCsv.replace('Food Price Index','Food Index'))));
check('FAO missing field does not become zero',(()=>{let x=faoCsv.replace(/2026-08,133\.3,127\.9,119\.2,116\.3,196\.9,106\.4/,'2026-08,133.3,127.9,,116.3,196.9,106.4');let z=parseFaoFoodCsvV34(x);return z.dairy.current===null})());
console.log(`RESULT: ${pass}/${pass+fail} PASS`);process.exit(fail?1:0);
