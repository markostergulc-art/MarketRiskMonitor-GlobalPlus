# Market Risk Monitor Global+ — 2026.09.26.4 / BUILD127

## Scope
Rollback only the unusable Economic Structure feature introduced in BUILD125/126.

Economic Structure is completely removed from the installed runtime. No other functional domain is intentionally changed.

## Reason
BUILD126 snapshot coverage was not production-acceptable: 10 observations across 4 of 86 countries, with 598/602 controlled domain states set to N/A. Test-fixture example mineral rows were also present in the bootstrap snapshot.

## Result
The Market Details view no longer shows an empty Economic Structure section. Existing macro evidence and all unrelated functionality remain.

## QA
See `MARKETRISKMONITOR_BUILD127_ROLLBACK_AUDIT.md`.

## APK
- package: `com.marko.marketrisk.globalplus`
- versionName: `2026.09.26.4`
- versionCode: `127`
- V2/V3 signing: PASS
- certificate continuity: PASS
