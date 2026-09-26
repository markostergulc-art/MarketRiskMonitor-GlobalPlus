# Regression Report — Market Risk Monitor Global+ v3.5.1.62

## Baseline

- v3.5.1.61 / versionCode 94
- target v3.5.1.62 / versionCode 95
- scope: Phase 12 Source Resilience

## Protected calculations

Byte-equivalent comparison against `app_v35161_baseline.js` confirms no modification to:

- `globalRiskModel`
- `globalFactorArchitectureV53`
- `buildMacroCycle`
- `fiscalScoreRowsV43`
- `commodityShockRisk`
- `commodityRegime`
- `aggregateEquityInternalsV57`
- `lagAwareCorrMatrixV58`

## Network architecture

- raw `fetch(` call sites: **6 → 6**;
- no new provider endpoint family was added;
- cache remains after bounded live attempts;
- malformed/empty payloads are rejected before cache write;
- 429/timeout/5xx retry is bounded;
- ordinary non-transient 4xx does not retry;
- source failure classification is exported for diagnostics.

## Failure-isolation regression

Deterministic simulations cover timeout, malformed JSON, empty response, HTTP 429, HTTP 5xx and HTTP 4xx. Existing module-level guards remain present so failure of one provider/module does not abort unrelated modules.

## Automated result

```text
Phase 12                          73/73 PASS
Phase 11 compatibility           52/52 PASS
Phase 10 compatibility           61/61 PASS
Phase 9 compatibility            60/60 PASS
Phase 8 compatibility            71/71 PASS
Phase 7                          37/37 PASS
Phase 6 compatibility            67/67 PASS
Phase 5 compatibility            29/29 PASS
Phase 4                          33/33 PASS
Phase 3                          24/24 PASS
Freshness                        19/19 PASS
Fiscal/loading                   23/23 PASS
Parser fixtures                  29/29 PASS
AGSI country                     21/21 PASS
AGSI coverage                    10/10 PASS
Native export bridge             25/25 PASS
-------------------------------------------
TOTAL                           634/634 PASS
```

Additional checks: `node --check app.js` PASS; canonical JS == embedded WebView JS PASS; fallback APK structural verification PASS.

## Result

**PASS — Phase 12 accepted.**
