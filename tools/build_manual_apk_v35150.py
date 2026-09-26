import os, struct, hashlib, zlib, zipfile, shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'manual_apk_build_v35150'
shutil.rmtree(OUT, ignore_errors=True); OUT.mkdir(parents=True)
NO_INDEX=0xffffffff

def uleb(n:int)->bytes:
    out=bytearray()
    while True:
        b=n & 0x7f; n >>= 7
        if n: out.append(b|0x80)
        else: out.append(b); break
    return bytes(out)
def sleb(n:int)->bytes:
    out=bytearray(); more=True
    while more:
        b=n & 0x7f; n >>= 7
        sign=b & 0x40
        more=not ((n==0 and not sign) or (n==-1 and sign))
        if more:b|=0x80
        out.append(b)
    return bytes(out)
def align4(buf):
    while len(buf)%4: buf.append(0)
def p16(x): return struct.pack('<H',x & 0xffff)
def p32(x): return struct.pack('<I',x & 0xffffffff)

# ---------------- DEX: standalone WebView + real native export bridge ----------------
MAIN='Lcom/marko/marketrisk/globalplus/MainActivity;'
ACT='Landroid/app/Activity;'; BUNDLE='Landroid/os/Bundle;'; CONTEXT='Landroid/content/Context;'
WEBVIEW='Landroid/webkit/WebView;'; WEBSET='Landroid/webkit/WebSettings;'; VIEW='Landroid/view/View;'
STRING='Ljava/lang/String;'; OBJECT='Ljava/lang/Object;'; VOID='V'; BOOL='Z'; INT='I'
BYTEARR='[B'; STRINGARR='[Ljava/lang/String;'
BASE64='Landroid/util/Base64;'; BUILDVER='Landroid/os/Build$VERSION;'
CONTENTVALUES='Landroid/content/ContentValues;'; CONTENTRESOLVER='Landroid/content/ContentResolver;'
URI='Landroid/net/Uri;'
OUTPUTSTREAM='Ljava/io/OutputStream;'; FILE='Ljava/io/File;'; FILEOUT='Ljava/io/FileOutputStream;'
INTEGER='Ljava/lang/Integer;'; JSANN='Landroid/webkit/JavascriptInterface;'; THROWABLE='Ljava/lang/Throwable;'

P_VOID0=(VOID,()); P_VOID_BUNDLE=(VOID,(BUNDLE,)); P_VOID_VIEW=(VOID,(VIEW,)); P_VOID_CONTEXT=(VOID,(CONTEXT,))
P_WEBSET0=(WEBSET,()); P_VOID_BOOL=(VOID,(BOOL,)); P_VOID_STRING=(VOID,(STRING,)); P_VOID_INT=(VOID,(INT,))
P_VIEW_INT=(VIEW,(INT,)); P_BOOL0=(BOOL,()); P_BOOL_INT=(BOOL,(INT,))
P_VOID_OBJ_STRING=(VOID,(OBJECT,STRING)); P_STRING_3S=(STRING,(STRING,STRING,STRING))
P_STRING_2S=(STRING,(STRING,STRING)); P_STRING_S=(STRING,(STRING,)); P_INT0=(INT,())
P_BYTES_SI=(BYTEARR,(STRING,INT)); P_CR0=(CONTENTRESOLVER,()); P_FILE_S=(FILE,(STRING,))
P_VOID_SS=(VOID,(STRING,STRING)); P_INTEGER_I=(INTEGER,(INT,)); P_VOID_SINTEGER=(VOID,(STRING,INTEGER))
P_URI_S=(URI,(STRING,)); P_URI_URI_CV=(URI,(URI,CONTENTVALUES)); P_OUT_URI=(OUTPUTSTREAM,(URI,)); P_VOID_BYTES=(VOID,(BYTEARR,))
P_INT_URI_CV_S_SA=(INT,(URI,CONTENTVALUES,STRING,STRINGARR)); P_VOID_FILE_S=(VOID,(FILE,STRING)); P_VOID_FILE=(VOID,(FILE,));

