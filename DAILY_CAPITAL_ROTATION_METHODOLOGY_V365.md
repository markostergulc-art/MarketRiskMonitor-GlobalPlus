# Daily Capital Rotation Methodology — v3.6.5 / BUILD115

## Scope

This release changes only the Capital Rotation runtime and release metadata. The primary Capital Rotation signal is now a latest-completed-session, benchmark-relative signal. It is an **implied/relative rotation** diagnostic derived from market prices and confirmations; it is not a claim of measured ETF/fund dollar flows.

## Previous methodology (v3.6.4 / BUILD114)

The prior primary Capital Rotation score was medium-term and combined:

- Early Warning compatibility: 30%
- Relative price trend: 20%, primarily 63 trading sessions (approximately 3 months), with shorter-history fallback
- Volatility behavior: 15%
- Cross-asset confirmation: 15%
- Correlation regime: 10%
- Stress-type compatibility: 10%

That methodology was useful for regime context but could react too slowly for the user's requested daily rotation view.

## New primary Daily Rotation methodology

### Observation unit

The primary observation is the **latest completed U.S. trading session**. The engine never intentionally treats an incomplete current session as the official daily result. Existing BUILD114 completed-session, weekend/holiday, cache and freshness logic is retained.

### Benchmark and sector universe

Benchmark: **SPY**.

U.S. sector proxies:

| Sector | Proxy |
|---|---|
| Technology | XLK |
| Financials | XLF |
| Energy | XLE |
| Industrials | XLI |
| Healthcare | XLV |
| Utilities | XLU |
| Consumer Discretionary | XLY |
| Consumer Staples | XLP |
| Communication Services | XLC |
| Materials | XLB |
| Real Estate | XLRE |

Auxiliary confirmation proxies include IWM, HYG, LQD, TLT, GLD, EEM, VGK and EWJ where the existing architecture can provide valid aligned data.

### Core calculation

For each sector on the latest completed session:

`Sector 1D Return = latest close / previous completed close - 1`

`SPY 1D Return = latest SPY close / previous completed SPY close - 1`

`Daily Excess Return = Sector 1D Return - SPY 1D Return`

Sector and benchmark points are intersected by date before the return is calculated. A sector observation from one date is not compared with a benchmark observation from another date.

### Daily score

The Daily Rotation Score is bounded to **-100 ... +100**.

Configured component weights:

| Component | Nominal weight |
|---|---:|
| 1D excess return vs SPY | 45% |
| Cross-sectional sector rank | 20% |
| Volume confirmation | 15% |
| Constituent breadth | 10% |
| Cross-asset confirmation | 10% |

The application currently does **not** have a sufficiently reliable constituent-level breadth feed for this module. Breadth therefore remains `N/A`, not zero. Available components are re-normalized rather than penalizing the sector for missing breadth.

### Materiality controls

- Full 1D-excess magnitude scale: **1.25 percentage points**.
- Rank materiality gate: **0.25 percentage points** of absolute daily excess.
- Cross-sectional rank is attenuated when the underlying excess return is trivial so that a tiny numerical ranking difference cannot by itself create a strong signal.
- Volume uses the latest session volume relative to the median of the preceding up-to-20 valid sessions. Missing volume is `N/A`, never zero.

### Status bands

| Daily score | Status |
|---:|---|
| +60 to +100 | Strong Relative Inflow |
| +20 to +59 | Relative Inflow |
| -19 to +19 | Neutral / Mixed |
| -20 to -59 | Relative Outflow |
| -60 to -100 | Strong Relative Outflow |

These labels describe relative/implied rotation, not measured dollar flows and not buy/sell recommendations.

## 5D context

Five-session excess return is calculated separately as context. It has **0% direct weight** in the primary Daily Rotation Score.

This allows combinations such as:

- Daily positive + 5D negative: possible early positive reversal.
- Daily negative + 5D positive: one-day weakening inside a positive short-term context.

20D and 63D data may remain available elsewhere as context but are not inputs to the primary Daily Rotation Score.

## Daily change diagnostics

The module also computes, where valid history exists:

- previous-session Daily Rotation Score;
- previous daily rank;
- rank change;
- score acceleration/deceleration;
- positive/negative reversal;
- new leader / new laggard detection;
- five-session Daily Score history;
- growth vs defensive spread;
- cyclical vs defensive spread;
- percentage of valid sectors outperforming SPY.

A reversal requires a material sign/magnitude change; trivial oscillations around zero are not intended to be highlighted as major reversals.

## Daily risk-appetite confirmation

Cross-asset confirmation is a separate daily context built from available aligned components and re-normalized over the components that are valid:

- SPY absolute 1D move: 30%
- IWM excess vs SPY: 25%
- HYG vs LQD relative move: 25%
- inverse TLT daily move: 20%

This confirmation cannot replace the primary sector-vs-SPY signal.

## Data freshness and failure behavior

Each result preserves the distinction between:

- observation date;
- retrieval timestamp;
- calculation timestamp.

States remain: `LIVE`, `CACHED`, `STALE`, `PARTIAL`, `ERROR`.

A failed sector/provider does not zero-fill the result or invalidate every other sector. Missing or stale required data lower coverage/confidence and are shown explicitly.

## Interpretation rule

The safest interpretation is:

**"Which sectors gained or lost relative leadership during the latest completed trading session?"**

It is not equivalent to audited ETF creation/redemption data, institutional flow-of-funds data or a statement that a specific dollar amount physically moved from one sector to another.
