# Regression Report — Market Risk Monitor Global+ v3.5.1.63

## Baseline

- v3.5.1.62 / versionCode 95
- target v3.5.1.63 / versionCode 96
- scope: Phase 13 Score Hysteresis

## Core protection

Phase 13 changes status-transition presentation only. Byte-equivalent comparison against the v3.5.1.62 baseline confirms that the following numerical/model functions are unchanged:

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

## Hysteresis regression guards

- risk numbers are stored and rendered independently from display bands;
- worsening transitions use the original thresholds immediately;
- only de-escalation can be held, and only after at least three actual near-boundary crossings;
- large regime jumps are excluded from chatter detection with the ±5-point zone;
- missing/LIMITED data never become a normal status;
- per-boundary behavior is independent;
- status metadata does not modify factor inputs, weights or coverage mathematics.

## Automated result

```text
Phase 13                           69/69 PASS
Phase 12                           73/73 PASS
Phase 11 compatibility             52/52 PASS
Phase 10 compatibility             61/61 PASS
Phase 9 compatibility              60/60 PASS
Phase 8 compatibility              71/71 PASS
Phase 7                            37/37 PASS
Phase 6 compatibility              67/67 PASS
Phase 5 compatibility              29/29 PASS
Phase 4                            33/33 PASS
Phase 3                            24/24 PASS
Freshness                          19/19 PASS
Fiscal/loading                     23/23 PASS
Parser fixtures                    29/29 PASS
AGSI country                       21/21 PASS
AGSI coverage                      10/10 PASS
Native export bridge               25/25 PASS
--------------------------------------------
TOTAL                             703/703 PASS
```

Additional checks: JavaScript syntax PASS; embedded WebView JavaScript parity PASS; fallback APK structure/alignment PASS; v1/v2/v3 signatures PASS; clean-source re-run **703/703 PASS**.

## Result

**PASS — Phase 13 accepted.**
