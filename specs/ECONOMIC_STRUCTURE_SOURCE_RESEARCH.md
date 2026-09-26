# Market Risk Monitor Global+ — Economic Structure Source Research

Baseline inspected: `2026.09.26.1 / BUILD124`.

## 1. Existing architecture verified

The current source has:

- 36 authoritative core markets in `MARKET_CONFIG`.
- 50 extended-country watch entries in `EXTENDED_COUNTRY_CONFIG`.
- Existing core market details opened through `openMarket(code)`.
- Existing extended details opened through `openExtendedCountry(code)`.
- `app/src/main/assets/market_details_v310.js` already provides on-demand, per-country context loading and per-country local cache.
- The current detail loader is explicitly context-only and does not modify GA2/country scoring.
- Existing `MainActivity.java` allow-list already includes World Bank, EU/FAO domains, but does not yet include UN Comtrade or USGS data hosts.

This means Economic Structure should extend the existing detail architecture rather than creating a new country subsystem.

---

# 2. Research decision by domain

| Domain | Decision | Primary source | Production suitability |
|---|---|---|---|
| Broad economic structure | IMPLEMENT | World Bank WDI | High |
| Export products | IMPLEMENT | UN Comtrade | High, after strict aggregation filtering |
| Export destinations | IMPLEMENT | UN Comtrade | High |
| Import products | IMPLEMENT | UN Comtrade | High |
| Mineral production | IMPLEMENT | USGS Minerals Yearbook / MCS data release | High for annual data |
| Mineral facilities / processing | PARTIAL | USGS Minerals Yearbook | Good where facility data exist |
| Mineral reserves | PARTIAL | USGS MCS | Good by commodity; country coverage varies |
| Critical-mineral classification | IMPLEMENT AS METADATA | EU CRM list + USGS critical list | High; classification only |
| Rare-earths | IMPLEMENT AS A SUBSET | USGS mineral datasets | High where country data exist |
| Agriculture production | IMPLEMENT, but NOT via legacy Fenix API | FAOSTAT new data catalog/API | High once new endpoint fixture is finalized |
| Agricultural exports | DEFER FROM FIRST RELEASE | Could use FAOSTAT trade or Comtrade HS agri groups | Avoid duplicating trade logic initially |
| Tourism arrivals | PARTIAL | World Bank / UN Tourism | Coverage/recency uneven |
| Tourism receipts | PARTIAL | World Bank / UN Tourism | Coverage/recency uneven |
| Tourism share / GDP or exports | PARTIAL | UN Tourism / World Bank | Implement only when validated non-null data exist |

---

# 3. Broad economic structure

## Recommended provider

World Bank World Development Indicators.

Recommended indicators:

- `NV.AGR.TOTL.ZS` — Agriculture, forestry and fishing, value added (% GDP)
- `NV.IND.TOTL.ZS` — Industry including construction, value added (% GDP)
- `NV.IND.MANF.ZS` — Manufacturing, value added (% GDP)
- `NV.SRV.TOTL.ZS` — Services, value added (% GDP)

Use these as quantitative sector composition, not as a hand-written list of “important industries”.

The current application already uses the World Bank API and has a validated adapter/freshness path, so these are the lowest-risk additions.

Decision: **IMPLEMENT**.

---

# 4. International trade

## Primary provider

UN Comtrade public API.

A live API response was validated during this research.

Example request tested:

`https://comtradeapi.un.org/public/v1/preview/C/A/HS?reporterCode=276&period=2024&flowCode=X&partnerCode=0&cmdCode=87&maxRecords=5&includeDesc=true`

The endpoint returned HTTP 200 JSON for Germany (`reporterCode=276`, `reporterISO=DEU`) with fields including:

- `period`
- `reporterCode`
- `reporterISO`
- `flowCode`
- `partnerCode`
- `classificationCode`
- `cmdCode`
- `cmdDesc`
- `aggrLevel`
- `customsCode`
- `motCode`
- `primaryValue`
- `fobvalue`

The validated record included HS chapter 87 (“Vehicles; other than railway or tramway rolling stock...”) for 2024.

## Critical parser requirement

The preview response also contained multiple rows for the same reporter/product caused by transport mode, partner2 and customs dimensions. Therefore production code MUST NOT simply sum every returned row.

Production filtering must explicitly select the total aggregation dimensions, for example where applicable:

- `customsCode == C00`
- total mode of transport (`motCode == 0`)
- total partner2
- requested reporter / partner / flow / period
- requested HS aggregation level

