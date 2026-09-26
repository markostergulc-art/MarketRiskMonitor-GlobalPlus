# PROVIDERS v3.5.1_09

Primary macro/cycle detector series use official data redistributed through FRED where practical: BLS, BEA, Federal Reserve, OECD, Cleveland Fed and Atlanta Fed series. Market indexes use the configured public market-data path with provider fallback; Croatia uses ZSE paths where available and Bosnia remains LIMITED when a dependable public time series cannot be retrieved.

No unavailable series is replaced with a synthetic current value.


Commodity providers: EIA weekly petroleum stocks and days-of-supply; U.S. Department of Energy SPR capacity/Quick Facts; World Gold Council central-bank gold statistics and quarterly Gold Demand Trends. Yahoo Finance remains the public best-effort history source for WTI/Brent/gold/silver/copper/natural-gas prices. Cboe commodity volatility and CFTC positioning are reused from the already-loaded cross-asset layer where available.


## v3.5.1_19
- **GIE AGSI+**: EU natural-gas storage and working capacity. Requires a personal `x-key`; entered by the user and kept only in session memory/sessionStorage.
- **Eurostat**: `nrg_stk_oilm` monthly emergency/commercial oil stock levels by EU country.
- **U.S. EIA**: weekly SPR, commercial crude excluding SPR and total crude including SPR histories.
- Existing **Yahoo Finance** price history is reused for Gold and Silver charts; no extra startup request is added.

## v3.5.1.62 — Source Resilience classification

Every known provider is classified internally as one of:

- `PRIMARY_OFFICIAL`
- `PRIMARY_MARKET`
- `INSTITUTIONAL`
- `SECONDARY`
- `UNOFFICIAL_FALLBACK`

Critical macro, fiscal, rates and physical-energy indicators prefer official/institutional endpoints where an implemented source exists. Yahoo Finance remains a `PRIMARY_MARKET` source for traded-price history and is not treated as an official macro/fiscal source.

Explicit fallback chains include:

- implied volatility: Cboe → Yahoo Finance;
- Yahoo transport: query1 → query2 → stale cache;
- FAO food prices: official CSV → official HTML → stale cache;
- official macro/physical series: official/institutional implemented source → stale cache; missing data are never fabricated.

Transport failures are classified as `TIMEOUT`, `HTTP_429`, `HTTP_5XX`, `HTTP_4XX`, `MALFORMED_JSON`, `EMPTY_RESPONSE`, `NETWORK` or `UNKNOWN`. Transient failures use bounded retry/backoff. Malformed/empty payloads are rejected before cache write.
