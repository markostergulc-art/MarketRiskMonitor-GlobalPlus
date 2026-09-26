# Capital Rotation Freshness Audit — v3.6.4 / BUILD114

Date: 2026-09-19
Scope: **Capital Rotation freshness only**. No redesign or scoring-model change was authorized.

## Executive result

The stale-data concern was valid. BUILD113 had three independent freshness weaknesses:

1. **Manual Capital Rotation refresh did not propagate a forced-network flag to the Yahoo request.** `ensureCapitalRotationV70(true)` rebuilt the module, but `capitalRotationLoadAssetV70()` still called the generic Yahoo loader without `force`; the generic market cache is 15 minutes.
2. **The module-level Capital Rotation cache could be rendered for up to 30 minutes without background source validation.** It was fast, but cache-first could become cache-only for that interval.
3. **Retrieval time could look newer than the underlying cached payload.** The Yahoo wrapper created a new `retrievedAt` after a cached fetch. This could make a cache result appear newly retrieved even when the market observation was older.

Additional data-quality issues were found and corrected:

- multi-symbol groups could combine components with different latest observation dates;
- rolling 5D/20D/3M calculations were inherited from generic market metrics rather than explicitly anchored to completed trading observations for this module;
- the summary used the newest component date, which could conceal an older required component;
- native proxy fallback cache after an upstream/network failure was not distinguishable from a normal fresh native-cache hit in Capital Rotation diagnostics.

## Corrected data path

`Yahoo / upstream source`
→ `Android native proxy or WebView fetch`
→ `HTTP cache diagnostics`
→ `completed-session filter`
→ `multi-symbol common-date alignment`
→ `trading-observation windows`
→ `Capital Rotation scoring`
→ `LIVE / CACHED / STALE / PARTIAL / ERROR UI state`

## Cache behavior

### Before BUILD114

- Yahoo market cache TTL: 15 minutes.
- Capital Rotation module cache TTL: 30 minutes.
- Opening Capital Rotation could return the module cache and stop there.
- Manual module refresh did not guarantee bypass of the Yahoo/native market cache.
- Stale native fallback and ordinary native cache were not differentiated for the module.

### BUILD114

- Existing cache is still rendered immediately for responsive UI.
- A module cache older than **5 minutes**, from a different expected session, or containing STALE/PARTIAL/ERROR data triggers background network validation.
- Manual `REFRESH CROSS-ASSET DATA` forces the Yahoo request through the generic fetch layer and passes `fresh=1` to the Android native proxy.
- Native `upstream-error` / `bridge-exception` fallback is tagged `STALE_NATIVE_CACHE` instead of masquerading as a normal native cache hit.
- Valid cached data are retained if a refresh fails; they are not replaced by zeros or blank data.

## Observation date vs retrieval date

BUILD114 preserves these separately:

- **observation date**: the trading date of the market data used by the calculation;
- **retrieved timestamp**: when the payload was actually obtained or the cache entry was written;
- **calculation timestamp**: when the Capital Rotation projection was recalculated.

The UI no longer treats a new render/download time as evidence that the underlying market observation is new.

## Latest completed trading session

Capital Rotation uses one canonical expected-session function for its U.S.-listed proxy universe. It handles:

- weekdays;
- weekends;
- standard NYSE holidays;
- pre-close vs post-close behavior in `America/New_York`;
- Good Friday;
- Juneteenth from 2022 onward.

For Saturday **2026-09-19**, the expected latest completed U.S. session is **2026-09-18**.

This is appropriate for the current Capital Rotation universe because its equity, bond, commodity and regional exposures are primarily represented by U.S.-listed ETFs plus Yahoo daily FX/index proxies.

## Trading-window semantics

The following windows are now explicitly based on completed observations:

- 5D = 5 completed observations;
- 20D / 1M = 20 completed observations;
- 63D / 3M = 63 completed observations;
- 252D / 1Y = 252 completed observations when sufficient history exists.

The module does not create artificial zero returns for missing dates.

## Multi-symbol alignment

