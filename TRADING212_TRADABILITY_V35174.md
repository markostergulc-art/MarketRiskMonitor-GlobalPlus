# Trading 212 Tradability — v3.5.1.74

The badge answers one question only:

> Is this stock or ETF available to trade through the Trading 212 account represented by the configured API credentials?

It does **not** indicate whether the user owns the instrument and does not inspect open positions.

## Data source
Authenticated read-only Trading 212 Public API:

`GET /api/v0/equity/metadata/instruments`

The catalog contains accessible instruments and their Trading 212 tickers/types. The app caches a successfully loaded catalog for 6 hours and does not use it in any risk score.

## Statuses
- `T212 ✓ DOSTUPNO` / `T212 ✓ TRADABLE` — matched in the loaded Trading 212 catalog.
- `T212 × NEDOSTUPNO` / `T212 × NOT AVAILABLE` — a valid catalog is loaded but the instrument is not matched.
- `T212 · NIJE POVEZANO` — API credentials are not configured.
- `T212 …` — catalog is loading.
- `T212 N/A` — authentication/catalog request failed.

## Visual semantics
- Available: muted green.
- Not available: muted red.
- Not connected/loading/N/A: restrained neutral styling.

## Coverage
The same badge logic is used in:
- S&P 500 rows,
- country/industry stock lists,
- stock detail loading/ready/error states,
- ETF Intelligence rows,
- ETF detail loading/ready/error states,
- Capital Rotation Top-10 stock representatives,
- Capital Rotation ETF proxies.

## Credentials
API key and secret are entered only under Settings → Data. Full Android source stores them with Android Keystore and performs the authenticated catalog request through the native WebView bridge. No Trading 212 order endpoint is used.

## Ticker matching
Trading 212 uses broker-specific identifiers (for example `AAPL_US_EQ` and, for some European listings, compact suffix forms). Matching normalizes the app ticker and Trading 212 ticker without changing the instrument shown by the app. Controlled aliases handle common European listing suffixes such as a Yahoo-style `.L` / `.DE` symbol versus Trading 212's compact listing suffix.
