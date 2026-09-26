# Loading Scheduler — v3.5.1.44

## Objective
Improve perceived responsiveness without changing any financial methodology.

## Priority model
- **P0 — ACTIVE:** currently visible tab/module.
- **P1 — ADJACENT:** immediate previous/next navigation tabs.
- **P2 — BACKGROUND:** remaining normal module work.
- **P3 — DEFERRED/HEAVY:** expensive or rarely needed detail/background work.

Navigation distance is read from the current `.navbtn[data-page]` order; tab order is not hardcoded for P0/P1 calculation.

## Startup
Dashboard/Overview core refresh remains the only startup foreground workflow. After the dashboard has rendered, the scheduler queues the neighbouring/remaining modules. Heavy company/industry deferred loading no longer starts directly from startup timers; it is placed in P3 and uses an idle callback with a timeout fallback.

## Tab changes
When a user opens a tab, its queued job is promoted to P0. Existing queued/running module work is reused; a second module request is not started for the same key. Small/medium running background work is allowed to finish and cache its result instead of being aggressively aborted.

## Concurrency
Module scheduler:
- maximum simultaneous module jobs: 2
- maximum P2/P3 background jobs: 1

Provider-internal concurrency remains independently bounded. The scheduler does not raise existing provider limits.

## Manual refresh
- Markets / Commodities / S&P / ETFs: current module is promoted to P0 with force refresh semantics.
- Shared dashboard/core tabs: shared core dashboard data are refreshed.
- The old core force-refresh fan-out into unrelated already-open heavy modules was removed.

## Cache / deduplication
Each module key has a queued/running registry. A queued job can be promoted; a running job is reused. Valid fiscal rows remain visible during revalidation. Existing module/provider caches remain authoritative for their own TTLs.

## Cancellation policy
No aggressive cancellation of useful in-flight work. Heavy detail remains lazy/deferred. This avoids throwing away requests that can still populate cache for the next navigation action.

## Performance measurement
Static scheduler behavior is tested. Real Android measurements for time-to-first-render, first-2s/5s request counts and active-tab time-to-useful-data were **NOT EXECUTED** because no ADB-connected device/WebView profiler is available in this environment.
