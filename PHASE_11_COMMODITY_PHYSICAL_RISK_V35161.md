# Market Risk Monitor Global+ — Phase 11 Commodity Physical Risk

## PHASE 11 COMPLETE

**Baseline:** v3.5.1.60 / versionCode 93  
**Target:** v3.5.1.61 / versionCode 94  
**Scope:** Commodity Physical Risk only

## Objective

Phase 11 separates **physical supply/storage risk** from the existing **commodity price / market risk** calculations. The existing commodity price-risk functions remain production-compatible and unchanged. Physical metrics are diagnostic/audit layers in this phase and are **not inserted into GLOBAL Risk**.

## Behavioral changes

### EU gas / GIE AGSI+

The AGSI country parser now preserves official physical fields when present:

- `gasInStorage` / storage stock;
- `workingGasVolume` (WGV);
- `full` / fill percentage;
- previous-year annual `consumption` and `consumptionFull`;
- `injection`;
- `withdrawal`;
- derived daily net flow.

The Phase-11 physical layer can expose:

- storage fill %;
- seasonal percentile;
- difference versus 5-year seasonal average, in percentage points;
- year-over-year fill difference, in percentage points;
- injection / withdrawal / net-flow velocity;
- storage velocity as `% WGV/day`;
- days-of-demand coverage only when a reliable annual-consumption denominator is available.

EU aggregate days-of-demand coverage is intentionally conservative: it is eligible only when every loaded country contributing storage stock also has a valid AGSI consumption denominator. Missing consumption is never treated as zero.

### U.S. natural gas

The existing EIA price/storage calculations remain intact. Phase 11 adds a physical interpretation layer with:

- weekly storage flow;
- storage velocity relative to WGV/capacity where meaningful;
- year-ago comparison;
- 5-year seasonal comparison.

A days-of-demand value is **not fabricated** because the current loaded U.S. gas dataset does not provide a compatible annual-demand denominator in the same physical methodology.

### U.S. oil

The physical layer distinguishes SPR capacity utilization from market-price risk. Commercial crude, Cushing, gasoline and distillate inventories retain their existing inventory/change diagnostics, but no artificial fill percentage or days-of-demand metric is created where no reliable bounded capacity/demand denominator exists.

## Physical-risk formulas

For an eligible gas-storage observation:

```text
fillPct = stockTWh / wgvTWh × 100

vs5YSeasonalPP = currentFillPct − fiveYearSeasonalAverageFillPct

yoyFillPP = currentFillPct − priorYearSameSeasonFillPct

storageVelocityPctWgvPerDay =
    netFlowGWhPerDay / (wgvTWh × 1000) × 100

annualDemandCoveragePct = stockTWh / annualConsumptionTWh × 100

daysOfDemand = stockTWh / annualConsumptionTWh × 365
```

If the denominator is missing, zero, inconsistent or not sufficiently covered, the result is `null` / unavailable — never zero-filled.

## Progress-bar semantics

Only metrics with a legitimate bounded 0–100 interpretation use fill-style progress bars:

- storage fill %;
- seasonal percentile.

The following are explicitly **not** rendered as 0–100 progress bars:

- percentage-point deviation versus 5Y average;
- percentage-point YoY difference;
- injection/withdrawal velocity;
- `% WGV/day` or `% WGV/week`;
- days-of-demand.

This prevents visual normalization of inherently unbounded metrics.

## Price-risk separation

The UI now labels the two concepts separately:

```text
PHYSICAL SUPPLY RISK
PRICE / MARKET RISK
```

The following production functions remain byte-identical to v3.5.1.60:

- `commodityShockRisk`
- `commodityRegime`
- `buildCommodityOverviewV32`
- `globalFactorArchitectureV53`
- `globalRiskModel`

Therefore Phase 11 does not silently change the existing commodity-price score or GLOBAL Risk.

## Current official-source validation

