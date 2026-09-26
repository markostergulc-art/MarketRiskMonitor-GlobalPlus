# Overview Redesign Summary — v3.5.1.42

## Objective

Overview is now an executive early-warning summary rather than a second copy of the Markets page.

## Removed

- Removed the duplicated full country/market card list from Overview.
- Detailed country cards remain in **Markets**, which is the authoritative detailed market view.

## Overview cards

1. **What needs attention** — top three confirmed global risk drivers already present in the model.
2. **Global Markets** — compact Healthy / Watch / Stress / Limited Data counts and a Details link.
3. **Global Market Health** — aggregate score, eligible/configured markets, average coverage, stressed-market count and hidden-divergence count.
4. **Early Warning** — up to three active existing warning signals.
5. **Macro Regime** — compact existing inflation/recession/regime context.
6. **Correlation Regime** — existing 20D correlation, acceleration and high-correlation breadth where available.
7. **Commodities** — existing cross-asset commodity state, plus already-loaded EU Gas fill and already-loaded Germany storage coverage where present.
8. **S&P 500 / Equity Internals** — existing US internals and already-loaded S&P hidden weakness context where available.
9. **Global Risk Model** — compact existing component rows.

## Single-source-of-truth rule

No competing Overview risk methodologies were created. Overview reads the existing `appState` / module state and presentation data.

`renderOverview()` contains no direct `fetchWithTimeout`, `yahoo(...)`, or `ensure...` calls. It therefore does not introduce an independent network fan-out.

## Loading and N/A UX

- Cards render progressively from the state already available.
- Insufficient Global Market Health is compact and reports valid/configured markets plus the minimum required, rather than rendering a large mostly-empty N/A panel.
- Missing/limited market data is neutral gray and is not treated as warning orange.

## Mobile design

The new `.overview-grid`, `.overview-card`, compact rows/badges and responsive rules are designed for the existing narrow Android WebView layout first. The design avoids horizontal market-card duplication and reduces vertical waste.

## Navigation

Overview detail buttons reuse the existing `navTo(...)` routing. Android Back/navigation architecture was not replaced.
