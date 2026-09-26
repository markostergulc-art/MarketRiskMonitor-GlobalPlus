const fs=require('fs'),crypto=require('crypto');
const src=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const hashes=JSON.parse(fs.readFileSync('tests/protected_hashes_v35145.json','utf8'));
let p=0,f=0;function ok(c,m){if(c){console.log('PASS - '+m);p++}else{console.error('FAIL - '+m);f++}}
function extract(text,name){let a=text.indexOf('function '+name+'(');if(a<0)a=text.indexOf('async function '+name+'(');if(a<0)return'';let par=text.indexOf('(',a),pd=0,q=null,e=false,b=-1;for(let i=par;i<text.length;i++){let c=text[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='(')pd++;else if(c===')'&&--pd===0){b=text.indexOf('{',i+1);break}}if(b<0)return'';let d=0;q=null;e=false;for(let i=b;i<text.length;i++){let c=text[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null;continue}if(c==='"'||c==="'"||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return text.slice(a,i+1)}return''}
function hash(x){return crypto.createHash('sha256').update(x).digest('hex')}
let currentLang='en'; function L(hr,en){return currentLang==='hr'?hr:en} function locale(){return currentLang==='hr'?'hr-HR':'en-US'}
for(const n of ['chartDateV45','marketCardSpanHintV46','marketCardDateV46','marketCardSparkPeriodV46']) eval(extract(src,n));

// A/B/C: same shared Markets renderer covers France, Germany, Canada and every other core market card.
let s=[{d:'2026-06-15',v:100},{d:'2026-07-15',v:101},{d:'2026-08-15',v:102},{d:'2026-09-14',v:103}];
let label=marketCardSparkPeriodV46(s);
ok(/≈3M/.test(label)&&/2026/.test(label)&&/Jun|June/.test(label)&&/Sep|September/.test(label),'actual ~3M market-card window is visible with first/last dates');
ok(extract(src,'marketCard').includes('marketCardSparkPeriodV46(sparkSeries)')&&extract(src,'marketCard').includes('market-spark-period-v46'),'France/Germany/Canada share the period-enabled Markets card renderer');

// D/E: correct first and last valid timestamps even with missing dates on displayed points.
let missing=[{d:null,v:1},{d:'2026-08-20',v:2},{d:'bad-date',v:3},{d:'2026-09-14',v:4},{d:null,v:5}];
label=marketCardSparkPeriodV46(missing);
ok(/Aug/.test(label)&&/Sep/.test(label)&&/2026/.test(label),'missing timestamps are skipped; first/last valid timestamps define period');

// F: no date evidence => no invented range.
ok(marketCardSparkPeriodV46([{v:1},{d:'bad',v:2}])==='','no valid timestamps => no invented period');

// G: displayed data window follows exactly the same last-n slice used by sparklineSvg.
let many=[];for(let i=0;i<70;i++){let d=new Date(Date.UTC(2026,0,1+i));many.push({d:d.toISOString().slice(0,10),v:100+i})}
label=marketCardSparkPeriodV46(many,65);
ok(!/Jan 1|1 Jan/.test(label)&&(/Jan 6|6 Jan/.test(label)),'period derives from the actual last 65 displayed observations, not hidden older points');

// Localization is presentation-only.
currentLang='hr'; label=marketCardSparkPeriodV46(s); ok(label.includes('mj')&&label.includes('2026'),'Croatian compact period label supported'); currentLang='en';

// H: sparkline itself unchanged.
ok(hash(extract(src,'sparklineSvg'))===hashes.sparklineSvg.sha256,'sparklineSvg data/render logic byte-identical to v45');

// I: scheduler/loading observer and protected financial/fiscal functions unchanged.
for(const [n,meta] of Object.entries(hashes)){
  if(n==='sparklineSvg')continue;
  ok(hash(extract(src,n))===meta.sha256,n+' byte-identical to v45');
}

// J: no additional network calls; fetch wrapper unchanged.
ok(hash(extract(src,'fetchWithTimeout'))===hashes.fetchWithTimeout.sha256,'network fetch wrapper unchanged; period label adds no request');
ok(html.includes('.market-spark-period-v46'),'compact mobile Markets-card period CSS present');
ok(/versionCode\s+79/.test(fs.readFileSync('app/build.gradle','utf8'))&&/versionName\s+'3\.5\.1\.46'/.test(fs.readFileSync('app/build.gradle','utf8')),'v3.5.1.46 / versionCode 79 metadata');
ok(html.includes('v3.5.1_46'),'visible UI version is v3.5.1_46');
let st=html.lastIndexOf("<script>'use strict';"),en=html.indexOf('</script>',st),embedded=html.slice(st+'<script>'.length,en);ok(embedded===src.trimEnd(),'embedded app.js byte-identical to canonical app.js');
console.log(`RESULT - ${p}/${p+f} v3.5.1.46 Markets-card sparkline-period checks PASS`);if(f)process.exit(1);
