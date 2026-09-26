# Regression Report — Market Risk Monitor Global+ v3.5.1.52

Baseline: v3.5.1.51 / 84  
Target: v3.5.1.52 / 85

## Result

**PASS**

`tests/phase4_regression_v35152.js`: **80/80 PASS**.

## Protected methodology

The regression suite directly compares protected function source text against the v3.5.1.51 baseline. GLOBAL Risk, recession/inflation mathematics, Phase-1 freshness, Phase-2 coverage, Phase-3 confidence, fiscal, commodities, equity internals, correlation, company risk, scheduler and network fetch wrapper remain unchanged unless explicitly required by Phase 4.

`globalRiskModel()` is byte-identical to v3.5.1.51 and does not consume the new `signalClass` metadata.

## Network/loading invariants

- `fetchWithTimeout()` unchanged.
- number of `fetch(` call sites unchanged.
- no new provider dependency.
- no change to refresh/cache/lazy-load architecture.
- embedded `app.js` remains byte-identical to the canonical script inside `index.html`.

## Phase 1–3 retention

- freshness semantics retained;
- Country/GLOBAL coverage gates retained;
- confidence remains independent from risk score;
- native export bridge retained;
- Croatia remains in the market universe and removed legacy Bosnia/SASE entries remain absent from active runtime configuration.
