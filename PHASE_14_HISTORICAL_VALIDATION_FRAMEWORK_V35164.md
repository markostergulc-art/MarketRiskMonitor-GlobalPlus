# PHASE 14 COMPLETE — Historical Validation Framework

Baseline: **3.5.1.63 / versionCode 96**  
Target version: **3.5.1.64 / versionCode 97**

## Scope

Phase 14 builds the historical-validation infrastructure required before any substantial Phase-15 GLOBAL Risk redesign. It deliberately does **not** optimize production weights or risk bands.

## Files changed

Core release files:

- `app.js`
- `app/src/main/assets/index.html`
- `app/build.gradle`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java` — versioned User-Agent only
- `build_release.sh`

New Phase-14 infrastructure:

- `tools/historical_validation_v35164.py`
- `tools/build_manual_apk_v35164.py`
- `tools/verify_fallback_apk_v35164.py`
- `tests/phase14_historical_validation_v35164.js`
- `tests/phase14_offline_tool_v35164.py`
- `tests/phase14_release_qa_v35164.sh`
- Phase-14 compatibility tests for Phases 6, 8, 9, 10, 11, 12 and 13

Documentation:

- `CHANGELOG_V35164.md`
- `PHASE_14_HISTORICAL_VALIDATION_FRAMEWORK_V35164.md`
- `REGRESSION_V35164.md`
- `QA_RESULTS_V35164.txt`

## Functions added

Runtime/WebView:

- `validationFactorWeightsV64()`
- `validationMedianV64()`
- `validationNormalizeSeriesV64()`
- `validationLastIndexOnOrBeforeV64()`
- `validationRowsBetweenV64()`
- `validationMaxDrawdownPctV64()`
- `validationForwardOutcomeV64()`
- `validationReferenceStressFlagV64()`
- `validationConfusionV64()`
- `validationRocAucV64()`
- `validationPrAucV64()`
- `validationThresholdStudyV64()`
- `validationReweightedScoreV64()`
- `validationWeightSensitivityV64()`
- `validationVintageEligibilityV64()`
- `validationEventWindowLeadV64()`
- `validationBenchmarkAnchorsV64()`
- `validationSnapshotV64()`
- `validationHistoryLoadV64()`
- `validationHistorySaveV64()`
- `historicalValidationReadinessV64()`
- `historicalValidationManifestV64()`
- `historicalValidationExportV64()`
- `historicalValidationMethodologyV64()`

## Point-in-time design

### Live runtime capture

After `refreshAll()` has built the final `appState`, the app stores one point-in-time validation snapshot for that day. The snapshot contains:

- as-of date and capture timestamp;
- GLOBAL numeric score;
- raw and displayed band;
- Phase-5 factor scores and weights;
- data/factor/freshness/effective coverage;
- confidence;
- Early Warning layer scores;
- contemporaneous U.S. headline-market, HY OAS and VIX anchors where available.

The validation snapshot is separate from the production model. Capturing it cannot change the score.

### Historical reconstruction

Strict mode rejects reconstructed historical snapshots unless each vintage input proves that it was available no later than the score's `asOf` date. Outcomes are:

- `VINTAGE_VERIFIED`
- `VINTAGE_UNVERIFIED`
- `MISSING_AVAILABLE_AT`
- `LOOKAHEAD_INPUT`

This prevents a backtest from silently feeding today's revised macro observations into an earlier historical score.

## Forward outcomes

For each eligible historical score the framework supports:

- **21 trading days**
- **63 trading days**
- **126 trading days**
- **252 trading days**

The market base value is the last actual market observation **on or before** the score date. The endpoint is selected by trading-observation index, not by adding calendar days.

Calculated outcomes:

- forward return;
- maximum forward drawdown;
- annualized forward volatility;
- HY OAS maximum widening versus as-of value;
- maximum VIX inside the horizon;
- recession onset only when an external recession-outcome series is actually supplied.

Missing recession data stay `N/A`. They are never converted into “no recession”.

## Diagnostic stress target

For framework testing, a transparent reference target is provided:

- max forward drawdown <= -10%; or
- HY spread widening >= 100 bp; or
- VIX >= 35; or
- externally supplied recession onset.

This is marked `HEURISTIC_VALIDATION_TARGET_ONLY`. It is **not** a production threshold, it does not alter GLOBAL Risk, and future research may compare alternative outcome definitions.

## Validation metrics

For labelled history the framework calculates:

- precision;
- recall;
- false-positive rate;
- false-negative rate;
- confusion matrix;
- ROC/AUC;
- PR-AUC;
- conditional maximum forward drawdown;
- median warning lead across analytical event windows.

AUC is not the sole objective. Early Warning analysis is intended to consider useful lead time together with false-alarm burden.

## Event windows

The default registry contains the requested analytical windows for:

- dot-com bust;
- Global Financial Crisis;
- Eurozone crisis;
- 2015–2016 China/oil shock;
- Q4 2018;
- COVID market shock;
- 2022 rates/inflation shock;
- 2023 bank stress.

The stored dates are explicitly labelled **`ANALYTICAL_REFERENCE_NOT_OFFICIAL`**. They are configurable research windows, not claims that the dates are official recession boundaries or unique causal start/end dates.

Default warning-lead diagnostic uses threshold 60 and a **126-calendar-day** pre-event lookback. This is diagnostic only.

## Weight sensitivity

Every Phase-5 factor is tested independently with:

- 80% of baseline weight;
- 100% baseline;
- 120% of baseline weight.

All other factor weights and all factor scores remain frozen for each comparison. The framework flags a diagnostic instability if a one-factor perturbation changes a tested composite by at least 5 points. No changed weight is written back to production.

## Threshold testing

Production thresholds remain:

- 25
- 45
- 60
- 75

The framework also evaluates a 20..80 grid in 5-point steps. It will not provide a diagnostic historical suggestion until at least 30 labelled point-in-time rows with both stress and non-stress outcomes exist. Selection is based on balanced accuracy, then F1, then proximity to 60. Any suggestion remains diagnostic; `productionThresholdChanged=false`.

## Offline reproducible backtest tool

`tools/historical_validation_v35164.py` performs the full calculation without internet access.

Required:

```bash
python3 tools/historical_validation_v35164.py \
  --snapshots historical_validation_snapshots.json \
  --market market.csv \
  --output-dir validation_results
