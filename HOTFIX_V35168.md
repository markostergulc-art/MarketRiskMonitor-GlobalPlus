# Market Risk Monitor Global+ v3.5.1.68 — targeted hotfix

Scope is intentionally limited to:

1. restoring the missing `countryScoreTracesV56()` export function;
2. adding a CN/PH-only Yahoo primary-history recovery path when the normal 3-year chart request is unusable;
3. release/version metadata.

## Export fix

`scoreAuditSnapshotV56()` still called `countryScoreTracesV56()`, but the function definition was absent from the v3.5.1.67 runtime. The proven v3.5.1.59 implementation was restored unchanged.

## China / Philippines loading recovery

Primary symbols remain unchanged:

- China / CSI 300: `000300.SS`
- Philippines / PSEi: `PSEI.PS`

The normal request remains Yahoo `3y`. Only if that request fails for one of these two symbols, the application retries the same Yahoo symbol with `2y`, then `1y`. This keeps enough history for the existing `marketMetrics()` calculations while avoiding ETF/proxy/index substitution. All other market symbols retain the pre-v3.5.1.68 `yahoo(symbol, '3y')` path unchanged. FX logic is unchanged.

No scoring formulas, weights, thresholds, UI, progress behavior, cache implementation, navigation, commodities, macro, fiscal, correlations, ETFs, dividends, or other modules were changed.
