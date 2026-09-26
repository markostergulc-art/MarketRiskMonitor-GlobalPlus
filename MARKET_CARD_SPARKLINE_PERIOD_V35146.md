# Markets Card Sparkline Period Fix — v3.5.1.46

## Root cause

v3.5.1.45 added period labels to the shared canvas chart renderer. The compact country cards on **Markets** do not use that renderer: they use the separate SVG helper `sparklineSvg()`. Therefore France/CAC 40, Germany/DAX, Canada/TSX Composite and the other core market cards could still show a sparkline with no visible time window.

## Fix

The Markets-card renderer now reads the same series already passed to `sparklineSvg()` and derives presentation-only period text from the observations actually displayed.

- `sparklineSvg()` still shows the last 65 series items and is byte-identical to v3.5.1.45.
- `marketCardSparkPeriodV46()` uses the same `slice(-65)` boundary.
- Only finite-value points are considered.
- Invalid/missing dates are skipped.
- The first and last valid dates inside the displayed window define the visible interval.
- The duration prefix is approximate and explicitly marked with `≈`; the exact date interval is always the authoritative part of the label.
- If fewer than two valid timestamps exist, the application does not invent a period.

Example:

`≈3M · Jun 15 – Sep 14, 2026`

Croatian UI uses the existing locale/date infrastructure, e.g. `≈3 mj` plus localized month names.

## Placement

The label is a small muted line directly above the Markets-card sparkline. A compact CSS rule reduces the normal sparkline top margin so the card does not grow unnecessarily.

## Data integrity

No series points, provider requests, market calculations, sparkline calculations or score calculations were changed. No new network request is introduced.
