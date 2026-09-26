# Market Risk Monitor Global+ v3.5.1.40 — Implementation Summary

## Baseline

Authoritative baseline: **v3.5.1.39**.

## Scope

The release adds country-level EU underground-gas storage to **Commodities → Overview** without changing the existing risk model or native runtime architecture.

## Implementation

A new isolated state object, `commodityV40.euGasCountries`, manages country-level status, data, errors, promise reuse, load timestamp and diagnostics.

Country discovery reuses the official AGSI EIC listing already used by the v3.5.1.39 facility implementation. Unique country codes are filtered through the existing EU-27 allowlist, then each discovered country is queried with the documented AGSI country endpoint (`/api?country=XX`). Country requests reuse `agsiApiJsonV33()` and therefore retain the established AGSI API-key and 6-hour cache architecture.

Country calls are bounded with `mapLimit(..., 4, ...)`. A failed country is isolated and recorded in diagnostics; successfully returned countries still render.

The country parser keeps the real AGSI gas-day date, prefers confirmed rows when duplicate observations exist, preserves official `full` when supplied, and calculates fill only when official `full` is absent and valid stock/WGV are available.

Progress bars are rendered only when stock, WGV and fill are all valid. The existing `renderThinProgressV38(fill, 'storage')` handles visual clamping and `DATA ANOMALY` for values outside 0–100 without altering the displayed raw value.

## UI

The new section appears immediately below the U.S. SPR / U.S. Gas / EU Gas overview cards. Mobile layout is one country card per row; larger viewports expand to two or three columns. Existing card variables, typography, theme variables and thin-progress styling are reused.

## Runtime preservation

The protected financial/risk functions are byte-identical to v3.5.1.39. Existing EU aggregate AGSI functions, facility functions and the shared progress renderer are also byte-identical. `MainActivity.java`, `AgsiKeyStore.java` and the source Android manifest are unchanged.

The delivered standalone APK reuses the exact v3.5.1.39 `classes.dex` and `resources.arsc`, changing only the WebView asset and release manifest version metadata. It is signed with the same persistent release certificate as v3.5.1.39.

## Live acceptance limitation

An authenticated live GIE country run was not executed in the build environment because the user's personal AGSI API key is deliberately not available there. The deterministic parser/discovery fixtures pass, while live country counts, WGV totals and reconciliation should be confirmed on-device with the user's configured AGSI key.

- Country aggregate fill/reconciliation uses pairwise-complete observations (valid stock + WGV), so missing WGV is never silently treated as zero.
