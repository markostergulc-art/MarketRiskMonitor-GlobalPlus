# Market Risk Monitor Global+ — BUILD127 Rollback Audit

Release: `2026.09.26.4 / BUILD127`

## Decision
Economic Structure was removed from runtime because BUILD126 shipped an essentially empty bootstrap snapshot.

## Root cause
BUILD126 local snapshot contained only 10 observations across 4 of 86 countries. 598 of 602 domain-status rows were `N/A`. The bootstrap also included parser-fixture example rows such as `Example Copper Mine` and `Example REE Plant`, which are test data and must not be production content.

## Rollback scope
Removed only:
- Economic Structure runtime hook from core Market Details.
- Economic Structure runtime hook from extended-country Market Details.
- Economic Structure script tags.
- Economic Structure runtime JS assets.
- Economic Structure snapshot DB/JSON/JS assets.
- BUILD126 packager requirements for those assets.

Preserved:
- GDP / inflation / unemployment market-card priority data.
- Existing Market Details and macro evidence.
- GA2 and country-risk methodology.
- Market Health, risk bands and correlation.
- Shortage.
- Capital Rotation.
- Bonds.
- Trading 212 integration.
- Alerts / Change Intelligence.

## QA
- Audit fixes: 38/38 PASS after updating only the expected release identity assertion.
- Native architecture: 14/14 PASS after updating only the expected release identity assertion.
- Change Intelligence / Smart Alerts: 17/17 PASS.
- Market Details contract/lazy/UI/performance: PASS.
- Market cards / macro priority / evidence-click flow: PASS.
- Global Shortage: 10/10 PASS.
- Daily Capital Rotation: 37/37 PASS.
- Capital Rotation contributors: 39/39 PASS.
- Capital Rotation consolidated UI: 17/17 PASS.
- Parser fixtures: 22/22 PASS.
- AGSI country: 21/21 PASS.
- AGSI demand coverage: 10/10 PASS.
- Bonds: 13/13 PASS.
- T212 portfolio: 37/37 PASS.
- T212 tradability: 18/18 PASS after updating only release identity expectation.
- BUILD127 rollback conformance: PASS.
- APK content inspection: PASS — no Economic Structure runtime/data asset exists in APK.
- V2 signature: PASS.
- V3 signature: PASS.
- ZIP integrity/alignment: PASS.

## Identity
- package: `com.marko.marketrisk.globalplus`
- versionName: `2026.09.26.4`
- versionCode: `127`
- signing certificate SHA-256: `c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`
