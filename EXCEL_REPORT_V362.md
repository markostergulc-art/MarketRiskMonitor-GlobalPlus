# Market Risk Monitor Global+ v3.6.2 — Excel Report

## UI
A new **DOWNLOAD EXCEL REPORT** action is available under **Options → Data & Methodology**.

## Output
The export creates an `.xlsx` file in:

`Downloads/MarketRiskMonitor/`

Filename format:

`MarketRiskMonitor_GlobalPlus_Full_Report_v3.6.2_<timestamp>.xlsx`

## Workbook structure
The report follows the supplied reference workbook and contains 21 worksheets:

1. 00 REPORT COVER
2. 01 EXEC DASHBOARD
3. 02 GLOBAL RISK
4. 03 EARLY WARNING
5. 04 MARKETS
6. 05 STOCKS
7. 06 STOCK DETAIL
8. 07 ETF INTELLIGENCE
9. 08 DIVIDENDS
10. 09 SECTORS INDUSTRIES
11. 10 VOLATILITY DOWNSIDE
12. 11 MACRO
13. 12 FISCAL SOVEREIGN
14. 13 BONDS
15. 14 COMMODITIES
16. 15 CAPITAL ROTATION
17. 16 CORRELATIONS
18. 17 DATA QUALITY
19. 18 METHODOLOGY
20. 19 SOURCES
21. 20 REPORT METADATA

## Data integrity rules
- Export uses the application's **currently loaded / cached runtime state**.
- The export action does **not** start additional market-data network requests.
- Missing or not-yet-loaded values remain blank / N/A instead of being replaced by fabricated zeros.
- Existing market, macro, risk, correlation and alert calculations are not modified by the export module.
- Credentials and secrets are not exported.
- Source metadata is limited to provider/methodology information required for report traceability.

## Visual design
The workbook follows the supplied business-report reference: navy/blue/gray structure, readable table headers, alternating row treatment, frozen headers, filters, bounded column widths and muted standard status colors for positive/warning/negative/unknown states.
