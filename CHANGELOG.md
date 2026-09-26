# Market Risk Monitor Global+ — 2026.09.26.1 / BUILD124

- Switched user-visible release versioning to `YYYY.MM.DD.N`; Android `versionCode` increased to 124.
- Core market cards (36/36) now prioritize GDP, CPI/inflation and unemployment with observation period or N/A.
- Extended country watch cards (50/50) use the same GDP/CPI/UNEMP priority and explicit N/A behavior.
- Removed the market-level Evidence button; the full market card is the detail/evidence entry point.
- Core market details now show macro provenance, frequency, scope, release/retrieval timestamps, freshness/eligibility, risk-model factor weights and contributions.
- Extended country details now show detailed World Bank evidence and reconstruct the extended macro score while remaining explicitly excluded from GLOBAL/core country risk.
- No GA2, risk-band, correlation, Shortage, Capital Rotation, Bonds, T212 or alert methodology changes.

# Changelog

## v3.10 / BUILD123 — Universal Market Details
- Added one universal Market Details layer for all 36 core markets.
- GDP growth, inflation and unemployment reuse existing core calculation inputs; missing values can be retried only when the market is opened.
- Added lazy, context-only World Bank WDI metrics: nominal GDP, GDP per capita and trade (% of GDP).
- Added per-country cache, fresh-cache request suppression, partial-error isolation and cross-market race protection.
- Expanded common market metrics to 1D, 1M, 3M, YTD, 1Y, drawdown, 200DMA distance and RV20.
- Explicitly separates data used in the risk/health model from context-only data.
- No market-level Evidence navigation; market click opens details directly.
- GA2/risk-band/correlation methodologies unchanged.

# v3.8 / BUILD121 — audit-driven correctness repair — 2026-09-26

- Implemented targeted F01–F13 corrections from the BUILD119 audit without retuning GA2 weights, risk bands, rotation weights or supported provider universes.
- Added fail-closed current-score eligibility for stale/invalid observations, strict calendar parsing, explicit source/cache provenance, and hard maximum age for stale HTTP cache.
- Energy spot history is retained separately from current-quote eligibility; refresh errors and ineligible stale quotes are disclosed as N/A.
- Bonds and Global Shortage now remain N/A when required evidence is absent or stale; Shortage decimal bands use <20/<40/<60/<80 and inventory-only evidence is labeled as pressure rather than confirmed physical shortage.
- EU gas days-of-demand uses matched geographic numerator/denominator scope only.
- Dividend safety requires minimum history; missing T212 fundamentals no longer create adverse claims.
- Export sanitizer preserves shared references, metric-level commodity exports retain original timestamps/provenance, and GA2 audit rows separate current architecture from Phase-5 legacy rows.
- Excel export identity updated to v3.8 / versionCode 121.
- Added v3.8 audit regression suite and self-contained Capital Rotation contributor XLSX fixture.
- Release identity: com.marko.marketrisk.globalplus, versionName 3.8, versionCode 121.
- Release APK signed with the existing Market Risk Monitor signing certificate; no replacement key generated.

# Market Risk Monitor Global+ — Changelog

This file consolidates the historical release notes, QA summaries, and build reports that were previously stored as per-build files. It is the authoritative release-history document for this source tree.

> Release signing secrets and private key material are intentionally not included in the public source package.

## Release history

### v3.5.1.75

- New **OBVEZNICE / BONDS** major tab.
- U.S. Treasury 3M/2Y/5Y/10Y/30Y curve with 1D/1W/1M bp changes.
- Curve shape plus bull/bear steepener/flattener classification.
- Daily German 2Y/5Y/10Y/30Y Bund curve from Deutsche Bundesbank.
- France/Italy/Spain 10Y sovereign spreads versus Germany.
- U.S. IG/HY and Euro HY option-adjusted spread diagnostics.
- U.S. 5Y/10Y real yields and breakeven inflation.
- UK/Japan 10Y benchmark context.
- Concrete bond ETF proxy section with T212 tradability only when T212 is configured.
- Early Warning diagnostic confirmation without changing Early Warning.
- T212 badges are completely hidden until credentials are saved.
- TEST/REMOVE controls are hidden until T212 is configured.
- Credentials persist across app restarts.
- Full Android source continues to use Android Keystore.
- Manual fallback runtime uses AES-GCM WebCrypto/IndexedDB encrypted persistence rather than session-only credentials.
- Global Risk / GA2
- Early Warning
- Structural Vulnerability / Contagion
Release: **Market Risk Monitor Global+ 3.5.1.75** (versionCode 108)
- Android manifest: `3.5.1.75 / 108`
- Visible application header: **v3.5.1_75**
- `build_release.sh`: `3.5.1.75 / 108`
- Previous stale visible `v3.5.1_74` header was removed.
- New **OBVEZNICE / BONDS** tab.
- Fixed-income regime model is descriptive, not a new Global Risk score.
- U.S. Treasury curve, German Bund curve, Euro sovereign spreads, credit OAS, real yields/breakevens, UK/Japan context, bond ETF proxies.
- Conditional Trading 212 tradability for ETF proxies.
- Persistent T212 credential storage and hidden pre-configuration T212 UI.
- applicationId: `com.marko.marketrisk.globalplus`
- versionName: `3.5.1.75`
- versionCode: `108`
- minSdk: `26`
- targetSdk: `35`
1. Persist Trading 212 credentials securely and hide T212 presentation until configured/verified.
2. Add the new additive **OBVEZNICE / BONDS** tab based on fixed-income research.
3. No changes to existing production risk/scoring formulas.

### v3.5.1.74

Targeted Trading 212 semantic correction only.
- Trading 212 badges now answer whether each displayed stock/ETF is available to trade on Trading 212.
- Source is the authenticated read-only `/api/v0/equity/metadata/instruments` catalog, not open positions.
- API key + secret remain configured only in Settings → Data.
- Badge colors distinguish tradable (muted green) from not available (muted red).
- Coverage remains global across S&P 500, country/industry stocks, stock details, ETF Intelligence/details, and Capital Rotation representatives/proxies.
- No score, risk formula, market calculation, navigation model, or order/trading action changed.
Release: `Market Risk Monitor Global+ 3.5.1.74` (`versionCode 107`)
Targeted change only:
- Trading 212 meaning corrected from portfolio membership to instrument tradability.
- Read-only source: `GET /api/v0/equity/metadata/instruments`.
- API key + secret configuration remains only in Settings → Data.
- Global badge coverage for stock/ETF UI.
- Muted green = tradable; muted red = unavailable; muted gray = not connected/N/A.
APK checks:
- package/version/minSdk/targetSdk: PASS
- ZIP integrity/alignment: PASS
Targeted correction of Trading 212 semantics only: badges now indicate whether a displayed stock/ETF is present in the authenticated Trading 212 tradable-instrument catalog. Portfolio-position membership is not used.
- versionName: `3.5.1.74`
- versionCode: `107`
`tests/trading212_tradability_v35174.js`: **18/18 PASS**
Validated:

### v3.5.1.73

Targeted Trading 212 integration scope only.
- Trading 212 API key and API secret configuration moved exclusively to Settings -> Data.
- Removed Trading 212 credential fields from Capital Rotation.
- One global read-only Trading 212 position state now serves all stock and ETF views.
- Trading 212 portfolio-presence badges are shown in:
- S&P 500 stock rows,
- country-company rows,
- industry-company rows,
- stock detail views (including loading/static states),
- ETF Intelligence rows,
- ETF detail views (including loading/error states),
- Capital Rotation equity representatives,
- Capital Rotation ETF proxy instruments.
- Existing Trading 212 endpoint remains read-only: open equity positions only.
- No order-placement endpoint or trading action was added.
- Global Risk, Early Warning, Capital Rotation scoring, country/market scoring, Macro, Fiscal, Commodities and Correlations are unchanged.
- Baseline: v3.5.1.72 / versionCode 105
- Target: v3.5.1.73 / versionCode 106
- Package: com.marko.marketrisk.globalplus
- Build path: standalone/manual WebView fallback APK
- Runtime: app/src/main/assets/index.html
- Release signing: existing project PKCS#12 release identity
- APK SHA-256: `b7624fc0a9db265ecca88399f5563200b44443a72fa9643419e1584ba6d92dec`
- V1: PASS
- V2: PASS
- V3: PASS
- versionName: 3.5.1.73
- versionCode: 106
- applicationId/package: com.marko.marketrisk.globalplus
- minSdk: 26
- targetSdk: 35
PASS — Trading 212 API key input exists only in Settings -> Data.
PASS — Trading 212 API secret input exists only in Settings -> Data.
PASS — old Capital Rotation key/secret inputs are absent.

### v3.5.1.72

Targeted Capital Rotation enhancement only.
- Trading 212 portfolio-presence badge beside every stock representative in Capital Rotation.
- Trading 212 portfolio-presence badge beside ETF proxies in Capital Rotation.
- Badge states:
- `T212 ✓ PORTFELJ` / `T212 ✓ IN PORTFOLIO`
- `T212 — NIJE` / `T212 — NOT HELD`
- `T212 · NIJE POVEZANO` / `T212 · NOT CONNECTED`
- loading/error state where applicable.
- Read-only Trading 212 portfolio connection panel inside the Capital Rotation tab.
- Secure Android-source credential store using Android Keystore (AES/GCM) for normal Gradle builds.
- Read-only native endpoint for Trading 212 open positions only.
- Capital Rotation scoring.
- Top-10 confirmation calculation.
- Global Risk / GA2 / Early Warning.
- Country/market scoring.
- Macro, Fiscal, Commodities, Correlations, ETFs, Dividends or other tabs.
- Existing order/trading functionality: none was added.
- API key and secret are never written to exports, reports, logs or application data model.
- versionName: 3.5.1.72
- versionCode: 105
- package/applicationId unchanged
- release certificate unchanged
- APK signing: V1 + V2 + V3 PASS
- APK ZIP integrity PASS
- source signing material retained as requested
The current execution environment does not provide a complete Android SDK/Gradle toolchain. The project's established manual APK fallback builder was therefore used for the installable artifact, followed by alignment and V1/V2/V3 signing...
The full source includes the native Android Keystore-backed Trading 212 credential bridge for a normal Android/Gradle build. The manual fallback APK uses the same Capital Rotation runtime but stores Trading 212 credentials only in sessio...
PASS:
- versionName 3.5.1.72
- versionCode 105
- app.js and runtime inline JavaScript synchronized
- read-only Trading 212 positions endpoint present
- no Trading 212 order endpoint/action added
- stock representative badges present
- ETF proxy badges present

