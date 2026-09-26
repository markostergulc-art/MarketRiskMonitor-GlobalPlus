'use strict';
const currentLang='en';
const AGSI_EU27_V37=new Set(['AT','BE','BG','HR','CZ','DK','FR','DE','HU','IT','LV','NL','PL','PT','RO','SK','ES','SE']);
function cacheHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function v37CountryCode(x,fallback=''){if(typeof x==='string'&&/^[A-Za-z]{2}$/.test(x))return x.toUpperCase();if(x&&typeof x==='object'){let c=String(x.code||x.slug||x.country_slug||'').toUpperCase();if(/^[A-Z]{2}$/.test(c))return c}let f=String(fallback||'').toUpperCase();return /^[A-Z]{2}$/.test(f)?f:''}
function v37CountryName(x,code){if(x&&typeof x==='object'&&x.name)return String(x.name);if(typeof x==='string'&&x.length>2)return x;return code}
function parseAgsiFacilityListingV37(j){
 if(j&&typeof j==='object'&&j.error)throw new Error(/access denied|api.?key|unauthor/i.test(String(j.error))?'AGSI_INVALID_API_KEY':'GIE: '+j.error);
 if(!j||typeof j!=='object')throw new Error('GIE AGSI facility listing is empty');
 let out=[],seen=new Set(),diag={shape:Array.isArray(j)?'DIRECT_ARRAY':'OBJECT',operators:0,facilityNodes:0,accepted:0,topKeys:Array.isArray(j)?[]:Object.keys(j).slice(0,12)};
 function facilityUrl(node,country,company,eic){let u=String(node&&node.url||'').trim();try{let x=new URL(u);if(x.protocol==='https:'&&x.hostname==='agsi.gie.eu')return x.toString()}catch(_){}return 'https://agsi.gie.eu/api?country='+encodeURIComponent(country)+'&company='+encodeURIComponent(company)+'&facility='+encodeURIComponent(eic)}
 function addFacility(node,ctx={}){if(!node||typeof node!=='object')return;diag.facilityNodes++;let eic=String(node.eic||node.code||'').trim(),type=String(node.type||'').trim(),name=String(node.name||node.short_name||eic||'').trim(),country=v37CountryCode(node.country,node.country_slug||ctx.country),countryName=v37CountryName(node.country,country)||ctx.countryName||country,company=String(node.company||ctx.company||'').trim(),facilityLike=ctx.fromFacilities||/storage\s*(facility|group)|facility|virtual/i.test(type)||!!node.facility;if(!facilityLike)return;if(eic&&company&&country&&AGSI_EU27_V37.has(country)){let key=country+'|'+company+'|'+eic;if(!seen.has(key)){seen.add(key);out.push({key:cacheHash(key),name:name||eic,type:type||'AGSI Storage Dataset',eic,company,country,countryName,url:facilityUrl(node,country,company,eic)});diag.accepted++}}}
 function walk(node,ctx={}){if(Array.isArray(node)){for(const x of node)walk(x,ctx);return}if(!node||typeof node!=='object')return;let cc=v37CountryCode(node.country,node.country_slug||ctx.country),cn=v37CountryName(node.country,cc)||ctx.countryName||cc,facilities=Array.isArray(node.facilities)?node.facilities:null,company=String(node.company||ctx.company||'').trim();if(facilities){diag.operators++;company=String(node.eic||node.company||company||'').trim();for(const f of facilities)addFacility(f,{country:cc,countryName:cn,company,fromFacilities:true})}else if(node.company&&node.eic)addFacility(node,{country:cc,countryName:cn,company:String(node.company),fromFacilities:true});for(const [k,v] of Object.entries(node)){if(k==='facilities'||k==='image'||k==='logo')continue;if(v&&typeof v==='object')walk(v,{country:cc,countryName:cn,company})}}
 let roots=j;if(!Array.isArray(j)){for(const k of ['data','result','items','listing'])if(Array.isArray(j[k])){roots=j[k];diag.shape=k.toUpperCase()+'_ARRAY';break}}
 walk(roots,{});out.diag=diag;if(!out.length)throw new Error('No EU AGSI facility datasets found in listing (shape='+diag.shape+', operators='+diag.operators+', facilityNodes='+diag.facilityNodes+', topKeys='+(diag.topKeys.join(',')||'none')+')');return out}

const facility={name:'UGS Haidach (astora)',type:'Storage Facility',eic:'21W000000000078N',country:'AT',company:'21X000000001160J',url:'https://agsi.gie.eu/api?country=AT&company=21X000000001160J&facility=21W000000000078N'};
const op={name:'astora GmbH',type:'SSO',eic:'21X000000001160J',country:'AT',facilities:[facility]};
const cases=[
 ['v007-direct',[op]],
 ['data-wrapper',{data:[op]}],
 ['result-wrapper',{result:[op]}],
 ['v005-hierarchical',{sso:{Europe:{Austria:[{name:'astora',eic:'21X000000001160J',data:{type:'SSO',country:{code:'AT',name:'Austria'}},facilities:[{name:'UGS Haidach',type:'Storage Facility',eic:'21W000000000078N',country:{code:'AT',name:'Austria'}}]}]}}}],
];
for(const [name,j] of cases){const r=parseAgsiFacilityListingV37(j);if(r.length!==1)throw new Error(name+' expected 1 got '+r.length);if(r[0].eic!=='21W000000000078N')throw new Error(name+' wrong eic');console.log('PASS',name,r.diag.shape,r.diag.operators,r.diag.facilityNodes,r[0].url)}
let threw=false;try{parseAgsiFacilityListingV37({data:[]})}catch(e){threw=/shape=DATA_ARRAY/.test(e.message);console.log('PASS empty diagnostic',e.message)}if(!threw)throw new Error('empty diagnostic failed');
