# PHASE 5 COMPLETE — Factor Architecture / Redundancy Reduction

Baseline: `3.5.1.52` / versionCode `85`  
Target: `3.5.1.53` / versionCode `86`

## Scope

Phase 5 changes the production GLOBAL Risk aggregation path from broad buckets that could contain multiple correlated raw signals into an explicit, economically interpretable hierarchy:

```text
RAW INDICATORS
    ↓
BOUNDED SUBFACTORS
    ↓
ECONOMIC FACTOR FAMILIES
    ↓
GLOBAL RISK
```

No raw indicator was removed from its existing display. No new provider, network request, cache namespace, lazy-load path, navigation path or refresh behavior was introduced.

Phase 1 freshness, Phase 2 coverage/LIMITED DATA protection, Phase 3 confidence formula and Phase 4 Early Warning timing semantics are retained.

## Production factor architecture

| Factor | Weight | Internal subfactors |
|---|---:|---|
| Credit | 15% | Credit spreads; traded credit; bank credit; property/CRE credit; NBFI/leveraged finance |
| Funding & Liquidity | 20% | Money-market funding; official liquidity plumbing; global USD funding; system financial conditions |
| Volatility | 15% | Equity volatility; options term/tail structure; rates volatility; cross-asset volatility breadth |
| Equity Internals | 10% | Global market internals; breadth & concentration |
| Rates | 8% | Core sovereign stress; Treasury absorption; Euro fragmentation; yield-curve regime |
| Macro Growth | 10% | Country macro context; recession cycle; trade/shipping cycle |
| Inflation | 5% | Inflation detector |
| FX | 7% | Country FX stress; cross-asset USD/carry stress |
| Commodities | 5% | Energy stress; precious-metals stress; industrial-demand ratio |
| Correlation / Contagion | 5% | Realized cross-market correlation; implied equity correlation; cross-market drawdown breadth |

Total production weight: **100%**.

## Weight-preserving migration

Phase 5 deliberately avoids an unexplained broad re-weighting.

Legacy v3.5.1.52 broad allocation:

```text
Credit/Funding 25
Liquidity      10
Volatility     15
Equity         10
Macro          15
Rates           8
FX              7
Commodities     5
Correlation     5
```

Phase 5 allocation preserves the same broad budgets:

```text
Credit 15 + Funding/Liquidity 20 = 35
Macro Growth 10 + Inflation 5      = 15
Volatility                         = 15
Equity Internals                   = 10
Rates                               = 8
FX                                  = 7
Commodities                         = 5
Correlation/Contagion               = 5
```

The purpose is redundancy control, not historical weight optimization.

## Redundancy controls

### Credit

HY OAS, IG OAS, HYG/LQD volatility and other credit diagnostics no longer behave as an unrestricted set of independent final-model votes. They first collapse into bounded credit subfamilies, and the Credit factor then receives its fixed 15% production weight.

### Volatility

VIX, VIX9D, VVIX, SKEW and related option-volatility diagnostics are not allowed to multiply final factor weight simply because more series are available. The option-shape/tail series first collapse into one subfactor. MOVE/rates volatility and cross-asset volatility breadth remain economically distinct subfactors.

A duplicate identical raw row with the same signal name is de-duplicated before subfactor aggregation.

### Funding / Liquidity

Money-market spreads, liquidity plumbing, global USD funding and broader financial-condition indices remain distinct internal subfactors instead of becoming separate top-level votes.

### Correlation / Contagion

The Phase-5 production factor uses realized correlation, implied correlation and drawdown breadth. It deliberately avoids reusing the volatility component of the existing contagion diagnostic, reducing direct overlap with the dedicated Volatility factor.

## Missing-data behavior

Missing factors and subfactors remain missing; they are never converted to zero risk.

Within a factor, available subfactors are renormalized only after availability is established. Factor completeness records how many expected independent subfactor groups are represented.

GLOBAL eligibility still uses the Phase-2 protection:

- minimum effective coverage;
- minimum factor-group count;
- missing/insufficient inputs can produce `LIMITED DATA` rather than a misleading normal status.

## Structural vulnerability treatment

`Structural Financial Vulnerability Composite` remains available as a **diagnostic-only** factor with production weight `0` in Phase 5.

Fiscal Stress is intentionally not inserted into the production GLOBAL factor architecture in this phase. The remediation plan reserves its structural-vulnerability role for the later fiscal/final-architecture phases. Prematurely assigning it a production weight here would exceed Phase-5 scope.

## Before / after diagnostics

Every GLOBAL calculation now retains an auditable `legacyComparison` object containing:

- `oldGlobalRisk`
- `newGlobalRisk`
- `difference`
- legacy component values
- new factor contributions
- legacy weights
- new weights
- `weightPreservingSplit: true`

The methodology/data audit export also records factor details, subfactor inputs, completeness, freshness and contributions.

### Deterministic validation fixture

