# RISK MODEL v3.5.1_09

## Inflation detector (0-100)
Weights: Core PCE 18%, Median/Sticky 14%, Wages/ULC 14%, Core CPI 12%, Pipeline 10%, Expectations 10%, Shelter 8%, Headline/Core breadth 8%, Germany context 6%.

Regimes: <25 disinflationary; 25-44 target-like/mixed; 45-59 inflation watch; 60-74 elevated inflation risk; >=75 persistent/broad inflation risk.

The detector is confirmation-based. One CPI print cannot independently force the composite to RED.

## Recession detector (0-100)
Weights: Sahm 15%, 10Y-3M curve 14%, initial claims 14%, payroll/hours 12%, unemployment 10%, SLOOS+credit 10%, leading index 10%, permits 8%, Germany context 7%.

Regimes: <25 low; 25-44 slowdown/mixed; 45-59 recession watch; 60-74 elevated recession risk; >=75 high/confirmed recession risk.

## Combined macro regime
- STAGFLATION RISK: inflation >=60 and recession >=60
- INFLATION-DOMINANT RISK
- RECESSION-DOMINANT RISK
- DISINFLATIONARY SLOWDOWN
- SOFT-LANDING / NORMAL
- MIXED MACRO RISK

Missing observations are removed from the denominator and available weights are renormalized. Coverage and confidence are shown separately.


## Commodity diagnostic model (v3.5.1_09)

Separate 0-100 components are derived for oil/supply-buffer stress, gold/safe-haven stress, silver/cyclical stress, industrial-demand deterioration and official-sector gold demand. The scenario engine distinguishes energy supply/inflation shock, global demand deterioration, safe-haven/reserve diversification and stagflation pressure. CFTC crowding is a small amplifier rather than a directional signal. This dedicated diagnostic score is **not** included in the GLOBAL composite pending historical backtest validation.
