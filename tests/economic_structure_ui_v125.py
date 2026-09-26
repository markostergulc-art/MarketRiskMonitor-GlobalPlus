from pathlib import Path
js=Path('app/src/main/assets/economic_structure_v125.js').read_text()
app=Path('app.js').read_text()
idx=Path('app/src/main/assets/index.html').read_text()
start=js.find('function openEconomicStructure'); end=js.find('function closeEconomicStructure',start); open_fn=js[start:end]
checks={
'economic asset loaded':'economic_structure_v125.js' in idx,
'core hook':'MRMEconomicStructure.openEconomicStructure(code)' in app[app.find('function openMarket'):],
'extended hook':'MRMEconomicStructure.openEconomicStructure(code)' in app[app.find('function openExtendedCountry'):app.find('function returns')],
'context-only warning':'CONTEXT ONLY' in js and 'GA2' in js,
'composition default expanded':'<details open data-es-domain="broad"' in js,
'exports default expanded':'<details open data-es-domain="exports"' in js,
'minerals lazy toggle':"loadMinerals(code,false,false)" in js,
'agriculture lazy toggle':"loadAgriculture(code,false)" in js,
'tourism lazy toggle':"loadTourism(code,false)" in js,
'facilities nested lazy':"loadMinerals(code,false,true)" in js,
'no market-card change marker':'economicStructureV125' not in app[app.find('function marketCard'):app.find('function renderMarkets')],
'open loads only summary domains':'loadBroadStructure(code,false)' in open_fn and 'loadTrade(code,false)' in open_fn and 'loadMinerals(' not in open_fn and 'loadAgriculture(' not in open_fn and 'loadTourism(' not in open_fn,
'heavy sections are not default open':'<details id="esMineralsDetails" data-es-domain="minerals" open' not in js and '<details id="esAgricultureDetails" data-es-domain="agriculture" open' not in js and '<details id="esTourismDetails" data-es-domain="tourism" open' not in js,
}
for k,v in checks.items():
 print(('PASS' if v else 'FAIL'),k)
assert all(checks.values())