methods=[
 (ACT,'<init>',P_VOID0),(ACT,'onCreate',P_VOID_BUNDLE),(ACT,'onBackPressed',P_VOID0),(ACT,'setContentView',P_VOID_VIEW),(ACT,'findViewById',P_VIEW_INT),(ACT,'requestWindowFeature',P_BOOL_INT),
 (WEBVIEW,'<init>',P_VOID_CONTEXT),(WEBVIEW,'getSettings',P_WEBSET0),(WEBVIEW,'loadUrl',P_VOID_STRING),(WEBVIEW,'canGoBack',P_BOOL0),(WEBVIEW,'goBack',P_VOID0),(WEBVIEW,'addJavascriptInterface',P_VOID_OBJ_STRING),
 (VIEW,'setId',P_VOID_INT),
 (WEBSET,'setJavaScriptEnabled',P_VOID_BOOL),(WEBSET,'setDomStorageEnabled',P_VOID_BOOL),(WEBSET,'setAllowFileAccessFromFileURLs',P_VOID_BOOL),(WEBSET,'setAllowUniversalAccessFromFileURLs',P_VOID_BOOL),
 (STRING,'replaceAll',P_STRING_2S),(STRING,'concat',P_STRING_S),
 (BASE64,'decode',P_BYTES_SI),
 (CONTEXT,'getContentResolver',P_CR0),(CONTEXT,'getExternalFilesDir',P_FILE_S),
 (CONTENTVALUES,'<init>',P_VOID0),(CONTENTVALUES,'put',P_VOID_SS),(CONTENTVALUES,'put',P_VOID_SINTEGER),(CONTENTVALUES,'clear',P_VOID0),
 (INTEGER,'valueOf',P_INTEGER_I),
 (URI,'parse',P_URI_S),
 (CONTENTRESOLVER,'insert',P_URI_URI_CV),(CONTENTRESOLVER,'openOutputStream',P_OUT_URI),(CONTENTRESOLVER,'update',P_INT_URI_CV_S_SA),
 (OUTPUTSTREAM,'write',P_VOID_BYTES),(OUTPUTSTREAM,'flush',P_VOID0),(OUTPUTSTREAM,'close',P_VOID0),
 (FILE,'<init>',P_VOID_FILE_S),(FILEOUT,'<init>',P_VOID_FILE),
 (MAIN,'<init>',P_VOID0),(MAIN,'onCreate',P_VOID_BUNDLE),(MAIN,'onBackPressed',P_VOID0),(MAIN,'saveExportFile',P_STRING_3S),
]
fields=[(BUILDVER,'SDK_INT',INT)]
protos=sorted(set(m[2] for m in methods),key=lambda p:(p[0],p[1]))
types={MAIN,ACT,BUNDLE,CONTEXT,WEBVIEW,WEBSET,VIEW,STRING,OBJECT,VOID,BOOL,INT,BYTEARR,STRINGARR,BASE64,BUILDVER,CONTENTVALUES,CONTENTRESOLVER,URI,OUTPUTSTREAM,FILE,FILEOUT,INTEGER,JSANN,THROWABLE}
for r,ps in protos: types.add(r); types.update(ps)
for c,n,t in fields: types.add(c); types.add(t)
def shorty(proto):
    r,ps=proto
    ss=lambda t:t[0] if len(t)==1 else 'L'
    return ss(r)+''.join(ss(x) for x in ps)
strings=set(types)
for c,n,p in methods: strings.add(n); strings.add(shorty(p))
for c,n,t in fields: strings.add(n)
for lit in ['file:///android_asset/index.html','Android','[^A-Za-z0-9._-]','_','_display_name','mime_type','relative_path','is_pending','Download/MarketRiskMonitor','content://media/external/downloads','Download','OK|','ERROR|Export exceeds 12 MB native-save limit','ERROR|MediaStore insert failed','ERROR|Cannot open Downloads output stream','ERROR|Legacy export directory unavailable','ERROR|Native save failed']:
    strings.add(lit)
