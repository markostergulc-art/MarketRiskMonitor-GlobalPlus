# Market Risk Monitor Global+ — Phase 12 Source Resilience

## PHASE 12 COMPLETE

**Baseline:** v3.5.1.61 / versionCode 94  
**Target:** v3.5.1.62 / versionCode 95  
**Scope:** provider classification, fallback transparency, transport resilience and failure isolation only

## Objective

Phase 12 strengthens source resilience without changing production scoring methodology. The work classifies source dependencies, makes fallback order explicit, hardens the central fetch path against transient/provider failures, and verifies that one provider failure cannot collapse independent modules.

## Provider classification

The internal source taxonomy is now explicit:

```text
PRIMARY_OFFICIAL
PRIMARY_MARKET
INSTITUTIONAL
SECONDARY
UNOFFICIAL_FALLBACK
```

Representative classifications:

- FRED, ECB, Eurostat, World Bank, IMF, CFTC, OFR, U.S. Treasury Fiscal Data, New York Fed, EIA, DOE, FAO, GIE → `PRIMARY_OFFICIAL`;
- Cboe, Zagreb Stock Exchange, Yahoo Finance → `PRIMARY_MARKET`;
- World Gold Council / derived institutional composites → `INSTITUTIONAL`;
- unknown/unclassified sources degrade to `UNOFFICIAL_FALLBACK`.

Yahoo remains necessary for broad traded-market history but is not presented as an official macro/fiscal provider.

## Explicit fallback hierarchy

The registry documents implemented fallback chains:

```text
Implied volatility:
Cboe
  ↓
Yahoo Finance

Yahoo transport:
query1.finance.yahoo.com
  ↓
query2.finance.yahoo.com
  ↓
stale cache

FAO food data:
official CSV
  ↓
official HTML
  ↓
stale cache
```

Official macro/fiscal/physical indicators do not silently substitute an unrelated weaker market feed merely to keep a number visible. If a validated alternate source is not implemented, the result remains unavailable or uses an explicitly flagged stale cache.

## Central transport hardening

`fetchWithTimeout()` now uses bounded resilience rules:

- normal request: at most 2 live attempts;
- forced refresh: at most 3 live attempts;
- timeout/network/HTTP 429/5xx may retry with bounded backoff;
- malformed JSON and empty payloads do **not** enter retry storms;
- payload validation occurs before cache write;
- stale cache is considered only after live attempts fail;
- stale-cache use is marked as fallback and continues to reduce source-quality/confidence semantics.

Failure types are recorded as:

```text
TIMEOUT
HTTP_429
HTTP_5XX
HTTP_4XX
MALFORMED_JSON
EMPTY_RESPONSE
NETWORK
UNKNOWN
```

`Retry-After` hints are accepted but capped so one provider cannot block the application for an unbounded interval.

## Failure isolation

The existing refresh architecture remains modular. Phase-12 tests confirm failure isolation around:

- FRED/global macro-credit-rate loading;
- country/market loading;
- cross-asset loading;
- equity internals;
- macro-cycle processing.

A failed source remains missing/degraded; it is never converted to `0 risk` and does not terminate independent provider/module work.

## Provider diagnostics / export

Provider Health in Settings now additionally exposes:

- source class;
- last classified failure;
- number of attempts used for the latest live request where available.

The data export now includes `sourceResilienceV62` with:

- methodology version;
- five-class taxonomy;
- complete provider registry;
- explicit fallback chains;
- current provider-health/failure diagnostics.

No API key or secret value is added to the registry/export.

## Production calculations protected

The following model functions remain byte-identical to v3.5.1.61:

- `globalRiskModel`
- `globalFactorArchitectureV53`
- `buildMacroCycle`
- `fiscalScoreRowsV43`
- `commodityShockRisk`
- `commodityRegime`
- `aggregateEquityInternalsV57`
- `lagAwareCorrMatrixV58`

Raw `fetch(` call sites remain **6 → 6**. Phase 12 changes transport behavior around existing requests rather than adding a new data dependency.

## Failure simulations

Deterministic tests simulate:

- HTTP 429 → bounded retry → success;
- timeout → bounded retry → success;
- HTTP 5xx → bounded retry → success;
- malformed JSON → no retry storm, stale cache fallback when available;
- empty text response → no cache poisoning, stale cache fallback when available;
- HTTP 4xx → no transient retry;
- individual module/provider failure → independent modules remain isolated.

## Files/functions changed

Primary files:

- `app.js`
- `app/src/main/assets/index.html`
- `app/build.gradle`
- `app/src/main/java/com/marko/marketrisk/globalplus/MainActivity.java`
- `build_release.sh`
- `PROVIDERS.md`
- Phase-12 tests/build-verification tools.

Added Phase-12 functions/constants:

- `SOURCE_RESILIENCE_METHOD_V62`
- `SOURCE_CLASS_ORDER_V62`
- `SOURCE_RESILIENCE_REGISTRY_V62`
- `SOURCE_FALLBACK_CHAINS_V62`
- `sourceRegistryEntryV62()`
- `classifyFetchFailureV62()`
- `validateFetchedPayloadV62()`
- `retryDelayV62()`
- `providerResilienceSnapshotV62()`

Changed transport/UI integration:

- `fetchWithTimeout()`
- `providerHealthHtml()`
- audit/methodology export metadata.

## Validation

```text
Phase 12 source resilience         73/73 PASS
Phase 11 compatibility            52/52 PASS
Phase 10 compatibility            61/61 PASS
Phase 9 compatibility             60/60 PASS
Phase 8 compatibility             71/71 PASS
Phase 7                           37/37 PASS
Phase 6 compatibility             67/67 PASS
Phase 5 compatibility             29/29 PASS
Phase 4 semantics                 33/33 PASS
Phase 3 confidence                24/24 PASS
Freshness semantics               19/19 PASS
Fiscal/loading compatibility      23/23 PASS
Parser fixtures                   29/29 PASS
AGSI country                      21/21 PASS
AGSI coverage                     10/10 PASS
Native export bridge              25/25 PASS
--------------------------------------------
TOTAL                            634/634 PASS
```

Additional checks:

- JavaScript syntax: PASS
- embedded WebView JavaScript parity: PASS
- fallback APK structure: PASS
- broad storage permission absent: PASS
- raw fetch call sites: 6 → 6

## Known limitations

1. Resilience cannot manufacture a substitute source when no methodologically equivalent provider/API is available.
2. Yahoo Finance remains an important `PRIMARY_MARKET` dependency for broad global traded-price history; Phase 12 makes that dependency explicit rather than pretending it is an official source.
3. A stale cache can preserve continuity after live failure, but confidence/source metadata are intentionally degraded.
4. Runtime behavior against real provider outages still depends on Android networking, provider rate limits, CORS/proxy behavior and endpoint availability; deterministic simulations validate application logic, not future provider uptime.
5. Phase 12 does not redesign the scheduler, scoring weights or GLOBAL Risk architecture.

## Regression status

**PASS.** No scoring/factor/macro/fiscal/commodity/equity/correlation regression was detected.

## Next phase

**Phase 13 — Score Hysteresis**: first measure threshold flapping; add hysteresis only if the evidence shows repeated status oscillation, while leaving the numerical risk score unchanged.
