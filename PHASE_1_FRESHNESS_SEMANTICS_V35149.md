# Market Risk Monitor Global+ — Phase 1 Freshness Semantics

Date: 2026-09-14

## PHASE 1 COMPLETE

Baseline: **v3.5.1.48 / versionCode 81**  
Target: **v3.5.1.49 / versionCode 82**

Phase 1 implements only the P0 freshness-semantics remediation from the methodology audit. No risk-score weights, score transforms, Global Risk calculations, Fiscal Stress calculations, loading priorities, chart logic, market universe, export transport, providers or cache architecture were changed.

## Root problem

The v3.5.1.48 generic freshness helper primarily classified observations from their age. That could incorrectly label a slow or scheduled official series as STALE even when the observation was still the latest official release. The actual v48 export exposed concrete examples: weekly financial-condition series and quarterly SLOOS/delinquency observations did not receive consistent semantics across code paths.

Phase 1 separates two questions:

1. **How old is the observation?**
2. **Should a newer release already exist?**

They are no longer treated as equivalent.

## Files changed

Production:

- `app.js`
- `app/build.gradle`
- `app/src/main/assets/index.html`
- `build_release.sh`

Release/build support:

- `tools/build_manual_apk_v35149.py`
- `tools/verify_fallback_apk_v35149.py`

Tests added/adapted:

- `tests/freshness_semantics_v35149.js`
- `tests/phase1_regression_v35149.js`
- `tests/market_health_regression_v35149.js`
- `tests/market_card_sparkline_period_regression_v35149.js`
- `tests/graph_period_loading_ui_regression_v35149.js`
- `tests/protected_hashes_phase1_v35149.json`

Native Android production source is byte-identical to v3.5.1.48.

## Functions / metadata added

- `FRED_RUNTIME_META_V49`
- `FRED_FREQUENCY_V49`
- `FRED_RELEASE_RULES_V49`
- `addUtcDaysV49()`
- `normalizeFrequencyV49()`
- `fredFrequencyV49()`
- `fredSeriesIdV49()`
- `freshnessModelV49()`
- `freshnessFieldsV49()`
- `annotateMacroCycleFreshnessV49()`

Existing `freshnessStatus()` now delegates classification to the release-aware model.

## New freshness record

Where information is available, a freshness record can contain:

- `observationDate`
- `retrievedAt`
- `frequency`
- `releaseDate`
- `expectedNextRelease`
- `observationAge`
- `observationAgeDays`
- `releaseStatus`
- `freshnessStatus`

Unavailable values remain null/unknown. Phase 1 does not fabricate provider publication timestamps or next-release dates when a dependable rule is not available.

## Freshness statuses

### CURRENT

The current observation is consistent with the expected publication cadence and a newer release is not yet due.

### LATE

A newer release is expected around now, but the grace window has not yet justified classifying the loaded observation as fully stale.

### OLD_BUT_CURRENT_RELEASE

The observation is slow-moving/old, but there is no evidence in the implemented release model that a newer official observation should already have been loaded.

### STALE

A newer release is expected and the loaded observation has materially passed that release point without being replaced.

### UNKNOWN

The application cannot determine release currency reliably from the metadata/rules available to it.

## Frequency-specific behavior

The release model distinguishes:

- daily
- weekly
- monthly
- quarterly
- annual
- event-driven / unknown

There is no single universal N-day stale threshold.

Only a small set of weekly FRED series with validated recurring cadence rules receives a computed `expectedNextRelease` in this phase. Quarterly series whose FRED page does not provide a dependable next release keep `expectedNextRelease=null` rather than receiving a guessed date.

## Validated P0 series

The deterministic fixtures explicitly cover:

- NFCI
- NFCI Risk
- NFCI Credit
- STLFSI4
- bank deposits (`DPSACBW027SBOG`)
- SLOOS (`DRTSCILM`)
- business-loan delinquency (`DRBLACBS`)
- real-estate / CRE delinquency series (`DRSREACBS`, `DRCRELEXFACBS`, `DRCRELEXFOBS`)

