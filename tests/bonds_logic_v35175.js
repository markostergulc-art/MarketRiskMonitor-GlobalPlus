const fs=require('fs'),vm=require('vm');const src=fs.readFileSync(require('path').join(__dirname,'..','app.js'),'utf8');
function fn(name){const start=src.indexOf('function '+name+'(');if(start<0)throw Error(name);let b=src.indexOf('{',start),d=0,q=null,t=false,e=false;for(let i=b;i<src.length;i++){let c=src[i];if(q){if(e)e=false;else if(c==='\\')e=true;else if(c===q)q=null}else if(t){if(e)e=false;else if(c==='\\')e=true;else if(c==='`')t=false}else{if(c==='"'||c==="'")q=c;else if(c==='`')t=true;else if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(start,i+1)}}}
let code=['bondSlopeV75','bondCurveClassV75','bondStressStatusV75','bondRegimeV75'].map(fn).join('\n');let ctx={Object,Number,Math};vm.createContext(ctx);vm.runInContext(code,ctx);let tests=0;
function ok(x,msg){tests++;if(!x){console.error('FAIL',msg);process.exitCode=1}}
const m=(v,m1=0,p=50)=>({value:v,m1,percentile:p});
let c=ctx.bondCurveClassV75({US3M:m(5),US2:m(4.8,-40),US10:m(4.0,-15)});ok(c.shape==='INVERTED','inverted');ok(c.move==='BULL STEEPENER','bull steepener');
c=ctx.bondCurveClassV75({US3M:m(3),US2:m(3.5,20),US10:m(4.5,40)});ok(c.shape==='NORMAL','normal');ok(c.move==='BEAR STEEPENER','bear steepener');
ok(ctx.bondStressStatusV75({percentile:95,m1:12},'credit')==='STRESS','credit percentile stress');ok(ctx.bondStressStatusV75({percentile:40,m1:35},'credit')==='STRESS','credit widening stress');ok(ctx.bondStressStatusV75({percentile:20,m1:0},'credit')==='TIGHT','tight credit');
let d={us:{US2:m(4,-30),US10:m(3.8,-20)},curve:{move:'BULL STEEPENER'},credit:{usHy:{status:'NORMAL'},usIg:{status:'NORMAL'},euroHy:{status:'NORMAL'}},sovereign:{fr:{status:'NORMAL'},it:{status:'NORMAL'}},real:{be10:m(2,0),real10:m(1,0)}};ok(ctx.bondRegimeV75(d)==='RECESSION PRICING','recession pricing');d.credit.usHy.status='STRESS';ok(ctx.bondRegimeV75(d)==='CREDIT / LIQUIDITY STRESS','credit priority');d.credit.usHy.status='NORMAL';d.sovereign.it.status='STRESS';ok(ctx.bondRegimeV75(d)==='FISCAL / SOVEREIGN STRESS','sovereign priority');
d.sovereign.it.status='NORMAL';d.us.US2=m(4,5);d.us.US10=m(4.3,20);d.curve.move='BEAR STEEPENER';d.real.be10=m(2.6,20);ok(ctx.bondRegimeV75(d)==='INFLATION STRESS','inflation stress');
d.real.be10=m(2.2,0);d.us.US2=m(4.5,25);d.us.US10=m(4.4,10);ok(ctx.bondRegimeV75(d)==='MONETARY TIGHTENING','monetary tightening');
d.us.US2=m(3.5,-25);d.us.US10=m(3.8,2);ok(ctx.bondRegimeV75(d)==='MONETARY EASING','monetary easing');
console.log(tests+'/'+tests+' PASS');
