# Regression Report — v3.5.1.64

## Result

**PASS**

Phase 14 adds validation infrastructure only. It does not change production score mathematics.

## Automated checks

Total: **841 / 841 PASS**

- Phase 14 WebView/runtime historical-validation checks: 100 / 100
- Phase 14 offline-tool checks: 38 / 38
- Phase 13 hysteresis compatibility: 69 / 69
- Phase 12 source resilience: 73 / 73
- Phase 11 commodity physical risk: 52 / 52
- Phase 10 fiscal structural vulnerability: 61 / 61
- Phase 9 macro globalization: 60 / 60
- Phase 8 correlation/timezone: 71 / 71
- Phase 7 equity weighting: 37 / 37
- Phase 6 auditability compatibility: 67 / 67
- Phase 5 factor architecture: 29 / 29
- Phase 4 semantics: 33 / 33
- Phase 3 confidence: 24 / 24
- Freshness semantics: 19 / 19
- Fiscal/loading compatibility: 23 / 23
- Parser fixtures: 29 / 29
- AGSI country fixtures: 21 / 21
- AGSI coverage fixtures: 10 / 10
- Native export bridge: 25 / 25

Additional checks:

- `node --check app.js`: PASS
- `python3 -m py_compile tools/historical_validation_v35164.py`: PASS
- canonical `app.js` equals embedded WebView script byte-for-byte: PASS
- raw `fetch()` call sites: 6 -> 6

## Protected production functions

The following functions are byte-identical to the immediate v3.5.1.63 baseline:

- `riskBand()`
- `weightedScore()`
- `globalRiskModel()`
- `globalFactorArchitectureV53()`
- `globalContagion()`
- `buildMacroCycle()`
- `fiscalScoreRowsV43()`
- `commodityShockRisk()`
- `aggregateEquityInternalsV57()`
- `lagAwareCorrMatrixV58()`
- `stabilizedBandV63()`

## No-look-ahead validation

Deterministic fixtures verify that:

- market base observations are selected on or before the score as-of date;
- the forward endpoint is exactly +21 / +63 / +126 / +252 market observations;
- reconstructed inputs with `availableAt > asOf` are rejected as `LOOKAHEAD_INPUT`;
- reconstructed inputs without vintage evidence are rejected in strict mode;
- missing recession-outcome data remain `N/A`, not false/benign;
- incomplete forward windows are `INSUFFICIENT_FUTURE_DATA`, never fabricated.

## APK checks

- package/version/minSdk/targetSdk/launcher: PASS
- ZIP integrity: PASS
- STORED-entry alignment: PASS
- embedded `index.html` byte-identical to release source: PASS
- no broad storage permission: PASS
- JavaScript export bridge in fallback DEX: PASS
- JAR/v1 signature: PASS
- APK Signature Scheme v2: PASS
- APK Signature Scheme v3: PASS
- release certificate SHA-256 unchanged: `0b6f4025c38acaa898841bfaa1c0c39516e8fe581bf04ede3fd2ff8cadf729f0`

## Known limitation

No genuine multi-cycle point-in-time macro/vintage history is bundled. Therefore this release validates the **backtest machinery**, not the real-world predictive skill of the model. Real precision/recall/AUC/lead-time claims require externally supplied genuine historical point-in-time snapshots/vintages and complete outcome series.
