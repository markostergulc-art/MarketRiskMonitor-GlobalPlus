# Regression Report — v3.5.1.56

Baseline: v3.5.1.55 / 88  
Target: v3.5.1.56 / 89

## Protected production mathematics

Byte-identical against v3.5.1.55:

- volRisk
- trendRisk
- fxRisk
- marketRisk
- macroRiskFromWB
- weightedScore
- riskBand
- adverseMomentumRisk
- companyDrawdownRisk
- companyVolatilityRisk
- companyCoreRiskParts
- dividendSafety
- globalContagion
- factorRecordV53
- globalFactorArchitectureV53
- globalRiskModel
- inflationRateRisk
- inflationDetector
- recessionLeadingAndComposite
- usEarly
- fiscalPiecewiseV43
- fiscalAbsRiskV43
- fiscalScoreRowsV43
- commodityShockRisk
- sprFillRisk
- daysSupplyRisk
- inventoryWeeklyRisk
- refreshAll

No new raw `fetch()` call site.

## Prior-phase compatibility

- Phase 5 factor architecture: 29/29 PASS
- Phase 4 semantics: 33/33 PASS
- Phase 3 confidence: 24/24 PASS
- Freshness: 19/19 PASS
- Parser/data fixtures: PASS
- v3.5.1.55 hidden-risk failure isolation retained.
- v3.5.1.54 fixed top-status stage retained.
- compact GLOBAL confidence metadata retained.

## Phase 6

70/70 auditability tests PASS.

## Overall

283/283 reported automated checks PASS, plus fallback APK structural verification PASS.
