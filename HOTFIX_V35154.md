# Market Risk Monitor Global+ v3.5.1.54 — Pre-Phase-6 Refresh/UI Stability Hotfix

## Status

HOTFIX COMPLETE

- Baseline: `3.5.1.53` / versionCode `86`
- Target: `3.5.1.54` / versionCode `87`
- Scope: refresh/loading resilience and stable top-status layout only
- Phase 5 scoring methodology: unchanged
- Phase 6: not started

## Problems reproduced from the user screenshots

1. The refresh/deferred/loading status cards changed their occupied height as refresh state changed, causing the complete page below them to jump vertically.
2. A refresh could report completion/fallback while the Overview remained in `Loading...` / skeleton state, especially when there was no usable previous snapshot or when one renderer failed.
3. Some transient provider failures were treated too aggressively during a forced refresh.

## Fix 1 — fixed refresh/status frame

The three competing top status surfaces now share one fixed reserved stage:

- desktop: 112 px
- narrow/mobile: 118 px
- status cards are positioned as overlays inside the reserved slot
- only one status card is visible at a time
- switching between Refresh, deferred loading and module-priority loading no longer changes document flow
- completed refresh state hands the same slot to deferred/background loading and later returns to the final refresh status

The page below the status stage therefore does not move simply because the status text/state changes.

## Fix 2 — refresh/content completion resilience

### Deterministic no-data state

If the live refresh fails and no prior snapshot is available, the app now creates a deterministic `LIMITED DATA` state and calls the normal render path. It no longer leaves the Overview in an endless `Loading...` state.

Missing data remain missing (`null`); they are never converted to zero risk.

### Per-module render isolation

`renderAll()` now uses a small failure boundary around each renderer. One failing renderer can no longer prevent unrelated dashboard sections from rendering.

### Global model failure boundary

The Phase 5 `globalRiskModel()` is unchanged. A wrapper catches unexpected runtime failure and returns an explicit unavailable/LIMITED model instead of breaking the full render flow.

### Transient network retry

Forced/fresh refreshes now get one bounded retry for transient transport failures, aborts/timeouts, HTTP 408/425/429 and 5xx responses. Existing JS cache/stale fallback semantics remain available.

### CFTC fallback chain

CFTC positioning now attempts the current CFTC Public Reporting Hub resource endpoint first, then the legacy Socrata hostname, then the CFTC legacy text report. Failure is recorded only after all configured variants fail.

## Native Android source hardening

`MainActivity.java` is also hardened for a normal Gradle build:

- current CFTC reporting-hub host added to proxy allowlist
- connect/read timeouts increased to 15/25 seconds
- native DB cache writes only successful 2xx upstream payloads
- an upstream HTTP error may use a bounded recent native cached response with provenance headers
- User-Agent updated to v3.5.1.54

Important: the installable APK generated in this environment uses the existing fallback/manual APK builder because a complete Android SDK/Gradle toolchain is not available here. The JavaScript hotfixes above are active in that APK. The full native-proxy hardening is present in source and becomes active in a standard Gradle build.

## Methodology protection

The following Phase 1–5 methodology components were not changed by this hotfix:

- `globalRiskModel()`
- Phase 5 factor architecture and production weights
- Phase 4 Early Warning classifications/layers
- Phase 3 confidence model
- Phase 2 coverage/eligibility semantics
- Phase 1 freshness semantics

## Validation

### Hotfix-specific

- `28/28` v3.5.1.54 hotfix checks PASS

### Protected prior phases

- `29/29` Phase 5 factor architecture PASS
- `33/33` Phase 4 semantics PASS
- `24/24` Phase 3 confidence compatibility PASS
- `19/19` freshness semantics PASS
- `29/29` parser fixtures PASS
- `21/21` AGSI country fixtures PASS
- `10/10` AGSI coverage fixtures PASS
- `23/23` fiscal freshness/loading checks PASS
- `25/25` native export bridge checks PASS

### APK verification

The final installable APK passes:

- package/version/minSdk/targetSdk/launcher validation
- ZIP integrity/alignment validation
- embedded `index.html` byte-for-byte comparison against release source
- v2 signature verification
- v3 signature verification
- v1/JAR signature verification

The signing certificate SHA-256 is unchanged from the previously supplied v3.5.1.53 APK, so Android signature continuity for an in-place upgrade is preserved.

## Known limitation

No physical Android device/ADB target is available in this build environment, therefore actual provider reachability from the user's network/device cannot be proven here. Provider failures caused by remote CORS policy, network filtering, rate limits or provider outages can still occur; the hotfix prevents those failures from leaving the application stuck in an incomplete UI state and improves retry/fallback behavior.

## Next phase

After user verification of v3.5.1.54 on-device, continue with Phase 6 — auditable 0–100 transformations.
