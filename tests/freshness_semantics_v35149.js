const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync(require('path').join(__dirname,'..','app.js'),'utf8');
const a=src.indexOf("const FRED_RUNTIME_META_V49={};");
const b=src.indexOf("function freshness(dateStr",a);
if(a<0||b<0)throw new Error('freshness v49 block not found');
const block=src.slice(a,b);
const ctx={console,Date,decodeURIComponent,Math,Number,String};
vm.createContext(ctx);vm.runInContext(block+';this.f=freshnessModelV49;this.ff=fredFrequencyV49;this.id=fredSeriesIdV49;',ctx);
const NOW=Date.parse('2026-09-14T12:00:00Z');
let n=0;
function t(name,cond,detail=''){n++;if(!cond){console.error('FAIL',name,detail);process.exitCode=1}else console.log('PASS',name)}
function fresh(o){return ctx.f({...o,nowMs:NOW})}
let x;
x=fresh({observationDate:'2026-09-04',frequency:'weekly',provider:'FRED',seriesId:'NFCI'});
t('NFCI current latest release',x.freshnessStatus==='CURRENT',JSON.stringify(x));
t('NFCI expected next release',x.expectedNextRelease==='2026-09-16',JSON.stringify(x));
x=fresh({observationDate:'2026-09-04',frequency:'weekly',provider:'FRED',seriesId:'NFCIRISK'});t('NFCI Risk same semantics',x.freshnessStatus==='CURRENT',JSON.stringify(x));
x=fresh({observationDate:'2026-09-04',frequency:'weekly',provider:'FRED',seriesId:'NFCICREDIT'});t('NFCI Credit same semantics',x.freshnessStatus==='CURRENT',JSON.stringify(x));
x=fresh({observationDate:'2026-09-04',frequency:'weekly',provider:'FRED',seriesId:'STLFSI4'});t('STLFSI4 current latest release',x.freshnessStatus==='CURRENT'&&x.expectedNextRelease==='2026-09-16',JSON.stringify(x));
x=fresh({observationDate:'2026-09-02',frequency:'weekly',provider:'FRED',seriesId:'DPSACBW027SBOG'});t('Bank deposits current until scheduled release',x.freshnessStatus==='CURRENT'&&x.expectedNextRelease==='2026-09-18',JSON.stringify(x));
x=fresh({observationDate:'2026-07-01',frequency:'quarterly',provider:'FRED',seriesId:'DRTSCILM'});t('SLOOS old but latest provider release',x.freshnessStatus==='OLD_BUT_CURRENT_RELEASE'&&x.expectedNextRelease===null,JSON.stringify(x));
for(const id of ['DRBLACBS','DRSREACBS','DRCRELEXFACBS','DRCRELEXFOBS']){x=fresh({observationDate:'2026-04-01',frequency:'quarterly',provider:'FRED',seriesId:id});t(id+' quarterly old but current release',x.freshnessStatus==='OLD_BUT_CURRENT_RELEASE'&&x.expectedNextRelease===null,JSON.stringify(x));}
x=ctx.f({observationDate:'2026-09-04',frequency:'weekly',provider:'FRED',seriesId:'NFCI',nowMs:Date.parse('2026-09-17T12:00:00Z')});t('Known weekly release one day overdue is LATE',x.freshnessStatus==='LATE',JSON.stringify(x));
x=ctx.f({observationDate:'2026-09-04',frequency:'weekly',provider:'FRED',seriesId:'NFCI',nowMs:Date.parse('2026-09-20T12:00:00Z')});t('Known newer expected release unresolved becomes STALE',x.freshnessStatus==='STALE',JSON.stringify(x));
x=fresh({observationDate:null,frequency:'quarterly',provider:'FRED',seriesId:'DRTSCILM'});t('Missing observation is UNKNOWN',x.freshnessStatus==='UNKNOWN',JSON.stringify(x));
x=fresh({observationDate:'2026-01-01',frequency:'event',provider:'US Treasury'});t('Event release schedule stays UNKNOWN',x.freshnessStatus==='UNKNOWN'&&x.expectedNextRelease===null,JSON.stringify(x));
t('FRED quarterly mapping',ctx.ff('DRBLACBS','macro')==='quarterly');
t('FRED weekly mapping',ctx.ff('NFCI','macro')==='weekly');
t('No fabricated schedule for quarterly',fresh({observationDate:'2026-04-01',frequency:'quarterly',provider:'FRED',seriesId:'DRBLACBS'}).expectedNextRelease===null);
const fake={sourceUrl:'https://fred.stlouisfed.org/graph/fredgraph.csv?id=NFCICREDIT'};
t('Series id parsed from FRED URL',ctx.id(fake)==='NFCICREDIT');
if(!process.exitCode)console.log(`RESULT ${n}/${n} PASS`);
