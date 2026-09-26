#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --check app.js
for a in intelligence_v39.js smart_alerts_v39.js market_details_v310.js economic_structure_snapshot_v126.js economic_structure_v126.js excel_export_v362.js t212_portfolio_v363.js capital_rotation_contributors_v366.js capital_rotation_ui_v367.js global_shortage_v369.js; do node --check "app/src/main/assets/$a"; done
# Preserve all unrelated legacy regression suites.
node tests/change_intelligence_alerts_v39.cjs
node tests/market_details_v310.js
node tests/market_details_lazy_v310.js
node tests/market_details_ui_v310.js
node tests/market_details_performance_v310.js
python3 tests/versioning_date_20260926_3.py
python3 tests/market_cards_inventory_20260926.py
python3 tests/market_card_macro_priority_20260926.py
python3 tests/market_evidence_button_removed_20260926.py
python3 tests/market_click_details_20260926.py
python3 tests/market_macro_evidence_20260926.py
node tests/market_risk_evidence_20260926.js
python3 tests/market_source_eligibility_20260926.py
python3 tests/extended_market_evidence_20260926.py
python3 tests/economic_structure_snapshot_schema_v126.py
python3 tests/economic_structure_refresh_framework_v126.py
python3 tests/economic_structure_worldbank_snapshot_v126.py
python3 tests/economic_structure_comtrade_snapshot_v126.py
python3 tests/economic_structure_usgs_snapshot_v126.py
python3 tests/economic_structure_faostat_snapshot_v126.py
node tests/economic_structure_offline_runtime_v126.js
python3 tests/economic_structure_release_gate_v126.py
python3 tests/economic_structure_final_acceptance_v126.py
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
python3 - <<'PY'
from pathlib import Path
idx=Path('app/src/main/assets/index.html').read_text(); app=Path('app.js').read_text(); st=idx.rfind("<script>'use strict';"); a=st+len('<script>'); b=idx.find('</script>',a)
assert idx[a:b]==app
for asset in ('intelligence_v39.js','smart_alerts_v39.js','market_details_v310.js','economic_structure_snapshot_v126.js','economic_structure_v126.js','excel_export_v362.js'):
    assert f'<script src="{asset}"></script>' in idx, asset
assert 'economic_structure_v125.js' not in idx
assert '· 2026.09.26.3</div>' in idx
print('PASS canonical app.js + BUILD126 assets/header')
PY
