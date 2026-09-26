# Market Risk Monitor Global+

Android/WebView dashboard for global markets, macroeconomic conditions, cross-asset risk and early-warning diagnostics. English and Croatian interfaces are included.

## Current release

| Item | Value |
| --- | --- |
| Version | **2026.09.26.4 / BUILD127** |
| Android package | `com.marko.marketrisk.globalplus` |
| Minimum Android | Android 8.0 / API 26 |
| Target / compile SDK in Gradle source | 35 / 35 |
| Published APK | Existing signed compatibility/WebView build |

[Download BUILD127 APK](https://github.com/markostergulc-art/MarketRiskMonitor-GlobalPlus/raw/refs/heads/main/bin/MarketRiskMonitor_GlobalPlus_2026.09.26.4_BUILD127_signed.apk) · [APK checksum](bin/MarketRiskMonitor_GlobalPlus_2026.09.26.4_BUILD127_signed.apk.sha256) · [Release report](MarketRiskMonitor_GlobalPlus_2026.09.26.4_BUILD127_RELEASE_REPORT.md)

The `bin/` APK is the existing release artifact, uploaded without rebuilding or re-signing. The BUILD127 audit records V2/V3 signature verification and continuity of the release certificate. Normal upgrades require the same application ID and signing identity.

To verify a downloaded copy from the `bin/` directory:

```sh
sha256sum -c MarketRiskMonitor_GlobalPlus_2026.09.26.4_BUILD127_signed.apk.sha256
```

## Changes since the old BUILD112 README

| Release | Main changes retained in BUILD127 |
| --- | --- |
| BUILD113–118 | My T212 Portfolio; Capital Rotation daily changes, contributors and consolidated views; app-root Back moves the task to the background; background-refresh support in the standard native source. |
| BUILD119 | Dedicated Global Shortage tab with deferred loading. |
| BUILD121 / v3.8 | Audit-driven freshness, source eligibility, missing-data, commodity, bond, shortage, dividend and export corrections. |
| BUILD122 / v3.9 | Change Intelligence, evidence/provenance, calculation snapshots, Smart Alert Center, watchlists and expanded audit exports. |
| BUILD123 / v3.10 | Universal Market Details, on-demand macro context, per-country caching and additional market metrics. |
| BUILD124 / 2026.09.26.1 | Date-based version names; GDP, inflation and unemployment prioritized on 36 core and 50 extended country cards; clicking a market opens its details and evidence. |
| BUILD127 / 2026.09.26.4 | Removed the Economic Structure runtime feature introduced in BUILD125/126 because its snapshot coverage and bootstrap data were unsuitable. Existing macro evidence and unrelated modules remain. |

Economic Structure is **not an active BUILD127 feature**. Historical research, parser tools and release documents may remain in the repository; they do not imply that their data is shipped in the APK. See the [rollback audit](MARKETRISKMONITOR_BUILD127_ROLLBACK_AUDIT.md).

## Main capabilities

- **Global risk and macro:** GA2/Global Risk, Early Warning, Structural Vulnerability, Contagion, market health and correlation diagnostics. Core country scoring is separate from the extended-country context layer.
- **Market Details:** GDP growth, inflation, unemployment, source evidence, observation periods and risk-factor contributions; price returns, drawdown, moving-average distance and volatility. Additional World Bank context loads on demand.
- **Stocks and ETFs:** country/industry representatives, S&P 500 Focus 100, ETF and dividend intelligence, compact summaries and click-to-load detailed histories.
- **Commodities and energy:** oil, gas, metals and storage diagnostics, including AGSI+, EIA/DOE and Eurostat data paths where available and configured.
- **Global Shortage:** a separate, lazily loaded diagnostic view. Inventory pressure alone is not labeled a confirmed physical shortage; insufficient or stale required evidence yields N/A.
- **Capital Rotation:** projected destinations/outflow pressure, market confirmation, daily changes, contributors and concrete asset representatives. Projected rotation is distinguished from measured fund flows.
- **Bonds:** Treasury and Bund curves, sovereign and credit spreads, real yields, breakevens and bond ETF proxies, subject to source availability.
- **Volatility and alerts:** volatility/downside diagnostics; Smart Alert Center with watchlists, confirmation, hysteresis, cooldown, deduplication and quiet hours. Market-risk alerts and data-health alerts have distinct semantics.
- **Change Intelligence:** daily/weekly comparisons, change attribution, evidence cards and separate data-quality, coverage, signal-agreement and empirical-validation fields.
- **Exports:** Excel report under Options → Data & Methodology, current-data ZIP and Methodology Export V2. Snapshot, change, evidence and alert exports use loaded/cached state without starting new market-data requests.

## Trading 212

Credentials are configured in Settings → Data. Integration is read-only and does not submit orders.

- **Instrument badges** indicate tradability in the Trading 212 instrument catalog; they do not indicate ownership.
- **My T212 Portfolio** separately reads positions and the account summary, showing holdings, P/L, concentration, exposures and best-effort company analysis.
- Missing fundamentals reduce available evidence/confidence rather than automatically producing adverse conclusions.
- The standard native source uses Android Keystore-backed credential storage. The compatibility runtime uses its encrypted WebCrypto/IndexedDB fallback when the native bridge is absent.

See [portfolio documentation](T212_PORTFOLIO_V363.md). Neither release signing secrets nor user credentials are bundled in this public repository.

## Data interpretation

The dashboard depends on external providers and is not an offline live-data service. Provider errors, access restrictions, market sessions and publication frequency can affect coverage.

Current-score eligibility is checked separately from retained history. Stale history may remain visible with provenance while an ineligible current value is N/A. Observation time and retrieval time have different meanings; missing values must not be interpreted as zero. Fixed model parameters and instrument mappings are configuration, not live market observations.

BUILD127 rolls back Economic Structure without intentionally changing GA2 weights, risk bands, correlation, Shortage, Capital Rotation, Bonds, Trading 212 or alert methodology.

## APK versus full native source

The published BUILD127 APK uses the manual compatibility/WebView shell. It embeds the web runtime and native file-export bridge, but does **not** compile the complete Java application in `app/src/main/java/`.

Consequently, the Java SQLite/DB v4 architecture, WorkManager HTTP prefetch and typed native notification channels must not be represented as shipped capabilities of this APK. A full Gradle build and device acceptance are needed to ship and validate those native additions.

The standard source schedules background HTTP-cache refresh from the configured cadence; it does not establish that the complete risk model recalculates while the app is closed. Android can delay background work or reclaim the process. Moving the app to the background does not guarantee indefinite residency.

## Repository and build paths

| Path | Purpose |
| --- | --- |
| `app/src/main/assets/` | Packaged HTML/JavaScript runtime and images |
| `app.js` | Core JavaScript source; keep synchronized with embedded runtime when editing |
| `app/src/main/java/` | Standard Android implementation, database, credentials and background worker |
| `app/build.gradle` | Package, SDK, version and optional local release-signing configuration |
| `tools/` | Versioned compatibility packagers, signing/verification utilities and data tooling |
| `tests/` | Regression suites and fixtures, including historical release-specific checks |
| `bin/` | Existing signed BUILD127 APK and SHA-256 checksum |

For the standard native build, provision JDK 17, Android SDK 35 and Gradle compatible with Android Gradle Plugin 8.7.3. This repository does not include a Gradle wrapper. With that toolchain configured, run `gradle :app:assembleDebug`; release signing requires the owner's existing local signing material.

The BUILD127 compatibility packaging entry point is `build_manual_release_20260926_4.sh`, which calls `tools/build_manual_apk_20260926_4.py`. It requires Python, Java signing tools and the existing local release key. See [signing instructions](SIGNING_README.md). Do not use older versioned packaging scripts for BUILD127.

## Validation and release history

The [BUILD127 rollback audit](MARKETRISKMONITOR_BUILD127_ROLLBACK_AUDIT.md) records regression results, APK content checks, V2/V3 verification and ZIP alignment. These are recorded release results, not a claim that this documentation update reran or rebuilt the application.

[CHANGELOG.md](CHANGELOG.md) contains the consolidated historical notes through BUILD124 and earlier releases. Use the [BUILD127 release report](MarketRiskMonitor_GlobalPlus_2026.09.26.4_BUILD127_RELEASE_REPORT.md) and rollback audit for the current rollback scope. Older per-release documents describe their own builds and can contain superseded behavior.
