#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --check app.js
for a in intelligence_v39.js smart_alerts_v39.js market_details_v310.js excel_export_v362.js t212_portfolio_v363.js capital_rotation_contributors_v366.js capital_rotation_ui_v367.js global_shortage_v369.js; do node --check "app/src/main/assets/$a"; done
node tests/audit_fixes_v310.cjs
node tests/change_intelligence_alerts_v39.cjs
python3 tests/native_architecture_v310.py
node tests/market_details_v310.js
node tests/market_details_lazy_v310.js
node tests/market_details_ui_v310.js
node tests/market_details_performance_v310.js
node test_global_shortage_model_v369.js
node test_daily_capital_rotation_v365.js
node test_capital_rotation_contributors_v366.js
node test_capital_rotation_consolidated_v367.js
node test_facility_parser.js
node tests/parser_fixture_tests_v35135.js
node tests/agsi_country_fixture_tests_v35140.js
node tests/agsi_coverage_fixture_tests_v35141.js
node tests/bonds_logic_v35175.js
node tests/t212_portfolio_v363.js
node tests/trading212_tradability_v310.js
python3 tests/excel_export_v310.py
python3 - <<'PY'
from pathlib import Path
idx=Path('app/src/main/assets/index.html').read_text(); app=Path('app.js').read_text(); a=idx.find("<script>'use strict';")+len('<script>'); b=idx.find('</script>',a)
assert idx[a:b]==app
for asset in ('intelligence_v39.js','smart_alerts_v39.js','market_details_v310.js','excel_export_v362.js'):
    assert f'<script src="{asset}"></script>' in idx, asset
assert '· v3.10</div>' in idx
print('PASS canonical app.js + v3.10 assets/header')
PY
