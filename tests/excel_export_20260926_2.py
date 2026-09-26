#!/usr/bin/env python3
from pathlib import Path
import re, subprocess, sys, zipfile, xml.etree.ElementTree as ET, tempfile, textwrap
ROOT=Path(__file__).resolve().parents[1]
js=(ROOT/'app/src/main/assets/excel_export_v362.js').read_text()
idx=(ROOT/'app/src/main/assets/index.html').read_text()
checks=[]
def ck(name, ok):
    checks.append((name,bool(ok))); print(('PASS' if ok else 'FAIL'),name)
ck('Excel button exists', 'id="downloadExcelBtn"' in idx)
ck('Excel asset included', '<script src="excel_export_v362.js"></script>' in idx)
ck('XLSX mime declared', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' in js)
ck('25 sheet specs declared', len(re.findall(r"name:'\d\d [^']+'",js))==25)
ck('zero fetch calls in exporter', 'fetch(' not in js and 'yahoo(' not in js and 'ensureBondsV75(' not in js and 'ensureCapitalRotationV70(' not in js)
ck('native save bridge reused', 'saveExportBlobV48(blob,name,XLSX_MIME_V362)' in js)
ck('report version 2026.09.26.2/125', "XLSX_VERSION_V362='2026.09.26.2'" in js and 'XLSX_VERSION_CODE_V362=125' in js)
ck('JS syntax', subprocess.run(['node','--check',str(ROOT/'app/src/main/assets/excel_export_v362.js')],capture_output=True).returncode==0)
# Validate OOXML string parts structurally with a minimal mocked runtime and the project's STORE ZIP writer.
harness=r'''
const fs=require('fs'); const window={}; const document={readyState:'complete',getElementById:()=>null,addEventListener:()=>{}};
const appState={global:{},countries:[],generatedAt:null}; const companySummaries={}; const SP500_ALL=[]; const COUNTRY_LEADERS={}; const GLOBAL_INDUSTRY_LEADERS={}; const ETF_UNIVERSE=[]; const VOLATILITY_SECTOR_UNIVERSE_V361=[]; const companyDetailCache=new Map(); const bondsV75={data:null};
function riskBand(v){return{label:'N/A'}} function volatilityAlarmFromMetricsV361(){return{label:'INSUFFICIENT DATA',volScore:null,downsideScore:null,confidence:'INSUFFICIENT',volTrend:'N/A',reasons:[],offsets:[],horizon:'1–4W'}} function companyVolatilityAlarmV361(){return volatilityAlarmFromMetricsV361()} function companyContextRisk(){return{score:null}} function companyHomeCountry(){return''} function companyIndustryTheme(){return''} function companyEntryFor(s){return{s,n:s}} function trading212TradableV74(){return null} function etfRisk(){return null}
function globalRiskAuditRowsV47(){return[]} function earlyAuditRowsV47(){return[]} function fiscalAuditRowsV47(){return[]} function macroAuditRowsV47(){return[]} function commodityPhysicalSnapshotV61(){return{}} function commodityAuditRowsV47(){return[]} function capitalRotationSnapshotV70(){return null} function correlationAuditRowsV47(){return[]} function providerResilienceSnapshotV62(){return{registry:{},health:{}}} function methodologyV2SnapshotV67(){return{models:[]}} function exportTimestampV47(){return'X'} function L(a,b){return b} function setExportStatusV47(){} async function saveExportBlobV48(){}
function crc32V47(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0} function u16V47(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255} function u32V47(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255;a[o+2]=(v>>>16)&255;a[o+3]=(v>>>24)&255}
function zipStoreV47(files){let enc=new TextEncoder(),locals=[],centrals=[],offset=0;for(const f of files){let name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32V47(data),lh=new Uint8Array(30+name.length);u32V47(lh,0,0x04034b50);u16V47(lh,4,20);u16V47(lh,6,0x800);u16V47(lh,8,0);u32V47(lh,14,crc);u32V47(lh,18,data.length);u32V47(lh,22,data.length);u16V47(lh,26,name.length);lh.set(name,30);locals.push(lh,data);let ch=new Uint8Array(46+name.length);u32V47(ch,0,0x02014b50);u16V47(ch,4,20);u16V47(ch,6,20);u16V47(ch,8,0x800);u16V47(ch,10,0);u32V47(ch,16,crc);u32V47(ch,20,data.length);u32V47(ch,24,data.length);u16V47(ch,28,name.length);u32V47(ch,42,offset);ch.set(name,46);centrals.push(ch);offset+=lh.length+data.length}let csize=centrals.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22);u32V47(end,0,0x06054b50);u16V47(end,8,files.length);u16V47(end,10,files.length);u32V47(end,12,csize);u32V47(end,16,offset);return new Blob([...locals,...centrals,end],{type:'application/zip'})}
eval(fs.readFileSync(process.argv[2],'utf8')); (async()=>{let a=window.__MRM_XLSX_TEST__,s=a.sheetSpecsV362(); if(s.length!==25)throw new Error('sheets '+s.length);let b=a.xlsxBlobV362(s);fs.writeFileSync(process.argv[3],Buffer.from(await b.arrayBuffer()));})();
'''
with tempfile.TemporaryDirectory() as td:
    runner=Path(td)/'runner.js'; out=Path(td)/'test.xlsx'; runner.write_text(harness)
    r=subprocess.run(['node',str(runner),str(ROOT/'app/src/main/assets/excel_export_v362.js'),str(out)],capture_output=True,text=True)
    ok=r.returncode==0 and out.exists()
    ck('runtime OOXML generation',ok)
    if ok:
        try:
            with zipfile.ZipFile(out) as z:
                ck('XLSX ZIP integrity',z.testzip() is None)
                sheets=[n for n in z.namelist() if n.startswith('xl/worksheets/sheet')]
                ck('XLSX contains 25 worksheets',len(sheets)==25)
                xmlok=True
                for n in z.namelist():
                    if n.endswith('.xml') or n.endswith('.rels'):
                        try: ET.fromstring(z.read(n))
                        except Exception: xmlok=False; break
                ck('OOXML parts are well-formed XML',xmlok)
        except Exception:
            ck('XLSX ZIP integrity',False); ck('XLSX contains 25 worksheets',False); ck('OOXML parts are well-formed XML',False)
passed=sum(v for _,v in checks); print(f'RESULT {passed}/{len(checks)} PASS')
if passed!=len(checks): sys.exit(1)
