# Bosnia / Global Market Health Root-Cause Report — v3.5.1.42

## Source state

Bosnia and Herzegovina is intentionally configured as a limited-data market:

- Market: `SASX-10`
- Provider marker: `sase`
- `limited: true`
- No fabricated Yahoo substitute is used.
- `buildCountries()` deliberately leaves the unsupported live headline-history series as `null`.

This is correct source semantics: unavailable data is not zero.

## What the source review proved

The v3.5.1.41 aggregate did **not** directly average Bosnia's null internals score as zero. `equityInternalsRecord()` could return an unavailable record and the final aggregate already filtered to finite scores.

Therefore the simplistic explanation “Bosnia enters the denominator as zero” is **not supported by the source**.

The architectural defect was elsewhere: `buildEquityInternals()` was an all-or-nothing async build without per-market fault containment. If any market-internals path threw, the outer `refreshAll()` catch left the complete `equity` object unavailable, so the Global Equity Health panel rendered N/A. One unsafe example in the v3.5.1.41 path was appending DSPX data through `cross.indicators` without first proving that the cross-asset object existed.

Switching the UI into Croatian changes the active universe to include Croatia and Bosnia and triggers a full refresh. That makes the user's observation reproducible as a refresh-path symptom, but the screenshot alone does not prove that Bosnia's null series itself was the exception that aborted the build.

v3.5.1.42 therefore fixes the actual robustness gap rather than inventing Bosnia data.

## Fix

v3.5.1.42 adds explicit eligibility for each market/metric path:

- at least 60 valid headline history observations;
- finite internals score;
- positive finite internals coverage.

Ineligible markets stay visible but are excluded only from the affected global denominator.

Each market-internals calculation is isolated with its own failure handling. A failed market receives a neutral `LIMITED DATA` record instead of aborting the complete global build. The DSPX/cross-asset append is also guarded against an unavailable cross-asset object.

The aggregate now uses only eligible records. It becomes N/A only when fewer than 40% of configured markets are eligible.

For 37 configured markets, the minimum is 15 eligible markets.

The new eligibility/coverage metadata is persisted in the app snapshot so a restart does not show an incorrect `0/37` availability count beside a cached valid score.

## Deterministic acceptance scenarios

| Scenario | Result |
|---|---|
| 36 valid markets | Global Market Health = 40 in fixture |
| Same 36 + Bosnia with missing internals | Global Market Health remains 40; 36/37 eligible |
| One market has NaN score | NaN market excluded; remaining score stays finite |
| One market has zero history | market excluded even if a stray score exists |
| 14 valid out of 37 | aggregate correctly becomes N/A; minimum is 15 |
| One market throws an internal exception | error isolated; successful markets remain usable |
| Cached v3.5.1.42 snapshot | eligibility counts/minimum survive serialization |

The fixture score of 40 is a deterministic QA value, not a claim about the current live market score.

## Bosnia UI

Bosnia remains in the Croatian Markets universe. When headline/internal coverage is insufficient it is shown as **LIMITED DATA** in neutral gray rather than receiving a misleading green/orange/red market-status label.

Macro/other context may still exist, but unsupported equity-internals data is not fabricated.

## Regression impact

No Global Risk, Macro, Correlation, S&P, Commodity, ETF, dividend or company-risk methodology was changed. The change is limited to market-data eligibility, snapshot metadata, fault containment and presentation of unavailable market data.
