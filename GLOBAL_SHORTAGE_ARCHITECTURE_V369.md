# Global Shortage Early Warning — architecture (v3.6.9 / BUILD119)

## Baseline
Inspected baseline: Market Risk Monitor Global+ v3.6.8, versionCode 118, package `com.marko.marketrisk.globalplus`.
The application is a single-activity Android/WebView application with the main UI and financial engines in `app/src/main/assets/index.html`, supplemental JavaScript assets, a native proxy/cache layer in `MainActivity`, SQLite-backed HTTP cache in `RiskDatabase`, and WorkManager background refresh of previously used URLs.

## Strict lazy lifecycle
The new top-level `shortage` page is only a navigation/page shell at startup. The startup HTML contains a small lifecycle guard, but the actual module code is in `global_shortage_v369.js` and is **not** present in any static `<script src>` tag.

The local module asset is dynamically requested only from `navTo('shortage', true)`, i.e. an explicit user navigation action. Programmatic history restoration with `userAction=false` cannot initialize it. The standard v44 loading scheduler deliberately has no `shortage` module specification, `renderAll()` has no Global Shortage renderer, and normal boot/Smart Refresh does not call the module.

Before first user open, Global Shortage performs no cache parsing, source parsing, scoring, charting, timers, WorkManager registration, or external requests. Diagnostics can report `Initialized: NO` using only the lightweight loader state.

After first open, the module restores its own derived snapshot cache, then progressively reuses the existing EIA/GIE commodity adapters. Existing raw HTTP/native caches therefore avoid duplicate calls when a compatible observation is already fresh. Manual Refresh forces the initialized module to refresh. Android background refresh behavior is not changed; URLs already used by the app continue to follow the existing WorkManager/cache policy.

## Error isolation
Every implemented source is isolated with settled/caught promises. A failed source records a failure, leaves other sections usable, and produces N/A/PARTIAL rather than aborting the application. Unsupported chains are represented explicitly as N/A; no placeholder market values are inserted.
