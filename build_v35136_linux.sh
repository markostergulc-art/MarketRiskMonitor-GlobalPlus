#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PROPS="${1:-${MRM_KEYSTORE_PROPERTIES:-}}"
if [[ -z "$PROPS" ]]; then
  cat >&2 <<'USAGE'
Usage:
  ./build_v35136_linux.sh /absolute/path/to/keystore.properties

The signing directory must be OUTSIDE this source tree. If storeFile inside
keystore.properties is relative (for example MarketRiskMonitor_GlobalPlus_release.p12),
it is resolved relative to the keystore.properties directory.
USAGE
  exit 2
fi
PROPS="$(realpath "$PROPS")"
[[ -f "$PROPS" ]] || { echo "keystore.properties not found: $PROPS" >&2; exit 2; }
case "$PROPS" in "$ROOT"/*) echo "Signing properties must remain outside the source tree." >&2; exit 2;; esac

# JDK 17+ is required by Android Gradle Plugin 8.7.x.
command -v java >/dev/null 2>&1 || { echo "Java/JDK 17+ is required." >&2; exit 2; }
JAVA_MAJOR="$(java -version 2>&1 | awk -F'[\".]' '/version/{print $2; exit}')"
[[ "$JAVA_MAJOR" =~ ^[0-9]+$ ]] || { echo "Unable to determine Java version." >&2; exit 2; }
(( JAVA_MAJOR >= 17 )) || { echo "JDK 17 or newer required; detected Java $JAVA_MAJOR." >&2; exit 2; }

# Detect a normal Android SDK installation without changing the machine.
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [[ -z "$SDK" ]]; then
  for candidate in "$HOME/Android/Sdk" "$HOME/Android/sdk" /opt/android-sdk /usr/lib/android-sdk; do
    if [[ -d "$candidate" ]]; then SDK="$candidate"; break; fi
  done
fi
[[ -n "$SDK" && -d "$SDK" ]] || {
  echo "Android SDK not found. Set ANDROID_SDK_ROOT or ANDROID_HOME." >&2
  exit 2
}
export ANDROID_SDK_ROOT="$SDK"
[[ -d "$SDK/platforms/android-35" ]] || {
  echo "Missing Android platform 35: $SDK/platforms/android-35" >&2
  echo "Install it with sdkmanager 'platforms;android-35'." >&2
  exit 2
}
[[ -d "$SDK/build-tools" ]] || { echo "Android Build Tools are missing under $SDK/build-tools" >&2; exit 2; }

# Prefer an existing Gradle. If absent, bootstrap Gradle 8.9 into a user cache.
if [[ -x "$ROOT/gradlew" ]]; then
  :
elif command -v gradle >/dev/null 2>&1; then
  :
else
  GRADLE_VERSION=8.9
  CACHE_ROOT="${XDG_CACHE_HOME:-$HOME/.cache}/mrm-gradle"
  DIST="$CACHE_ROOT/gradle-${GRADLE_VERSION}-bin.zip"
  GRADLE_HOME="$CACHE_ROOT/gradle-${GRADLE_VERSION}"
  mkdir -p "$CACHE_ROOT"
  if [[ ! -x "$GRADLE_HOME/bin/gradle" ]]; then
    echo "Gradle not found; downloading Gradle ${GRADLE_VERSION}..."
    if command -v curl >/dev/null 2>&1; then
      curl -fL --retry 3 -o "$DIST" "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip"
    elif command -v wget >/dev/null 2>&1; then
      wget -O "$DIST" "https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip"
    else
      echo "Install Gradle or provide curl/wget for automatic bootstrap." >&2
      exit 2
    fi
    command -v unzip >/dev/null 2>&1 || { echo "unzip is required for Gradle bootstrap." >&2; exit 2; }
    rm -rf "$GRADLE_HOME"
    unzip -q "$DIST" -d "$CACHE_ROOT"
  fi
  export PATH="$GRADLE_HOME/bin:$PATH"
fi

export MRM_KEYSTORE_PROPERTIES="$PROPS"

# Remove only generated build products; never touch application data or signing files.
rm -rf "$ROOT/release-build" "$ROOT/app/build"
rm -f "$ROOT/MarketRiskMonitor_GlobalPlus_v3.5.1.36.apk" \
      "$ROOT/MarketRiskMonitor_GlobalPlus_v3.5.1.36_SHA256.txt" \
      "$ROOT/BUILD_REPORT.txt"

exec "$ROOT/build_release.sh"
