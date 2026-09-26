# ARCHITECTURE v3.5.1_09

Provider layer -> normalized time series -> indicator functions -> inflation/recession composites -> macro-cycle regime -> global risk model -> explainability/UI.

Company intelligence is deliberately separated into two data depths:

1. **Compact background summary** — after the dashboard is rendered, 1-year daily series for key country companies and global industry leaders are fetched with low concurrency. Only compact metrics are persisted: price, 1M/3M/YTD/1Y momentum, 50/200DMA distance, 52-week drawdown, RV20 and company-risk components.
2. **On-demand stock detail** — a 5-year daily series is fetched only after a user taps a stock. The detailed series stays memory-only in a bounded cache and is never embedded in the main risk snapshot/localStorage.

Country Company Breadth and Industry Company Breadth are derived from compact summaries. Relative strength is evaluated against the local headline index when available and against the mapped global industry peer group.

Market visibility is determined centrally by `activeMarketConfig()`. Croatia (HR) and Bosnia and Herzegovina (BA) are available only when `currentLang === 'hr'`. Market cards, fetch loops, event history and correlation labels use the active market set.


## Lazy Commodity Risk Intelligence

Commodity detail is a third deferred data depth. The core dashboard keeps the existing lightweight cross-asset commodity component. The dedicated COMMOD page is fetched only after navigation to that page and loads official EIA/DOE petroleum reserve/supply-buffer data, World Gold Council official-sector gold demand and 2-year market histories for oil, gold, silver, copper and gas.

The dedicated commodity score is diagnostic-only in v3.5.1_09 and is intentionally not fed back into GLOBAL Risk. This prevents lazy-navigation side effects and avoids double counting the existing cross-asset commodity component before historical validation.
