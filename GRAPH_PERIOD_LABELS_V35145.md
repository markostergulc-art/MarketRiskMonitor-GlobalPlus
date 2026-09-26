# Graph Period Labels — Market Risk Monitor Global+ v3.5.1.45

## Scope
Presentation-only change. No historical arrays, sampling, aggregation, provider, request, range-selection or financial calculation was changed.

## Implementation
The shared canvas renderer now derives the displayed period from the first and last valid observation actually present in the series. It also infers a useful observation frequency from the median spacing of valid dates.

The compact label is rendered directly above the chart, for example:

- `1Y · Daily · 14 Sep 2025 – 14 Sep 2026`
- `5Y · Monthly · Sep 2021 – Sep 2026`
- `Period · Quarterly · Q/dated observation range`

For selected range controls, the current range button is included. If the requested window is materially longer than the data actually available, the label explicitly states `data available` rather than pretending that the full requested range exists.

## Covered chart families
The shared renderer covers:

- market headline price history;
- market relative-participation charts;
- U.S. options-stress chart;
- stock price and relative-strength charts;
- ETF price charts;
- industry charts;
- correlation-stress history;
- commodity relative trend;
- EU gas-storage fill history;
- oil / natural-gas price charts;
- gold / silver charts.

The custom Global Risk history canvas is handled separately with the same period-label helper.

## Dynamic ranges
Existing range controls remain unchanged. The label follows the active selection for market, stock, ETF, energy and metal charts. EU gas keeps its existing 5Y window and the commodity relative-trend chart keeps its existing 1Y window.

## X axis
Only date formatting was improved. Long windows use compact month/year labels; shorter windows retain day/month/year context. Underlying x-axis data and chart geometry are unchanged.

## Localization
Period/frequency descriptions use the existing Croatian/English language state. No new language subsystem was introduced.
