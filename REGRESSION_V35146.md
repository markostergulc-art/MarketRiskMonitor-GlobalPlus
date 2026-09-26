# Regression Report — v3.5.1.46

Baseline: v3.5.1.45 / versionCode 78
Target: v3.5.1.46 / versionCode 79

## Allowed functional change

Only the core Markets-card sparkline period presentation and required release/version metadata were changed.

## Byte-identical function checks versus v3.5.1.45

31 protected/network/loading/render functions were snapshotted before the edit and compared after it. All are byte-identical, including:

- `globalRiskModel`, `globalContagion`
- `marketMetrics`, `trendRisk`
- `corrMatrix`, correlation-regime functions
- `buildMacroCycle`
- S&P/company-risk functions
- AGSI calculations/parsers/progress renderer
- Fiscal Stress/freshness/reference-selection functions
- `loadPriorityForV44`, `pumpLoadSchedulerV44`, `queueLoadV44`
- `scheduleDeferredV44`, `scheduleAroundPageV44`, `refreshActiveV44`
- `updateLoadStatusV44`, `loadUiNetworkV45`
- `fetchWithTimeout`
- `sparklineSvg`

## Native continuity

Byte-identical to v3.5.1.45:

- `app/src/main/AndroidManifest.xml`
- `MainActivity.java`
- `AgsiKeyStore.java`

APK `classes.dex` and `resources.arsc` retain the same SHA-256 payloads as v3.5.1.45.

## Network

Additional requests introduced by this release: **0**.

## Loading

P0/P1/P2/P3 scheduling, queue ordering, promotion, deduplication, concurrency, retry/backoff and loading-progress behaviour are unchanged.
