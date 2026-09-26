# Market Risk Monitor Global+ — Phase 15 Final GLOBAL Risk Architecture

## PHASE 15 COMPLETE

Baseline: v3.5.1.64 / versionCode 97

Target version: v3.5.1.65 / versionCode 98

Methodology architecture: `GA2`

## Objective

Phase 15 replaces the former production GLOBAL flat weighted-average interpretation with the layered architecture defined by the remediation plan:

1. Current Global Condition
2. Leading Warning Layer
3. Structural Vulnerability
4. Contagion / Amplifier

The model does **not** simply average these four layers. Phase-5 factor families remain available as auditable raw factor inputs and as the legacy comparison model.

## 1. Current Global Condition

Current-condition weights:

| Factor | Weight budget |
|---|---:|
| Credit | 15 |
| Funding / Liquidity | 20 |
| Volatility | 15 |
| Equity Internals | 10 |
| Rates | 8 |
| FX | 7 |
| Current Macro | 15 |
| Commodities | 5 |

The total legacy budget represented here is 95 because the former Phase-5 correlation factor is intentionally removed from the base average. Missing current-condition inputs are renormalized only after the existing GLOBAL eligibility/coverage rules are applied.

`Current Macro` uses the Phase-9 Global Macro Cycle when eligible. If that layer is unavailable, the existing Phase-5 Macro Growth + Inflation pair is used as an explicit fallback using their original 10 + 5 budget.

## 2. Leading Warning Layer

Only forward/early classes are used:

- LEADING: 70%
- EARLY_CONFIRMATION: 30%

A valid LEADING score is mandatory. `LATE_CONFIRMATION` does not enter this layer.

The warning layer is not averaged into current stress. It can only add risk when warning stress is above 45:

`Warning adjustment = clamp((Warning - 45) × 0.20, 0, 10)`

Therefore low warning values cannot lower an already-high Current Condition score.

## 3. Structural Vulnerability

Structural Vulnerability combines:

- Fiscal Structural Vulnerability: 50%
- Structural Financial Vulnerability: 50%

The fiscal aggregate uses only comparable/eligible Phase-10 general-government rows and nominal-GDP weighting. A 35% maximum single-country share cap prevents one large economy from fully dominating the structural fiscal aggregate.

Structural stress only adds risk above 50:

`Structural adjustment = clamp((Structural - 50) × 0.10, 0, 5)`

Missing structural inputs are not converted to zero. Coverage is disclosed separately.

Market Refinancing Pressure remains separate from structural `r-g`; it is not substituted into this structural layer.

## 4. Contagion / Amplifier

Contagion uses the existing Phase-8 lag-aware systemic correlation path and the existing `globalContagion()` calculation. It is no longer a factor that can mathematically lower a severe base score.

The amplifier is bounded:

- minimum multiplier: 1.00
- maximum multiplier: 1.15
- activation starts at pre-amplifier stress 35
- full activation at pre-amplifier stress 75
- contagion pressure starts above contagion score 50

Conceptually:

`Multiplier = 1 + 0.15 × stressActivation × contagionPressure`

This guarantees that low correlation cannot cancel severe credit/funding/current stress.

## Final formula

`Final GLOBAL Risk = clamp((Current Condition + positive Warning adjustment + positive Structural adjustment) × bounded Contagion multiplier)`

The numeric result remains on 0–100. Existing risk-band thresholds remain unchanged. Phase-13 hysteresis still changes only the displayed status band and never the numeric score.

## Coverage and eligibility

Layer coverage accounting uses:

- Current Condition: 70%
- Leading Warning: 15%
- Structural Vulnerability: 10%
- Contagion: 5%

These percentages are **coverage/confidence weights only**, not score weights.

The final model remains LIMITED if the existing effective-coverage gates fail. Missing inputs are never zero-filled.

## Auditability

Phase 15 adds explicit audit transforms for:

- `global_current_condition_v65`
- `global_leading_warning_v65`
- `global_structural_v65`
- `global_contagion_amplifier_v65`
- `global_final_v65`

The exported model retains:

- the Phase-5 score;
- the Phase-5 factor details;
- the new GA2 layered score;
- the difference between Phase-5 and GA2;
- layer coverage;
- component weights;
- final formula parameters.

Phase-14 point-in-time snapshots now also preserve `finalArchitectureVersion`, `finalLayers`, and `finalFormula` so future historical validation can reproduce the architecture actually used at each snapshot.

## Production integration changes

The production refresh now uses `safeGlobalRiskModelV65(...)` after the existing market, early-warning, correlation, macro and fiscal data paths have completed/settled.

Fiscal structural loading starts resiliently and does not make an independent provider failure collapse the rest of GLOBAL refresh.

No new raw `fetch()` call site was added. Count remains 6.

## Protected calculations

The following pre-Phase-15 functions remain byte-identical to the v3.5.1.64 baseline:

- `riskBand()`
- `weightedScore()`
- `globalRiskModel()` (Phase-5 legacy model)
- `globalFactorArchitectureV53()`
- `globalContagion()`
- `buildMacroCycle()`
- `fiscalScoreRowsV43()`
- `commodityShockRisk()`
- `aggregateEquityInternalsV57()`
- `lagAwareCorrMatrixV58()`
- `stabilizedBandV63()`

This preserves reproducibility and allows direct legacy-vs-GA2 comparison.

## Deterministic validation

Fixtures verify that:

- low warning/structural/contagion cannot reduce a Current Condition score;
- warning adjustment never exceeds +10;
- structural adjustment never exceeds +5;
- contagion multiplier never exceeds 1.15;
- severe stress remains severe even when correlation is low;
- high contagion can amplify severe stress but remains capped;
- correlation is no longer part of the base Current Condition average;
- fiscal structural weighting applies country-comparability gates and the GDP cap.

## Historical-validation limitation

The Phase-15 parameters are transparent conservative **heuristic architecture parameters**. They are not presented as empirically optimized coefficients or proof of predictive skill.

Phase 14 provides the point-in-time framework needed for future empirical evaluation, but the application still does not contain a complete multi-cycle vintage dataset sufficient to claim validated predictive performance.

## QA

Phase-15 release QA: **905 / 905 PASS**, plus JavaScript syntax and Python bytecode checks.

The suite covers Phase 15 plus compatibility checks for Phases 3–14, freshness, fiscal loading, parsers, AGSI and the native export bridge.

## Files changed

Primary changed files:

- `app.js`
- `app/src/main/assets/index.html`
- `app/build.gradle`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java`
- `build_release.sh`
- Phase-15 tests and documentation

No unrelated navigation, ETF, dividend, company, watchlist, icon, typography or commodity-price UI redesign was introduced.

## Known limitations

1. Real historical performance of GA2 still requires a proper PIT/vintage dataset; deterministic fixtures validate the implementation, not predictive skill.
2. Physical Commodity Risk from Phase 11 remains a separate diagnostic layer and is not silently merged into the existing price/market commodity component.
3. In this execution environment the private release signing key used by v3.5.1.64 is not available. Therefore the generated aligned APK can be structurally verified but cannot be signed with the existing update-compatible certificate here.

## Next phase

Phase 16 — Final UI / Explanation.
