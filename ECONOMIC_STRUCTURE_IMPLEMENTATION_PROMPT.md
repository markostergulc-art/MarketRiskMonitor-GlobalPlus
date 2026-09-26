# IMPLEMENTATION PROMPT — MARKET ECONOMIC STRUCTURE

## ROLE

Act as a senior Android/WebView architect, JavaScript engineer, international-trade data engineer, mineral-statistics engineer, agriculture-data engineer, tourism-data engineer and QA validator.

Modify the latest authoritative source of **Market Risk Monitor Global+**.

Baseline expected from the research phase:

- `versionName 2026.09.26.1`
- `versionCode 124`
- 36 core markets in `MARKET_CONFIG`
- 50 extended countries in `EXTENDED_COUNTRY_CONFIG`

Verify the actual source before changing anything.

---

# 1. STRICT SCOPE

Implement only:

**Market Details → Economic Structure / Gospodarska struktura**

Do not change:

- GA2
- Global Risk
- country-risk formulas
- Market Health formulas
- risk bands
- correlation methodology
- Shortage
- Capital Rotation
- Bonds
- T212
- alerts
- GDP/CPI/UNEMP market-card priority
- existing navigation

All new Economic Structure data are **CONTEXT ONLY**.

No new value may enter any risk score in this release.

---

# 2. SOURCE RESEARCH IS AUTHORITATIVE

Use `ECONOMIC_STRUCTURE_SOURCE_RESEARCH.md` as the implementation source decision.

Implement only domains marked IMPLEMENT or PARTIAL under their stated constraints.

Do not replace a rejected/deferred provider with an unvalidated scraper.

---

# 3. NEW MODULE

Create:

`app/src/main/assets/economic_structure_v125.js`

Load it from the existing WebView HTML after the shared provider/utilities and before market-detail rendering that consumes it.

The module must not execute network requests at script load.

Expose one namespace, for example:

`window.MRMEconomicStructure`

Do not scatter provider logic through `app.js`.

---

# 4. COMMON CONTRACT

Create a provider-neutral country contract.

Suggested structure:

```javascript
{
  countryCode,
  iso3,
  status,
  broadStructure: {
    agriculturePctGdp,
    industryPctGdp,
    manufacturingPctGdp,
    servicesPctGdp
  },
  trade: {
    topExports: [],
    exportDestinations: [],
    topImports: [],
    totalExports,
    totalImports
  },
  minerals: {
    production: [],
    facilities: [],
    reserves: [],
    classifications: []
  },
  agriculture: {
    rankingBasis: 'PRODUCTION_QUANTITY',
    products: []
  },
  tourism: {
    arrivals,
    receipts,
    share
  }
}
```

Every numerical observation must preserve:

```text
provider
dataset
series / code
value
unit
period
retrievedAt
sourceUrl
status
```

---

# 5. BROAD ECONOMIC STRUCTURE — WORLD BANK

Implement these WDI indicators:

- `NV.AGR.TOTL.ZS`
- `NV.IND.TOTL.ZS`
- `NV.IND.MANF.ZS`
- `NV.SRV.TOTL.ZS`

Reuse existing World Bank helpers where safe.

Do not duplicate an existing current observation if it already exists in app state/cache.

Display as a broad structure, not as a risk model.

Example:

```text
ECONOMY BY VALUE ADDED
Services             63.1% GDP
Industry             27.4% GDP
Manufacturing        18.8% GDP
Agriculture            0.9% GDP
2025 · World Bank
```

Do not force the four shares to sum to exactly 100 because national-account definitions/rounding may differ.

---

# 6. UN COMTRADE ADAPTER

## Mandatory source

Use the validated UN Comtrade public API.

Do not scrape trade websites.

Before production parsing, create fixtures from real responses.

## Country mapping

Do not hardcode values.

Create a configuration mapping ISO3 / app country code to official Comtrade reporter code.

This mapping is configuration, not observation data.

## Trade periods

Prefer the latest completed annual period that passes validation.

