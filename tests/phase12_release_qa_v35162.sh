#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo '=== Market Risk Monitor Global+ v3.5.1.62 Phase 12 Release QA ==='
node --check app.js
node tests/phase12_source_resilience_v35162.js
node tests/phase11_commodity_physical_phase12_compat_v35162.js
node tests/phase10_fiscal_structural_phase12_compat_v35162.js
node tests/phase9_macro_globalization_phase12_compat_v35162.js
node tests/phase8_correlation_timezone_phase12_compat_v35162.js
node tests/phase7_equity_weighting_v35157.js
node tests/phase6_auditability_phase12_compat_v35162.js
node tests/phase5_factor_architecture_phase7_compat_v35157.js
node tests/phase4_semantics_v35152.js
node tests/confidence_model_phase7_compat_v35157.js
node tests/freshness_semantics_v35149.js
node tests/fiscal_freshness_loading_phase12_compat_v35162.js
node tests/parser_fixture_tests.js
node tests/agsi_country_fixture_tests_v35140.js
node tests/agsi_coverage_fixture_tests_v35141.js
node tests/native_export_bridge_v35148.js
if [[ ! -f manual_apk_build_v35162/MarketRiskMonitor_GlobalPlus_v3.5.1.62_unsigned_aligned.apk ]]; then
  python tools/build_manual_apk_v35162.py
fi
python tools/verify_fallback_apk_v35162.py manual_apk_build_v35162/MarketRiskMonitor_GlobalPlus_v3.5.1.62_unsigned_aligned.apk
echo '=== RELEASE QA PASS: 634/634 JS assertions + syntax + APK structure checks ==='
