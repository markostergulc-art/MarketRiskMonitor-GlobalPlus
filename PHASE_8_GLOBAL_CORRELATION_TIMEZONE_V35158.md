# Market Risk Monitor Global+ — Phase 8 Global Correlation / Timezone Correction

## PHASE 8 COMPLETE

**Baseline:** 3.5.1.57 / versionCode 90  
**Target:** 3.5.1.58 / versionCode 91

## Objective

Separate the existing exploratory same-calendar-date correlation matrix from the correlation methodology used by GLOBAL systemic/contagion calculations, so asynchronous global trading sessions do not silently distort the systemic layer.

The existing 20D / 60D / 120D / 252D / 3Y matrix remains available and mathematically unchanged as **DESCRIPTIVE correlation**. Phase 8 adds a second **SYSTEMIC lag-aware correlation** layer.

## Production methodology

### 1. Descriptive correlation — preserved

The pre-Phase-8 functions remain byte-identical:

- `returns()`
- `pearson()`
- `alignedCorr()`
- `corrMatrix()`
- `correlationPairStats()`
- `correlationRegimeFromStats()`
- `correlationRegimeDiagnostic()`

They continue to use same-calendar-date close-to-close returns and remain the basis of the raw UI correlation matrix.

Changing the user-selected descriptive window does **not** change the GLOBAL systemic correlation input.

### 2. Systemic lag-aware correlation

Methodology identifier:

`LAG-AWARE-REGIONAL-V1`

GLOBAL systemic production window:

`60 trading observations`

The active core market universe is explicitly mapped into three broad trading-session groups:

- `ASIA_PACIFIC`
- `EUROPE_MEA`
- `AMERICAS`

No active core market is left without a session mapping.

### 3. Pair alignment rules

The model deliberately does **not** apply one universal lag to every pair.

| Pair type | Alignment | Rationale |
|---|---|---|
| Asia-Pacific ↔ Americas | `Asia_t ↔ Americas_t-1` | Sessions do not overlap; the Asian observation can only use an Americas close strictly before the Asian date. |
| Asia-Pacific ↔ Europe/MEA | Same date | The later European/MEA close can reflect information from the already-completed Asian session on that calendar date. |
| Europe/MEA ↔ Americas | Same date | Sessions overlap or occur sequentially on the same date; same-date closes retain contemporaneous transmission. |
| Same broad session | Same date | No cross-session correction is required. |
| Unknown session | Same date + explicit metadata | Fail closed to the descriptive alignment rather than inventing a lag. |

This is a **fixed structural mapping**, not a lag chosen by whichever option happens to maximize correlation. Therefore Phase 8 does not optimize the correlation result against the observed sample.

### 4. No-look-ahead protection

For Asia-Pacific ↔ Americas, the pairing algorithm uses only an Americas return whose observation date is strictly earlier than the Asian observation date.

A previous Americas return is not reused for multiple Asian observations when holiday calendars differ. This avoids artificially duplicating one return across several pairs.

The algorithm never uses a future observation to calculate an earlier market observation.

## GLOBAL integration

The separate lag-aware matrix is now supplied to systemic paths:

- Cross-asset systemic finalization
- `globalContagion()`
- Hidden Risk / anomaly systemic diagnostic
- GLOBAL Risk `CORRELATION_CONTAGION` factor

The raw descriptive matrix remains available for market exploration and for the existing country-level correlation view.

The Phase-5 weight of `CORRELATION_CONTAGION` remains **5%**. Phase 8 changes the realized-correlation input, not the factor weight.

## UI changes

The Correlation section now clearly separates:

### SYSTEMIC CORRELATION

- lag-aware 20D / 60D / 120D diagnostics;
- fixed 60D GLOBAL production window;
- pair coverage;
- methodology identifier;
- representative naive → lag-aware comparisons;
- explicit no-future-date explanation.

### DESCRIPTIVE CORRELATION

- the original same-date correlation regime;
- the original raw matrix;
- selectable 20D / 60D / 120D / 252D / 3Y windows;
- descriptive history.

The correlation-history title is explicitly labeled **Descriptive Correlation History** so it cannot be mistaken for the GLOBAL systemic history.

## Deterministic validation

A synthetic fixture was constructed where Japanese daily returns intentionally follow the previous U.S. return.

| Pair | Same-date | Phase-8 systemic | Rule |
|---|---:|---:|---|
| US ↔ Japan | 0.157 | 1.000 | `Asia_t ↔ Americas_t-1` |
| Germany ↔ Japan | 1.000 | 1.000 | Same date |
| US ↔ Germany | 0.157 | 0.157 | Same date / overlapping sessions |

The US↔Japan fixture demonstrates that the lag-aware method recovers the deliberately embedded previous-close relationship without look-ahead. The Europe↔Asia and US↔Europe fixtures also confirm that pairs assigned to a same-date rule remain mathematically unchanged rather than receiving an unnecessary universal lag.

