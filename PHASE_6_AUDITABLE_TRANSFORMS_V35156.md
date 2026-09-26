# Market Risk Monitor Global+ — Phase 6: Auditable 0–100 Transforms

## PHASE 6 COMPLETE

**Baseline:** v3.5.1.55 / versionCode 88  
**Target:** v3.5.1.56 / versionCode 89  
**Audit schema:** `SA1`

## Objective

Make the existing 0–100 scoring transforms reproducible and inspectable without retuning production risk mathematics.

Every exported runtime score trace now exposes, where applicable:

- `rawValue`
- `transformType`
- `parameters`
- `normalizedValue`
- `riskScore`
- `direction`
- `basis`
- `sourceFunction`

Threshold provenance is explicit:

- `HEURISTIC` — judgmental/model-design thresholds;
- `HISTORICAL` — normalization derived from a historical sample/window;
- `PROVIDER_STANDARD` — a provider-defined bounded metric/definition.

A historical normalization can still use a heuristic mapping from percentile to risk. In that case the registry records `basis: HISTORICAL` and `riskMappingBasis: HEURISTIC` rather than overstating empirical validation.

## Implementation

### Static transform registry

Added `SCORE_TRANSFORM_REGISTRY_V56` with more than 40 documented transform definitions covering the important score paths in:

- Market / Country Risk
- FX
- Early Warning
- Macro Inflation
- Macro Recession
- Company Risk
- Dividend Safety
- Commodities
- GLOBAL Risk
- Sovereign Fiscal Stress
- historical-percentile transforms
- provider-reported bounded AGSI fill percentage

The registry includes exact thresholds, interpolation points, weights, direction and source functions where these are defined by current production code.

### Runtime score traces

Added `scoreTraceV56()` and `scoreAuditSnapshotV56()`.

The current loaded/calculated state can now be exported as trace records. No data refresh is triggered by export.

Runtime tracing includes:

- Country final score inputs/weights/coverage;
- Macro and Early Warning indicator raw values and produced risk scores;
- Fiscal raw components, absolute piecewise risk, cross-sectional component where available, component weights and final score;
- GLOBAL factor subfactors, factor weights, coverage and final weighted score.

### Data export

The existing Data ZIP now additionally contains:

- `score_transforms.json`
- `score_traces.json`
- `score_traces.csv`

`data_snapshot.json` also contains the Phase-6 audit block and registry.

Existing secret/credential sanitation remains active.

### Methodology export

The methodology Markdown export now appends a generated catalogue of each registered transform with:

- transform ID;
- module and label;
- transform type;
- direction;
- provenance basis;
- source function;
- exact parameters/thresholds/windows;
- provider/standard notes where applicable.

## Calculation changes

**None.**

The following production functions were regression-checked byte-for-byte against v3.5.1.55 and remain unchanged:

`volRisk`, `trendRisk`, `fxRisk`, `marketRisk`, `macroRiskFromWB`, `weightedScore`, `riskBand`, `adverseMomentumRisk`, `companyDrawdownRisk`, `companyVolatilityRisk`, `companyCoreRiskParts`, `dividendSafety`, `globalContagion`, `factorRecordV53`, `globalFactorArchitectureV53`, `globalRiskModel`, `inflationRateRisk`, `inflationDetector`, `recessionLeadingAndComposite`, `usEarly`, `fiscalPiecewiseV43`, `fiscalAbsRiskV43`, `fiscalScoreRowsV43`, `commodityShockRisk`, `sprFillRisk`, `daysSupplyRisk`, `inventoryWeeklyRisk`, and `refreshAll`.

No new raw `fetch()` call site was introduced.

## Manual reproduction checks

Independent test calculations outside the production scoring functions reproduce current behavior:

- realized volatility `24.6` → risk `55`;
- US HY OAS `410 bp` → risk `58`;
- VIX `24.6` → risk `55`;
- adverse momentum `-4%` → risk `65`;
- inflation `3.5` with thresholds `2.2 / 3.0 / 4.0` → risk `68`;
- fiscal debt/GDP `75%` → exact linear interpolation between the documented `60` and `90` points;
- deterministic Phase-5 GLOBAL weighted fixture → independently reproduced score `41`.

The illustrative numbers from the remediation prompt are not forced into production. Phase 6 documents the formula actually implemented in the app.

## Regression / QA

Release QA result: **PASS**.

Automated functional checks:

- Phase 6 auditability: **70/70 PASS**
- Phase 5 factor architecture: **29/29 PASS**
- Phase 4 Early Warning semantics: **33/33 PASS**
- Phase 3 confidence compatibility: **24/24 PASS**
- Phase 1 freshness fixtures: **19/19 PASS**
- parser fixtures: **29/29 PASS**
- AGSI country fixtures: **21/21 PASS**
- AGSI coverage fixtures: **10/10 PASS**
- fiscal freshness/loading: **23/23 PASS**
- native export bridge: **25/25 PASS**

Total reported automated checks: **283/283 PASS**.

APK structural validation also passed package/version/minSdk/targetSdk/launcher, ZIP integrity/alignment, embedded WebView source identity, native export bridge and storage-permission checks.

The installable APK is signed with the same persistent release certificate used for v3.5.1.53–v3.5.1.55 and carries verified v2/v3 APK signatures.

## Files changed

- `app.js`
- `app/src/main/assets/index.html`
- `app/build.gradle`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java` — versioned User-Agent only
- `build_release.sh`
- `tools/build_manual_apk_v35156.py`
- `tools/verify_fallback_apk_v35156.py`
- `tests/phase6_auditability_v35156.js`
- `tests/phase6_release_qa_v35156.sh`
- Phase-6 documentation / regression reports

## UI changed

No functional UI redesign. Only the visible application version advances to v3.5.1_56. The fixed refresh-frame and compact GLOBAL summary from the v3.5.1.54/v3.5.1.55 corrective work are retained unchanged.

## Known limitations

1. Phase 6 makes the current model reproducible; it does **not** prove predictive validity.
2. `HEURISTIC` thresholds remain heuristic until proper historical validation is performed in Phase 14.
3. Historical-percentile transforms depend on the configured available lookback/sample; their percentile normalization is historical, while bucket-to-risk mappings can still be heuristic.
4. Runtime trace files contain only data already loaded/calculated in the current app session/snapshot. Missing modules remain missing rather than fabricated.
5. Some complex composite rows expose the producing source function plus documented family transform rather than pretending a separate intermediate statistic exists when the current implementation does not retain one.

## Next phase

**Phase 7 — Equity Global Weighting.**
