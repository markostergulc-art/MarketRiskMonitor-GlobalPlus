# Market Risk Monitor Global+ v3.5.1.71 — Capital Rotation Explainability Expansion

## ROLE
You are a senior Android/WebView engineer, JavaScript engineer, cross-asset analyst, equity-sector analyst and regression-focused QA engineer.

## BASELINE
Use the provided v3.5.1.70 / versionCode 103 source as authoritative baseline. Confirm before editing. Target v3.5.1.71 / versionCode 104.

## STRICT SCOPE
Modify only the Capital Rotation tab's explainability layer plus mandatory version/build metadata. Do not change GA2, Early Warning, Current Condition, Structural Vulnerability, Contagion, country scoring, market scoring, correlations, macro, fiscal, commodities, ETF, S&P 500, loading scheduler, navigation semantics, caching outside Capital Rotation, package identity or signing identity.

## OBJECTIVE A — CONCRETE ASSET EXPOSURE
For every Capital Rotation row, explicitly explain what concrete asset/exposure is being represented and which proxy is actually measured. Examples:
- Short Treasuries: U.S. Treasury 1–3Y, measured proxy SHY.
- Long Treasuries: U.S. Treasury 20+Y, measured proxy TLT.
- Investment Grade: USD investment-grade corporate bonds, measured proxy LQD.
- High Yield: USD high-yield corporate bonds, measured proxy HYG.
- Gold: physical-gold exposure, measured proxy GLD.
- Industrial metals: explicitly name copper as the measured proxy (CPER) and explain that aluminum/nickel/zinc are category context, not separately measured unless a real series exists.
- Agriculture: broad agriculture basket measured by DBA; representative commodities may be named as context but never presented as separately measured unless they are actually loaded.
- Equity groups: clearly name sectors represented by the ETF/proxy.

Never imply that a whole category is directly measured when only one ETF or proxy is used.

## OBJECTIVE B — TOP 10 EQUITY REPRESENTATIVES
Add a dedicated Capital Rotation subsection: "DIONICE · 10 NAJVEĆIH PREDSTAVNIKA" / "EQUITIES · 10 LARGEST REPRESENTATIVES".

Cover at least:
1. Defensive equities
2. Technology / Growth
3. Semiconductors
4. Industrials
5. Consumer Discretionary
6. Materials
7. Financials
8. Energy equities
9. Small Caps
10. Emerging Markets
11. United States
12. Europe
13. Japan
14. China

Each group is collapsed/lazy by default. Opening a group loads only that group's representative data.

## RANKING
Use current market capitalization when available from the existing Yahoo-compatible provider architecture. Prefer Yahoo fundamentals-timeseries `trailingMarketCap` on query1/query2 hosts because they are already allowed by the native proxy. Do not add a new network architecture.

Workflow:
- define a transparent candidate universe per group;
- retrieve market cap for candidates;
- discard invalid/non-finite market caps from dynamic ranking;
- sort descending by market cap;
- show first 10;
- if fewer than 10 valid market caps exist, show `x/10 available` and optionally fill remaining representative slots only if they are explicitly marked `market cap N/A / fallback candidate order`; never fabricate market cap.

For ETF-based groups where an issuer's current top holdings are the most faithful representation (notably Small Caps/IWM and Emerging Markets/EEM), preserve a documented candidate list based on recent issuer holdings, while still using live market data for trend/confirmation. Do not claim the embedded holding snapshot is live after its as-of date.

## COMPANY FIELDS
For each representative display:
- rank
- company name
- ticker
- sector/theme
- country
- market cap (compact format when available)
- 1M trend
- confirmation status versus the parent Capital Rotation projected direction

Possible confirmation statuses:
- CONFIRMS
- CONTRADICTS
- NEUTRAL
- N/A

## TOP-10 CONFIRMATION
For every group calculate:
`Top-10 confirmation: X / N`
where X is the number of available companies whose 1M trend direction agrees with the parent's projected rotation direction and N is the number with usable market history.

This is an explainability/market-confirmation metric only.
It MUST NOT change:
- GA2
- Early Warning
- parent Capital Rotation score
- stress classification
- asset ranking

## FAILURE ISOLATION
A market-cap or history failure for one company must not break the group or Capital Rotation tab. Missing fields remain N/A.
CN/PH reliability issues must remain isolated and must not be hidden by a proxy replacement.

## PERFORMANCE
- No bulk representative loading at app startup.
- No bulk representative loading during normal dashboard refresh.
- Load a representative group only when the user expands/requests it.
- Cache market-cap results and representative group results with a sensible TTL (e.g. 6–12h).
- Reuse existing company summary/history cache where possible.

## UX
Use current app design language. Keep the new section compact and collapsed by default.
Show a short explanation that Top-10 is contextual and not a buy/sell recommendation.
Use restrained existing status colors only.

## VERSION/SIGNING
Target versionName 3.5.1.71, versionCode 104.
Preserve applicationId/package/database identity.
Use the same existing release certificate.
Complete source ZIP must retain `signing/MarketRiskMonitor_GlobalPlus_release.p12` and `signing/keystore.properties` as requested by the project owner. Never print passwords into reports/logs.

## QA
At minimum verify:
- runtime JavaScript syntax;
- all pre-existing Capital Rotation scoring functions are byte-identical to v3.5.1.70 except render/explainability integration where necessary;
- GA2/Early Warning/country/market/macro/fiscal/commodities/correlations functions remain unchanged;
- no representative network requests occur before the Capital Rotation representative group is opened;
- market-cap failure yields N/A, not zero;
- fewer than 10 usable rows reports partial coverage;
- confirmation cannot modify parent score;
- source contains signing material;
- APK is V1/V2/V3 signed with the same release cert and is upgrade-compatible.

## DELIVERABLES
Return APK, complete source ZIP, prompt/specification, implementation methodology, QA report, exact v70→v71 diff and SHA-256 files.