Additional tests verify:

- matrix symmetry;
- no duplicate reuse of an Americas return in lagged pairs;
- missing market series remain missing rather than becoming zero correlation;
- systemic pair coverage falls when series are unavailable;
- representative US↔Asia, Europe↔Asia and US↔Europe comparisons are exported;
- the descriptive window selector cannot mutate the GLOBAL systemic calculation.

## Export / audit changes

Correlation export now includes, per pair:

- `descriptiveSameDate`
- `systemicLagAdjusted`
- descriptive window
- systemic window
- `alignmentMode`
- `alignmentRule`
- methodology version

The audit snapshot additionally exports:

- systemic session map;
- fixed systemic window;
- methodology version;
- no-look-ahead declaration;
- descriptive and systemic matrices/diagnostics separately.

Methodology export now explicitly states which correlation layer GLOBAL Risk uses.

## Files changed

Production/release files:

- `app.js`
- `app/src/main/assets/index.html`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java` — versioned user-agent only
- `app/build.gradle`
- `build_release.sh`

Phase-8 QA/support files:

- `tests/phase8_correlation_timezone_v35158.js`
- `tests/phase6_auditability_phase8_compat_v35158.js`
- `tests/fiscal_freshness_loading_phase8_compat_v35158.js`
- `tests/phase8_release_qa_v35158.sh`
- `tools/build_manual_apk_v35158.py`
- `tools/verify_fallback_apk_v35158.py`
- `app_v35157_baseline.js` — regression fixture

## Functions changed

New production functions:

- `correlationSessionV58()`
- `correlationAlignmentRuleV58()`
- `lagAwarePairsV58()`
- `lagAwareCorrV58()`
- `lagAwareCorrMatrixV58()`
- `lagAwareCorrelationRegimeDiagnosticV58()`
- `systemicCorrelationCardHtmlV58()`
- `correlationDualCardHtmlV58()`

Existing functions intentionally changed:

- `refreshAll()` — builds both descriptive and systemic correlation; GLOBAL paths receive systemic correlation
- `renderCorr()` — displays both methodologies
- `renderOverview()` — overview correlation status uses systemic diagnostic
- `correlationRegimeCardHtml()` — relabeled as descriptive
- `serializableState()` — persists systemic matrix/diagnostic
- `historySave()` — stores descriptive and systemic daily diagnostics separately
- `correlationAuditRowsV47()` — exports both pair calculations and alignment metadata
- `auditSnapshotV47()` — exports systemic methodology metadata
- `methodologyMarkdownV47()` — documents the two correlation methodologies

No existing production function was removed.

## Regression protection

The following correlation functions are byte-identical to v3.5.1.57:

- `returns()`
- `pearson()`
- `alignedCorr()`
- `corrMatrix()`
- `correlationPairStats()`
- `correlationRegimeFromStats()`
- `correlationRegimeDiagnostic()`

Phase-7 equity weighting passes unchanged. Phase-6 transform auditability, Phase-5 factor architecture, Phase-4 Early Warning semantics, Phase-3 confidence, Phase-1 freshness, fiscal loading, parser fixtures, AGSI and native export bridge all remain green.

Raw `fetch()` call sites remain **6 → 6**. No new data provider was introduced.

## QA results

Release QA: **388/388 JavaScript assertions PASS**, plus JavaScript syntax and structural APK verification.

Included suites:

- Phase 8 timezone/correlation: 71/71
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
- APK structure/alignment/bridge checks: PASS

## Signing verification

Installable v3.5.1.58 APK:

- APK Signature Scheme v2: PASS
- APK Signature Scheme v3: PASS
- v1/JAR signature: PASS
- ZIP integrity: PASS
- STORED-entry alignment: PASS
- signing certificate SHA-256: `0b6f4025c38acaa898841bfaa1c0c39516e8fe581bf04ede3fd2ff8cadf729f0`

The certificate is unchanged from v3.5.1.57, preserving direct-update compatibility.

## Known limitations

1. The application works with daily close observations, not exchange-level intraday timestamps. Session alignment is therefore structural rather than timestamp-by-timestamp.
2. Asia↔Europe and Europe↔Americas remain same-date by design. This reflects later-session transmission/overlap, but the rule should be empirically tested in Phase 14 rather than optimized now.
3. The fixed session map is transparent and deterministic, but it has not yet been historically calibrated against crises.
4. Market holidays are handled by requiring a distinct previous Americas observation for Asia↔Americas; a full exchange-calendar engine is not introduced in this phase.
5. Existing descriptive historical snapshots remain descriptive. New systemic history accumulates only from v3.5.1.58 forward unless older data are recomputed separately.

## Next phase

**PHASE 9 — Macro Globalization**
