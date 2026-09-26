# Regression Report — v3.5.1.49

Baseline: v3.5.1.48 / versionCode 81  
Target: v3.5.1.49 / versionCode 82

## Allowed functional change

Only Phase-1 freshness semantics, freshness metadata/export fields, minimal freshness detail presentation, release metadata/versioning and corresponding tests/build helpers changed.

## Protected calculation/loading functions

35 protected/network/loading functions were compared against the v3.5.1.48 baseline. All are byte-identical, including:

- `riskBand`, `weightedScore`
- `globalRiskModel`, `globalContagion`
- `marketMetrics`, `trendRisk`, country macro/FX/systemic functions
- correlation functions
- inflation/recession detector calculations and `buildMacroCycle`
- Fiscal Stress score/freshness/reference functions
- commodity calculations
- equity internals / Global Market Health aggregation
- company-risk functions
- P0/P1/P2/P3 scheduler functions
- `sparklineSvg`, `marketCardSparkPeriodV46`
- `fetchWithTimeout`

Result: **35/35 byte-identical**.

## Existing feature regression

- Market Health / Overview: 32/32 PASS
- Markets-card sparkline period: 42/42 PASS
- Graph-period/loading observer: 43/43 PASS
- Native export bridge: 25/25 PASS
- Fiscal score: 48/48 PASS
- Fiscal freshness/loading: 23/23 PASS
- EU gas countries: 21/21 PASS
- Storage coverage: 10/10 PASS
- Parser suites: 29/29 + 29/29 + 22/22 PASS
- Native ZIP/Base64 roundtrip: 3/3 PASS

Phase-1 tests:

- freshness semantics: 19/19 PASS
- consolidated Phase-1 regression: 60/60 PASS

Total deterministic checks: **406/406 PASS**.

## Native continuity

Production native source is byte-identical to v3.5.1.48:

- `MainActivity.java`
- `AgsiKeyStore.java`
- `AndroidManifest.xml`

Fallback DEX therefore retains the v48 native export bridge. `resources.arsc` is unchanged.

## APK/signing

- ZIP integrity: PASS
- STORED alignment: PASS
- V1/JAR: PASS
- V2: PASS
- V3: PASS
- release signing certificate SHA-256: `c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`

## Not executed

Physical Android/GrapheneOS launch, touch interaction and live provider refresh remain NOT EXECUTED because no ADB device is available.
