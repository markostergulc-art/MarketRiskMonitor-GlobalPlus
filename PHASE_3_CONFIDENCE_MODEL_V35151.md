# Phase 3 — Confidence Model — v3.5.1.51

Baseline: v3.5.1.50 / versionCode 83  
Target: v3.5.1.51 / versionCode 84  
Date: 2026-09-15

## Objective

Separate **model confidence** from the existing 0–100 **risk score**. Phase 3 does not change the numerical Country Risk or GLOBAL Risk formulas. A score such as Risk 72 can now be accompanied by HIGH, MEDIUM, LOW, or LIMITED confidence depending on data quality and model support.

## Confidence inputs

The internal diagnostic confidence composite is transparent and uses:

- effective coverage: **30%**
- freshness coverage: **20%**
- factor diversity: **15%**
- source quality: **15%**
- internal factor agreement: **8%**
- data frequency: **6%**
- revision resilience: **6%**

The displayed confidence class is intentionally categorical rather than presenting false decimal precision:

- **HIGH**: diagnostic composite >= 80 and Phase-2 eligibility passes
- **MEDIUM**: diagnostic composite >= 60 and Phase-2 eligibility passes
- **LOW**: eligible but below 60, or insufficient metadata to justify a stronger class
- **LIMITED**: Phase-2 coverage/eligibility gate fails

The diagnostic numeric confidence value is retained for audit/export but does not change the risk score or risk band.

## Source-quality metadata

Providers now carry auditable metadata:

- `provider`
- `sourceQuality` (A/B/C/D)
- `sourceQualityScore` (diagnostic only)
- `sourceClass`
- `fallbackUsed`

Source classes include `PRIMARY_OFFICIAL`, `PRIMARY_MARKET`, `INSTITUTIONAL`, `SECONDARY`, and `UNOFFICIAL_FALLBACK`.

Primary official/institutional market sources receive the strongest baseline quality classes. Yahoo Finance remains usable as a market source but is not treated as equivalent to an official statistical provider. When stale-cache fallback is actually used, source-quality confidence is reduced without deleting the datapoint or changing the risk formula.

### Important methodological limitation

The A/B/C/D mapping, the confidence-component weights, the frequency scores, the revision-resilience scores, and the 80/60 category thresholds are **transparent heuristic calibration**, not empirically validated predictive weights. They are intentionally isolated from the production risk score. Phase 14 historical validation is required before claiming empirical confidence calibration.

## Country confidence

`countryConfidenceV51()` combines the Phase-2 coverage object with:

- source quality of the data actually supporting available subscores;
- agreement across finite country subscores;
- cadence/frequency quality;
- revision-resilience metadata.

The Markets card shows a compact confidence chip. Country detail exposes:

- confidence level;
- source-quality grade;
- fallback status where applicable;
- factor agreement;
- data-frequency diagnostic;
- revision-resilience diagnostic;
- an explicit statement that risk and confidence are separate concepts.

A Phase-2 `LIMITED DATA` country always has `LIMITED` confidence; its numeric risk remains diagnostic only.

## GLOBAL confidence

`globalConfidenceV51()` is separate from `globalRiskModel()` scoring. It uses:

- GLOBAL effective coverage;
- GLOBAL freshness coverage;
- weighted factor diversity;
- observed provider quality/fallback state;
- agreement across finite GLOBAL components;
- transparent frequency and revision-resilience metadata.

The existing GLOBAL numeric score and component scores are unchanged for identical finite inputs. Phase-2 GLOBAL eligibility still decides whether a normal risk band may be shown.

## Fallback behavior

A primary-source failure does not zero or delete an otherwise usable fallback datapoint. Instead:

1. provider/fallback metadata are preserved;
2. the datapoint may remain usable under existing module rules;
3. confidence/source quality is reduced;
4. one failed provider still does not stop independent modules.

No new provider, endpoint, fetch path, or refresh request was added in Phase 3.

## Export changes

The existing audit export now includes confidence/source-quality diagnostics, including where available:

- model confidence label;
- diagnostic confidence score;
- confidence components;
- source-quality grade/class;
- `fallbackUsed`.

The methodology export documents the confidence model and its exact implementation weights. Export sanitization and native Android download behavior are unchanged.

## Preserved behavior

Unchanged from v3.5.1.50:

- Country Risk numerical aggregation;
- GLOBAL Risk numerical aggregation and component scores;
- Phase-2 data/factor/freshness/effective coverage gates;
- risk-band thresholds;
- Phase-1 freshness semantics;
- Global Contagion;
- correlation mathematics;
- Macro formulas;
- Fiscal Stress methodology;
- Commodities/AGSI calculations;
- Equity Internals / S&P / company risk;
- ETF and dividend logic;
- P0/P1/P2/P3 scheduler;
- `fetchWithTimeout()` and provider request architecture;
- loading-progress UI;
- chart/sparkline calculations;
- Croatia always present / Bosnia removed;
- Android native export bridge.

## Validation

Deterministic release suite: **491/491 PASS**.

Phase-specific checks include:

- source classes A/B/C/D;
- fallback quality reduction without data deletion;
- complete coherent country => HIGH confidence;
- Phase-2 ineligible country => LIMITED confidence;
- disagreement lowers confidence without changing risk;
- GLOBAL confidence is independent of GLOBAL risk;
- fallback metadata do not alter GLOBAL risk score;
- export/UI methodology tokens present;
- GLOBAL numeric score/components are identical to v3.5.1.50 for identical finite inputs.

Physical Android/GrapheneOS installation, launch and live-provider interaction remain **NOT EXECUTED** because no ADB-connected device is available in this environment.
