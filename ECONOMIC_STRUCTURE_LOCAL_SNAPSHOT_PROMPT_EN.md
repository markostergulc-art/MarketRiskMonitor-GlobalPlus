# MARKET RISK MONITOR GLOBAL+
# ECONOMIC STRUCTURE — LOCAL SNAPSHOT / MONTHLY REFRESH EXCEPTION

## ROLE
Act as a senior Android/WebView architect, JavaScript/data engineer, SQLite/Room data engineer, international trade analyst, minerals/critical-raw-materials analyst, agricultural-data analyst, tourism-data analyst, and QA/release engineer working on the latest authoritative source of Market Risk Monitor Global+.

## 1. CRITICAL EXCEPTION
For Economic Structure only, introduce a deliberate exception to the rule that current-looking financial/macro data must not be hardcoded. Economic Structure changes relatively slowly, much of it is annual, and runtime provider access has proved unreliable. Therefore Economic Structure must no longer depend on runtime provider fetches as its primary path. It must use a BUILD-TIME VERIFIED LOCAL DATASET stored locally in the app.

## 2. STRICT SCOPE
This exception applies only to: key industries, economic composition, top export products, top export destinations, top imports, minerals, critical minerals, rare earths, agriculture, tourism, and other Economic Structure context. Do not extend it to GDP, CPI, unemployment, bonds, market prices, equities, FX, commodity prices, volatility, GA2, risk models, Shortage, Capital Rotation, T212, or alerts. Those continue to use the existing dynamic-data methodology.

## 3. STORAGE
Do not use JavaScript literals as the primary storage for current Economic Structure values. Prefer a local SQLite/Room database or another local database architecture already suitable for the app. A generated read-only projection may be used for WebView compatibility, but the canonical snapshot must remain a versioned local database and must not embed current values manually in source code.

## 4. BUILD-TIME SNAPSHOT
Prepare Economic Structure before the build: official sources -> build-time refresh tool -> validation -> normalized local database -> APK -> Market Details / Economic Structure. Runtime must not need Comtrade, FAOSTAT, USGS, or tourism-provider access to render this section.

## 5. MANDATORY REFRESH CHECK ON EVERY BUILD
Store and inspect `economic_structure_last_refresh` / `lastSuccessfulRefreshAt`. If snapshot age is <30 days, a full refresh is not mandatory. If snapshot age is >=30 days, refresh is mandatory before a release build can complete.

## 6. AGE RULE
Use `MAX_SNAPSHOT_AGE_DAYS = 30`, measured in UTC. The APK build date must never substitute for the dataset refresh date.

## 7. GLOBAL SNAPSHOT METADATA
Persist at least: schemaVersion, snapshotVersion, lastRefreshStartedAt, lastSuccessfulRefreshAt, refreshCompletedAt, sourceVintage, countryCount, domainCount, recordCount, validationStatus.

## 8. PROVENANCE PER RECORD
Preserve where applicable: countryCode, domain, metric, label, value, unit, observationPeriod, observationDate, provider, dataset, series/indicator/HS/commodity code, classification, sourceUrl, sourceRetrievedAt, snapshotRefreshedAt.

## 9. DATE SEMANTICS
Keep observation period, source retrieval time, and local snapshot refresh time distinct. A current snapshot may legitimately contain an older official observation year.

## 10. UI
Economic Structure must show period, source, and local snapshot date. Never show LIVE for this local dataset. Use VERIFIED SNAPSHOT, STALE SNAPSHOT, PARTIAL, or N/A.

## 11. STATUS
VERIFIED SNAPSHOT means snapshot age <30 days. STALE SNAPSHOT means >=30 days. A release build should normally never ship a stale snapshot because the build gate requires refresh.

## 12. SOURCE VINTAGE
A monthly refresh does not imply a new observation year. If the provider still publishes only 2024, keep observationPeriod=2024 and sourceRetrievedAt=current refresh time.

## 13. REFRESH TOOL
Create a build-time tool such as `tools/refresh_economic_structure.py` that: reads the authoritative market universe, checks snapshot age, retrieves provider data, parses, validates, normalizes, writes a new local DB, generates coverage and refresh reports, and exits non-zero on validation failure.

## 14. MODES
Support `--check`, `--refresh`, and `--force`.

## 15. BUILD INTEGRATION
Release build flow must automatically: check snapshot age; refresh when required; validate DB; continue only after PASS.

## 16. FAILED REQUIRED REFRESH
If age >=30 days and refresh fails, release build must be BLOCKED. An explicit stale override may exist only for development/test builds, never default release behavior.

## 17. ATOMIC UPDATE
Refresh into a temporary database, validate, then atomically replace the existing good database. Failed refresh must leave the previous verified snapshot byte-identical.

## 18. DATABASE VERSIONING
Use a dedicated Economic Structure schema version. Content refresh does not automatically require a schema-version bump.

## 19. COUNTRY COVERAGE
Use the same authoritative market universe as the app: core + extended. Do not maintain a disconnected manual country list.

## 20. COVERAGE MATRIX
Generate Country | Industry | Exports | Destinations | Imports | Minerals | Agriculture | Tourism. N/A is legitimate but must be explicit and documented.

