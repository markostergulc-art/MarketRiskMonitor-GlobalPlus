#!/usr/bin/env bash
set -euo pipefail

APP_ID="com.marko.marketrisk.globalplus"
VERSION_NAME="3.9"
VERSION_CODE="122"
MIN_SDK="26"
TARGET_SDK="35"
APP_LABEL="Market Risk Monitor Global+"
LAUNCHER="com.marko.marketrisk.globalplus.MainActivity"
FINAL_APK="MarketRiskMonitor_GlobalPlus_v3.9_BUILD122_signed.apk"
SHA_FILE="MarketRiskMonitor_GlobalPlus_v3.9_BUILD122_SHA256.txt"
REPORT="BUILD_REPORT.txt"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
BUILD_DIR="$ROOT/release-build"
mkdir -p "$BUILD_DIR"

BUILD_STATUS="FAIL"
ZIP_STATUS="FAIL"
V1_STATUS="FAIL"
V2_STATUS="FAIL"
V3_STATUS="FAIL"
MANIFEST_STATUS="FAIL"
INTEGRITY_STATUS="FAIL"
ARM64_STATUS="N/A"
ADB_STATUS="N/A"
DEVICE_ANDROID="N/A"
DEVICE_ARCH="N/A"
CERT_SHA256="N/A"
APK_SHA256="N/A"
FAIL_REASON="Build did not complete."

write_report() {
  cat > "$REPORT" <<EOF
Build status: $BUILD_STATUS
Package: $APP_ID
Version: $VERSION_NAME
Version code: $VERSION_CODE
Min SDK: $MIN_SDK
Target SDK: $TARGET_SDK

ZIP alignment: $ZIP_STATUS

V1 signature: $V1_STATUS
V2 signature: $V2_STATUS
V3 signature: $V3_STATUS

Certificate SHA-256: $CERT_SHA256

arm64 compatibility: $ARM64_STATUS

APK SHA-256: $APK_SHA256

Manifest validation: $MANIFEST_STATUS
APK integrity: $INTEGRITY_STATUS

ADB installation test: $ADB_STATUS

Test device Android version: $DEVICE_ANDROID
Test device architecture: $DEVICE_ARCH

Notes:
$FAIL_REASON
EOF
}

on_error() {
  local line="$1" cmd="$2"
  FAIL_REASON="FAILED at line ${line}: ${cmd}"
  write_report
  echo "$FAIL_REASON" >&2
}
trap 'on_error "$LINENO" "$BASH_COMMAND"' ERR

# Resolve Android SDK and latest installed Build Tools.
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
[[ -n "$SDK" && -d "$SDK" ]] || { echo "ANDROID_SDK_ROOT/ANDROID_HOME must point to an installed Android SDK" >&2; false; }
[[ -d "$SDK/platforms/android-35" ]] || { echo "Android platform android-35 is not installed" >&2; false; }
BT_DIR="$(find "$SDK/build-tools" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -V | tail -1)"
[[ -n "$BT_DIR" ]] || { echo "No Android Build Tools found" >&2; false; }
BT="$SDK/build-tools/$BT_DIR"
ZIPALIGN="$BT/zipalign"
APKSIGNER="$BT/apksigner"
AAPT="$BT/aapt"
[[ -x "$ZIPALIGN" ]] || { echo "zipalign not found: $ZIPALIGN" >&2; false; }
[[ -x "$APKSIGNER" ]] || { echo "apksigner not found: $APKSIGNER" >&2; false; }
[[ -x "$AAPT" ]] || { echo "aapt not found: $AAPT" >&2; false; }

# Signing credentials: source bundle includes the project release key at the user's explicit request.
# MRM_KEYSTORE_PROPERTIES / MRM_RELEASE_* may still override the bundled signing material.
if [[ -z "${MRM_KEYSTORE_PROPERTIES:-}" && -f "$ROOT/signing/keystore.properties" ]]; then
  MRM_KEYSTORE_PROPERTIES="$ROOT/signing/keystore.properties"
