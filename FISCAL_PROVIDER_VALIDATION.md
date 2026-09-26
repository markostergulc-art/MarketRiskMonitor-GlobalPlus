# Fiscal Provider Validation — v3.5.1.43

Date: 2026-09-14

## Production provider architecture

| Provider | Metrics | Geography | Production use | Definition / caveat | Runtime validation in this build environment |
|---|---|---|---|---|---|
| Eurostat `gov_10q_ggdebt` | General-government gross debt / GDP | EU27 | Primary | ESA 2010 / Maastricht, S.13, `GD`, `PC_GDP` | Endpoint/dataset/schema documented; physical Android request **NOT EXECUTED** |
| Eurostat `gov_10q_ggnfa` | Net lending/borrowing, interest payable, revenue | EU27 | Primary | S.13, NSA, `B9`, `D41PAY`, `TR`, `PC_GDP` | Endpoint/dataset/schema documented; physical Android request **NOT EXECUTED** |
| World Bank WDI / IMF GFS | Central-government debt, balance, expense, interest ratios | Global fallback / normalized comparison | Fallback | Often **central government**, not fully comparable with EU ESA general government | Existing app HTTP architecture reused; physical v43 device call **NOT EXECUTED** |
| World Bank WDI | Nominal GDP | Global | Systemic-importance / r-g support | Observation years can differ | Existing architecture reused |
| FRED / OECD | 10Y benchmark government yields | 28 mapped sovereigns | Market-financing condition | Mostly monthly OECD series; US `DGS10` daily | Public series validated for major samples; physical v43 device call **NOT EXECUTED** |

## Eurostat filters used

Debt:

`gov_10q_ggdebt · sector=S13 · na_item=GD · unit=PC_GDP · lastTimePeriod=8`

Fiscal flows:

`gov_10q_ggnfa · sector=S13 · s_adj=NSA · unit=PC_GDP · lastTimePeriod=8`

with `na_item` separately set to:

- `B9` — net lending (+) / net borrowing (-)
- `D41PAY` — interest payable/expenditure
- `TR` — total general-government revenue

The app uses four-quarter averages for quarterly flow ratios when enough observations exist. Missing quarterly flow history remains missing.

## World Bank / IMF GFS indicators

- `GC.DOD.TOTL.GD.ZS` — central government debt, total (% GDP)
- `GC.NLD.TOTL.GD.ZS` — net lending (+) / net borrowing (-) (% GDP)
- `GC.XPN.TOTL.GD.ZS` — expense (% GDP)
- `GC.XPN.INTP.ZS` — interest payments (% expense)
- `GC.XPN.INTP.RV.ZS` — interest payments (% revenue)
- `NY.GDP.MKTP.CD` — nominal GDP, USD
- `NY.GDP.MKTP.CN` — nominal GDP, local currency

World Bank identifies the fiscal series above as sourced from IMF Government Finance Statistics. The app labels this route as a central-government fallback and never silently calls it harmonized EU general-government data.

## Yield mapping

28 sovereigns have an explicit 10Y FRED/OECD target. Examples independently checked during research:

- Germany `IRLTLT01DEM156N` — OECD long-term 10Y benchmark via FRED
- Italy `IRLTLT01ITM156N`
- US `DGS10`

Yield requests use `mapLimit(..., 4, ...)`; one missing/invalid yield cannot reject other sovereigns.

## Transport decision

The existing application has a history of Eurostat/WebView transport instability. v3.5.1.43 therefore does **not** modify native `MainActivity`, `AgsiKeyStore` or the stable fallback DEX.

- Normal/native source path: the existing v3.5.1.35 Eurostat transport helper is reused.
- Standalone fallback `file:` path: fiscal Eurostat attempts direct official JSON-stat access with cache/stale fallback. If it fails, EU rows may fall back metric-by-metric to World Bank/IMF GFS and are explicitly marked `MIXED_FALLBACK` rather than fabricating data.
- No failed provider can stop World Bank, FRED or other countries from rendering.

## What is deliberately NOT claimed

The prompt listed many national ministries/debt-management offices as preferred sources. v3.5.1.43 does **not** claim that direct adapters for every national institution have been implemented. For globally comparable runtime coverage, the first release uses Eurostat for EU harmonized data and IMF-GFS/World Bank + OECD/FRED as the documented fallback/comparison layer. National-source adapters are the correct next extension for maturity schedules, gross financing needs, FX-debt shares and asset/net-debt context.

## Source references

- Eurostat API guide: https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-getting-started/api
- Eurostat quarterly debt metadata: https://ec.europa.eu/eurostat/cache/metadata/en/gov_10q_ggdebt_esms.htm
- Eurostat quarterly government non-financial accounts metadata: https://ec.europa.eu/eurostat/cache/metadata/en/gov_10q_ggnfa_esms.htm
- World Bank central-government debt: https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS
- World Bank net lending/borrowing: https://data.worldbank.org/indicator/GC.NLD.TOTL.GD.ZS
- World Bank interest/revenue: https://data.worldbank.org/indicator/GC.XPN.INTP.RV.ZS
- FRED Germany 10Y: https://fred.stlouisfed.org/series/IRLTLT01DEM156N
- FRED Italy 10Y: https://fred.stlouisfed.org/series/IRLTLT01ITM156N
