# Regression Report — v3.5.1.47

Baseline: v3.5.1.46 / versionCode 79
Target: v3.5.1.47 / versionCode 80

## Allowed functional changes

1. Current-state audit export and methodology export under Settings.
2. Croatia is always part of the configured Markets universe.
3. Bosnia and Herzegovina is removed from the active market/fiscal universe.
4. Release/version metadata.

## Protected calculations

The v47 regression suite hashes protected functions against the authoritative v46 source. Byte-identical checks pass for Global Risk, Global Contagion, market/trend risk, Correlation, Macro, S&P/company risk, commodity/AGSI calculations/parsers, Fiscal Stress score/freshness/current-reference functions, P0/P1/P2/P3 loading scheduler, loading status/progress and Markets sparkline rendering/period logic.

The market-universe constructor/configuration is the intentional exception.

## Loading / charts / network

- P0/P1/P2/P3 scheduler logic unchanged.
- Queue ordering, promotion, deduplication, concurrency, retry/backoff and provider limits unchanged.
- v45 loading progress observer unchanged.
- v45 generic chart-period labels unchanged.
- v46 Markets-card sparkline-period logic unchanged.
- Current data export additional network requests: **0**.
- Methodology export additional network requests: **0**.

## Market-health compatibility

The v47 market-health regression retains the same aggregation/eligibility tests but replaces the obsolete assertion that Bosnia must exist as a limited SASE market with the new authoritative rule: Croatia remains configured and Bosnia is absent. The full adapted suite passes.
