# Market Risk Monitor Global+ — v3.9 / BUILD122

## Implemented phases
1. Release baseline, residual fiscal semantic fix, v3.9/122 metadata.
2. Evidence/provenance contract, additive DB v4, immutable calculation snapshots.
3. Change Intelligence classifications and GA2 accounting attribution.
4. Universal Evidence Card with separate Data Quality, Coverage, Signal Agreement and Empirical Validation.
5. Smart Alert Center with watchlists, confirmation, hysteresis, cooldown, dedupe, quiet hours and separate MARKET_RISK / DATA_HEALTH semantics.
6. Overview integration: daily/weekly changes, comparable calculation, quality/coverage deltas, new/resolved alerts, Change→Evidence→Watch flow.
7. Audit/export: Calculation Snapshots, Change Ledger, Evidence and Alerts in JSON/CSV/Excel without network fetches.
8. Native source architecture for typed notification channels and HTTP_PREFETCH_ONLY background diagnostics.
9. Upgrade/regression hardening; package/signing/database invariants retained.
10. Final release hardening and two-stage self-audit.

## Model invariants
- GA2 weights unchanged.
- Existing risk bands unchanged.
- Correlation methodology unchanged.
- Existing hysteresis/scoring transforms retained unless required by earlier validated v3.8 repairs.
- Global Shortage scoring model not retuned.

## QA
- tests/run_release_v39.sh: PASS
- Change Intelligence / alert tests: PASS
- v3.8 audit-fix regression: PASS
- Global Shortage, Capital Rotation, AGSI, Bonds, T212, Excel regression: PASS
- canonical app.js equals embedded runtime: PASS
- APK embedded v3.9 assets equal release source: PASS
- ZIP integrity/alignment: PASS
- APK V2: PASS
- APK V3: PASS

## APK identity
- package: com.marko.marketrisk.globalplus
- versionName: 3.9
- versionCode: 122
- signing certificate SHA-256: c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6
- APK SHA-256: 39f6e3f8decc5a3d348a23691337ac3b8d21b749c9ef8315ce0fa734ae7f5f16

## Native packaging limitation
The available execution environment does not contain Android SDK/Gradle and cannot download them. The user's GitHub repository exists, but its BUILD119 source-import workflow has not populated the Android project on main, so it cannot currently act as a remote Gradle runner for this exact source tree.

Therefore the included signed APK is an installable compatibility/WebView-runtime build using the same fallback DEX architecture as the supplied BUILD121 APK. All v3.9 web-runtime functionality is embedded and verified. The new Java source for DB v4, WorkManager diagnostics and typed native notification channels is implemented and tested statically in source but is NOT compiled into this APK. A true Gradle build is required before claiming those native additions are shipped.

Do not represent this compatibility APK as a full native BUILD122 until a Gradle build compiles the included Java source and device-level acceptance is completed.
