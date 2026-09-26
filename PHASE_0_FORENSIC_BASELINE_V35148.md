# Market Risk Monitor Global+ — Phase 0 Forensic Baseline Inspection

Date: 2026-09-14

## PHASE 0 COMPLETE

No production code was modified in this phase. The authoritative baseline was inspected from the v3.5.1.48 source package together with the actual v3.5.1.48 methodology export and runtime data snapshot.

## Baseline

- versionName: `3.5.1.48`
- versionCode: `81`
- package: `com.marko.marketrisk.globalplus`
- Primary logic: `app.js`, embedded into `app/src/main/assets/index.html` for release.

## Current scoring architecture

### Country / Market Risk

`finalizeCountries()` assigns the systemic subscore, then calls `weightedScore()` across the configured country weights. `weightedScore()` excludes non-finite subscores and renormalizes the remaining weights. `riskBand()` maps the resulting number to GREEN / LIGHT GREEN / ORANGE / DARK ORANGE / RED.

Default country weights:

- market 25%
- macro 20%
- credit 15%
- liquidity 15%
- valuation 10%
- technical 10%
- systemic 5%

Important: there is no minimum country-level factor/weighted-coverage eligibility gate before a normal color is assigned. This is the main Phase 2 risk.

### Market transforms

`marketMetrics()` derives 1D, 1M, 3M, YTD, 1Y, distance-to-50DMA, distance-to-200DMA, MA cross, 52-week drawdown and 20-day annualized realized volatility.

`trendRisk()` converts distance-to-200DMA, 52-week drawdown, 3M return and MA cross into 0–100 heuristic risk scores through piecewise hard-coded thresholds and averages the available values.

`marketRisk()` combines trend risk, realized-volatility risk and drawdown risk. Missing finite components are omitted.

### Country macro / FX / systemic

`macroRiskFromWB()` converts GDP growth, inflation and unemployment into heuristic 0–100 values and averages available inputs.

`fxRisk()` averages realized-volatility risk and absolute 3M FX move risk.

`systemScoreForCountry()` combines correlation-derived stress and drawdown stress.

### GLOBAL Risk

`globalRiskModel()` builds nine top-level components:

- Credit/Funding 25%
- Volatility 15%
- Equity 10%
- Macro 15%
- Liquidity 10%
- Rates 8%
- FX 7%
- Commodities 5%
- Correlation 5%

The final GLOBAL score is a renormalized weighted average over finite top-level components. Current GLOBAL `coverage` is only available top-level weight / total top-level weight. It does not propagate factor completeness or freshness from inside those components.

The actual v3.5.1.48 runtime snapshot reports GLOBAL Risk `30 / 100`, LIGHT GREEN, `coverage=100`, confidence MEDIUM even though some underlying country and sub-factor coverage is materially incomplete. This is a high-risk coverage-semantic issue for Phase 2.

### Global Contagion

`globalContagion()` averages transformed average cross-market correlation, the fraction of markets with at least an 8% 52-week drawdown, and average realized-volatility risk.

### Equity Internals

`equityInternalsRecord()` uses price structure, breadth, leadership, size participation, sector breadth, volatility term structure, tail risk, correlation dispersion and drawdown velocity where available. `weightedAvailableEquity()` renormalizes over available internal factors.

`aggregateEquityInternalsV42()` then takes a simple arithmetic average of eligible country-market internal scores. This means eligible markets are effectively equally weighted globally. Eligibility requires at least 60 history points, a finite score and positive coverage; the global market-count gate is 40%. Many country records with only ~40% factor coverage can still enter the global average.

### Macro detectors

`inflationDetector()` and `recessionLeadingAndComposite()` use weighted renormalization over available inputs and report coverage/confidence. `buildMacroCycle()` averages the two detector scores. The detector architecture is predominantly U.S. FRED data with some Germany context, not a true multi-region Global Macro model.

### Fiscal Stress

`fiscalScoreRowsV43()` uses:

- debt 15%
- debt trend 15%
- fiscal balance 15%
- primary balance 10%
- interest burden 15%
- financing 10%
- refinancing gap 10%
- r-g 10%

Eligibility currently requires at least four valid components, plus a debt-stock metric, a fiscal-flow metric and a market-financing metric. Valid weights are renormalized. `fiscalFreshnessV44()` already has separate fiscal-specific frequency logic and stale observations are excluded from current score/rankings.

### Commodities

`commodityShockRisk()` combines price momentum, volatility and drawdown. `buildCommodityIntelligence()` reports source/module coverage and confidence separately from price risk. Physical storage/reserve modules already preserve units and provider-specific denominators.

### Correlation

`corrMatrix()` aligns daily returns by exact calendar date and computes same-date correlations. `correlationRegimeDiagnostic()` compares 20D / 60D / 120D windows and breadth. No timezone/trading-sequence correction exists for US/Europe/Asia systemic calculations.

## Current freshness architecture

General non-fiscal freshness currently flows primarily through:

`fredKind()` -> `fred()` -> `enrichEarlySources()` -> `freshnessStatus()`

`freshnessStatus()` currently uses observation age thresholds:

