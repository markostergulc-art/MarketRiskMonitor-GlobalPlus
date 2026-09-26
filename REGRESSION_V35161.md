# Regression Report — Market Risk Monitor Global+ v3.5.1.61

## Baseline

- v3.5.1.60 / versionCode 93
- Target: v3.5.1.61 / versionCode 94
- Scope: Phase 11 Commodity Physical Risk

## Protected production calculations

Byte-equivalent regression protection confirms Phase 11 did not modify:

- `commodityShockRisk`
- `commodityRegime`
- `buildCommodityOverviewV32`
- `globalFactorArchitectureV53`
- `globalRiskModel`

The physical supply layer remains diagnostic-only and does not enter GLOBAL Risk in this release.

## Network/loading architecture

- Raw `fetch(` call sites: **6 -> 6**
- no new independent network dependency was introduced by Phase 11;
- cache/lazy-loading/failure-isolation architecture remains in place;
- EU country detail loading uses the existing bounded country-worker path.

## Missing-data safety

Validated:

- missing WGV does not create fill=0;
- missing/zero consumption does not create days-of-demand=0;
- incomplete EU aggregate consumption coverage blocks aggregate days-of-demand;
- unbounded physical metrics are not rendered with misleading 0–100 fill bars;
- current price-risk outputs remain independent from physical diagnostic availability.

## Official GIE fixture validation

Regression fixtures cover official reference values for EU, Germany, France, Italy and the Netherlands from the GIE public status snapshot dated 2026-09-13.

## Automated test result

```text
Phase 11                         52/52 PASS
Phase 10 compatibility          61/61 PASS
Phase 9 compatibility           60/60 PASS
Phase 8 compatibility           71/71 PASS
Phase 7                         37/37 PASS
Phase 6 compatibility           67/67 PASS
Phase 5 compatibility           29/29 PASS
Phase 4                         33/33 PASS
Phase 3                         24/24 PASS
Freshness                       19/19 PASS
Fiscal/loading                   23/23 PASS
Parser fixtures                  29/29 PASS
AGSI country                     21/21 PASS
AGSI coverage                    10/10 PASS
Native export bridge             25/25 PASS
-------------------------------------------
TOTAL                           561/561 PASS
```

Additional checks:

- `node --check app.js`: PASS
- embedded WebView JavaScript == canonical `app.js`: PASS
- manual fallback APK package/version/minSdk/targetSdk/launcher: PASS
- APK ZIP integrity/alignment: PASS
- native save bridge wiring: PASS
- broad storage permission absent: PASS

## Signed APK verification

The installable APK is signed with the existing project release certificate.

- JAR/v1 verification: PASS
- APK Signature Scheme v2: PASS
- APK Signature Scheme v3: PASS
- certificate SHA-256: `0b6f4025c38acaa898841bfaa1c0c39516e8fe581bf04ede3fd2ff8cadf729f0`
- installable APK SHA-256: `e595c16894b50a63e84a89c8914dae4c2cf1826820d7dae1f9990c20bb09eba4`

## Result

**PASS — Phase 11 accepted.**