### v3.5.1.71

- Added concrete exposure descriptions and measured proxies to Capital Rotation asset rows.
- Added lazy **Equities · 10 Largest Representatives** section with 14 groups.
- Added market-cap ranking via Yahoo fundamentals time-series when comparable.
- Added issuer-snapshot modes for IWM Small Caps, EEM Emerging Markets and VGK Europe.
- Added company ticker, theme/sector, country, market cap, 1M trend and parent-bias confirmation.
- Added `Top-10 confirmation X/N` as an explainability-only signal.
- Added independent 8-hour cache and per-group refresh for representatives.
- Preserved all existing Capital Rotation scoring and all protected risk engines.
- Bumped versionName to 3.5.1.71 and versionCode to 104.
- Preserved bundled project release signing material as explicitly requested by the project owner.
- versionName: 3.5.1.71
- versionCode: 104
- package: com.marko.marketrisk.globalplus
- minSdk: 26
- targetSdk: 35
The environment did not provide the full Android Gradle SDK toolchain. The project's established manual fallback builder was therefore used. The fallback package embeds the exact release `app/src/main/assets/index.html` and preserves the...
The APK was signed using the existing project PKCS#12 release identity bundled under `signing/`, following the established sequence:
1. V1/JAR signing
2. 4-byte realignment
3. APK Signature Scheme v2 + v3 signing
Capital Rotation concrete-asset explainability + equity Top-10 representatives only.
PASS:
- versionName `3.5.1.71`
- versionCode `104`
- 14 representative groups present
- concrete-exposure / measured-proxy labels present
- Yahoo fundamentals market-cap endpoint present
- Top-10 section present

### v3.5.1.70

- Added dedicated ROTACIJA KAPITALA / CAPITAL ROTATION tab.
- Added projected destination/outflow bias matrix with explicit confidence and market confirmation.
- Added stress-type classification: growth, inflation, liquidity/credit, fiscal/sovereign, commodity, systemic, mixed.
- Added lazy/cache-first cross-asset confirmation for USD, Treasuries, gold, CHF/JPY, defensive/cyclical equities, credit, EM and commodity groups.
- Added regional relative-bias section with China strictly tied to the real CSI 300 series.
- Existing GA2/Early Warning/risk formulas unchanged.
- Signing material retained in source bundle per project workflow.
- versionName: 3.5.1.70
- versionCode: 103
- target artifact: MarketRiskMonitor_GlobalPlus_v3.5.1.70_INSTALLABLE.apk
The available build environment did not provide the full Android Gradle SDK toolchain, so the project's established manual APK fallback builder was used. The final runtime asset is the same `app/src/main/assets/index.html` contained in t...
The APK was signed with the existing project release PKCS#12 material included under `signing/`.
Verification completed for:
- V1/JAR signature
- APK Signature Scheme v2
- APK Signature Scheme v3
The signer certificate matches v3.5.1.69, preserving upgrade compatibility.
- applicationId/package identity unchanged
- release certificate SHA-256: C1:7F:DF:8D:2F:C5:0D:B4:BF:77:57:7F:B3:D6:D9:D9:10:5E:00:F2:B5:95:2D:F3:62:F7:C2:7C:AD:8A:16:B6
- same V2/V3 signer certificate as v3.5.1.69
PASS — overall projection is unavailable when Early Warning is unavailable/insufficient.
PASS — growth-shock risk-off fixture favors long Treasuries over high-yield credit and assigns negative pressure to HY.
PASS — inflation-shock fixture does not automatically classify long-duration Treasuries as an inflow destination; Gold ranks above long duration in the fixture.

### v3.5.1.69

- Fixed CN/PH market history acceptance: one-point metadata-only Yahoo results are no longer treated as usable market history.
- Added targeted same-symbol Yahoo recovery for CSI 300 and PSEi using forced explicit-period history and a Yahoo historical-page fallback.
- Restored GA2 layer-state wiring into `appState.global`, enabling Current Condition / Early Warning / Structural Vulnerability / Contagion cards to display calculated data.
- Added ALFRED current-vintage fallback for FRED CSV HTTP 403 and a session circuit breaker to avoid repeated known-blocked FRED graph requests.
- Preserved all existing scoring formulas, thresholds, weights and protected model functions.
- Bumped release metadata to versionName 3.5.1.69 / versionCode 102.
- Bundled the existing release signing material in `signing/` at the project owner's explicit request.
- Package: `com.marko.marketrisk.globalplus`
- Version: `3.5.1.69`
- Version code: `102`
- Min SDK: 26
- Target SDK: 35
- Build artifact: standalone installable WebView APK using the established project fallback builder
- Release signing: existing project PKCS#12 key
- Signature schemes: V1 + V2 + V3
- Upgrade certificate: unchanged from v3.5.1.68
- Release source includes `signing/MarketRiskMonitor_GlobalPlus_release.p12` and `signing/keystore.properties` at the project owner's explicit request.
`tests/hotfix_v35169.js`: **29/29 PASS**
Validated:
- versionName/versionCode/header/export metadata,
- runtime JS byte-identical between `app.js` and packaged `index.html`,
- CN/PH >=5-observation acceptance gate,
- original CSI 300 / PSEi and FX tickers preserved,
- recovery limited to CN/PH,
- explicit-period cache bypass,

### v3.5.1.68

Targeted hotfix over v3.5.1.67.
- Restored the missing `countryScoreTracesV56()` implementation used by the existing export/audit path. This removes the `ReferenceError: countryScoreTracesV56 is not defined` failure without removing country traces or changing score cal...
- Added CN/PH-only primary-history recovery. China remains CSI 300 (`000300.SS`) and Philippines remains PSEi (`PSEI.PS`). The existing Yahoo `3y` request remains first; only those two symbols retry `2y`, then `1y`, through the unchanged...
No change to scoring arithmetic, weights, thresholds, GLOBAL Risk, Macro, Fiscal Stress, Commodities, correlation logic, source-resilience architecture, cache implementation, progress UI, refresh behavior, navigation, ETFs, dividends, pa...
- versionName: `3.5.1.68`
- versionCode: `101`
- applicationId: `com.marko.marketrisk.globalplus`
READY.
- source/runtime parity: PASS
- targeted QA: PASS
- protected regression QA: PASS
**Not produced in this execution environment.**
Two required release-build dependencies are unavailable here:
1. Android SDK/build-tools (`sdkmanager`, `aapt2`, `apksigner`, `zipalign`, `adb`) are not installed or discoverable.
`node tests/hotfix_v35168.js`
- Result: **17/17 PASS**
- Export version/code verified: 3.5.1.68 / 101
- Runtime WebView JavaScript verified byte-identical to canonical `app.js`
- `countryScoreTracesV56()` restored and consumed by the existing score-audit snapshot
- Country risk data preserved in exported traces
- China recovery verified: `3y -> 2y` on the same Yahoo symbol
- Philippines recovery verified: `3y -> 2y -> 1y` on the same Yahoo symbol

### v3.5.1.67

- versionCode 100 / versionName 3.5.1.67.
- Added structured `METHOD-V2-1` methodology snapshot.
- Added 18 explicit model records with purpose, raw inputs, provider/date/frequency/freshness, transforms, direction, thresholds/windows, weights, missing-data rules, eligibility, coverage, confidence and aggregation.
- Added full GA2 dependency tree including Phase-5 nested factor tree.
- Added normalized Early Warning classification while preserving internal classes.
- Added explicit correlation return, session/timezone alignment and window disclosure.
- Standalone Methodology download now exports V2 Markdown.
- Current Data ZIP now includes `methodology_v2.json` and `methodology_v2.md`.
- Fixed Phase-17 audit-average helper so null/blank values are excluded rather than coerced to zero.
- No production score, GA2 formula, risk band, hysteresis or Phase-16 explanation arithmetic changed.
- Raw `fetch()` call sites remain 6.
- Full regression: 1113/1113 PASS.
PASS - versionCode 100
PASS - versionName 3.5.1.67
PASS - visible header v3.5.1_67
PASS - release metadata 3.5.1.67 / 100
PASS - release self-check expects versionCode 100
PASS - native UA v3.5.1.67
PASS - export metadata 3.5.1.67 / 100
PASS - embedded WebView JS byte-identical to app.js

### v3.5.1.66

- Updated version to 3.5.1.66 / versionCode 99.
- Preserved Phase-15 GA2 production scoring without numerical changes.
- Added compact GLOBAL Risk metadata: confidence, factor coverage, freshness coverage and effective coverage.
- Added separate Current Condition, Early Warning, Structural Vulnerability and Contagion layer summaries.
- Added deterministic `Why is the score X?` explanation based only on live model values and the fixed GA2 formula.
- Added deterministic highest-risk-pressure and largest-offset contributor ranking.
- Re-aligned Overview risk drivers to the production Current Condition factors.
- Missing data remains N/A; no zero fill.
- No new raw fetch call site.
- Added Phase-16 regression suite; full release QA 970/970 PASS.
PASS - versionCode 99
PASS - versionName 3.5.1.66
PASS - visible header v3.5.1_66
PASS - release metadata 3.5.1.66 / 99
PASS - native UA v3.5.1.66
PASS - export metadata 3.5.1.66 / 99
PASS - Phase16 adds no raw fetch callsite

### v3.5.1.65