strings=sorted(strings); str_idx={s:i for i,s in enumerate(strings)}
types=sorted(types,key=lambda t:str_idx[t]); type_idx={t:i for i,t in enumerate(types)}
protos=sorted(protos,key=lambda p:(type_idx[p[0]],tuple(type_idx[x] for x in p[1]))); proto_idx={p:i for i,p in enumerate(protos)}
fields=sorted(fields,key=lambda f:(type_idx[f[0]],str_idx[f[1]],type_idx[f[2]])); field_idx={f:i for i,f in enumerate(fields)}
methods=sorted(methods,key=lambda m:(type_idx[m[0]],str_idx[m[1]],proto_idx[m[2]])); method_idx={m:i for i,m in enumerate(methods)}

header_size=0x70; string_ids_off=header_size; string_ids_size=len(strings)
type_ids_off=string_ids_off+4*string_ids_size; type_ids_size=len(types)
proto_ids_off=type_ids_off+4*type_ids_size; proto_ids_size=len(protos)
field_ids_off=proto_ids_off+12*proto_ids_size; field_ids_size=len(fields)
method_ids_off=field_ids_off+8*field_ids_size; method_ids_size=len(methods)
class_defs_off=method_ids_off+8*method_ids_size; data_off=class_defs_off+32
data=bytearray(); abs_off=lambda: data_off+len(data)
param_off={}
for ps in sorted(set(p[1] for p in protos if p[1]),key=lambda ps:tuple(type_idx[x] for x in ps)):
    align4(data); param_off[ps]=abs_off(); data+=p32(len(ps))
    for t in ps: data+=p16(type_idx[t])
    if len(ps)%2:data+=p16(0)
string_data_offs={}; first_string_data=None
for st in strings:
    if first_string_data is None:first_string_data=abs_off()
    string_data_offs[st]=abs_off(); enc=st.encode('utf-8'); data+=uleb(len(st))+enc+b'\0'

# instruction helpers
def invoke(op,midx,regs):
    A=len(regs); rr=list(regs)+[0]*(5-len(regs)); C,D,E,F,G=rr[:5]
    return [op|(G<<8)|(A<<12),midx,C|(D<<4)|(E<<8)|(F<<12)]
def newinst(d,t): return [0x22|(d<<8),t]
def moveresobj(d): return [0x0c|(d<<8)]
def moveres(d): return [0x0a|(d<<8)]
def moveexc(d): return [0x0d|(d<<8)]
def const4(d,lit): return [0x12|(d<<8)|((lit&0xf)<<12)]
def const16(d,lit): return [0x13|(d<<8),lit & 0xffff]
def const32(d,lit): return [0x14|(d<<8),lit & 0xffff,(lit>>16)&0xffff]
def conststr(d,si): return [0x1a|(d<<8),si]
def checkcast(r,t): return [0x1f|(r<<8),t]
def arraylen(a,b): return [0x21|(a<<8)|(b<<12)]
def sget(op,d,fidx): return [op|(d<<8),fidx]
def retvoid(): return [0x0e]
def retobj(r): return [0x11|(r<<8)]

class Asm:
    def __init__(self): self.u=[]; self.labels={}; self.fix=[]
    def emit(self,units): self.u+=units
    def label(self,n): self.labels[n]=len(self.u)
    def ifz(self,r,label):
        pos=len(self.u); self.u += [0x38|(r<<8),0]; self.fix.append(('off16',pos+1,pos,label))
    def if22(self,op,a,b,label):
        pos=len(self.u); self.u += [op|(a<<8)|(b<<12),0]; self.fix.append(('off16',pos+1,pos,label))
    def goto16(self,label):
        pos=len(self.u); self.u += [0x29,0]; self.fix.append(('off16',pos+1,pos,label))
    def patch(self):
        for _,slot,start,label in self.fix:
            off=self.labels[label]-start
            if not -32768<=off<=32767: raise ValueError((label,off))
            self.u[slot]=off & 0xffff
        return self.u

