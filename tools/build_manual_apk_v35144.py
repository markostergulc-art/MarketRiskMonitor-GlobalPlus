import os, struct, hashlib, zlib, zipfile, shutil, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'manual_apk_build_v35144'
shutil.rmtree(OUT, ignore_errors=True); OUT.mkdir(parents=True)
NO_INDEX=0xffffffff

def uleb(n:int)->bytes:
    out=bytearray()
    while True:
        b=n & 0x7f; n >>= 7
        if n: out.append(b|0x80)
        else: out.append(b); break
    return bytes(out)
def align4(buf):
    while len(buf)%4: buf.append(0)
def p16(x): return struct.pack('<H',x & 0xffff)
def p32(x): return struct.pack('<I',x & 0xffffffff)

# ---------------- DEX ----------------
MAIN='Lcom/marko/marketrisk/globalplus/MainActivity;'
ACT='Landroid/app/Activity;'; BUNDLE='Landroid/os/Bundle;'; CONTEXT='Landroid/content/Context;'
WEBVIEW='Landroid/webkit/WebView;'; WEBSET='Landroid/webkit/WebSettings;'; VIEW='Landroid/view/View;'
STRING='Ljava/lang/String;'; VOID='V'; BOOL='Z'; INT='I'
P_VOID0=(VOID,()); P_VOID_BUNDLE=(VOID,(BUNDLE,)); P_VOID_VIEW=(VOID,(VIEW,)); P_VOID_CONTEXT=(VOID,(CONTEXT,))
P_WEBSET0=(WEBSET,()); P_VOID_BOOL=(VOID,(BOOL,)); P_VOID_STRING=(VOID,(STRING,)); P_VOID_INT=(VOID,(INT,))
P_VIEW_INT=(VIEW,(INT,)); P_BOOL0=(BOOL,()); P_BOOL_INT=(BOOL,(INT,))
methods=[
 (ACT,'<init>',P_VOID0),(ACT,'onCreate',P_VOID_BUNDLE),(ACT,'onBackPressed',P_VOID0),(ACT,'setContentView',P_VOID_VIEW),(ACT,'findViewById',P_VIEW_INT),(ACT,'requestWindowFeature',P_BOOL_INT),
 (WEBVIEW,'<init>',P_VOID_CONTEXT),(WEBVIEW,'getSettings',P_WEBSET0),(WEBVIEW,'loadUrl',P_VOID_STRING),(WEBVIEW,'canGoBack',P_BOOL0),(WEBVIEW,'goBack',P_VOID0),
 (VIEW,'setId',P_VOID_INT),
 (WEBSET,'setJavaScriptEnabled',P_VOID_BOOL),(WEBSET,'setDomStorageEnabled',P_VOID_BOOL),(WEBSET,'setAllowFileAccessFromFileURLs',P_VOID_BOOL),(WEBSET,'setAllowUniversalAccessFromFileURLs',P_VOID_BOOL),
 (MAIN,'<init>',P_VOID0),(MAIN,'onCreate',P_VOID_BUNDLE),(MAIN,'onBackPressed',P_VOID0),
]
protos=sorted(set(m[2] for m in methods),key=lambda p:(p[0],p[1]))
types={MAIN,ACT,BUNDLE,CONTEXT,WEBVIEW,WEBSET,VIEW,STRING,VOID,BOOL,INT}
for r,ps in protos: types.add(r); types.update(ps)
def shorty(proto):
    r,ps=proto
    ss=lambda t:t[0] if len(t)==1 else 'L'
    return ss(r)+''.join(ss(x) for x in ps)
