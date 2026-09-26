# Implementation Summary — Market Risk Monitor Global+ v3.5.1.42

## Baseline / target

- Baseline: v3.5.1.41 / versionCode 74
- Target: v3.5.1.42 / versionCode 75

## Exact functional changes

- Norway Yahoo ticker: `^OSEAX` → `OSEAX.OL`.
- Added explicit Global Market Health eligibility and per-market fault isolation.
- Added neutral LIMITED DATA handling for markets without valid headline metrics.
- Added internal Norway/Bosnia diagnostic payload via `window.MRMV42Diagnostics`.
- Replaced duplicated Overview market list with executive module summaries.
- Updated visible version label and release metadata.

## Files modified

- `app.js`
- `app/src/main/assets/index.html`
- `app/build.gradle`
- `build_release.sh`

## Files added

- `tests/market_health_fixture_tests_v35142.js`
- `tools/build_manual_apk_v35142.py`
- `tools/verify_fallback_apk_v35142.py`
- release/root-cause/QA documentation for v3.5.1.42

## Native source

Byte-identical to v3.5.1.41:

- `app/src/main/AndroidManifest.xml`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java`
- `app/src/main/java/com/marko/marketrisk/globalplus/AgsiKeyStore.java`

The delivered fallback APK also preserves the exact v3.5.1.41 stable `classes.dex` and `resources.arsc` runtime payload.
