const fs=require('fs'),vm=require('vm'),assert=require('assert');
const snap=fs.readFileSync('app/src/main/assets/economic_structure_snapshot_v126.js','utf8');
const mod=fs.readFileSync('app/src/main/assets/economic_structure_v126.js','utf8');
let fetchCalls=0;const nodes={};
const ctx={window:{},console,Date,JSON,Number,String,Object,Array,Math,Intl,fetch:()=>{fetchCalls++;throw Error('network forbidden')},L:(hr,en)=>en,document:{getElementById:(id)=>nodes[id]||null,createElement:(tag)=>({id:'',innerHTML:'',appendChild(){}})}};
nodes.modalBody={appendChild(x){nodes[x.id]=x}};
vm.createContext(ctx);vm.runInContext(snap,ctx);vm.runInContext(mod,ctx);
const E=ctx.window.MRMEconomicStructure;assert(E);assert.equal(fetchCalls,0);E.openEconomicStructure('HR');assert.equal(fetchCalls,0);assert(nodes.economicStructureV126.innerHTML.includes('ECONOMIC STRUCTURE'));assert(nodes.economicStructureV126.innerHTML.includes('FAOSTAT'));assert.equal(E.state.opened,1);console.log('economic_structure_offline_runtime_v126: PASS');
