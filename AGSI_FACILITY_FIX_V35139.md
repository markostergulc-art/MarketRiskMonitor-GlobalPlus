# AGSI Facility Listing Fix — Market Risk Monitor Global+ v3.5.1.39

Date: 2026-09-13

## Physical-device symptom

v3.5.1.38 successfully loaded the EU AGSI aggregate but the **Largest EU Gas Storage** block failed with:

`No EU AGSI facility datasets found in listing`

This isolated the failure to the AGSI facility-listing parser. The user API key and the EU aggregate endpoint were already working.

## Root cause

The v3.5.1.38 parser deliberately skipped every object property named `data`. That is unsafe because AGSI listing responses may be wrapped by a top-level payload object while older AGSI representations can also use `data` inside the hierarchy.

The official GIE AGSI API documentation defines `/api/about?show=listing` as the EIC listing endpoint and documents operators with an underlying `facilities[]` array. Each facility includes fields such as `name`, `type`, `eic`, `country`, `company`, and `url`.

## Fix

The v3.5.1.39 parser now supports:

- the current documented direct-array listing;
- a top-level `data` array wrapper;
- a top-level `result` array wrapper;
- a top-level `items` / `listing` array wrapper;
- the older hierarchical AGSI listing structure;
- country values represented either as two-letter strings or `{code,name}` objects.

`data` is no longer blindly skipped during recursive traversal.

The parser prefers the official facility `url` supplied by GIE when it is an HTTPS `agsi.gie.eu` URL. Otherwise it reconstructs the documented country/company/facility query.

## Resilience

A failure of one facility endpoint no longer aborts the whole list. Current facility requests are isolated and successful facilities remain available. Concurrency was reduced from 6 to 4.

If parsing still produces zero facilities, the user-facing error now contains safe structural diagnostics such as listing shape, operator count, facility-node count, and top-level keys. No API key is exposed.

## Scope

Only these AGSI facility functions changed:

- `parseAgsiFacilityListingV37()`
- `buildAgsiFacilitiesV37()`

EU AGSI aggregate methodology, API-key handling, US Oil, US Gas, Gold, Silver, GLOBAL Risk, Early Warning, Macro, Correlation Regime, S&P, ETF and dividends were not modified.

## Runtime safety

The APK reuses the exact stable `classes.dex` from v3.5.1.38 / v3.5.1.37 recovery lineage. No native Android code was introduced.
