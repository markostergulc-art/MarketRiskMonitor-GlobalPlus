# Market Detail implementation v3.10

## Phase 1 inventory
- 36 core markets are authoritative in `MARKET_CONFIG`.
- GDP growth, CPI inflation and unemployment are already fetched for all 36 core markets in `buildCountries()` and feed the existing country macro score for most markets.
- The existing `openMarket()` modal already displays those three values but deeper context is uneven across countries.
- Context-only data must therefore be lazy-loaded without removing any input used by the current risk model.
- No separate market-level Evidence navigation is required; market click opens details directly.

## Phase 2 contract
- Added `market_details_v310.js`.
- Runtime contracts are generated from the authoritative `MARKET_CONFIG`; no duplicate hard-coded market universe.
- Core model metrics and context-only metrics carry provider, series ID, unit, frequency, scope, observation/retrieval time, model-use flag and freshness/status metadata.
- Existing GDP/inflation/unemployment values are reused from `appState.countries[].macroData` and are not fetched twice merely to render details.

## Phase 3 GDP
- Every one of the 36 core markets receives a GDP-growth contract (`NY.GDP.MKTP.KD.ZG`).
- Existing `macroData.gdp` is authoritative when already loaded by the country-risk engine.
- On market open, a GDP request may be retried only when the core value is missing; this does not introduce a second parallel GDP source.
- Automated coverage check: 36/36 GDP contracts PASS.

## Phase 3 GDP
- Every one of the 36 core markets receives a GDP-growth contract (`NY.GDP.MKTP.KD.ZG`).
- Existing `macroData.gdp` is authoritative when already loaded by the country-risk engine.
- On market open, a GDP request may be retried only when the core value is missing; this does not introduce a second parallel GDP source.
- Phase test: 36/36 GDP contracts PASS.
- Self-check caught and fixed a module-scope issue: the module now reads the authoritative universe through `activeMarketConfig()` instead of assuming a top-level `const MARKET_CONFIG` is a `window` property.

## Phase 4 Inflation
- 36/36 core markets have an inflation contract (`FP.CPI.TOTL.ZG`).
- Existing core `macroData.inf` is reused; no duplicate fetch is performed for rendering.
- If the core inflation value is missing, opening that market can retry only that metric.
- Phase test: 36/36 GDP + inflation contracts PASS.

## Phase 5 Unemployment
- 36/36 core markets have an unemployment contract (`SL.UEM.TOTL.ZS`).
- Existing core `macroData.un` is reused; retry-on-open is available only if the value is missing.
- Phase test: 36/36 GDP + inflation + unemployment contracts PASS.

## Phase 6 Lazy loading and cache
- Added per-market on-demand loader. No detail request is started until `activate(code)` is called.
- Core GDP/inflation/unemployment are reused; only missing core values are retried.
- Context-only nominal GDP is fetched on market open and cached per country.
- Cached context is immediately available with CACHED/STALE state while refresh proceeds.
- Request identity isolates market switches: a late Germany response can be cached for Germany but cannot update an active Croatia view.
- Test verifies unopened countries receive zero context requests.

## Phase 7 Universal Market Details UI
- Existing `openMarket()` remains the single country-detail route; no parallel market screen was created.
- Added one common detail section for every core market, with explicit `USED IN RISK / HEALTH MODEL` vs `CONTEXT` grouping.
- US and Germany World Bank GDP/CPI/unemployment are correctly labeled context-only because their country macro scores use separate validated FRED/Germany logic.
- Existing market metrics table is expanded for all markets to 1D, 1M, 3M, YTD, 1Y, drawdown, 200DMA distance and RV20.
- No market-level Evidence button/navigation is added. Internal provenance remains available to audit/export architecture.

## Phase 8 Additional sustainable context
- Added context-only Nominal GDP (`NY.GDP.MKTP.CD`), GDP per capita (`NY.GDP.PCAP.CD`) and Trade (% of GDP) (`NE.TRD.GNFS.ZS`).
- All are World Bank WDI series, annual, explicitly labeled context-only and fetched only on market open.
- No attempt was made to fabricate a universal policy-rate/10Y/PMI feed where a validated cross-country source mapping is not yet present.
- Existing market-price, FX and risk-engine data continue to be reused rather than refetched.

## Phase 9 Performance and error isolation
- Fresh per-country context cache now suppresses duplicate provider requests until its frequency-aware cache window expires.
- Each metric is handled through `Promise.allSettled`; one unavailable metric produces PARTIAL/N/A and does not block the rest of the market detail.
- Main refresh contains no call to the market-detail loader; detail requests begin only from `openMarket()`.
- Active-market request identity prevents cross-market UI contamination while still allowing late results to populate the correct market cache.
- Performance regression test PASS.
