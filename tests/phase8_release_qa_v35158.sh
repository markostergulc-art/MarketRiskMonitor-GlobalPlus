#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo '=== Market Risk Monitor Global+ v3.5.1.58 Phase 8 Release QA ==='
node --check app.js
node tests/phase8_correlation_timezone_v35158.js
node tests/phase7_equity_weighting_v35157.js
node tests/phase6_auditability_phase8_compat_v35158.js
node tests/phase5_factor_architecture_phase7_compat_v35157.js
node tests/phase4_semantics_v35152.js
node tests/confidence_model_phase7_compat_v35157.js
node tests/freshness_semantics_v35149.js
node tests/fiscal_freshness_loading_phase8_compat_v35158.js
node tests/parser_fixture_tests.js
node tests/agsi_country_fixture_tests_v35140.js
node tests/agsi_coverage_fixture_tests_v35141.js
node tests/native_export_bridge_v35148.js
if [[ ! -f manual_apk_build_v35158/MarketRiskMonitor_GlobalPlus_v3.5.1.58_unsigned_aligned.apk ]]; then
  python tools/build_manual_apk_v35158.py
fi
python tools/verify_fallback_apk_v35158.py manual_apk_build_v35158/MarketRiskMonitor_GlobalPlus_v3.5.1.58_unsigned_aligned.apk

echo '=== RELEASE QA PASS: 388/388 JS assertions + syntax + APK structure checks ==='