def code_item(regs,ins_sz,outs,units,try_count=0,try_start=0,try_end=0,catch_addr=0):
    b=bytearray(struct.pack('<HHHHII',regs,ins_sz,outs,try_count,0,len(units)))
    for x in units:b+=p16(x)
    if try_count:
        if len(units)%2:b+=p16(0)
        # encoded_catch_handler_list begins after try_items; first handler offset=1 byte (list size)
        b+=struct.pack('<IHH',try_start,try_end-try_start,1)
        b+=uleb(1)+sleb(0)+uleb(catch_addr)
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
# Native export bridge is MainActivity itself; only annotated saveExportFile is exposed.
units+=conststr(2,str_idx['Android']); units+=invoke(0x6e,method_idx[(WEBVIEW,'addJavascriptInterface',P_VOID_OBJ_STRING)],[0,3,2])
units+=invoke(0x6e,method_idx[(ACT,'setContentView',P_VOID_VIEW)],[3,0]); units+=conststr(2,str_idx['file:///android_asset/index.html']); units+=invoke(0x6e,method_idx[(WEBVIEW,'loadUrl',P_VOID_STRING)],[0,2]); units+=retvoid()
data+=code_item(5,2,3,units); align4(data)

onback=(MAIN,'onBackPressed',P_VOID0); code_offs[onback]=abs_off(); a=Asm()
a.emit(const4(1,7)); a.emit(invoke(0x6e,method_idx[(ACT,'findViewById',P_VIEW_INT)],[2,1])); a.emit(moveresobj(0)); a.emit(checkcast(0,type_idx[WEBVIEW])); a.emit(invoke(0x6e,method_idx[(WEBVIEW,'canGoBack',P_BOOL0)],[0])); a.emit(moveres(1)); a.ifz(1,'super'); a.emit(invoke(0x6e,method_idx[(WEBVIEW,'goBack',P_VOID0)],[0])); a.emit(retvoid()); a.label('super'); a.emit(invoke(0x6f,method_idx[(ACT,'onBackPressed',P_VOID0)],[2])); a.emit(retvoid()); units=a.patch(); data+=code_item(3,1,2,units); align4(data)

save=(MAIN,'saveExportFile',P_STRING_3S); code_offs[save]=abs_off(); a=Asm()
# regs=12; p0=v8, p1=v9 filename, p2=v10 mime, p3=v11 base64
# sanitize filename
for r,lit in [(2,'[^A-Za-z0-9._-]'),(3,'_')]: a.emit(conststr(r,str_idx[lit]))
a.emit(invoke(0x6e,method_idx[(STRING,'replaceAll',P_STRING_2S)],[9,2,3])); a.emit(moveresobj(0))
# decode base64
a.emit(const4(2,0)); a.emit(invoke(0x71,method_idx[(BASE64,'decode',P_BYTES_SI)],[11,2])); a.emit(moveresobj(1)); a.emit(arraylen(2,1)); a.emit(const32(3,12*1024*1024)); a.if22(0x36,2,3,'oversize') # if-gt
# API split
a.emit(sget(0x60,2,field_idx[(BUILDVER,'SDK_INT',INT)])); a.emit(const16(3,29)); a.if22(0x34,2,3,'legacy') # if-lt
# MediaStore ContentValues
cv_ctor=(CONTENTVALUES,'<init>',P_VOID0)
a.emit(newinst(3,type_idx[CONTENTVALUES])); a.emit(invoke(0x70,method_idx[cv_ctor],[3]))
# display name
for key,valreg in [('_display_name',0),('mime_type',10)]:
    a.emit(conststr(6,str_idx[key])); a.emit(invoke(0x6e,method_idx[(CONTENTVALUES,'put',P_VOID_SS)],[3,6,valreg]))