The exact public non-preview endpoint and filtering contract must be frozen in fixtures before release.

## UI use

### Top export products

Use HS2 for the first view.

Rank by actual export `primaryValue`.

Share:

`product_export_value / total_merchandise_export_value`

### Export destinations

Rank partner-country total exports.

Share:

`exports_to_partner / total_merchandise_exports`

### Imports

Same method with import flow.

## Classification

Store:

- system: HS
- revision/classification code returned by provider
- HS code
- provider description
- aggregation level

Decision: **IMPLEMENT**.

---

# 5. Minerals and critical raw materials

## USGS Minerals Yearbook 2024 international dataset

USGS released a machine-readable international dataset on 31 August 2026 covering more than 150 countries.

The release contains:

- country mineral-industry reports;
- mineral commodity production data for 2020–2024;
- country-level mineral facilities;
- CSV tabular files;
- public/CC0 licensing.

DOI: `10.5066/P1KEQASH`.

This is well aligned with the app because the data are annual and can use a long cache TTL.

Decision: **IMPLEMENT mineral production** and **PARTIAL facility/processing** where fields exist.

## USGS Mineral Commodity Summaries 2026

The 2026 USGS MCS data release contains world production statistics for more than 90 nonfuel mineral commodities and includes data/metadata CSV entities. MCS also covers world production, reserves/resources and commodity context.

DOI for data release: `10.5066/P1WKQ63T`.

Decision: use as a commodity-centric supplementary source, especially for reserves and latest world production where appropriate.

## Data semantics

Never merge these concepts:

- mine production
- refining/processing capacity
- reserves
- resources
- exports/imports

Each must be stored separately.

## Critical-mineral labels

Criticality is classification metadata, not a measured property.

Store classification source and list/version, e.g.:

- EU Critical Raw Materials list (EU context)
- USGS/U.S. critical minerals list (U.S. context)

Never present “critical” as a universal intrinsic label without attribution.

## Rare earths

Treat rare-earth elements as a mineral group/subset, not as a synonym for critical minerals.

Show only where actual country production/reserve/processing/trade observations exist.

Decision: **IMPLEMENT** with strict semantic separation.

---

# 6. Agriculture

## Source validation

FAOSTAT is the preferred global source.

The official FAO catalog confirms the Crops and livestock products dataset:

- annual national coverage;
- 1961–2024 current time coverage in the inspected release;
- 278 product categories;
- production in tonnes;
- area harvested in hectares;
- yield in hg/ha;
- annual update frequency;
- CC-BY 4.0 license;
- flags for official/unofficial/imputed observations.

The legacy endpoint tested during this research:

`https://fenixservices.fao.org/faostat/api/v1/en/data/QCL?...`

returned HTTP 521 and must **not** be used for new production code.

However, the current FAO Data Catalog exposes a new machine-readable resource through `api.data.apps.fao.org`, including a BigQuery-backed query resource and schema/download resources.

A discovered official resource points to:

`https://api.data.apps.fao.org/api/v2/bigquery?...`

This is the correct direction for implementation, but the exact query parameters/schema for per-country Top-N extraction should be frozen in a fixture before coding production parsing.

## Ranking rule

For first implementation use **production quantity** only.

Do not create a generic “importance” score.

Show:

- commodity
- production tonnes
- observation year
- FAO flag if available

Agricultural exports can remain covered by the general UN Comtrade trade section rather than creating duplicate provider logic in v1.

Decision: **IMPLEMENT production after final endpoint fixture validation**.

---

# 7. Tourism

## UN Tourism

The UN Tourism dashboard provides national-level indicators including:

- international tourist arrivals;
- international tourism receipts;
- tourism share of exports;
- contribution to GDP;
- source markets;
- seasonality;
- accommodation/employment data.

However, this research did not confirm a stable documented public machine-readable API suitable for direct Android runtime integration.

Therefore UN Tourism should be treated as an authoritative reference source, but **not yet as the primary runtime adapter**.

## World Bank tourism indicators

World Bank offers machine-readable tourism indicators such as:

- `ST.INT.ARVL` — international tourism, number of arrivals
- `ST.INT.RCPT.CD` — international tourism receipts, current USD
- related tourism-share indicators where available

A live World Bank response for Croatia `ST.INT.ARVL` was validated (HTTP 200), but 2023–2025 values in that response were null. This demonstrates that global endpoint availability does not imply usable recent observations for every country.

## Production policy

