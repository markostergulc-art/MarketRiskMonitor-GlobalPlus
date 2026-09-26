# Capital Rotation UI Consolidation — v3.6.7 / BUILD117

## Objective
Remove repeated sector presentations from Capital Rotation. Each of the 11 U.S. sectors is now rendered exactly once and acts as the single entry point for all sector-specific detail.

## Previous UI
The same sector could appear in multiple places:
1. Daily Sector Ranking
2. Strongest Daily Signals
3. Sector Details
4. Legacy representative-equities groups

This caused repeated labels such as Technology / Financials / Energy and split the evidence across several sections.

## BUILD117 UI
The Capital Rotation screen now contains one consolidated sector list. Each sector summary shows:
- sector + ETF symbol
- 1D return
- excess return vs SPY
- Daily Rotation Score
- daily rank
- status / confidence

Tapping a sector expands it in place and shows:
- sector 1D and SPY 1D
- 1D excess return
- Daily Score
- rank and rank change
- 5D context
- previous score
- acceleration / reversal / persistence context
- observation date and confidence
- BUILD116 contributor attribution
- top positive/negative stock contributors
- constituent breadth and weighted breadth
- ETF-weight contribution
- concentration / mega-cap dominance
- commodity / macro driver confirmation

## Removed duplicate presentations
The BUILD117 renderer no longer renders:
- Strongest Daily Signals sector cards
- a separate Sector Details matrix
- the legacy representative-equities group block inside Capital Rotation

Regional Daily Rotation and Methodology remain separate because they are different analytical domains, not duplicate U.S. sector presentations.

## Scope / integrity
This is a presentation-only change. No modification was made to:
- BUILD115 Daily Rotation score formula
- 1D excess-return methodology
- sector ranking / reversal / acceleration calculations
- BUILD116 contributor attribution formulas
- holdings source or holdings parser
- cache / freshness logic
- commodity / macro confirmation mapping
- Global Risk, Early Warning, Stocks, T212 Portfolio, ETFs, Bonds, Commodities, Macro, Correlations, Volatility or Dividends

## Files changed from BUILD116
Production/runtime:
- `app/src/main/assets/capital_rotation_ui_v367.js` — new consolidated presentation layer
- `app/src/main/assets/index.html` — version + new script include
- `app/src/main/assets/excel_export_v362.js` — release metadata only
- `app/build.gradle` — 3.6.7 / 117
- `app.js` — release metadata/comment only

Build/QA:
- `tools/build_manual_apk_v367.py`
- `build_manual_release_v367.sh`
- `test_capital_rotation_consolidated_v367.js`
