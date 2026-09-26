# Market Risk Monitor Global+ v3.5.1.70 — Capital Rotation

## Scope
Adds a standalone, lazy-loaded Capital Rotation diagnostic tab. Existing GLOBAL Risk GA2, Early Warning, fiscal, commodities, correlations, country and market calculations are not retuned.

## Interpretation
The module estimates rotation bias from the existing risk regime plus cross-asset market confirmation. It does not claim measured investor fund flows and does not issue BUY/SELL recommendations.

## Score
- 30% Early Warning compatibility
- 20% relative price trend
- 15% volatility behavior
- 15% cross-asset confirmation
- 10% correlation regime
- 10% stress-type compatibility

Projected rotation and market confirmation are deliberately separate.

## Gating
The overall projection is N/A unless the existing mandatory Leading Warning layer is eligible with at least 70% layer coverage. Individual market observations may still be shown. Missing data are not zero-filled.

## Data loading
Cross-asset confirmation is cache-first and lazy. It starts only when the Rotation tab is opened, uses the existing Yahoo transport, has bounded concurrency, and cannot block startup.

## China / Philippines
This feature does not replace unavailable CSI 300 or PSEi data with ETFs. China regional output is eligible only when the real CN market series has at least 5 observations. CN/PH failures do not abort the module.
