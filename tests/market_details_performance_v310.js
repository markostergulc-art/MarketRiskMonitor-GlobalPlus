const fs=require('fs'),assert=require('assert');
const mod=fs.readFileSync('app/src/main/assets/market_details_v310.js','utf8'),app=fs.readFileSync('app.js','utf8');
assert(!/MRMMarketDetailsV310\.load\([^)]*\)/.test(app),'main refresh must not call market-detail loader');
assert(app.includes('MRMMarketDetailsV310.open(code)'),'detail load starts from market open only');
assert(mod.includes("Promise.allSettled"),'metric failures must be isolated');
assert(mod.includes("state.activeCode===code"),'cross-market render guard missing');
assert(mod.includes("freshCached"),'fresh-cache request suppression missing');
assert(mod.includes("no valid observation"),'null/error isolation missing');
console.log('market_details_performance_v310: PASS');
