# Phase 16 — Final UI / Explanation

Release: **Market Risk Monitor Global+ v3.5.1.66 / versionCode 99**

## Objective

Phase 16 is a presentation and explainability release. It does not redesign the whole application and it does not change the Phase-15 GA2 production methodology. Its purpose is to make the final GLOBAL Risk architecture directly readable on the Overview screen and to let the user inspect why the current score has its value.

## GLOBAL Risk hero

The main GLOBAL Risk card now keeps the existing numeric score and status while displaying the following metadata explicitly:

- Confidence
- Factor coverage
- Freshness coverage
- Effective coverage
- regime/status band
- architecture identifier (`GA2`)

No score is recomputed in the UI layer.

## Four GA2 layers

Immediately below the GLOBAL hero, the UI exposes the four Phase-15 layers separately:

1. **Current Condition** — score and effective coverage
2. **Early Warning** — score and bounded positive adjustment
3. **Structural Vulnerability** — score and bounded positive adjustment
4. **Contagion** — score and bounded multiplier

Contagion remains a multiplier and is not displayed as if it were another additive factor.

## Deterministic explanation

A new expandable `Why is the score X?` / `Zašto je score X?` section is generated only from the current model state and the fixed GA2 formula.

It shows:

- Current Condition
- Early Warning adjustment
- Structural Vulnerability adjustment
- pre-amplifier value
- Contagion multiplier
- final GLOBAL Risk

The explanation does not call an LLM, does not generate narrative text from a network service and does not infer unavailable values.

## Current Condition contributors

The previous Overview risk-driver presentation is aligned to the production Current Condition layer. The eight production factors are:

- Credit
- Funding & Liquidity
- Volatility
- Equity Internals
- Rates
- FX
- Current Macro
- Commodities

For each available factor, Phase 16 calculates a presentation-only contribution:

`weightedEffect = (factorScore - 50) × factorWeight / sumAvailableWeights`

This is the factor's contribution to the deviation of Current Condition from the neutral value 50. It is **not** an additional risk score. The effects reconcile algebraically to:

`sum(weightedEffect) = weighted Current Condition - 50`

The UI then deterministically identifies:

- highest risk pressure contributors;
- largest offsets / lowest-risk contributors.

Missing factors remain unavailable and are never converted to zero.

## Methodology invariants

The following Phase-15 scoring functions are byte-identical to the v3.5.1.65 baseline:

- `currentMacroScoreV65`
- `currentGlobalConditionV65`
- `leadingWarningLayerV65`
- `fiscalGlobalStructuralAggregateV65`
- `structuralVulnerabilityLayerV65`
- `contagionAmplifierV65`
- `globalRiskModelV65`
- `safeGlobalRiskModelV65`

Earlier protected risk, macro, fiscal, commodity, equity, correlation and hysteresis functions also remain unchanged.

Phase-15 caps and weights remain unchanged. Phase 16 adds no raw `fetch()` call site; the count stays **6 → 6**.

## UI implementation

New presentation helpers:

- `globalUiLabelV66()`
- `globalCurrentDriverRowsV66()`
- `globalExplanationDataV66()`
- `globalLayerRowsV66()`
- `globalLayerSummaryHtmlV66()`
- `globalRiskDriversHtmlV66()`
- `globalExplanationHtmlV66()`

Methodology identifier:

`UI-EXPLAIN-V1`

New Overview targets include:

- `globalRegimeDetailV66`
- `globalLayerSummaryV66`
- `overviewGlobalWhyV66`

The layout remains responsive without changing the broader navigation or overall application design.

## Validation

Phase-16 dedicated checks: **65/65 PASS**.

Full release regression: **970/970 PASS**, covering Phase 16 and all protected Phase 3–15 methodology, parsers, freshness semantics, AGSI logic, native export bridge and Phase-14 offline validation tooling.

Additional checks:

- JavaScript syntax: PASS
- Python validation/build/signing helpers compile: PASS
- canonical `app.js` equals embedded WebView JavaScript: PASS
- fallback APK manifest/package/version/launcher: PASS
- ZIP integrity and STORED alignment: PASS
- no broad storage permission: PASS
- native export bridge in fallback DEX: PASS

## APK runtime note

The execution environment does not provide the normal Android SDK/Gradle/D8 toolchain. As in the preceding remediation releases, the installable artifact uses the deterministic fallback WebView shell and embeds the verified `index.html` asset. The complete native Java source remains in the source package, but the full Java proxy/cache implementation is not compiled into this fallback APK.

## Signing compatibility

The v3.5.1.66 APK is signed with the same certificate used for the installable v3.5.1.65 release:

`c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`

Therefore v3.5.1.66 is update-compatible with v3.5.1.65. It is not update-compatible with the older v3.5.1.64 signing chain.

## Next phase

**Phase 17 — Methodology Export V2** upgrades the methodology export to expose model purpose, raw indicators, providers, observation dates, frequency, freshness, transformations, score direction, thresholds/windows, weights, missing-data handling, eligibility, coverage, confidence and aggregation.
