# Regression Report — v3.5.1.44

## Protected financial/risk functions
All 18 protected calculation blocks were compared against the v3.5.1.43 baseline and remain byte-identical:
- globalRiskModel
- globalContagion
- marketMetrics
- trendRisk
- corrMatrix
- correlationRegimeFromStats
- correlationRegimeDiagnostic
- buildMacroCycle
- sp500HiddenWeakness
- companyCoreRiskParts
- companyContextRisk
- renderEarly
- buildEuGasV33
- agsiApiJsonV33
- parseAgsiPayloadV33
- renderThinProgressV38
- parseAgsiFacilityListingV37
- buildAgsiFacilitiesV37

## Native source
No intentional native Android source changes were made. `MainActivity.java`, `AgsiKeyStore.java` and source `AndroidManifest.xml` remain unchanged from v3.5.1.43.

## APK runtime continuity
The fallback APK preserves the exact v3.5.1.43 payload for:
- `classes.dex`
- `resources.arsc`
- application icon payloads

Only release manifest metadata and WebView asset content are updated as required for v3.5.1.44.

## Methodology
Fiscal Stress weighting and scoring functions remain unchanged. v44 changes freshness/comparability eligibility only; this is an input-validity correction, not a model reweight.