- macro: always CURRENT regardless actual age
- weekly: CURRENT <=10 days, otherwise STALE
- monthly: CURRENT <=45 days, otherwise STALE
- Yahoo: DELAYED <=72h, otherwise STALE
- other market: CURRENT <=48h, DELAYED <=96h, otherwise STALE

This conflates observation age with release currency. It does not generally expose release date or expected next release.

Actual exported v3.5.1.48 Early Warning data demonstrate inconsistent classifications for equivalent FRED series:

- NFCI 2026-09-04 -> STALE
- STLFSI4 2026-09-04 -> STALE
- NFCI Risk 2026-09-04 -> CURRENT
- NFCI Credit 2026-09-04 -> CURRENT
- SLOOS C&I 2026-07-01 -> STALE
- Business-loan delinquency 2026-04-01 -> STALE
- CRE-loan delinquency 2026-04-01 -> CURRENT in another path

This inconsistency is caused by series-specific construction/data-kind inference rather than real release semantics.

## Current confidence architecture

There is no single shared confidence model. Different modules use different semantics:

- Country risk: source-quality metadata exists, but no explicit country risk confidence gate.
- Early Warning: confidence is mostly provider class (official FRED/ECB/Cboe/etc. HIGH, Yahoo MEDIUM).
- Macro: confidence derives mainly from weighted component coverage.
- Equity Internals: confidence derives from factor-weight coverage thresholds.
- GLOBAL Risk: confidence combines top-level component coverage and provider transport-health ratio.
- Commodities: confidence uses module coverage and official/live source availability.
- Fiscal: coverage tier exists, but it is not a unified risk-confidence construct.

These values are not directly comparable across modules.

## Current coverage architecture

Coverage is overloaded:

- country composite: no explicit weighted coverage is surfaced before band assignment;
- Equity Internals: factor-weight availability;
- global equity: eligible markets / configured markets;
- GLOBAL Risk: available top-level weights only;
- macro: available detector weights;
- fiscal: valid component count/eligibility;
- commodities: available expected metrics.

The application does not currently distinguish data coverage, factor coverage and freshness coverage as separate concepts.

## Confirmed high-risk areas before modification

1. **Freshness semantics:** slow-frequency/latest-official observations can be mislabeled STALE solely by observation age.
2. **Country score eligibility:** renormalization can produce GREEN/LIGHT GREEN from severely incomplete factors. Runtime examples include Norway, Poland and UAE with missing market/technical/internals inputs but normal-looking risk bands.
3. **GLOBAL coverage:** 100% top-level coverage can coexist with incomplete/stale underlying factors.
4. **Confidence:** heterogeneous module-specific meanings are presented under the same word.
5. **Early Warning semantics:** leading, current-stress, late-confirmation and structural signals are mixed.
6. **Double-counting:** overlapping credit/funding, liquidity/FX, equity/breadth and systemic/correlation signals can enter multiple composites.
7. **Global equity weighting:** eligible country markets are averaged equally.
8. **Global correlation:** same-calendar-date closes ignore asynchronous trading sessions.
9. **Macro scope:** macro detector is primarily U.S.-centric with Germany context, not a balanced Global Macro cycle.
10. **Fiscal role:** structural debt variables and market-financing pressure coexist in one stress score without a clear structural-vs-marginal distinction.
11. **0–100 transforms:** many piecewise thresholds are embedded directly in functions and are not fully reproduced by methodology export.
12. **Historical validation:** no point-in-time/vintage backtest framework exists; predictive ability is not established.

## Raw -> normalized -> score -> composite implementation map

### FRED Early / Macro example

FRED CSV -> `fred()` -> raw series + source metadata -> signal-specific detector (`inflationDetector()`, `recessionLeadingAndComposite()`, Early Warning builders) -> piecewise/weighted transform -> 0–100 signal score -> detector/global component.

### Market example

Yahoo/FRED market history -> `marketMetrics()` -> returns/MA/drawdown/volatility -> `trendRisk()` / `marketRisk()` -> country market subscore -> `weightedScore()` -> country risk -> `riskBand()`.

### Equity Internals example

Market/sector/equal-weight/small-cap history -> `equityInternalsRecord()` -> internal factor scores -> `weightedAvailableEquity()` -> country internals score -> `aggregateEquityInternalsV42()` -> global equity internals.

### Fiscal example

Eurostat / IMF / WB / market yield -> fiscal normalization/reference selection -> `fiscalFreshnessV44()` -> `fiscalScoreRowsV43()` -> Fiscal Stress score -> fiscal band/ranking eligibility.

### Correlation example

Country index histories -> aligned daily returns -> `corrMatrix()` -> average/breadth -> `correlationRegimeDiagnostic()` / `globalContagion()` -> GLOBAL correlation/contagion component.

## Phase 0 validation

- Source package extracted and parsed: PASS
- Baseline version confirmed from `app/build.gradle`: PASS
- Actual methodology export inspected: PASS
- Actual runtime data export inspected: PASS
- Production code modifications: **0**
- Regression risk introduced by Phase 0: **none**

## Next phase

Phase 1 — Fix Freshness Semantics. Target release: `3.5.1.49` / versionCode `82`.
