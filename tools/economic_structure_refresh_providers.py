"""Build-time providers for the Economic Structure verified local snapshot.
These functions are never imported by runtime WebView code.
"""
from __future__ import annotations
import csv, io, json, re, urllib.parse
from datetime import datetime, timezone

WB_STRUCTURE={
 'agriculturePctGdp':'NV.AGR.TOTL.ZS','industryPctGdp':'NV.IND.TOTL.ZS',
 'manufacturingPctGdp':'NV.IND.MANF.ZS','servicesPctGdp':'NV.SRV.TOTL.ZS'}
WB_TOURISM={
 'arrivals':('ST.INT.ARVL','arrivals'),
 'receipts':('ST.INT.RCPT.CD','USD'),
 'receiptsPctExports':('ST.INT.RCPT.XP.ZS','%')}

def _iso_now(): return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')

def _json_get(http_get,url):
    b,h,s=http_get(url,accept='application/json'); return json.loads(b.decode('utf-8-sig')), _iso_now()

def _wb_latest(http_get,iso3,indicator,max_rows=12):
    url=f'https://api.worldbank.org/v2/country/{urllib.parse.quote(iso3)}/indicator/{urllib.parse.quote(indicator)}?format=json&mrnev={max_rows}&per_page={max_rows}'
    j,retrieved=_json_get(http_get,url)
    rows=j[1] if isinstance(j,list) and len(j)>1 and isinstance(j[1],list) else []
    for r in rows:
        if r and r.get('value') is not None:
            try: v=float(r['value'])
            except Exception: continue
            return {'value':v,'period':str(r.get('date') or ''),'retrieved':retrieved,'url':url}
    return None

def refresh_worldbank(db,universe,refreshed_at,http_get,helpers):
    clear=helpers['clear_domain']; status=helpers['set_domain_status']; ins=helpers['insert_obs']
    ok=partial=0
    for c in universe:
        cc,iso=c['code'],c['iso3']
        clear(db,cc,'composition'); rows=[]
        for metric,indicator in WB_STRUCTURE.items():
            try:
                r=_wb_latest(http_get,iso,indicator)
                if r:
                    rows.append((metric,indicator,r)); ins(db,cc,'composition',metric,metric,r['value'],None,'% GDP',None,r['period'],r['period'],'World Bank WDI','World Development Indicators',indicator,None,r['url'],r['retrieved'],refreshed_at)
            except Exception: pass
        if rows:
            periods=[int(x[2]['period']) for x in rows if x[2]['period'].isdigit()]
            st='VERIFIED SNAPSHOT' if len(rows)==len(WB_STRUCTURE) else 'PARTIAL'; ok+=st=='VERIFIED SNAPSHOT'; partial+=st=='PARTIAL'
            status(db,cc,'composition',st,refreshed_at,str(max(periods)) if periods else None,'World Bank WDI','World Development Indicators',max(x[2]['retrieved'] for x in rows),None if st=='VERIFIED SNAPSHOT' else 'Some WDI structure indicators unavailable')
        else: status(db,cc,'composition','N/A',refreshed_at,provider='World Bank WDI',dataset='World Development Indicators',error='No validated composition observation')

        clear(db,cc,'tourism'); trows=[]
        for metric,(indicator,unit) in WB_TOURISM.items():
            try:
                r=_wb_latest(http_get,iso,indicator)
                if r:
                    trows.append((metric,indicator,unit,r)); ins(db,cc,'tourism',metric,metric,r['value'],None,unit,None,r['period'],r['period'],'World Bank WDI','World Development Indicators',indicator,None,r['url'],r['retrieved'],refreshed_at)
            except Exception: pass
        if trows:
            periods=[int(x[3]['period']) for x in trows if x[3]['period'].isdigit()]
            st='VERIFIED SNAPSHOT' if len(trows)==len(WB_TOURISM) else 'PARTIAL'
            status(db,cc,'tourism',st,refreshed_at,str(max(periods)) if periods else None,'World Bank WDI','World Development Indicators',max(x[3]['retrieved'] for x in trows),None if st=='VERIFIED SNAPSHOT' else 'Some tourism indicators unavailable')
        else: status(db,cc,'tourism','N/A',refreshed_at,provider='World Bank WDI',dataset='World Development Indicators',error='No validated non-null tourism observation')
    db.commit(); return {'countries':len(universe),'compositionFull':ok,'compositionPartial':partial}