- Added production GLOBAL architecture `GA2`.
- Replaced the flat production interpretation with layered Current Condition + Leading Warning + Structural Vulnerability + bounded Contagion Amplifier.
- Preserved Phase-5 factor architecture as auditable legacy/raw factor model.
- Consolidated Macro Growth + Inflation budget into Phase-9 Global Macro when eligible, with explicit legacy fallback.
- Removed correlation from the base Current Condition average.
- Added positive-only capped warning adjustment: max +10.
- Added positive-only capped structural adjustment: max +5.
- Added non-negative contagion multiplier capped at 1.15.
- Added GDP-weighted comparable fiscal structural aggregation with 35% single-country cap.
- Added GA2 layer coverage and confidence accounting.
- Added Phase-15 audit transforms and methodology export section.
- Extended Phase-14 PIT snapshots with final architecture/layers/formula.
- Kept Phase-13 numeric score/hysteresis separation intact.
- No new raw network fetch call sites.
- Target version: 3.5.1.65 / versionCode 98.
Market Risk Monitor Global+ v3.5.1.65 — Phase 15 QA
RESULT: PASS
Automated checks: 905/905 PASS
JavaScript syntax: PASS
Python compile: PASS
APK structural/alignment verification: PASS
Clean-source revalidation: PASS — 905/905
Raw fetch call sites: 6 -> 6

### v3.5.1.64

Baseline: v3.5.1.63 / versionCode 96
Release: v3.5.1.64 / versionCode 97
This release adds reproducible point-in-time historical-validation infrastructure without retuning the production GLOBAL Risk model.
- Contemporaneous point-in-time validation snapshots captured after each successful refresh.
- Strict vintage eligibility checks for reconstructed history; missing release timestamps and future-available inputs are rejected in strict mode.
- Forward outcome calculations for 21, 63, 126 and 252 trading days.
- Forward return, maximum forward drawdown, annualized volatility, HY spread widening, VIX stress and externally supplied recession outcomes.
- Precision, recall, false-positive rate, false-negative rate, confusion matrix, ROC/AUC and PR-AUC helpers.
- Conditional-forward-drawdown diagnostics.
- Event-window warning-lead analysis for the requested historical stress windows.
- One-factor-at-a-time Phase-5 weight sensitivity at 80% / 100% / 120% of baseline weight.
- Diagnostic threshold study using current 25 / 45 / 60 / 75 bands plus a 20..80 candidate grid.
- Offline reproducible tool: `tools/historical_validation_v35164.py`.
- Data-export files for validation manifest, readiness, point-in-time snapshots, weight sensitivity and event-window diagnostics.
- Methodology-export documentation for Phase 14.
- Production factor weights are unchanged.
- Production risk-band thresholds are unchanged.
- Numerical GLOBAL Risk calculation is unchanged.
===== tests/phase14_historical_validation_v35164.js =====
PASS - versionCode 97
PASS - versionName 3.5.1.64
PASS - visible header v3.5.1_64
PASS - release metadata v3.5.1.64 / 97
PASS - native user-agent v3.5.1.64
PASS - export metadata v3.5.1.64 / 97
PASS - embedded WebView JavaScript byte-identical to app.js

### v3.5.1.63

- Added runtime-flap-gated status hysteresis without changing any numeric risk score.
- Preserved the raw risk-band boundaries `<25 / <45 / <60 / <75 / >=75` exactly.
- Added 20-observation local-history analysis for near-boundary chatter.
- Requires at least 3 crossings within ±5 score points of the relevant boundary before hysteresis can activate.
- Worsening transitions always enter the higher-risk band immediately at the original threshold.
- After proven flapping, de-escalation uses a 3-point exit buffer only at the relevant boundary.
- Stored raw band, displayed/current band, previous band and hysteresis diagnostics separately.
- Extended history/event reporting and audit/methodology exports with status-transition metadata.
- Country cards, GLOBAL gauge and Overview risk counts now use the stabilized display band while keeping the original numeric score.
- No model weights, scoring formulas, provider logic, cache architecture or raw fetch call sites changed.
PASS - package/version/minSdk/targetSdk/launcher
PASS - ZIP integrity and STORED alignment
PASS - embedded index.html byte-identical to release source
PASS - no broad storage permission
PASS - fallback DEX exposes @JavascriptInterface saveExportFile
PASS - fallback DEX wires addJavascriptInterface
PASS - MediaStore Downloads URI / relative path present
classes_dex_sha256 70b9a6162c6514f2dca15243407a34a8b271d17c4d2a4193523a9ed77918c83e
resources_arsc_sha256 698bae3d88dca55eae07586fd95ce0d4d7f29d89fbb61b239eb63db1f7caabf9
apk_sha256 d403f057f6432dc7075cb6d3d3aadfa15c9d5f93f98f01ff5c467f49814fc5e9
===== tests/phase13_score_hysteresis_v35163.js =====
PASS - versionCode 96
PASS - versionName 3.5.1.63
PASS - visible header v3.5.1_63
PASS - release metadata v3.5.1.63 / 96
PASS - native user-agent v3.5.1.63
PASS - export metadata v3.5.1.63 / 96
PASS - embedded WebView JavaScript byte-identical to app.js

### v3.5.1.62

- Added explicit five-class provider taxonomy.
- Added provider resilience registry and documented fallback policies.
- Added failure classification for timeout, 429, 5xx, 4xx, malformed JSON, empty response and network failures.
- Added bounded retry/backoff to the existing central transport path.
- Prevented malformed/empty payloads from being written to cache.
- Preserved stale-cache fallback with explicit degraded/fallback metadata.
- Extended Provider Health with source class, latest failure class and attempt count.
- Added source-resilience diagnostics to data/methodology export.
- Added deterministic failure simulations and compatibility/regression coverage.
- No production risk weights or scoring formulas changed.
- Raw fetch call-site count unchanged.
=== Market Risk Monitor Global+ v3.5.1.62 Phase 12 Release QA ===
PASS - versionCode 95
PASS - versionName 3.5.1.62
PASS - visible header v3.5.1_62
PASS - release metadata v3.5.1.62 / 95
PASS - native user-agent v3.5.1.62
PASS - export metadata v3.5.1.62 / 95

### v3.5.1.61

- separated commodity **PHYSICAL SUPPLY RISK** from existing **PRICE / MARKET RISK**;
- preserved existing commodity price-risk and GLOBAL Risk calculations;
- extended AGSI country parsing with annual consumption, injection and withdrawal fields;
- added EU gas physical metrics for seasonal deviation, YoY fill difference, flow velocity and days-of-demand where denominator coverage is reliable;
- added conservative EU aggregate denominator eligibility so missing country demand is not silently redistributed or zero-filled;
- added U.S. gas physical flow/seasonal interpretation without fabricating demand coverage;
- separated SPR physical capacity use from oil price risk;
- restricted progress bars to genuinely bounded 0–100 metrics (fill and seasonal percentile);
- added Phase-11 physical commodity snapshot/audit export;
- kept physical commodity diagnostics out of production GLOBAL Risk pending later historical validation;
- versionName 3.5.1.61 / versionCode 94;
- release QA: 561/561 assertions PASS.

### v3.5.1.60

- Reclassified the fiscal module as **Fiscal Structural Vulnerability**, a slow-moving structural diagnostic rather than a fast daily-risk signal.
- Preserved existing fiscal datasets and the legacy v43 scoring function for regression/audit reproducibility.
- Added a primary structural score based on debt/GDP, debt trend, fiscal balance, primary balance, interest burden and structural r-g.
- Added explicit government-scope metadata and excluded central-government fallback rows from comparable general-government rankings.
- Added semantic module status `NO ELIGIBLE CURRENT DATA` when no current comparable structural row is eligible.
- Separated `structural r-g`, `debt repricing gap`, and `marginal refinancing pressure`.
- Added a separate Market Refinancing Pressure score; it does not modify the structural score.
- The current marginal-refinancing metric is explicitly disclosed as a latest-available nominal-GDP-growth proxy because the current fiscal source set has no reliable country-level expected nominal-growth series.
- Extended methodology/data exports and Phase-6 score traces with Phase-10 semantics.
- Production GLOBAL Risk integration remains disabled.
- Protected legacy fiscal scoring functions remain byte-identical to v3.5.1.59.
- Protected GLOBAL Risk and US Macro functions remain unchanged.
- No new raw `fetch()` call sites were added.
- Release QA: 509/509 JavaScript assertions PASS, plus JavaScript syntax and APK structural verification.

### v3.5.1.59

- Added separate US, Euro Area, China and Japan macro cycles.
- Added transparent Global Macro Cycle with fixed 40/25/25/10 regional weights.
- Preserved the existing U.S.-centric `buildMacroCycle()` calculation unchanged.
- Added Euro Area aggregate data using World Bank EMU plus Eurostat HICP via FRED; Germany remains context, not sole proxy.
- Added current OECD CLI series for China and Japan, plus Japan industrial production.
- Added explicit regional data coverage, confidence, source-frequency and missing-region-weight semantics.
- Missing regional data are never converted to zero risk.
- Added Phase-9 audit transforms and regional/global macro export metadata.
- Kept Phase-5 production GLOBAL Risk arithmetic unchanged.
- Version bumped to 3.5.1.59 / versionCode 92.
=== Market Risk Monitor Global+ v3.5.1.59 Phase 9 Release QA ===
PASS - versionCode 92
PASS - versionName 3.5.1.59
PASS - visible header v3.5.1_59
PASS - release metadata v3.5.1.59 / 92
PASS - native user-agent version 3.5.1.59
PASS - export metadata v3.5.1.59 / 92
PASS - embedded WebView JavaScript byte-identical to canonical app.js

### v3.5.1.58

- Preserved the original 20D / 60D / 120D / 252D / 3Y same-date correlation matrix as **DESCRIPTIVE correlation**.
- Added a separate **SYSTEMIC lag-aware** correlation methodology (`LAG-AWARE-REGIONAL-V1`).
- Added explicit trading-session mapping for every active core market.
- Asia-Pacific ↔ Americas now aligns `Asia_t` to the latest distinct Americas close strictly before the Asian date.
- Same-session, Asia-Pacific ↔ Europe/MEA and Europe/MEA ↔ Americas pairs retain fixed same-date rules; no universal lag is applied.
- Added no-look-ahead protection and holiday duplicate-return protection.
- Fixed GLOBAL systemic correlation production window at 60D; exploratory window changes no longer mutate GLOBAL contagion.
- Routed lag-aware correlation into cross-asset systemic finalization, GLOBAL contagion, hidden-risk systemic diagnostics and the `CORRELATION_CONTAGION` GLOBAL factor.
- Added separate SYSTEMIC and DESCRIPTIVE correlation cards in the UI.
- Added representative naive-vs-lag comparisons for US↔Asia, Europe↔Asia and US↔Europe.
- Correlation history is explicitly labeled descriptive same-date history.
- Expanded correlation/audit export with descriptive/systemic values, alignment rules, session map, coverage and methodology metadata.
- Updated visible/application version to 3.5.1.58 / versionCode 91.
- No new provider dependency and no new raw `fetch()` call site.
=== Market Risk Monitor Global+ v3.5.1.58 Phase 8 Release QA ===
PASS - versionCode 91
PASS - versionName 3.5.1.58
PASS - visible header v3.5.1_58
PASS - release metadata v3.5.1.58 / 91
PASS - native user-agent version 3.5.1.58
PASS - export metadata v3.5.1.58 / 91

