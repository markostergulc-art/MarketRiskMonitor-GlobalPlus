# My T212 Portfolio — v3.6.3 / BUILD113

## Scope
This release adds one isolated portfolio-analysis section: **My T212 Portfolio**.
Unrelated market-risk, macro, commodities, bonds, ETF, correlation and global-risk engines are not redesigned or reweighted.

## Data path
- Trading 212 read-only current positions: `/api/v0/equity/positions`
- Trading 212 read-only account summary: `/api/v0/equity/account/summary`
- Existing Trading 212 instrument metadata remains available.
- Market history and best-effort fundamentals reuse the application's existing Yahoo Finance-compatible data path.
- A failed fundamental source does not remove the holding; confidence/data status is reduced instead.

No order-placement, order-modification or trading action endpoint is implemented by this module.

## Analysis model
Each holding separates company/financial quality from valuation and portfolio fit.
Available components are normalized rather than treating missing data as zero.

Nominal component weights:
- Quality: 20%
- Valuation: 20%
- Growth: 15%
- Balance sheet: 10%
- Cash flow: 10%
- Risk: 10%
- Momentum: 5%
- Portfolio fit: 10%

The UI exposes component scores, a total score, confidence, valuation zone, AI/CAPEX exposure, reasons, bull/base/bear context, and conditions that would change the view.

## Position statuses
- `KEEP`
- `WATCH`
- `REDUCE / REVIEW`
- `SELL REVIEW`

A single negative metric is not sufficient to generate `SELL REVIEW`. Purchase P/L is displayed but is not used as a direct sell/keep signal.

## Portfolio-level analysis
The module calculates portfolio value, invested capital where available, unrealized P/L, top-position/top-3/top-5 concentration, sector/country exposure, concentration risks and portfolio strengths from the current holdings.

## Credentials
The normal Android source uses the existing Android Keystore-backed Trading 212 credentials store and authenticated read-only local bridge. The deterministic manual WebView release shell retains the already-existing encrypted WebCrypto/IndexedDB fallback used by the previous Trading 212 module when the native secure bridge is not available.

No Trading 212 credential is embedded in source code or the APK.