If current year data are incomplete or unavailable, use the latest completed annual dataset and show that year explicitly.

## Aggregation filtering

This is mandatory.

The validated API response contains dimensions that can create duplicate-looking values for the same HS code.

Filter to the provider's total dimensions, including where applicable:

- TOTAL CPC / `customsCode=C00`
- TOTAL mode of transport / `motCode=0`
- total partner2
- exact requested flow
- exact requested reporter
- exact requested period
- correct aggregation level

Do not sum transport-mode or customs subrows into totals.

Create a fixture that would fail if duplicate aggregation rows are summed.

---

# 7. TOP EXPORT PRODUCTS

Use HS2 for main UI.

For every validated country:

1. obtain total annual merchandise exports;
2. obtain HS2 product export values;
3. remove invalid/aggregate/non-product rows;
4. rank descending by actual export value;
5. return Top 5 by default, Top 10 if expanded.

Calculate:

`sharePct = productExportValue / totalMerchandiseExports * 100`

Store:

- HS code
- HS classification revision/code
- label from provider
- export value
- total export value
- share
- year

If total exports are missing, show absolute values only and do not fabricate shares.

---

# 8. EXPORT DESTINATIONS

Use total merchandise exports by partner country.

Calculate:

`partnerSharePct = partnerExportValue / totalMerchandiseExports * 100`

Exclude:

- World total
- unspecified/aggregate regions when identifying country destinations
- invalid partner records

Return Top 5 by default.

---

# 9. IMPORT PRODUCTS

Use the same HS2 methodology for imports.

Return Top 5 categories.

Do not calculate import-dependency risk scores in this release.

---

# 10. TRADE CACHE

Cache per country/domain.

Example:

`economicStructure:v1:DE:trade`

Annual trade cache TTL should be long, approximately 30–60 days.

Cache must preserve:

- observation year
- provider retrieval time
- classification
- raw normalization metadata

Reading cache must not reset `retrievedAt`.

Fresh cache → no network request.

Stale cache → render stale cache immediately, then attempt refresh.

---

# 11. MINERALS — USGS

Use official USGS machine-readable annual datasets.

Primary:

- 2024 Minerals Yearbook international data release, DOI `10.5066/P1KEQASH`

Supplementary where required:

- Mineral Commodity Summaries 2026 data release, DOI `10.5066/P1WKQ63T`

Before coding the parser:

1. resolve the exact stable CSV download URLs from the current USGS data-release metadata;
2. download actual files;
3. inspect headers;
4. save minimal test fixtures;
5. document units and country/commodity identifiers.

Do not code a parser against guessed CSV columns.

---

# 12. MINERAL DATA MODEL

Separate:

```text
mineProduction
processing/refining/facility
reserves
resources
exports
imports
```

Never merge them into one generic mineral number.

A country that exports a mineral is not automatically a producer.

A facility does not prove domestic mine production.

A reserve does not prove current production.

---

# 13. CRITICAL MINERALS

Criticality is classification metadata only.

Store:

```text
classificationAuthority
classificationVersion
classificationName
```

Allow multiple classifications if appropriate.

Example:

- EU Critical Raw Materials list
- U.S./USGS critical minerals list

UI must display the authority.

Do not create a risk score from classification membership.

---

# 14. RARE EARTHS

Rare earths are a specific mineral group and must not be synonymous with critical minerals.

Only display rare-earth information if actual USGS country observations exist for production/reserves/facilities.

Otherwise show N/A.

---

# 15. AGRICULTURE — FAOSTAT

Do not use the legacy `fenixservices.fao.org/faostat/api/v1` endpoint. It failed validation during research.

Use the current FAO Data Catalog/API infrastructure under:

- `data.fao.org`
- `api.data.apps.fao.org`

Before production implementation:

1. resolve an actual query for one known country;
2. save the real response fixture;
3. inspect the schema;
4. confirm item codes, area codes, flags and units;
5. only then write the parser.

Source domain:

