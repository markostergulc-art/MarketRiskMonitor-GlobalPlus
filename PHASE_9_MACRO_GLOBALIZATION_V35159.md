# Market Risk Monitor Global+ — Phase 9 Macro Globalization

## PHASE 9 COMPLETE

**Baseline:** v3.5.1.58 / versionCode 91  
**Target:** v3.5.1.59 / versionCode 92

## Scope

Phase 9 adds a separate regional/global macro architecture while preserving the existing macro calculation.

The application now exposes:

- **US Macro Cycle** — the existing `buildMacroCycle()` output, unchanged for reproducibility;
- **Euro Area Macro Cycle**;
- **China Macro Cycle**;
- **Japan Macro Cycle**;
- **Global Macro Cycle**.

Phase 9 does **not** silently replace the Phase-5 GLOBAL Risk macro factors. `globalFactorArchitectureV53()` and `globalRiskModel()` remain byte-identical to v3.5.1.58. Production integration of the new Global Macro Cycle is intentionally deferred until the later final architecture/validation phases.

## Regional weights

Fixed structural weights, not crisis-optimized:

| Region | Weight |
|---|---:|
| United States | 40% |
| Euro Area | 25% |
| China | 25% |
| Japan | 10% |

Global eligibility requires:

- at least **3 represented regions**;
- at least **65% weighted data coverage**.

Missing regions are never treated as zero risk. Available region weights may renormalize only after disclosure of `missingRegionWeightPct`, `availableWeight`, and `renormalizationFactor`.

## US Macro Cycle

`buildMacroCycle()` is unchanged from v3.5.1.58. The Phase-9 wrapper preserves its numerical score and regime exactly.

The historical small Germany-context weights inside the legacy inflation/recession model are retained only to preserve reproducibility. The UI and export identify this cycle as legacy-compatible and predominantly U.S.-centric.

## Euro Area Macro Cycle

Inputs:

- World Bank **EMU aggregate** GDP growth;
- Euro Area HICP from Eurostat via FRED (`CP0000EZCCM086NEST`);
- World Bank **EMU aggregate** unemployment;
- Germany OECD CLI as one contextual leading input.

Germany is explicitly **not** the sole proxy for the Euro Area. The Euro Area cycle remains eligible with sufficient EMU/HICP data even when the Germany CLI is absent.

If current Euro Area HICP is unavailable, annual World Bank inflation may be used only as an explicitly identified fallback; provenance changes to World Bank rather than being mislabeled as FRED/Eurostat.

## China Macro Cycle

Inputs:

- OECD amplitude-adjusted CLI via FRED (`CHNLOLITOAASTSAM`);
- World Bank China GDP growth;
- World Bank China inflation;
- World Bank China unemployment.

Because most non-CLI inputs are annual, the source mix is identified as annual-dominant and is not assigned the same confidence semantics as the higher-frequency U.S. cycle.

## Japan Macro Cycle

Inputs:

- OECD amplitude-adjusted CLI via FRED (`JPNLOLITOAASTSAM`);
- OECD industrial production YoY via FRED (`JPNPRINTO01GYSAM`);
- World Bank Japan GDP growth;
- World Bank Japan inflation;
- World Bank Japan unemployment.

The source-frequency mix is explicitly reported.

## New transparent transforms

Phase 9 extends the Phase-6 audit registry with:

- `macro_regional_growth`;
- `macro_regional_unemployment`;
- `macro_regional_cli`;
- `macro_regional_industrial`;
- `macro_regional_cycle`;
- `macro_global_cycle`.

These rules are labelled **HEURISTIC**. No claim of historical optimization or validated predictive superiority is made.

## UI changes

The existing Macro page keeps all previous U.S. Inflation/Recession detail and adds above it:

- Global Macro hero;
- regional cards for U.S., Euro Area, China and Japan;
- score/regime;
- coverage;
- confidence;
- source-frequency classification;
- missing regional weight disclosure.

No navigation redesign was introduced.

## Data/export changes

`globalMacroCycleV59` is persisted in the application snapshot.

The audit snapshot now contains `macroGlobalV59`, and `macro.csv` includes the separate regional macro input rows. Phase-9 transform traces are included in the existing Phase-6 score audit output.

## Files changed

Primary runtime files:

- `app.js`
- `app/src/main/assets/index.html`
- `app/build.gradle`
- `build_release.sh`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java`

New QA / release support:

- `tests/phase9_macro_globalization_v35159.js`
- Phase-9 compatibility tests for Phase 8, Phase 6 and fiscal/loading
- `tools/build_manual_apk_v35159.py`
- `tools/verify_fallback_apk_v35159.py`
- `PHASE_9_MACRO_GLOBALIZATION_V35159.md`
- `REGRESSION_V35159.md`
- `CHANGELOG_V35159.md`

## Validation

Phase-9 dedicated assertions: **60/60 PASS**.

Full selected release regression suite: **448/448 PASS**, covering Phase 9 through Phase 1 semantics, factor architecture, confidence, fiscal/loading, parsers, AGSI fixtures and native export bridge.

Specific Phase-9 validation confirms:

- legacy U.S. `buildMacroCycle()` is byte-identical to v3.5.1.58;
- `globalFactorArchitectureV53()` is byte-identical to v3.5.1.58;
- `globalRiskModel()` is byte-identical to v3.5.1.58;
- Euro Area can remain eligible without Germany CLI when aggregate Euro data are available;
- missing regions are not zero-filled;
- 2 represented regions cannot produce a normal Global Macro score;
- low weighted coverage blocks normal Global Macro status;
- China/Japan lower-frequency source mix does not silently receive U.S.-equivalent confidence;
- embedded WebView JS is byte-identical to canonical `app.js`;
- no new raw `fetch()` call site was added.

## Known limitations

- World Bank GDP/inflation/unemployment data are low-frequency and may be revised.
- China and Japan regional cycles therefore have less timely macro breadth than the U.S. legacy cycle.
- Germany CLI remains a Euro Area contextual input because a dependable current Euro Area CLI series was not used; it is only 20% of the Euro regional component budget and not required for Euro eligibility.
- Phase 9 does not claim predictive ability and does not optimize weights against historical crises.
- Global Macro is not yet production-weighted into GLOBAL Risk; that integration requires later point-in-time validation.

## Next phase

**Phase 10 — Fiscal Stress Role / Structural Vulnerability**.