fi
if [[ -n "${MRM_KEYSTORE_PROPERTIES:-}" ]]; then
  PROPS="$(realpath "$MRM_KEYSTORE_PROPERTIES")"
  [[ -f "$PROPS" ]] || { echo "keystore.properties not found: $PROPS" >&2; false; }
  prop() { sed -n "s/^$1=//p" "$PROPS" | tail -1; }
  PROP_DIR="$(dirname "$PROPS")"
  STORE_FILE="$(prop storeFile)"
  if [[ -n "$STORE_FILE" && "$STORE_FILE" != /* ]]; then STORE_FILE="$PROP_DIR/$STORE_FILE"; fi
  export MRM_RELEASE_KEYSTORE="${MRM_RELEASE_KEYSTORE:-$STORE_FILE}"
  export MRM_RELEASE_STOREPASS="${MRM_RELEASE_STOREPASS:-$(prop storePassword)}"
  export MRM_RELEASE_ALIAS="${MRM_RELEASE_ALIAS:-$(prop keyAlias)}"
  export MRM_RELEASE_KEYPASS="${MRM_RELEASE_KEYPASS:-$(prop keyPassword)}"
fi
: "${MRM_RELEASE_KEYSTORE:?Set MRM_RELEASE_KEYSTORE or MRM_KEYSTORE_PROPERTIES}"
: "${MRM_RELEASE_STOREPASS:?Set MRM_RELEASE_STOREPASS or MRM_KEYSTORE_PROPERTIES}"
: "${MRM_RELEASE_ALIAS:?Set MRM_RELEASE_ALIAS or MRM_KEYSTORE_PROPERTIES}"
MRM_RELEASE_KEYPASS="${MRM_RELEASE_KEYPASS:-$MRM_RELEASE_STOREPASS}"
export MRM_RELEASE_STOREPASS MRM_RELEASE_KEYPASS
KS="$(realpath "$MRM_RELEASE_KEYSTORE")"
[[ -f "$KS" ]] || { echo "Release keystore not found: $KS" >&2; false; }
# Bundled signing material is intentionally permitted for this project.

# Guard against accidental version reuse.
grep -q "versionCode[[:space:]]\+122" app/build.gradle
grep -q "versionName[[:space:]]\+'3.9'" app/build.gradle

# SOURCE -> COMPILE -> UNSIGNED APK
if [[ -x "$ROOT/gradlew" ]]; then
  GRADLE=("$ROOT/gradlew")
elif command -v gradle >/dev/null 2>&1; then
  GRADLE=(gradle)
else
  echo "Gradle/gradlew is required to compile the Android source" >&2
  false
fi
"${GRADLE[@]}" --no-daemon clean :app:assembleRelease
UNSIGNED="$ROOT/app/build/outputs/apk/release/app-release-unsigned.apk"
[[ -f "$UNSIGNED" ]] || { echo "Unsigned release APK not found: $UNSIGNED" >&2; false; }
cp "$UNSIGNED" "$BUILD_DIR/app-unsigned.apk"

# UNSIGNED APK -> ZIPALIGN
"$ZIPALIGN" -f -p 4 "$BUILD_DIR/app-unsigned.apk" "$BUILD_DIR/app-aligned.apk"
"$ZIPALIGN" -c -v 4 "$BUILD_DIR/app-aligned.apk" > "$BUILD_DIR/zipalign_pre_sign.txt"

# ZIPALIGN -> SIGN (V1 + V2 + V3; V4 optional for incremental/ADB workflows)
V4="${MRM_ENABLE_V4:-false}"
"$APKSIGNER" sign \
  --ks "$KS" \
  --ks-key-alias "$MRM_RELEASE_ALIAS" \
  --ks-pass env:MRM_RELEASE_STOREPASS \
  --key-pass env:MRM_RELEASE_KEYPASS \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --v4-signing-enabled "$V4" \
  --out "$ROOT/$FINAL_APK" \
  "$BUILD_DIR/app-aligned.apk"

# SIGNATURE VERIFICATION
"$APKSIGNER" verify --verbose --print-certs "$ROOT/$FINAL_APK" | tee "$BUILD_DIR/apksigner_verify.txt"
grep -Eq 'Verified using v1 scheme.*: true' "$BUILD_DIR/apksigner_verify.txt"
grep -Eq 'Verified using v2 scheme.*: true' "$BUILD_DIR/apksigner_verify.txt"
grep -Eq 'Verified using v3 scheme.*: true' "$BUILD_DIR/apksigner_verify.txt"
V1_STATUS="PASS"; V2_STATUS="PASS"; V3_STATUS="PASS"
CERT_SHA256="$(sed -n 's/^Signer #1 certificate SHA-256 digest: //p' "$BUILD_DIR/apksigner_verify.txt" | head -1)"
[[ -n "$CERT_SHA256" ]] || CERT_SHA256="$(sed -n 's/^Signer #1 certificate SHA-256 digest: //p' "$BUILD_DIR/apksigner_verify.txt" | head -1)"

# SIGNED APK must remain aligned.
"$ZIPALIGN" -c -v 4 "$ROOT/$FINAL_APK" | tee "$BUILD_DIR/zipalign_final.txt"
ZIP_STATUS="PASS"

# Manifest / package validation with Android SDK aapt.
"$AAPT" dump badging "$ROOT/$FINAL_APK" | tee "$BUILD_DIR/aapt_badging.txt"
grep -q "package: name='$APP_ID'" "$BUILD_DIR/aapt_badging.txt"
grep -q "versionCode='$VERSION_CODE'" "$BUILD_DIR/aapt_badging.txt"
grep -q "versionName='$VERSION_NAME'" "$BUILD_DIR/aapt_badging.txt"
grep -q "sdkVersion:'$MIN_SDK'" "$BUILD_DIR/aapt_badging.txt"
grep -q "targetSdkVersion:'$TARGET_SDK'" "$BUILD_DIR/aapt_badging.txt"
grep -q "application-label:'$APP_LABEL'" "$BUILD_DIR/aapt_badging.txt"
grep -q "launchable-activity: name='$LAUNCHER'" "$BUILD_DIR/aapt_badging.txt"
grep -q "uses-permission: name='android.permission.INTERNET'" "$BUILD_DIR/aapt_badging.txt"
MANIFEST_STATUS="PASS"

# Native library / ABI / page-size audit.
mapfile -t SO_ENTRIES < <(unzip -Z1 "$ROOT/$FINAL_APK" | grep -E '^lib/[^/]+/[^/]+\.so$' || true)
if ((${#SO_ENTRIES[@]} == 0)); then
  ARM64_STATUS="N/A"
  echo "No native libraries detected - ABI compatibility check not applicable." | tee "$BUILD_DIR/native_libs.txt"
else
  printf '%s\n' "${SO_ENTRIES[@]}" > "$BUILD_DIR/native_libs.txt"
  printf '%s\n' "${SO_ENTRIES[@]}" | grep -q '^lib/arm64-v8a/' || { echo "Native libraries present but arm64-v8a is missing" >&2; false; }
  TMP_SO="$BUILD_DIR/native-libs"; rm -rf "$TMP_SO"; mkdir -p "$TMP_SO"
  unzip -q "$ROOT/$FINAL_APK" 'lib/*/*.so' -d "$TMP_SO"
  command -v readelf >/dev/null 2>&1 || { echo "readelf required for native ELF audit" >&2; false; }
  while IFS= read -r so; do
    file "$so" | grep -q 'ELF 64-bit.*ARM aarch64' || { echo "Unexpected non-arm64 native library: $so" >&2; false; }
    # Modern Android 16 KB page-size compatibility: PT_LOAD alignment must be >= 0x4000.
    while read -r algn; do
      python3 - "$algn" <<'PY'
import sys
v=int(sys.argv[1],16)
if v < 0x4000:
    raise SystemExit(1)
PY
    done < <(readelf -lW "$so" | awk '$1=="LOAD"{print $NF}')
  done < <(find "$TMP_SO/lib/arm64-v8a" -type f -name '*.so')
  ARM64_STATUS="PASS"
fi

# APK integrity + SHA-256
unzip -t "$ROOT/$FINAL_APK" > "$BUILD_DIR/unzip_test.txt"
INTEGRITY_STATUS="PASS"
APK_SHA256="$(sha256sum "$ROOT/$FINAL_APK" | awk '{print $1}')"
printf '%s  %s\n' "$APK_SHA256" "$FINAL_APK" > "$ROOT/$SHA_FILE"

# ADB install test only when ADB and a connected device are available.
if command -v adb >/dev/null 2>&1 && adb get-state 2>/dev/null | grep -qx device; then
  DEVICE_ANDROID="$(adb shell getprop ro.build.version.release | tr -d '\r')"
  DEVICE_ARCH="$(adb shell getprop ro.product.cpu.abi | tr -d '\r')"
  if adb shell pm path "$APP_ID" >/dev/null 2>&1; then
    set +e
    ADB_OUT="$(adb install -r "$ROOT/$FINAL_APK" 2>&1)"; rc=$?
    set -e
  else
    set +e
    ADB_OUT="$(adb install "$ROOT/$FINAL_APK" 2>&1)"; rc=$?
    set -e
  fi
  printf '%s\n' "$ADB_OUT" | tee "$BUILD_DIR/adb_install.txt"
  if [[ $rc -ne 0 || "$ADB_OUT" != *"Success"* ]]; then
    if [[ "$ADB_OUT" == *"INSTALL_FAILED_UPDATE_INCOMPATIBLE"* || "$ADB_OUT" == *"signatures do not match"* ]]; then
      FAIL_REASON="Existing installation cannot be upgraded because the signing certificate is different. The old application must first be uninstalled."
    else
      FAIL_REASON="ADB installation failed. See release-build/adb_install.txt"
    fi
    ADB_STATUS="FAIL"
    write_report
    exit 1
  fi
  ADB_STATUS="PASS"
fi

BUILD_STATUS="PASS"
FAIL_REASON="All mandatory Android SDK build/signing/verification checks passed. V4 is optional and was set to: $V4."
write_report
trap - ERR
printf '\nRelease build PASS: %s\n' "$ROOT/$FINAL_APK"
