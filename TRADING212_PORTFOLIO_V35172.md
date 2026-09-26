# Trading 212 Portfolio Presence — v3.5.1.72

## Purpose
Capital Rotation now shows whether a displayed stock or ETF is present among the user's currently open Trading 212 Invest positions.

This is a display/portfolio-context layer only. It does not affect any risk score, projected rotation score, market confirmation score, ranking or investment calculation.

## Matching
Trading 212 instrument tickers are normalized before comparison so broker-specific forms can be matched to the Yahoo-style symbols already used by Market Risk Monitor. Examples covered by the matching tests include U.S., European and Japanese ticker forms.

## UI states
- `T212 ✓ PORTFELJ`: the normalized ticker is present in an open Trading 212 position with positive quantity.
- `T212 — NIJE`: Trading 212 is connected and the ticker is not present in the current open-position set.
- `T212 · NIJE POVEZANO`: no Trading 212 credentials are active.
- Loading/error variants are isolated to the Trading 212 status layer.

## Read-only behavior
The implementation retrieves only the Trading 212 open-equity positions endpoint. No create/update/delete order action is implemented.

## Credentials
The full Android source includes an Android Keystore-backed credential store. The manual fallback APK generated in this build environment cannot compile the new Java bridge, so its credentials remain only in process memory and are not persisted after the app closes.

## Failure isolation
If Trading 212 is unavailable or authentication fails:
- Capital Rotation continues to work;
- scores do not change;
- stock/ETF data continues to load from existing providers;
- only Trading 212 badges report unavailable/error state.