Use World Bank as the first automated fallback only if a valid non-null observation exists inside a defined annual recency window.

If no valid observation exists:

`N/A — no validated recent tourism observation`

Do not substitute old observations without clearly showing the observation year.

Decision: **PARTIAL** for first release.

---

# 8. Key industries / important products

Do not build a hard-coded prose list by country.

Recommended deterministic composition:

1. World Bank sector shares for broad structure.
2. UN Comtrade Top export products for named product/industry signals.
3. USGS mineral production/facilities for extractive industries.
4. FAOSTAT production for agriculture.
5. Tourism only from validated observations.

This creates a data-driven “Economic Structure” section rather than an editorial country description.

Decision: **IMPLEMENT** using the above components.

---

# 9. Coverage strategy for 36 core + 50 extended markets

The existing app has 86 configured country surfaces in total.

The new contract should exist for all 86, but individual domains may be `N/A`.

Expected broad coverage:

- World Bank sector structure: high
- UN Comtrade merchandise trade: high
- USGS minerals: material only for mineral-producing/processing countries; N/A elsewhere is correct
- FAOSTAT agriculture: broad global coverage
- tourism: uneven; N/A expected for some countries

No domain should be fabricated just to achieve 100% populated cards.

---

# 10. Architecture recommendation

Create one new asset module, for example:

`app/src/main/assets/economic_structure_v125.js`

and extend the existing `market_details_v310.js` / market modal flow.

Do not modify score calculation functions.

Recommended data contract:

```text
EconomicStructureCountry {
  countryCode
  iso3
  broadStructure
  trade
  minerals
  agriculture
  tourism
  status
  retrievedAt
}
```

Each domain should have independent state/cache/error handling.

Use per-domain cache keys such as:

```text
economicStructure:v1:<country>:trade
economicStructure:v1:<country>:minerals
economicStructure:v1:<country>:agriculture
economicStructure:v1:<country>:tourism
```

Suggested TTL:

- trade annual: 30–60 days
- minerals annual: 90–180 days
- agriculture annual: 90 days
- tourism annual: 30–60 days
- broad WDI structure: 30–60 days

All caches must preserve original observation period and original retrieval timestamp.

---

# 11. Runtime / host implications

Current native allow-list already covers World Bank and FAO-related domains, but new production adapters will require validation/addition of hosts including at least:

- `comtradeapi.un.org`
- relevant `usgs.gov` / `data.usgs.gov` / ScienceBase download host(s)
- `api.data.apps.fao.org` if not already accepted through the current FAO rule

Do not broaden the allow-list generically. Add only exact validated hosts/suffixes required by the adapters.

---

# 12. Final research decision

## IMPLEMENT in the next development cycle

1. World Bank broad sector structure.
2. UN Comtrade Top export products.
3. UN Comtrade Top export destinations.
4. UN Comtrade Top import products.
5. USGS mineral production.
6. USGS mineral facilities when available.
7. Critical-mineral / rare-earth classification metadata.
8. FAOSTAT Top agricultural products by production quantity after final new-API fixture validation.
9. World Bank tourism observations when valid and recent enough.

## PARTIAL

1. Mineral reserves — only where MCS exposes defensible country-level values.
2. Tourism — only validated non-null observations; no forced coverage.
3. Mineral processing/refining — only where facility data support it.

## DEFER

1. Hand-written “important products” by country.
2. Subjective strategic-importance score.
3. Real-time mineral inventory.
4. Inferred mineral dependency percentages.
5. Tourism forecasts.
6. AI-generated country industry descriptions.
7. Agriculture export module separate from Comtrade in the first release.

---

# Sources reviewed

- UN Comtrade API: https://comtradeapi.un.org/
- World Bank WDI API: https://api.worldbank.org/
- World Bank sector indicators: https://data.worldbank.org/
- USGS Mineral Commodity Summaries 2026: https://www.usgs.gov/centers/national-minerals-information-center/mineral-commodity-summaries
- USGS MCS 2026 data release: https://www.usgs.gov/data/mineral-commodity-summaries-2026-data-release
- USGS 2024 Minerals Yearbook international data release: https://www.usgs.gov/data/2024-minerals-yearbook-volume-iii-area-reports-international-country-reports-global-production
- FAOSTAT Crop production catalog: https://data.fao.org/catalog/iso/d24a448b-3b62-4c09-8c1d-4a39bb599876
- UN Tourism Data Dashboard: https://www.unwto.org/market-intelligence
