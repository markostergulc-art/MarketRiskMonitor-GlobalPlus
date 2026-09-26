# Bonds Methodology Research — Market Risk Monitor Global+ v3.5.1.75

## Objective
Design a mobile fixed-income risk dashboard that explains the **type of bond-market regime** rather than reducing fixed income to a generic green/red score. The module is diagnostic and does not alter Global Risk, Early Warning, country scoring, Capital Rotation, or any existing production weight/threshold.

## Research conclusion
A professional fixed-income view needs at least five independent dimensions:

1. **Nominal sovereign yield curve** — level, slope and direction.
2. **Real yields / inflation expectations** — distinguish real-rate tightening from inflation repricing.
3. **Corporate credit spreads** — distinguish Treasury rally/selloff from private-credit stress.
4. **Sovereign spreads** — especially Euro-area fragmentation versus German Bunds.
5. **Investable proxies** — bond ETFs for concrete exposure, kept separate from underlying yields/spreads.

A single score was rejected because the same rise in yields can mean policy tightening, inflation shock, fiscal/term-premium stress, or improving growth. The tab therefore reports a **regime classification** plus component statuses.

## Authoritative sources reviewed

### U.S. Treasury
- Interest-rate statistics: https://home.treasury.gov/policy-issues/financing-the-government/interest-rate-statistics
- Daily nominal par yield curve: https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve
- Daily real par yield curve: https://home.treasury.gov/resource-center/data-chart-center/interest-rates/TextView?type=daily_treasury_real_yield_curve

Treasury describes the nominal par curve as derived from closing market bid prices on recently auctioned Treasury securities, using indicative Federal Reserve Bank of New York quotations. The real curve is based on TIPS. The app consumes corresponding Treasury-derived FRED series through its existing FRED/ALFRED resilient transport.

### Deutsche Bundesbank
Daily German Federal securities yield series used for the Bund curve:
- 2Y: `BBSSY.D.REN.EUR.A610.000000WT0202.A`
- 5Y: `BBSSY.D.REN.EUR.A620.000000WT0505.A`
- 10Y: `BBSSY.D.REN.EUR.A630.000000WT1010.A`
- 30Y: `BBSSY.D.REN.EUR.A640.000000WT3030.A`

REST base: `https://api.statistiken.bundesbank.de/rest/data/BBSSY/...`

### ECB / OECD sovereign context
ECB yield-curve/statistics methodology was reviewed for Euro-area context. For cross-country 10Y fragmentation in this release, the implementation uses the harmonised OECD 10Y benchmark series distributed through FRED because it provides a consistent Germany/France/Italy/Spain comparison in the app's existing resilient data path. Frequency is explicitly shown as monthly and is never presented as a daily spread.

Series:
- Germany: `IRLTLT01DEM156N`
- France: `IRLTLT01FRM156N`
- Italy: `IRLTLT01ITM156N`
- Spain: `IRLTLT01ESM156N`
- United Kingdom: `IRLTLT01GBM156N`
- Japan: `IRLTLT01JPM156N`

### ICE BofA / FRED corporate credit
- U.S. Investment Grade OAS: `BAMLC0A0CM`
- U.S. High Yield OAS: `BAMLH0A0HYM2`
- Euro High Yield OAS: `BAMLHE00EHYIOAS`

OAS is preferred to ETF price for credit-stress interpretation because it measures spread compensation relative to a Treasury/reference curve. FRED notes that ICE OAS series are daily and, from April 2026, retain three years of observations.

### Trading 212
Official Public API documentation: https://docs.trading212.com/

`GET /api/v0/equity/metadata/instruments` is the authenticated catalogue of instruments available for trading. The public equity API clearly exposes stocks/ETFs through the equity instrument/order model; the Bonds tab therefore shows Trading 212 availability only for **bond ETF proxies**. It does not infer that an individual Treasury, Bund, Gilt or JGB is directly tradeable merely because a bond ETF is available.

## Selected indicator universe

### U.S. Treasury curve — daily
- 3M `DGS3MO`
- 2Y `DGS2`
- 5Y `DGS5`
- 10Y `DGS10`
- 30Y `DGS30`

Why: this captures policy-sensitive short rates, belly, benchmark duration and long-end/term-premium risk without overcrowding mobile UI. 6M/1Y/20Y were rejected from the default card as redundant; they can be added later if a specific use-case requires them.

### Curve slopes
- 10Y−2Y
- 10Y−3M

30Y−10Y is useful for long-end diagnostics but omitted from the first compact top card to avoid overloading the UI. The underlying 30Y level remains visible.

### Real yields and inflation expectations — daily
- 5Y real yield `DFII5`
- 10Y real yield `DFII10`
- 5Y breakeven `T5YIE`
- 10Y breakeven `T10YIE`

Why: nominal-yield changes can then be separated into real-rate versus inflation-expectation repricing.

