# Regression Report — v3.5.1.60

## Result

**PASS**

Release QA completed with **509/509 JavaScript assertions**, JavaScript syntax validation, and APK structural verification.

## Phase-specific validation

- Phase 10 Fiscal Structural Vulnerability: 61/61 PASS
- Phase 9 Macro Globalization compatibility: 60/60 PASS
- Phase 8 Correlation / Timezone compatibility: 71/71 PASS
- Phase 7 Equity Global Weighting: 37/37 PASS
- Phase 6 Auditability compatibility: 67/67 PASS
- Phase 5 Factor Architecture: 29/29 PASS
- Phase 4 Early Warning semantics: 33/33 PASS
- Phase 3 Confidence: 24/24 PASS
- Phase 1 Freshness: 19/19 PASS
- Fiscal freshness/loading compatibility: 23/23 PASS
- Parser fixtures: 29/29 PASS
- AGSI country fixtures: 21/21 PASS
- AGSI coverage fixtures: 10/10 PASS
- Native export bridge: 25/25 PASS

## Protected calculations

The following functions are byte-identical to the v3.5.1.59 baseline:

- `fiscalAbsRiskV43()`
- `fiscalPercentileRiskV43()`
- `fiscalScoreRowsV43()`
- `fiscalRowFromSourcesV43()`
- `globalRiskModel()`
- `globalFactorArchitectureV53()`
- `buildMacroCycle()`

## Data / loading safeguards

- No new raw `fetch()` call sites.
- Existing lazy loading and fiscal stale-while-revalidate behavior retained.
- Missing fiscal inputs are not converted to zero.
- Central-government fallback is not treated as general-government comparable.
- An all-limited fiscal module reports `NO ELIGIBLE CURRENT DATA`.
- Production GLOBAL Risk integration remains unchanged.

## APK fallback verification

PASS:

- package/version/minSdk/targetSdk/launcher
- ZIP integrity and STORED alignment
- embedded `index.html` byte-identical to release source
- no broad storage permission
- native `@JavascriptInterface saveExportFile` bridge present
- MediaStore Downloads path present
