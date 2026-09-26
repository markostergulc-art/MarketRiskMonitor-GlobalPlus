# Universal Volatility & Downside Risk Alarm — v3.6.1

## Purpose
Adds a simple warning badge next to applicable markets, stocks, ETFs, sectors and industry diagnostics. It is an additive diagnostic layer and does not change existing risk scores.

## States
- LOW RISK
- WATCH
- ELEVATED RISK
- HIGH RISK
- HIGH VOL · NO DOWNSIDE CONFIRMATION
- INSUFFICIENT DATA

## Method
Volatility pressure and downside pressure are calculated separately. High volatility alone cannot produce a HIGH RISK downside alarm. Inputs are existing daily data: RV20, RV60, EWMA persistence, 1M/3M momentum, 52-week drawdown, distance to 50/200DMA, relative strength and breadth where already available.

## Horizon
Qualitative 1–4 week warning layer. No calibrated decline probability or target price is displayed.

## Model protection
Global Risk, Early Warning, Capital Rotation, Bonds, country risk, company risk and ETF risk formulas remain unchanged.
