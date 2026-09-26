#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --check app.js
node --check app/src/main/assets/excel_export_v362.js
node --check app/src/main/assets/t212_portfolio_v363.js
node --check app/src/main/assets/capital_rotation_contributors_v366.js
node --check app/src/main/assets/capital_rotation_ui_v367.js
node --check app/src/main/assets/global_shortage_v369.js
node tests/audit_fixes_v38.cjs
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
node tests/trading212_tradability_v363.js
python3 tests/excel_export_v363.py
python3 - <<'PY'
from pathlib import Path
idx=Path('app/src/main/assets/index.html').read_text(); app=Path('app.js').read_text(); a=idx.find("<script>'use strict';")+len('<script>'); b=idx.find('</script>',a)
assert a>=len('<script>') and b>a and idx[a:b]==app
print('PASS canonical app.js is byte/text-identical to embedded runtime block')
PY
