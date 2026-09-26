# Regression Report — v3.5.1.50

Baseline: v3.5.1.49 / versionCode 82  
Target: v3.5.1.50 / versionCode 83

## Allowed methodological change

Only Phase-2 coverage/eligibility semantics were changed:

- Country Risk coverage metadata and normal-status eligibility;
- GLOBAL Risk coverage metadata and normal-status eligibility;
- required UI/audit/methodology presentation of those semantics;
- legacy-cache protection for missing Phase-2 coverage metadata.

## Numeric score continuity

- Country `weightedScore()` is byte-identical to v3.5.1.49.
- Normal risk-band thresholds are unchanged.
- Deterministic paired GLOBAL fixture confirms the v3.5.1.50 GLOBAL numeric score equals the v3.5.1.49 numeric score for identical finite inputs.
- Missing inputs remain excluded; they are never zero-filled.

## Protected functions

The Phase-2 regression suite compares v3.5.1.50 against the actual v3.5.1.49 source. Protected functions remain byte-identical, including:

- `riskBand`, `weightedScore`, `globalContagion`;
- `marketMetrics`, `trendRisk`, `macroRiskFromWB`, `fxRisk`;
- correlation calculation/regime functions;
- inflation/recession/Macro-cycle functions;
- Fiscal Stress score/freshness/reference functions;
- commodity intelligence;
- Equity Internals and S&P/company risk;
- P0/P1/P2/P3 scheduler functions;
- chart/sparkline functions;
- `fetchWithTimeout`;
- Phase-1 `freshnessModelV49`, `freshnessFieldsV49`, `annotateMacroCycleFreshnessV49`.

Intentional Phase-2 changes include `buildCountries`, `finalizeCountries`, `globalRiskModel`, coverage-aware display/ranking, audit export fields, methodology text, refresh result packaging and cache rehydration.

## Inherited suites

PASS:

- Phase-2 coverage fixtures: 22/22
- Phase-2 protected regression: 57/57
- Phase-1 freshness semantics: 19/19
- Market Health / Overview: 32/32
- Graph-period / loading UI: 42/42
- Fiscal score/regression: 48/48
- Fiscal freshness/loading: 23/23
- EU gas country fixtures: 21/21
- AGSI storage coverage: 10/10
- Parser fixtures: 29/29 + 29/29 + 22/22
- Native export bridge: 25/25
- Native ZIP/Base64 roundtrip: 3/3

Total deterministic checks: **382/382 PASS**.

## Native continuity

Phase 2 does not require native Android changes. Fallback native payload hashes remain:

- `classes.dex`: `70b9a6162c6514f2dca15243407a34a8b271d17c4d2a4193523a9ed77918c83e`
- `resources.arsc`: `698bae3d88dca55eae07586fd95ce0d4d7f29d89fbb61b239eb63db1f7caabf9`

Signing certificate SHA-256 remains:

`c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`

## Limitations

NOT EXECUTED:

- physical Android/GrapheneOS launch/touch/refresh validation;
- live installed-device provider validation;
- full Android SDK/Gradle build.

The deterministic/manual APK pipeline validates source, APK structure, embedded assets, signatures and calculations, but does not substitute for installed-device acceptance.
