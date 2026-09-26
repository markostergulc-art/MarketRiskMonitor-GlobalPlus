# Methodology Export — v3.5.1.47

## Purpose

**Settings → Data & Methodology → Download methodology** creates a versioned Markdown audit document for the running release. The document describes the implemented model rather than generic financial theory and includes source-function traceability.

## Generation

`methodologyMarkdownV47()` reads active runtime constants where they are globally available, including:

- user-configurable country-risk weights from `getWeights()`;
- `EQUITY_INTERNAL_WEIGHTS`;
- `GLOBAL_WEIGHTS`;
- `INFLATION_WEIGHTS`;
- `RECESSION_WEIGHTS`;
- the exact Fiscal Stress component weights mirrored from the protected `fiscalScoreRowsV43()` implementation and regression-tested against that implementation.

The Markdown includes application version/versionCode and generation timestamp. `exportMethodologyV47()` performs **0 network requests**.

## Covered models

The exported document covers: Country/Market Risk, Global Market Health / Equity Internals, GLOBAL Risk, Global Contagion, Macro Inflation/Recession detectors, Correlation/Correlation Regime, Early Warning, S&P 500/equity internals, Sovereign Fiscal Stress, Commodities, GIE AGSI+, Company Risk, ETF logic and Dividend Safety.

For auditability it records formula/aggregation semantics, weights/thresholds where applicable, missing-data and coverage treatment, fiscal freshness/eligibility rules, final status mapping and source-function names.

## Key exact model rules included

- Country risk: `weightedScore()` renormalizes only across finite subscores; `riskBand()` maps `<25 GREEN`, `<45 LIGHT GREEN`, `<60 ORANGE`, `<75 DARK ORANGE`, otherwise `RED`.
- Global Market Health: minimum 60 valid history observations per eligible market; global eligibility requires the existing 40% market-coverage gate.
- GLOBAL Risk: `GLOBAL_WEIGHTS={creditFunding:25, volatility:15, equity:10, macro:15, liquidity:10, rates:8, fx:7, commodities:5, correlation:5}` and missing components are excluded from numerator/denominator.
- Fiscal Stress: weights `{debt:15, debtTrend:15, balance:15, primary:10, interest:15, financing:10, refiGap:10, rMinusG:10}`; at least 4 valid components plus debt-stock, fiscal-flow and market-financing evidence; `<35 NORMAL`, `<50 WATCH`, `<70 ELEVATED`, otherwise `HIGH STRESS`; insufficient data stays `LIMITED DATA`.
- Company core risk: momentum 40%, drawdown 25%, volatility 20%, technical 15%; momentum uses 1M/3M/1Y weights 30/45/25; technical 50DMA/200DMA weights 45/55.
- Dividend Safety: history 30%, growth 20%, consistency 20%, market 20%, yield quality 10%.

## No model change

The methodology exporter is observational/documentary. It does not change any scoring function, provider, loading queue, freshness rule or cache policy.
