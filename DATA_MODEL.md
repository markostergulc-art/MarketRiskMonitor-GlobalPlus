# DATA MODEL v3.5.1_09

Each fetched observation/derived indicator may include: market, indicator id/name, value, unit, observation date, provider/source URL, retrieval time, freshness, confidence, score, regime/status, percentile/z-score when available and explanatory metadata.

`macroCycle` stores separate `inflation` and `recession` detector objects plus the combined regime. Each detector exposes score, data coverage, confidence, components, rows and weights.

## Company summary schema v2

Compact company records contain: symbol, company name, exchange, currency, latest value/date, 1D/1M/3M/YTD/1Y momentum, distance to 50DMA and 200DMA, 52-week drawdown, RV20, core risk and component scores. These summaries use the existing bounded `companySummaryV35106` cache so upgrades do not create another large storage namespace.

## Stock detail model

The 5-year daily stock series, RV60, 5-year maximum drawdown and chart data are memory-only. At most 12 detailed stocks are retained during one app session. They are not written to the main snapshot or localStorage.

Main snapshot/history continue to use the v3.5.1_06 storage schema/key family to avoid duplicating historical local data; migration and cleanup logic remains backward compatible.


## Commodity intelligence model

The in-session commodity pack contains market series/metrics, EIA current/previous weekly petroleum observations, DOE SPR authorized capacity, WGC central-bank demand fields, Gold/Silver and Copper/Gold relative signals, diagnostic risk parts, scenario/regime, coverage and confidence. Each official petroleum field carries `live`, `stale` and source-date metadata. Fallback values are bounded by explicit freshness windows and are never interpreted as live after expiration. The pack is memory-only and is not added to the main snapshot.