strings=set(types)
for c,n,p in methods: strings.add(n); strings.add(shorty(p))
strings.add('file:///android_asset/index.html')
strings=sorted(strings); str_idx={s:i for i,s in enumerate(strings)}
types=sorted(types,key=lambda t:str_idx[t]); type_idx={t:i for i,t in enumerate(types)}
protos=sorted(protos,key=lambda p:(type_idx[p[0]],tuple(type_idx[x] for x in p[1]))); proto_idx={p:i for i,p in enumerate(protos)}
methods=sorted(methods,key=lambda m:(type_idx[m[0]],str_idx[m[1]],proto_idx[m[2]])); method_idx={m:i for i,m in enumerate(methods)}
header_size=0x70; string_ids_off=header_size; string_ids_size=len(strings)
type_ids_off=string_ids_off+4*string_ids_size; type_ids_size=len(types)
proto_ids_off=type_ids_off+4*type_ids_size; proto_ids_size=len(protos)
method_ids_off=proto_ids_off+12*proto_ids_size; method_ids_size=len(methods)
class_defs_off=method_ids_off+8*method_ids_size; data_off=class_defs_off+32
data=bytearray(); abs_off=lambda: data_off+len(data)
param_off={}
for ps in sorted(set(p[1] for p in protos if p[1]),key=lambda ps:tuple(type_idx[x] for x in ps)):
    align4(data); param_off[ps]=abs_off(); data+=p32(len(ps));
    for t in ps: data+=p16(type_idx[t])
    if len(ps)%2:data+=p16(0)
string_data_offs={}; first_string_data=None
for st in strings:
    if first_string_data is None:first_string_data=abs_off()
    string_data_offs[st]=abs_off(); data+=uleb(len(st))+st.encode()+b'\0'

def invoke(op,midx,regs):
    A=len(regs); rr=list(regs)+[0]*(5-len(regs)); C,D,E,F,G=rr[:5]
    return [op|(G<<8)|(A<<12),midx,C|(D<<4)|(E<<8)|(F<<12)]
def newinst(d,t): return [0x22|(d<<8),t]
def moveresobj(d): return [0x0c|(d<<8)]
def moveres(d): return [0x0a|(d<<8)]
def const4(d,lit): return [0x12|(d<<8)|((lit&0xf)<<12)]
def conststr(d,si): return [0x1a|(d<<8),si]
def checkcast(r,t): return [0x1f|(r<<8),t]
def ifeqz(r,off): return [0x38|(r<<8),off & 0xffff]
def retvoid(): return [0x0e]
def code_item(regs,ins_sz,outs,units):
    b=bytearray(struct.pack('<HHHHII',regs,ins_sz,outs,0,0,len(units)))
    for x in units:b+=p16(x)
    return b

align4(data); first_code_off=abs_off(); code_offs={}
ctor=(MAIN,'<init>',P_VOID0); code_offs[ctor]=abs_off(); units=invoke(0x70,method_idx[(ACT,'<init>',P_VOID0)],[0])+retvoid(); data+=code_item(1,1,1,units); align4(data)
oncreate=(MAIN,'onCreate',P_VOID_BUNDLE); code_offs[oncreate]=abs_off(); units=[]
# v0 webview, v1 settings, v2 temp; p0=v3 p1=v4
units+=invoke(0x6f,method_idx[(ACT,'onCreate',P_VOID_BUNDLE)],[3,4])
units+=const4(2,1); units+=invoke(0x6e,method_idx[(ACT,'requestWindowFeature',P_BOOL_INT)],[3,2])
units+=newinst(0,type_idx[WEBVIEW]); units+=invoke(0x70,method_idx[(WEBVIEW,'<init>',P_VOID_CONTEXT)],[0,3])
units+=const4(2,7); units+=invoke(0x6e,method_idx[(VIEW,'setId',P_VOID_INT)],[0,2])
units+=invoke(0x6e,method_idx[(WEBVIEW,'getSettings',P_WEBSET0)],[0]); units+=moveresobj(1); units+=const4(2,1)
for name in ['setJavaScriptEnabled','setDomStorageEnabled','setAllowFileAccessFromFileURLs','setAllowUniversalAccessFromFileURLs']:
    units+=invoke(0x6e,method_idx[(WEBSET,name,P_VOID_BOOL)],[1,2])
units+=invoke(0x6e,method_idx[(ACT,'setContentView',P_VOID_VIEW)],[3,0]); units+=conststr(2,str_idx['file:///android_asset/index.html']); units+=invoke(0x6e,method_idx[(WEBVIEW,'loadUrl',P_VOID_STRING)],[0,2]); units+=retvoid()
data+=code_item(5,2,2,units); align4(data)
onback=(MAIN,'onBackPressed',P_VOID0); code_offs[onback]=abs_off(); units=[]
# v0 webview, v1 temp; p0=v2
units+=const4(1,7); units+=invoke(0x6e,method_idx[(ACT,'findViewById',P_VIEW_INT)],[2,1]); units+=moveresobj(0); units+=checkcast(0,type_idx[WEBVIEW]); units+=invoke(0x6e,method_idx[(WEBVIEW,'canGoBack',P_BOOL0)],[0]); units+=moveres(1)
# if false jump over goBack+return to invoke-super. Current address is 11 code units; target 17 => +6.
units+=ifeqz(1,6); units+=invoke(0x6e,method_idx[(WEBVIEW,'goBack',P_VOID0)],[0]); units+=retvoid(); units+=invoke(0x6f,method_idx[(ACT,'onBackPressed',P_VOID0)],[2]); units+=retvoid()
data+=code_item(3,1,2,units)

