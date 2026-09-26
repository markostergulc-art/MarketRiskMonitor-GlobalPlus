# Implementation Summary — Market Risk Monitor Global+ v3.5.1.43

## Baseline / target

- Baseline: v3.5.1.42 / versionCode 75
- Target: v3.5.1.43 / versionCode 76

## Architecture

v43 adds one independent `fiscalV43` state layer. It lazy-loads only when **Markets** is opened. It is not part of startup and is not called by `renderOverview()`.

Provider work is split into:

1. four bulk Eurostat dataset requests for EU debt/balance/interest/revenue;
2. seven bulk World Bank/IMF-GFS indicator requests across the configured universe;
3. bounded 10Y sovereign-yield requests (`max 4`) for mapped FRED/OECD series.

Every provider path uses cached/stale fallback and allSettled/mapLimit-style failure isolation.

## UI

Markets gains:

- Global Sovereign Fiscal Stress block
- EU Fiscal Watch
- Euro Area Fiscal Watch
- Global Majors
- Highest Fiscal Stress
- Fastest Deterioration
- Global Sovereign Attention
- metric leaders (debt, deficit, interest burden, Bund spread, refinancing gap)

Country cards get only a compact `Fiscal:` badge. Full details remain inside the market/country modal.

Overview gains one compact Sovereign Fiscal Stress card and reads only already-loaded fiscal state.

## Files modified

- `app.js`
- `app/src/main/assets/index.html`
- `app/build.gradle`
- `build_release.sh`

## Files added

- `tests/fiscal_stress_fixture_tests_v35143.js`
- `tests/market_health_regression_tests_v35143.js`
- `tools/build_manual_apk_v35143.py`
- `tools/verify_fallback_apk_v35143.py`
- v43 release/research/methodology/provider/coverage/regression documentation

## Important limitation

This release does not pretend to contain direct production adapters for every national debt-management office listed as an ideal source hierarchy in the product brief. Harmonized EU data use Eurostat; global comparison uses IMF-GFS/World Bank plus OECD/FRED. National-source adapters remain the correct next phase for maturity profiles, gross financing needs, FX-debt shares and public-asset/net-debt context.
