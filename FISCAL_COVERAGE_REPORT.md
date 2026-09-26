# Fiscal Coverage Report — v3.5.1.43

## Configured universe

The fiscal layer is built from one union, not a parallel Markets universe:

- existing core Markets: **37**
- existing Extended Country Watch: **50**
- additional EU members not already present in those two lists: **Cyprus and Malta**
- total unique configured sovereign/country rows: **89**

## EU coverage

All **27/27 EU Member States are explicitly configured**:

Austria, Belgium, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain and Sweden.

For 2026, the euro-area subset in the implementation contains 21 members, including Bulgaria.

## Mandatory global majors

Explicit mandatory non-EU/global set:

United Kingdom, Norway, Switzerland, Türkiye, United States, China, Japan, India, Canada, Australia, South Korea, Brazil, Mexico, Saudi Arabia, South Africa, Indonesia, Singapore and Hong Kong.

All other existing Markets/Extended Country Watch countries remain eligible for the fiscal layer when provider data exist.

## Yield coverage targets

Explicit FRED/OECD 10Y yield targets: **28** sovereigns, loaded with maximum concurrency 4.

A country can still appear with debt/fiscal data when its 10Y series is unavailable, but it will not receive a colored score unless the minimum market-financing-condition gate is satisfied.

## Runtime tier counts

`FULL / PARTIAL / LIMITED` counts are deliberately **not hardcoded** into the release. They are computed on the device from the latest successful observations.

Build environment result:

- configured EU universe: **27/27**
- configured total fiscal universe: **89**
- live device provider run: **NOT EXECUTED** (no physical Android/GrapheneOS device or ADB target in this environment)
- therefore current FULL/PARTIAL/LIMITED counts and current rankings are **not fabricated in this report**.

## Failure semantics

- A missing Eurostat metric may fall back to IMF-GFS/World Bank where available and is marked `MIXED_FALLBACK`.
- A failed FRED series affects only that country/market metric.
- A failed provider never changes missing data to zero.
- Overview never triggers an independent fiscal network fan-out; it displays already-loaded Markets fiscal state.
