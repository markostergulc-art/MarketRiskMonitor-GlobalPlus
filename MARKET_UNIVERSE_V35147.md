# Market Universe — v3.5.1.47

## Croatia

**ALWAYS INCLUDED IN MARKETS**.

- Code: `HR`
- Country: Croatia / Hrvatska in localized presentation
- Index: `CROBEX`
- Symbol: `CBX`
- Provider: `zse` / official Zagreb Stock Exchange path already used by the application
- Region: Europe

`activeMarketConfig()` now returns the complete configured core universe regardless of UI language, so Croatia is no longer conditionally introduced only by Croatian locale. Croatia participates in Markets, country detail, market scoring, Global Market Health and Fiscal Stress under the same data-quality/eligibility rules as every other configured market. No Croatia score/status is hardcoded.

## Bosnia and Herzegovina

**REMOVED COMPLETELY FROM THE ACTIVE USER-FACING MARKET/FISCAL UNIVERSE.**

Removed from:

- core market configuration;
- language-dependent market inclusion;
- Markets cards and market detail construction;
- configured-market denominator used by Global Market Health;
- company-leader country map;
- cross-market country sensitivity metadata;
- user-facing fiscal universe derived from Markets;
- market diagnostics/special `LIMITED DATA` treatment.

There is no active `BA` country market configuration and no `SASX-10` market entry. Historical release documentation may still mention the old Bosnia case; those historical documents were intentionally not rewritten.

## Cache behaviour

Cached market snapshots are rehydrated by iterating the current `activeMarketConfig()` rather than blindly restoring every old cached country row. Therefore an older cache containing Bosnia cannot recreate it in the current Markets universe.

## Count

Core configured Markets after the removal: **36**.

The Global Market Health methodology itself is unchanged; only the configured universe/denominator naturally reflects the actual new market list.
