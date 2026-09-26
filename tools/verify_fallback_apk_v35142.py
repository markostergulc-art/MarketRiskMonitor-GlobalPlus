#!/usr/bin/env python3
import struct,sys,zipfile,hashlib
from pathlib import Path
apk=Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/data/MarketRiskMonitor_GlobalPlus_v3.5.1.42.apk')

def u16(b,o): return struct.unpack_from('<H',b,o)[0]
def u32(b,o): return struct.unpack_from('<I',b,o)[0]
def dec_len8(b,o):
    a=b[o]; o+=1
    if a&0x80:
        return ((a&0x7f)<<8)|b[o],o+1
    return a,o

def parse_string_pool(chunk):
    hsize=u16(chunk,2); count=u32(chunk,8); flags=u32(chunk,16); start=u32(chunk,20)
    if not flags & 0x100: raise ValueError('expected UTF-8 pool')
    offs=[u32(chunk,hsize+4*i) for i in range(count)]
    out=[]
    for rel in offs:
        o=start+rel; _,o=dec_len8(chunk,o); blen,o=dec_len8(chunk,o); out.append(chunk[o:o+blen].decode('utf-8'))
    return out

def parse_manifest(b):
    if u16(b,0)!=0x0003: raise ValueError('not RES_XML')
    pos=u16(b,2); strings=[]; attrs={}; elements=[]
    while pos<len(b):
        t=u16(b,pos); hs=u16(b,pos+2); sz=u32(b,pos+4); ch=b[pos:pos+sz]
        if t==0x0001: strings=parse_string_pool(ch)
        elif t==0x0102:
            name_idx=u32(ch,20); name=strings[name_idx]; ac=u16(ch,28); astart=u16(ch,24); asize=u16(ch,26)
            row={}
            base=16+astart
            for i in range(ac):
                o=base+i*asize; ni=u32(ch,o+4); raw=u32(ch,o+8); dtype=ch[o+15]; data=u32(ch,o+16)
                n=strings[ni]; val=(strings[raw] if raw!=0xffffffff else data)
                row[n]=(val,dtype,data)
            elements.append((name,row)); attrs.setdefault(name,[]).append(row)
        pos+=sz
    return attrs,elements

with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None
    manifest=z.read('AndroidManifest.xml'); html=z.read('assets/index.html'); dex=z.read('classes.dex'); res=z.read('resources.arsc')
    # 4-byte alignment for STORED entries.
    blob=apk.read_bytes()
    for i in z.infolist():
        if i.compress_type!=zipfile.ZIP_STORED: continue
        off=i.header_offset; fn=u16(blob,off+26); ex=u16(blob,off+28); data_off=off+30+fn+ex
        assert data_off%4==0, (i.filename,data_off)
attrs,_=parse_manifest(manifest)
man=attrs['manifest'][0]; sdk=attrs['uses-sdk'][0]; app=attrs['application'][0]; act=attrs['activity'][0]
assert man['package'][0]=='com.marko.marketrisk.globalplus'
assert man['versionCode'][2]==75
assert man['versionName'][0]=='3.5.1.42'
assert sdk['minSdkVersion'][2]==26 and sdk['targetSdkVersion'][2]==35
assert app['label'][0]=='Market Risk Monitor Global+'
assert act['name'][0]=='com.marko.marketrisk.globalplus.MainActivity'
source_html=Path('app/src/main/assets/index.html').read_bytes(); assert html==source_html
print('PASS - package com.marko.marketrisk.globalplus')
print('PASS - versionName 3.5.1.42 / versionCode 75')
print('PASS - minSdk 26 / targetSdk 35')
print('PASS - launcher MainActivity')
print('PASS - ZIP integrity')
print('PASS - STORED entries 4-byte aligned')
print('PASS - APK embedded index.html byte-identical to release source')
print('classes_dex_sha256',hashlib.sha256(dex).hexdigest())
print('resources_arsc_sha256',hashlib.sha256(res).hexdigest())
print('apk_sha256',hashlib.sha256(apk.read_bytes()).hexdigest())
