# Android Export Download Fix — v3.5.1.48

## Root cause

v3.5.1.47 generated the audit ZIP and methodology Markdown correctly, but delivery used only browser-style Blob download:

`URL.createObjectURL(blob)` → `<a download>` → `a.click()`.

That is not a reliable file-save mechanism inside the packaged Android WebView, so the click could complete in JavaScript without a real file being written.

## Fix

### JavaScript

`saveExportBlobV48()` now:

1. builds exactly the same v47 Blob/data;
2. detects `Android.saveExportFile`;
3. converts the Blob to Base64 with a 12 MB size gate;
4. passes filename, MIME type and Base64 payload to the native bridge;
5. reports `Saved:` only after the native method returns `OK|...`;
6. surfaces `ERROR|...` results to the user;
7. keeps the old browser Blob download only for non-Android browser/dev mode.

If Android WebView is detected but the native bridge is missing, export fails visibly instead of silently falling back.

### Native Android source

The full Android source adds `@JavascriptInterface saveExportFile(...)` to the existing narrow `AndroidBridge`.

- Android 10+: MediaStore Downloads collection, relative path `Download/MarketRiskMonitor`.
- Android 8/9: app-specific external Downloads fallback.
- No `MANAGE_EXTERNAL_STORAGE` or `WRITE_EXTERNAL_STORAGE` permission was added.
- Filename characters outside `[A-Za-z0-9._-]` are replaced with `_`.
- Native decoded payload is limited to 12 MB.

### Standalone fallback APK

Because the build environment has no Android SDK/D8, the installable fallback APK is produced by the existing deterministic manual APK builder. v48 extends that DEX payload so `MainActivity` itself is registered as the `Android` JavaScript interface and exposes an actual runtime `@JavascriptInterface saveExportFile` method. The fallback DEX uses the MediaStore downloads URI on Android 10+ and app-specific external Downloads on older Android.

## Binary transport QA

A deterministic ZIP fixture with the same ten audit-package filenames was generated using the production `zipStoreV47()` implementation. The ZIP begins with the standard `PK` signature, re-opens successfully, preserves Croatian UTF-8 text, and produces an identical SHA-256 before and after Base64 encode/decode transport.

This validates the byte transport path but does **not** substitute for a physical Android filesystem test.

## Physical-device status

- Native save implementation: **PASS — statically and APK-wiring verified**
- Physical Android/GrapheneOS download test: **NOT EXECUTED — no ADB-connected device available**
