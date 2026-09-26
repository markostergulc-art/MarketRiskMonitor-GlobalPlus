# SOURCES v3.5.1_09

Core sources: Federal Reserve/FRED, BLS, BEA, Cleveland Fed, Atlanta Fed, OECD, ECB, Bundesbank/Destatis context, Treasury Fiscal Data, NY Fed, OFR, EIA, CFTC, World Bank, Zagreb Stock Exchange and configured public market-data providers.

Inflation/recession methodology prioritizes official/current releases and separates observation date from retrieval date. Macro series are evaluated against their release frequency rather than being labeled stale merely because they are monthly or quarterly.


Commodity detail source hierarchy: (1) EIA/DOE for U.S. petroleum inventories and SPR capacity; (2) World Gold Council/IMF-reported official-sector gold activity; (3) Cboe/CFTC for implied volatility and positioning; (4) public market-price history for commodity futures. U.S. SPR inventory is explicitly labeled as a strategic policy buffer, not global proven geological reserves.


## v3.5.1_19 energy storage sources
- GIE AGSI+ API — EU natural-gas storage inventory and working-gas capacity. Personal API key required by GIE.
- Eurostat `nrg_stk_oilm` — monthly emergency and commercial oil stock levels by country.
- U.S. EIA Petroleum Navigator weekly histories — SPR, commercial crude excluding SPR, and total crude including SPR.
- U.S. Department of Energy SPR Quick Facts — authorized SPR capacity context.
- Yahoo Finance chart history already used by the application — Gold (`GC=F`) and Silver (`SI=F`) price series.
