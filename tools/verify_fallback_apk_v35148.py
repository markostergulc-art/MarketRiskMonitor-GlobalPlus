#!/usr/bin/env python3
import struct,sys,zipfile,hashlib,zlib
from pathlib import Path
apk=Path(sys.argv[1] if len(sys.argv)>1 else '/mnt/data/MarketRiskMonitor_GlobalPlus_v3.5.1.48.apk')

def u16(b,o): return struct.unpack_from('<H',b,o)[0]
def u32(b,o): return struct.unpack_from('<I',b,o)[0]
def dec_len8(b,o):
    a=b[o]; o+=1
    if a&0x80:return ((a&0x7f)<<8)|b[o],o+1
    return a,o
def uleb(b,o):
    v=0;s=0
    while True:
        x=b[o];o+=1;v|=(x&0x7f)<<s
        if x<0x80:return v,o
        s+=7

def parse_string_pool(chunk):
    hsize=u16(chunk,2); count=u32(chunk,8); flags=u32(chunk,16); start=u32(chunk,20)
    assert flags&0x100
    offs=[u32(chunk,hsize+4*i) for i in range(count)]; out=[]
    for rel in offs:
        o=start+rel;_,o=dec_len8(chunk,o);bl,o=dec_len8(chunk,o);out.append(chunk[o:o+bl].decode())
    return out

def parse_manifest(b):
    assert u16(b,0)==0x0003
    pos=u16(b,2); strings=[]; attrs={}
    while pos<len(b):
        t=u16(b,pos); sz=u32(b,pos+4); ch=b[pos:pos+sz]
        if t==0x0001:strings=parse_string_pool(ch)
        elif t==0x0102:
            name=strings[u32(ch,20)]; ac=u16(ch,28); astart=u16(ch,24); asize=u16(ch,26); row={}; base=16+astart
            for i in range(ac):
                o=base+i*asize; ni=u32(ch,o+4); raw=u32(ch,o+8); dtype=ch[o+15]; data=u32(ch,o+16); row[strings[ni]]=(strings[raw] if raw!=0xffffffff else data,dtype,data)
            attrs.setdefault(name,[]).append(row)
        pos+=sz
    return attrs

def dex_strings_and_annotation(d):
    assert d[:8]==b'dex\n035\0'
    assert u32(d,32)==len(d)
    assert d[12:32]==hashlib.sha1(d[32:]).digest()
    assert u32(d,8)==(zlib.adler32(d[12:])&0xffffffff)
    ssz,soff=u32(d,56),u32(d,60); tsz,toff=u32(d,64),u32(d,68); msz,moff=u32(d,88),u32(d,92); csz,coff=u32(d,96),u32(d,100)
    strings=[]
    for i in range(ssz):
        o=u32(d,soff+4*i);_,o=uleb(d,o);e=d.index(0,o);strings.append(d[o:e].decode())
    types=[strings[u32(d,toff+4*i)] for i in range(tsz)]
    methods=[]
    for i in range(msz):
        ci,pi,ni=struct.unpack_from('<HHI',d,moff+8*i);methods.append((types[ci],strings[ni],pi))
    assert csz==1
    class_idx,acc,super_idx,interfaces,source,ann_off,class_data,static=struct.unpack_from('<IIIIIIII',d,coff)
    assert types[class_idx]=='Lcom/marko/marketrisk/globalplus/MainActivity;'
    assert ann_off
    class_ann,fsz,amsz,psz=struct.unpack_from('<IIII',d,ann_off); assert fsz==0 and amsz==1
    midx,setoff=struct.unpack_from('<II',d,ann_off+16); assert methods[midx][1]=='saveExportFile'
    assert u32(d,setoff)==1; item=u32(d,setoff+4); assert d[item]==1
    tidx,o=uleb(d,item+1); count,o=uleb(d,o); assert types[tidx]=='Landroid/webkit/JavascriptInterface;' and count==0
    return strings,methods

with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None
    manifest=z.read('AndroidManifest.xml'); html=z.read('assets/index.html'); dex=z.read('classes.dex'); res=z.read('resources.arsc')
    blob=apk.read_bytes()
    for i in z.infolist():
        if i.compress_type!=zipfile.ZIP_STORED:continue
        off=i.header_offset; data_off=off+30+u16(blob,off+26)+u16(blob,off+28); assert data_off%4==0,(i.filename,data_off)
attrs=parse_manifest(manifest); man=attrs['manifest'][0]; sdk=attrs['uses-sdk'][0]; app=attrs['application'][0]; act=attrs['activity'][0]
assert man['package'][0]=='com.marko.marketrisk.globalplus'; assert man['versionCode'][2]==81; assert man['versionName'][0]=='3.5.1.48'
assert sdk['minSdkVersion'][2]==26 and sdk['targetSdkVersion'][2]==35; assert app['label'][0]=='Market Risk Monitor Global+'; assert act['name'][0]=='com.marko.marketrisk.globalplus.MainActivity'
# No broad storage permission is present in the fallback binary manifest.
perms=[x['name'][0] for x in attrs.get('uses-permission',[])]; assert 'android.permission.MANAGE_EXTERNAL_STORAGE' not in perms and 'android.permission.WRITE_EXTERNAL_STORAGE' not in perms
source_html=Path('app/src/main/assets/index.html').read_bytes(); assert html==source_html
strings,methods=dex_strings_and_annotation(dex)
for s in ['saveExportFile','addJavascriptInterface','Landroid/webkit/JavascriptInterface;','content://media/external/downloads','relative_path','Download/MarketRiskMonitor','ERROR|Native save failed','OK|']:
    assert s in strings,s
assert any(m[1]=='saveExportFile' for m in methods)
print('PASS - package/version/minSdk/targetSdk/launcher')
print('PASS - ZIP integrity and STORED alignment')
print('PASS - embedded index.html byte-identical to release source')
print('PASS - no broad storage permission')
print('PASS - fallback DEX exposes @JavascriptInterface saveExportFile')
print('PASS - fallback DEX wires addJavascriptInterface')
print('PASS - MediaStore Downloads URI / relative path present')
print('classes_dex_sha256',hashlib.sha256(dex).hexdigest())
print('resources_arsc_sha256',hashlib.sha256(res).hexdigest())
print('apk_sha256',hashlib.sha256(apk.read_bytes()).hexdigest())
