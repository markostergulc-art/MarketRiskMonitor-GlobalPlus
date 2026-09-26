# Norway Root-Cause Report — v3.5.1.42

## Verdict

**Previous Norway ORANGE: SOFTWARE / DATA-SOURCE BUG.**

The v3.5.1.41 source configured Norway as:

- Market: Oslo All Share
- Provider path: Yahoo Finance
- Symbol: `^OSEAX`
- FX input: `NOK=X`

Yahoo Finance symbol lookup returns no result for `^OSEAX`, while Yahoo lists the Oslo Børs All-share Index as `OSEAX.OL`. v3.5.1.42 changes only that market symbol to `OSEAX.OL`.

## Why an orange score was possible

The existing `buildCountries()` catches a failed headline-market request and keeps the market series as `null`. Market and technical subscores then become unavailable, but other independent inputs such as World Bank macro data and `NOK=X` FX/liquidity can still be finite.

The existing `weightedScore()` intentionally renormalizes over finite components only. Therefore a finite Norway country score could still be produced even though the headline Norway market series was missing. If that partial score landed in 45–59, the existing `riskBand()` correctly labelled it ORANGE.

The colour mapping was therefore not the root cause. The source symbol was.

## Diagnostic trace

| Component | v3.5.1.41 state | Consequence | v3.5.1.42 |
|---|---|---|---|
| Headline symbol | `^OSEAX` | Yahoo lookup fails / no valid headline series | `OSEAX.OL` |
| Headline history | unavailable after failed request | market metrics unavailable | live Yahoo history on refresh |
| Market subscore | null when headline metrics absent | excluded from weighted denominator | computed when valid history loads |
| Technical subscore | null when headline metrics absent | excluded from weighted denominator | computed when valid history loads |
| Macro | may remain available | still contributes | unchanged |
| FX/liquidity | `NOK=X`, may remain available | still contributes | unchanged |
| ORANGE threshold | 45–59 | existing semantics | unchanged |
| Missing-data UI | could coexist with a coloured partial country score | misleading visual interpretation | neutral LIMITED DATA when headline metrics are missing |

## Public cross-check

- Yahoo Finance symbol lookup: `^OSEAX` returns no matching symbol.
- Yahoo Finance lists `OSEAX.OL` as **Oslo Børs All-share Index_GI**.
- Public Oslo All Share observations in September 2026 were around 2,520 and close to the published 52-week high of 2,548.01. This is useful context, but it is **not** used to fabricate a post-fix app score.

## Final status policy

v3.5.1.42 does **not** hardcode Norway to GREEN or any other colour.

After installation/refesh, the app recalculates Norway from the corrected `OSEAX.OL` history plus the existing unchanged macro/FX/systemic methodology. Static build QA cannot truthfully state the exact live post-fix colour without a live provider refresh.

Internal `window.MRMV42Diagnostics` now exposes Norway ticker, provider, observation, current value, valid history count, freshness, market metrics, component scores, internals eligibility, final score and band for reproducible QA without cluttering the normal UI.

## Sources checked

- Yahoo Finance symbol lookup for `^OSEAX`: https://de.finance.yahoo.com/lookup/index/?s=%5EOSEAX
- Yahoo Finance symbol lookup showing `OSEAX.OL`: https://nz.finance.yahoo.com/lookup/?s=OSL
- Investing.com Oslo All Share historical data: https://www.investing.com/indices/oslo-all-share-historical-data
