# Regression Report — Market Risk Monitor Global+ v3.5.1.53

Baseline: v3.5.1.52 / 85  
Target: v3.5.1.53 / 86

## Result

**PASS**

- `tests/phase5_factor_architecture_v35153.js`: **29/29 PASS**
- `tests/phase5_regression_v35153.js`: **76/76 PASS**
- full selected release QA: **289/289 PASS**
- fallback APK structural verification: **PASS**

## Intentional production change

`globalRiskModel()` is intentionally changed in Phase 5. It now consumes bounded economic factor families rather than the previous broad raw-signal aggregation.

The v3.5.1.52 production formula is retained as `legacyGlobalRiskV52()` exclusively for before/after diagnostics. It is not used as the new production score.

## Protected methodology

Regression source comparison confirms protected functions remain unchanged where Phase 5 does not require modification, including freshness, country coverage, confidence formula, Early Warning timing semantics, fiscal, commodities, correlation-regime calculations, equity internals, company risk, scheduler and network fetch wrapper.

## Network / loading invariants

- `fetchWithTimeout()` unchanged.
- `fetch(` call sites: **6 → 6**.
- no new provider dependency.
- no new network call.
- no cache/lazy-load/refresh architecture change.
- canonical `app.js` equals the embedded WebView application script.

## Earlier-phase retention

- Phase 1 freshness semantics retained.
- Phase 2 LIMITED DATA / coverage gates retained.
- Phase 3 risk/confidence separation retained.
- Phase 4 Early Warning classification and separate timing-layer scores retained.
- native export bridge retained.

## Phase-3 compatibility test note

The historical v3.5.1.51 confidence test extracted the old `globalRiskModel()` without Phase-5 dependencies and therefore is not a valid standalone harness for the new architecture. It is retained unchanged for history.

`tests/confidence_model_phase5_compat_v35153.js` validates the same unchanged confidence functions through the new factor architecture and passes **24/24**.
