# Background Resident Refresh — v3.6.8 / BUILD118

## Scope
This release changes only app lifetime/background refresh behavior and release metadata.
No financial model, Capital Rotation calculation, T212 analysis, market scoring, commodity logic, bond logic, correlation logic, or Excel calculation was changed.

## Behavior
- Pressing Android Back at the app root no longer finishes the Activity. The task is moved to the background.
- The loaded WebView is kept resident while Android allows the process to remain in memory.
- `Settings -> Refresh cadence` is the single cadence control for both foreground and Android background refresh.
- `Manual only` disables scheduled refresh.
- 15/30/60/120/240 minute choices enable background refresh automatically.
- Android WorkManager remains the durable background transport in the standard Gradle source. It is network-connected and battery/Doze aware; Android may flex execution time.
- The background worker refreshes up to 48 previously used public data endpoints and stores fresh raw responses in the existing native cache.
- The worker records last-run/attempt/success metadata in `mrm_background` preferences.
- State Street and Bundesbank hosts are included in the background allowlist so Capital Rotation holdings and related official data can be refreshed when previously used.
- On resume, the app reasserts the background schedule and resumes WebView timers.

## Android limitation
No Android application can guarantee that its process will never be killed. A user force-stop, OS memory reclamation, or device policy can terminate the resident process. BUILD118 avoids voluntary Activity finish on Back; the standard-source WorkManager schedule is designed to continue/restart background work subject to Android battery and Doze policy.
