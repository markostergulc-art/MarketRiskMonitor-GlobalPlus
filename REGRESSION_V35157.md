# Regression Report — Market Risk Monitor Global+ v3.5.1.57

## Baseline

- Baseline: v3.5.1.56 / versionCode 89
- Target: v3.5.1.57 / versionCode 90
- Scope: Phase 7 — Equity Global Weighting

## Intended production changes

The release intentionally changes only the GLOBAL equity-internals aggregation and its diagnostics/coverage plumbing.

Existing functions intentionally modified:

- `buildEquityInternals`
- `factorSubValueV53`
- `factorRecordV53`
- `globalFactorArchitectureV53`
- `renderMarkets`
- `auditSnapshotV47`
- `exportDataV47`
- `methodologyMarkdownV47`

New functions:

- `cappedNormalizeV57`
- `equityRegionV57`
- `aggregateEquityInternalsV57`

The text-escaping helper `esc()` is byte-identical to the baseline; a simple brace-based diff helper can falsely report it because its single-line object literal confuses naive function extraction.

## Protected behavior

Verified unchanged against v3.5.1.56:

- `globalRiskModel()` — byte-identical
- `refreshAll()` — byte-identical
- `weightedScore()` — byte-identical
- `riskBand()` — byte-identical
- Phase-6 0–100 scoring transforms covered by compatibility tests
- Early Warning semantics
- Country/global confidence semantics
- freshness semantics
- fiscal/loading scheduler behavior
- native export bridge

Raw `fetch()` call sites: **6 in v3.5.1.56 → 6 in v3.5.1.57**.

## Calculation regression

Phase-5 global factor weights remain unchanged. The only intentional production calculation delta is the input score and completeness supplied to the `EQUITY_INTERNALS` factor.

Deterministic scenarios:

- Normal: old 30 / new 30
- US-only stress: old 32 / new 40
- Europe-only stress: old 49 / new 42
- Asia-only stress: old 47 / new 50
- Missing China/Hong Kong: no zero-fill; 12% missing regional weight disclosed; weighted coverage 88%
- Two represented regions: ineligible despite 48% fixed regional weight
- 50% internal coverage: risk score unchanged while weighted coverage reports 50%

## Release QA

**318/318 JavaScript assertions PASS**, plus:

- `node --check app.js` PASS
- fallback/manual APK manifest/package/version/minSdk/targetSdk/launcher PASS
- APK ZIP integrity and STORED alignment PASS
- embedded `index.html` byte-identical to release source PASS
- no broad storage permission PASS
- native export bridge presence/wiring PASS

## Signing verification

Installable v3.5.1.57 APK:

- APK Signature Scheme v2: PASS
- APK Signature Scheme v3: PASS
- ZIP integrity: PASS
- release certificate SHA-256 unchanged from v3.5.1.56

This preserves direct-update compatibility with the immediately preceding signed release.

## Result

**PASS — no regression detected outside the intended Phase-7 equity weighting scope.**
