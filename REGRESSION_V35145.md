# Regression Protection — Market Risk Monitor Global+ v3.5.1.45

Baseline: v3.5.1.44 / versionCode 77  
Target: v3.5.1.45 / versionCode 78

## Financial / risk functions
PASS — protected calculation functions are byte-identical to v44:

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
- renderThinProgressV38
- buildEuGasV33
- agsiApiJsonV33
- parseAgsiPayloadV33
- parseAgsiFacilityListingV37
- buildAgsiFacilitiesV37

## Fiscal methodology
PASS — the v44 freshness / current-reference and fiscal-score functions are byte-identical:

- fiscalFreshnessV44
- fiscalPickReferenceV44
- fiscalBandV43
- fiscalScoreRowsV43

## Loading scheduler
PASS — scheduler decision functions are byte-identical:

- loadPriorityForV44
- pumpLoadSchedulerV44
- queueLoadV44
- scheduleDeferredV44
- scheduleAroundPageV44
- refreshActiveV44

Only presentation metadata / rendering around existing requests was added.

## Native Android source
PASS — byte-identical to v44:

- app/src/main/AndroidManifest.xml
- MainActivity.java
- AgsiKeyStore.java

The fallback APK also retains the same classes.dex and resources.arsc payload hashes as v44.
