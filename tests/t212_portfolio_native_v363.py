#!/usr/bin/env python3
from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
java=(root/'app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java').read_text()
html=(root/'app/src/main/assets/index.html').read_text()
js=(root/'app/src/main/assets/t212_portfolio_v363.js').read_text()
builder=(root/'tools/build_manual_apk_v363.py').read_text()
checks=[]
def ck(name, ok): checks.append((name,bool(ok)))

ck('source_version_363_113', "versionCode 113" in (root/'app/build.gradle').read_text() and "versionName '3.6.3'" in (root/'app/build.gradle').read_text())
ck('native_positions_endpoint', '/api/v0/equity/positions' in java)
ck('native_account_summary_endpoint', '/api/v0/equity/account/summary' in java)
ck('native_asset_intercept', 't212_portfolio_v363.js' in java)
ck('browser_positions_endpoint', '/api/v0/equity/positions' in js)
ck('browser_account_endpoint', '/api/v0/equity/account/summary' in js)
ck('new_tab_present', 'data-page="t212portfolio"' in html and 'id="t212portfolio"' in html)
ck('refresh_hook_present', "p==='t212portfolio'" in html)
ck('external_asset_loaded', '<script src="t212_portfolio_v363.js"></script>' in html)
ck('manual_builder_packages_asset', "assets/t212_portfolio_v363.js" in builder)
# Read-only guard: do not permit Trading 212 order placement paths in new code.
order_pat=re.compile(r'/api/v0/equity/(orders|portfolio/orders|purchases|sells)|placeOrder|createOrder|cancelOrder',re.I)
ck('no_order_endpoint_in_module', not order_pat.search(js))
ck('no_order_endpoint_in_native_patch', not order_pat.search(java))
# Prevent stock-specific hard-coded verdict maps.
verdict_map=re.compile(r"(?:AAPL|MSFT|NVDA|TSLA|AMZN|GOOGL|META)[^\n]{0,80}(?:KEEP|SELL REVIEW|REDUCE / REVIEW)",re.I)
ck('no_stock_specific_verdict_map', not verdict_map.search(js))

bad=[n for n,ok in checks if not ok]
for n,ok in checks: print(('PASS' if ok else 'FAIL'), n)
print(f'RESULT {len(checks)-len(bad)}/{len(checks)}')
raise SystemExit(1 if bad else 0)
