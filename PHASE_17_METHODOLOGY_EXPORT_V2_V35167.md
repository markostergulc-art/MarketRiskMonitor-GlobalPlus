# Phase 17 — Methodology Export V2

Release: **Market Risk Monitor Global+ v3.5.1.67 / versionCode 100**

## Objective

Phase 17 is the final defined methodology-remediation phase. It upgrades the audit/methodology export without changing production scoring, GA2 weights/caps, risk bands, Phase-13 hysteresis, Phase-16 presentation arithmetic, refresh scheduling or provider acquisition logic.

The export is generated only from already-loaded/calculated runtime state. It performs **zero network requests**. Missing values remain N/A/null and are never converted to zero risk.

## Methodology V2 schema

Methodology identifier: `METHOD-V2-1`

Schema identifier: `METHODOLOGY_EXPORT_V2`

For every documented model, the structured record exports:

- purpose;
- raw indicators;
- provider(s);
- observation date;
- frequency;
- freshness method;
- transformation;
- score direction;
- thresholds/window;
- weights;
- missing-data treatment;
- eligibility gates;
- coverage;
- confidence;
- aggregation;
- source functions.

The runtime inventory contains 18 explicit model records:

1. Country / Market Risk
2. Global Market Health / Equity Internals
3. U.S. Macro Cycle
4. Global Macro Cycle
5. Early Warning Layers
6. Fiscal Structural Vulnerability
7. Fiscal Market Refinancing Pressure
8. Commodity Price / Market Risk
9. Commodity Physical Supply Risk
10. Descriptive Correlation
11. Systemic Lag-Aware Correlation
12. GLOBAL Risk GA2
13. Company Risk
14. ETF Risk
15. Dividend Safety
16. Score Hysteresis
17. Historical Validation Framework
18. Provider / Source Resilience

U.S. Macro and Global Macro audit rows are separated explicitly: the U.S. record excludes `regional_macro` rows while the Global Macro record consumes the regional Phase-9 rows.

## GLOBAL Risk dependency tree

The V2 export includes the full GA2 dependency tree:

- **Current Global Condition**
  - Credit
  - Funding / Liquidity
  - Volatility
  - Global Equity Internals
  - Rates
  - FX
  - Current Macro
  - Commodities
  - nested Phase-5 factor/subfactor inputs where available in runtime state
- **Leading Warning**
  - LEADING
  - EARLY_CONFIRMATION
  - LATE_CONFIRMATION explicitly excluded from the production warning layer
- **Structural Vulnerability**
  - fiscal structural vulnerability
  - structural financial vulnerability
- **Contagion Amplifier**
  - lag-aware systemic correlation
  - cross-market drawdown breadth
  - realized-volatility stress
  - bounded non-negative multiplier

The tree also exports the production layer weights, positive-adjustment caps, multiplier cap, runtime layer scores/multiplier where available and the retained legacy comparison.

## Early Warning classification

Each Early Warning signal exports both its internal class and the normalized Phase-17 class:

- `LEADING` → `leading`
- `EARLY_CONFIRMATION` → `confirmation`
- `LATE_CONFIRMATION` → `confirmation`
- `CURRENT_STRESS` → `current stress`
- `STRUCTURAL` → `structural`

Provider, observation date, frequency, freshness, confidence, layer role and current score are preserved per signal.

## Correlation methodology disclosure

Methodology V2 states explicitly:

- returns are daily close-to-close log returns: `ln(P_t / P_{t-1})`;
- non-positive prices are excluded;
- descriptive correlation intersects same-calendar-date returns;
- ASIA_PACIFIC ↔ AMERICAS systemic alignment uses the latest distinct Americas close strictly before the Asian observation date (`Asia_t ↔ Americas_t-1`);
- future-date pairing is forbidden;
- descriptive selected window is exported at runtime;
- diagnostic windows are 20/60/120 days;
- production systemic window is 60 days;
- Pearson correlation requires at least 10 aligned pairs;
- only lag-aware systemic correlation feeds the GA2 contagion path.

## Export surfaces

The standalone Methodology action now saves:

`MarketRiskMonitor_Methodology_V2_v3.5.1.67_<timestamp>.md`

The Current Data ZIP additionally includes:

- `methodology_v2.json`
- `methodology_v2.md`

The standard audit snapshot embeds the same structured Methodology V2 object under `methodologyV2`.

The Markdown V2 export carries forward the detailed pre-existing methodology, transform registry, Phase-14 historical-validation methodology and Phase-15 GA2 architecture as appendices. No earlier audit detail is discarded.

## Missing-data semantics

A Phase-17-only audit helper correction ensures null/undefined/blank coverage values are excluded before numeric averaging. They are not coerced to zero. This changes only exported audit averages and does not change any risk calculation.

## Methodology invariants

The following production/model functions are byte-identical to the v3.5.1.66 baseline:

- `riskBand()`
- `weightedScore()`
- `globalRiskModel()`
- `globalFactorArchitectureV53()`
- `globalContagion()`
- `buildMacroCycle()`
- `fiscalScoreRowsV43()`
- `commodityShockRisk()`
- `aggregateEquityInternalsV57()`
- `lagAwareCorrMatrixV58()`
- `stabilizedBandV63()`
- all Phase-15 GA2 scoring functions
- Phase-16 deterministic UI/explanation data functions

Raw `fetch()` call-site count remains **6 → 6**.

## Validation

Dedicated Phase-17 Methodology V2 checks: **143/143 PASS**.

Full release regression: **1113/1113 PASS**.

The full suite covers all protected Phase 1–16 methodology, parsers, freshness semantics, source resilience, fiscal/commodity/global macro behavior, lag-aware correlation, historical-validation tooling, native export bridge and Phase-16 explanation compatibility.

## Runtime/build note

As in the preceding releases built in this execution environment, the installable APK uses the deterministic standalone WebView fallback runtime because a normal Android SDK/Gradle/D8 toolchain is not available. The verified `index.html` contains JavaScript byte-identical to canonical `app.js`. Full native Java source remains included in the source package.
