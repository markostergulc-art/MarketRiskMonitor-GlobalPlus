# Market Risk Monitor Global+ — 2026.09.26.2 / BUILD125

## Scope
Targeted release implementing only Market Details -> Economic Structure, as specified by:
- `ECONOMIC_STRUCTURE_SOURCE_RESEARCH.md`
- `ECONOMIC_STRUCTURE_IMPLEMENTATION_PROMPT.md`

No GA2, country-risk, Market Health, risk bands, correlation, Shortage, Capital Rotation, Bonds, T212 or alert methodology was retuned.

## Phase results
1. PASS — baseline/universe/lazy architecture inventory and provider fixture gate.
2. PASS — provider-neutral Economic Structure contract, 86/86 market surfaces, per-domain frequency-aware cache, zero startup requests.
3. PASS — World Bank WDI broad economic structure: agriculture/industry/manufacturing/services as % GDP.
4. PASS — UN Comtrade trade adapter: HS2 exports/imports, merchandise totals, export destinations, strict C00/mot=0/partner2=0 filtering and share reconstruction.
5. PASS — provider/cache/provenance completion for summary domains.
   - Audit after Phase 5: PASS — full BUILD124 regression + new Economic Structure tests; no scoring mutation/startup fetch regression.
6. PASS — USGS Minerals Yearbook production and facilities parsers against validated official schema. Production/facilities/reserves kept distinct. Reserves remain controlled N/A pending separately validated reserves parser.
7. PASS — FAOSTAT agriculture using `api.data.apps.fao.org/api/v2/bigquery`, ranking by production quantity, annual period/unit/flags preserved.
8. PASS — World Bank tourism with recent non-null observation gating; independent heavy-domain error isolation.
9. PASS — core + extended Market Details UI integration; composition/exports default available, minerals/agriculture/tourism section-lazy, facilities nested-lazy.
10. PASS — coverage/performance/release QA and identity 2026.09.26.2 / BUILD125.
   - Audit after Phase 10: PASS.

## Final MD conformance audit
`ECONOMIC_STRUCTURE_FINAL_AUDIT_BUILD125.md`: **89/89 PASS**.

Key guarantees verified:
- Economic Structure is CONTEXT ONLY and not referenced by scoring engines.
- No Economic Structure request executes at module/startup load.
- Main market-card renderer remains unchanged.
- Core risk/model functions checked against BUILD124 remain byte-identical.
- World Bank, UN Comtrade, USGS, FAOSTAT and tourism provider semantics follow the researched source contract.
- Trade aggregation excludes customs/transport/partner2 sub-aggregates.
- Mineral production, facilities, reserves and trade are not conflated.
- Critical-mineral authority metadata is explicit; rare earths remain distinct.
- Agriculture ranking basis is production quantity and units remain tonnes.
- Tourism null/old observations fail closed.
- Cache is per-country/per-domain and does not overwrite original retrievedAt on read.
- Partial provider failure does not collapse other domains.
- Both core and extended market detail flows expose the new section.

## Regression
Active gate: `tests/run_release_20260926_2.sh` — PASS.
Economic Structure acceptance: **26/26 PASS**.
Final MD conformance audit: **89/89 PASS**.
Legacy GA2/Shortage/Capital Rotation/AGSI/Bonds/T212/Excel suites all PASS inside the release gate.

## APK identity
- Package: `com.marko.marketrisk.globalplus`
- versionName: `2026.09.26.2`
- versionCode: `125`
- minSdk: `26`
- targetSdk: `35`
- V2 signature: PASS
- V3 signature: PASS
- Signing certificate SHA-256: `c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`
- APK SHA-256: `ae01bcb5d68deec6e93134b8d904c8bd38b0c09c85c2c6313054ecb820f4c2bd`

## Packaging limitation
This environment still does not provide a full Android SDK/Gradle toolchain. The installable artifact therefore uses the project's established fallback WebView DEX packaging. The full source contains the new native allow-list entries for `comtradeapi.un.org`, `api.data.apps.fao.org` and `www.sciencebase.gov`, plus the ScienceBase response-size exception, but those Java changes are not compiled into the fallback DEX. This limitation is not hidden and should be resolved by a real Gradle/device build when that toolchain is available.
