# Fiscal Freshness Fix — v3.5.1.44

## Root cause
v3.5.1.43 could take the newest available annual World Bank / IMF-GFS observation and treat it as a current fiscal input without a strict age gate. For some non-EU markets the newest available observation can be several years old. That allowed `latest available` to be confused with `current`, and countries with different reference periods could enter the same current ranking.

## v44 correction
Each observation now carries or derives:
- provider
- observation/reference period
- frequency
- value type (`ACTUAL`, `ESTIMATE`, `FORECAST`)
- freshness (`CURRENT`, `CURRENT_ESTIMATE`, `CURRENT_FORECAST`, `STALE`, `UNAVAILABLE`)

### EU27
Eurostat quarterly ESA/general-government observations remain authoritative. Quarterly freshness is release-cadence aware rather than based on an arbitrary daily age threshold. A valid Q1 observation remains current until the next-quarter release window plus grace period has passed.

### Non-EU / global
The preferred harmonized current reference is IMF WEO general-government data:
- `GGXWDG_NGDP` — general government gross debt / GDP
- `GGXCNL_NGDP` — general government net lending/borrowing / GDP

The implementation vintage label is `WEO-2026-04`. Current-year values are labelled `ESTIMATE`; future observations are labelled `FORECAST` if present.

World Bank / IMF-GFS central-government series remain available for historical/display context. They are not promoted into current debt/balance score inputs when the scope is not comparable, and stale values are explicitly shown as stale rather than silently treated as current.

## Current-reference precedence
1. Fresh EU Eurostat actual for EU members.
2. Current-year IMF WEO general-government estimate/forecast.
3. Historical fallback for display/context only when the current comparable reference is unavailable.
4. If minimum current score coverage is not met: `LIMITED DATA`.

## Score/ranking eligibility
The v43 score formula and weights are unchanged. v44 changes only input eligibility. Stale observations do not enter the current score. Current sovereign rankings require a finite score, no stale score-driving metrics and acceptable cross-country comparability.

## Cache behavior
Fiscal cache namespace is bumped to `mrmFiscalV44`. Existing unrelated caches are not invalidated. Valid fiscal rows remain visible while revalidation runs. Failed refreshes can reuse cached fiscal rows only while the bounded slow-data cache window is still valid.

## Runtime limitation
The IMF DataMapper request is implemented as a direct CORS request so the stable native proxy/DEX does not need modification. Physical Android/WebView CORS behavior was not executed in this environment. If the IMF request is unavailable at runtime, the app fails closed to `LIMITED DATA` rather than reintroducing stale debt into the current score.


## Forecast retrieval
The IMF query requests the current year plus the next year so a provider-supplied next-year forecast can be retained and explicitly labelled `FORECAST`; it is never presented as an actual observation.
