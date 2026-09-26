# Regression Report — v3.5.1.67

## Scope

Phase 17 is an audit/export-only release. Production scoring, Phase-15 GA2 architecture and Phase-16 deterministic UI/explanation arithmetic are regression protected.

## Automated result

**1113/1113 PASS**

Breakdown:

- Phase 17 Methodology Export V2: 143/143
- Phase 16 UI/explanation compatibility: 65/65
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

- Production/model functions remain byte-identical to v3.5.1.66.
- Phase-15 GA2 weights, caps, formula and contagion behavior are unchanged.
- Phase-16 deterministic explanation remains presentation-only.
- No missing value becomes zero risk.
- Methodology V2 uses loaded/calculated state only; it adds no network path.
- Raw `fetch()` call sites remain **6 → 6**.
- Canonical `app.js` and embedded WebView JavaScript are byte-identical.
- Current Data ZIP includes both structured JSON and Markdown Methodology V2.

## Phase-17-specific checks

- all required per-model fields exist;
- 18 model families explicitly inventoried;
- U.S. Macro and regional Global Macro rows are separated;
- full GA2 dependency tree exported;
- Early Warning normalized class plus internal class exported;
- correlation return calculation, timezone/session alignment and windows exported;
- standalone Methodology export identifies V2;
- no network call is reachable from Methodology V2 generation;
- missing audit-average values are excluded rather than numerically zero-filled.

## Result

No production scoring regression was detected. Phase 17 changes the completeness and reproducibility of methodology/audit output only.