The implementation fixtures were checked against the official Gas Infrastructure Europe public status snapshot dated **13 September 2026, 06:00 CEST**. The reference values used for regression validation were:

| Area | Gas in storage | Fill |
|---|---:|---:|
| EU | 769.87 TWh | 68.04% |
| Germany | 137.62 TWh | 55.60% |
| France | 94.48 TWh | 76.27% |
| Italy | 171.70 TWh | 84.40% |
| Netherlands | 75.09 TWh | 52.13% |

These values are test/reference fixtures, not hard-coded production storage values. Runtime continues to use the configured data-source path/cache architecture.

## Data/export changes

The audit/data snapshot now contains a Phase-11 physical commodity payload through `commodityPhysicalSnapshotV61()`. Export documentation records:

- physical vs price-risk separation;
- input denominators;
- formulas;
- missing-data treatment;
- bounded-progress policy;
- explicit statement that the physical layer is not yet part of production GLOBAL Risk.

No API keys or secrets are exported.

## Files/functions changed

Primary implementation changes are in:

- `app.js`
- `app/src/main/assets/index.html`
- `app/build.gradle`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.kt`
- `build_release.sh`
- Phase-11 tests and manual APK build/verification tooling.

Notable added/extended functions:

- `parseAgsiCountryCurrentV40()` — preserves consumption and flow fields;
- `buildEuGasCountriesV40()` — aggregate denominator/flow diagnostics;
- `euGasCountryCardV40()` — physical coverage/velocity presentation;
- `gasPhysicalMetricsV61()`;
- `euGasPhysicalSnapshotV61()`;
- `usGasPhysicalSnapshotV61()`;
- `usOilPhysicalSnapshotV61()`;
- `commodityPhysicalSnapshotV61()`;
- `physicalSectionTitleV61()`;
- `priceSectionTitleV61()`.

## Validation

Release QA result:

```text
561 / 561 JavaScript assertions PASS
JavaScript syntax PASS
APK structural verification PASS
Embedded WebView JS parity PASS
Raw fetch call sites: 6 -> 6
```

Phase-specific checks:

```text
Phase 11 commodity physical risk: 52/52 PASS
Phase 10 compatibility:          61/61 PASS
Phase 9 compatibility:           60/60 PASS
Phase 8 compatibility:           71/71 PASS
Phase 7:                         37/37 PASS
Phase 6 compatibility:           67/67 PASS
Phase 5 compatibility:           29/29 PASS
Phase 4 semantics:               33/33 PASS
Phase 3 confidence:              24/24 PASS
Freshness semantics:             19/19 PASS
Fiscal/loading compatibility:    23/23 PASS
Parser fixtures:                 29/29 PASS
AGSI country fixtures:           21/21 PASS
AGSI coverage fixtures:          10/10 PASS
Native export bridge:            25/25 PASS
```

## Known limitations

1. AGSI runtime country-detail requests still depend on the application's configured AGSI/API access. The build environment did not use or embed a private user API key.
2. U.S. gas days-of-demand is intentionally unavailable until a compatible, reliable demand denominator is available in the production dataset.
3. U.S. commercial petroleum inventories do not receive artificial storage-capacity percentages where a comparable fixed denominator is not methodologically valid.
4. Physical commodity metrics remain diagnostic in v3.5.1.61. Production GLOBAL Risk integration is deferred until the later validation/final-architecture phases.
5. Historical seasonal calculations remain limited by the history actually available from the loaded provider/cache; missing history is shown as unavailable, not imputed.

## Regression status

**PASS.** No Phase-11 regression was detected in protected price-risk, GLOBAL Risk, freshness, confidence, factor architecture, correlation, macro or fiscal logic.

## Next phase

**Phase 12 — Source Resilience**: classify provider dependencies, strengthen official/institutional fallback ordering where practical, and simulate timeout, malformed JSON, empty response, HTTP 429 and single-provider failure without allowing one source to collapse independent modules.