## 21. ECONOMIC COMPOSITION
Store agriculture/industry/manufacturing/services shares of GDP from validated providers such as World Bank WDI.

## 22. TRADE
Store top exports, export destinations, and imports with codes, labels, values, shares, and periods. Comtrade processing remains build-time only and must keep strict aggregate filters (`customsCode=C00`, `motCode=0`, `partner2Code=0`) to avoid double counting.

## 23. MINERALS
Process USGS at build time. Download, parse, filter to relevant countries, normalize, and store locally rather than shipping the full global source files when unnecessary.

## 24. MINERAL SEMANTICS
Keep production, facilities, capacity, reserves, and trade distinct. If no validated reserves source exists, reserves=N/A. Never infer reserves from production or production from exports.

## 25. CRITICAL MINERALS
Store classification authority/vintage metadata separately from mineral production data.

## 26. RARE EARTHS
Rare-earth status must remain distinct from critical-mineral status. Use separate fields such as rareEarth, criticalUnderEU, and criticalUnderUS where supported.

## 27. AGRICULTURE
Retrieve FAOSTAT build-time. Store country, itemCode, itemName, year, productionTonnes, flag, rank. Rank only by production quantity unless another explicitly documented metric is introduced.

## 28. FAOSTAT QUERY VALIDATION
Schema-test field types before refresh. In particular, if item_code is STRING, exclusions must be quoted strings (`NOT IN ('1717','1804',...)`) and not integers. Cover this with an automated test.

## 29. TOURISM
Store latest real non-null tourism observations locally. Because this is structural context rather than a live signal, do not discard a legitimate 2023 observation merely because the current year is later, unless an explicit methodology requires a maximum age.

## 30. KEY INDUSTRIES
Derive key industries from quantified data where possible. Do not use AI-generated descriptions as production truth.

## 31. ZERO RUNTIME NETWORK FOR ECONOMIC STRUCTURE
Opening Economic Structure must work in Airplane Mode. Runtime flow is open market -> read local snapshot -> render immediately.

## 32. OFFLINE-FIRST
No spinner-to-HTTP-to-error flow is allowed for Economic Structure.

## 33. PERFORMANCE
Index the canonical DB at least by countryCode, domain, and rank. Do not load the entire DB into memory when only one country is needed.

## 34. PROVENANCE UI
Within Market Details, allow evidence/provenance to expose source, observation period, provider, dataset/code/classification, retrieved time, and snapshot refresh time. Do not reintroduce a separate global Evidence button.

## 35. BUILD REPORT
Each build report must include Economic Structure snapshot last refresh, age, DB schema, countries, records, coverage, and validation result.

## 36. CHANGELOG
Document that Economic Structure now uses a verified local snapshot database, runtime provider requests were removed for this domain, freshness is checked automatically at every release build, and mandatory refresh occurs after 30 days.

## 37. MANDATORY TESTS
Test: 29 days passes without refresh; 30/31 days require refresh; failed refresh preserves existing DB and blocks release; atomic replacement only after PASS; full offline rendering; zero Economic Structure runtime provider calls; full authoritative-universe coverage with controlled N/A records; NULL != 0; every numeric value has provider+period+snapshot metadata; Economic Structure is not referenced by scoring engines.

## 38. REFRESH AUDIT
Every refresh generates `ECONOMIC_STRUCTURE_REFRESH_REPORT_YYYYMMDD.md` with provider attempts/results, updated/partial countries, N/A domains, record changes, source vintages, and validation results.

## 39. OPTIONAL DIFF
Prefer a prior-vs-new snapshot diff for QA only. It must never affect scoring.

## 40. RELEASE BUILD FLOW
1. Load latest source.
2. Inspect last Economic Structure refresh.
3. Calculate snapshot age.
4. If <30 days, use existing verified snapshot.
5. If >=30 days, refresh all Economic Structure domains.
6. Validate dataset.
7. Generate coverage report.
8. Generate refresh report.
9. Run Economic Structure tests.
10. Run full application regression.
11. Only if all PASS, build APK.

## 41. IMPLEMENTATION PHASES
Phase 1: audit current Economic Structure runtime and DB architecture.
Phase 2: define local database schema.
Phase 3: implement build-time refresh framework.
Phase 4: migrate World Bank composition and tourism into snapshot.
Phase 5: migrate Comtrade into snapshot.
AUDIT.
Phase 6: migrate USGS minerals/facilities.
Phase 7: migrate FAOSTAT agriculture.
Phase 8: switch Economic Structure UI to local-snapshot-only runtime.
Phase 9: implement build-age gate and atomic refresh.
Phase 10: offline/device-style QA + final regression.
FINAL AUDIT. Only after PASS build the APK.

## 42. PRIMARY ACCEPTANCE CRITERION
Economic Structure = verified local snapshot + source provenance + monthly build-time refresh + zero runtime provider dependency. Economic Structure must not fail because of CORS, WebView host allow-list, provider timeout, mobile connectivity, or runtime API limits.

## 43. FINAL SCOPE GUARD
This is an intentional exception only for Economic Structure and must not become a precedent for hardcoding financial or market data. Everything else remains under the existing dynamic-data methodology.