# relative path
a.emit(conststr(6,str_idx['relative_path'])); a.emit(conststr(7,str_idx['Download/MarketRiskMonitor'])); a.emit(invoke(0x6e,method_idx[(CONTENTVALUES,'put',P_VOID_SS)],[3,6,7]))
# pending=1
a.emit(conststr(6,str_idx['is_pending'])); a.emit(const4(7,1)); a.emit(invoke(0x71,method_idx[(INTEGER,'valueOf',P_INTEGER_I)],[7])); a.emit(moveresobj(7)); a.emit(invoke(0x6e,method_idx[(CONTENTVALUES,'put',P_VOID_SINTEGER)],[3,6,7]))
# resolver / uri
a.emit(invoke(0x6e,method_idx[(CONTEXT,'getContentResolver',P_CR0)],[8])); a.emit(moveresobj(4)); a.emit(conststr(5,str_idx['content://media/external/downloads'])); a.emit(invoke(0x71,method_idx[(URI,'parse',P_URI_S)],[5])); a.emit(moveresobj(5)); a.emit(invoke(0x6e,method_idx[(CONTENTRESOLVER,'insert',P_URI_URI_CV)],[4,5,3])); a.emit(moveresobj(5)); a.ifz(5,'fail_insert')
# stream write
a.emit(invoke(0x6e,method_idx[(CONTENTRESOLVER,'openOutputStream',P_OUT_URI)],[4,5])); a.emit(moveresobj(6)); a.ifz(6,'fail_stream'); a.emit(invoke(0x6e,method_idx[(OUTPUTSTREAM,'write',P_VOID_BYTES)],[6,1])); a.emit(invoke(0x6e,method_idx[(OUTPUTSTREAM,'flush',P_VOID0)],[6])); a.emit(invoke(0x6e,method_idx[(OUTPUTSTREAM,'close',P_VOID0)],[6]))
# pending=0 + update
a.emit(invoke(0x6e,method_idx[(CONTENTVALUES,'clear',P_VOID0)],[3])); a.emit(conststr(6,str_idx['is_pending'])); a.emit(const4(7,0)); a.emit(invoke(0x71,method_idx[(INTEGER,'valueOf',P_INTEGER_I)],[7])); a.emit(moveresobj(7)); a.emit(invoke(0x6e,method_idx[(CONTENTVALUES,'put',P_VOID_SINTEGER)],[3,6,7])); a.emit(const4(7,0)); a.emit(invoke(0x6e,method_idx[(CONTENTRESOLVER,'update',P_INT_URI_CV_S_SA)],[4,5,3,7,7])); a.goto16('success')
# legacy app-specific external Downloads (no broad permission)
a.label('legacy'); a.emit(conststr(6,str_idx['Download'])); a.emit(invoke(0x6e,method_idx[(CONTEXT,'getExternalFilesDir',P_FILE_S)],[8,6])); a.emit(moveresobj(4)); a.ifz(4,'fail_legacy'); a.emit(newinst(5,type_idx[FILE])); a.emit(invoke(0x70,method_idx[(FILE,'<init>',P_VOID_FILE_S)],[5,4,0])); a.emit(newinst(6,type_idx[FILEOUT])); a.emit(invoke(0x70,method_idx[(FILEOUT,'<init>',P_VOID_FILE)],[6,5])); a.emit(invoke(0x6e,method_idx[(OUTPUTSTREAM,'write',P_VOID_BYTES)],[6,1])); a.emit(invoke(0x6e,method_idx[(OUTPUTSTREAM,'flush',P_VOID0)],[6])); a.emit(invoke(0x6e,method_idx[(OUTPUTSTREAM,'close',P_VOID0)],[6])); a.goto16('success')
# failure labels
for lab,msg in [('oversize','ERROR|Export exceeds 12 MB native-save limit'),('fail_insert','ERROR|MediaStore insert failed'),('fail_stream','ERROR|Cannot open Downloads output stream'),('fail_legacy','ERROR|Legacy export directory unavailable')]:
    a.label(lab); a.emit(conststr(6,str_idx[msg])); a.emit(retobj(6))
a.label('success'); a.emit(conststr(6,str_idx['OK|'])); a.emit(invoke(0x6e,method_idx[(STRING,'concat',P_STRING_S)],[6,0])); a.emit(moveresobj(6)); a.emit(retobj(6))
a.label('catch'); a.emit(moveexc(7)); a.emit(conststr(6,str_idx['ERROR|Native save failed'])); a.emit(retobj(6))
units=a.patch(); catch_addr=a.labels['catch']; data+=code_item(12,4,5,units,1,0,catch_addr,catch_addr); align4(data)

