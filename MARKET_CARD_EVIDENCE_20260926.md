# Market Cards / Evidence implementation — 2026.09.26.1

## Phase 2 inventory
- Authoritative core universe: 36 markets from `MARKET_CONFIG`.
- Existing `marketCard()` / `renderMarkets()` / `openMarket()` flow is reused.
- GDP, CPI/inflation and unemployment are already loaded into `country.macroData` for all core markets as part of the existing model build.
- US and Germany use alternate validated macro-risk models; their World Bank rows are context-only for scoring.
- No parallel market detail route will be introduced.