### v3.5.1.57

- Replaced equal-market GLOBAL equity-internals aggregation with fixed regional weighting plus capped intra-region structural importance.
- Added seven regional buckets totaling 100%.
- Added explicit market-to-region mappings and transparent structural-importance coefficients for all active core markets.
- Added 70% maximum share for one market within a multi-market region.
- Added minimum 3-region / 40% weighted-coverage eligibility gate.
- Missing regions now reduce coverage and are explicitly disclosed; they are never inserted as zero risk.
- Preserved legacy equal-market aggregation for before/after diagnostics.
- GLOBAL `EQUITY_INTERNALS` production factor remains 10%; no Phase-5 factor weight was changed.
- Added `equity_regions.csv` to data export.
- Expanded methodology/audit export with region weights, caps, coefficients, coverage and renormalization diagnostics.
- Updated visible/application version to 3.5.1.57 / versionCode 90.
- No new network provider or `fetch()` path.
=== Market Risk Monitor Global+ v3.5.1.57 Phase 7 Release QA ===
PASS - function present: equityGlobalEligibilityV42
PASS - function present: aggregateEquityInternalsV42
PASS - function present: cappedNormalizeV57
PASS - function present: equityRegionV57
PASS - function present: aggregateEquityInternalsV57
PASS - constant present: EQUITY_REGION_WEIGHTS_V57
PASS - constant present: EQUITY_MARKET_REGION_V57

### v3.5.1.56

- Added score audit schema `SA1`.
- Added static transform registry with thresholds, parameters, directions, source functions and provenance.
- Added runtime score traces for Country, Macro, Early Warning, Fiscal and GLOBAL Risk.
- Added `score_transforms.json`, `score_traces.json`, and `score_traces.csv` to Data export.
- Extended methodology export with the generated transform catalogue.
- Explicitly distinguishes `HEURISTIC`, `HISTORICAL`, and `PROVIDER_STANDARD` provenance.
- Historical percentile normalization can separately mark heuristic risk-bucket mapping.
- No production score formula, factor weight, refresh architecture, cache logic, lazy loading or provider-fetch architecture changed.
- versionName: `3.5.1.56`
- versionCode: `89`
PASS - versionCode 89
PASS - versionName 3.5.1.56
PASS - visible header v3.5.1_56
PASS - release metadata v3.5.1.56 / 89
PASS - native user-agent version 3.5.1.56
PASS - export metadata v3.5.1.56 / 89
PASS - embedded WebView JavaScript byte-identical to canonical app.js
PASS - Phase-6 audit schema SA1 present

### v3.5.1.55

Corrective hotfix after v3.5.1.54. No Phase-6 methodology work is included.
- Restored `anomalyFamily()` and `hiddenRiskAnomaly()` that were still called by `refreshAll()` but were missing from the active runtime bundle.
- This removes the `ReferenceError` that occurred after live providers had already loaded and caused the whole Overview to fall into the emergency `0% / LIMITED DATA / cached-offline` state.
- Wrapped the optional Hidden Risk / Anomaly diagnostic in `safeDiagnosticV55()` so failure of this diagnostic cannot abort a successful refresh.
- Hardened other non-core post-processing actions (special-risk explanation, top-risk explanation, history persistence, snapshot persistence, scheduler/alerts) so optional diagnostics/persistence cannot discard already-fetched live data.
- Split GLOBAL regime from confidence/coverage metadata. The H2 now contains only the regime; confidence/data/factor/freshness coverage use a compact secondary metadata row.
- Retained the fixed-height refresh/status slot from v3.5.1.54, preventing page reflow while refresh states change.
- Phase-5 factor weights and `globalRiskModel()` mathematics.
- Phase-4 Early Warning classification/aggregation.
- Phase-3 confidence model.
- Phase-2 coverage/eligibility gates.
- Phase-1 freshness semantics.
- Network source list or number of raw `fetch()` call sites.

### v3.5.1.54

- Added a fixed-height top refresh/status stage to eliminate vertical page jumping during refresh-state transitions.
- Refresh, deferred loading and module-priority status now reuse one reserved layout slot.
- Added deterministic `LIMITED DATA` rendering when live refresh fails without a cached snapshot; Overview no longer remains indefinitely in `Loading...`.
- Added per-module render failure isolation.
- Added a safe failure boundary around the unchanged Phase 5 GLOBAL model.
- Added one bounded retry for transient failures during forced/fresh requests.
- Expanded CFTC source fallback chain to current Reporting Hub -> legacy Socrata -> legacy CFTC text report.
- Hardened native Android proxy/cache source for successful-response-only caching and bounded stale fallback.
- No Phase 1–5 methodology/scoring changes.
Market Risk Monitor Global+ v3.5.1.54 QA
Generated: 2026-09-15
PASS - versionCode 87
PASS - versionName 3.5.1.54
PASS - visible header v3.5.1_54
PASS - release metadata v3.5.1.54 / 87
PASS - embedded app.js byte-identical
PASS - fixed top status stage present

### v3.5.1.53

- Replaced broad GLOBAL raw-signal aggregation with an explicit raw → subfactor → factor → GLOBAL hierarchy.
- Added ten production factor families: Credit, Funding & Liquidity, Volatility, Equity Internals, Rates, Macro Growth, Inflation, FX, Commodities, Correlation / Contagion.
- Preserved the previous broad economic weight budget rather than retuning weights.
- Added bounded subfactors so correlated raw series do not gain extra final-model weight merely because more related series exist.
- Added same-name raw-row de-duplication inside factor extraction.
- Preserved all existing raw indicator displays.
- Kept Structural Financial Vulnerability diagnostic-only in Phase 5.
- Kept Fiscal Stress outside production GLOBAL weighting pending its dedicated structural-vulnerability phase.
- Added `legacyGlobalRiskV52()` for auditable old/new comparison only.
- Added factor contribution, completeness, freshness and old/new comparison metadata to GLOBAL audit/methodology export.
- Preserved Phase 1 freshness, Phase 2 coverage/LIMITED DATA, Phase 3 confidence and Phase 4 Early Warning semantics.
- Added no provider and no network request; `fetch()` call-site count remains 6.
- Version bumped to `3.5.1.53` / `86`.
Market Risk Monitor Global+ v3.5.1.53 / versionCode 86
SOURCE VALIDATION: PASS
- app.js syntax: PASS
- canonical app.js == embedded index.html application script: PASS
- Phase 5 factor architecture: 29/29 PASS
- Phase 5 regression: 76/76 PASS
- selected release QA: 289/289 PASS
- fetch call sites: 6 baseline / 6 target
FALLBACK APK ASSEMBLY: PASS (UNSIGNED)
- package: com.marko.marketrisk.globalplus
PASS - function present: factorRowsV53
PASS - function present: factorRowsMatchV53
PASS - function present: factorSubRowsV53
PASS - function present: factorSubValueV53
PASS - function present: factorRecordV53
PASS - function present: factorContributionV53
PASS - function present: legacyGlobalRiskV52
PASS - function present: globalFactorArchitectureV53

### v3.5.1.52

- Added deterministic timing classes: LEADING, EARLY_CONFIRMATION, CURRENT_STRESS, LATE_CONFIRMATION, STRUCTURAL.
- Sahm Rule and loan delinquency are no longer semantically presented as forward-looking warnings.
- Yield curve, OECD CLI, SLOOS lending standards and selected claims/permit signals remain identifiable as leading signals.
- Added separate Leading Warning, Current Stress, Confirmation and Structural Vulnerability scores.
- Removed the need for a single misleading Early Warning total; no new unified total is introduced.
- Confirmation layer uses explicit 65/35 early-vs-late confirmation weighting with missing-class renormalization.
- Added composite exclusion inside Phase-4 class scores when underlying raw class indicators are present.
- Grouped the existing Early Warning UI by timing semantics without changing navigation.
- Relabeled existing Cross-Asset aggregate as Cross-Asset Current Stress in the Early view.
- Extended data/methodology export with signal class, timing role, reasoning and layer summary.
- Production GLOBAL Risk, recession/inflation formulas, freshness, coverage and confidence formulas remain unchanged.
- Version bumped to 3.5.1.52 / 85.
Market Risk Monitor Global+ v3.5.1.52 / versionCode 85
SOURCE VALIDATION: PASS
- app.js syntax: PASS
- canonical app.js == embedded index.html application script: PASS
- Phase 4 semantics: 33/33 PASS
- Phase 4 regression: 80/80 PASS
- selected release QA: 286/286 PASS
FALLBACK APK ASSEMBLY: PASS (UNSIGNED)
- package: com.marko.marketrisk.globalplus
- versionName: 3.5.1.52
PASS - function present: earlyClassMetaV52
PASS - function present: earlySignalClassificationV52
PASS - function present: isEarlyCompositeV52
PASS - function present: annotateEarlySemanticsV52
PASS - function present: earlyClassScoreV52
PASS - function present: earlyWarningLayersV52
PASS - Sahm is late confirmation
PASS - Sahm macro row is late confirmation

### v3.5.1.51