class_data_off=abs_off(); cd=bytearray(); cd+=uleb(0)+uleb(0)+uleb(1)+uleb(2); cd+=uleb(method_idx[ctor])+uleb(0x10001)+uleb(code_offs[ctor])
virtuals=sorted([(method_idx[oncreate],oncreate,0x4),(method_idx[onback],onback,0x1)])
prev=0
for idx,m,flags in virtuals: cd+=uleb(idx-prev)+uleb(flags)+uleb(code_offs[m]); prev=idx
data+=cd; align4(data); map_off=abs_off(); maps=[]
def amap(t,size,off):
    if size:maps.append((off,t,size))
amap(0x0000,1,0); amap(0x0001,string_ids_size,string_ids_off); amap(0x0002,type_ids_size,type_ids_off); amap(0x0003,proto_ids_size,proto_ids_off); amap(0x0005,method_ids_size,method_ids_off); amap(0x0006,1,class_defs_off)
if param_off:amap(0x1001,len(param_off),min(param_off.values()))
amap(0x2002,string_ids_size,first_string_data); amap(0x2001,3,first_code_off); amap(0x2000,1,class_data_off); amap(0x1000,1,map_off); maps.sort()
data+=p32(len(maps));
for off,t,size in maps:data+=struct.pack('<HHII',t,0,size,off)
file_size=data_off+len(data); buf=bytearray(file_size)
pos=string_ids_off
for st in strings: struct.pack_into('<I',buf,pos,string_data_offs[st]);pos+=4
pos=type_ids_off
for t in types:struct.pack_into('<I',buf,pos,str_idx[t]);pos+=4
pos=proto_ids_off
for p in protos:
    r,ps=p;struct.pack_into('<III',buf,pos,str_idx[shorty(p)],type_idx[r],param_off.get(ps,0));pos+=12
pos=method_ids_off
for m in methods:
    c,n,p=m;struct.pack_into('<HHI',buf,pos,type_idx[c],proto_idx[p],str_idx[n]);pos+=8
struct.pack_into('<IIIIIIII',buf,class_defs_off,type_idx[MAIN],0x1,type_idx[ACT],0,NO_INDEX,0,class_data_off,0); buf[data_off:]=data
buf[0:8]=b'dex\n035\0'; struct.pack_into('<I',buf,32,file_size); struct.pack_into('<I',buf,36,0x70); struct.pack_into('<I',buf,40,0x12345678); struct.pack_into('<I',buf,52,map_off)
struct.pack_into('<II',buf,56,string_ids_size,string_ids_off);struct.pack_into('<II',buf,64,type_ids_size,type_ids_off);struct.pack_into('<II',buf,72,proto_ids_size,proto_ids_off);struct.pack_into('<II',buf,80,0,0);struct.pack_into('<II',buf,88,method_ids_size,method_ids_off);struct.pack_into('<II',buf,96,1,class_defs_off);struct.pack_into('<II',buf,104,len(data),data_off)
buf[12:32]=hashlib.sha1(buf[32:]).digest();struct.pack_into('<I',buf,8,zlib.adler32(buf[12:])&0xffffffff);(OUT/'classes.dex').write_bytes(buf)

# ---------------- shared UTF-8 string pool ----------------
RES_STRING_POOL_TYPE=0x0001; UTF8_FLAG=0x100
def enc_len8(n): return bytes([(n>>8)|0x80,n&0xff]) if n>0x7f else bytes([n])
def string_pool(vals):
    offsets=[];body=bytearray()
    for st in vals:
        offsets.append(len(body));b=st.encode('utf-8');body+=enc_len8(len(st))+enc_len8(len(b))+b+b'\0'
    while len(body)%4:body.append(0)
    hs=28;start=hs+4*len(vals);total=start+len(body);o=bytearray(struct.pack('<HHI',RES_STRING_POOL_TYPE,hs,total));o+=struct.pack('<IIIII',len(vals),0,UTF8_FLAG,start,0)
    for x in offsets:o+=p32(x)
    o+=body;return bytes(o)

