# Data Export — v3.5.1.47

## Purpose

The new **Settings → Data & Methodology → Download current data** action creates an audit package from the values already held/calculated by the running application. The export is intended for later independent checking of data quality, source relevance and model inputs.

## Network behaviour

`CURRENT SNAPSHOT` is deliberately offline with respect to data acquisition: `exportDataV47()` does not call `fetch`, `refreshAll`, `refreshActiveV44`, `ensure*` or any provider loader. Additional network requests introduced by export: **0**.

## ZIP contents

- `data_snapshot.json` — sanitized serializable application audit state.
- `markets.csv` — country/index identity, provider, latest value/change, history window/count, component scores, fiscal state, final country score, coverage/eligibility and available source/freshness metadata.
- `fiscal.csv` — normalized sovereign metrics and current-reference metadata including provider/series/definition, debt, balance, primary balance, interest burden, yield/spread, effective debt cost, refinancing gap, r-g, reference type/frequency/freshness, comparability, score eligibility, coverage, status, drivers/offsets and ranking eligibility.
- `macro.csv` — loaded macro detector rows and normalized audit fields where available.
- `correlations.csv` — loaded correlation matrix/regime observations.
- `commodities.csv` — loaded commodity summary values and provider/date/unit/coverage metadata where held in state.
- `early_warning.csv` — loaded early-warning signals, value/score/status/source/date and contribution context where available.
- `global_risk.csv` — current Global Risk score/components/coverage/confidence/status.
- `metadata.json` — app/version/export time, timezone, language, active market universe and loaded/unloaded module status.
- `README.txt` — export semantics.

## Missing/unloaded state

The export never fabricates data. Modules that have not loaded remain represented by `NOT_LOADED`, `UNAVAILABLE`, `LIMITED_DATA`, empty rows or null values according to their current runtime state.

## Security

`sanitizeExportV47()` recursively strips credential-like field names before JSON export. The denylist is case-insensitive and covers API keys, tokens, authorization, passwords, secrets, cookies, x-key and access-token forms. Promise/function/symbol values are not serialized. Raw provider payloads are not dumped by default.

## Current-state semantics

The package records the snapshot at export time. It does **not** guarantee that every application module has been loaded. This is intentional: it allows a later reviewer to distinguish data actually available to the application from data that had not been loaded.

## Android/WebView note

The export uses the existing WebView-side Blob/download path and does not require a data refresh. Static/runtime generation and ZIP-format QA pass. Physical save/download behaviour on an Android/GrapheneOS device was not executable in the build environment and therefore is reported as `NOT EXECUTED`, not as a physical-device PASS.
