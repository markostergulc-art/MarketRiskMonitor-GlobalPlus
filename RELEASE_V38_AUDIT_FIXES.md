# Market Risk Monitor Global+ — v3.8 / BUILD121

## Scope
Targeted repair of BUILD119 audit findings F01–F13. No GA2 retuning, no new shortage providers, no universe redesign, and no unrelated UI redesign.

## Phase 1 — Data validity and fail-closed behavior
- F01: current energy quote eligibility is separate from retained historical series; stale current quote becomes N/A and refresh failure is visible.
- F02: cache reads preserve source retrieval time and read time; stale fallback has an explicit hard age limit.
- F03: empty/incomplete Bonds state returns N/A/PARTIAL instead of fabricated NORMAL.
- F04: Global Shortage excludes stale observations and expired cache from current score.
- F05: strict calendar dates, adapter-aware ZSE number parsing, null/missing values do not become zero.
- F06: freshness produces explicit eligibleForCurrentScore/reason and composites exclude ineligible inputs.

## Phase 2 — Local calculations
- F07: EU gas days-of-demand uses the same compatible country scope for stored gas and annual consumption.
- F08: dividend safety has a minimum evidence gate; T212 missing fundamentals are neutral/missing rather than adverse.
- F12: shortage score bands use explicit decimal boundaries; inventory-only evidence is labeled INVENTORY / STORAGE PRESSURE and not confirmed physical shortage.

## Phase 3 — Auditability
- F09: commodity export uses metric-level observation/value/provenance and does not manufacture retrievedAt at export time.
- F10: export sanitizer uses ancestor-path cycle detection, preserving repeated shared references.
- F11: GA2 export separates GA2 Current Condition/layers from PHASE5_LEGACY rows; fiscal UI text matches GA2 structural-layer semantics.

## Phase 4 — Regression and release
- New targeted audit suite: 38/38 PASS.
- Global Shortage model: 10/10 PASS.
- Daily Capital Rotation: 37/37 PASS.
- Capital Rotation contributors: 39/39 PASS; fixture moved into tests/fixtures.
- Capital Rotation consolidated UI: 17/17 PASS.
- Parser fixtures: 22/22 PASS.
- AGSI country coverage: 21/21 PASS.
- AGSI demand coverage: 10/10 PASS.
- Bonds logic: 13/13 PASS.
- T212 portfolio: 37/37 PASS.
- T212 tradability: 18/18 PASS.
- Excel exporter: 12/12 PASS.
- Canonical app.js is identical to the embedded WebView runtime block.

Historical version-locked compatibility scripts are not part of the v3.8 release gate when they assert old version numbers or behavior intentionally changed by F01–F13. The v3.8 release suite is tests/run_release_v38.sh.

## APK identity and signing
- Package: com.marko.marketrisk.globalplus
- versionName: 3.8
- versionCode: 121
- minSdk: 26
- targetSdk: 35
- APK Signature Scheme: V1 + V2 + V3
- Signing certificate SHA-256: c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6
- The certificate SHA-256 matches the original BUILD119 APK and the existing PKCS#12 signing key.
- classes.dex SHA-256: b317e2ee494299249a0f2cb959f0350b486ee18baf07f224a6f71659b20ae7ca
- classes.dex is byte-identical to original BUILD119.
- Final APK SHA-256: 855dcfff4d589bd49e4a95842f0ab4cad40e88a7a14fa78a9e0e900bae62ab04

## Runtime-test limitation
The APK was not installed on a physical Android device or emulator in this environment. Static/runtime-JS regression, APK structure, ZIP alignment, embedded-asset equality, package/version metadata, and cryptographic signing were verified.
