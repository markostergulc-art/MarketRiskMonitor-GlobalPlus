# Market Risk Monitor Global+ v3.6.2 BUILD112

## v3.6.2 / BUILD112
- Added **DOWNLOAD EXCEL REPORT** under Options → Data & Methodology.
- Generates the supplied 21-sheet full business report as a native `.xlsx` download.
- Export is based only on currently loaded/cached runtime data and starts no additional market-data requests.
- Existing market/risk/macro/correlation engines are unchanged.
- Version bumped to 3.6.2 / 112.
- Release APK retains the same package and signing certificate as BUILD111 for upgrade compatibility.


Android/WebView early-warning dashboard for global market, inflation, recession, correlation and cross-asset risk.


## v3.5.1_73 — Global Trading 212 portfolio link

- Trading 212 API key and secret are configured only in Settings -> Data.
- One read-only open-position state provides portfolio-presence badges across every stock/ETF presentation path: S&P 500, country/industry companies, stock details, ETF Intelligence/details, and Capital Rotation representatives/proxies.
- Trading 212 integration does not change any risk, Early Warning, GA2, Capital Rotation, market, macro, fiscal, commodity or correlation score.
- No Trading 212 order endpoint is used.


## v3.5.1_71 — Capital Rotation concrete assets + equity representatives

- Capital Rotation now names the concrete exposure and measured proxy behind each broad asset category.
- Added lazy `DIONICE · 10 NAJVEĆIH PREDSTAVNIKA` groups for defensive, technology/growth, semiconductors, industrials, consumer discretionary, materials, financials, energy, small caps, emerging markets and major regions.
- Comparable groups rank available Yahoo market capitalization; IWM/EEM/VGK groups use documented issuer-holdings snapshots and live company trend enrichment.
- Each representative shows ticker, sector/theme, country, market cap when available, 1M trend and whether it confirms the parent rotation bias.
- `Top-10 confirmation` is explainability only and never changes Capital Rotation, GA2, Early Warning or Global Risk scoring.
- Existing release signing material remains bundled under `signing/` at the project owner's explicit request. Treat it as confidential.

## v3.5.1_70 — Capital Rotation

- Added the lazy/cache-first Capital Rotation tab, stress-type classification, projected destinations/outflow pressure, market confirmation, regional rotation and explainability.
- Projected rotation remains distinct from measured fund flows and returns N/A when Early Warning coverage is insufficient.


## v3.5.1_69 — Targeted data/recovery hotfix

- China / CSI 300 (`000300.SS`) and Philippines / PSEi (`PSEI.PS`) now reject unusable one-point Yahoo history and use targeted same-symbol recovery.
- Existing GA2 Overview layer cards receive the already-calculated final-layer state (`Current Condition`, `Early Warning`, `Structural Vulnerability`, `Contagion`).
- FRED `fredgraph.csv` HTTP 403 automatically falls back to ALFRED current-vintage CSV for the same series ID; scoring formulas are unchanged.
- At the project owner's explicit request, the source bundle includes the existing release signing material under `signing/` so future builds remain upgrade-compatible. Treat that directory as confidential.

## v3.5.1_67 — Phase 17 Methodology Export V2

- Final defined methodology-remediation phase (Phase 0 through Phase 17).
- Standalone Methodology download now emits Methodology Export V2.
- Current Data ZIP also includes `methodology_v2.json` and `methodology_v2.md`.
- Every documented model exports purpose, raw indicators, provider, observation date, frequency, freshness method, transformation, score direction, thresholds/window, weights, missing-data handling, eligibility, coverage, confidence and aggregation.
- GLOBAL Risk includes the full GA2 dependency tree; Early Warning exports normalized timing classes plus internal classes; correlation documents log returns, session/timezone alignment and 20/60/120-day diagnostics.
- Export is snapshot-only: it performs no network request and never converts missing values to zero.
- Production scoring and Phase-16 UI/explanation arithmetic are unchanged from v3.5.1.66.

