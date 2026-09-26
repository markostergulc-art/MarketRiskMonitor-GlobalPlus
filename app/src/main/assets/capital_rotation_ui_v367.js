'use strict';
/* v3.6.7 / BUILD117 · Consolidated Capital Rotation UI.
   Presentation-only layer: each U.S. sector appears once. Tapping the sector opens
   all Daily Rotation metrics plus BUILD116 contributor/breadth/driver attribution.
   No Capital Rotation scoring, provider, cache or freshness formula is modified. */
(function(){
function cr117L(hr,en){try{return typeof L==='function'?L(hr,en):(String(window.currentLang||'en')==='hr'?hr:en)}catch(_){return en}}
function cr117Esc(x){try{return typeof esc==='function'?esc(x):String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}catch(_){return String(x??'')}}
function cr117Fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'N/A'}
function cr117Pct(v,d=2){return Number.isFinite(v)?`${v>=0?'+':''}${Number(v).toFixed(d)}%`:'N/A'}
function cr117Score(v){return Number.isFinite(v)?`${v>0?'+':''}${Math.round(v)}`:'N/A'}
function cr117Flag(r){if(!r)return'';if(r.reversal==='POSITIVE')return cr117L('POZITIVNI REVERSAL','POSITIVE REVERSAL');if(r.reversal==='NEGATIVE')return cr117L('NEGATIVNI REVERSAL','NEGATIVE REVERSAL');if(r.newLeader)return cr117L('NOVI LIDER','NEW LEADER');if(r.newLaggard)return cr117L('NOVI LAGGARD','NEW LAGGARD');return''}
function cr117SectorCard(r){
 const m=r.metric||{},id=r.def&&r.def.id||'',symbol=r.def&&r.def.symbol||'',flag=cr117Flag(r);
 const history=(r.history5||[]).map(x=>Number.isFinite(x.score)?`${x.score>0?'+':''}${Math.round(x.score)}`:'—').join(' · ');
 return `<details class="cr117-sector ${capitalRotationDailyStatusClassV115(r.score)}" data-cr117-sector="${cr117Esc(id)}">
  <summary>
   <div class="cr117-sector-name"><b>${cr117Esc(capitalRotationDailyLabelV115(r.def))} · ${cr117Esc(symbol)}</b><span>${cr117Esc(r.status)} · ${cr117Esc(r.confidence)}${flag?' · '+cr117Esc(flag):''}</span></div>
   <div class="cr117-summary-metrics"><span><small>1D</small><b>${cr117Pct(m.sectorReturn)}</b></span><span><small>Excess</small><b>${cr117Pct(r.dailyExcess)}</b></span><span><small>Score</small><b>${cr117Score(r.score)}</b></span><span><small>Rank</small><b>${Number.isFinite(r.rank)?'#'+r.rank:'N/A'}</b></span></div>
  </summary>
  <div class="cr117-detail">
   ${capitalRotationScoreBarV70(r.score)}
   <div class="cr117-detail-grid">
    <div><span>${cr117Esc(cr117L('Sektor 1D','Sector 1D'))}</span><b>${cr117Pct(m.sectorReturn)}</b></div>
    <div><span>SPY 1D</span><b>${cr117Pct(m.benchmarkReturn)}</b></div>
    <div><span>1D excess vs SPY</span><b>${cr117Pct(r.dailyExcess)}</b></div>
    <div><span>${cr117Esc(cr117L('Dnevni score','Daily score'))}</span><b>${cr117Score(r.score)}</b></div>
    <div><span>${cr117Esc(cr117L('Dnevni rang','Daily rank'))}</span><b>${Number.isFinite(r.rank)?'#'+r.rank:'N/A'}</b></div>
    <div><span>${cr117Esc(cr117L('Promjena ranga','Rank change'))}</span><b>${Number.isFinite(r.rankChange)?`${r.rankChange>0?'+':''}${r.rankChange}`:'N/A'}</b></div>
    <div><span>${cr117Esc(cr117L('5D kontekst','5D context'))}</span><b>${cr117Pct(m.fiveDayExcess)}</b></div>
    <div><span>${cr117Esc(cr117L('Prethodni score','Previous score'))}</span><b>${cr117Score(r.previousScore)}</b></div>
    <div><span>${cr117Esc(cr117L('Ubrzanje','Acceleration'))}</span><b>${cr117Score(r.acceleration)}</b></div>
    <div><span>${cr117Esc(cr117L('Observacija','Observation'))}</span><b>${cr117Esc(m.date||'N/A')}</b></div>
    <div><span>${cr117Esc(cr117L('Signal','Signal'))}</span><b>${cr117Esc(r.persistence||'N/A')}</b></div>
    <div><span>${cr117Esc(cr117L('Pouzdanost','Confidence'))}</span><b>${cr117Esc(r.confidence||'N/A')}</b></div>
   </div>
   <div class="cr117-history"><span>5 sessions</span><b>${cr117Esc(history||'N/A')}</b></div>
   <div id="cr116_attr_${cr117Esc(id)}" class="cr116-attr"><div class="cr116-empty"><b>${cr117Esc(cr117L('Što je pokrenulo signal?','What drove the move?'))}</b><span>${cr117Esc(cr117L('Dionice, breadth, ETF težine i commodity/macro potvrda učitavaju se tek kada otvoriš ovaj sektor.','Stocks, breadth, ETF weights and commodity/macro confirmation load only when this sector is opened.'))}</span></div></div>
  </div>
 </details>`;
}
function cr117SectorList(daily){
 const rows=capitalRotationDailySortRowsV115(daily.current.rows||[]);
 return `<div class="cr117-toolbar"><div><b>${cr117Esc(cr117L('SEKTORI · JEDAN RED PO OBLASTI','SECTORS · ONE ENTRY PER AREA'))}</b><span>${cr117Esc(cr117L('Klikni sektor za sve detalje i konkretne dionice iza signala.','Tap a sector for all metrics and the concrete stocks behind the signal.'))}</span></div><select id="crDailySortV115"><option value="score">${cr117Esc(cr117L('Daily Score','Daily Score'))}</option><option value="excess">${cr117Esc(cr117L('Excess 1D','Excess 1D'))}</option><option value="rankChange">${cr117Esc(cr117L('Promjena ranga','Rank Change'))}</option><option value="acceleration">${cr117Esc(cr117L('Ubrzanje','Acceleration'))}</option><option value="fiveDay">${cr117Esc(cr117L('5D kontekst','5D Context'))}</option><option value="alpha">A–Z</option></select></div><div class="cr117-sector-list">${rows.map(cr117SectorCard).join('')}</div>`;
}
function cr117BindSectors(){
 for(const d of document.querySelectorAll('details[data-cr117-sector]'))if(!d.dataset.cr117Bound){
  d.dataset.cr117Bound='1';
  d.addEventListener('toggle',()=>{if(d.open&&typeof ensureCapitalRotationContributorV116==='function')ensureCapitalRotationContributorV116(d.getAttribute('data-cr117-sector'),false)});
  if(d.open&&typeof ensureCapitalRotationContributorV116==='function')ensureCapitalRotationContributorV116(d.getAttribute('data-cr117-sector'),false);
 }
}
function cr117Render(){
 const root=typeof $==='function'?$('capitalRotationContent'):document.getElementById('capitalRotationContent');if(!root)return;
 const nav=typeof $==='function'?$('rotationNavLabel'):document.getElementById('rotationNavLabel');if(nav)nav.textContent=cr117L('ROTACIJA','ROTATION');
 if(capitalRotationV70.status==='loading'){
  const pct=capitalRotationV70.total?Math.round(100*capitalRotationV70.done/capitalRotationV70.total):0,steps=[cr117L('Učitavam dnevne sektorske podatke…','Loading daily sector data…'),cr117L('Validiram zadnju završenu sesiju…','Validating latest completed session…'),cr117L('Poravnavam sektore sa SPY benchmarkom…','Aligning sectors with the SPY benchmark…'),cr117L('Računam 1D excess i dnevni ranking…','Calculating 1D excess and daily ranking…'),cr117L('Provjeravam volumen i cross-asset potvrdu…','Checking volume and cross-asset confirmation…'),cr117L('Računam reversal i acceleration…','Calculating reversal and acceleration…')],msg=steps[Math.min(steps.length-1,Math.floor(pct/18))];
  root.innerHTML=`<div class="cr-loading"><b>${cr117Esc(msg)}</b><span>${capitalRotationV70.done}/${capitalRotationV70.total} · ${pct}%</span><div class="refresh-progress-track"><i style="width:${pct}%"></i></div></div>`;return;
 }
 const snap=capitalRotationSnapshotV70(),d=snap.daily,r=d.regime,refreshNote=capitalRotationV70.validating?` · ${cr117Esc(cr117L('provjera svježine u tijeku','freshness validation in progress'))}`:'',freshMeta=`<div class="cr-meta"><b>DATA ${cr117Esc(d.dataStatus)}</b> · ${cr117Esc(cr117L('Podaci do','Data through'))}: ${cr117Esc(d.expected||'N/A')} · ${cr117Esc(cr117L('Prethodna sesija','Previous session'))}: ${cr117Esc(d.previousDate||'N/A')} · ${cr117Esc(cr117L('Dohvaćeno','Retrieved'))}: ${cr117Esc(snap.retrievedAt?new Date(snap.retrievedAt).toLocaleString():'N/A')}${refreshNote}</div>`;
 const breadth=Number.isFinite(r.breadthPct)?`${Math.round(r.breadthPct)}%`:'N/A',risk=Number.isFinite(r.riskAppetite)?`${r.riskAppetite>0?'+':''}${r.riskAppetite}`:'N/A';
 root.innerHTML=`<div class="cr-hero ${capitalRotationDailyStatusClassV115(r.score)}"><div><span>${cr117Esc(cr117L('DNEVNA CAPITAL ROTATION','DAILY CAPITAL ROTATION'))}</span><b>${cr117Esc(r.label)}</b><small>${cr117Esc(cr117L('Posljednja završena sesija','Latest completed session'))}: ${cr117Esc(d.expected||'N/A')}</small></div><div><span>${cr117Esc(cr117L('KONSOLIDIRANI PRIKAZ','CONSOLIDATED VIEW'))}</span><strong>${d.current.coverage}/${d.current.total} ${cr117Esc(cr117L('sektora','sectors'))}</strong><p>${cr117Esc(cr117L('Svaki sektor je prikazan samo jednom. Otvori ga za score, trend, konkretne dionice, breadth i drivere.','Each sector is shown once. Open it for score, trend, concrete stocks, breadth and drivers.'))}</p></div></div>${freshMeta}<div class="cr-daily-kpis"><div><span>${cr117Esc(cr117L('Rotation breadth','Rotation breadth'))}</span><b>${cr117Esc(breadth)}</b><small>${d.current.coverage}/${d.current.total} ${cr117Esc(cr117L('valjanih sektora','valid sectors'))}</small></div><div><span>${cr117Esc(cr117L('Daily Risk Appetite','Daily Risk Appetite'))}</span><b>${cr117Esc(risk)}</b><small>-100 risk-off · +100 risk-on</small></div><div><span>${cr117Esc(cr117L('Growth vs Defensive','Growth vs Defensive'))}</span><b>${Number.isFinite(r.growthSpread)?`${r.growthSpread>0?'+':''}${Math.round(r.growthSpread)}`:'N/A'}</b></div><div><span>${cr117Esc(cr117L('Cyclical vs Defensive','Cyclical vs Defensive'))}</span><b>${Number.isFinite(r.cyclicalSpread)?`${r.cyclicalSpread>0?'+':''}${Math.round(r.cyclicalSpread)}`:'N/A'}</b></div></div><button id="capitalRotationRefresh" class="seg cr-refresh">${cr117Esc(cr117L('OSVJEŽI DNEVNU ROTACIJU','REFRESH DAILY ROTATION'))}</button>${cr117SectorList(d)}<div class="section-title">${cr117Esc(cr117L('REGIONALNA DNEVNA ROTACIJA','REGIONAL DAILY ROTATION'))}</div><div class="panel">${snap.regions.map(x=>`<div class="cr-region-row"><span>${cr117Esc(x.label)}<small>${cr117Esc(x.source||'')} · ${cr117Esc(x.date||'N/A')} · DATA ${cr117Esc(x.dataStatus||'N/A')}</small></span><b>${Number.isFinite(x.score)?`${x.score>0?'+':''}${x.score}`:'N/A'}</b><em>${cr117Esc(x.status)}</em></div>`).join('')}<div class="small">${cr117Esc(cr117L('Relativni dnevni signal, ne mjereni prekogranični tok kapitala.','Daily relative signal, not measured cross-border fund flow.'))}</div></div><div class="section-title">${cr117Esc(cr117L('METODOLOGIJA','METHODOLOGY'))}</div><div class="panel small"><b>${cr117Esc(CAPITAL_ROTATION_METHOD_V70)}</b> · 1D excess vs SPY 45% · cross-sectional rank 20% · volume confirmation 15% · constituent breadth 10% when reliable · cross-asset confirmation 10%. ${cr117Esc(cr117L('5D je kontekst. Contributor/breadth/driver sloj se učitava unutar istog sektora i ne mijenja raw Daily Score.','5D is context. The contributor/breadth/driver layer loads inside the same sector and does not change the raw Daily Score.'))}</div>`;
 setTimeout(()=>{
  const b=typeof $==='function'?$('capitalRotationRefresh'):document.getElementById('capitalRotationRefresh');if(b)b.onclick=()=>ensureCapitalRotationV70(true);
  const sel=typeof $==='function'?$('crDailySortV115'):document.getElementById('crDailySortV115');if(sel){sel.value=capitalRotationDailySortV115;sel.onchange=e=>{capitalRotationDailySortV115=e.target.value;renderCapitalRotationV70()}}
  cr117BindSectors();
 },0);
}
function cr117InjectCss(){if(document.getElementById('cr117-style'))return;const s=document.createElement('style');s.id='cr117-style';s.textContent=`.cr117-toolbar{display:flex;justify-content:space-between;gap:10px;align-items:end;margin:11px 0 7px}.cr117-toolbar>div b,.cr117-toolbar>div span{display:block}.cr117-toolbar>div b{font-size:.72rem}.cr117-toolbar>div span{font-size:.59rem;color:var(--muted);margin-top:2px}.cr117-toolbar select{max-width:138px;font-size:.62rem}.cr117-sector-list{display:grid;gap:7px}.cr117-sector{border:1px solid var(--line);border-radius:11px;background:var(--panel);overflow:hidden}.cr117-sector>summary{list-style:none;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:8px;align-items:center;padding:10px 11px;cursor:pointer}.cr117-sector>summary::-webkit-details-marker{display:none}.cr117-sector>summary:after{content:'›';font-size:1rem;color:var(--muted);grid-column:3;grid-row:1;align-self:center}.cr117-sector[open]>summary:after{transform:rotate(90deg)}.cr117-sector-name b,.cr117-sector-name span{display:block}.cr117-sector-name b{font-size:.74rem}.cr117-sector-name span{font-size:.57rem;color:var(--muted);margin-top:2px}.cr117-summary-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.cr117-summary-metrics span{min-width:0;text-align:right}.cr117-summary-metrics small,.cr117-summary-metrics b{display:block}.cr117-summary-metrics small{font-size:.49rem;color:var(--muted)}.cr117-summary-metrics b{font-size:.66rem;white-space:nowrap}.cr117-detail{border-top:1px solid var(--line);padding:9px 10px 0}.cr117-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:8px 0}.cr117-detail-grid>div{border:1px solid var(--line);border-radius:8px;background:var(--bg);padding:6px 7px}.cr117-detail-grid span,.cr117-detail-grid b{display:block}.cr117-detail-grid span{font-size:.53rem;color:var(--muted)}.cr117-detail-grid b{font-size:.65rem;margin-top:2px}.cr117-history{display:flex;justify-content:space-between;gap:8px;font-size:.56rem;color:var(--muted);padding:0 1px 8px}.cr117-history b{color:var(--text);font-weight:600}.cr117-sector .cr116-attr{margin:0 -10px}.cr117-sector.strong-inflow,.cr117-sector.inflow{border-left:3px solid var(--good)}.cr117-sector.strong-outflow,.cr117-sector.outflow{border-left:3px solid var(--bad)}@media(max-width:520px){.cr117-sector>summary{grid-template-columns:1fr;padding-right:26px;position:relative}.cr117-sector>summary:after{position:absolute;right:9px;top:50%;transform:translateY(-50%)}.cr117-sector[open]>summary:after{transform:translateY(-50%) rotate(90deg)}.cr117-summary-metrics{text-align:left}.cr117-summary-metrics span{text-align:left}.cr117-toolbar{align-items:start}.cr117-toolbar select{max-width:118px}.cr117-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
 document.head.appendChild(s)}
try{
 cr117InjectCss();
 if(typeof renderCapitalRotationV70==='function')renderCapitalRotationV70=cr117Render;
 window.__CR117_TEST__={sectorCard:cr117SectorCard,sectorList:cr117SectorList};
 setTimeout(()=>{try{if(typeof renderCapitalRotationV70==='function'&&document.getElementById('capitalRotationContent'))renderCapitalRotationV70()}catch(_){}},0);
}catch(e){try{console.warn('BUILD117 consolidated Capital Rotation UI unavailable',e)}catch(_){}}
})();
