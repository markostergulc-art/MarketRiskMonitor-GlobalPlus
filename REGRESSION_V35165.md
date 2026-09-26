# Regression Report — Market Risk Monitor Global+ v3.5.1.65

## Result

**PASS — 905 / 905 automated checks**, plus JavaScript syntax and Python compile checks.

## Phase-15 checks

`tests/phase15_final_global_architecture_v35165.js`: **64 / 64 PASS**

Validates versioning, embedded asset parity, protected pre-Phase-15 function hashes, GA2 helpers, layer budgets, positive-only warning/structural adjustments, contagion cap/non-cancellation behavior, fiscal GDP cap, production refresh integration, audit registry and PIT snapshot fields.

## Historical validation compatibility

`tests/phase14_historical_validation_phase15_compat_v35165.js`: **100 / 100 PASS**

`tests/phase14_offline_tool_v35164.py`: **38 / 38 PASS**

Phase-14 PIT/vintage infrastructure remains operational and no production threshold/weight auto-optimization was introduced.

## Earlier-phase compatibility

- Phase 13 hysteresis: 69 / 69 PASS
- Phase 12 source resilience: 73 / 73 PASS
- Phase 11 commodity physical risk: 52 / 52 PASS
- Phase 10 fiscal structural vulnerability: 61 / 61 PASS
- Phase 9 macro globalization: 60 / 60 PASS
- Phase 8 correlation/timezone: 71 / 71 PASS; compatibility assertion updated only for the intentional Phase-15 change from correlation factor to contagion amplifier
- Phase 7 equity weighting: 37 / 37 PASS
- Phase 6 auditable transforms: 67 / 67 PASS
- Phase 5 factor architecture: 29 / 29 PASS
- Phase 4 semantics: 33 / 33 PASS
- Phase 3 confidence: 24 / 24 PASS
- Freshness semantics: 19 / 19 PASS
- Fiscal freshness/loading: 23 / 23 PASS
- Parser fixtures: 29 / 29 PASS
- AGSI country fixtures: 21 / 21 PASS
- AGSI coverage fixtures: 10 / 10 PASS
- Native export bridge: 25 / 25 PASS

Total: **905 / 905 PASS**.

## Numeric/model protection

Byte-identical against v3.5.1.64 baseline:

- `riskBand()`
- `weightedScore()`
- legacy `globalRiskModel()`
- `globalFactorArchitectureV53()`
- `globalContagion()`
- `buildMacroCycle()`
- `fiscalScoreRowsV43()`
- `commodityShockRisk()`
- `aggregateEquityInternalsV57()`
- `lagAwareCorrMatrixV58()`
- `stabilizedBandV63()`

## Network/loading regression

Raw `fetch()` call-site count: **6 → 6**.

Existing source-resilience, cache, loading scheduler, freshness and fallback logic remain covered by prior-phase compatibility tests.

## APK structural check

The Phase-15 manually built aligned APK passes:

- package/version/minSdk/targetSdk/launcher validation;
- ZIP integrity and 4-byte STORED alignment;
- embedded `index.html` byte-identical to release source;
- no broad storage permission;
- native export bridge DEX presence;
- MediaStore Downloads path check.

APK SHA-256 before signing: `4ee134c0afc883e9f05cd59487476a9afb125023a1a26b6f09a88b114513e3af`.

## Signing limitation

The v3.5.1.64 APK is signed with certificate SHA-256:

`0B:6F:40:25:C3:8A:CA:A8:98:84:1B:FA:A1:C0:C3:95:16:E8:FE:58:1B:F0:4E:DE:3F:D2:FF:8C:AD:F7:29:F0`

The associated private keystore is not present in the active runtime or the accessible project/source package. A certificate/public key cannot be used to reconstruct the private signing key. Consequently, Phase 15 is not falsely marked as update-compatible signed until the existing keystore is supplied/recovered.