Using the Phase-5 deterministic fixture:

```text
Old GLOBAL Risk: 41
New GLOBAL Risk: 42
Difference:      +1
```

The +1 change is explained by the factor-family regrouping and bounded subfactor aggregation; it is not caused by a broad weight retune.

New fixture factor scores:

```text
Credit                    45.00
Funding & Liquidity       33.67
Volatility                45.00
Equity Internals          46.00
Rates                     41.25
Macro Growth              40.83
Inflation                 50.00
FX                        36.25
Commodities               44.00
Correlation / Contagion   46.69
```

Rounded new GLOBAL Risk = `42`.

No live runtime snapshot was bundled in the supplied source archive, so current-market before/after values are intentionally not fabricated. The app now produces the comparison automatically when real runtime data are loaded.

## UI changes

Normal navigation and raw indicator views remain unchanged.

Small Phase-5 presentation changes:

- Overview GLOBAL risk-driver labels use the new factor-family names and weights.
- `riskWhy()` explanations use the Phase-5 factor contributions.
- raw Early Warning, cross-asset, macro, commodity and market diagnostics remain visible.

No unrelated redesign was performed.

## Functions added

- `factorRowsV53()`
- `factorRowsMatchV53()`
- `factorSubRowsV53()`
- `factorSubValueV53()`
- `factorRecordV53()`
- `factorContributionV53()`
- `legacyGlobalRiskV52()`
- `globalFactorArchitectureV53()`

## Existing functions changed in Phase-5 scope

- `globalRiskModel()` — production aggregation now uses factor families and exports old/new diagnostics.
- `riskWhy()` — uses Phase-5 factor labels/weights.
- `renderOverview()` — displays the new factor-family risk-driver structure.
- `refreshAll()` — persists factor details, contributions, diagnostics and legacy comparison in GLOBAL state.
- `globalRiskAuditRowsV47()` — exports Phase-5 architecture, contributions and before/after diagnostics.
- `methodologyMarkdownV47()` — documents the new factor architecture and weighting.

## Protected areas verified unchanged

The Phase-5 regression suite verifies protected methodology from earlier phases remains unchanged where Phase 5 does not require modification, including:

- `riskBand()`
- `weightedScore()`
- `globalContagion()`
- inflation/recession detector functions
- fiscal calculations
- commodity calculations
- equity-internals calculations
- correlation-regime functions
- loading scheduler
- network fetch wrapper
- Phase-1 freshness functions
- Phase-2 country coverage
- Phase-3 confidence formula
- Phase-4 Early Warning classification/layer functions

No additional `fetch()` call site was introduced: baseline `6`, target `6`.

## Tests

**PASS — 289/289 selected automated assertions**, plus structural APK verification.

- Phase 5 factor architecture: 29/29
- Phase 5 regression: 76/76
- Phase 4 semantics: 33/33
- Phase 3 confidence on Phase-5 architecture: 24/24
- Phase 1 freshness: 19/19
- parser fixtures: 29/29
- AGSI country fixtures: 21/21
- AGSI coverage fixtures: 10/10
- fiscal freshness/loading: 23/23
- native export bridge: 25/25

Fallback APK structural verification also passes for package/version/minSdk/targetSdk/launcher, ZIP integrity/alignment, exact embedded HTML, storage-permission constraints and the native WebView export bridge.

## Regression checks

**PASS.**

The original v3.5.1.51 Phase-3 confidence harness expected the old v3.5.1.52 `globalRiskModel()` dependency shape. Phase 5 therefore adds a compatibility harness that exercises the unchanged Phase-3 confidence formula through the new factor architecture. The historical test file itself is retained unchanged.

## Known limitations

1. Factor-family membership and equal weighting of available subfactors are transparent Phase-5 heuristics; they are not claimed to be historically optimal.
2. No point-in-time backtest or weight optimization is performed here. That belongs to Phase 14.
3. Country equity-internals aggregation still does not implement the future regional/capped global-equity weighting methodology; that is Phase 7.
4. Correlation remains based on the current descriptive same-date methodology; lag/timezone correction is Phase 8.
5. Yield-curve information remains in the Rates factor for continuity even though Phase 4 also identifies it as a leading signal. Final current-condition vs leading-layer separation belongs to Phase 15.
6. Structural Financial Vulnerability is diagnostic-only; Fiscal Stress is not production-weighted in GLOBAL Risk yet.
7. A current live-market old/new diagnostic cannot be reproduced offline from this source archive because no runtime data snapshot was supplied. The deterministic fixture and runtime `legacyComparison` mechanism provide reproducible validation without inventing market values.
8. A fully signed release APK cannot be produced in this environment without the existing release keystore/signing identity. A new signing identity is intentionally not generated because it would break upgrade compatibility.

## Next phase

Phase 6 — Make All 0–100 Transforms Auditable.

Do not proceed automatically unless requested.
