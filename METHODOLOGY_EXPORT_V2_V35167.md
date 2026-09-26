# Methodology Export V2 — v3.5.1.67

Runtime schema: `METHODOLOGY_EXPORT_V2`  
Methodology version: `METHOD-V2-1`

The export is a snapshot of already-loaded application state and performs no network acquisition. For each model it records purpose, raw indicators, providers, observation dates, frequency, freshness semantics, transformations, score direction, thresholds/windows, weights, missing-data handling, eligibility gates, coverage, confidence, aggregation and source functions.

Additional mandatory sections are:

- full GLOBAL Risk GA2 dependency tree;
- Early Warning signal timing classification (`leading`, `confirmation`, `current stress`, `structural`) plus the original internal class;
- correlation log-return formula, descriptive vs systemic alignment, session/timezone rule and calculation windows.

The standalone export is Markdown; Current Data also contains the same methodology as JSON and Markdown. Missing values remain N/A/null and never become zero risk.