### Germany Bund curve — daily
- 2Y / 5Y / 10Y / 30Y, direct Bundesbank series.

Germany is mandatory because it is the principal Euro-area sovereign benchmark.

### Euro sovereign fragmentation — monthly harmonised comparison
- France 10Y minus Germany 10Y
- Italy 10Y minus Germany 10Y
- Spain 10Y minus Germany 10Y

The frequency is deliberately labelled monthly. No interpolation is used to make it appear daily.

### Corporate credit
- U.S. IG OAS
- U.S. HY OAS
- Euro HY OAS
- Euro IG OAS: **N/A in v1**

Euro IG was deliberately not substituted with an ETF-price proxy because that would mix price/duration effects with true credit spread. It remains explicit N/A until a verified, comparable public feed is integrated.

### UK and Japan
- UK 10Y benchmark — monthly OECD/FRED
- Japan 10Y benchmark — monthly OECD/FRED

These are contextual rather than full curves in v1. Direct daily official UK/JGB curve integrations were not introduced until a robust no-auth transport and parser are verified end-to-end on Android.

## Yield curve methodology

### Shape
- **INVERTED**: 10Y−2Y < 0 or 10Y−3M < 0.
- **FLAT**: both major slopes are within ±15 bp.
- **NORMAL**: neither inverted nor flat.

### One-month move classification
Using 2Y and 10Y yield changes:
- both lower and short end falls faster → **BULL STEEPENER**
- both lower and long end falls faster → **BULL FLATTENER**
- both higher and long end rises faster → **BEAR STEEPENER**
- both higher and short end rises faster → **BEAR FLATTENER**
- otherwise show STEEPENING / FLATTENING / MIXED where the slope move is material.

This is descriptive, not a return forecast.

## Credit-status methodology
OAS is shown in basis points, with 1M change and historical percentile.

Diagnostic bands:
- **EXTREME**: ≥97th percentile or very rapid monthly widening.
- **STRESS**: ≥90th percentile or ≥30 bp monthly widening.
- **WIDENING**: ≥70th percentile or ≥15 bp monthly widening.
- **TIGHT**: <30th percentile.
- **NORMAL**: otherwise.

These are risk-state labels, not “cheap/expensive” valuation calls.

## Sovereign-spread methodology
For France/Italy/Spain versus Germany:
- **STRESS**: ≥90th percentile or ≥25 bp monthly widening.
- **CAUTION**: ≥70th percentile or ≥10 bp monthly widening.
- **NORMAL**: otherwise.

The percentile adapts to the available historical window rather than hard-coding one absolute spread across structurally different sovereigns.

## Regime classification
The module reports one dominant descriptive regime:
- CREDIT / LIQUIDITY STRESS
- FISCAL / SOVEREIGN STRESS
- INFLATION STRESS
- RECESSION PRICING
- MONETARY TIGHTENING
- MONETARY EASING
- MIXED / NORMAL

Priority is given to explicit credit/sovereign stress before generic rate-direction labels. No numeric “Bond Risk Score” is produced.

## Concrete ETF proxies
- SGOV — 0–3M U.S. Treasury / T-Bills
- SHY — 1–3Y U.S. Treasury
- IEF — 7–10Y U.S. Treasury
- TLT — 20+Y U.S. Treasury
- TIP — U.S. TIPS
- LQD — U.S. Investment Grade corporate bonds
- HYG — U.S. High Yield corporate bonds
- VAGF.L — global aggregate bond UCITS proxy

ETF market price is explicitly an investable proxy and never replaces the underlying yield/OAS metric.

## Trading 212 behavior
- Before credentials are saved: no T212 badges or T212-related controls outside Settings.
- Settings always shows key/secret entry and SAVE.
- TEST/REMOVE are hidden until configured.
- Full Android build: Android Keystore AES/GCM credential store.
- Manual WebView fallback APK: non-extractable WebCrypto AES-GCM key stored in IndexedDB plus encrypted credential blob. No plaintext localStorage credential storage.
- T212 status is shown only for ETF proxies/stocks, based on the official instrument catalogue, not portfolio positions.

## Data freshness and failure isolation
Each source is loaded independently. One missing country/source does not invalidate the full Bonds tab. Missing items remain N/A. The tab distinguishes daily Bund/Treasury/OAS data from monthly sovereign benchmark context and retains observation dates.

## Relationship to Early Warning
Bonds only **reads** existing Early Warning values and shows a diagnostic CONFIRMED / NOT CONFIRMED / N/A context. No Early Warning formula or Global Risk formula is changed.

## Mobile UI structure selected
1. Global Bond Regime
2. U.S. Treasury curve + curve classification
3. Germany Bund curve
4. Euro sovereign spreads
5. Credit stress
6. Real yields & inflation expectations
7. UK/Japan context
8. Bond ETF proxies + conditional T212 tradability
9. Early Warning context / coverage

This ordering puts the underlying rates/spreads before the investable proxies.
