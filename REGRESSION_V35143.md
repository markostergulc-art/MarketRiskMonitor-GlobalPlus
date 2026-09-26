# Regression Report — v3.5.1.43

Baseline: v3.5.1.42 / versionCode 75  
Target: v3.5.1.43 / versionCode 76

## Protected functions

**18/18 protected calculation functions are byte-identical to v3.5.1.42:**

- `globalRiskModel`
- `globalContagion`
- `corrMatrix`
- `correlationRegimeFromStats`
- `correlationRegimeDiagnostic`
- `buildMacroCycle`
- `sp500HiddenWeakness`
- `companyCoreRiskParts`
- `companyContextRisk`
- `marketMetrics`
- `trendRisk`
- `renderEarly`
- `buildEuGasV33`
- `agsiApiJsonV33`
- `parseAgsiPayloadV33`
- `renderThinProgressV38`
- `parseAgsiFacilityListingV37`
- `buildAgsiFacilitiesV37`

## Native source continuity

Byte-identical to v3.5.1.42:

- `app/src/main/AndroidManifest.xml`
- `MainActivity.java`
- `AgsiKeyStore.java`

The immediately installable fallback APK preserves the same stable `classes.dex` and `resources.arsc` payload hashes as v3.5.1.42.

## Scope of functional code changes

Changed:

- `app.js` — isolated v43 fiscal state/providers/scoring/presentation and Markets lazy-loader integration
- `app/src/main/assets/index.html` — matching embedded canonical JS, fiscal UI containers/status styling, visible version
- `app/build.gradle` — version only
- `build_release.sh` — version/output metadata only

Added:

- v43 fiscal fixtures
- v43 market-health compatibility regression test
- manual fallback APK build/verification helpers for v43
- fiscal research/provider/methodology/coverage/release documentation

## Global Risk integration gate

`window.MRMV43FiscalDiagnostics` explicitly reports `globalRiskIntegration:false`.

No Fiscal Stress value is passed into GLOBAL Risk, Global Contagion, Early Warning, Correlation Regime or existing country Market Risk calculations in this release.