Date: 2026-09-15
- Added a model-confidence layer that is explicitly separate from the numerical risk score.
- Added user-facing confidence classes: `HIGH`, `MEDIUM`, `LOW`, `LIMITED`.
- Added transparent confidence inputs: effective coverage, freshness, factor diversity, source quality, factor agreement, data frequency and revision resilience.
- Added A/B/C/D source-quality metadata and source classes.
- Added explicit `fallbackUsed` tracking so weaker/stale fallback data can remain usable without appearing equivalent to primary data.
- Added compact confidence presentation to Markets cards and Country detail.
- Added confidence/source-quality diagnostics to data export and methodology export.
- Country and GLOBAL numerical risk formulas are unchanged.
- Phase-1 freshness semantics are unchanged.
- Phase-2 Coverage/LIMITED DATA gates are unchanged.
- Fiscal Stress, Macro, Correlation, Commodities/AGSI, Equity Internals, company, ETF and dividend calculations are unchanged.
- P0/P1/P2/P3 loading scheduler, cache/lazy-load architecture and network endpoints are unchanged.
- Croatia remains always included; Bosnia remains removed.
- Native Android export/download bridge remains unchanged.
- Deterministic QA: 491/491 PASS.
- V1/V2/V3 signatures verified with the existing release certificate.
- Physical Android/GrapheneOS test: NOT EXECUTED (no ADB device available).
Market Risk Monitor Global+ v3.5.1.51 — Phase 3 Release QA
Baseline: v3.5.1.50 / versionCode 83
Target: v3.5.1.51 / versionCode 84
SOURCE / VERSION
PASS - authoritative v3.5.1.50 source used
PASS - versionName 3.5.1.51 / versionCode 84
PASS - package com.marko.marketrisk.globalplus unchanged

### v3.5.1.50

Date: 2026-09-14
- Added explicit **Data Coverage**, **Factor Coverage** and **Freshness Coverage** semantics to Country Risk.
- Kept Country Risk renormalization, but added an eligibility gate before any normal GREEN / LIGHT GREEN / ORANGE / DARK ORANGE / RED status can be shown.
- Country gate: effective weighted coverage >=50%, >=3 independent factor groups, and a MARKET factor.
- Coverage-ineligible country scores remain diagnostic but are shown as **LIMITED DATA** with neutral presentation and are excluded from normal country Top Risk ranking.
- Added separate GLOBAL Risk Data / Factor / Freshness / Source-validity coverage.
- GLOBAL effective coverage is a conservative minimum of those coverage dimensions.
- GLOBAL gate: effective coverage >=50% and >=5/9 top-level factor groups.
- Coverage-limited GLOBAL Risk uses **LIMITED DATA**, neutral gauge presentation, no normal threshold alert, and no normal history point.
- Legacy snapshots without Phase-2 coverage metadata are conservatively LIMITED until refreshed.
- Audit exports now include Phase-2 country/global coverage and eligibility fields.
- Methodology export documents the Phase-2 gates.
- `weightedScore()` and normal risk-band thresholds are unchanged.
- GLOBAL numeric finite-input score arithmetic and weights are unchanged.
- Phase-1 freshness semantics are unchanged.
- Fiscal Stress, Macro detectors, Correlation, Commodities/AGSI, Equity Internals, S&P/company risk, ETF and dividend calculations are unchanged except where Phase-2 coverage consumes their already-computed outputs.
- Loading scheduler, network architecture, cache transport, graph/sparkline logic and native Android export bridge are unchanged.
- Croatia remains in Markets and Bosnia remains removed.
Market Risk Monitor Global+ v3.5.1.50 — Phase 2 Release QA
Baseline: v3.5.1.49 / versionCode 82
Target: v3.5.1.50 / versionCode 83
PASS - authoritative v3.5.1.49 source used
PASS - versionName 3.5.1.50 / versionCode 83

### v3.5.1.49

Date: 2026-09-14
- Replaced age-only generic freshness classification with a release-aware freshness layer.
- Separated observation age from expected-release status.
- Added statuses: `CURRENT`, `LATE`, `OLD_BUT_CURRENT_RELEASE`, `STALE`, `UNKNOWN`.
- Added frequency-aware handling for daily, weekly, monthly, quarterly, annual and event-driven data.
- Added vetted cadence rules for NFCI-family/STLFSI4 and H.8 deposit release timing.
- Quarterly series without a dependable next-release schedule keep `expectedNextRelease=null` instead of using fabricated dates.
- Enriched Early Warning and macro audit metadata with frequency/release/freshness fields.
- Added compact freshness detail presentation where release metadata are available.
- Financial score formulas and weights are unchanged.
- Country/market universe unchanged from v3.5.1.48: Croatia retained; Bosnia absent.
- P0/P1/P2/P3 loading scheduler and network fetch wrapper unchanged.
- Native export/download bridge unchanged.
- Fiscal Stress methodology unchanged.
- Chart and market-card sparkline period logic unchanged.
- Providers, cache architecture and refresh architecture unchanged.
- versionName: `3.5.1.49`
- versionCode: `82`
Market Risk Monitor Global+ v3.5.1.49 — Phase 1 Release QA
Baseline: v3.5.1.48 / versionCode 81
Target: v3.5.1.49 / versionCode 82
PHASE 0
PASS - actual v3.5.1.48 baseline inspected before modification
PASS - scoring/freshness/confidence/coverage implementation map produced
PASS - Phase 0 changed no production code

### v3.5.1.48

Date: 2026-09-14
- Fixed **Download current data** and **Download methodology** inside the packaged Android/WebView app.
- Android export no longer depends on `blob:` + `<a download>` alone.
- Added a narrow native `saveExportFile` bridge with a 12 MB payload limit and filename sanitization.
- Android 10+ saves through MediaStore into `Downloads/MarketRiskMonitor` without broad storage permission.
- Android 8/9 fallback uses the app-specific external Downloads directory without requesting broad storage access.
- Export UI now distinguishes `Preparing export…`, `Saving file…`, actual native `Saved: <filename>`, and visible failure states.
- Browser/dev mode retains the existing Blob/anchor fallback; it does not falsely claim a confirmed save.
- Audit snapshot schema and normalized CSV/JSON contents are unchanged from v3.5.1.47 except version metadata.
- Methodology document contents are unchanged from v3.5.1.47 except version metadata.
- Croatia/Bosnia market-universe changes from v3.5.1.47 are unchanged.
- Global Risk, Fiscal Stress, Macro, Correlation, Commodities/AGSI, Early Warning, ETF, dividend and company-risk calculations are unchanged.
- P0/P1/P2/P3 loading scheduler and loading-progress logic are unchanged.
- v3.5.1.45 graph-period labels and v3.5.1.46 Markets-card sparkline-period labels are unchanged.
- Export functions still trigger zero network requests.
- versionName: `3.5.1.48`
- versionCode: `81`
- package: `com.marko.marketrisk.globalplus`
Market Risk Monitor Global+ v3.5.1.48 — Release QA
Baseline: v3.5.1.47 / versionCode 80
Target: v3.5.1.48 / versionCode 81
SOURCE / VERSION
PASS - authoritative v3.5.1.47 source used
PASS - versionName 3.5.1.48 / versionCode 81
PASS - package com.marko.marketrisk.globalplus unchanged

### v3.5.1.47

Date: 2026-09-14
- Added **Data & Methodology** section under Settings / Options.
- Added **Download current data** audit export. It creates a ZIP from the state already loaded/calculated in the application and does not start a refresh or new network request.
- Audit ZIP contains `data_snapshot.json`, normalized CSVs for Markets, Fiscal, Macro, Correlations, Commodities, Early Warning and Global Risk, plus `metadata.json` and `README.txt`.
- Added recursive secret sanitization before export; credential-like keys are removed case-insensitively.
- Added **Download methodology** as versioned Markdown generated from the active v3.5.1.47 calculation constants/rules and source-function mappings.
- **Croatia is always included in Markets**, independent of UI language. Existing official Croatian configuration remains CROBEX (`CBX`) via Zagreb Stock Exchange (`zse`).
- **Bosnia and Herzegovina was removed completely from the active market universe** rather than represented as `LIMITED DATA`.
- Bosnia was removed from core market configuration, language-dependent inclusion, company-leader mapping, market details/diagnostics and user-facing fiscal/market universe construction.
- Cached snapshots are rehydrated against the current configured market universe, so an older cached Bosnia record cannot re-enter current Markets.
- Core configured Markets count is now 36.
- Global Risk, Global Contagion, country-risk, Macro, Correlation, Early Warning, S&P/equity-internals, Fiscal Stress, Commodities, AGSI, company, ETF and dividend calculation methodology unchanged.
- Fiscal freshness/current-reference methodology unchanged.
- v44 P0/P1/P2/P3 loading scheduler unchanged.
- v45 loading-progress observer and generic chart-period labels unchanged.
- v46 Markets-card sparkline-period logic unchanged.
- Data providers, provider concurrency, cache policy and refresh cadence unchanged.
- versionName: `3.5.1.47`
Market Risk Monitor Global+ v3.5.1.47 — Release QA
Baseline: v3.5.1.46 / versionCode 79
Target: v3.5.1.47 / versionCode 80
PASS - authoritative v3.5.1.46 source used
PASS - versionName 3.5.1.47 / versionCode 80

### v3.5.1.46

Date: 2026-09-14
- Added a compact, visible time-period label to every core **Markets** country-card sparkline.
- The label is derived only from the timestamps of the actual observations shown by the sparkline (the same last-65-observation window used by `sparklineSvg`).
- The UI displays an approximate duration plus the exact first/last valid dates, e.g. `≈3M · Jun 15 – Sep 14, 2026` / Croatian localized equivalent.
- Missing or invalid timestamps are skipped. If fewer than two valid timestamps exist, no period is invented.
- Sparkline point selection, values, normalization, line/fill styling, scaling and direction colour are unchanged.
- Market, macro, liquidity, technical, internals, Fiscal Stress and Global Risk calculations are unchanged.
- Data providers, network requests, cache, refresh cadence and loading-progress UI are unchanged.
- v44 P0/P1/P2/P3 loading scheduler logic is unchanged.
- Native Android source is unchanged.
- versionName: `3.5.1.46`
- versionCode: `79`
- package: `com.marko.marketrisk.globalplus`
- minSdk: `26`
- targetSdk: `35`
Market Risk Monitor Global+ v3.5.1.46 — Release QA
Baseline: v3.5.1.45 / versionCode 78
Target: v3.5.1.46 / versionCode 79
SOURCE / VERSION
PASS - authoritative v3.5.1.45 source used
PASS - versionName 3.5.1.46 / versionCode 79
PASS - package com.marko.marketrisk.globalplus unchanged

### v3.5.1.45