# --- Comtrade ---
COMTRADE='https://comtradeapi.un.org/public/v1/preview/C/A/HS'
REPORTER={"USA":840,"CHN":156,"JPN":392,"IND":356,"GBR":826,"FRA":250,"DEU":276,"CAN":124,"TWN":158,"HRV":191,"PHL":608,"HKG":344,"KOR":410,"CHE":756,"SAU":682,"AUS":36,"BRA":76,"MEX":484,"NLD":528,"ESP":724,"ITA":380,"SWE":752,"DNK":208,"NOR":578,"FIN":246,"BEL":56,"POL":616,"TUR":792,"ZAF":710,"SGP":702,"IDN":360,"MYS":458,"THA":764,"ARE":784,"ISR":376,"CHL":152,"ARG":32,"AUT":40,"IRL":372,"PRT":620,"GRC":300,"CZE":203,"HUN":348,"ROU":642,"SVK":703,"SVN":705,"BGR":100,"SRB":688,"UKR":804,"LTU":440,"LVA":428,"EST":233,"LUX":442,"ISL":352,"NZL":554,"VNM":704,"PAK":586,"BGD":50,"LKA":144,"KAZ":398,"UZB":860,"AZE":31,"GEO":268,"MNG":496,"COL":170,"PER":604,"ECU":218,"URY":858,"PAN":591,"CRI":188,"DOM":214,"EGY":818,"NGA":566,"MAR":504,"KEN":404,"ETH":231,"DZA":12,"AGO":24,"QAT":634,"KWT":414,"OMN":512,"BHR":48,"JOR":400,"IRN":364,"IRQ":368,"TUN":788}
COUNTRY_CODES=set(REPORTER.values())

def _ct_get(http_get,params):
    q=dict(params);q.update({'customsCode':'C00','motCode':0,'partner2Code':0,'maxRecords':500,'includeDesc':'true'})
    url=COMTRADE+'?'+urllib.parse.urlencode(q); j,retrieved=_json_get(http_get,url)
    if not isinstance(j,dict) or not isinstance(j.get('data'),list): raise RuntimeError('Invalid Comtrade payload')
    return j['data'],retrieved,url

def _exact(r,reporter,period,flow,partner=None,aggr=None,cmd=None):
    try:
        if int(r.get('reporterCode'))!=reporter or str(r.get('period'))!=str(period) or str(r.get('flowCode'))!=flow:return False
        if str(r.get('customsCode'))!='C00' or int(r.get('motCode'))!=0 or int(r.get('partner2Code'))!=0:return False
        if partner is not None and int(r.get('partnerCode'))!=partner:return False
        if aggr is not None and int(r.get('aggrLevel'))!=aggr:return False
        if cmd is not None and str(r.get('cmdCode'))!=str(cmd):return False
        float(r.get('primaryValue')); return True
    except Exception:return False

def _uniq(rows,key):
    out={};bad=set()
    for r in rows:
        k=str(key(r));v=float(r['primaryValue'])
        if k in out and float(out[k]['primaryValue'])!=v: bad.add(k)
        else: out[k]=r
    return [r for k,r in out.items() if k not in bad]

