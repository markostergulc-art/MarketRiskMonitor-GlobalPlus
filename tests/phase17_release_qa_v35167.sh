#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node tests/phase17_methodology_export_v35167.js
node tests/phase16_final_ui_explanation_phase17_compat_v35167.js
node tests/phase15_final_global_architecture_phase17_compat_v35167.js
node tests/phase14_historical_validation_phase17_compat_v35167.js
python3 tests/phase14_offline_tool_v35164.py
node tests/phase13_score_hysteresis_phase17_compat_v35167.js
node tests/phase12_source_resilience_phase17_compat_v35167.js
node tests/phase11_commodity_physical_phase17_compat_v35167.js
node tests/phase10_fiscal_structural_phase17_compat_v35167.js
node tests/phase9_macro_globalization_phase17_compat_v35167.js
node tests/phase8_correlation_timezone_phase17_compat_v35167.js
node tests/phase7_equity_weighting_v35157.js
node tests/phase6_auditability_phase17_compat_v35167.js
node tests/phase5_factor_architecture_phase7_compat_v35157.js
node tests/phase4_semantics_v35152.js
node tests/confidence_model_phase7_compat_v35157.js
node tests/freshness_semantics_v35149.js
node tests/fiscal_freshness_loading_phase17_compat_v35167.js
node tests/parser_fixture_tests.js
node tests/agsi_country_fixture_tests_v35140.js
node tests/agsi_coverage_fixture_tests_v35141.js
node tests/native_export_bridge_v35148.js
node --check app.js
python3 -m py_compile tools/historical_validation_v35164.py tools/build_manual_apk_v35167.py tools/verify_fallback_apk_v35167.py tools/apk_v2v3_sign.py tools/apk_v2v3_verify.py
echo 'PHASE 17 RELEASE QA PASS'
