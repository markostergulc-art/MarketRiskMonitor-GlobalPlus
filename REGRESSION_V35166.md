# Regression Report — v3.5.1.66

## Scope

Phase 16 is presentation-only. Production scoring and all Phase-15 GA2 architecture rules are regression protected.

## Automated result

**970/970 PASS**

Breakdown:

- Phase 16 UI / deterministic explanation: 65/65
- Phase 15 GA2 compatibility: 64/64
- Phase 14 historical validation runtime: 100/100
- Phase 14 offline tool: 38/38
- Phase 13 hysteresis compatibility: 69/69
- Phase 12 source resilience: 73/73
- Phase 11 commodity physical risk: 52/52
- Phase 10 fiscal structural vulnerability: 61/61
- Phase 9 macro globalization: 60/60
- Phase 8 lag-aware correlation: 71/71
- Phase 7 equity weighting: 37/37
- Phase 6 auditability/transforms: 67/67
- Phase 5 factor architecture: 29/29
- Phase 4 signal semantics: 33/33
- Phase 3 confidence: 24/24
- Phase 1 freshness semantics: 19/19
- Fiscal freshness/loading compatibility: 23/23
- Parser fixtures: 29/29
- AGSI country fixtures: 21/21
- AGSI coverage fixtures: 10/10
- Native export bridge: 25/25

## Key invariants

- Phase-15 production scoring functions remain byte-identical to v3.5.1.65.
- Current Condition weights and GA2 caps are unchanged.
- Phase-13 hysteresis remains presentation-state logic and does not alter the numeric risk score.
- No missing value becomes zero.
- No new raw network fetch call site was added (`6 → 6`).
- Canonical JavaScript and embedded WebView JavaScript are byte-identical.

## Build verification

- versionName: 3.5.1.66
- versionCode: 99
- package/version/minSdk/targetSdk/launcher: PASS
- APK ZIP integrity: PASS
- STORED alignment: PASS
- v1 signature verification: PASS (self-signed release certificate warning is expected)
- v2 signature: PASS
- v3 signature: PASS
- signing certificate equals v3.5.1.65 certificate

## Result

No scoring regression was detected. Phase 16 changes only how the final architecture and its deterministic explanation are presented to the user.