- Authoritative baseline: v3.5.1.44 / versionCode 77.
- Target: v3.5.1.45 / versionCode 78.
- Every existing canvas chart now gets a compact, presentation-only period label derived from the actual first and last valid observation.
- Existing range selectors are reflected in the label where applicable.
- Observation frequency is inferred for useful context (daily / weekly / monthly / quarterly / semiannual / annual).
- Requested ranges are not falsely presented as complete when the actual available series is materially shorter.
- Long chart x-axis endpoint labels use compact month/year formatting.
- No chart data, range-selection logic, provider, sampling or financial calculation changed.
- Added a thin loading progress bar with readable provider and dataset descriptions.
- Existing full refresh progress now reports provider + dataset.
- Scheduler loading UI distinguishes foreground from background work.
- Real percentages are used only when an existing `done / total` denominator is available; otherwise the progress bar is indeterminate.
- Cached data remains visible while refresh runs.
- No additional network requests are created for progress reporting.
- v44 P0 / P1 / P2 / P3 loading logic unchanged.
- Concurrency, request promotion, deduplication, retry/backoff and stale-while-revalidate unchanged.
- Fiscal freshness methodology unchanged.
- GLOBAL Risk, Global Contagion, Macro, Correlation, Early Warning, S&P, ETF, dividends, company risk, commodities and AGSI calculations unchanged.
Market Risk Monitor Global+ v3.5.1.45 — Release QA
Baseline: v3.5.1.44 / versionCode 77
Target: v3.5.1.45 / versionCode 78
SCOPE
PASS - release limited to chart-period presentation and loading-progress presentation
PASS - no provider or data-source change
PASS - no extra network request for progress UI
PASS - JavaScript syntax (node --check)

### v3.5.1.44

- Baseline: v3.5.1.43 / versionCode 76
- Target: v3.5.1.44 / versionCode 77
- Separated `LATEST AVAILABLE` from `CURRENT` for fiscal observations.
- Added frequency-aware freshness states: `CURRENT`, `CURRENT_ESTIMATE`, `CURRENT_FORECAST`, `STALE`, `UNAVAILABLE`.
- EU27 retains Eurostat quarterly general-government data as primary source.
- Added IMF WEO current-year general-government debt (`GGXWDG_NGDP`) and net lending/borrowing (`GGXCNL_NGDP`) as the preferred current global reference outside the EU.
- Current-year IMF WEO values are explicitly labelled `ESTIMATE`; future values, if supplied, are labelled `FORECAST`.
- World Bank / IMF-GFS central-government observations remain historical/fallback context but stale or definition-incompatible values do not enter current debt/balance score inputs or current rankings.
- Current rankings require a valid, current and comparable fiscal row.
- Fiscal cache namespace moved to `mrmFiscalV44`, preventing stale v43 fiscal rows from being silently reused.
- Valid fiscal rows remain visible while a refresh runs (stale-while-revalidate); expired fallback cache is bounded by the slow-data freshness window.
- Added module-level P0/P1/P2/P3 scheduler.
- P0: currently active tab.
- P1: immediate navigation neighbours.
- P2: remaining normal background modules.
- P3: heavy/deferred modules such as distant S&P/ETF loads and company/industry deferred detail work.
- Startup foreground remains the Dashboard/Overview core; secondary modules are scheduled only after the useful dashboard render.
- Queued work is promoted when the user opens the relevant tab; the existing request is reused rather than duplicated.
Market Risk Monitor Global+ v3.5.1.44 — Release QA
Baseline: v3.5.1.43 / versionCode 76
Target: v3.5.1.44 / versionCode 77
SOURCE / VERSION
PASS - canonical app.js JavaScript syntax
PASS - app.js embedded byte-identically in app/src/main/assets/index.html
PASS - versionName 3.5.1.44 / versionCode 77
PASS - package com.marko.marketrisk.globalplus unchanged

### v3.5.1.43

Date: 2026-09-14
- Global **Sovereign Fiscal Stress** diagnostic layer under Markets.
- Explicit coverage of all **27 EU Member States** plus major global sovereigns and the application's existing market/watch universe.
- Harmonized EU debt/fiscal-flow ingestion from Eurostat where available.
- Global IMF-GFS/World Bank fallback with explicit central-government comparability warnings.
- 10Y sovereign yield layer for 28 mapped markets using existing FRED/OECD infrastructure.
- Debt trend, fiscal balance, primary balance, interest burden, interest/revenue, implicit average debt cost, euro-area Bund spread, refinancing gap and r-g diagnostics where valid.
- `FULL`, `PARTIAL`, `LIMITED DATA` coverage tiers.
- Sovereign Fiscal Stress score with hard minimum stock/flow/market evidence gates.
- Separate **Highest Fiscal Stress** and **Fastest Deterioration** rankings.
- Separate **Systemic Importance** and **Global Sovereign Attention** presentation ranking; systemic importance does not alter a country's Fiscal Stress score.
- EU Fiscal Watch, Euro Area Fiscal Watch and Global Majors summaries in Markets.
- Compact fiscal status badges on core and Extended Country Watch cards.
- Country-detail fiscal explanation with drivers, offsets, sources, observation periods and comparability labels.
- Compact Overview sovereign/fiscal card that reuses already-loaded Markets state and performs no independent network fetch.
- Restrained dedicated YELLOW/WATCH status presentation; missing data remains neutral gray.
- High debt alone cannot produce a complete fiscal assessment without fiscal-flow and market-financing evidence.
- Missing observations are never converted to zero.
Market Risk Monitor Global+ v3.5.1.43 — Release QA
Baseline: v3.5.1.42 / versionCode 75
Target: v3.5.1.43 / versionCode 76
PASS - authoritative v3.5.1.42 source used
PASS - versionName 3.5.1.43 / versionCode 76

### v3.5.1.42

- Authoritative baseline: **v3.5.1.41 / versionCode 74**.
- Target: **v3.5.1.42 / versionCode 75**.
- Package, minSdk and targetSdk remain unchanged.
- Replaced the invalid Yahoo headline-index symbol `^OSEAX` with the Yahoo-listed Oslo Børs All-share symbol `OSEAX.OL`.
- The previous orange country status could be produced from only the surviving macro/FX inputs after the headline index request failed, because the existing weighted country score correctly renormalizes across available components.
- The risk thresholds themselves were **not changed**. Orange remains the existing 45–59 risk band.
- Missing headline market data is now presented as neutral **LIMITED DATA**, never as a coloured market-status claim.
- Added explicit per-market eligibility for the Global Equity/Market Health aggregate.
- A market must have at least 60 valid headline observations, a finite internals score, and positive internal coverage before entering the global denominator.
- Added per-market fault isolation so one unsupported or malformed market cannot reject the entire equity-internals build; the prior aggregate itself did not convert Bosnia null data to zero.
- Bosnia and Herzegovina remains visible as the explicitly limited SASE/SASX-10 market, but unavailable internals do not contaminate the global score.
- Added a global availability gate: at least 40% of configured markets must be eligible; otherwise the aggregate is correctly reported as N/A.
- Missing/NaN data is excluded, never converted to zero.
- Persisted the new valid-market/minimum/coverage metadata in cached snapshots so availability stays correct after restart.
- Corrected the user-visible header version to `v3.5.1_42`. The v3.5.1.41 source still contained a stale `v3.5.1_40` header label even though Gradle metadata was 3.5.1.41 / 74.
- Removed the duplicated full market-country list from Overview. The Markets page remains the detailed market list.
- Overview is now an executive early-warning dashboard with compact cards for:
- What needs attention / top confirmed drivers
Market Risk Monitor Global+ v3.5.1.42 — Release QA
Baseline: v3.5.1.41 / versionCode 74
Target: v3.5.1.42 / versionCode 75
SOURCE / VERSION
PASS - authoritative v3.5.1.41 source used
PASS - versionName 3.5.1.42 / versionCode 75
PASS - package com.marko.marketrisk.globalplus unchanged
PASS - minSdk 26 / targetSdk 35 unchanged

### v3.5.1.41

- Added **previous-year gas consumption** to each EU country storage card when the official GIE AGSI+ country response provides `consumption`.
- Added **Storage Coverage** using the official AGSI+ country field `consumptionFull`.
- Added a safe fallback calculation `gasInStorage / consumption × 100` only when `consumptionFull` is absent and both inputs are valid.
- Added an annual-average equivalent in days: `365 × Storage Coverage / 100`.
- Added a clarification that the day value is an annual-average-rate equivalent, not a winter-autonomy forecast.
- Existing EU Gas Storage by Country layout, sorting and loading behavior unchanged.
- Existing storage fill progress bars unchanged.
- No additional progress bar was added for Storage Coverage.
- Existing GIE AGSI+ API endpoint, API-key handling, transport, 6-hour cache and bounded concurrency unchanged.
- EU aggregate methodology unchanged.
- Largest EU Gas Storage facility functionality unchanged.
- U.S. Oil, U.S. Gas, Gold, Silver and Food unchanged.
- GLOBAL Risk, Global Contagion, Early Warning, Macro, Correlation, S&P 500, ETF/dividend and company-risk calculations unchanged.
- Native Android runtime, `classes.dex`, `resources.arsc` and application icon unchanged.
Only the existing country-level AGSI parser/card presentation was extended to consume two fields already present in the same official AGSI country response:
- `consumption` — previous-year annual gas consumption in TWh
- `consumptionFull` — current gas in storage as a percentage of that consumption reference
No new data provider or network request was introduced.
Market Risk Monitor Global+ v3.5.1.41 — Release QA
Baseline: v3.5.1.40
Target: v3.5.1.41 / versionCode 74
SOURCE / SCOPE
PASS - canonical app.js JavaScript syntax
PASS - canonical app.js embedded exactly once and byte-identically in app/src/main/assets/index.html
PASS - versionName 3.5.1.41 / versionCode 74 in Gradle source
PASS - change isolated to AGSI country parser/card/explanatory footnote plus release metadata

### v3.5.1.40

