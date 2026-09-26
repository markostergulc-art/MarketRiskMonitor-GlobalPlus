# Hardcoded Runtime Results Audit — Market Risk Monitor Global+ 3.6.1 build 111

## Objective

Audit the production runtime so displayed market/economic results come from dynamically loaded provider data or a previously stored provider-backed cache. If neither is available, the runtime must return `N/A`; it must not substitute a current-looking number embedded in source code.

## Scope

Reviewed production paths:

- `app.js`
- `app/src/main/assets/index.html`
- `app/src/main/java/com/marko/marketrisk/globalplus/*.java`
- Android manifest/build configuration
- provider/cache/fallback paths
- Commodities / EIA / DOE SPR / World Gold Council
- Fiscal / IMF metadata
- Capital Rotation Top-10 ranking
- Bonds, Volatility, T212 and market/stock/ETF render paths

Test/documentation fixtures and historical baseline source files are not production observations and are intentionally excluded from the runtime rule.

## Findings corrected

1. **EIA commodity observations** — removed embedded crude/SPR/gasoline/distillate/days-supply current-looking fallback observations. Provider failure now resolves through provider-backed cache where available, otherwise `N/A`.
2. **DOE SPR** — removed embedded inventory/capacity observation fallbacks and fixed-number row matching. Inventory/capacity are parsed from the dynamically retrieved source.
3. **World Gold Council** — removed month/quarter-specific current-result URLs/data assumptions. Discovery now uses rolling/landing pages and dynamic retrieval.
4. **IMF fiscal metadata** — removed a fixed `WEO-2026-04` current-vintage label; metadata no longer claims a hardcoded current vintage.
5. **Capital Rotation Top-10** — removed static result/ranking restoration when market-cap retrieval is missing. Ranking is recalculated from dynamically retrieved market caps; cross-currency market caps use current FX retrieval. Missing values remain unavailable instead of being replaced by a static order.
6. **S&P descriptive count** — display now derives the configured instrument count dynamically instead of embedding a literal count.

## Runtime policy after remediation

`LIVE PROVIDER -> PROVIDER-BACKED CACHE -> N/A`

No production path audited here intentionally uses:

`PROVIDER FAILURE -> EMBEDDED MARKET OBSERVATION`

## Static values that remain by design

The following are configuration/methodology, not market results, and therefore remain explicit in source:

- model weights and score thresholds;
- lookback windows (e.g. 20D/60D/252D);
- provider URLs and series identifiers;
- ticker/market/sector universes;
- country/sector labels and metadata;
- historical validation event-window dates;
- UI status thresholds and cache TTLs;
- API endpoint paths and application version identifiers.

These values define *how* dynamically retrieved observations are interpreted; they do not substitute for observations.

## Automated audit

`tests/no_hardcoded_runtime_results_v361_build111.py`: **43/43 PASS**.

The audit explicitly checks absence of the previously embedded EIA/DOE/WGC/IMF observations and confirms canonical `app.js` is embedded in the production runtime.
