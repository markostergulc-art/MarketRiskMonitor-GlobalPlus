# Trading 212 global portfolio presence — v3.5.1.73

## Scope
Presentation/connectivity only. No scoring or investment-model change.

## Credentials
API key and API secret are configured only under Settings -> Data.

The full Android source contains the existing Android Keystore-backed `Trading212CredentialsStore` and native bridge. Secrets are never displayed after save and are not part of data exports.

The installable fallback APK produced in this build environment uses the WebView session fallback because Android SDK/D8 tooling is unavailable here; in that APK the credentials must be re-entered after a full app-process restart. They are still entered only in Settings and are never written to app data exports.

## Portfolio source
Trading 212 Public API read-only open positions endpoint:
`GET /api/v0/equity/positions`

## Global coverage
The same cached Trading 212 position index is used by:
- S&P 500 stock rows
- country and industry company rows
- stock details
- ETF Intelligence rows
- ETF details
- Capital Rotation equity representatives
- Capital Rotation ETF proxies

## Status labels
- T212 ✓ PORTFELJ / IN PORTFOLIO
- T212 — NIJE / NOT HELD
- T212 · NIJE POVEZANO / NOT CONNECTED
- T212 N/A on connection/API error

No order-placement endpoint is present in this feature.
