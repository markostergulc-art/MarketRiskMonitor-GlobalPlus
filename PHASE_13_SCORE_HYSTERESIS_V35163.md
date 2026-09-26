# Market Risk Monitor Global+ — Phase 13 Score Hysteresis

## PHASE 13 COMPLETE

**Baseline:** v3.5.1.62 / versionCode 95  
**Target:** v3.5.1.63 / versionCode 96  
**Scope:** status-transition stabilization only; numeric risk scores remain unchanged

## Objective

Phase 13 evaluates and controls status-band flapping without altering the underlying risk number. The raw band map remains exactly:

```text
<25   GREEN
<45   LIGHT GREEN
<60   ORANGE
<75   DARK ORANGE
>=75  RED
```

The source package does not contain a real user's accumulated Android `localStorage` score history, so a truthful build-time empirical flapping rate cannot be claimed. To avoid implementing hysteresis blindly, production hysteresis is **runtime-flap-gated**: it activates only after the device's own stored score history demonstrates repeated near-boundary chatter.

## Method

Methodology identifier:

```text
HYSTERESIS_V1_RUNTIME_FLAP_GATED
```

Parameters:

- lookback: last **20** stored observations;
- candidate boundaries: **25, 45, 60, 75**;
- flapping evidence: at least **3** crossings of the relevant boundary;
- anti-false-flap zone: both observations forming a crossing must be within **±5 score points** of that boundary;
- de-escalation buffer after proven flapping: **3 score points**;
- escalation into a worse band: **immediate at the original raw threshold**.

The ±5-point crossing rule prevents large genuine regime changes from being counted as threshold chatter. Hysteresis is boundary-specific: flapping around 60 does not automatically change behavior at 75.

## Transition logic

For an eligible score:

1. calculate the original raw band with unchanged `riskBand()`;
2. read the previously displayed band and actual numeric history from local storage;
3. evaluate near-boundary crossings;
4. if risk worsens, use the new raw band immediately;
5. if risk improves and the relevant boundary has not shown repeated flapping, use the raw lower-risk band immediately;
6. if risk improves after proven flapping, retain the previous displayed band until the score clears the 3-point exit buffer.

Example for RED:

```text
Enter RED: score >= 75 (unchanged, immediate)
After proven 75-boundary flapping:
  74 / 73 -> displayed RED
  <=72    -> exit to DARK ORANGE
```

This is deliberately asymmetric: the mechanism suppresses noisy de-escalation/re-entry loops but does not delay legitimate crisis escalation.

## Stored state

History now records the numeric score separately from display-state metadata.

GLOBAL and country band metadata include:

- `rawBand`;
- `currentBand`;
- `previousBand`;
- `hysteresisApplied`;
- `flappingDetected`;
- `exitThreshold`;
- `reason`.

Numeric GLOBAL and country risk values remain the same fields as before.

## UI / diagnostics behavior

The following presentation paths use the stabilized display band where eligible:

- GLOBAL gauge/status color;
- country risk cards/details;
- country risk bar colors;
- Overview healthy/watch/stress counts;
- event-history status transitions.

The displayed numeric score remains the raw model score. LIMITED DATA / N/A is never stabilized into a false normal risk band.

## Audit / methodology export

Audit output now exposes raw/current/previous band diagnostics and the Phase-13 parameters. The methodology export states explicitly that:

- numeric score is unchanged;
- raw thresholds are unchanged;
- hysteresis is heuristic and runtime-flap-gated;
- worsening transitions are immediate;
- only display-status de-escalation can be delayed after observed chatter.

## Protected calculations

Byte-equivalent comparison against v3.5.1.62 confirms no modification to:

- `riskBand`
- `weightedScore`
- `globalRiskModel`
- `globalFactorArchitectureV53`
- `globalContagion`
- `buildMacroCycle`
- `fiscalScoreRowsV43`
- `commodityShockRisk`
- `aggregateEquityInternalsV57`
- `lagAwareCorrMatrixV58`

Raw `fetch(` call sites remain **6 → 6**.

## Phase-13 deterministic validation