def refresh_comtrade(db,universe,refreshed_at,http_get,helpers):
    clear=helpers['clear_domain']; status=helpers['set_domain_status']; ins=helpers['insert_obs']; year=datetime.now(timezone.utc).year-1; full=0
    for c in universe:
        cc,rep=c['code'],REPORTER.get(c['iso3'])
        for d in ('exports','destinations','imports'): clear(db,cc,d)
        if not rep:
            for d in ('exports','destinations','imports'):status(db,cc,d,'N/A',refreshed_at,provider='UN Comtrade',dataset='Annual merchandise trade',error='No reporter mapping')
            continue
        chosen=None; last_error=None
        for y in range(year,year-4,-1):
            try:
                ex,rt1,u1=_ct_get(http_get,{'reporterCode':rep,'period':y,'flowCode':'X','partnerCode':0,'cmdCode':'AG2'})
                dest,rt2,u2=_ct_get(http_get,{'reporterCode':rep,'period':y,'flowCode':'X','cmdCode':'TOTAL'})
                im,rt3,u3=_ct_get(http_get,{'reporterCode':rep,'period':y,'flowCode':'M','partnerCode':0,'cmdCode':'AG2'})
                imtot,rt4,u4=_ct_get(http_get,{'reporterCode':rep,'period':y,'flowCode':'M','partnerCode':0,'cmdCode':'TOTAL'})
                ex2=sorted(_uniq([r for r in ex if _exact(r,rep,y,'X',0,2) and re.fullmatch(r'\d{2}',str(r.get('cmdCode','')))],lambda r:r['cmdCode']),key=lambda r:float(r['primaryValue']),reverse=True)
                totals=[r for r in dest if _exact(r,rep,y,'X',0,0,'TOTAL')]; total_ex=_uniq(totals,lambda r:'TOTAL'); total_ex=total_ex[0] if len(total_ex)==1 else None
                dr=sorted(_uniq([r for r in dest if _exact(r,rep,y,'X',None,0,'TOTAL') and int(r.get('partnerCode',0)) in COUNTRY_CODES and int(r.get('partnerCode',0))!=0],lambda r:r['partnerCode']),key=lambda r:float(r['primaryValue']),reverse=True)
                im2=sorted(_uniq([r for r in im if _exact(r,rep,y,'M',0,2) and re.fullmatch(r'\d{2}',str(r.get('cmdCode','')))],lambda r:r['cmdCode']),key=lambda r:float(r['primaryValue']),reverse=True)
                it=[r for r in imtot if _exact(r,rep,y,'M',0,0,'TOTAL')]; total_im=_uniq(it,lambda r:'TOTAL'); total_im=total_im[0] if len(total_im)==1 else None
                if ex2 or dr or im2: chosen=(y,ex2,total_ex,dr,im2,total_im,max(rt1,rt2,rt3,rt4),u1,u2,u3,u4);break
            except Exception as e:last_error=str(e)
        if not chosen:
            for d in ('exports','destinations','imports'): status(db,cc,d,'N/A',refreshed_at,provider='UN Comtrade',dataset='Annual merchandise trade',error=last_error or 'No validated annual trade data')
            continue
        y,ex2,total_ex,dr,im2,total_im,rt,u1,u2,u3,u4=chosen
        tex=float(total_ex['primaryValue']) if total_ex else None; tim=float(total_im['primaryValue']) if total_im else None
        for rank,r in enumerate(ex2[:10],1):
            v=float(r['primaryValue']);share=v/tex*100 if tex and tex>0 else None
            ins(db,cc,'exports','topExport',r.get('cmdDesc'),v,None,'USD',rank,str(y),str(y),'UN Comtrade','Annual merchandise trade',str(r['cmdCode']),'HS2',u1,rt,refreshed_at,{'sharePct':share,'shareFormula':'product export value / total merchandise exports'})
        for rank,r in enumerate(dr[:10],1):
            v=float(r['primaryValue']);share=v/tex*100 if tex and tex>0 else None
            ins(db,cc,'destinations','exportDestination',r.get('partnerDesc'),v,None,'USD',rank,str(y),str(y),'UN Comtrade','Annual merchandise trade','PARTNER:'+str(r['partnerCode']),'Partner country',u2,rt,refreshed_at,{'sharePct':share,'shareFormula':'partner exports / total merchandise exports','partnerCode':int(r['partnerCode'])})
        for rank,r in enumerate(im2[:10],1):
            v=float(r['primaryValue']);share=v/tim*100 if tim and tim>0 else None
            ins(db,cc,'imports','topImport',r.get('cmdDesc'),v,None,'USD',rank,str(y),str(y),'UN Comtrade','Annual merchandise trade',str(r['cmdCode']),'HS2',u3,rt,refreshed_at,{'sharePct':share,'shareFormula':'product import value / total merchandise imports'})
        status(db,cc,'exports','VERIFIED SNAPSHOT' if ex2 else 'N/A',refreshed_at,str(y),'UN Comtrade','Annual merchandise trade',rt,None if ex2 else 'No HS2 export rows')
        status(db,cc,'destinations','VERIFIED SNAPSHOT' if dr else 'N/A',refreshed_at,str(y),'UN Comtrade','Annual merchandise trade',rt,None if dr else 'No partner rows')
        status(db,cc,'imports','VERIFIED SNAPSHOT' if im2 else 'N/A',refreshed_at,str(y),'UN Comtrade','Annual merchandise trade',rt,None if im2 else 'No HS2 import rows')
        full+=1
    db.commit();return {'countries':len(universe),'countriesWithTrade':full}