# ---------------- resources.arsc with drawable/app_icon ----------------
RES_TABLE_TYPE=0x0002; RES_TABLE_PACKAGE_TYPE=0x0200; RES_TABLE_TYPE_TYPE=0x0201; RES_TABLE_TYPE_SPEC_TYPE=0x0202
value_pool=string_pool(['res/drawable/app_icon.png']); type_pool=string_pool(['drawable']); key_pool=string_pool(['app_icon'])
# type spec
spec=bytearray(struct.pack('<HHI',RES_TABLE_TYPE_SPEC_TYPE,16,20));spec+=struct.pack('<BBHI',1,0,0,1);spec+=p32(0)
# type chunk with 64-byte config
config_size=64; config=p32(config_size)+b'\0'*(config_size-4); type_header_size=20+config_size; entries_start=type_header_size+4; type_size=entries_start+16
typechunk=bytearray(struct.pack('<HHI',RES_TABLE_TYPE_TYPE,type_header_size,type_size));typechunk+=struct.pack('<BBHII',1,0,0,1,entries_start);typechunk+=config;typechunk+=p32(0);typechunk+=struct.pack('<HHI',8,0,0);typechunk+=struct.pack('<HBBI',8,0,0x03,0)
# package header 288 bytes
pkg_header_size=288; type_off=pkg_header_size; key_off=type_off+len(type_pool); pkg_size=pkg_header_size+len(type_pool)+len(key_pool)+len(spec)+len(typechunk)
pkg=bytearray(struct.pack('<HHI',RES_TABLE_PACKAGE_TYPE,pkg_header_size,pkg_size));pkg+=p32(0x7f)
name='com.marko.marketrisk.globalplus'.encode('utf-16le')+b'\0\0';pkg+=name+b'\0'*(256-len(name));pkg+=p32(type_off)+p32(0)+p32(key_off)+p32(0)+p32(0)
assert len(pkg)==pkg_header_size
pkg+=type_pool+key_pool+spec+typechunk
arsc=bytearray(struct.pack('<HHI',RES_TABLE_TYPE,12,12+len(value_pool)+len(pkg)));arsc+=p32(1)+value_pool+pkg;(OUT/'resources.arsc').write_bytes(arsc)

# ---------------- binary manifest ----------------
RES_XML_TYPE=0x0003; RES_XML_RESOURCE_MAP_TYPE=0x0180; RES_XML_START_NAMESPACE_TYPE=0x0100; RES_XML_END_NAMESPACE_TYPE=0x0101; RES_XML_START_ELEMENT_TYPE=0x0102; RES_XML_END_ELEMENT_TYPE=0x0103
TYPE_REFERENCE=0x01; TYPE_STRING=0x03; TYPE_INT_DEC=0x10; TYPE_INT_BOOLEAN=0x12
attr_ids={'versionCode':0x0101021b,'versionName':0x0101021c,'minSdkVersion':0x0101020c,'targetSdkVersion':0x01010270,'label':0x01010001,'icon':0x01010002,'name':0x01010003,'exported':0x01010010}
sp=list(attr_ids)+['android','http://schemas.android.com/apk/res/android','manifest','uses-sdk','uses-permission','application','activity','intent-filter','action','category','package','com.marko.marketrisk.globalplus','3.5.1.44','Market Risk Monitor Global+','android.permission.INTERNET','com.marko.marketrisk.globalplus.MainActivity','android.intent.action.MAIN','android.intent.category.LAUNCHER']
seen=set();sp=[x for x in sp if not(x in seen or seen.add(x))];si={x:i for i,x in enumerate(sp)};AURI=si['http://schemas.android.com/apk/res/android'];APFX=si['android']
def nh(t,size,line=1,comment=NO_INDEX):return struct.pack('<HHIII',t,16,size,line,comment)
def sns(p,u):return nh(RES_XML_START_NAMESPACE_TYPE,24)+p32(p)+p32(u)
def ens(p,u):return nh(RES_XML_END_NAMESPACE_TYPE,24)+p32(p)+p32(u)
def attr(ns,name,raw=None,dtype=TYPE_STRING,data_val=None):
    nsi=NO_INDEX if ns is None else ns;ni=si[name]
    if dtype==TYPE_STRING:ri=si[raw];data=ri if data_val is None else data_val
    else:ri=NO_INDEX if raw is None else si[raw];data=0 if data_val is None else data_val
    return struct.pack('<IIIHBBI',nsi,ni,ri,8,0,dtype,data)
