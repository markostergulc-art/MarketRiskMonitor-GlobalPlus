from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
app=(root/'app.js').read_text()
mod=(root/'app/src/main/assets/market_details_v310.js').read_text()
# Entire card remains click target and opens existing detail route.
assert "document.querySelectorAll('.market-card').forEach(el=>el.onclick=()=>openMarket(el.dataset.code))" in app
# openMarket integrates universal market details layer directly.
open_block=re.search(r'function openMarket\(code,pushRoute=true\)\{([\s\S]*?)\nfunction ',app)
assert open_block
assert 'MRMMarketDetailsV310.open(code)' in open_block.group(0)
# Module resolves authoritative universe rather than a hardcoded subset.
assert 'activeMarketConfig()' in mod
assert 'function marketContract(code)' in mod
print('market_click_details_20260926: PASS · whole card -> openMarket -> universal details')
