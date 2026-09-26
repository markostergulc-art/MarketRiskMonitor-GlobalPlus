#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --check app.js
node tests/phase4_semantics_v35152.js
node tests/phase4_regression_v35152.js
node tests/confidence_model_v35151.js
node tests/coverage_limited_data_regression_v35151.js
node tests/freshness_semantics_v35149.js
node tests/parser_fixture_tests.js
node tests/agsi_country_fixture_tests_v35140.js
node tests/agsi_coverage_fixture_tests_v35141.js
node tests/fiscal_freshness_loading_tests_v35144.js
node tests/native_export_bridge_v35148.js
python tools/build_manual_apk_v35152.py
python tools/zipalign4_fallback.py manual_apk_build_v35152/MarketRiskMonitor_GlobalPlus_v3.5.1.52_unsigned.apk manual_apk_build_v35152/MarketRiskMonitor_GlobalPlus_v3.5.1.52_unsigned_aligned.apk
python tools/verify_fallback_apk_v35152.py manual_apk_build_v35152/MarketRiskMonitor_GlobalPlus_v3.5.1.52_unsigned_aligned.apk
printf 'PHASE 4 RELEASE QA PASS\n'