Date: 2026-09-13
- Added **EU Gas Storage by Country** directly to **Commodities → Overview**.
- Uses official **GIE AGSI+** country datasets discovered from the official AGSI EIC listing.
- Restricts country-level storage to the existing EU-27 allowlist; non-EU datasets such as the UK and Ukraine are excluded.
- Shows per-country:
- Gas in Storage (TWh)
- Working Gas Volume / technical storage capacity (TWh)
- official Fill % (or calculated `Gas in Storage / WGV` only when official Fill % is absent)
- Free Capacity (TWh)
- daily trend where available
- AGSI gas-day observation date
- confirmed / estimated / no-data status
- Added compact sorting: **Capacity ↓**, **Fill ↓**, **Stored ↓**, **A–Z**.
- Added thin storage-utilisation progress bars using the existing `renderThinProgressV38()` implementation.
- Added failure-isolated country loading with a maximum of **4 concurrent AGSI country requests**.
- Added 6-hour country cache behaviour matching the existing AGSI policy.
- Added country-sum context versus the authoritative EU headline without replacing the EU aggregate.
- Added deterministic country parser/discovery fixtures and release QA.
Market Risk Monitor Global+ v3.5.1.40 — Release QA
Baseline: v3.5.1.39
Target: v3.5.1.40 / versionCode 73
SOURCE / VERSION
PASS - authoritative v3.5.1.39 source used
PASS - package com.marko.marketrisk.globalplus unchanged
PASS - minSdk 26 / targetSdk 35 unchanged

### v3.5.1.39

- Fixed **Largest EU Gas Storage** parsing when the GIE AGSI EIC listing is wrapped in `data`, `result`, `items`, or `listing`.
- Preserved support for the documented direct-array listing and legacy hierarchical listing.
- Uses official facility URL when supplied by GIE.
- Facility endpoint failures are isolated; one bad dataset no longer fails the entire storage list.
- Added safe structural diagnostics when a listing contains no usable EU facilities.
- EU AGSI aggregate methodology and API-key handling unchanged.
- Commodity progress bars from v3.5.1.38 retained.
- EU Oil remains disabled.
- Financial/risk calculations unchanged.
- Stable startup/runtime DEX retained exactly.
- versionName: 3.5.1.39
- versionCode: 72
- package: com.marko.marketrisk.globalplus
- minSdk: 26
- targetSdk: 35
Market Risk Monitor Global+ v3.5.1.39 — QA
Date: 2026-09-13
PASS - versionName 3.5.1.39 source
PASS - versionCode 72 source
PASS - JavaScript syntax
PASS - canonical app.js embedded exactly
PASS - documented direct-array parser support
PASS - data-wrapper parser support

### v3.6.9 — BUILD119

- Baseline discovered: `3.6.8` / versionCode `118`
- Result: `3.6.9` / versionCode `119`
- applicationId/package: `com.marko.marketrisk.globalplus`
- signing identity: unchanged from BUILD118
- `app/build.gradle` — release version only.
- `app/src/main/assets/index.html` — Global Shortage page shell, navigation entry, click-only dynamic loader, manual Refresh routing, diagnostics shell, release label.
- `app.js` — canonical mirror of the embedded WebView runtime.
- `app/src/main/assets/excel_export_v362.js` — release metadata only.
- Baseline inspected: v3.6.8 / versionCode 118.
- Result: v3.6.9 / versionCode 119.
- Package/applicationId remains `com.marko.marketrisk.globalplus`.
- Release scope: isolated **Global Shortage Early Warning** module plus release metadata only.
`test_global_shortage_lazy_v369.py`: **PASS 15/15**
Verified:
- Global Shortage tab shell exists.
- module asset is not statically loaded;

### v3.6.9

- Added top-level **Global Shortage Early Warning** tab.
- Added strict user-click-only dynamic module loading.
- Added derived shortage snapshot cache with LIVE/CACHED/STALE/PARTIAL semantics.
- Added progressive source/stage progress panel with fixed reserved height.
- Added physical-supply scoring, confidence, trend, explainability and downstream-impact model.
- Added EIA physical inventory adapters for diesel/distillates, jet fuel and U.S. natural gas storage by reusing the existing commodity data layer.
- Added optional GIE AGSI+ EU gas-storage seasonal adapter when the user already has a key configured.
- Added all requested supply chains as monitored entries; chains without trustworthy runtime physical-source adapters remain explicitly N/A.
- Added supply-chain transmission view and item detail view with observation/retrieval timestamps.
- Added Settings diagnostics for initialization, trigger, cache, coverage, source success/failure and last refresh.
- Existing Global Risk, market, correlation, S&P 500, ETF, commodity, fiscal, portfolio and background-refresh logic is unchanged.
- Final QA fix: offline/no-success module state now reports EMPTY instead of LIVE.
- Final QA fix: failed AGSI refresh preserves a valid cached EU gas score instead of discarding it.

### v3.6.8 — BUILD118

