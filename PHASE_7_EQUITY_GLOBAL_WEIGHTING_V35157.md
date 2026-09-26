# Market Risk Monitor Global+ — Phase 7 Equity Global Weighting

## PHASE 7 COMPLETE

**Baseline:** 3.5.1.56 / versionCode 89  
**Target:** 3.5.1.57 / versionCode 90

## Objective

Replace the previous equal-market GLOBAL equity-internals aggregation with a transparent regional weighting model that gives structurally important markets more influence without allowing the United States or any single market to dominate the global signal.

This phase changes the **aggregation of global equity internals only**. It does not change raw market indicators, Phase-5 GLOBAL factor weights, Country Risk scoring, Early Warning scoring, Macro scoring, Fiscal scoring, correlation methodology, refresh/cache/lazy-loading architecture, or the Phase-6 transform formulas.

## Production methodology

### Fixed regional weights

| Region | Weight |
|---|---:|
| North America | 24% |
| Europe | 24% |
| Developed Asia-Pacific | 18% |
| China / Hong Kong | 12% |
| Emerging Asia | 10% |
| Latin America | 6% |
| Middle East / Africa | 6% |
| **Total** | **100%** |

### Intra-region market importance

Every active core market is mapped to exactly one region and has an explicit positive structural-importance coefficient. These coefficients are **HEURISTIC structural proxies**, not live market-cap observations and not empirically optimized weights.

Within a region, eligible markets are normalized from those coefficients. When more than one market is eligible, any single market is capped at **70% of its region**. This prevents a very large market from consuming the full regional contribution while still avoiding the old assumption that every market is equally important.

For example, the United States belongs to a 24% North America block. With the 70% intra-region cap, its maximum direct fixed-weight contribution is 16.8% of the global equity-internals layer when both North American markets are eligible.

### Missing data and coverage

Missing markets are never converted to zero risk. A missing region reduces weighted coverage. The model explicitly exports:

- `weightedCoveragePct`
- `regionWeightCoveragePct`
- `missingRegionWeightPct`
- `renormalized`
- `renormalizationFactor`
- represented-region count
- per-region and per-market contribution diagnostics

A normal GLOBAL equity-internals score requires:

- at least **3 represented regions**; and
- at least **40% weighted coverage**.

If a region is unavailable but the eligibility gate still passes, available regional weights may be renormalized for the numeric score, but the missing regional weight remains explicitly disclosed and lowers coverage/confidence. It is never silently treated as complete data.

## GLOBAL Risk integration

The Phase-5 `EQUITY_INTERNALS` factor remains **10%** of GLOBAL Risk. Only its internal global market aggregation changed:

`eligible market internals → capped intra-region weighting → fixed regional weighting → Equity Internals factor → GLOBAL Risk`

The Phase-5 factor budget is unchanged.

## Before/after deterministic validation

The old equal-market calculation is retained as a diagnostic (`legacyEqualMarketScore`) so every current calculation can expose old vs new behavior.

| Scenario | Old equal-market | Phase-7 regional | Interpretation |
|---|---:|---:|---|
| Normal regime | 30 | 30 | Neutral baseline preserved |
| US-only stress | 32 | 40 | Large-market stress is no longer diluted by many small markets |
| Europe-only stress | 49 | 42 | Europe is represented by its fixed regional budget rather than market count |
| Asia-only stress | 47 | 50 | Asia stress reflects regional economic importance rather than number of listed markets |

Additional deterministic checks confirm that a stressed Croatian market moves the global equity score less than a stressed German market.

A fixture with the entire China / Hong Kong region missing retains a score of 30 rather than inserting zero risk; the missing **12%** regional weight is disclosed and weighted coverage falls to **88%**.

A fixture with only North America and Europe available is rejected by the eligibility gate because only two regions are represented, even though their fixed weights sum to 48%.

## Files changed

Production/release files:

- `app.js`
- `app/src/main/assets/index.html`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java` — versioned user-agent only
- `app/build.gradle`
- `build_release.sh`

Phase-7 QA/support files:

- `tests/phase7_equity_weighting_v35157.js`
- `tests/phase6_auditability_phase7_compat_v35157.js`
- `tests/phase5_factor_architecture_phase7_compat_v35157.js`
- `tests/confidence_model_phase7_compat_v35157.js`
- `tests/fiscal_freshness_loading_phase7_compat_v35157.js`
- `tests/phase7_release_qa_v35157.sh`
- `tools/build_manual_apk_v35157.py`
- `tools/verify_fallback_apk_v35157.py`
- `app_v35156_baseline.js` — regression fixture

## Functions changed

Existing production functions intentionally changed:

- `buildEquityInternals()`
- `factorSubValueV53()` — accepts a completeness ratio for the regional equity aggregate
- `factorRecordV53()` — propagates subfactor completeness without changing factor score weighting
- `globalFactorArchitectureV53()` — consumes the Phase-7 regional equity aggregate
- `renderMarkets()` — displays weighted regional diagnostics
- `auditSnapshotV47()` — exports Phase-7 methodology metadata
- `exportDataV47()` — adds `equity_regions.csv`
- `methodologyMarkdownV47()` — documents the Phase-7 methodology

New production functions:

- `cappedNormalizeV57()`
- `equityRegionV57()`
- `aggregateEquityInternalsV57()`

The legacy `aggregateEquityInternalsV42()` remains in place for before/after diagnostics.

## Regression protection

The following key production functions are byte-identical to v3.5.1.56:

- `globalRiskModel()`
- `refreshAll()`
- `weightedScore()`
- `riskBand()`
- all Phase-6 scoring transforms checked by the compatibility suite

Raw `fetch()` call sites remain **6 → 6**.

No new provider dependency was introduced.

## QA results

Release QA: **318/318 JavaScript assertions PASS**, plus JavaScript syntax check and structural APK verification.

Included suites:

- Phase 7 equity weighting: 37/37
- Phase 6 compatibility/auditability: 68/68
- Phase 5 architecture compatibility: 29/29
- Phase 4 semantics: 33/33
- Phase 3 confidence compatibility: 24/24
- Phase 1 freshness semantics: 19/19
- Fiscal/loading compatibility: 23/23
- Parser fixtures: 29/29
- AGSI country fixtures: 21/21
- AGSI coverage fixtures: 10/10
- Native export bridge: 25/25
- APK structure/alignment/bridge checks: PASS

## Known limitations

1. Intra-region importance coefficients are transparent heuristics. They are not live market-cap weights and are not claimed to be empirically optimal.
2. Regional weights have not yet been optimized or historically validated. Weight sensitivity belongs to the later point-in-time historical-validation phase.
3. The source package does not include a live production market snapshot, so normal/US/Europe/Asia validation uses deterministic fixtures. The application exports actual before/after diagnostics when live data are available.
4. Cross-region asynchronous trading/timezone alignment is intentionally not addressed here. That is Phase 8.

## Next phase

**PHASE 8 — Global Correlation / Timezone Correction**
