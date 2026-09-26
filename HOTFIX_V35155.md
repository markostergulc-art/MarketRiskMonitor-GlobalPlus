# Market Risk Monitor Global+ v3.5.1.55 — Refresh Completion / Overview Corrective Hotfix

## Baseline

- Baseline: `3.5.1.54` / versionCode `87`
- Target: `3.5.1.55` / versionCode `88`
- Scope: corrective hotfix before Phase 6

## User-visible failure

On-device v3.5.1.54 could show several providers as ONLINE, finish refresh at 100%, and then display:

- `N/A` GLOBAL score;
- `INSUFFICIENT COVERAGE`;
- `Confidence: LIMITED`;
- Data / Factors / Freshness at `0%`;
- cached/offline status.

The GLOBAL card also rendered confidence and all coverage values inside the main H2, producing an oversized multi-line heading on a phone.

## Root cause

The active v3.5.1.54 JavaScript still called:

`hiddenRiskAnomaly(countries, combinedEarly, crossAsset, corr)`

but the definitions of both:

- `anomalyFamily()`
- `hiddenRiskAnomaly()`

were no longer present in the active runtime bundle.

Therefore the refresh could successfully retrieve provider data and then fail during post-fetch special-risk processing with a JavaScript `ReferenceError`. The outer refresh fallback handler interpreted this as a refresh-wide failure. On a fresh install without a usable prior snapshot, the emergency fallback correctly avoided an infinite spinner but replaced the already-fetched partial live state with the deterministic 0%-coverage LIMITED state.

This explains why provider diagnostics could show successful Yahoo/FRED/World Bank/etc. calls while the Overview still displayed 0% coverage.

## Fix

### 1. Restore the missing diagnostic functions

The last known-good implementations of `anomalyFamily()` and `hiddenRiskAnomaly()` were restored byte-for-byte from the pre-remediation baseline. The Hidden Risk detector is diagnostic only and is not fed back into GLOBAL Risk, so this restoration does not alter Phase-5 production weighting.

### 2. Isolate optional diagnostics

`hiddenRiskAnomaly()` is now called through `safeDiagnosticV55()`. If an optional special-risk diagnostic fails, the diagnostic is omitted but the successfully loaded market/macro/credit data continue to the GLOBAL model and UI.

Additional non-core post-processing is also isolated: diagnostic explanations, top-risk explanation generation, history persistence, snapshot persistence, alert evaluation and deferred-loading scheduling cannot invalidate an otherwise completed core refresh.

### 3. Fix mobile GLOBAL card layout

The main heading now contains only:

`Regime: <regime>`

A separate compact metadata row displays:

`Confidence · data coverage · factor coverage · freshness coverage`

The former single oversized H2 string is removed.

### 4. Preserve fixed refresh-frame behavior

The fixed-height top status slot introduced in v3.5.1.54 remains unchanged. Refresh, fallback and background-loading cards continue to occupy the same reserved frame and therefore do not vertically push the page during state changes.

## Methodology protection

Verified unchanged relative to v3.5.1.54:

- `globalRiskModel()`
- `factorRecordV53()`
- `globalFactorArchitectureV53()`
- `countryCoverageV50()`
- `confidenceCompositeV51()`
- `earlyWarningLayersV52()`

The number of raw `fetch()` call sites is unchanged.

## Validation

- v3.5.1.55 corrective hotfix checks: `32/32 PASS`
- Phase-5 factor architecture: `29/29 PASS`
- Phase-4 timing semantics: `33/33 PASS`
- Phase-1 freshness fixture: `19/19 PASS`
- Restored Hidden Risk diagnostic executes successfully on a deterministic fixture.
- Embedded APK `assets/index.html` is byte-identical to the release source.
- APK ZIP structure/alignment: PASS.
- APK Signature Scheme v2: PASS.
- APK Signature Scheme v3: PASS.
- JAR/v1 signature: PASS.
- Signing certificate is the same release certificate used for v3.5.1.54, allowing an in-place upgrade from that APK.

## Remaining runtime limitation

Individual public providers can still be unavailable because of upstream errors, rate limits, CORS/network policy or provider changes. Such failures must reduce coverage/confidence rather than destroy successfully loaded independent data. This hotfix specifically removes the deterministic post-fetch JavaScript crash seen in v3.5.1.54.

Phase 6 should start only after this v3.5.1.55 build is confirmed on-device.
