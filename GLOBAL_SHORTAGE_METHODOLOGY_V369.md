# Global Shortage methodology — GS1.0

The model asks whether **physical availability** is constrained. Price is context only and never creates a shortage status by itself.

## Status bands
For an item with valid physical evidence: 0–19 NORMAL, 20–39 WATCH, 40–59 TIGHT, 60–79 SHORTAGE, 80–100 CRITICAL. If trustworthy physical evidence is insufficient, status is N/A rather than zero.

## Missing data
Evidence with a missing value is removed from the denominator. Remaining evidence weights are renormalized. This prevents an unavailable source from silently lowering risk.

## Implemented scoring
### Diesel / gasoil and jet fuel
Primary evidence is U.S. EIA physical inventory versus the same period a year earlier (75% weight). A one-week inventory change is secondary (25%) because a single weekly observation is noisy. A 25% YoY inventory deficit maps linearly to 100 risk; a 10% one-week draw maps to 100 risk. Positive inventory changes add no shortage risk. This is a transparent early-warning transform, not a claim that those thresholds define an official shortage.

### U.S. natural gas storage
The primary signal is storage deviation from the EIA five-year seasonal average (65%); year-on-year storage deviation is secondary (35%). A 20% deficit to the five-year seasonal average maps to 100 risk; a 25% YoY deficit maps to 100. Raw weekly injection/withdrawal is shown as context but is not scored because it is seasonal.

### EU natural gas storage
When a GIE AGSI+ API key is configured, the module loads multi-year history after the first explicit open. The score combines current fullness relative to the five-year seasonal average (60%) and the seasonal percentile (40%). No EU gas shortage status is fabricated when historical seasonal context is insufficient.

## Confidence
Confidence reflects directness, source quality, historical context and geographic coverage. Current implemented U.S. EIA single-provider items are normally MEDIUM. EU AGSI can reach HIGH when at least three comparable historical annual observations are present. Unsupported/N/A items are LOW.

## Global headline coverage gate
A weighted available-data score is calculated over valid items only, but the headline Global Shortage status is withheld as N/A when fewer than 25% of monitored chains have valid physical scores. This prevents a small energy subset from being presented as a global shortage verdict.

## Trend
Trend uses both short-horizon direction and broader comparable context where available. When there is not enough context, trend is N/A rather than inferred from a single noisy observation.
