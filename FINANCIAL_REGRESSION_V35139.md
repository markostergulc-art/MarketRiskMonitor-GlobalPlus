# Financial Regression — Market Risk Monitor Global+ v3.5.1.39

Baseline: v3.5.1.38.

## Result

**PASS — all 12 protected standalone financial/risk function bodies present in the baseline are byte-identical.**

- globalRiskModel
- globalContagion
- corrMatrix
- correlationRegimeFromStats
- correlationRegimeDiagnostic
- buildMacroCycle
- sp500HiddenWeakness
- companyCoreRiskParts
- companyContextRisk
- marketMetrics
- trendRisk
- renderEarly

The baseline does not contain a separate standalone `correlationRegime()` function; the two actual correlation-regime functions above are unchanged.

AGSI aggregate provider/methodology functions remain byte-identical. Only the facility-list parser and the facility-list fetch orchestration changed.

No facility result is injected into GLOBAL Risk or any protected financial calculation.