def sel(name,attrs,ns=NO_INDEX):
    ab=b''.join(attrs);size=36+len(ab);return nh(RES_XML_START_ELEMENT_TYPE,size)+struct.pack('<IIHHHHHH',ns,si[name],20,20,len(attrs),0,0,0)+ab
def eel(name,ns=NO_INDEX):return nh(RES_XML_END_ELEMENT_TYPE,24)+p32(ns)+p32(si[name])
xml=bytearray();xml+=string_pool(sp);ids=[attr_ids[n] for n in attr_ids];xml+=struct.pack('<HHI',RES_XML_RESOURCE_MAP_TYPE,8,8+4*len(ids))+b''.join(p32(x) for x in ids);xml+=sns(APFX,AURI)
xml+=sel('manifest',[attr(None,'package','com.marko.marketrisk.globalplus'),attr(AURI,'versionCode',dtype=TYPE_INT_DEC,data_val=77),attr(AURI,'versionName','3.5.1.44')])
xml+=sel('uses-sdk',[attr(AURI,'minSdkVersion',dtype=TYPE_INT_DEC,data_val=26),attr(AURI,'targetSdkVersion',dtype=TYPE_INT_DEC,data_val=35)]);xml+=eel('uses-sdk')
xml+=sel('uses-permission',[attr(AURI,'name','android.permission.INTERNET')]);xml+=eel('uses-permission')
xml+=sel('application',[attr(AURI,'label','Market Risk Monitor Global+'),attr(AURI,'icon',dtype=TYPE_REFERENCE,data_val=0x7f010000)])
xml+=sel('activity',[attr(AURI,'name','com.marko.marketrisk.globalplus.MainActivity'),attr(AURI,'exported',dtype=TYPE_INT_BOOLEAN,data_val=0xffffffff)])
xml+=sel('intent-filter',[]);xml+=sel('action',[attr(AURI,'name','android.intent.action.MAIN')]);xml+=eel('action');xml+=sel('category',[attr(AURI,'name','android.intent.category.LAUNCHER')]);xml+=eel('category');xml+=eel('intent-filter');xml+=eel('activity');xml+=eel('application');xml+=eel('manifest');xml+=ens(APFX,AURI)
manifest=struct.pack('<HHI',RES_XML_TYPE,8,8+len(xml))+xml;(OUT/'AndroidManifest.xml').write_bytes(manifest)

# ---------------- assets + APK ----------------
html=(ROOT/'app/src/main/assets/index.html').read_bytes();icon=(ROOT/'app/src/main/assets/app_icon.png').read_bytes();(OUT/'index.html').write_bytes(html);(OUT/'app_icon.png').write_bytes(icon)
unsigned=OUT/'MarketRiskMonitor_GlobalPlus_v3.5.1.44_unsigned.apk'
with zipfile.ZipFile(unsigned,'w',compression=zipfile.ZIP_DEFLATED) as z:
    z.write(OUT/'AndroidManifest.xml','AndroidManifest.xml',compress_type=zipfile.ZIP_STORED)
    z.write(OUT/'resources.arsc','resources.arsc',compress_type=zipfile.ZIP_STORED)
    z.write(OUT/'classes.dex','classes.dex',compress_type=zipfile.ZIP_DEFLATED)
    z.write(OUT/'index.html','assets/index.html',compress_type=zipfile.ZIP_DEFLATED)
    z.write(OUT/'app_icon.png','assets/app_icon.png',compress_type=zipfile.ZIP_DEFLATED)
    z.write(OUT/'app_icon.png','res/drawable/app_icon.png',compress_type=zipfile.ZIP_DEFLATED)
print('unsigned',unsigned,unsigned.stat().st_size,'dex',len(buf),'arsc',len(arsc),'manifest',len(manifest))