Crops and livestock products / QCL.

---

# 16. AGRICULTURE RANKING

First release ranking basis:

**PRODUCTION QUANTITY**

Use only comparable production rows in tonnes.

Do not rank together incompatible units.

Return Top 5 products.

Display:

```text
product
production quantity
unit
period
FAO observation flag if available
```

Do not implement a subjective importance score.

Agricultural merchandise exports should remain represented through UN Comtrade in this release.

---

# 17. TOURISM

Tourism is PARTIAL in the first release.

World Bank machine-readable indicators may be used where valid:

- `ST.INT.ARVL`
- `ST.INT.RCPT.CD`
- related tourism-share indicators only after exact indicator validation

For each metric:

1. request several recent annual observations;
2. choose the latest non-null observation;
3. keep the actual observation year;
4. apply annual freshness semantics;
5. show N/A if no usable recent observation exists.

Do not treat endpoint HTTP success as data availability.

The validated Croatia arrivals response returned recent null values; tests must cover this exact semantic case.

Do not scrape the UN Tourism dashboard in the production app.

---

# 18. ECONOMIC STRUCTURE UI

Add one new section inside the existing detailed market modal:

`GOSPODARSKA STRUKTURA / ECONOMIC STRUCTURE`

Do not alter the market-card list.

Recommended order:

1. Economic composition
2. Top export products
3. Top export destinations
4. Top import products
5. Minerals & critical materials
6. Agriculture
7. Tourism

Use collapsible sections so the market detail does not become excessively long.

Default expanded:

- Economic composition
- Top exports

Default collapsed:

- Export destinations
- Imports
- Minerals
- Agriculture
- Tourism

---

# 19. LAZY LOADING

No Economic Structure provider request may run at app startup.

No Economic Structure provider request may run during the global/core refresh solely for this feature.

Core flow:

`openMarket(code)` → render existing details → start Economic Structure summary load.

Extended flow:

`openExtendedCountry(code)` → render existing details → start Economic Structure summary load.

Very expensive domains should load only when their collapsible section opens where practical.

Opening Germany must not fetch France.

---

# 20. CORE + EXTENDED COVERAGE

Create the data contract for:

- all 36 core markets;
- all 50 extended-country watch entries.

Do not require every domain to return data.

N/A is valid.

Every country must have a controlled state for each domain:

```text
READY
PARTIAL
CACHED
STALE
N/A
ERROR
```

---

# 21. ERROR ISOLATION

Each domain must be isolated.

Trade failure must not prevent:

- minerals
- agriculture
- tourism
- existing market details

from rendering.

Use `Promise.allSettled` or equivalent independent domain handling.

---

# 22. HOST ALLOW-LIST

Update native host allow-list only for exact validated hosts required by the new adapters.

Expected additions may include:

- `comtradeapi.un.org`
- specific USGS/ScienceBase data host(s)
- `api.data.apps.fao.org`

Do not allow entire unrelated TLDs or generic wildcard hosts.

If the final APK uses the fallback WebView DEX and the native allow-list changes are not compiled into it, document this as a release blocker for those adapters rather than silently shipping non-working network calls.

---

# 23. PROVENANCE

Every displayed numerical row must contain internally:

```text
provider
dataset
metric / commodity / HS code
classification
value
unit
period
retrievedAt
sourceUrl
status
```

The UI may remain compact, but provenance must be available for detail/audit/export.

---

# 24. FREQUENCY-AWARE FRESHNESS

Do not use a daily freshness rule for annual data.

Suggested semantics:

- latest officially available annual release: CURRENT_RELEASE
- older but valid cached annual release: CACHED
- superseded annual release when newer release is known: STALE
- missing: N/A

Observation age and cache age are separate concepts.

---

# 25. NO MODEL IMPACT

Create an automated regression assertion that Economic Structure data are never referenced by:

- GA2
- countryRisk
- Market Health scoring
- Shortage scoring
- Capital Rotation
- Bonds
- T212
- alerts

