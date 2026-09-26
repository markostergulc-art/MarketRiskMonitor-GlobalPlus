# Market Risk Monitor Global+ v3.5.1.41 — Implementation Summary

Baseline: v3.5.1.40

## Objective

Add a storage-coverage indicator to the existing EU gas country cards without changing any other application behavior.

## Implementation

The existing AGSI country request already returns the official optional country fields `consumption` and `consumptionFull`. v3.5.1.41 parses those fields inside `parseAgsiCountryCurrentV40()` and displays them inside the existing `euGasCountryCardV40()`.

Displayed line when data exists:

`Previous-year demand: <TWh> · Storage coverage: <%> (~<days> days avg.)`

Croatian:

`Prošlogodišnja potrošnja: <TWh> · Pokriće zalihama: <%> (~<dani> dana prosj.)`

The displayed days value is calculated as:

`365 × consumptionFull / 100`

It is explicitly described as an annual-average-rate equivalent, not a winter-autonomy forecast.

## Data semantics

- `consumption`: official AGSI country consumption reference, defined by GIE as the country's previous-year gas consumption and updated annually.
- `consumptionFull`: current gas in storage divided by that consumption reference.
- If `consumptionFull` is absent, the app computes it only when both `gasInStorage` and positive `consumption` are valid.
- Missing consumption remains missing and is never converted to zero.

## Deliberate non-changes

- No new provider.
- No new network request.
- No new cache.
- No new progress bar.
- No new sorting mode.
- No native Android change.
- No risk-model integration.
- No changes to EU headline, facility list, other commodities, financial calculations or navigation.

## Source-level changes

Only three existing country functions changed in `app.js`:

1. `parseAgsiCountryCurrentV40()`
2. `euGasCountryCardV40()`
3. `euGasCountriesHtmlV40()` — explanatory text only

Release metadata changed to v3.5.1.41 / versionCode 74.
