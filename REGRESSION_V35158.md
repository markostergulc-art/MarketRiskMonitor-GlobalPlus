# Regression Report — Market Risk Monitor Global+ v3.5.1.58

## Baseline

- Baseline: v3.5.1.57 / versionCode 90
- Target: v3.5.1.58 / versionCode 91
- Scope: Phase 8 — Global Correlation / Timezone Correction

## Intended production changes

Phase 8 intentionally adds a second correlation architecture and changes only the wiring of GLOBAL systemic/contagion correlation inputs plus associated UI/export/persistence.

New functions:

- `correlationSessionV58`
- `correlationAlignmentRuleV58`
- `lagAwarePairsV58`
- `lagAwareCorrV58`
- `lagAwareCorrMatrixV58`
- `lagAwareCorrelationRegimeDiagnosticV58`
- `systemicCorrelationCardHtmlV58`
- `correlationDualCardHtmlV58`

Existing functions intentionally modified:

- `refreshAll`
- `renderCorr`
- `renderOverview`
- `correlationRegimeCardHtml`
- `serializableState`
- `historySave`
- `correlationAuditRowsV47`
- `auditSnapshotV47`
- `methodologyMarkdownV47`

No existing production function was removed.

## Protected descriptive correlation behavior

Verified byte-identical to v3.5.1.57:

- `returns()`
- `pearson()`
- `alignedCorr()`
- `corrMatrix()`
- `correlationPairStats()`
- `correlationRegimeFromStats()`
- `correlationRegimeDiagnostic()`

Therefore the raw descriptive matrix is not silently replaced by the new systemic methodology.

## Systemic calculation regression

The Phase-8 test fixture verifies:

- US↔Japan same-date = 0.1566; lag-aware = 1.0000 when Japan is constructed to follow the prior U.S. return.
- Every lagged US observation date is strictly earlier than its paired Japan date.
- No U.S. return is duplicated across multiple Asian observations.
- Germany↔Japan remains unchanged under its fixed same-date rule.
- US↔Germany remains unchanged under its fixed same-date overlap rule.
- Missing series remain `null` / unavailable rather than zero correlation.
- Pair coverage declines explicitly when markets are unavailable.
- Matrix symmetry is preserved.

## Production wiring regression

Verified:

- descriptive `corrMatrix()` is still built for UI/exploration;
- systemic `lagAwareCorrMatrixV58()` is built independently at 60D;
- `globalContagion()` receives the systemic matrix;
- cross-asset systemic finalization receives the systemic matrix;
- GLOBAL Risk receives the systemic matrix for its correlation/contagion factor;
- hidden-risk systemic diagnostics receive the systemic matrix;
- country-level legacy correlation handling remains on the descriptive matrix;
- changing the descriptive correlation window cannot mutate the fixed GLOBAL systemic matrix.

## Previous-phase compatibility

PASS:

- Phase 7 equity weighting: 37/37
- Phase 6 auditability compatibility: 67/67
- Phase 5 factor architecture: 29/29
- Phase 4 Early Warning semantics: 33/33
- Phase 3 confidence compatibility: 24/24
- Phase 1 freshness semantics: 19/19
- Fiscal/loading compatibility: 23/23
- Parser fixtures: 29/29
- AGSI country fixtures: 21/21
- AGSI coverage fixtures: 10/10
- Native export bridge: 25/25

Raw `fetch()` call sites: **6 in v3.5.1.57 → 6 in v3.5.1.58**.

## Release QA

**388/388 JavaScript assertions PASS**, plus:

- `node --check app.js` PASS
- fallback/manual APK manifest/package/version/minSdk/targetSdk/launcher PASS
- APK ZIP integrity PASS
- STORED-entry alignment PASS
- embedded `index.html` byte-identical to release source PASS
- no broad storage permission PASS
- native export bridge presence/wiring PASS

## Signing verification

Installable v3.5.1.58 APK:

- v1/JAR signature: PASS
- APK Signature Scheme v2: PASS
- APK Signature Scheme v3: PASS
- certificate SHA-256 identical to v3.5.1.57

## Result

**PASS — no regression detected outside the intended Phase-8 systemic correlation/timezone scope.**
