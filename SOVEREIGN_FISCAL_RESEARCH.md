# Sovereign Fiscal Research — Market Risk Monitor Global+ v3.5.1.43

Date: 2026-09-14

## Purpose

This document verifies the claims that motivated the Sovereign Fiscal Stress feature. Production scoring does **not** ingest political/journalistic rhetoric. Only measurable fiscal/market variables are eligible.

## Original claims

| Claim | Evidence / official value | Verdict |
|---|---|---|
| Italy debt/GDP ≈ 139% in 2026 Q1 | Eurostat: **138.9%** | **CONFIRMED / rounded** |
| France debt/GDP ≈ 118% in 2026 Q1 | Eurostat: **117.6%** | **CONFIRMED / rounded** |
| Belgium debt/GDP ≈ 109% in 2026 Q1 | Eurostat: **109.1%** | **CONFIRMED / rounded** |
| Spain debt/GDP ≈ 100% in 2026 Q1 | Eurostat: **101.6%** | **MOSTLY TRUE, but understated** |
| Italy pays ≈3.9% of GDP in interest | IMF 2026 Article IV: interest expense was **3.9% of GDP in 2025** | **CONFIRMED for 2025** |
| France debt service has overtaken defence | Current reporting puts 2026 debt service around **€65bn** and describes it as the single largest budget expenditure; the exact comparison depends on budget scope/accounting | **MOSTLY TRUE; compare like-for-like budget concepts** |
| Old cheap debt is being refinanced at higher rates | France's Cour des comptes explicitly attributes rising interest expense to gradual refinancing at higher market rates; IMF notes the maturity/cost mechanism for Italy | **CONFIRMED mechanism** |
| “Debt is unmanageable” | This is not a statistical variable and is not established merely by the debt ratios above | **OPINION / UNSUPPORTED as a blanket fact** |
| “Real wages are collapsing” | OECD reports annual real-wage growth was positive in virtually all OECD countries in 2026 Q1, although recovery is incomplete in some countries | **MISLEADING / OVERGENERALIZED** |
| “Pensions are collapsing” | No country, pension concept, period or real/nominal measure was defined in the claim | **UNSUPPORTED as stated** |
| “No meaningful reforms / same political establishment” | Political/value judgement, not a fiscal time series | **OPINION; excluded from model** |

## Important fiscal direction context

Eurostat 2026 Q1 also shows that the debt trend is not uniform. Versus 2025 Q1, France rose **+4.0 pp**, Belgium **+3.1 pp**, Italy **+1.7 pp**, while Spain fell **-1.7 pp**. This is why v3.5.1.43 separates **debt level** from **debt deterioration**.

## Sources

1. Eurostat, *Government debt at 88.9% of GDP in euro area*, 21 July 2026: https://ec.europa.eu/eurostat/web/products-euro-indicators/w/2-21072026-ap
2. IMF, *Italy: 2026 Article IV Consultation*, Staff Report 26/193: https://www.elibrary.imf.org/view/journals/002/2026/193/article-A001-en.xml
3. IMF press release, Italy 2026 Article IV: https://www.imf.org/en/news/articles/2026/07/24/pr26256-italy-imf-executive-board-concludes-2026-article-iv-consultation
4. France, Direction du Budget, LFI 2026: https://www.budget.gouv.fr/reperes/loi_de_finances/articles/loi-finances-2026
5. Cour des comptes, *The state of French public finances at the start of 2026*: https://www.ccomptes.fr/sites/default/files/2026-02/20260219-summary-The-state-of-french-public-finances-at-the-start-of-2026.pdf
6. OECD Employment Outlook 2026: https://www.oecd.org/en/publications/oecd-employment-outlook-2026_7e710f54-en/full-report/component-5.html
7. Reuters, France growth/deficit/debt-service update, 11 Sep 2026: https://www.reuters.com/world/france-trims-growth-forecast-says-finance-minister-2026-09-11/

## Research conclusion

The factual core of the original post — high debt ratios and rising interest/refinancing pressure in several large euro-area sovereigns — is real. The leap from those facts to “debt is unmanageable” or broad claims about collapsing wages/pensions is not supported as a direct statistical conclusion. The app therefore monitors the measurable mechanism instead of encoding the rhetoric.