Dedicated checks verify:

- raw thresholds remain unchanged;
- repeated near-boundary crossings are detected;
- a single directional threshold pass is not classified as flapping;
- large 40↔80-type moves are not classified as chatter;
- separate boundaries are evaluated independently;
- ORANGE→DARK ORANGE at 60 escalates immediately;
- DARK ORANGE→RED at 75 escalates immediately;
- RED de-escalation can be held at 74/73 only after actual flapping evidence;
- RED exits at 72 with the configured 3-point buffer;
- without flapping evidence, 74 immediately returns the raw DARK ORANGE band;
- a large risk improvement is not artificially delayed;
- missing/LIMITED states are never converted into normal bands;
- synthetic chatter shows fewer displayed transitions than raw transitions;
- a rapid-crisis fixture still reaches RED immediately.

## Full regression validation

```text
Phase 13 hysteresis                 69/69 PASS
Phase 12 source resilience          73/73 PASS
Phase 11 compatibility              52/52 PASS
Phase 10 compatibility              61/61 PASS
Phase 9 compatibility               60/60 PASS
Phase 8 compatibility               71/71 PASS
Phase 7 equity weighting            37/37 PASS
Phase 6 compatibility               67/67 PASS
Phase 5 compatibility               29/29 PASS
Phase 4 semantics                   33/33 PASS
Phase 3 confidence                  24/24 PASS
Freshness semantics                 19/19 PASS
Fiscal/loading compatibility        23/23 PASS
Parser fixtures                     29/29 PASS
AGSI country                        21/21 PASS
AGSI coverage                       10/10 PASS
Native export bridge                25/25 PASS
---------------------------------------------
TOTAL                              703/703 PASS
```

Additional checks:

- JavaScript syntax: PASS;
- canonical `app.js` == embedded WebView JavaScript: PASS;
- APK package/version/minSdk/targetSdk/launcher: PASS;
- ZIP integrity and STORED-entry alignment: PASS;
- native export bridge present: PASS;
- v1 JAR signature: PASS;
- APK Signature Scheme v2: PASS;
- APK Signature Scheme v3: PASS;
- signing certificate unchanged from previous releases: PASS;
- full regression re-run from freshly extracted source ZIP: **703/703 PASS**;
- clean-source fallback APK rebuild/structural verification: PASS.

## Files/functions changed

Primary runtime/version files:

- `app.js`
- `app/src/main/assets/index.html`
- `app/build.gradle`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java`
- `build_release.sh`

Added Phase-13 runtime helpers:

- `bandIndexV63()`
- `bandFromLabelV63()`
- `scoreFlappingAnalysisV63()`
- `stabilizedBandV63()`
- `statusPillFromBandV63()`
- `statusBandColorV63()`

Integration changed in:

- `finalizeCountries()`;
- `historySave()`;
- `eventHistory()`;
- GLOBAL display-band handling in `refreshAll()`;
- Overview/country status presentation;
- audit and methodology exports.

Tests/build helpers were added for v3.5.1.63 compatibility and APK verification.

## Known limitations

1. The source archive contains no real-device historical score database, therefore Phase 13 does not claim a measured production flapping rate at build time.
2. Hysteresis begins only after enough actual on-device observations and near-boundary crossings exist; a fresh install behaves exactly like the raw thresholds until evidence accumulates.
3. Parameters (20 observations, 3 crossings, ±5 zone, 3-point exit gap) are transparent heuristics, not empirically optimized crisis-prediction parameters.
4. Historical validation of threshold behavior belongs to Phase 14. Phase 13 intentionally does not optimize thresholds or numerical risk scores.
5. Clearing app storage/history also clears the evidence used to activate hysteresis.

## Regression status

**PASS.** Numeric scoring remains unchanged and no regression was detected in prior methodology phases, data loading, parser behavior or export bridge.

## Next phase

**Phase 14 — Historical Validation Framework**: build point-in-time backtest infrastructure, avoid look-ahead/revision bias, evaluate forward outcomes/event windows, and test weight/threshold sensitivity without automatically retuning production parameters.