# --- USGS Minerals Yearbook 2024 ---
USGS_PRODUCTION_URL='https://www.sciencebase.gov/catalog/file/get/6a8490171ba49b3133cd8055?f=__disk__dc%2Fde%2Fe2%2Fdcdee2cc3de8311e6245db9cb11b1d09459a8065'
USGS_FACILITIES_URL='https://www.sciencebase.gov/catalog/file/get/6a8490171ba49b3133cd8055?f=__disk__81%2F38%2Feb%2F8138ebd0356ad02efcda21627f8d94f7ef108ae7'
USGS_DATASET='USGS 2024 Minerals Yearbook, volume III — International'
USGS_ALIASES={
 'KOR':['Korea, Republic Of','Republic of Korea','South Korea'],'TUR':['Turkey','Türkiye'],'CZE':['Czechia','Czech Republic'],
 'VNM':['Vietnam','Viet Nam'],'GBR':['United Kingdom'],'USA':['United States'],'ARE':['United Arab Emirates'],
 'BIH':['Bosnia and Herzegovina'],'IRN':['Iran'],'TWN':['Taiwan']}
CRITICAL_TERMS=('antimony','arsenic','bauxite','baryte','beryllium','bismuth','boron','cobalt','coking coal','copper','feldspar','fluorspar','gallium','germanium','hafnium','helium','lithium','magnesium','manganese','natural graphite','nickel','niobium','phosphate rock','phosphorus','platinum','rare earth','scandium','silicon metal','strontium','tantalum','titanium','tungsten','vanadium')

def _csv_dicts(blob):
    text=blob.decode('utf-8-sig',errors='replace') if isinstance(blob,(bytes,bytearray)) else str(blob)
    return list(csv.DictReader(io.StringIO(text)))

def _country_names(c):
    names={c['name'].strip().lower()}
    names.update(x.lower() for x in USGS_ALIASES.get(c['iso3'],[]))
    return names

def _usgs_period(row):
    for k in ('Time Period','Year','Publication Year'):
        v=(row.get(k) or '').strip()
        m=re.search(r'(19|20)\d{2}',v)
        if m:return m.group(0)
    return None

def _critical_meta(group,commodity):
    txt=((group or '')+' '+(commodity or '')).lower()
    return {'rareEarth':('rare earth' in txt),'criticalUnderEU':any(t in txt for t in CRITICAL_TERMS),'classificationAuthority':'European Union','classificationVintage':'Critical Raw Materials Act / 2023 list context'}

