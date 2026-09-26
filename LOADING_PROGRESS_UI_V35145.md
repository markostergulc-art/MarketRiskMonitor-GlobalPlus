# Loading Progress UI — Market Risk Monitor Global+ v3.5.1.45

## Scope
UI observer only. The v3.5.1.44 scheduler remains authoritative and unchanged.

## What changed
The existing loading-priority status area now renders a thin progress bar plus a readable source/dataset description. The existing refresh progress area also shows provider + dataset instead of only a generic provider name.

Examples of user-facing source labels include:

- Eurostat · General government debt
- IMF WEO · General government debt / fiscal balance
- World Bank · Macro / fiscal data
- FRED · economic series
- GIE AGSI+ · EU gas storage
- EIA · U.S. energy data
- Yahoo Finance · market prices / history

Raw URLs, request IDs, headers and credentials are never shown.

## Real vs indeterminate progress
A numeric percentage is shown only when the module already exposes a real `done / total` denominator, such as ETF, S&P or deferred-company loading. When the total is not knowable from the existing operation, the bar is explicitly indeterminate; no synthetic percentage is invented.

## Foreground / background
The status follows the current scheduler state:

- P0/P1 work is visually foregrounded;
- P2/P3 work is shown as a lower-prominence background sync;
- cached-data use can be labelled as `Showing cached data · refreshing`;
- the most recently active real provider/dataset is shown when a request is actually in flight.

The existing full refresh progress bar and the scheduler observer are not shown simultaneously: while the refresh progress UI is active, it remains the single visible progress area. After it collapses, remaining background scheduler work can be shown by the compact loading observer.

## Network impact
Additional network requests introduced by this UI: **0**.

The observer is called from the existing request/cache wrapper and receives metadata about requests that already exist. It never calls `fetch()` itself.

## Scheduler invariants
The following v44 functions are byte-identical in v45:

- `loadPriorityForV44`
- `pumpLoadSchedulerV44`
- `queueLoadV44`
- `scheduleDeferredV44`
- `scheduleAroundPageV44`
- `refreshActiveV44`

Therefore P0/P1/P2/P3 priority ordering, maximum concurrency, request promotion, deduplication, background yielding, retry/backoff and stale-while-revalidate behaviour are unchanged.