Public FRED cross-checks on 2026-09-14 confirmed the key cases used by the fixtures:

- NFCI family: observation 2026-09-04, updated 2026-09-10, next release 2026-09-16.
- STLFSI4: observation 2026-09-04, updated 2026-09-09, next release 2026-09-16.
- deposits: observation 2026-09-02 with next release 2026-09-18 for the weekly H.8 view.
- SLOOS: Q3 2026, updated 2026-08-03, next release not available on FRED.
- business-loan delinquency: Q2 2026, updated 2026-08-25, next release not available on FRED.

## Behavior changed

- A weekly observation is no longer automatically STALE merely because a generic age threshold was crossed while the verified next publication is still in the future.
- Slow quarterly data can be labeled `OLD_BUT_CURRENT_RELEASE` instead of being treated as stale solely because it is months old.
- Known expected-release slippage progresses through `LATE` and then `STALE`.
- Unsupported schedules remain `UNKNOWN` / provider-schedule-unknown rather than receiving invented dates.
- Early Warning and macro audit exports include the richer freshness metadata.
- Indicator detail can show expected-next-release/release-status information where available.

## Calculations changed

**None in Phase 1.**

The following scoring/aggregation functions were verified byte-identical to v3.5.1.48, including:

- `weightedScore()`
- `riskBand()`
- `globalRiskModel()`
- `globalContagion()`
- `marketMetrics()`
- `trendRisk()`
- `inflationDetector()`
- `recessionLeadingAndComposite()`
- `buildMacroCycle()`
- `fiscalScoreRowsV43()`
- `fiscalFreshnessV44()`
- `commodityShockRisk()`
- `aggregateEquityInternalsV42()`
- correlation functions
- company-risk functions
- loading scheduler functions

`fetchWithTimeout()` is also byte-identical.

## UI changed

Only existing freshness detail presentation was extended where metadata exist. Navigation, screen layout, refresh controls, progress bars and chart/sparkline rendering are unchanged.

## Tests

- Freshness semantics: **19/19 PASS**
- Phase-1 protected/consolidated regression: **60/60 PASS**
- Market Health / Overview: **32/32 PASS**
- Markets-card sparkline period: **42/42 PASS**
- Graph-period / loading UI: **43/43 PASS**
- Native export bridge: **25/25 PASS**
- Fiscal score regression: **48/48 PASS**
- Fiscal freshness/loading: **23/23 PASS**
- EU gas country fixtures: **21/21 PASS**
- Storage coverage: **10/10 PASS**
- Parser fixtures: **29/29 + 29/29 + 22/22 PASS**
- Native ZIP/Base64 roundtrip: **3/3 PASS**

Total deterministic checks executed for this release: **406/406 PASS**.

## APK/static release validation

PASS:

- package/version/minSdk/targetSdk/launcher
- APK ZIP integrity
- STORED-entry 4-byte alignment
- embedded `index.html` byte-identical to release source
- V1/JAR signature verification
- V2 signature verification
- V3 signature verification
- signing certificate continuity
- native v48 export bridge retained in DEX
- no broad storage permission

## Known limitations

1. FRED CSV data used by production does not itself expose all publication-calendar metadata. Phase 1 therefore computes `expectedNextRelease` only for a small vetted set of recurring series; it does not scrape FRED pages or add extra network calls.
2. Holiday/revised publication calendars can deviate from simple cadence rules. Unsupported/uncertain cases remain unknown rather than being falsely precise.
3. Generic monthly classifications without a provider release schedule are cadence-aware but cannot prove that a newer release exists.
4. Physical Android/GrapheneOS launch/touch/network validation is **NOT EXECUTED** in this environment because no ADB-connected device is available.
5. Phase 2 coverage/eligibility remediation is intentionally not included in this release.

## Next phase

**Phase 2 — Coverage and LIMITED DATA eligibility gates.**

Per the phased validation rule, Phase 2 should not be merged into this v3.5.1.49 release.
