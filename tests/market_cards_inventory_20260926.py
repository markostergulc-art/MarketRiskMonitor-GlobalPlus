from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
app=(root/'app.js').read_text()
block=re.search(r'const MARKET_CONFIG=\[([\s\S]*?)\n\];',app)
assert block, 'MARKET_CONFIG missing'
entries=re.findall(r"\{code:'([^']+)'",block.group(1))
assert len(entries)==36, f'expected 36 core markets, got {len(entries)}'
assert len(set(entries))==36
assert 'function marketCard(c)' in app
assert 'function renderMarkets()' in app
assert 'function openMarket(code,pushRoute=true)' in app
assert 'attachMarketClicks()' in app
print('market_cards_inventory_20260926: PASS · 36 authoritative core markets · existing card/detail flow reused')
