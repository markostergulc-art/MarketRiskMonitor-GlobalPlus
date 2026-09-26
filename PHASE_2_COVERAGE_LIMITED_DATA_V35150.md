# Phase 2 — Coverage and LIMITED DATA — v3.5.1.50

Baseline: v3.5.1.49 / versionCode 82  
Target: v3.5.1.50 / versionCode 83  
Date: 2026-09-14

## Objective

Prevent a partially populated Country Risk or GLOBAL Risk model from presenting a normal GREEN / LIGHT GREEN / ORANGE / DARK ORANGE / RED status merely because the existing weighted-average code can renormalize the subset of values that happened to be available.

The numerical risk formulas remain normalized over finite inputs. Phase 2 adds an explicit eligibility layer before a normal status is allowed.

## Country Risk coverage semantics

Three different coverage concepts are now retained separately:

1. **Data coverage** — available raw inputs divided by raw inputs expected by the current country architecture. The expected set is model-aware: headline market data plus the macro inputs actually used for the country, and FX / implied-volatility feeds only where configured.
2. **Factor coverage** — represented independent economic factor groups, not the number of correlated sub-scores. `market` and `technical` are one MARKET group. The remaining groups are MACRO, CREDIT, LIQUIDITY, VALUATION and SYSTEMIC.
3. **Freshness coverage** — share of configured Country Risk weight backed by a finite score whose source is `CURRENT` or `OLD_BUT_CURRENT_RELEASE` under the Phase-1 freshness model.

An additional diagnostic, **weighted coverage**, is the configured model weight with a finite score. **Effective weighted coverage** is the conservative minimum of weighted coverage and freshness coverage.

### Country eligibility gate

A normal Country Risk band is allowed only when all are true:

- effective weighted coverage >= **50%**;
- at least **3 independent factor groups** are represented;
- a **MARKET factor** is present.

If any condition fails:

- the numerical score remains available as a diagnostic calculation;
- the user-facing status is **LIMITED DATA**;
- the market card risk bar is neutral/gray rather than a normal risk color;
- Overview counts the market under Limited data;
- the country is excluded from the Top Risk country ranking;
- the detail view shows Data / Factor / Freshness / Effective coverage and the failed-gate reason.

Missing values are never converted to zero. The existing `weightedScore()` function is byte-identical to v3.5.1.49.

## Freshness integration

Phase 1 semantics are reused without modification:

- `CURRENT` counts as current/latest-valid;
- `OLD_BUT_CURRENT_RELEASE` counts as current/latest-valid for slow official data;
- `LATE`, `STALE`, and `UNKNOWN` do not count toward freshness coverage.

Annual World Bank rows are evaluated as annual observations rather than being rejected merely because their date is represented by a year.

## GLOBAL Risk coverage semantics

The GLOBAL numeric score still uses the same finite-input weighted-average formula and the same `GLOBAL_WEIGHTS`. Phase 2 separates coverage from that score:

- **Factor coverage** — configured GLOBAL weight represented by finite top-level components.
- **Data coverage** — weighted internal completeness of the actual candidate inputs used to form each top-level component, instead of treating a partially populated component as automatically complete.
- **Freshness coverage** — weighted share of GLOBAL components supported by latest-valid Early Warning and country inputs.
- **Source validity coverage** — share of providers participating in the refresh that recorded at least one successful result.
- **Effective coverage** — conservative minimum of Factor, Data, Freshness and Source-validity coverage.

### GLOBAL eligibility gate

A normal GLOBAL status is allowed only when:

- effective coverage >= **50%**; and
- at least **5 of 9** top-level GLOBAL factor groups are represented.

If the gate fails:

- the numeric score remains diagnostic;
- the status becomes **LIMITED DATA / INSUFFICIENT COVERAGE**;
- the gauge uses a neutral color;
- normal threshold alerts are suppressed;
- a coverage-limited score is not added as a normal point to the GLOBAL risk history.

The Overview now shows Data, Factors and Freshness coverage independently rather than one ambiguous coverage percentage.

## Cache safety

A v3.5.1.49 or older cached snapshot does not contain Phase-2 coverage metadata. Such a legacy cache is therefore conservatively rehydrated as LIMITED DATA until a v3.5.1.50 refresh recalculates coverage. This prevents an old cached normal color from bypassing the new eligibility gate.

## Preserved behavior

Unchanged:

- Country Risk `weightedScore()` arithmetic;
- risk-band thresholds after eligibility;
- Phase-1 freshness classifier and release semantics;
- Global Contagion formula;
- correlation calculations;
- Macro detector formulas;
- Fiscal Stress methodology;
- commodities / AGSI calculations;
- company / ETF / dividend calculations;
- P0/P1/P2/P3 scheduler;
- loading progress UI;
- chart and Markets-card sparkline-period logic;
- network endpoints and request architecture;
- native Android export bridge.

## Validation

Deterministic Phase-2 fixtures verify:

- complete Country Risk => normal eligibility;
- partial 35% weighted Country Risk => LIMITED DATA;
- sufficient 75% current/latest-valid coverage => normal eligibility;
- stale factors reduce freshness coverage and can force LIMITED DATA;
- complete GLOBAL fixture => normal eligibility;
- partial GLOBAL fixture => LIMITED DATA;
- missing GLOBAL data never becomes zero risk;
- Country `weightedScore()` is unchanged;
- GLOBAL numeric score is unchanged for identical finite inputs;
- limited countries cannot enter the normal Top Risk country ranking;
- normal GLOBAL alert is suppressed when coverage is insufficient;
- legacy caches cannot resurrect normal status without Phase-2 metadata.

Physical-device acceptance remains NOT EXECUTED because no ADB-connected Android/GrapheneOS device is available in this environment.
