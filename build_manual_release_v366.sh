#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
PROPS="signing/keystore.properties"
[[ -f "$PROPS" ]] || { echo "Missing $PROPS" >&2; exit 1; }
prop(){ sed -n "s/^$1=//p" "$PROPS" | tail -1; }
STORE_FILE="$(prop storeFile)"
STORE_PASS="$(prop storePassword)"
KEY_ALIAS="$(prop keyAlias)"
KEY_PASS="$(prop keyPassword)"
KS="signing/$STORE_FILE"
[[ -f "$KS" ]] || { echo "Missing release keystore" >&2; exit 1; }

python3 tools/build_manual_apk_v366.py
BASE="manual_apk_build_v366/MarketRiskMonitor_GlobalPlus_v3.6.6_unsigned_aligned.apk"
V1="manual_apk_build_v366/MarketRiskMonitor_GlobalPlus_v3.6.6_v1.apk"
ALIGNED="manual_apk_build_v366/MarketRiskMonitor_GlobalPlus_v3.6.6_v1_aligned.apk"
FINAL="MarketRiskMonitor_GlobalPlus_v3.6.6_BUILD116_signed.apk"

cp "$BASE" "$V1"
# jarsigner rewrites ZIP metadata, therefore Android's documented order is:
# jarsigner -> zipalign -> v2/v3 signing.
jarsigner \
  -keystore "$KS" -storetype PKCS12 \
  -storepass "$STORE_PASS" -keypass "$KEY_PASS" \
  -sigalg SHA256withRSA -digestalg SHA-256 \
  "$V1" "$KEY_ALIAS"

python3 tools/zipalign4_fallback.py "$V1" "$ALIGNED"
python3 tools/apk_v2v3_sign.py "$ALIGNED" "$FINAL" --p12 "$KS" --password "$STORE_PASS"
python3 tools/apk_v2v3_verify.py "$FINAL"
python3 tools/verify_zip_alignment_v363.py "$FINAL"
jarsigner -verify -verbose "$FINAL" >/dev/null
sha256sum "$FINAL" > "${FINAL%.apk}_SHA256.txt"
echo "PASS: $FINAL"