No new score weight is allowed.

---

# 26. TEST FIXTURES

Create real provider-backed fixtures for at least:

## Trade

- Germany annual export HS2 response
- a partner/destination response
- response containing duplicate aggregation dimensions to verify filtering

## Minerals

- one country with material mineral production
- one country with facilities
- one country with no material observation

## Agriculture

- one valid FAOSTAT country response from the new API
- multiple commodities
- different flags
- null/missing case

## Tourism

- valid non-null observation
- recent null observations
- old last-valid observation

---

# 27. REQUIRED TESTS

Add tests for:

1. zero Economic Structure requests at module load/startup;
2. country isolation;
3. section/domain isolation;
4. fresh cache no-refetch;
5. stale cache render + refresh;
6. null never becomes zero;
7. annual period preserved;
8. trade shares reconstruct from total trade;
9. Comtrade aggregation rows are not double-counted;
10. HS2 classification preserved;
11. exports never interpreted as mine production;
12. reserves separate from production;
13. critical-mineral authority displayed;
14. rare earths separate from generic critical minerals;
15. agriculture ranking uses production quantity only;
16. incompatible agricultural units are not mixed;
17. tourism null response results in N/A;
18. failure of one domain does not break others;
19. all 36 core market contracts exist;
20. all 50 extended contracts exist;
21. old release regression suite remains green.

---

# 28. PHASED IMPLEMENTATION

## Phase 1 — source baseline + fixture acquisition

- verify latest version/build;
- inspect current market-detail architecture;
- fetch and save real provider fixtures;
- resolve actual USGS/FAO direct data URLs;
- no UI changes yet.

Report status after the phase.

## Phase 2 — common Economic Structure contract + cache

- module skeleton;
- provider-neutral types;
- independent per-domain cache;
- no startup requests.

Report status.

## Phase 3 — World Bank broad structure

Implement sector shares and tests.

Report status.

## Phase 4 — UN Comtrade trade adapter

Implement total trade, Top exports, destinations and imports with strict total-row filtering.

Report status.

## Phase 5 — first full audit

Run the old release suite + new tests.

Verify no scoring changes and no startup regression.

Fix all discovered issues before proceeding.

Report audit result.

## Phase 6 — USGS minerals

Implement production, facilities and defensible reserves/classification fields only.

Report status.

## Phase 7 — FAOSTAT agriculture

Implement new API adapter and Top production products.

Report status.

## Phase 8 — tourism partial adapter

Implement valid recent World Bank observations only.

Report status.

## Phase 9 — UI integration

Add collapsible Economic Structure to core and extended market details.

Keep all existing UI/risk content unchanged.

Report status.

## Phase 10 — final audit/release

Run:

- full previous regression suite;
- all new provider/parser fixtures;
- core + extended coverage audit;
- startup/performance audit;
- provenance audit;
- model-freeze audit.

Only after PASS:

- increment date-based version ordinal/build code;
- create correctly named APK/source/report;
- sign with the same existing identity.

---

# 29. RELEASE VERSIONING

Continue the date-based scheme.

If this is the next release on the same day after `2026.09.26.1 / BUILD124`, use:

`versionName 2026.09.26.2`

`versionCode 125`

If implementation occurs on another day, use that actual date with ordinal `.1` unless another release already exists that day.

---

# 30. FINAL ACCEPTANCE CHECKLIST

The release is accepted only if:

- Economic Structure exists for every core and extended market detail surface;
- no extra data are shown on the main market cards;
- no new startup provider load exists;
- top export products are real Comtrade observations;
- trade shares are mathematically reconstructable;
- mineral production/reserves/facilities are semantically distinct;
- rare earths are not synonymous with critical minerals;
- agriculture uses validated FAOSTAT production data;
- tourism uses only valid non-null observations;
- every value has provider + period + provenance;
- N/A is used instead of fabricated data;
- existing scores/models are byte-/fixture-compatible with the prior release;
- no unrelated module was changed.