def refresh_usgs(db,universe,refreshed_at,http_get,helpers):
    clear=helpers['clear_domain'];status=helpers['set_domain_status'];ins=helpers['insert_obs']
    prod_blob,_,_=http_get(USGS_PRODUCTION_URL,timeout=120,accept='text/csv'); prod_rows=_csv_dicts(prod_blob); prod_retrieved=_iso_now()
    fac_blob=None;fac_rows=[];fac_retrieved=None
    try:
        fac_blob,_,_=http_get(USGS_FACILITIES_URL,timeout=120,accept='text/csv');fac_rows=_csv_dicts(fac_blob);fac_retrieved=_iso_now()
    except Exception: pass
    required={'Country (Short Form) or Locality','Level 1 (Commodity Group)','Level 2 (Commodity)','Value','Unit'}
    if not prod_rows or not required.issubset(set(prod_rows[0])): raise RuntimeError('USGS production CSV schema mismatch')
    fac_required={'Country (Short Form) or Locality','Facility Name','Feature Type','Level 1 (Commodity Group)','Level 2 (Commodity)','Facility Status'}
    if fac_rows and not fac_required.issubset(set(fac_rows[0])): raise RuntimeError('USGS facilities CSV schema mismatch')
    countries_with=0
    for c in universe:
        cc=c['code'];clear(db,cc,'minerals');names=_country_names(c)
        rows=[r for r in prod_rows if (r.get('Country (Short Form) or Locality') or '').strip().lower() in names]
        parsed=[]
        for r in rows:
            try:v=float((r.get('Value') or '').replace(',',''))
            except Exception:continue
            period=_usgs_period(r);commodity=(r.get('Level 2 (Commodity)') or r.get('Level 1 (Commodity Group)') or '').strip();group=(r.get('Level 1 (Commodity Group)') or '').strip()
            if not commodity:continue
            parsed.append((period or '',commodity,group,v,r))
        if parsed:
            years=[int(x[0]) for x in parsed if x[0].isdigit()];latest=max(years) if years else None
            if latest:parsed=[x for x in parsed if x[0]==str(latest)]
            seen=set();rank=0
            for period,commodity,group,v,r in parsed:
                key=(commodity,(r.get('Level 3 (Type)') or ''),(r.get('Level 4 (Phase)') or ''),(r.get('Level 5 (Form)') or ''),(r.get('Unit') or ''))
                if key in seen:continue
                seen.add(key);rank+=1
                extra={'role':'PRODUCER','commodityGroup':group,'type':r.get('Level 3 (Type)') or None,'phase':r.get('Level 4 (Phase)') or None,'form':r.get('Level 5 (Form)') or None,'dataType':r.get('Data Type') or None,'valueNotes':r.get('Value Notes') or None,**_critical_meta(group,commodity)}
                ins(db,cc,'minerals','production',commodity,v,None,r.get('Unit') or None,rank,period or None,period or None,'U.S. Geological Survey',USGS_DATASET,commodity,'USGS Minerals Yearbook commodity','https://doi.org/10.5066/P1KEQASH',prod_retrieved,refreshed_at,extra)
            # facilities/capacity remain distinct rows in the same domain with metric=facility
            for r in fac_rows:
                if (r.get('Country (Short Form) or Locality') or '').strip().lower() not in names:continue
                if 'inactive' in (r.get('Facility Status') or '').lower():continue
                commodity=(r.get('Level 2 (Commodity)') or r.get('Level 1 (Commodity Group)') or '').strip();group=(r.get('Level 1 (Commodity Group)') or '').strip()
                cap=None
                try: cap=float((r.get('Annual Production Capacity') or '').replace(',',''))
                except Exception: pass
                ins(db,cc,'minerals','facility',r.get('Facility Name') or r.get('USGS Facility ID') or 'Facility',cap,r.get('Facility Name') if cap is None else None,r.get('Capacity Unit') or None,None,'2024','2024','U.S. Geological Survey',USGS_DATASET,r.get('USGS Facility ID') or None,'USGS mineral facility','https://doi.org/10.5066/P1KEQASH',fac_retrieved or prod_retrieved,refreshed_at,{'role':'PRODUCER' if 'mine' in (r.get('Feature Type') or '').lower() else 'PROCESSOR / FACILITY','featureType':r.get('Feature Type') or None,'status':r.get('Facility Status') or None,'operator':r.get('Major Operating Company') or None,'commodity':commodity,'commodityGroup':group,**_critical_meta(group,commodity)})
            # reserves intentionally absent until separately validated reserves dataset/parser exists
            status(db,cc,'minerals','VERIFIED SNAPSHOT',refreshed_at,str(latest) if latest else '2024','U.S. Geological Survey',USGS_DATASET,max(prod_retrieved,fac_retrieved or prod_retrieved),'Reserves: N/A — no separately validated reserves parser')
            countries_with+=1
        else:
            status(db,cc,'minerals','N/A',refreshed_at,provider='U.S. Geological Survey',dataset=USGS_DATASET,source_retrieved_at=prod_retrieved,error='No validated country production rows; reserves not inferred')
    db.commit();return {'countries':len(universe),'countriesWithMinerals':countries_with,'facilitiesLoaded':bool(fac_rows),'reserves':'N/A'}