Composite groups such as Defensive Equities (`XLU`, `XLP`, `XLV`) and Cyclicals (`XLY`, `XLI`) are now calculated using the **latest common valid observation date** across the required series.

A component that is behind the expected session makes the composite STALE/PARTIAL as appropriate instead of being silently averaged with a newer component.

## Freshness states

- `LIVE` — latest expected completed observation, directly network validated.
- `CACHED` — latest expected completed observation is present, but supplied from a valid cache.
- `STALE` — newest usable observation is older than the expected completed session.
- `PARTIAL` — required inputs do not have uniform availability/freshness.
- `ERROR` — no usable current or cached data.

`Data through` is conservative: for a multi-asset Capital Rotation snapshot it uses the **oldest required component date**, while `marketLatest` is retained separately for diagnostics.

## Provider / symbol matrix

Primary price-history provider for the Capital Rotation projection is Yahoo Finance chart data through the existing application proxy architecture.

| Exposure | Runtime proxy/proxies |
|---|---|
| USD / cash | DX-Y.NYB |
| Short Treasuries | SHY |
| Long Treasuries | TLT |
| Gold | GLD |
| CHF | CHF=X |
| JPY | JPY=X |
| Defensive equities | XLU, XLP, XLV |
| Technology / Growth | QQQ |
| Cyclicals | XLY, XLI |
| Small Caps | IWM |
| Emerging Markets | EEM |
| Investment Grade | LQD |
| High Yield | HYG |
| Energy equities | XLE |
| Industrial metals | CPER |
| Agriculture | DBA |
| United States | SPY |
| Europe | VGK |
| Japan | EWJ |

No runtime proxy in this matrix was replaced by a hardcoded price or static rotation result.

## Independent market-date spot check — 2026-09-19

External market-history spot checks confirmed that **2026-09-18** was the latest completed U.S. trading session at audit time. Representative 5-session checks (Sep 18 close versus Sep 11 close) were also used to validate the intended window semantics:

| Proxy | Sep 18 close | Sep 11 close | 5-session return |
|---|---:|---:|---:|
| SPY | 761.69 | 764.29 | -0.340% |
| QQQ | 721.45 | 714.88 | +0.919% |
| XLE | 64.31 | 65.14 | -1.274% |
| TLT | 81.25 | 80.87 | +0.470% |
| XLY | 111.03 | 112.96 | -1.709% |
| XLU | 41.10 | 42.39 | -3.043% |
| XLV | 168.39 | 165.36 | +1.832% |
| XLP | 82.82 | 83.38 | -0.672% |
| XLI | 169.75 | 172.37 | -1.520% |

XLF and XLK were also checked externally as sector-control instruments even though the current runtime Capital Rotation model does not use them directly.

These values are **QA observations only** and are not embedded in application runtime code.

## Terminology

The module continues to describe its output as a **projection / relative rotation bias**, not literal measured fund flows. No actual fund-flow dataset was added in BUILD114.

## Runtime code changed for freshness

- `app.js`
- `app/src/main/assets/index.html` (embedded canonical runtime synchronized with `app.js`)

Release/build metadata changed only where necessary:

- `app/build.gradle`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java` — user-agent version only; native proxy cache behavior itself was not redesigned
- `app/src/main/assets/excel_export_v362.js` — release identity only
- build scripts for v3.6.4 / BUILD114

## Explicit non-changes

The following protected functions/modules were byte-compared against BUILD113 and were unchanged where applicable:

- Global Risk
- Early Warning
- Macro Cycle
- Cross Asset
- score audit
- FRED loader
- Bonds
- Volatility
- ETF risk
- Dividend safety
- Commodities
- S&P 500 rendering
- My T212 Portfolio external module
- Excel exporter logic (except version metadata)

## Conclusion

BUILD114 fixes the identified stale-data pathways without altering Capital Rotation scoring weights or unrelated analytical engines. The UI now exposes the actual data-through range, expected latest completed session, retrieval time and mixed freshness status so stale input cannot silently present itself as current.
