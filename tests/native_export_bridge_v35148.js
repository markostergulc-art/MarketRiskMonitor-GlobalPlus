const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const src=fs.readFileSync('app.js','utf8'); let p=0,f=0;
function ok(c,m){if(c){console.log('PASS - '+m);p++}else{console.error('FAIL - '+m);f++}}
function extract(text,name){let a=text.indexOf('async function '+name+'(');if(a<0)a=text.indexOf('function '+name+'(');if(a<0)return'';let par=text.indexOf('(',a),pd=0,q=null,e=false,b=-1;for(let i=par;i<text.length;i++){let c=text[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='(')pd++;else if(c===')'&&--pd===0){b=text.indexOf('{',i+1);break}}if(b<0)return'';let d=0;q=null;e=false;for(let i=b;i<text.length;i++){let c=text[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(a,i+1)}return''}
const funcs=['downloadBlobV47','setExportStatusV47','blobBase64V48','androidWebViewV48','saveExportBlobV48'];
for(const n of funcs)ok(!!extract(src,n),n+' present');
ok(extract(src,'saveExportBlobV48').includes('Android.saveExportFile'),'native save bridge is used');
ok(extract(src,'saveExportBlobV48').includes('downloadBlobV47'),'browser fallback retained');
ok(extract(src,'saveExportBlobV48').includes('Native Android export bridge'),'Android WebView without bridge fails visibly');
ok(!/downloadBlobV47\(blob,name\)/.test(extract(src,'exportDataV47')),'data export no longer directly relies on anchor download');
ok(!/downloadBlobV47\(/.test(extract(src,'exportMethodologyV47')),'methodology export no longer directly relies on anchor download');
ok(extract(src,'exportDataV47').includes("Preparing export")&&extract(src,'exportDataV47').includes("Saved: "),'data export exposes prepare/save/saved states');
ok(extract(src,'exportMethodologyV47').includes("Preparing export")&&extract(src,'exportMethodologyV47').includes("Saved: "),'methodology export exposes prepare/save/saved states');

class FR{readAsDataURL(blob){blob.arrayBuffer().then(ab=>{this.result='data:'+blob.type+';base64,'+Buffer.from(ab).toString('base64');this.onload&&this.onload()}).catch(e=>this.onerror&&this.onerror(e))}}
let statuses=[], last=null, browser=false;
const ctx={Blob,FileReader:FR,console,Buffer,setTimeout,clearTimeout,L:(hr,en)=>en,setExportStatusV47:(m,o=true)=>statuses.push([m,o]),downloadBlobV47:()=>{browser=true},navigator:{userAgent:'Mozilla/5.0 (Linux; Android 15; wv)'},window:{},Android:null};ctx.window=ctx;vm.createContext(ctx);
for(const n of ['blobBase64V48','androidWebViewV48','saveExportBlobV48'])vm.runInContext(extract(src,n),ctx);
(async()=>{
 const raw=Buffer.from('PK\x03\x04native-export-byte-roundtrip-čćžšđ','utf8');
 ctx.Android={saveExportFile:(name,mime,b64)=>{last={name,mime,b64};return 'OK|'+name}};ctx.window.Android=ctx.Android;
 let r=await ctx.saveExportBlobV48(new Blob([raw],{type:'application/zip'}),'test.zip','application/zip');
 ok(r.native===true&&r.name==='test.zip','native bridge success is confirmed before UI success');
 let decoded=Buffer.from(last.b64,'base64');ok(decoded.equals(raw),'base64 transport preserves bytes exactly');
 ok(crypto.createHash('sha256').update(decoded).digest('hex')===crypto.createHash('sha256').update(raw).digest('hex'),'SHA-256 before/after base64 transport is identical');
 ok(last.mime==='application/zip','MIME type is passed to native bridge');
 ctx.Android={saveExportFile:()=> 'ERROR|simulated failure'};ctx.window.Android=ctx.Android;let threw=false;try{await ctx.saveExportBlobV48(new Blob(['x']),'x.md','text/markdown')}catch(e){threw=/simulated failure/.test(String(e.message))}ok(threw,'native save failure is surfaced');
 ctx.Android=null;delete ctx.window.Android;threw=false;try{await ctx.saveExportBlobV48(new Blob(['x']),'x.md','text/markdown')}catch(e){threw=/bridge is unavailable/.test(String(e.message))}ok(threw,'Android WebView without bridge does not silently fall back');
 ctx.navigator.userAgent='Mozilla/5.0 desktop';browser=false;let br=await ctx.saveExportBlobV48(new Blob(['x']),'x.md','text/markdown');ok(br.native===false&&browser,'non-Android browser fallback remains available');
 const java=fs.readFileSync('app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java','utf8');
 ok(java.includes('@JavascriptInterface public String saveExportFile'),'full Android source exposes narrow saveExportFile bridge');
 ok(java.includes('MediaStore.Downloads.EXTERNAL_CONTENT_URI')&&java.includes('RELATIVE_PATH'),'full Android source uses MediaStore Downloads on Android 10+');
 ok(java.includes('getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)'),'legacy safe fallback uses app-specific external Downloads');
 ok(java.includes('replaceAll("[^A-Za-z0-9._-]", "_")'),'native filename sanitization prevents separators/path traversal');
 ok(java.includes('12 * 1024 * 1024'),'native 12 MB limit present');
 ok(!java.includes('MANAGE_EXTERNAL_STORAGE'),'no MANAGE_EXTERNAL_STORAGE dependency');
 console.log(`RESULT - ${p}/${p+f} v3.5.1.48 native-export bridge checks PASS`); if(f)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