# --- FAOSTAT agriculture ---
FAO_BIGQUERY='https://api.data.apps.fao.org/api/v2/bigquery'
FAO_TABLE='fao-maps-review.faostat_v3.vw_fct_qcl_crops_production_yield_and_harvested_area'
FAO_DATASET='FAOSTAT Crops and livestock products — crop production, yield, harvested area'
FAO_AGGREGATE_CODES=('1717','1804','17530','1738','1841','1732','1726','1720','1723','1729','1735')

def fao_query(m49):
    # item_code is STRING in the current BigQuery view; quote exclusions explicitly.
    excl=','.join("'"+x+"'" for x in FAO_AGGREGATE_CODES)
    return (f"SELECT * FROM `{FAO_TABLE}` WHERE m49_code = {int(m49)} AND production_tonnes IS NOT NULL "
            f"AND item_code NOT IN ({excl}) AND year = (SELECT MAX(year) FROM `{FAO_TABLE}` WHERE m49_code = {int(m49)} AND production_tonnes IS NOT NULL) "
            "ORDER BY production_tonnes DESC LIMIT 20")

def _fao_parse(blob,m49):
    rows=_csv_dicts(blob); req={'m49_code','country_name_en','item_code','item','year','production_tonnes','production_tonnes_flag'}
    if not rows or not req.issubset(set(rows[0])): raise RuntimeError('FAOSTAT QCL schema mismatch')
    good=[]
    for r in rows:
        try:
            if int(r.get('m49_code') or -1)!=int(m49):continue
            code=str(r.get('item_code') or '')
            if code in FAO_AGGREGATE_CODES:continue
            value=float(r.get('production_tonnes'))
            year=int(r.get('year'))
        except Exception:continue
        good.append((year,value,code,r))
    if not good:return []
    latest=max(x[0] for x in good);good=[x for x in good if x[0]==latest];seen=set();out=[]
    for year,value,code,r in sorted(good,key=lambda x:x[1],reverse=True):
        if code in seen:continue
        seen.add(code);out.append({'itemCode':code,'item':r.get('item') or code,'year':year,'productionTonnes':value,'flag':r.get('production_tonnes_flag') or None})
    return out[:10]

def refresh_faostat(db,universe,refreshed_at,http_get,helpers):
    clear=helpers['clear_domain'];status=helpers['set_domain_status'];ins=helpers['insert_obs'];with_data=0
    for c in universe:
        cc=c['code'];clear(db,cc,'agriculture');m49=REPORTER.get(c['iso3'])
        if not m49:
            status(db,cc,'agriculture','N/A',refreshed_at,provider='FAOSTAT',dataset=FAO_DATASET,error='No M49 mapping');continue
        query=fao_query(m49);url=FAO_BIGQUERY+'?query='+urllib.parse.quote(query,safe='')
        try:
            blob,_,_=http_get(url,timeout=90,accept='text/csv');retrieved=_iso_now();rows=_fao_parse(blob,m49)
            if not rows:
                status(db,cc,'agriculture','N/A',refreshed_at,provider='FAOSTAT',dataset=FAO_DATASET,source_retrieved_at=retrieved,error='No validated production observations');continue
            for rank,r in enumerate(rows,1):
                ins(db,cc,'agriculture','production',r['item'],r['productionTonnes'],None,'t',rank,str(r['year']),str(r['year']),'FAOSTAT',FAO_DATASET,r['itemCode'],'FAOSTAT QCL item',url,retrieved,refreshed_at,{'flag':r['flag'],'rankingBasis':'PRODUCTION_QUANTITY'})
            status(db,cc,'agriculture','VERIFIED SNAPSHOT',refreshed_at,str(rows[0]['year']),'FAOSTAT',FAO_DATASET,retrieved,None);with_data+=1
        except Exception as e:
            status(db,cc,'agriculture','N/A',refreshed_at,provider='FAOSTAT',dataset=FAO_DATASET,error=str(e))
    db.commit();return {'countries':len(universe),'countriesWithAgriculture':with_data}

PROVIDERS={'worldbank':refresh_worldbank,'comtrade':refresh_comtrade,'usgs':refresh_usgs,'faostat':refresh_faostat}
