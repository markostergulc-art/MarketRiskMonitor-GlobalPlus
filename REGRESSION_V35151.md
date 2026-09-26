# Regression Report — v3.5.1.51

Baseline: v3.5.1.50 / versionCode 83  
Target: v3.5.1.51 / versionCode 84

## Allowed functional change

Only Phase-3 confidence/source-quality diagnostics, their compact UI presentation, audit/methodology export metadata, tests, and release/version metadata changed.

## Risk-score invariance

For identical finite inputs:

- Country `weightedScore()` is unchanged.
- GLOBAL numerical risk score is unchanged.
- GLOBAL component scores are unchanged.
- Phase-2 eligibility gates remain authoritative.
- Confidence never feeds back into risk arithmetic.

## Byte-identical protected functions

Phase-3 regression verifies the following against v3.5.1.50, including:

`riskBand`, `weightedScore`, `globalContagion`, `marketMetrics`, `trendRisk`, `macroRiskFromWB`, `fxRisk`, `systemScoreForCountry`, `corrMatrix`, `correlationRegimeFromStats`, `correlationRegimeDiagnostic`, `weightedAvailable`, `inflationDetector`, `recessionLeadingAndComposite`, `buildMacroCycle`, fiscal score/freshness/reference functions, commodity intelligence, Equity Internals, S&P/company risk, P0/P1/P2/P3 scheduler functions, `fetchWithTimeout`, sparkline/chart helpers, Phase-1 freshness functions and `countryCoverageV50`.

## Phase-2 retention

The inherited Phase-2 tests confirm:

- Data / Factor / Freshness coverage remain separate.
- Country normal status still requires >=50% effective weighted coverage, >=3 factor groups and MARKET factor.
- GLOBAL normal status still requires >=50% effective coverage and >=5/9 groups.
- Missing values are never zero-filled.
- LIMITED DATA cannot become a normal Top Risk ranking entry.
- Legacy cache cannot bypass coverage eligibility.

## Network/loading

- Additional Phase-3 fetch call sites: **0**.
- `fetchWithTimeout()` byte-identical to v3.5.1.50.
- P0/P1/P2/P3 scheduler functions byte-identical.
- Loading-progress behavior unchanged.

## Native continuity

The full native source is byte-identical to v3.5.1.50:

- `MainActivity.java`
- `AgsiKeyStore.java`
- `AndroidManifest.xml`

Fallback APK payload continuity:

- `classes.dex` SHA-256: `70b9a6162c6514f2dca15243407a34a8b271d17c4d2a4193523a9ed77918c83e`
- `resources.arsc` SHA-256: `698bae3d88dca55eae07586fd95ce0d4d7f29d89fbb61b239eb63db1f7caabf9`

The native download `@JavascriptInterface` remains present and wired.

## Deterministic QA

Total: **491/491 PASS**.

Includes Phase 3 confidence, Phase 3 protected regression, retained Phase 2 coverage/gates, freshness, Market Health, Markets sparkline periods, graph/loading UI, native export, fiscal, AGSI/storage, and parser fixtures.

## Signing

- V1/JAR: PASS
- V2: PASS
- V3: PASS
- Signing certificate SHA-256: `c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`

## Limitation

Physical Android/GrapheneOS installation/interaction was not executed because no ADB-connected device is available.
