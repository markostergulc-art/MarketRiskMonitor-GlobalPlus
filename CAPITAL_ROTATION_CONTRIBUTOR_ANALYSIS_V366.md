# Market Risk Monitor Global+ — Capital Rotation Contributor Analysis

Release: **v3.6.6 / BUILD116**  
Baseline: **v3.6.5 / BUILD115**

## Objective

BUILD116 does **not** replace or retune the BUILD115 Daily Capital Rotation score. It adds an attribution/evidence layer answering: **which concrete stocks, how much sector breadth, and which secondary market drivers explain a sector's daily relative-rotation signal?**

The primary BUILD115 signal remains latest-completed-session sector ETF performance relative to SPY, with the existing cross-sectional rank, volume confirmation and cross-asset confirmation. 5D remains context only.

## Dynamic constituent source

The implementation downloads the current **State Street Select Sector SPDR daily holdings workbook** for the relevant sector ETF using the official `holdings-daily-us-en-<ticker>.xlsx` endpoint pattern. Holdings are parsed at runtime; individual companies and weights are not hardcoded.

Stored fields include:

- ETF ticker
- constituent ticker
- company name
- ETF weight
- sector / industry field when present
- shares held when present
- local currency when present
- holdings observation date when available in the workbook
- retrieval/cache state

Holdings policy:

- normal holdings cache: 24 hours
- stale fallback ceiling: 7 days
- stale holdings reduce attribution confidence
- manual evidence refresh bypasses the normal holdings cache

## Price alignment

For each valid constituent, BUILD116 requires prices for the **same completed session** used by the sector ETF and SPY benchmark.

A constituent is excluded from attribution when it cannot be aligned to both:

- target completed-session date
- immediately preceding completed-session date

Missing data are not converted to zero.

## Formulas

### Constituent daily return

`StockDailyReturn = LatestCompletedClose / PreviousCompletedClose - 1`

### Excess return versus SPY

`StockExcessReturn = StockDailyReturn - SPYDailyReturn`

### Relative return versus sector ETF

`StockVsSector = StockDailyReturn - SectorETFDailyReturn`

### Approximate ETF contribution

`ApproxContribution_pp = ETFWeight_fraction × StockDailyReturn_percent`

This is explicitly labeled **approximate contribution**. It is not represented as official fund accounting attribution.

## Breadth

For every loaded sector the module calculates:

- valid / total constituents
- positive constituent count and percentage
- negative constituent count
- percentage outperforming SPY
- percentage outperforming the sector ETF
- weighted constituent coverage
- positive ETF weight
- positive weight as a percentage of valid weight

### Breadth classification

The result is classified as:

- BROAD
- MODERATELY BROAD
- MIXED
- NARROW
- HIGHLY CONCENTRATED

Classification combines positive participation, SPY-relative participation and top-contributor concentration.

## Contribution concentration

The module calculates:

- Top-1 share of total positive contribution
- Top-3 share
- Top-5 share

`megaCapDominated = true` when Top-3 constituents account for at least 75% of positive contribution.

This prevents a strong sector ETF move driven by only a few high-weight stocks from being mislabeled as broad sector rotation.

## Top contributors

The detail view displays dynamically calculated:

- Top 5 positive contributors
- Top 5 negative contributors

For each item it shows:

- ticker
- company
- ETF weight
- 1D return
- excess versus SPY
- approximate contribution in percentage points

There are no hardcoded mappings such as "Exxon = Energy leader" or "Nvidia = Technology leader".

## Secondary driver confirmation

Driver data are **confirmation only** and never alter the raw BUILD115 Daily Rotation Score.

Current mappings:

| Sector | Secondary confirmation proxies |
|---|---|
| Technology | SOXX vs SPY, QQQ vs SPY, TLT |
| Financials | KRE vs SPY, HYG vs SPY, LQD vs SPY |
| Energy | WTI (`CL=F`), Brent (`BZ=F`), U.S. Natural Gas (`NG=F`) |
| Industrials | IYT vs SPY, ITA vs SPY, Copper (`HG=F`) |
| Healthcare | XBI vs SPY, IBB vs SPY, TLT |
| Utilities | TLT, U.S. Natural Gas |
| Consumer Discretionary | XRT vs SPY, IWM vs SPY |
| Consumer Staples | TLT, GLD vs SPY |
| Communication Services | QQQ vs SPY, IWM vs SPY |
| Materials | Copper (`HG=F`), GLD vs SPY, SLV vs SPY |
| Real Estate | TLT, HYG vs SPY, LQD vs SPY |

Driver state:

- STRONG CONFIRMATION
- CONFIRMATION
- MIXED
- DIVERGENCE
- STRONG DIVERGENCE
- N/A

Missing driver data do not become zero and do not change the raw daily score.

## Confidence

Attribution confidence uses weighted constituent coverage plus holdings freshness.

- `<50%` weighted coverage: LOW
- stale holdings or `<70%` weighted coverage: LOW
- `>=90%` weighted coverage with at least 10 valid constituents and non-stale holdings: HIGH
- otherwise: MEDIUM

This confidence is separate from the original Daily Rotation Score confidence.

## UI behavior

BUILD116 keeps the sector overview compact. Each sector now exposes a lazy-loaded **What drove the daily move?** section containing:

- positive breadth
- constituents outperforming SPY
- positive ETF weight
- weighted coverage
- Top-3 concentration
- holdings as-of / cache state
- mega-cap concentration flag
- positive contributors
- negative contributors
- commodity / macro confirmation
- evidence-based interpretation

Attribution is loaded only when a sector detail is opened. This prevents an uncontrolled fan-out across hundreds of constituents on every Capital Rotation page render.

## Networking and failure isolation

- State Street holdings are loaded dynamically.
- Constituent price requests use Yahoo multi-symbol Spark batches where available.
- Batch size is bounded; missing symbols receive bounded-concurrency fallback requests.
- Existing market caches are reused where possible.
- A failed constituent is omitted rather than converted to zero.
- A failed holdings provider does not break the existing Daily Rotation signal.
- A stale cached holdings workbook may be used with explicit reduced confidence.

## Terminology

BUILD116 continues to describe price-based results as:

- relative rotation
- implied rotation
- relative leadership

It does **not** claim measured dollar fund inflows/outflows unless actual flow data are available.

## Runtime changes versus BUILD115

The BUILD115 Daily Rotation scoring functions are byte/function-equivalent after release metadata normalization. No Global Risk, Stocks, ETF risk, T212 Portfolio, Bonds, Commodities, Macro, Correlation, Volatility or Dividend scoring function was retuned in BUILD116.