## Core highlights

- 37 monitored country configurations; Croatia and Bosnia and Herzegovina remain visible only in the Croatian UI.
- Every monitored country has a six-company representative leader list with ticker references.
- Industry cards retain the existing local sector/index/proxy signal and additionally expose six globally important companies mapped to that industry theme.
- The dashboard is rendered first. Company/industry quote enrichment starts afterward and runs asynchronously while the app is open.
- A visible progress strip tells the user when background detail loading is still in progress.
- Opening a country prioritizes that country's company quotes without blocking the modal.
- Compact company summaries are cached separately for six hours and are not inserted into the main risk snapshot, avoiding the previous localStorage growth problem.
- Missing or unsupported local feeds remain explicitly unavailable/static; synthetic prices are never created.

## Important limitation

The installable APK produced in this environment is the standalone WebView fallback build. Full Gradle/native sources are included. A full Android SDK build is preferred for release signing, native SQLite/proxy instrumentation, notifications and Play Store deployment.


### v3.5.1_08
Added company risk intelligence, country/industry company breadth and on-demand stock details. Detailed 5Y histories are loaded only after a user taps a stock.


## v3.5.1_09 Commodity Intelligence
A lazy COMMOD page adds EIA/DOE oil reserve and supply-buffer data, World Gold Council central-bank buying, Gold/Silver and Copper/Gold divergences and a separate diagnostic commodity regime score. Heavy commodity details are not fetched during dashboard boot.


## v3.5.1_11 S&P 500 Focus 100 + forced manual refresh
- Manual REFRESH bypasses Smart Refresh cache and requests live provider data.
- New lazy S&P 500 Stock Intelligence tab capped at 100 significant constituents.
- 1Y summaries load only after opening the tab; 5Y detail remains click-to-load.

## v3.5.1_12 Pull-to-refresh + Global ETF Intelligence
- Pull down from the top to trigger the same forced-fresh path as the manual REFRESH button.
- Refresh state is always inline through a named progress bar; the full-screen refresh popup/loader is not used.
- Progress identifies the active refresh stage and, during network work, the active provider and request completion count.
- Added a lazy Global ETF Intelligence tab with 33 representative ETFs.
- ETF income policy is explicit: ACC (reinvesting), DIST (cash-distributing), or NONE for non-income metal trusts.
- 1-year ETF market data loads only after opening the ETF tab; 5-year detail loads only after clicking an ETF.
- Distributing ETFs can show an approximate trailing-12-month cash yield from available dividend events; price return remains clearly separated from cash distributions.


## v3.5.1_13 Dividend Intelligence + Back navigation
See `FEATURES_V35113.md`.


## Integrated Help (v3.5.1_18)
Settings → Help & interpretation opens a complete local EN/HR guide to all major scores and modules.


## v3.5.1_19 Energy Storage Intelligence
- Added a Commodities sub-navigation: Overview, EU Gas, EU Oil, US Oil, Gold and Silver.
- EU gas storage uses GIE AGSI+ and requires a user-provided API key stored only for the current session.
- EU oil uses Eurostat `nrg_stk_oilm` and is explicitly labelled as emergency/commercial oil stocks, not geological reserves.
- U.S. oil shows EIA weekly SPR, commercial crude and total crude history plus DOE capacity context.
- Gold and silver receive dedicated 1M/3M/1Y price charts.
- All new submodules are lazy and isolated so one failed source cannot take down the Commodities page.

## v3.5.1.75
Trading 212 badges represent **tradability/availability in the Trading 212 instrument catalog**, not portfolio ownership. Credentials are configured only in Settings → Data. This is a presentation-only integration and does not alter risk/scoring logic.


## v3.6.1
Universal Volatility & Downside Risk Alarm Layer. Dedicated Volatility tab plus simple alarms beside applicable markets, stocks, ETFs and sectors without retuning existing scores.