# class data
class_data_off=abs_off(); cd=bytearray(); cd+=uleb(0)+uleb(0)+uleb(1)+uleb(3); cd+=uleb(method_idx[ctor])+uleb(0x10001)+uleb(code_offs[ctor])
virtuals=sorted([(method_idx[oncreate],oncreate,0x4),(method_idx[onback],onback,0x1),(method_idx[save],save,0x1)])
prev=0
for idx,m,flags in virtuals: cd+=uleb(idx-prev)+uleb(flags)+uleb(code_offs[m]); prev=idx
data+=cd
# runtime @JavascriptInterface annotation on saveExportFile
annotation_item_off=abs_off(); data+=bytes([1])+uleb(type_idx[JSANN])+uleb(0)
align4(data); annotation_set_off=abs_off(); data+=p32(1)+p32(annotation_item_off)
align4(data); annotations_dir_off=abs_off(); data+=p32(0)+p32(0)+p32(1)+p32(0)+p32(method_idx[save])+p32(annotation_set_off)
align4(data)
# map
map_off=abs_off(); maps=[]
def amap(t,size,off):
    if size:maps.append((off,t,size))
amap(0x0000,1,0); amap(0x0001,string_ids_size,string_ids_off); amap(0x0002,type_ids_size,type_ids_off); amap(0x0003,proto_ids_size,proto_ids_off); amap(0x0004,field_ids_size,field_ids_off); amap(0x0005,method_ids_size,method_ids_off); amap(0x0006,1,class_defs_off)
if param_off:amap(0x1001,len(param_off),min(param_off.values()))
amap(0x2002,string_ids_size,first_string_data); amap(0x2001,4,first_code_off); amap(0x2000,1,class_data_off); amap(0x2004,1,annotation_item_off); amap(0x1003,1,annotation_set_off); amap(0x2006,1,annotations_dir_off); amap(0x1000,1,map_off); maps.sort()
data+=p32(len(maps))
for off,t,size in maps:data+=struct.pack('<HHII',t,0,size,off)
file_size=data_off+len(data); buf=bytearray(file_size)
pos=string_ids_off
for st in strings: struct.pack_into('<I',buf,pos,string_data_offs[st]);pos+=4
pos=type_ids_off
for t in types:struct.pack_into('<I',buf,pos,str_idx[t]);pos+=4
pos=proto_ids_off
for p in protos:
    r,ps=p;struct.pack_into('<III',buf,pos,str_idx[shorty(p)],type_idx[r],param_off.get(ps,0));pos+=12
pos=field_ids_off
for c,n,t in fields: struct.pack_into('<HHI',buf,pos,type_idx[c],type_idx[t],str_idx[n]); pos+=8
pos=method_ids_off
for m in methods:
    c,n,p=m;struct.pack_into('<HHI',buf,pos,type_idx[c],proto_idx[p],str_idx[n]);pos+=8