- applicationId: `com.marko.marketrisk.globalplus`
- versionName: `3.6.8`
- versionCode: `118`
- baseline: v3.6.7 / BUILD117
- scope: background-resident lifetime + cadence-driven refresh only
- `app/build.gradle`
- `app/src/main/assets/index.html`
- `app/src/main/assets/excel_export_v362.js` (release metadata only)
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java`
- `app/src/main/java/com/marko/marketrisk/globalplus/BackgroundRefreshWorker.java`
PASS 23/23 targeted source/integration checks:
- version 3.6.8 / 118
- root Back uses `moveTaskToBack(true)`
- root Back no longer calls the Activity finish path
- onResume reasserts scheduler
- WebView timers resume
- worker refresh list expanded to 48 recently used URLs
- worker records run status

### v3.6.8

- Android Back at app root now moves Market Risk Monitor Global+ to the background instead of finishing the Activity.
- Refresh cadence now controls both foreground and background refresh automatically.
- `Manual only` disables scheduled refresh; any configured interval enables it.
- Background scheduler is synced immediately during app boot and reasserted on resume.
- Background worker now refreshes up to 48 recently used public data endpoints and records execution status.
- Added State Street and Bundesbank background-provider allowlist coverage.
- WebView timers are resumed on foreground return.
- No financial calculation, Capital Rotation formula, T212 logic, or unrelated UI was changed.

### v3.6.7 — BUILD117

- applicationId/package: `com.marko.marketrisk.globalplus`
- versionName: `3.6.7`
- versionCode: `117`
- target SDK remains unchanged from BUILD116
BUILD117 is a Capital Rotation UI consolidation release. Each U.S. sector is shown once; tapping it opens all Daily Rotation and contributor details in place. No Capital Rotation calculation or data-provider methodology was changed.
The APK is signed with the same release identity used by the previous upgrade-compatible builds.
Certificate SHA-256:
`c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`
Signature validation:
- V1 PASS
- 17 / 17 PASS
- all 11 sector names appear exactly once in the consolidated sector list fixture
- exactly 11 expandable sector entries
- each sector contains its BUILD116 contributor-attribution placeholder
- no Strongest Daily Signals duplicate section in BUILD117 renderer
- no separate Sector Details duplicate section in BUILD117 renderer
- no legacy representative-groups block in BUILD117 renderer
- click/tap detail affordance present

### v3.6.7

- Consolidated Capital Rotation sectors into one list.
- Each U.S. sector appears once.
- Sector tap expands all metrics and BUILD116 contributor/breadth/driver evidence in place.
- Removed duplicate Strongest Daily Signals and separate Sector Details presentation from the BUILD117 renderer.
- Removed legacy representative-equities block from the Capital Rotation renderer because dynamic ETF constituent attribution now provides the concrete stocks within each sector.
- Kept Regional Daily Rotation and Methodology as separate non-duplicate sections.
- No Daily Rotation scoring, holdings, provider, cache, freshness or contributor-calculation changes.

### v3.6.6 — BUILD116

- applicationId/package: `com.marko.marketrisk.globalplus`
- versionName: `3.6.6`
- versionCode: `116`
- baseline: v3.6.5 / BUILD115
- release certificate SHA-256: `c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`
- APK SHA-256: `22532b8c657f679325b5d21dca7f01a8ad61e51efb3a647bb49a967ddc986a42`
BUILD116 adds only the Daily Capital Rotation evidence/attribution layer:
- dynamic sector constituents and weights
- concrete daily stock contributors
- breadth and weighted breadth
**39 / 39 PASS**
Covered areas include:
- Yahoo class-share ticker normalization
- weighted contribution formula
- broad participation
- narrow / mega-cap dominated participation
- positive and negative contributor ordering
- weighted constituent coverage

### v3.6.6

- Dynamic Select Sector SPDR constituent holdings attribution for Daily Capital Rotation.
- Concrete top positive and negative stock contributors per sector.
- ETF-weighted approximate contribution calculation.
- Unweighted and weighted breadth metrics.
- SPY-relative constituent participation.
- Sector-relative constituent participation.
- Weighted coverage and holdings freshness tracking.
- Top-1 / Top-3 / Top-5 contribution concentration.
- Mega-cap / concentrated-leadership detection.
- Sector-specific commodity, rates, credit and style-proxy confirmation layer.
- Lazy sector evidence loading to control network fan-out.
- Dynamic XLSX holdings parser and bounded constituent-price batching.
- BUILD115 1D Daily Capital Rotation formula and score thresholds.
- 5D as secondary context only.
- Existing Global Risk / Early Warning / Stocks / ETFs / T212 / Bonds / Commodities / Macro / Correlation / Volatility / Dividend logic.
- Existing package/application ID and signing identity.
- versionName: 3.6.6
- versionCode: 116

### v3.6.5 — BUILD115

- applicationId/package: `com.marko.marketrisk.globalplus`
- versionName: `3.6.5`
- versionCode: `115`
- minSdk: `26`
- targetSdk: `35`
Capital Rotation is now a daily, latest-completed-session relative-leadership engine. The primary sector signal is based on 1D excess return versus SPY, cross-sectional rank, volume confirmation and cross-asset confirmation. Constituent ...
The GrapheneOS-compatible fallback sequence remains:
1. build unsigned APK;
2. apply V1/JAR signing;
3. re-align STORED APK entries to 4-byte boundaries;
- Deterministic Daily Rotation engine tests: **37/37 PASS**
- Release/integration assertions: **37/37 PASS**
- Protected non-Capital-Rotation regression comparison: **19/19 PASS**
- Existing Bonds logic: **13/13 PASS**
- Existing T212 Portfolio analytical tests: **37/37 PASS**
Daily test coverage includes benchmark-relative returns, negative absolute return with positive SPY-relative leadership, neutral equality, cross-sectional ranking, tie handling, materiality gating, status boundaries, volume present/missi...
Several legacy BUILD113 tests contain hardcoded expected release identity `3.6.3/113` or explicitly protect the old Capital Rotation functions from any modification. Those assertions are expected to fail after this intentionally scoped C...
- Canonical `app.js` embedded in packaged `index.html`: **PASS**

### v3.6.5

- Converted Capital Rotation primary engine from medium-term/regime-dominant scoring to latest-completed-session Daily Rotation.
- Added SPY-relative 1D excess return for 11 U.S. sector ETFs.
- Added dynamic cross-sectional daily ranking.
- Added volume confirmation using recent median volume where available.
- Added daily cross-asset risk-appetite confirmation.
- Added previous-session score/rank, acceleration, reversal and new leader/laggard diagnostics.
- Added 5D context without allowing 5D/20D/63D to dominate the daily score.
- Preserved BUILD114 freshness/cache protections and same-date alignment.
- Explicitly labels the output as implied/relative rotation rather than measured fund flows.
- Unrelated production modules remain unchanged.

### v3.6.4 — BUILD114

Date: 2026-09-19
- applicationId/package: `com.marko.marketrisk.globalplus`
- versionName: `3.6.4`
- versionCode: `114`
- target signing identity: same release certificate as BUILD113
Capital Rotation data-freshness hotfix only:
- force-refresh propagation;
- cache validation;
- actual market observation vs retrieval timestamp separation;
- latest completed trading-session logic;
`node tests/capital_rotation_freshness_v364.js`
**34/34 PASS**
Covered areas include:
- Saturday/Sunday latest-session logic;
- pre-close/post-close behavior;
- U.S. market holidays including Good Friday and Labor Day;
- duplicate-date removal;

### v3.6.4

- Fixed Capital Rotation manual refresh so it truly requests fresh upstream market data.
- Added cache-first rendering with background freshness validation after five minutes or when session/status requires it.
- Separated market observation dates from retrieval/calculation timestamps.
- Added latest-completed U.S. trading-session logic with weekend/standard-holiday handling.
- Added common-date alignment for multi-symbol Capital Rotation composites.
- Switched Capital Rotation 5D/20D/63D/252D horizons to completed observation counts.
- Added explicit LIVE/CACHED/STALE/PARTIAL/ERROR data state in Capital Rotation.
- Made snapshot `Data through` conservative so one older required input cannot be hidden by newer components.
- Distinguished native cache fallback after upstream failure from ordinary native cache.
- Preserved existing Capital Rotation score weights and all unrelated analytical modules.

### v3.6.3 — BUILD113

- Application ID: `com.marko.marketrisk.globalplus`
- Version name: `3.6.3`
- Version code: `113`
- Previous baseline: `3.6.2 / 112`
Added the isolated **My T212 Portfolio** analysis card using actual read-only Trading 212 positions/account data, with dynamic KEEP / WATCH / REDUCE-REVIEW / SELL-REVIEW analysis and portfolio concentration/risk context.
- Signing certificate SHA-256: `c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`
- Certificate match vs BUILD112: PASS
- V1 signature: PASS
- V2 signature: PASS
- V3 signature: PASS
- My T212 Portfolio deterministic JS analysis tests: **37/37 PASS**
- Native/source/read-only endpoint tests: **13/13 PASS**
- Trading 212 tradability regression: **18/18 PASS**
- Bonds + Trading 212 regression: **58/58 PASS**
- Volatility/downside alarm regression: **44/44 PASS**
- Runtime hardcoded-value audit: **46/46 PASS**
- Excel report BUILD113 regression: **12/12 PASS**
Legacy BUILD112 tests that explicitly assert version `3.6.2 / 112` are expected to fail those release-identity assertions after the intentional increment to `3.6.3 / 113`; their replacement BUILD113 tests pass.

### v3.6.2 — BUILD112

- Version name: `3.6.2`
- Version code: `112`
- Previous baseline: `3.6.1` / `111`
Added a full Excel report export under **Options → Data & Methodology** using the existing Android download bridge. The workbook follows the supplied 21-sheet report example and uses only currently available application runtime/cache data.
The APK was signed using the existing release material shipped with the project:
- `signing/MarketRiskMonitor_GlobalPlus_release.p12`
- `signing/keystore.properties`
No signing credentials are included in this report.
Signing certificate SHA-256:
- Excel export regression suite: **12/12 PASS**
- Runtime XLSX generation: PASS
- XLSX ZIP/OOXML integrity: PASS
- Worksheet count: **21/21**
- XML well-formedness: PASS
- Spreadsheet import validation with artifact tooling: PASS
- Export module performs no new market-data fetches: PASS
- Volatility alarm suite: **44/44 PASS**

### v3.6.1 — BUILD111

- Removed current-looking hardcoded EIA commodity observation fallbacks.
- Removed DOE SPR fixed-number fallback/matching behavior; values are parsed dynamically.
- Replaced date-specific World Gold Council current-result assumptions with dynamic discovery.
- Removed fixed IMF WEO current-vintage labeling.
- Capital Rotation Top-10 now ranks dynamically retrieved market caps and uses current FX for cross-currency normalization; missing market cap remains unavailable.
- S&P descriptive count derives from the configured universe instead of a literal count.
- Runtime fallback policy for audited result paths is provider data -> provider-backed cache -> N/A.
- Added automated no-hardcoded-runtime-results audit (43/43 PASS).
- versionName remains 3.6.1; versionCode is 111.
Release identity:
- package: `com.marko.marketrisk.globalplus`
- versionName: `3.6.1`
- versionCode: `111`
- minSdk: `26`
- targetSdk: `35`
Android SDK/Gradle tooling is not installed in this execution environment, so the existing deterministic standalone WebView fallback builder was used. This is the same fallback release lineage used by prior installable artifacts.
The full Android source remains in the source ZIP, including the native cache/proxy, WorkManager and Android Keystore implementation. The installable fallback APK uses the standalone runtime architecture documented by the project.
- fallback binary manifest: PASS
- package/version identity: PASS
- `node --check app.js`: PASS
- Universal Volatility & Downside Alarm: **44/44 PASS**
- Trading 212 v3.6.1 regression: **18/18 PASS**
- Bonds logic: **13/13 PASS**
- Bonds/T212 integration: **58/58 PASS**
- No-hardcoded-runtime-results audit: **43/43 PASS**
- Canonical `app.js` embedded exactly once in `index.html`: PASS
- Protected existing risk/model functions: **14/14 byte-identical to v3.5.1.75 baseline**

### v3.6.1 — BUILD110

Release: **Market Risk Monitor Global+ 3.6.1**
Android versionCode: **110**
This is a presentation-only hotfix requested to reduce the space occupied by volatility/downside alarm badges beside stocks and ETFs.
The only runtime presentation change is a contextual CSS override for `.stock-row .va-badge`. The base badge styling, detailed explanations, Volatility tab, financial data, Trading 212, Bonds and all risk/scoring logic remain unchanged.
- canonical `app.js`: byte-identical to build 109
- all non-CSS runtime HTML/JS: byte-identical to build 109
- package/version manifest validation: PASS
- embedded HTML integrity: PASS
- ZIP/STORED alignment: PASS
- V1: PASS
Only the stock/ETF list-row volatility alarm badge presentation was changed.
- Stock/ETF alarm font reduced from the base 8 px presentation to 6.4 px (6.2 px on narrow mobile screens).
- `ALARM` prefix reduced to 5.8 px (5.6 px on narrow mobile screens).
- Badge padding, gap and top margin were reduced.
- Alarm wording, status, colors, tooltip content and all calculated values are unchanged.
- Detailed alarm explanation cards and the dedicated Volatility tab keep their original sizing.
- `app.js` byte-identical to v3.6.1 build 109: **PASS**
- `app.js` SHA-256: `e3b1f8dad9980267baffd4818fad9f28d57dd49dcf20fd62d15ba67ae7c3b353`

### v3.6.1

- Added Universal Volatility & Downside Risk Alarm Layer VA1.0.
- Added dedicated VOLATILITY tab with market and sector risk maps.
- Added alarm badges to market, S&P 500/company, ETF, industry/sector and Capital Rotation representative rows.
- Added plain-language alarm detail to stock, market and industry views.
- Added RV60 to lightweight company summaries for volatility-acceleration context.
- High volatility alone is explicitly separated from confirmed downside risk.
- Existing scoring/model formulas are not retuned.
Release: **Market Risk Monitor Global+ 3.6.1** (versionCode 109)
This release introduces the **Universal Volatility & Downside Risk Alarm Layer (VA1.0)** and a dedicated **VOLATILITY** tab. The layer is additive and does not retune the existing Global Risk, Early Warning, Capital Rotation, Bonds, comp...
- Plain-language alarm beside applicable stocks, ETFs, markets and sectors/industries.
- Separate internal dimensions for **volatility pressure** and **downside pressure**.
- High volatility alone cannot produce a confirmed red downside alarm.
- Dedicated sector map includes **Energy / XLE** as well as the other major U.S. sectors.
- Detailed views explain **why** an alarm is present and list offsetting factors where available.
- Horizon is explicitly labeled **qualitative 1–4 weeks**; no fabricated crash probability or target price is displayed.
- package: `com.marko.marketrisk.globalplus`
- versionName: `3.6.1`
- `tests/volatility_alarm_v361.py`: **44/44 PASS**
- JavaScript syntax (`node --check app.js`): **PASS**
- Canonical `app.js` embedded exactly once in `app/src/main/assets/index.html`: **PASS**
- Energy (`XLE`) explicitly present in the sector alarm universe: **PASS**
- All 11 U.S. sector proxies present: **PASS**
- Alarm badge coverage verified for:
- S&P 500 rows
- country/industry company rows

## 2026.09.26.3 / BUILD126 — Economic Structure verified local snapshot
- Economic Structure now reads only a packaged verified local snapshot at runtime.
- Canonical snapshot storage is SQLite; the fallback WebView APK uses a deterministic generated read-only projection from that DB.
- Runtime provider requests were removed for Economic Structure only.
- Every release build checks snapshot freshness; mandatory refresh is triggered at 30 days.
- Required provider refresh failure blocks the release and cannot overwrite the last good snapshot.
- Economic Structure remains CONTEXT ONLY and does not change risk models or financial-data methodology elsewhere.
