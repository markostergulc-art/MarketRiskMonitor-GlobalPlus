# Market Risk Monitor Global+ v3.5.1.69 — Targeted Hotfix

Baseline: v3.5.1.68 / versionCode 101  
Release: v3.5.1.69 / versionCode 102

## Scope

Only the reported defects are addressed:

1. China / CSI 300 (`000300.SS`) and Philippines / PSEi (`PSEI.PS`) market history loading.
2. Overview GA2 cards: Current Condition, Early Warning, Structural Vulnerability, Contagion.
3. FRED HTTP 403 transport failure required by the affected warning/structural indicators.
4. Mandatory release metadata/signing packaging.

No scoring formula, threshold, factor weight, correlation arithmetic, commodity logic, fiscal arithmetic, navigation, refresh layout, cache policy, package identity, or database schema was redesigned.

## Root cause and correction

### CN / PH

v3.5.1.68 considered a Yahoo response successful as soon as `yahoo()` returned an array. For both affected symbols the device export showed exactly one observation — the `regularMarketPrice` metadata point — while the historical `timestamp/close` series was absent. Because the promise resolved, the 2Y/1Y recovery chain was never reached and `marketMetrics()` later rejected the one-point series.

v3.5.1.69 now requires at least five finite dated observations before a CN/PH primary series is accepted. The recovery remains targeted to the same primary symbols and provider:

- normal Yahoo chart range attempts,
- forced-fresh Yahoo explicit `period1/period2` chart request,
- final Yahoo historical-price page recovery for the same symbol.

No ETF, Hong Kong proxy, SSE Composite substitution, or synthetic series is used.

### Four Overview GA2 cards

`globalRiskModelV65()` already calculated `layersV65`, `layerCoverage`, `layerAvailability`, `layerCoverageWeights`, and `formulaV65`. `refreshAll()` copied the scalar/global component fields into `appState.global` but omitted those final-layer objects. The renderer reads those objects, therefore all four cards displayed N/A despite available model results.

v3.5.1.69 copies the already-calculated objects into `appState.global`. No GA2 arithmetic is recalculated in the renderer.

### FRED 403

The exported v3.5.1.68 runtime showed FRED success=0 / fail=73, all HTTP 403. v3.5.1.69 preserves the same FRED series IDs and first tries the existing `fredgraph.csv` request. On failure it uses St. Louis Fed ALFRED current-vintage CSV for the same series ID and observation window. After the first HTTP 403, a runtime circuit breaker skips repeated blocked `fredgraph.csv` attempts during that app session and goes directly to ALFRED for subsequent FRED series.

No FRED values are replaced with zero and no scoring formulas are changed.

## Signing

At the project owner's explicit request the source bundle contains the existing release signing material under `signing/`. The release certificate is unchanged so the APK remains upgrade-compatible with the preceding signed release. The signing directory is confidential and must not be published.
