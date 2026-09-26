# Regression Report — v3.5.1.48

Baseline: v3.5.1.47 / versionCode 80  
Target: v3.5.1.48 / versionCode 81

## Allowed functional change

Only Android/WebView delivery of the two Settings exports changed, plus release/version metadata and download status text.

## Export/methodology content continuity

The following v47 content-producing functions are byte-identical in v48:

- `auditSnapshotV47`
- `marketAuditRowsV47`
- `fiscalAuditRowsV47`
- `macroAuditRowsV47`
- `correlationAuditRowsV47`
- `commodityAuditRowsV47`
- `earlyAuditRowsV47`
- `globalRiskAuditRowsV47`
- `methodologyMarkdownV47`
- `sanitizeExportV47`
- `csvV47`
- `zipStoreV47`

Result: **12/12 byte-identical**.

The version constants used by those functions were intentionally advanced to 3.5.1.48 / 81.

## Financial/loading regression

All inherited deterministic suites pass:

- Export / market-universe: 54/54
- Markets-card sparkline period: 42/42
- Graph-period / loading UI: 43/43
- Market Health / Overview: 32/32
- Fiscal score/regression: 48/48
- Fiscal freshness/loading: 23/23
- EU gas countries: 21/21
- Storage coverage: 10/10
- Parser fixtures: 29/29 + 29/29 + 22/22
- Native export bridge JS/source checks: 25/25
- Native ZIP/Base64 roundtrip: 3/3

Total deterministic checks: **381/381 PASS**.

## Native/API change

Unlike v47, native source and fallback `classes.dex` intentionally change because the real Android file-save bridge is the purpose of this release.

Unchanged:

- `resources.arsc` SHA-256: `698bae3d88dca55eae07586fd95ce0d4d7f29d89fbb61b239eb63db1f7caabf9`
- package / minSdk / targetSdk
- signing certificate SHA-256: `c17fdf8d2fc50db4bf77577fb3d6d9d9105e00f2b5952df362f7c27cad8a16b6`

v48 fallback `classes.dex` SHA-256:

`70b9a6162c6514f2dca15243407a34a8b271d17c4d2a4193523a9ed77918c83e`

The APK verifier confirms:

- `saveExportFile` exists in DEX;
- it has runtime `@JavascriptInterface` annotation;
- `addJavascriptInterface` wiring exists;
- MediaStore Downloads URI and relative path are present;
- no broad storage permission is present.

## Physical-device limitation

Physical Android/GrapheneOS save-to-Downloads interaction remains **NOT EXECUTED** because no device/ADB connection is available in this environment.
