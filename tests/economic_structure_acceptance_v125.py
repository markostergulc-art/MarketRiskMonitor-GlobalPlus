from pathlib import Path
import re
js=Path('app/src/main/assets/economic_structure_v125.js').read_text()
app=Path('app.js').read_text(); idx=Path('app/src/main/assets/index.html').read_text(); gradle=Path('app/build.gradle').read_text(); java=Path('app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java').read_text()
checks={
 'release version': "versionName '2026.09.26.2'" in gradle and 'versionCode 125' in gradle,
 'asset loaded once': idx.count('economic_structure_v125.js')==1,
 'canonical app once': idx.count(app)==1,
 'context only': 'contextOnly:true' in js and 'CONTEXT ONLY' in js,
 'world bank four indicators': all(x in js for x in ['NV.AGR.TOTL.ZS','NV.IND.TOTL.ZS','NV.IND.MANF.ZS','NV.SRV.TOTL.ZS']),
 'comtrade official': 'comtradeapi.un.org' in js and 'UN Comtrade' in js,
 'comtrade exact aggregation': all(x in js for x in ["customsCode)!=='C00'","Number(r.motCode)!==0","Number(r.partner2Code)!==0"]),
 'hs2': "classification:'HS2'" in js and "aggrLevel:2" in js,
 'trade shares': 'product value / total merchandise' in js and 'partner exports / total merchandise exports' in js,
 'usgs production': '2024MYBv3_Production_table.csv' not in js and 'USGS_PRODUCTION_URL' in js and 'parseUsgsProductionCsv' in js,
 'usgs facilities': 'USGS_FACILITIES_URL' in js and 'parseUsgsFacilitiesCsv' in js,
 'reserves fail closed': "reservesStatus:'N/A'" in js,
 'critical authority': 'classificationAuthority' in js and 'European Union' in js,
 'rare earth separate': 'rareEarth:' in js and 'CRITICAL' in js,
 'fao new endpoint': 'api.data.apps.fao.org/api/v2/bigquery' in js and 'fenixservices' not in js,
 'agri quantity': "rankingBasis:'PRODUCTION_QUANTITY'" in js and 'production_tonnes' in js,
 'tourism three indicators': all(x in js for x in ['ST.INT.ARVL','ST.INT.RCPT.CD','ST.INT.RCPT.XP.ZS']),
 'tourism recency': 'TOURISM_MAX_OBS_AGE_YEARS=4' in js,
 'core hook': 'MRMEconomicStructure.openEconomicStructure(code)' in app[app.find('function openMarket'):],
 'extended hook': 'MRMEconomicStructure.openEconomicStructure(code)' in app[app.find('function openExtendedCountry'):app.find('function returns')],
 'default expanded composition/exports': '<details open data-es-domain="broad"' in js and '<details open data-es-domain="exports"' in js,
 'lazy heavy domains': all(x in js for x in ["loadMinerals(code,false,false)","loadAgriculture(code,false)","loadTourism(code,false)","loadMinerals(code,false,true)"]),
 'native allowlist': all(('"'+h+'"') in java for h in ['comtradeapi.un.org','api.data.apps.fao.org','www.sciencebase.gov']),
 'sciencebase size exception': '10 * 1024 * 1024' in java and 'maxUpstreamBytesForHost' in java,
 'no scoring mutation': all(x not in js for x in ['globalRiskModel(','currentGlobalConditionV65(','leadingWarningLayerV65(','appState.global=','.risk=','.macroRisk=']),
 'null fail closed': "v!==null&&v!==''&&v!==undefined" in js,
}
for k,v in checks.items(): print(('PASS' if v else 'FAIL'),k)
assert all(checks.values()), [k for k,v in checks.items() if not v]
print(f'ECONOMIC STRUCTURE ACCEPTANCE: {sum(checks.values())}/{len(checks)} PASS')
