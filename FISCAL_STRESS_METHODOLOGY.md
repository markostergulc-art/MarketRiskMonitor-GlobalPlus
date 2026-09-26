# Fiscal Structural Vulnerability Methodology — v3.5.1.60

## Scope

Phase 10 reclassifies the sovereign fiscal module as **STRUCTURAL VULNERABILITY**. It is a slow-moving diagnostic layer and remains excluded from production GLOBAL Risk pending the later historical-validation/final-architecture phases.

The legacy v43 Fiscal Stress calculation is retained for regression and audit reproducibility, but it is no longer the primary fiscal presentation.

## Government-scope comparability

Comparable structural rankings require a general-government definition:

- `GENERAL_GOVERNMENT_ESA2010` — Eurostat ESA 2010 / Maastricht scope;
- `GENERAL_GOVERNMENT_IMF_WEO` — IMF WEO general-government scope.

Central-government World Bank / IMF-GFS fallbacks may remain visible as historical/context data, but are classified as `CENTRAL_GOVERNMENT_FALLBACK` and are **not** ranked as if definitionally equivalent to general-government observations.

## Structural Vulnerability score

The primary score uses only slow-moving structural components:

| Component | Weight |
|---|---:|
| Debt / GDP | 15 |
| Debt trajectory | 15 |
| Fiscal balance | 15 |
| Primary balance | 10 |
| Interest burden | 15 |
| Structural r-g | 10 |

Available weights are normalized only after the eligibility gate. Missing values are never replaced by zero.

Eligibility requires:

1. comparable general-government scope;
2. at least four valid structural components;
3. debt stock;
4. at least one fiscal-flow metric (`balance`, `primary`, or `interest`);
5. at least one debt-dynamics metric (`debtTrend` or structural `r-g`);
6. no stale core debt/balance/interest observation used as if current.

When the gate fails, the primary structural score is `LIMITED DATA`. If no row in the module is eligible, the semantic module status is **NO ELIGIBLE CURRENT DATA**, not `READY` merely because network loading completed.

## Structural r-g

`structural r-g = implicit average effective debt cost - nominal GDP growth`

The implicit average debt cost is derived from the existing debt stock and interest burden. This is a slow structural debt-dynamics measure.

## Debt repricing gap

The former generic “refinancing gap” is now labeled more precisely:

`debt repricing gap = current 10Y market yield - implicit average effective debt cost`

It describes the difference between marginal market pricing and the average cost embedded in the existing debt stock. It is **not** the same as structural r-g.

## Marginal refinancing pressure

Target economic definition:

`current market yield - expected nominal growth`

The current fiscal source set does not contain a reliable country-level expected nominal-growth series. Therefore v3.5.1.60 does **not** fabricate one. The runtime value is explicitly marked as a proxy:

`current 10Y market yield - latest available nominal GDP growth`

The exported field `marginalRefiGrowthBasisV60` records `LATEST_AVAILABLE_NOMINAL_GDP_GROWTH_PROXY` when this proxy is used. Replacing it with a proper point-in-time forecast series is a known limitation for a later data-source/validation phase.

## Market Refinancing Pressure score

Market pressure is displayed separately from structural vulnerability:

| Component | Weight |
|---|---:|
| Market financing risk (yield / euro spread) | 50 |
| Debt repricing gap | 25 |
| Marginal refinancing pressure proxy | 25 |

A market-pressure score requires a current market yield and at least two available market-pressure components. It does not change the structural score.

## Legacy v43 diagnostic

The previous v43 Fiscal Stress score (debt, debt trend, balance, primary, interest, financing, repricing gap, r-g) is preserved internally/exported as `legacyStressScoreV43`. Its scoring function remains byte-identical to v3.5.1.59 for regression reproducibility.

## GLOBAL Risk integration

`productionGlobalRiskIntegration = false`.

Phase 10 does not insert Fiscal Structural Vulnerability into production GLOBAL Risk. The methodology plan reserves substantial final GLOBAL architecture changes until after the historical-validation framework.
