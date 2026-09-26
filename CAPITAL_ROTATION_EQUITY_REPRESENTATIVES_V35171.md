# Capital Rotation — Concrete Assets and Equity Representatives (v3.5.1.71)

## Scope
This release extends only the **Capital Rotation** explainability layer. Existing GA2, Early Warning, country/market, macro, commodity, correlation and Capital Rotation scoring arithmetic is not changed.

## Concrete asset exposure
Each Capital Rotation asset row now states what the category actually represents and which market proxy is measured. Examples include:

- Short U.S. Treasuries: 1–3Y U.S. Treasury exposure, proxy SHY.
- Long U.S. Treasuries: 20+Y U.S. Treasury exposure, proxy TLT.
- Investment Grade credit: USD IG corporate bonds, proxy LQD.
- High Yield credit: USD speculative-grade corporate bonds, proxy HYG.
- Gold: gold exposure, proxy GLD.
- Industrial metals: primarily copper, proxy CPER; aluminum/nickel/zinc are descriptive context and are not separate score inputs.
- Agriculture: broad agriculture basket, proxy DBA; wheat/corn/soy are descriptive context and are not separate score inputs.
- Equity groups expose the sector/theme represented by their existing ETF or market proxy.

## Equity Top-10 explainability
A new collapsed section, **DIONICE · 10 NAJVEĆIH PREDSTAVNIKA**, is available in Capital Rotation.

Groups:
1. Defensive equities
2. Technology / Growth
3. Semiconductors
4. Industrials
5. Consumer Discretionary
6. Materials
7. Financials
8. Energy equities
9. Small Caps
10. Emerging Markets
11. United States
12. Europe
13. Japan
14. China

### Loading behavior
Representative data is **lazy loaded**. Opening a group starts its own fetch. It is not part of boot or the main refresh pipeline. Group results use an 8-hour local cache and can be refreshed independently.

### Ranking
For comparable candidate universes, the app requests Yahoo fundamentals time-series market capitalization and ranks finite market-cap values descending. Missing market cap remains `N/A` and is never converted to zero.

For broad index universes where exhaustive constituent discovery is outside the existing provider architecture, documented issuer-holdings snapshots are used as the representative universe/order (IWM for Small Caps, EEM for Emerging Markets, VGK for Europe). Live company price trends are still refreshed independently.

### Per-company fields
Each visible representative shows:
- rank,
- company,
- ticker,
- sector/theme,
- country,
- market capitalization when available,
- 1-month price trend,
- confirmation status.

Rows remain clickable through the existing stock-detail workflow.

## Top-10 confirmation
`Top-10 confirmation: X/N` compares each representative's 1M direction with the parent Capital Rotation bias when the parent bias is material (absolute score >= 20).

This is **explainability only**. It does not feed back into:
- Capital Rotation score,
- GA2,
- Early Warning,
- Global Risk,
- country/market scoring.

Statuses:
- CONFIRMS
- CONTRADICTS
- NEUTRAL
- N/A

The list is not a BUY/SELL ranking and does not represent measured investor fund flows.

## Failure isolation
A missing fundamentals response, missing market cap, or unavailable company history does not fail the parent Capital Rotation module. The affected field/row remains `N/A`.
