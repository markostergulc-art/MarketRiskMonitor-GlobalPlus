#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Economic Structure release gate: local verified snapshot must exist and be <30 days old.
set +e
python3 tools/refresh_economic_structure.py --check
ES_CHECK=$?
set -e
if [[ "$ES_CHECK" -eq 2 ]]; then
  echo "Economic Structure snapshot requires refresh; running mandatory build-time refresh..."
  python3 tools/refresh_economic_structure.py --refresh
elif [[ "$ES_CHECK" -ne 0 ]]; then
  echo "Economic Structure snapshot check failed" >&2; exit "$ES_CHECK"
fi
python3 tests/economic_structure_release_gate_v126.py

PROPS="signing/keystore.properties"
[[ -f "$PROPS" ]] || { echo "Missing $PROPS" >&2; exit 1; }
prop(){ sed -n "s/^$1=//p" "$PROPS" | tail -1; }
STORE_FILE="$(prop storeFile)"; STORE_PASS="$(prop storePassword)"; KEY_ALIAS="$(prop keyAlias)"; KEY_PASS="$(prop keyPassword)"
KS="signing/$STORE_FILE"; [[ -f "$KS" ]] || { echo "Missing release keystore" >&2; exit 1; }
python3 tools/build_manual_apk_20260926_3.py
BASE="manual_apk_build_20260926_3/MarketRiskMonitor_GlobalPlus_2026.09.26.3_unsigned_aligned.apk"
V1="manual_apk_build_20260926_3/MarketRiskMonitor_GlobalPlus_2026.09.26.3_v1.apk"
ALIGNED="manual_apk_build_20260926_3/MarketRiskMonitor_GlobalPlus_2026.09.26.3_v1_aligned.apk"
FINAL="MarketRiskMonitor_GlobalPlus_2026.09.26.3_BUILD126_signed.apk"
cp "$BASE" "$V1"
jarsigner -keystore "$KS" -storetype PKCS12 -storepass "$STORE_PASS" -keypass "$KEY_PASS" -sigalg SHA256withRSA -digestalg SHA-256 "$V1" "$KEY_ALIAS"
python3 tools/zipalign4_fallback.py "$V1" "$ALIGNED"
python3 tools/apk_v2v3_sign.py "$ALIGNED" "$FINAL" --p12 "$KS" --password "$STORE_PASS"
python3 tools/apk_v2v3_verify.py "$FINAL"
python3 tools/verify_zip_alignment_v363.py "$FINAL"
jarsigner -verify -verbose "$FINAL" >/dev/null
sha256sum "$FINAL" > "${FINAL%.apk}_SHA256.txt"
echo "PASS: $FINAL"