```

Optional:

```text
--hy-oas hy_oas.csv
--vix vix.csv
--recession recession.csv
--events custom_event_windows.json
--warning-threshold 60
--lead-window-days 126
```

Outcome CSV files use `date,value`. Historical reconstruction is strict by default. `--allow-unverified-vintages` exists only for clearly marked exploratory analysis and is recorded in the output manifest.

The tool writes:

- `manifest.json`
- `summary.json`
- `eligible_snapshots.csv`
- `rejected_snapshots.json`
- `observations.json/csv`
- `metrics.json/csv`
- `threshold_study.json`
- `weight_sensitivity.json`
- `event_windows.json`
- `event_lead.json`

## App data export additions

Current-data ZIP now also contains:

- `historical_validation_manifest.json`
- `historical_validation_readiness.json`
- `historical_validation_snapshots.json`
- `historical_validation_snapshots.csv`
- `historical_validation_weight_sensitivity.json`
- `historical_validation_event_windows.json`
- `historical_validation_event_lead.json`

The export triggers zero extra network requests.

## Calculations changed

**Production calculations: NO.**

`riskBand()`, `weightedScore()`, `globalRiskModel()`, Phase-5 factor architecture, Phase-8 correlation, Phase-9 Macro, Phase-10 Fiscal, Phase-11 commodity-price logic and Phase-13 hysteresis remain regression-protected.

Phase 14 only adds validation calculations outside the production scoring path.

## UI changed

No navigation redesign and no new dashboard score. Visible release version is updated to v3.5.1_64. Historical-validation artifacts are exposed through the existing export mechanism rather than adding a new high-noise screen.

## Tests

**PASS — 841 / 841 automated checks**

Additional syntax, APK-structure and signature checks: PASS.

## Known limitations

1. The release does **not** bundle a genuine historical point-in-time macro/vintage database.
2. Therefore no real precision, recall, AUC, lead-time or predictive-skill claim is made yet.
3. Runtime PIT history begins accumulating from actual app use; sparse daily captures cannot substitute for a complete historical benchmark series.
4. ALFRED/archived-release data are supported conceptually by the strict `availableAt` contract and offline import path, but are not downloaded or bundled in this release.
5. Default event dates and the reference stress label are analytical research definitions, not official classifications.

## Regression checks

**PASS.** See `REGRESSION_V35164.md` and `QA_RESULTS_V35164.txt`.

## Next phase

**Phase 15 — Final GLOBAL Risk Architecture.** The new validation framework now exists, but production architecture should only be changed conservatively and should not claim empirical superiority until genuine point-in-time historical data are supplied and evaluated.
