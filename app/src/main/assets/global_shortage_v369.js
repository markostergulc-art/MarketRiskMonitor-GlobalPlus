/* Global Shortage model GS1.1-v3.8 — carried forward unchanged in Market Risk Monitor Global+ 2026.09.26.1 / BUILD124
 * Global Shortage Early Warning
 * TRUE LAZY MODULE: this file is dynamically loaded only after an explicit Global Shortage tab click.
 * Physical-supply evidence is scored separately from price/market evidence. Missing evidence is omitted,
 * never converted to zero. Current public-source coverage is intentionally conservative: unsupported
 * chains remain N/A rather than receiving synthetic/demo values.
 */
(function(){
'use strict';
if(window.GlobalShortageV369)return;

const VERSION='GS1.1-v3.8';
const CACHE_KEY='mrmGlobalShortageV369';
const CACHE_TTL=6*60*60*1000;
const STALE_TTL=24*60*60*1000;
const STATUS_BANDS=[
  {max:19,label:'NORMAL'}, {max:39,label:'WATCH'}, {max:59,label:'TIGHT'},
  {max:79,label:'SHORTAGE'}, {max:100,label:'CRITICAL'}
];
const CATEGORY_ORDER=['Energy / Refined Products','Sulfur Chain','Industrial Metals','Uranium Fuel Chain','Critical Minerals','Industrial Gases','Logistics Bottlenecks','Electrical Grid Equipment','Semiconductor / Memory'];
const CATALOG=[
 ['diesel','Diesel / gasoil','Energy / Refined Products'],
 ['jet','Jet fuel','Energy / Refined Products'],
 ['usGas','U.S. natural gas storage','Energy / Refined Products'],
 ['euGas','EU natural gas storage','Energy / Refined Products'],
 ['refinery','Refinery / middle-distillate capacity','Energy / Refined Products'],
 ['sulfur','Elemental sulfur','Sulfur Chain'],['sulfuric','Sulfuric acid','Sulfur Chain'],['phosphate','Phosphate fertilizers','Sulfur Chain'],['dap','DAP','Sulfur Chain'],['map','MAP','Sulfur Chain'],
 ['copperConc','Copper concentrate','Industrial Metals'],['copperRefining','Copper refining constraints','Industrial Metals'],['nickelHpal','Nickel HPAL feedstock','Industrial Metals'],
 ['u3o8','U3O8','Uranium Fuel Chain'],['conversion','Uranium conversion','Uranium Fuel Chain'],['swu','Enrichment / SWU','Uranium Fuel Chain'],['fuelFab','Fuel fabrication','Uranium Fuel Chain'],
 ['gallium','Gallium','Critical Minerals'],['germanium','Germanium','Critical Minerals'],['yttrium','Yttrium','Critical Minerals'],['dysprosium','Dysprosium','Critical Minerals'],['terbium','Terbium','Critical Minerals'],['tungsten','Tungsten','Critical Minerals'],['antimony','Antimony','Critical Minerals'],['graphite','Graphite','Critical Minerals'],
 ['helium','Helium','Industrial Gases'],
 ['vlcc','VLCC tanker availability / rates','Logistics Bottlenecks'],['lngCarrier','LNG carrier constraints','Logistics Bottlenecks'],['hormuz','Strait of Hormuz','Logistics Bottlenecks'],['redSea','Suez / Red Sea','Logistics Bottlenecks'],['panama','Panama Canal','Logistics Bottlenecks'],
 ['hvTransformer','High-voltage transformers','Electrical Grid Equipment'],['distributionTransformer','Distribution transformers','Electrical Grid Equipment'],['switchgear','Switchgear','Electrical Grid Equipment'],['breakers','Circuit breakers','Electrical Grid Equipment'],['hvCable','High-voltage cable supply','Electrical Grid Equipment'],
 ['hbm','HBM','Semiconductor / Memory'],['dram','DRAM','Semiconductor / Memory'],['nand','NAND','Semiconductor / Memory'],['enterpriseSsd','Enterprise SSD supply','Semiconductor / Memory'],['advancedPackaging','Advanced packaging capacity','Semiconductor / Memory']
].map(([id,name,category])=>({id,name,category}));

const DEPENDENCIES=[
 {from:'sulfur',label:'Sulfur',to:[['sulfuric','Sulfuric Acid']]},
 {from:'sulfuric',label:'Sulfuric Acid',to:[['phosphate','Phosphate Fertilizer'],['copperConc','Copper SX-EW'],['nickelHpal','Nickel HPAL'],['u3o8','Uranium ISR']]},
 {from:'usGas',label:'Natural Gas',to:[['phosphate','Ammonia / Fertilizer']]},
 {from:'gallium',label:'Gallium / Germanium',to:[['advancedPackaging','Semiconductors / Fiber / Defense']]},
 {from:'diesel',label:'Diesel',to:[['vlcc','Logistics'],['copperConc','Mining'],['phosphate','Agriculture'],['hvTransformer','Construction']]}
];

const state={
 initialized:true,loading:false,openedAt:new Date().toISOString(),cacheState:'EMPTY',items:[],summary:null,
 sourcesOk:0,sourcesFailed:0,lastSuccessfulRefresh:null,lastAttempt:null,progress:{pct:0,phase:'',source:''},
 errors:[],cacheLoaded:false,rendered:false
};

function el(id){return document.getElementById(id)}
function clamp(v,a=0,b=100){return Math.max(a,Math.min(b,v))}
function finite(v){return Number.isFinite(v)}
function escv(v){try{return typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}catch(_){return String(v??'')}}
function num(v,d=1){if(!finite(v))return'N/A';try{return typeof fmt==='function'?fmt(v,d):Number(v).toFixed(d)}catch(_){return Number(v).toFixed(d)}}
function nowIso(){return new Date().toISOString()}
function statusForScore(score){if(!finite(score))return'N/A';let s=clamp(score);return s<20?'NORMAL':s<40?'WATCH':s<60?'TIGHT':s<80?'SHORTAGE':'CRITICAL'}
function statusRank(s){return({NORMAL:0,WATCH:1,TIGHT:2,SHORTAGE:3,CRITICAL:4,'N/A':-1})[s]??-1}
function statusClass(s){return 'gs-'+String(s||'N/A').toLowerCase().replace(/[^a-z]/g,'')}
function cacheAgeLabel(ts){let t=Date.parse(ts||'');if(!finite(t))return'EMPTY';let age=Date.now()-t;return age<=CACHE_TTL?'CACHED':age<=STALE_TTL?'STALE':'STALE'}
function safeJsonParse(v){try{return JSON.parse(v)}catch(_){return null}}
function readCache(){let raw=null;try{raw=typeof safeGet==='function'?safeGet(CACHE_KEY):localStorage.getItem(CACHE_KEY)}catch(_){}let c=safeJsonParse(raw);if(!c||!Array.isArray(c.items)||!c.generatedAt)return null;return c}
function writeCache(snapshot){try{let raw=JSON.stringify(snapshot);if(typeof safeSet==='function')safeSet(CACHE_KEY,raw);else localStorage.setItem(CACHE_KEY,raw)}catch(_){}}

function unavailable(base,reason='DATA UNAVAILABLE',source='No reliable public physical-supply adapter implemented in this release'){
 return {...base,status:'N/A',score:null,confidence:'LOW',trend:'N/A',cache:'N/A',why:[reason],evidence:[],source,observation:null,retrieved:null,sourceRetrievedAt:null,eligibleForCurrentScore:false,eligibilityReason:reason,signalType:'DATA UNAVAILABLE',confirmedPhysicalShortage:false,impact:'N/A',regions:['Current regional dependency: N/A'],priceSignal:'Not used',history:[]};
}
function strictDateLocalV38(v){let x=String(v??'').trim().slice(0,10),m=x.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;let y=+m[1],mo=+m[2],d=+m[3],t=new Date(Date.UTC(y,mo-1,d));return t.getUTCFullYear()===y&&t.getUTCMonth()===mo-1&&t.getUTCDate()===d?x:null}
function shortageMaxAgeDaysV38(id){return id==='euGas'?7:14}
function shortageObservationEligibilityV38(id,observation,nowMs=Date.now()){let d=strictDateLocalV38(observation);if(!d)return{eligible:false,reason:'INVALID_OR_MISSING_OBSERVATION_DATE',observationDate:null};let today=new Date(nowMs).toISOString().slice(0,10);if(d>today)return{eligible:false,reason:'FUTURE_OBSERVATION',observationDate:d};let age=(nowMs-new Date(d+'T23:59:59Z').getTime())/86400000,max=shortageMaxAgeDaysV38(id);return{eligible:age<=max,reason:age<=max?'ELIGIBLE':'STALE_OBSERVATION',observationDate:d,ageDays:Math.max(0,age),maxAgeDays:max}}
function shortageCachedItemV38(x,cacheGeneratedAt){if(!x||!finite(x.score))return x;let gate=shortageObservationEligibilityV38(x.id,x.observation),cg=Date.parse(cacheGeneratedAt||''),cacheExpired=!finite(cg)||Date.now()-cg>STALE_TTL;if(gate.eligible&&!cacheExpired)return{...x,eligibleForCurrentScore:true,eligibilityReason:'ELIGIBLE',cache:cacheAgeLabel(cacheGeneratedAt),sourceRetrievedAt:x.sourceRetrievedAt||x.retrieved||cacheGeneratedAt};return{...x,historicalScore:x.score,historicalStatus:x.status,status:'N/A',score:null,eligibleForCurrentScore:false,eligibilityReason:cacheExpired?'EXPIRED_CACHE':gate.reason,cache:'STALE',signalType:'HISTORICAL ONLY',confirmedPhysicalShortage:false,why:[cacheExpired?'Cached shortage snapshot exceeded the current-score TTL':`Historical observation retained but excluded from current score: ${gate.reason}`,...(x.why||[])].slice(0,4)}}
function baseItems(){return CATALOG.map(x=>unavailable({...x},'DATA UNAVAILABLE'))}
function getItem(id){return state.items.find(x=>x.id===id)}
function setItem(item){let i=state.items.findIndex(x=>x.id===item.id);if(i>=0)state.items[i]=item;else state.items.push(item)}
function weightedScore(parts){let valid=(parts||[]).filter(x=>x&&finite(x.risk)&&finite(x.weight)&&x.weight>0);let den=valid.reduce((a,x)=>a+x.weight,0);return den?valid.reduce((a,x)=>a+x.risk*x.weight,0)/den:null}
function impactFromStatus(status){return status==='NORMAL'?'LOW':status==='WATCH'?'MODERATE':status==='TIGHT'?'HIGH':(['SHORTAGE','CRITICAL'].includes(status)?'SEVERE':'N/A')}
function trendFromComparisons(weekPct,yoyPct){if(!finite(weekPct)||!finite(yoyPct))return'N/A';if(weekPct<-0.25&&yoyPct<0)return'DETERIORATING';if(weekPct>0.25&&yoyPct>0)return'IMPROVING';return'STABLE'}
function directInventoryItem(base,row,opts={}){
 if(!row||!finite(row.current)||!finite(row.yearAgo)||row.yearAgo<=0)return unavailable(base,'Required physical inventory comparison is unavailable',opts.source||'U.S. EIA');
 let eligibility=shortageObservationEligibilityV38(base.id,opts.observation);if(!eligibility.eligible){let u=unavailable(base,'Historical inventory retained but excluded from current score: '+eligibility.reason,opts.source||'U.S. EIA');return{...u,observation:eligibility.observationDate||opts.observation||null,retrieved:opts.retrieved||null,sourceRetrievedAt:opts.retrieved||null,cache:'STALE',eligibilityReason:eligibility.reason}};
 let yoy=finite(row.yoyPct)?row.yoyPct:100*(row.current-row.yearAgo)/row.yearAgo;
 let weekly=finite(row.previous)&&row.previous>0?100*(row.current-row.previous)/row.previous:null;
 /* Methodology: annual inventory deficit is the primary physical-supply signal (75%).
    A one-week draw is secondary context (25%) because a single weekly observation is noisy.
    A 25% YoY deficit maps to 100 risk; a 10% weekly draw maps to 100 risk. Positive changes add zero risk,
    but missing components are removed and valid weights are renormalized. */
 let evidence=[{label:'Inventory vs year ago',value:yoy,unit:'%',risk:clamp(Math.max(0,-yoy)*4),weight:.75,direct:true}];
 if(finite(weekly))evidence.push({label:'Weekly inventory change',value:weekly,unit:'%',risk:clamp(Math.max(0,-weekly)*10),weight:.25,direct:true});
 let score=weightedScore(evidence),status=statusForScore(score),why=[];
 if(yoy<0)why.push(`${Math.abs(yoy).toFixed(1)}% below year-ago inventory`);else why.push(`${yoy.toFixed(1)}% at/above year-ago inventory`);
 if(finite(weekly))why.push(`${weekly>=0?'+':''}${weekly.toFixed(1)}% weekly inventory change`);
 return {...base,status,score,confidence:evidence.length>=2?'MEDIUM':'LOW',trend:trendFromComparisons(weekly,yoy),cache:'LIVE',why,evidence,source:opts.source||'U.S. EIA Weekly Petroleum Status Report',sourceUrl:opts.sourceUrl||window.EIA_WPSR_TABLE4||'https://ir.eia.gov/wpsr/table4.csv',observation:eligibility.observationDate,retrieved:opts.retrieved||nowIso(),sourceRetrievedAt:opts.retrieved||null,eligibleForCurrentScore:true,eligibilityReason:'ELIGIBLE',signalType:'INVENTORY / STORAGE PRESSURE',confirmedPhysicalShortage:false,impact:impactFromStatus(status),regions:opts.regions||['United States: direct inventory evidence','Other regions: not inferred from U.S. stocks'],priceSignal:'Price excluded from Shortage Risk Score',history:[]};
}
function gasItem(base,w,opts={}){
 if(!w||!finite(w.current))return unavailable(base,'Required physical gas-storage data is unavailable','U.S. EIA');
 let eligibility=shortageObservationEligibilityV38(base.id,opts.observation);if(!eligibility.eligible){let u=unavailable(base,'Historical gas-storage observation retained but excluded from current score: '+eligibility.reason,'U.S. EIA');return{...u,observation:eligibility.observationDate||opts.observation||null,retrieved:opts.retrieved||null,sourceRetrievedAt:opts.retrieved||null,cache:'STALE',eligibilityReason:eligibility.reason}};
 let evidence=[];
 /* Gas scoring uses seasonal/annual storage deviations only. Weekly withdrawal/injection is displayed but not scored,
    because a raw weekly flow is strongly seasonal. A 20% deficit versus the five-year seasonal average maps to 100;
    a 25% deficit versus year ago maps to 100. */
 if(finite(w.fiveYearPct))evidence.push({label:'Storage vs 5Y seasonal average',value:w.fiveYearPct,unit:'%',risk:clamp(Math.max(0,-w.fiveYearPct)*5),weight:.65,direct:true});
 if(finite(w.yoyPct))evidence.push({label:'Storage vs year ago',value:w.yoyPct,unit:'%',risk:clamp(Math.max(0,-w.yoyPct)*4),weight:.35,direct:true});
 if(!evidence.length)return unavailable(base,'Seasonally comparable storage indicators are unavailable','U.S. EIA');
 let score=weightedScore(evidence),status=statusForScore(score),weekPct=finite(w.previous)&&w.previous>0?100*(w.current-w.previous)/w.previous:null,why=evidence.map(e=>`${e.label}: ${e.value>=0?'+':''}${e.value.toFixed(1)}%`);
 if(finite(w.change))why.push(`Weekly net flow: ${w.change>=0?'+':''}${num(w.change,0)} Bcf (context only)`);
 return {...base,status,score,confidence:evidence.length>=2?'MEDIUM':'LOW',trend:trendFromComparisons(weekPct,finite(w.yoyPct)?w.yoyPct:null),cache:'LIVE',why,evidence,source:'U.S. EIA Weekly Natural Gas Storage Report',sourceUrl:window.EIA_WNGSR||'https://ir.eia.gov/ngs/wngsr.json',observation:eligibility.observationDate,retrieved:opts.retrieved||nowIso(),sourceRetrievedAt:opts.retrieved||null,eligibleForCurrentScore:true,eligibilityReason:'ELIGIBLE',signalType:'INVENTORY / STORAGE PRESSURE',confirmedPhysicalShortage:false,impact:impactFromStatus(status),regions:['United States: direct storage evidence','LNG shipping availability: evaluated separately and currently N/A'],priceSignal:'Henry Hub/market price is not used in the physical score',history:[]};
}
function euGasItem(base,d){
 if(!d||!d.current||!finite(d.current.fill))return unavailable(base,'GIE AGSI+ physical storage data unavailable','GIE AGSI+');
 let eligibility=shortageObservationEligibilityV38(base.id,d.current.d);if(!eligibility.eligible){let u=unavailable(base,'Historical EU storage observation retained but excluded from current score: '+eligibility.reason,'GIE AGSI+');return{...u,observation:eligibility.observationDate||d.current.d||null,retrieved:d.retrievedAt||null,sourceRetrievedAt:d.retrievedAt||null,cache:'STALE',eligibilityReason:eligibility.reason}};
 let evidence=[],avg5=d.seasonal&&d.seasonal.avg5,pct=d.seasonal&&d.seasonal.percentile;
 if(finite(avg5)&&avg5>0){let rel=100*(d.current.fill-avg5)/avg5;evidence.push({label:'Storage fullness vs 5Y seasonal average',value:rel,unit:'%',risk:clamp(Math.max(0,-rel)*5),weight:.6,direct:true})}
 if(finite(pct)){evidence.push({label:'Seasonal storage percentile',value:pct,unit:'pctile',risk:clamp(100-pct),weight:.4,direct:true})}
 if(!evidence.length)return unavailable(base,'Current EU storage is available, but five-year seasonal context is insufficient for a shortage score','GIE AGSI+');
 let score=weightedScore(evidence),status=statusForScore(score),prev=d.previous&&finite(d.previous.fill)?d.previous.fill:null,dayChange=finite(prev)?d.current.fill-prev:null,seasonRel=evidence[0]&&evidence[0].label.includes('5Y')?evidence[0].value:null,why=[`Current storage fullness: ${num(d.current.fill,1)}%`];
 if(finite(avg5))why.push(`5Y seasonal average: ${num(avg5,1)}%`);if(finite(pct))why.push(`Seasonal percentile: ${num(pct,0)}`);
 let trend='N/A';if(finite(dayChange)&&finite(seasonRel)){if(dayChange<-.15&&seasonRel<0)trend='DETERIORATING';else if(dayChange>.15&&seasonRel>=0)trend='IMPROVING';else trend='STABLE'}
 let hist=(d.history||[]).filter(x=>x&&x.d&&finite(x.fill)).map(x=>({d:x.d,v:x.fill}));
 return {...base,status,score,confidence:(d.seasonal&&d.seasonal.annualCount>=3)?'HIGH':'MEDIUM',trend,cache:'LIVE',why,evidence,source:'GIE AGSI+',sourceUrl:'https://agsi.gie.eu/',observation:eligibility.observationDate,retrieved:d.retrievedAt||nowIso(),sourceRetrievedAt:d.retrievedAt||null,eligibleForCurrentScore:true,eligibilityReason:'ELIGIBLE',signalType:'INVENTORY / STORAGE PRESSURE',confirmedPhysicalShortage:false,impact:impactFromStatus(status),regions:['Europe: direct aggregated underground-storage evidence','Individual-country dependency is not inferred here'],priceSignal:'European gas price is not used in the physical score',history:hist,unit:'% full'};
}

function summarize(){
 let valid=state.items.filter(x=>finite(x.score)&&x.eligibleForCurrentScore!==false);
 let coverage={valid:valid.length,total:state.items.length,pct:state.items.length?100*valid.length/state.items.length:0};
 let den=valid.reduce((a,x)=>a+(finite(x.globalWeight)?x.globalWeight:1),0),score=den?valid.reduce((a,x)=>a+x.score*(finite(x.globalWeight)?x.globalWeight:1),0)/den:null;
 /* Coverage gate: do not publish a global shortage status from a small subset of chains. The numerical score is retained
    as an available-data diagnostic, but the headline becomes N/A below 25% monitored-chain coverage. */
 let headlineStatus=coverage.pct>=25&&finite(score)?statusForScore(score):'N/A';
 let counts={NORMAL:0,WATCH:0,TIGHT:0,SHORTAGE:0,CRITICAL:0,'N/A':0};state.items.forEach(x=>counts[x.status]=(counts[x.status]||0)+1);
 let conf=coverage.pct>=60?'HIGH':coverage.pct>=25?'MEDIUM':'LOW';
 state.summary={score,headlineStatus,counts,coverage,confidence:conf,updatedAt:state.lastSuccessfulRefresh||state.lastAttempt||nowIso()};
 return state.summary;
}
function currentCacheBadge(){if(state.loading)return state.cacheLoaded?'PARTIAL':'LIVE';if(state.errors.length&&state.items.some(x=>finite(x.score)))return'PARTIAL';if(state.cacheState==='CACHED'||state.cacheState==='STALE'||state.cacheState==='EMPTY')return state.cacheState;return state.sourcesOk>0?'LIVE':'EMPTY'}
function progress(pct,phase,source=''){state.progress={pct,phase,source};renderProgress();updateDiagnostics()}
function renderProgress(){let p=el('gsProgressV369');if(!p)return;if(!state.loading){p.innerHTML='';p.style.display='none';return}p.style.display='block';p.innerHTML=`<div class="gs-progress-head"><b>Loading Global Shortage…</b><span>${Math.round(state.progress.pct)}%</span></div><div class="gs-progress-track"><i style="width:${clamp(state.progress.pct)}%"></i></div><div class="gs-progress-phase">${escv(state.progress.phase||'Working…')}</div><div class="gs-progress-source">${escv(state.progress.source||'')}</div>`}
function badge(status){return`<span class="gs-badge ${statusClass(status)}">${escv(status)}</span>`}
function confBadge(c){return`<span class="gs-conf">CONF ${escv(c||'LOW')}</span>`}
function itemCard(x){let score=finite(x.score)?Math.round(x.score)+'/100':'N/A',why=(x.why||[])[0]||'DATA UNAVAILABLE';return`<button class="gs-item" data-gs-item="${escv(x.id)}"><div class="gs-item-top"><b>${escv(x.name)}</b>${badge(x.status)}</div><div class="gs-score">${score}</div><div class="gs-why">${escv(why)}</div><div class="gs-meta">${confBadge(x.confidence)} <span>${escv(x.signalType||'')}</span> <span>TREND ${escv(x.trend||'N/A')}</span> <span>${escv(x.cache||'')}</span></div></button>`}
function categoryHtml(cat){let arr=state.items.filter(x=>x.category===cat);return`<section class="gs-group"><div class="gs-group-title">${escv(cat)}</div><div class="gs-grid">${arr.map(itemCard).join('')}</div></section>`}
function topHtml(){let arr=state.items.filter(x=>finite(x.score)&&statusRank(x.status)>=1).sort((a,b)=>b.score-a.score).slice(0,6);if(!arr.length)return`<div class="gs-empty">No covered chain currently meets WATCH or higher. Low overall source coverage does not imply that uncovered chains are normal.</div>`;return arr.map((x,i)=>`<div class="gs-top-row" data-gs-item="${escv(x.id)}"><span>${i+1}</span><b>${escv(x.name)}</b>${badge(x.status)}<strong>${Math.round(x.score)}/100</strong><small>${escv((x.why||[])[0]||'')}</small></div>`).join('')}
function nodeStatus(id){let x=getItem(id);return x?x.status:'N/A'}
function transmissionHtml(){return DEPENDENCIES.map(d=>{let s=nodeStatus(d.from),active=statusRank(s)>=1;return`<div class="gs-chain ${active?'gs-chain-active':'gs-chain-neutral'}"><div>${badge(s)} <b>${escv(d.label)}</b></div><div class="gs-arrow">↓</div><div>${d.to.map(([id,l])=>`<span class="gs-chain-to ${active?statusClass(nodeStatus(id)):''}">${escv(l)} · ${escv(nodeStatus(id))}</span>`).join('')}</div></div>`}).join('')}
function summaryHtml(){let s=summarize(),display=finite(s.score)?Math.round(s.score):null;return`<div class="gs-summary"><div><div class="gs-kicker">GLOBAL SHORTAGE RISK</div><div class="gs-headline"><strong>${display===null?'N/A':display+' / 100'}</strong>${badge(s.headlineStatus)}</div><div class="gs-summary-note">${s.headlineStatus==='N/A'?'Headline status withheld because trustworthy physical coverage is below the 25% minimum. Available-data score is shown for audit only.':'Headline derived from covered physical-supply chains only.'}</div></div><div class="gs-counts"><span>Critical <b>${s.counts.CRITICAL}</b></span><span>Shortage <b>${s.counts.SHORTAGE}</b></span><span>Tight <b>${s.counts.TIGHT}</b></span><span>Watch <b>${s.counts.WATCH}</b></span><span>Normal <b>${s.counts.NORMAL}</b></span></div><div class="gs-summary-meta"><span>Last data update <b>${escv(s.updatedAt||'N/A')}</b></span><span>Coverage <b>${s.coverage.valid} / ${s.coverage.total}</b></span><span>Confidence <b>${s.confidence}</b></span><span>State <b>${currentCacheBadge()}</b></span></div></div>`}
function render(){let root=el('globalShortageContentV369');if(!root)return;state.rendered=true;root.innerHTML=`${summaryHtml()}<div class="gs-section-title">TOP ACTIVE SHORTAGES</div><div class="gs-top">${topHtml()}</div><div class="gs-section-title">SUPPLY CHAIN TRANSMISSION</div><div class="gs-transmission">${transmissionHtml()}</div>${CATEGORY_ORDER.map(categoryHtml).join('')}<div class="gs-foot">Price movements are context only. They do not create a physical-shortage alert. Unsupported chains remain N/A until a trustworthy public physical-supply adapter is available.</div>`;renderProgress();updateDiagnostics()}
function chartSvg(item){let h=(item.history||[]).filter(x=>x&&x.d&&finite(x.v));if(h.length<6)return'';let range=h.slice(-365),vals=range.map(x=>x.v),mn=Math.min(...vals),mx=Math.max(...vals),span=mx-mn||1,w=620,hh=170,p=18,pts=range.map((x,i)=>`${p+(w-2*p)*(i/(range.length-1))},${p+(hh-2*p)*(1-(x.v-mn)/span)}`).join(' '),start=range[0].d,end=range.at(-1).d;return`<div class="gs-chart-meta"><b>Time range:</b> ${escv(start)} → ${escv(end)} · <b>Units:</b> ${escv(item.unit||'index')} · <b>Source:</b> ${escv(item.source||'N/A')} · <b>Latest observation:</b> ${escv(end)}</div><svg class="gs-chart" viewBox="0 0 ${w} ${hh}" role="img" aria-label="${escv(item.name)} history"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`}
function openDetail(id){let x=getItem(id);if(!x)return;let m=el('gsDetailV369');if(!m)return;let evidence=(x.evidence||[]).map(e=>`<div class="gs-detail-row"><span>${escv(e.label)}</span><b>${finite(e.value)?num(e.value,1)+' '+escv(e.unit||''): 'N/A'}</b></div>`).join('')||'<div class="gs-na">No valid scoring evidence.</div>',why=(x.why||[]).map(v=>`<li>${escv(v)}</li>`).join('');m.innerHTML=`<div class="gs-modal-card"><button class="gs-close" data-gs-close>×</button><div class="gs-kicker">${escv(x.category)}</div><h2>${escv(x.name)}</h2><div class="gs-detail-status">${badge(x.status)} <strong>${finite(x.score)?Math.round(x.score)+'/100':'N/A'}</strong> ${confBadge(x.confidence)}</div><div class="gs-detail-row"><span>Signal type</span><b>${escv(x.signalType||'N/A')}</b></div><div class="gs-detail-row"><span>Confirmed physical shortage</span><b>${x.confirmedPhysicalShortage?'YES':'NO'}</b></div><h3>Why?</h3><ul>${why}</ul><h3>Physical supply evidence</h3>${evidence}<div class="gs-detail-row"><span>Trend</span><b>${escv(x.trend)}</b></div><div class="gs-detail-row"><span>Potential downstream impact</span><b>${escv(x.impact)}</b></div><h3>Regional exposure</h3><ul>${(x.regions||[]).map(v=>`<li>${escv(v)}</li>`).join('')}</ul><h3>Price signal</h3><p>${escv(x.priceSignal||'Not used')}</p><h3>Sources / timestamps</h3><div class="gs-detail-row"><span>Source</span><b>${escv(x.source||'N/A')}</b></div><div class="gs-detail-row"><span>Observation</span><b>${escv(x.observation||'N/A')}</b></div><div class="gs-detail-row"><span>Retrieved</span><b>${escv(x.retrieved||'N/A')}</b></div>${chartSvg(x)}</div>`;m.classList.add('show')}
function closeDetail(){let m=el('gsDetailV369');if(m)m.classList.remove('show')}
function installEvents(){if(window.__gsEventsV369)return;window.__gsEventsV369=true;document.addEventListener('click',e=>{let c=e.target.closest&&e.target.closest('[data-gs-item]');if(c){e.preventDefault();openDetail(c.dataset.gsItem);return}if(e.target.closest&&e.target.closest('[data-gs-close]')){e.preventDefault();closeDetail()}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&el('gsDetailV369')&&el('gsDetailV369').classList.contains('show'))closeDetail()})}
function installCss(){if(el('gsStyleV369'))return;let s=document.createElement('style');s.id='gsStyleV369';s.textContent=`
#shortage{padding-bottom:88px}.gs-progress-slot{min-height:92px}.gs-progress-head{display:flex;justify-content:space-between;gap:12px}.gs-progress-track{height:7px;border-radius:10px;background:var(--line,#d7dce3);overflow:hidden;margin:8px 0}.gs-progress-track i{display:block;height:100%;background:var(--accent,#1677ff);transition:width .2s ease}.gs-progress-phase{font-weight:700}.gs-progress-source,.gs-summary-note,.gs-why,.gs-foot,.gs-chart-meta{font-size:12px;opacity:.78}.gs-summary,.gs-group,.gs-transmission,.gs-top{background:var(--card,#fff);border:1px solid var(--line,#d9dee6);border-radius:14px;padding:12px;margin:10px 0}.gs-kicker,.gs-section-title,.gs-group-title{font-size:12px;font-weight:800;letter-spacing:.06em}.gs-headline{display:flex;align-items:center;gap:10px;margin:5px 0}.gs-headline strong{font-size:24px}.gs-badge,.gs-conf{display:inline-flex;align-items:center;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:800;border:1px solid currentColor}.gs-normal{color:#3c7d52}.gs-watch,.gs-tight{color:#a56b05}.gs-shortage,.gs-critical{color:#a63b36}.gs-na{color:#6d7581}.gs-counts,.gs-summary-meta,.gs-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.gs-counts span,.gs-summary-meta span,.gs-meta span,.gs-conf{font-size:10px}.gs-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;margin-top:8px}.gs-item{appearance:none;width:100%;text-align:left;background:var(--bg,#f7f8fa);color:inherit;border:1px solid var(--line,#d9dee6);border-radius:12px;padding:10px}.gs-item-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.gs-score{font-size:18px;font-weight:800;margin:6px 0}.gs-meta{opacity:.72}.gs-top-row{display:grid;grid-template-columns:22px 1fr auto auto;gap:7px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line,#e2e5ea)}.gs-top-row:last-child{border-bottom:0}.gs-top-row small{grid-column:2/5;opacity:.75}.gs-chain{padding:9px;border-bottom:1px solid var(--line,#e2e5ea)}.gs-chain:last-child{border-bottom:0}.gs-chain-neutral{opacity:.65}.gs-arrow{padding-left:18px}.gs-chain-to{display:inline-block;margin:3px 5px 0 0;padding:3px 6px;border:1px solid var(--line,#d9dee6);border-radius:8px}.gs-foot{padding:12px 4px}.gs-modal{display:none;position:fixed;z-index:9999;inset:0;background:rgba(0,0,0,.55);padding:20px;overflow:auto}.gs-modal.show{display:block}.gs-modal-card{position:relative;max-width:760px;margin:3vh auto;background:var(--card,#fff);color:inherit;border-radius:16px;padding:18px;border:1px solid var(--line,#d9dee6)}.gs-close{position:absolute;right:12px;top:10px;border:0;background:transparent;color:inherit;font-size:27px}.gs-detail-status{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.gs-detail-row{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--line,#e2e5ea);padding:7px 0}.gs-detail-row b{text-align:right}.gs-chart{width:100%;height:170px;margin-top:8px;border:1px solid var(--line,#d9dee6);border-radius:10px}.gs-chart-meta{margin-top:12px}.gs-empty{font-size:12px;opacity:.78}.gs-progress-panel{background:var(--card,#fff);border:1px solid var(--line,#d9dee6);border-radius:12px;padding:10px}
`;document.head.appendChild(s)}
function updateDiagnostics(){let d=el('shortageDiagnosticsV369');if(!d)return;let cov=state.summary&&state.summary.coverage||{valid:0,total:CATALOG.length};d.innerHTML=`<div class="small"><b>Module:</b> Global Shortage<br><b>Initialized:</b> YES<br><b>Initialization trigger:</b> USER_TAB_CLICK<br><b>Cache:</b> ${escv(currentCacheBadge())}<br><b>Coverage:</b> ${cov.valid} / ${cov.total}<br><b>Sources OK:</b> ${state.sourcesOk}<br><b>Sources failed:</b> ${state.sourcesFailed}<br><b>Last successful refresh:</b> ${escv(state.lastSuccessfulRefresh||'N/A')}</div>`}
function loadCachedSnapshot(){let c=readCache();if(!c)return false;state.cacheState=cacheAgeLabel(c.generatedAt);state.items=c.items.map(x=>shortageCachedItemV38(x,c.generatedAt));state.summary=null;state.lastSuccessfulRefresh=c.generatedAt||null;state.cacheLoaded=true;state.sourcesOk=0;state.sourcesFailed=Number(c.sourcesFailed)||0;summarize();render();return true}
function markUnsupported(ids,reason,source){for(const id of ids){let x=getItem(id);if(x&&!finite(x.score))setItem(unavailable({...x},reason,source))}}
function setUnavailableUnlessCached(id,reason,source){let x=getItem(id);if(x&&finite(x.score)&&x.eligibleForCurrentScore!==false&&state.cacheLoaded)return false;if(x)setItem(unavailable({...x},reason,source));return true}
async function loadEnergy(force){
 let results=await Promise.allSettled([
   typeof ensureUsOilV24==='function'?ensureUsOilV24(force):Promise.reject(new Error('EIA petroleum adapter unavailable')),
   typeof ensureUsGasV24==='function'?ensureUsGasV24(force):Promise.reject(new Error('EIA gas adapter unavailable'))
 ]);
 if(results[0].status==='fulfilled'){
   let d=(window.commodityV19&&commodityV19.usOil&&commodityV19.usOil.data)||results[0].value||{},x=d.stocks||{},baseD=getItem('diesel'),baseJ=getItem('jet'),di=directInventoryItem(baseD,x.distillate,{observation:x.date,retrieved:d.retrievedAt,regions:['United States: direct EIA distillate stocks','Europe / Asia: not inferred from U.S. inventory']}),ji=directInventoryItem(baseJ,x.jet,{observation:x.date,retrieved:d.retrievedAt,regions:['United States: direct EIA jet-fuel stocks','Other regions: not inferred from U.S. inventory']});
   setItem(di);setItem(ji);if([di,ji].some(x=>finite(x.score)&&x.eligibleForCurrentScore!==false))state.sourcesOk++;else{state.sourcesFailed++;state.errors.push('EIA petroleum: no eligible current observation')}
   markUnsupported(['refinery'],'Refinery utilization/outage evidence is not independently loaded by this release; distillate stocks are shown under Diesel without double-counting.','U.S. EIA adapter not implemented for this indicator');
 }else{state.sourcesFailed++;state.errors.push('EIA petroleum: '+String(results[0].reason&&results[0].reason.message||results[0].reason||'failed'));setUnavailableUnlessCached('diesel','SOURCE TEMPORARILY UNAVAILABLE','U.S. EIA Weekly Petroleum Status Report');setUnavailableUnlessCached('jet','SOURCE TEMPORARILY UNAVAILABLE','U.S. EIA Weekly Petroleum Status Report')}
 render();progress(23,'Loading U.S. natural-gas storage…','U.S. EIA Weekly Natural Gas Storage Report');
 if(results[1].status==='fulfilled'){
   let d=(window.commodityV19&&commodityV19.usGas&&commodityV19.usGas.data)||results[1].value||{},w=d.weekly&&d.weekly.total,gi=gasItem(getItem('usGas'),w,{observation:d.weekly&&d.weekly.date,retrieved:d.retrievedAt});setItem(gi);if(finite(gi.score)&&gi.eligibleForCurrentScore!==false)state.sourcesOk++;else{state.sourcesFailed++;state.errors.push('EIA gas: no eligible current observation')}
 }else{state.sourcesFailed++;state.errors.push('EIA gas: '+String(results[1].reason&&results[1].reason.message||results[1].reason||'failed'));setUnavailableUnlessCached('usGas','SOURCE TEMPORARILY UNAVAILABLE','U.S. EIA Weekly Natural Gas Storage Report')}
 render();
 progress(30,'Loading EU gas storage when configured…','GIE AGSI+');
 if(typeof agsiKeyConfigured==='function'&&agsiKeyConfigured()&&typeof ensureEuGasV33==='function'){
   try{let d=await ensureEuGasV33(force,true);if(d){let ei=euGasItem(getItem('euGas'),d);setItem(ei);if(finite(ei.score)&&ei.eligibleForCurrentScore!==false)state.sourcesOk++;else{state.sourcesFailed++;state.errors.push('GIE AGSI+: no eligible current observation')}}else throw new Error('No EU gas data')}catch(e){state.sourcesFailed++;state.errors.push('GIE AGSI+: '+String(e&&e.message||e));setUnavailableUnlessCached('euGas','SOURCE TEMPORARILY UNAVAILABLE · cached aggregate retained if present','GIE AGSI+')}
 }else{setUnavailableUnlessCached('euGas','DATA UNAVAILABLE · GIE AGSI+ key not configured','GIE AGSI+')}
 render();
}
function snapshot(){let s=summarize();return{version:VERSION,generatedAt:state.lastSuccessfulRefresh||nowIso(),items:state.items,summary:s,sourcesOk:state.sourcesOk,sourcesFailed:state.sourcesFailed}}
async function refresh(force=false){if(state.loading)return;state.loading=true;state.lastAttempt=nowIso();state.errors=[];state.sourcesOk=0;state.sourcesFailed=0;if(!state.items.length)state.items=baseItems();progress(4,'Restoring cached shortage snapshot…','Local cache');render();
 try{
   progress(12,'Loading Energy / Refined Products…','Existing EIA/GIE adapters');await loadEnergy(force);
   progress(38,'Checking sulfur and fertilizer coverage…','Authoritative physical-supply adapter coverage');markUnsupported(['sulfur','sulfuric','phosphate','dap','map'],'DATA UNAVAILABLE · no reliable public physical-supply adapter implemented in this release','USGS / USDA / company primary-source adapter pending');render();
   progress(46,'Checking industrial metals…','Physical concentrate / smelter evidence');markUnsupported(['copperConc','copperRefining','nickelHpal'],'DATA UNAVAILABLE · no stable public TC/RC / feedstock adapter implemented; copper spot price is intentionally not used as a substitute','USGS / company / exchange primary-source adapter pending');render();
   progress(54,'Checking nuclear fuel cycle…','U3O8 / conversion / SWU / fabrication');markUnsupported(['u3o8','conversion','swu','fuelFab'],'DATA UNAVAILABLE · fuel-cycle stages require separate trustworthy physical-capacity sources','IAEA / DOE / company primary-source adapter pending');render();
   progress(62,'Checking critical minerals…','Export / concentration evidence');markUnsupported(['gallium','germanium','yttrium','dysprosium','terbium','tungsten','antimony','graphite'],'DATA UNAVAILABLE · annual structural context alone is not promoted to a current shortage signal','USGS / customs primary-source adapter pending');render();
   progress(70,'Checking helium…','Producer outage / allocation evidence');markUnsupported(['helium'],'DATA UNAVAILABLE · current producer outage/allocation feed not available through a stable primary adapter','Producer / government primary-source adapter pending');render();
   progress(77,'Checking logistics bottlenecks…','Tanker / chokepoint physical evidence');markUnsupported(['vlcc','lngCarrier','hormuz','redSea','panama'],'DATA UNAVAILABLE · no stable public real-time physical shipping adapter implemented in this release','Port / government / freight primary-source adapter pending');render();
   progress(84,'Checking electrical grid equipment…','Lead-time / backlog evidence');markUnsupported(['hvTransformer','distributionTransformer','switchgear','breakers','hvCable'],'DATA UNAVAILABLE · structural lead-time series not available through a stable machine-readable public adapter','DOE / IEA / utility / manufacturer primary-source adapter pending');render();
   progress(91,'Checking semiconductor bottlenecks…','HBM / memory / packaging physical capacity');markUnsupported(['hbm','dram','nand','enterpriseSsd','advancedPackaging'],'DATA UNAVAILABLE · price commentary is not accepted as proof of physical shortage','Manufacturer / regulatory primary-source adapter pending');render();
   progress(96,'Calculating shortage scores and confidence…','Valid physical evidence only');summarize();
   if(state.sourcesOk>0){state.lastSuccessfulRefresh=nowIso();state.cacheState='LIVE';writeCache(snapshot())}else if(!state.cacheLoaded){state.cacheState='EMPTY'}
   progress(100,state.sourcesOk>0?'Global Shortage refresh complete':'Global Shortage refresh completed with no live source success','Observation dates retained separately from retrieval time');
 }catch(e){state.sourcesFailed++;state.errors.push(String(e&&e.message||e));state.cacheState=state.cacheLoaded?'STALE':'EMPTY'}finally{state.loading=false;summarize();render();updateDiagnostics()}
}
async function init(){installCss();installEvents();if(!state.items.length)state.items=baseItems();let had=loadCachedSnapshot();if(!had)render();await refresh(false)}
function manualRefresh(){return refresh(true)}
function getDiagnostics(){let cov=state.summary&&state.summary.coverage||{valid:0,total:CATALOG.length};return{module:'Global Shortage',initialized:true,initializationTrigger:'USER_TAB_CLICK',cache:currentCacheBadge(),coverage:`${cov.valid}/${cov.total}`,sourcesOk:state.sourcesOk,sourcesFailed:state.sourcesFailed,lastSuccessfulRefresh:state.lastSuccessfulRefresh,errors:[...state.errors]}}
function getSnapshot(){return snapshot()}
window.GlobalShortageV369={version:VERSION,state,init,refresh:manualRefresh,render,getDiagnostics,getSnapshot,statusForScore,weightedScore};
})();