struct.pack_into('<IIIIIIII',buf,class_defs_off,type_idx[MAIN],0x1,type_idx[ACT],0,NO_INDEX,annotations_dir_off,class_data_off,0); buf[data_off:]=data
buf[0:8]=b'dex\n035\0'; struct.pack_into('<I',buf,32,file_size); struct.pack_into('<I',buf,36,0x70); struct.pack_into('<I',buf,40,0x12345678); struct.pack_into('<I',buf,52,map_off)
struct.pack_into('<II',buf,56,string_ids_size,string_ids_off);struct.pack_into('<II',buf,64,type_ids_size,type_ids_off);struct.pack_into('<II',buf,72,proto_ids_size,proto_ids_off);struct.pack_into('<II',buf,80,field_ids_size,field_ids_off);struct.pack_into('<II',buf,88,method_ids_size,method_ids_off);struct.pack_into('<II',buf,96,1,class_defs_off);struct.pack_into('<II',buf,104,len(data),data_off)
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
spec=bytearray(struct.pack('<HHI',RES_TABLE_TYPE_SPEC_TYPE,16,20));spec+=struct.pack('<BBHI',1,0,0,1);spec+=p32(0)
config_size=64; config=p32(config_size)+b'\0'*(config_size-4); type_header_size=20+config_size; entries_start=type_header_size+4; type_size=entries_start+16
typechunk=bytearray(struct.pack('<HHI',RES_TABLE_TYPE_TYPE,type_header_size,type_size));typechunk+=struct.pack('<BBHII',1,0,0,1,entries_start);typechunk+=config;typechunk+=p32(0);typechunk+=struct.pack('<HHI',8,0,0);typechunk+=struct.pack('<HBBI',8,0,0x03,0)
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
sp=list(attr_ids)+['android','http://schemas.android.com/apk/res/android','manifest','uses-sdk','uses-permission','application','activity','intent-filter','action','category','package','com.marko.marketrisk.globalplus','3.5.1.50','Market Risk Monitor Global+','android.permission.INTERNET','com.marko.marketrisk.globalplus.MainActivity','android.intent.action.MAIN','android.intent.category.LAUNCHER']
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
xml+=sel('manifest',[attr(None,'package','com.marko.marketrisk.globalplus'),attr(AURI,'versionCode',dtype=TYPE_INT_DEC,data_val=83),attr(AURI,'versionName','3.5.1.50')])
xml+=sel('uses-sdk',[attr(AURI,'minSdkVersion',dtype=TYPE_INT_DEC,data_val=26),attr(AURI,'targetSdkVersion',dtype=TYPE_INT_DEC,data_val=35)]);xml+=eel('uses-sdk')
xml+=sel('uses-permission',[attr(AURI,'name','android.permission.INTERNET')]);xml+=eel('uses-permission')
xml+=sel('application',[attr(AURI,'label','Market Risk Monitor Global+'),attr(AURI,'icon',dtype=TYPE_REFERENCE,data_val=0x7f010000)])
xml+=sel('activity',[attr(AURI,'name','com.marko.marketrisk.globalplus.MainActivity'),attr(AURI,'exported',dtype=TYPE_INT_BOOLEAN,data_val=0xffffffff)])
xml+=sel('intent-filter',[]);xml+=sel('action',[attr(AURI,'name','android.intent.action.MAIN')]);xml+=eel('action');xml+=sel('category',[attr(AURI,'name','android.intent.category.LAUNCHER')]);xml+=eel('category');xml+=eel('intent-filter');xml+=eel('activity');xml+=eel('application');xml+=eel('manifest');xml+=ens(APFX,AURI)
manifest=struct.pack('<HHI',RES_XML_TYPE,8,8+len(xml))+xml;(OUT/'AndroidManifest.xml').write_bytes(manifest)

# ---------------- assets + APK ----------------
html=(ROOT/'app/src/main/assets/index.html').read_bytes();icon=(ROOT/'app/src/main/assets/app_icon.png').read_bytes();(OUT/'index.html').write_bytes(html);(OUT/'app_icon.png').write_bytes(icon)
unsigned=OUT/'MarketRiskMonitor_GlobalPlus_v3.5.1.50_unsigned.apk'
with zipfile.ZipFile(unsigned,'w',compression=zipfile.ZIP_DEFLATED) as z:
    z.write(OUT/'AndroidManifest.xml','AndroidManifest.xml',compress_type=zipfile.ZIP_STORED)
    z.write(OUT/'resources.arsc','resources.arsc',compress_type=zipfile.ZIP_STORED)
    z.write(OUT/'classes.dex','classes.dex',compress_type=zipfile.ZIP_DEFLATED)
    z.write(OUT/'index.html','assets/index.html',compress_type=zipfile.ZIP_DEFLATED)
    z.write(OUT/'app_icon.png','assets/app_icon.png',compress_type=zipfile.ZIP_DEFLATED)
    z.write(OUT/'app_icon.png','res/drawable/app_icon.png',compress_type=zipfile.ZIP_DEFLATED)
print('unsigned',unsigned,unsigned.stat().st_size,'dex',len(buf),'arsc',len(arsc),'manifest',len(manifest),'methods',method_ids_size,'fields',field_ids_size)
