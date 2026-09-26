# Market Risk Monitor Global+ — Volatility Forecast Research

**Research date:** 16 September 2026  
**Application baseline reviewed:** v3.5.1.75 / versionCode 108  
**Scope:** Research and model design only. No application code, APK, scoring engine, or existing module was modified.

---

## 1. Executive summary

### Recommendation

The strongest practical architecture for a future **VOLATILITY FORECAST / PROGNOZA VOLATILNOSTI** module is **not** a large machine-learning model and not a standalone GARCH forecast.

The recommended first production architecture is:

1. **Forecast target:** future annualized realized variance/volatility over **5, 20 and 60 trading days**.
2. **Core statistical model:** a **log-HAR volatility model with an asymmetric/leverage term** (`HAR-L`).
3. **Persistence benchmark:** **EWMA** and current realized-volatility persistence.
4. **Challenger benchmark:** **GARCH(1,1)** and, for equities, **GJR-GARCH**.
5. **Forward-looking options input, where available and legally usable:** horizon-matched implied volatility:
   - VIX9D for the short horizon,
   - VIX for the one-month horizon,
   - VIX3M for the three-month horizon.
6. **Combination:** rolling, non-negative data-driven combination of model forecasts based on prior out-of-sample loss. **Do not hardcode arbitrary model weights.**
7. **Regimes:** instrument-specific historical percentiles, rather than one absolute volatility scale for every market.
8. **Forecast intervals:** empirical rolling forecast-error quantiles, with 80% interval as the primary mobile display.
9. **Stress probability:** show a numerical probability only after calibration has passed Brier-score and reliability tests. Until then, use a qualitative stress-risk state.
10. **Track record:** the module should display its own rolling forecast quality against simple baselines. A volatility forecast without an auditable track record should not be treated as high confidence.

### Main conclusion

The simplest architecture likely to materially improve the existing application is:

> **HAR-L + EWMA persistence + horizon-matched implied volatility, with strict walk-forward validation and dynamic combination weights.**

For markets without robust implied-volatility data:

> **HAR-L + EWMA**, calibrated separately by instrument/asset class.

GARCH remains important as a benchmark. Markov-switching HAR is a promising **phase-2 challenger**, especially at short horizons. XGBoost, neural networks, LSTMs and Transformers should **not** enter the first production version unless they demonstrate stable out-of-sample superiority over the simpler benchmarks.

### Important limitation of this research run

A genuine application-specific numerical walk-forward benchmark could not be executed in this environment because bulk market-series downloads were not available to the local analysis runtime. Therefore this report **does not invent out-of-sample performance numbers or model weights**. The empirical conclusions below are based on published research, provider methodology, current public data-access information, and inspection of the existing application architecture. The implementation phase should begin with a reproducible backtest before final production weights are frozen.

---

## 2. Current application constraints relevant to volatility forecasting

The existing application already contains useful building blocks:

- stock/market `RV20` and `RV60` measures;
- VIX-related market series;
- Cboe history support and Yahoo market fallback;
- market breadth;
- cross-asset correlation/regime analysis;
- credit and bond stress modules;
- Early Warning, Contagion and Global Risk layers;
- commodities and cross-asset volatility metrics.

The current Yahoo-series parser stores **daily close observations only** even though the upstream chart response can contain OHLC fields. Therefore the current runtime can immediately support close-to-close volatility forecasting, but a future implementation would need to preserve `open/high/low/close` if OHLC estimators are to be evaluated properly.

This is important because the volatility module should not silently label a daily-close estimate as the same object as high-frequency realized variance.

---

## 3. Forecast target

### 3.1 What should be forecast

The primary target should be **future realized variance**, converted to annualized realized volatility for user display.

For horizon `h` trading days, a close-to-close target can be defined as:

```text
r_t = ln(P_t / P_{t-1})

FutureVariance(t,h) = (252 / h) × Σ[r²_(t+1 ... t+h)]

FutureVolatility(t,h) = 100 × sqrt(FutureVariance(t,h))
```

This keeps the statistical model on variance/log-variance, while the UI shows an intuitive annualized volatility percentage.

### 3.2 Close-to-close versus OHLC estimators

**Immediate production-compatible target:** close-to-close future realized volatility.

Advantages:

- already supported by the application’s stored market series;
- consistent across a broad international universe;
- low computational cost;
- simple to audit and backtest.

Weakness:

- daily squared returns are a noisy proxy for latent daily variance;
- intraday path information is discarded.

### 3.3 Yang-Zhang and other OHLC estimators

Yang-Zhang uses open, high, low and close prices, is designed to be drift-independent and to handle opening jumps. This makes it a strong candidate if the future data layer retains daily OHLC.

However, the implementation should **not assume** that Yang-Zhang will automatically improve every forecast. Comparative research on range estimators does not establish one universally dominant estimator across assets and regimes.

Recommended process:

1. keep close-to-close as the baseline target;
2. preserve OHLC in a future data-layer extension;
3. backtest close-to-close, Parkinson, Garman-Klass, Rogers-Satchell and Yang-Zhang targets;
4. select the estimator only if walk-forward QLIKE/MAE and interval coverage improve materially.

### Decision

**Close-to-close:** GO for v1.  
**Yang-Zhang:** CONDITIONAL GO after OHLC support + backtest.  
**Intraday realized variance:** NO-GO for v1 because the application is not an intraday terminal and robust intraday data would add cost/licensing complexity.

---

## 4. Recommended forecast horizons

Recommended user-facing horizons:

| UI horizon | Trading-day target | Purpose |
|---|---:|---|
| **1 week** | 5D | short-horizon shock persistence / event risk |
| **1 month** | 20D/21D | core tactical volatility regime |
| **3 months** | 60D/63D | medium-horizon persistence/regime |

### Why not headline 1D

A one-day volatility target is statistically noisy when the application relies mainly on daily observations. It can remain an internal diagnostic but should not be the main user-facing forecast.

### Why these three horizons

They are sufficiently differentiated to answer three distinct questions:

- Is current stress likely to persist through the next week?
- What volatility should be expected over the next month?
- Is the market entering a persistent higher/lower volatility regime?

---

## 5. Model comparison

### 5.1 Rolling historical volatility

**Role:** naive baseline.

Pros:
- trivial;
- transparent;
- useful reference.

Cons:
- slow to adapt after shocks;
- no explicit mean reversion;
- poor standalone forward-looking architecture.

**Decision:** KEEP as benchmark only.

---

### 5.2 EWMA / RiskMetrics-style model

Conceptually:

```text
σ²_t = λ σ²_(t-1) + (1-λ) r²_(t-1)
```

Pros:
- extremely lightweight;
- captures volatility clustering;
- fast shock response;
- easy to run locally on Android/WebView;
- useful fallback when model history is short.

Cons:
- fixed decay is restrictive;
- no explicit long-memory components;
- no leverage/asymmetry unless extended.

**Decision:** GO as mandatory baseline and fallback, not sole production model.

---

### 5.3 GARCH(1,1)

Pros:
- canonical conditional-volatility model;
- captures clustering and mean reversion;
- efficient parameterization;
- strong historical benchmark.

Cons:
- fitting is nonlinear;
- convergence can be fragile for some assets/windows;
- symmetric standard GARCH does not capture equity leverage effects;
- published comparisons show that greater model complexity does not automatically improve forecasts.

Hansen and Lunde’s large model comparison found no evidence that more sophisticated ARCH variants beat GARCH(1,1) for the exchange-rate case they studied, while equity data benefited from models allowing leverage effects.

**Decision:** KEEP as challenger/benchmark. Do not make it the only production forecast.

---

### 5.4 GJR-GARCH

Adds asymmetric response to negative returns.

For equities, this directly addresses the empirical tendency for negative shocks to increase future volatility more than equivalent positive shocks.

Pros:
- modest complexity above GARCH;
- economically interpretable leverage term;
- more suitable than symmetric GARCH for equity indices.

Cons:
- still nonlinear to estimate;
- can be less stable on short samples;
- likely redundant if HAR-L already captures asymmetry unless it adds OOS information.

**Decision:** KEEP as equity challenger; include in the ensemble only if it improves rolling OOS QLIKE.

---

### 5.5 EGARCH

Pros:
- naturally models log variance;
- supports asymmetric effects;
- variance positivity is automatic.

Cons:
- more parameter/estimation complexity;
- less transparent for mobile explainability;
- likely redundant in a first release containing HAR-L + GJR-GARCH challenger.

**Decision:** NO-GO for v1. Reconsider only if it clearly beats GJR/HAR-L.

---

### 5.6 HAR-RV

Corsi’s HAR-RV model represents volatility at heterogeneous daily, weekly and monthly horizons. Its key advantage is a parsimonious structure that approximates long-memory behavior without a large state vector.

Canonical conceptual structure:

```text
RV_(t+h) = β0
         + βD × RV_daily
         + βW × RV_weekly
         + βM × RV_monthly
         + ε
```

For the application, the recommended production form is a **log-HAR with leverage term**:

```text
log(V_t+h) = β0
           + βD × log(V_D,t)
           + βW × log(V_W,t)
           + βM × log(V_M,t)
           + γ × NegativeShock_t
           + ε_t
```

Separate direct models should be estimated for 5D, 20D and 60D targets rather than forcing one iterated model to serve every horizon.

Pros:
- linear estimation;
- cheap enough for local/mobile recalculation;
- transparent;
- captures multiple persistence horizons;
- strong empirical history;
- straightforward to extend with a small number of justified predictors.

Cons:
- true HAR-RV is strongest when high-frequency realized measures are available;
- daily-close approximation is noisier;
- coefficients should be asset-specific.

**Decision:** GO — recommended statistical core.

---

### 5.7 HAR-L / leverage-HAR

For equity indices, add a negative-return/leverage component. This is preferable to ignoring asymmetry, because equity volatility commonly reacts differently to negative and positive price shocks.

For FX and some commodities the leverage term may be weak or have different economic meaning, so it should be retained only where walk-forward evidence supports it.

**Decision:** GO for equities; CONDITIONAL by asset class elsewhere.

---

### 5.8 Markov-switching HAR

The Federal Reserve’s 2025 paper, revised September 2026, compares HAR, ARFIMA, nonlinear/regime HAR variants, XGBoost and neural networks. Its reported ranking is horizon-dependent: Markov-switching HAR is particularly strong at short horizons, while ARFIMA often leads at the monthly horizon, and machine learning does not systematically dominate the broader econometric set.

Pros:
- explicitly models regime changes;
- potentially valuable for short-horizon transitions.

Cons:
- parameter instability and local optima;
- more difficult calibration;
- more complex confidence interpretation;
- increased computation and QA burden.

**Decision:** CONDITIONAL GO as phase-2 challenger, not v1 core.

---

### 5.9 Machine learning

Candidates considered:

- Elastic Net;
- Random Forest;
- XGBoost/LightGBM;
- neural networks;
- LSTM;
- Temporal CNN;
- Transformer/time-series architectures.

The current evidence does not justify a default assumption that nonlinear ML will outperform well-specified econometric volatility models across markets and horizons. The 2025/2026 Federal Reserve comparison explicitly finds that ML sometimes improves on HAR but does not systematically dominate the wider econometric set.

For this application, complex ML also creates disadvantages:

- harder explainability;
- larger data requirements;
- retraining lifecycle;
- higher risk of data leakage;
- model/version management;
- device compute and battery cost;
- more difficult deterministic regression tests.

**Decision:**

- Elastic Net: CONDITIONAL phase 2 for feature selection/regularization.
- XGBoost: RESEARCH ONLY.
- Random Forest: RESEARCH ONLY.
- LSTM/Transformer: NO-GO for v1.

No ML model should be promoted unless it beats RV persistence, EWMA, HAR-L and the implied-volatility baseline in strict walk-forward tests.

---

## 6. Implied volatility

### 6.1 VIX is not realized volatility

Cboe defines VIX as a forward-looking estimate of expected S&P 500 volatility over the next 30 days derived from SPX option quotes. It must remain conceptually separate from subsequently realized volatility.

Therefore:

```text
VIX ≠ forecasted S&P return direction
VIX ≠ realized volatility
```

It is an options-implied risk-neutral volatility measure.

### 6.2 Horizon alignment

For S&P 500 forecasting, the most defensible mapping is:

| Forecast horizon | Implied-volatility input |
|---|---|
| 5D | VIX9D plus term-structure information |
| 20D | VIX |
| 60D | VIX3M |

The implied series should augment the statistical forecast rather than replace it.

### 6.3 Combination rule

Do not choose fixed weights such as `25% HAR + 20% GARCH + 20% VIX` before a backtest.

Preferred combination:

```text
Forecast_h = Σ w_i,h × Forecast_i,h

constraints:
w_i,h >= 0
Σw_i,h = 1
```

Fit weights on a trailing OOS window using QLIKE or non-negative least squares; cap turnover in weights to avoid unstable day-to-day changes.

If the implied-volatility series is stale/unavailable, renormalize across the remaining valid models rather than returning N/A for the full forecast.

---

## 7. Implied-realized gap and variance risk premium

A user-friendly diagnostic can show:

```text
Implied volatility: 22%
Recent RV20: 15%
Implied − realized gap: +7 vol points
```

But this should be labeled **IMPLIED–REALIZED GAP**, not formal variance risk premium.

Bekaert and Hoerova decompose **squared VIX** into conditional variance and a variance-premium component. A rigorous variance risk premium operates in **variance space**, not simply `VIX - RV20` in volatility points.

Recommended v1 UI:

- show implied volatility;
- show realized volatility;
- show their descriptive gap;
- do not call that gap “VRP” unless the variance-space methodology is implemented and validated.

---

## 8. Volatility term structure

### Recommended inputs

- VIX9D / VIX;
- VIX / VIX3M;
- changes in those ratios;
- historical percentile or robust z-score.

### State labels

Possible labels:

- NORMAL CONTANGO
- FLAT
- MILD BACKWARDATION
- STRONG BACKWARDATION

However, avoid permanent absolute ratio thresholds without empirical validation. Prefer rolling historical percentiles to adapt to structural changes.

### Role

Term structure should be:

- a short-horizon forecasting input;
- a regime-transition input;
- an explainability driver.

It should **not** be the whole model.

---

## 9. VVIX / volatility of volatility

VVIX is intended to measure expected volatility of VIX itself and can identify instability in the volatility complex.

Potential uses:

- VVIX percentile;
- 5D/20D change;
- acceleration;
- divergence versus VIX.

### Recommendation

Use as:

- **explainability/context in v1**;
- **candidate predictor in phase 2**.

Require incremental OOS QLIKE improvement before giving it a production-model weight.

Also perform a licensing review before redistributing Cboe index values in a public application.

---

## 10. Rates volatility and MOVE

The ICE MOVE Index is a proprietary fixed-income volatility index covering U.S. rates options. ICE describes intraday, daily and historical delivery through its data products/API.

### Key decision

**Do not rely on MOVE in v1 unless licensing is explicitly secured.**

Instead create an explicitly named:

> **U.S. RATES VOLATILITY PROXY**

Possible components:

- TLT RV20 / forecast;
- IEF RV20 / forecast;
- Treasury yield change dispersion if available.

Never label this proxy “MOVE”.

---

## 11. Credit as a volatility input

Credit spreads are economically relevant stress-confirmation signals. Potential indicators:

- U.S. HY OAS;
- U.S. IG OAS;
- spread change/acceleration;
- HYG/LQD market behavior as secondary market proxies.

### Licensing issue

FRED’s ICE BofA spread pages explicitly state that the series are copyrighted and reproduction/distribution requires permission. In addition, from April 2026 some ICE BofA series on FRED expose only three years of observations.

### Recommendation

For the volatility forecast:

- do **not** make ICE OAS a mandatory core dependency unless rights are resolved;
- use existing credit state only as optional context/confirmation if the application’s usage is already compliant;
- an HYG/LQD market proxy can be a fall-back signal but must not be called an OAS.

---

## 12. Market breadth

Candidate breadth variables:

- % above 20DMA;
- % above 50DMA;
- % above 200DMA;
- % with elevated RV20;
- new highs/new lows;
- cap-weight versus equal-weight divergence;
- leadership concentration.

### Forecast role

Breadth deterioration may contain useful information about the fragility of a low-volatility market. However, many breadth indicators are correlated with existing equity momentum and risk signals.

**Recommendation:** candidate short/medium-horizon predictor and strong explainability feature, but retain only those variables that add OOS information after HAR/realized-vol persistence is controlled for.

---

## 13. Cross-asset correlation

The application already has lag-aware correlation/regime infrastructure. During stress, correlations often rise, which can indicate reduced diversification and broader risk transmission.

Recommended use:

- cross-asset correlation percentile;
- correlation acceleration;
- equity/internal correlation if reliable;
- breadth of assets simultaneously entering high-volatility regimes.

### Recommendation

**GO as global-regime/context feature.**  
**CONDITIONAL as direct forecast input.**

Do not double count a correlation stress signal if it is already embedded in another risk model that is subsequently used as an input.

---

## 14. Existing application risk signals

Potential existing outputs:

- Early Warning;
- Contagion;
- Global Risk;
- Structural Vulnerability;
- Capital Rotation;
- Bonds/Credit Stress;
- Fiscal Stress;
- Commodity Physical Risk.

### Circularity problem

Several existing layers already consume volatility/VIX/correlation/credit information. Feeding their final scores back into the volatility forecast could create circularity and duplicated exposure to the same data.

### Recommendation

For v1:

- show **Early Warning / Global Risk / Contagion as context and confirmation only**;
- do not use their composite scores as core predictors.

If a later backtest uses existing application information:

- use lagged values only;
- isolate non-volatility subcomponents;
- document the dependency graph;
- prevent any feedback where Volatility Forecast later feeds a model that itself feeds Volatility Forecast.

---

## 15. Macro variables

Candidate variables:

- policy rate;
- yield curve;
- real yields;
- financial conditions;
- inflation and labor surprises;
- PMI/growth indicators.

### Horizon-specific conclusion

**5D:** mostly NO-GO as core predictors because slow macro series are stale relative to daily volatility dynamics.  
**20D:** conditional.  
**60D:** potentially useful, especially rates/financial conditions, but must be tested with point-in-time vintages.

If macro data are backtested, use ALFRED or equivalent vintage-aware data to prevent revision look-ahead.

---

## 16. Scheduled event risk

Research and central-bank studies show that scheduled policy and macro announcements can materially change short-horizon volatility; recent Federal Reserve research also documents sharp intraday volatility increases around FOMC announcements.

Potential events:

- FOMC;
- ECB;
- BoJ;
- CPI/PCE;
- NFP;
- Treasury auctions;
- OPEC for oil-related assets.

### Recommendation

**Phase 2 GO**, especially for 5D horizon.

Use only:

- event proximity;
- event type;
- historical conditional event-volatility effect.

Do not predict the announcement outcome.

The operational cost of maintaining reliable multi-jurisdiction official calendars argues against making event risk a v1 blocker.

---

## 17. Recommended model architecture

### Architecture A — one model

Example: GARCH only.

**Reject as production architecture.** Too dependent on one model specification and lacks options-market forward information.

### Architecture B — fixed-weight ensemble

Example: 25% HAR + 20% GARCH + 20% implied + ...

**Reject fixed arbitrary weights.** Easy to implement, but no statistical justification unless weights are backtested.

### Architecture C — adaptive, horizon-specific ensemble

**Recommended.**

For S&P 500 and other assets with legal/reliable implied-volatility series:

```text
Core statistical forecast: HAR-L
Persistence fallback: EWMA
Challenger: GJR-GARCH (equities) / GARCH (other assets)
Forward signal: horizon-matched implied volatility

Combination weights:
rolling non-negative optimization on previous OOS forecasts
loss: QLIKE primary
weight-stability constraint / smoothing
```

For assets without implied volatility:

```text
HAR-L or HAR
+ EWMA
+ GARCH/GJR only when OOS beneficial
```

### Regime-conditional weighting

Do not implement at launch unless the walk-forward test proves it. A Markov-switching or regime-conditional ensemble is a promising challenger, but it adds complexity and estimation risk.

---

## 18. Regime classification

Absolute thresholds such as “25% = HIGH” are inappropriate across all assets because typical volatility differs radically between FX, bonds, equity indices, oil and crypto.

Use instrument-specific historical percentiles.

Provisional bins:

| Percentile | Regime |
|---:|---|
| <20 | LOW |
| 20–60 | NORMAL |
| 60–80 | ELEVATED |
| 80–95 | HIGH |
| >95 | STRESS |

These bins are starting values, not immutable truths. Validate transition frequency and persistence during backtesting.

The regime should be based on the relevant forecast horizon and/or forecasted volatility percentile, not just today’s RV.

---

## 19. Regime transition probability / stress probability

A numerical statement such as:

> `Probability of HIGH/STRESS volatility in next 20D: 31%`

should **not** be shown unless calibrated.

### Preferred first method

1. define HIGH/STRESS threshold from historical instrument-specific volatility distribution;
2. estimate a forecast distribution using rolling empirical forecast errors;
3. calculate probability forecasted realized volatility exceeds that threshold;
4. test with Brier score and reliability curve;
5. reject or recalibrate if probability bins are unreliable.

### Alternative

Markov-switching transition probabilities can be used only if the regime model passes out-of-sample calibration.

### Fallback

If probabilities are not calibrated:

- LOW STRESS RISK
- MODERATE
- ELEVATED
- HIGH

Do not fabricate percentages.

---

## 20. Forecast intervals

Point forecasts alone imply excessive precision.

Recommended user-facing display:

```text
20D forecast: 19.4%
80% expected interval: 15.8–24.7%
```

### Method

Use rolling empirical forecast-error quantiles by:

- instrument;
- forecast horizon;
- optionally volatility regime if sample size is sufficient.

Advantages:

- robust;
- distribution-light;
- easy to recalibrate;
- directly measurable interval coverage.

Detailed view may expose 50% and 95% intervals, but the main card should show only the central forecast and an 80% range.

---

## 21. Confidence methodology

Confidence should answer:

> “How much should the user trust this forecast relative to the module’s own historical performance?”

Do not define confidence as the inverse of volatility.

Recommended gating dimensions:

1. **Data quality** — enough history, no stale/missing core inputs.
2. **Recent OOS skill** — production model still beats or matches benchmark.
3. **Model agreement** — HAR/EWMA/implied/challenger not diverging excessively.
4. **Regime stability** — current state not an extreme structural-break situation.
5. **Interval calibration** — recent coverage near expected coverage.

User-facing values:

- HIGH
- MEDIUM
- LOW
- INSUFFICIENT

Do **not** assign arbitrary numerical confidence weights before backtesting. Prefer deterministic gates.

Example:

```text
HIGH:
- coverage >= 95%
- fresh core inputs
- model has positive recent OOS skill vs EWMA/RV baseline
- interval calibration acceptable
- ensemble dispersion below threshold
```

Thresholds must be calibrated empirically.

---

## 22. Market universe

### Phase-1 recommended universe

#### Equities

- S&P 500
- Nasdaq 100
- Russell 2000
- DAX
- Euro Stoxx 50
- FTSE 100
- Nikkei 225
- CSI 300
- broad Emerging Markets proxy/index

#### Rates

- IEF — intermediate Treasury price-volatility proxy
- TLT — long-duration Treasury price-volatility proxy

Label these as **rates volatility proxies**, not MOVE.

#### Commodities

- Gold
- WTI / Brent
- Copper

#### FX

- EUR/USD
- USD/JPY

### Bitcoin

Phase 2 only unless the application already has a reliable source with sufficient uninterrupted history. Crypto needs separate calibration because:

- 24/7 trading calendar;
- much higher volatility scale;
- different structural breaks and market microstructure.

### Separate calibration

Do not fit one universal coefficient set across all markets. Reuse architecture, not coefficients.

---

## 23. Global volatility regime

Do not average raw volatility percentages. A 20% FX volatility observation and a 20% equity volatility observation do not have the same historical meaning.

Recommended approach:

1. convert each asset forecast into its own historical percentile;
2. aggregate within asset class using a robust median;
3. show class regimes separately;
4. compute the headline global state from the median of class-level percentiles if a single label is required.

Suggested class display:

```text
GLOBAL VOLATILITY: ELEVATED

Equities      HIGH
Rates         ELEVATED
Credit        RISING / context
FX            NORMAL
Commodities   ELEVATED
```

Using a median avoids unsupported fixed class weights and prevents one extreme asset from dominating the headline.

If later research supports class weights, estimate them against a documented global-stress target rather than choosing them subjectively.

---

## 24. Volatility Risk Map

Recommended card fields:

| Field | Purpose |
|---|---|
| Current RV20 | present state |
| 5D forecast | near-term |
| 20D forecast | primary horizon |
| 60D forecast | persistent regime |
| Direction | rising / stable / falling |
| Regime | percentile-based |
| Confidence | forecast reliability |
| Observation date | freshness |

Example:

```text
S&P 500
Current RV20      15.4%
5D forecast       17.1% ↑
1M forecast       19.3% ↑
3M forecast       18.0% →
Regime            ELEVATED
Confidence        HIGH
```

The arrow is forecast direction, not market price direction.

---

## 25. Explainability — “Why is volatility forecast rising?”

Explainability is mandatory.

Recommended structure:

```text
VOLATILITY PRESSURE ↑

Supporting
+ recent realized volatility accelerated
+ negative-return leverage shock
+ VIX9D/VIX term structure tightened
+ implied volatility remains above recent realized volatility

Offsetting
− medium-term realized volatility remains moderate
− cross-asset stress breadth is not yet broad
```

### For the ensemble

Show component forecasts instead of raw coefficients:

```text
HAR-L          18.7%
EWMA           17.5%
Implied input  21.4%
Production     19.2%
```

This is more meaningful to the user than `βW = 0.37`.

### Tree/ML models

If a future tree model is adopted, SHAP could be used in research diagnostics, but mobile production should still translate it into understandable feature contributions.

---

## 26. Forecast track record

This should be a **mandatory feature**, not an optional technical screen.

For each market/horizon show a rolling 12-month record:

```text
Forecast track record — S&P 500 / 20D
QLIKE vs EWMA      better by X%
MAE                X.X vol points
80% interval cover XX%
Regime Brier       X.XXX
Forecasts          N
```

No performance number should be shown until enough realized outcomes exist.

### Why this matters

Volatility models drift. A model that was useful during 2018–2022 may lose skill after market-structure changes. The user should be able to see that degradation rather than receiving the same HIGH confidence forever.

---

## 27. Model drift detection

Recommended rule architecture:

- track last 60 completed forecasts;
- compare production QLIKE with EWMA and RV-persistence baselines;
- compare interval coverage with target coverage;
- detect large parameter shifts or ensemble-weight instability.

If the production model loses skill materially:

```text
MODEL PERFORMANCE DETERIORATING
Confidence: LOW
Fallback: EWMA / persistence blend
```

Do not continue presenting a complex model as superior after it stops beating the baseline.

---

## 28. Backtest design

### 28.1 Mandatory walk-forward architecture

At each historical forecast date:

1. build the training set using only information available up to that date;
2. estimate model parameters;
3. generate 5D, 20D and 60D forecasts;
4. wait until the target horizon completes;
5. calculate realized target;
6. record loss;
7. move forward.

Use expanding or rolling windows, then compare both for structural-break robustness.

### 28.2 Suggested minimum evaluation periods

Where history allows:

- 2008 financial crisis;
- 2011 euro-area stress;
- 2015–2016 China/oil stress;
- 2018 volatility shock;
- 2020 COVID crash;
- 2021 low-volatility period;
- 2022 inflation/rates shock;
- 2023 banking stress;
- 2024–2026 recent market structure.

Do not optimize separately to these episodes and then call them out-of-sample.

### 28.3 Evaluation metrics

Primary:

- **QLIKE** on variance forecasts.

Secondary:

- MAE;
- RMSE / MSE on variance;
- MAE in user-facing volatility points;
- forecast-realized correlation.

For regimes/probabilities:

- Brier score;
- log loss;
- reliability/calibration curves;
- balanced accuracy for state labels.

### 28.4 Statistical comparison

Use:

- Diebold-Mariano test for pairwise forecast accuracy;
- Model Confidence Set / SPA-type methods where multiple challengers are compared.

Do not promote a model because its RMSE is trivially lower without statistical/economic significance.

---

## 29. Out-of-sample evidence available in this research

### What published research supports

- HAR-RV is parsimonious and historically competitive for realized-volatility forecasting.
- GARCH(1,1) remains a difficult benchmark to beat in some markets; leverage-aware variants are more relevant for equities.
- Current Federal Reserve research finds **horizon-dependent** rankings and no systematic domination by machine learning.
- Markov-switching HAR appears especially promising at short horizons in the Fed comparison.
- QLIKE is particularly suitable when the realized-volatility target is itself noisy.

### What this research run did NOT produce

No proprietary or fabricated app-specific table such as:

```text
HAR 20D RMSE = ...
GARCH 20D RMSE = ...
XGBoost 20D RMSE = ...
```

was generated because the local runtime could not access the necessary bulk historical series for a reproducible multi-market walk-forward run.

### Consequence

**Final production ensemble weights remain UNSET.**

The implementation project must run the benchmark suite before weights are frozen.

---

## 30. Data sources and access assessment

| Input | Preferred source | Frequency | Role | Key issue |
|---|---|---:|---|---|
| Equity/index prices | existing app market provider(s) / official exchange where practical | daily | realized vol | provider terms, fallback quality |
| VIX | Cboe | daily/current | 20D implied input | redistribution/licensing review |
| VIX9D | Cboe | daily | 5D implied/term structure | licensing review |
| VIX3M | Cboe | daily | 60D implied/term structure | licensing review |
| VVIX | Cboe | daily | vol-of-vol context | licensing + incremental skill |
| Gold implied vol | Cboe GVZ | daily | optional gold context | licensing review |
| Oil implied vol | Cboe OVX | daily | optional oil context | licensing review |
| MOVE | ICE | intraday/daily | rates implied vol | proprietary/licensing — reject v1 absent rights |
| HY/IG OAS | ICE via FRED | daily | credit context | copyright/redistribution, history restriction |
| Treasury/rates | Treasury/FRED where permitted | daily | rates context | source-specific terms |
| Macro vintages | FRED/ALFRED / official agencies | source frequency | 60D candidate | revisions/look-ahead |
| Event dates | Fed/ECB/BoJ/BLS/Treasury/OPEC official calendars | scheduled | phase-2 event risk | multi-source maintenance |

### Cboe licensing warning

Cboe provides a public historical page for VIX and several volatility indices. However, Cboe’s July 2026 market-data policy states that Global Indices Feed delayed/end-of-day/historical distribution can require a data agreement and that further index licensing may be required depending on use/distribution. Cboe DataShop pages also state restrictions on external redistribution for proprietary datasets.

Therefore:

> **Technical accessibility is not equivalent to a right to redistribute the values in a public Android product.**

Before production deployment, review the exact intended use with Cboe/licensing terms.

### ICE licensing warning

ICE index terms are similarly restrictive. FRED pages carrying ICE BofA series explicitly state that reproduction/distribution can require ICE permission.

Therefore MOVE and ICE OAS values should not become hard production dependencies without licensing review.

---

## 31. Data freshness semantics

Every forecast should contain separate timestamps:

```text
Price observation:     2026-09-15
Implied-vol observation: 2026-09-15
Model calculated:      2026-09-16 08:05 UTC
Target horizon:        next 20 trading days
```

Status:

- LIVE
- CACHED
- STALE
- PARTIAL
- N/A

Do not equate retrieval time with observation time.

---

## 32. Cache and failure isolation

Recommended execution model:

1. load cached forecast instantly;
2. refresh underlying observations progressively;
3. recalculate only affected forecasts;
4. atomically replace forecast cache after validation;
5. preserve prior valid forecast if one optional provider fails;
6. mark stale/partial status explicitly.

Examples:

- VIX unavailable → S&P forecast falls back to HAR-L + EWMA; no full-module failure.
- VVIX unavailable → forecast continues; VVIX driver omitted.
- China unavailable → China card N/A; global module continues.
- credit unavailable → credit confirmation omitted; core forecast unchanged.
- only one observation returned → source rejected, not treated as valid history.

---

## 33. Mobile computational architecture

### HAR / EWMA

Safe for local execution.

- OLS regression is cheap;
- daily recalculation only after a new observation;
- forecasts can be cached;
- no reason to refit on every UI render.

### GARCH / GJR

Feasible but should not run indiscriminately across the entire universe on every refresh.

Recommended:

- weekly recalibration or daily only for a small priority universe;
- store parameters/cache results;
- apply convergence and parameter-validity checks;
- automatic fallback to HAR/EWMA.

### Markov/ML

Do not make mobile refresh dependent on expensive iterative training.

If adopted later:

- re-estimate weekly/monthly or in a controlled background job;
- cache model coefficients;
- do not block UI rendering.

---

## 34. Model re-estimation schedule

| Model | Recommended re-estimation |
|---|---|
| RV persistence | new daily observation |
| EWMA | incremental daily |
| HAR/HAR-L | daily after market observation |
| GARCH/GJR | daily for small universe or weekly for broad universe |
| Ensemble weights | weekly, using trailing OOS record |
| Regime percentiles | daily incremental / periodic full rebuild |
| Markov switching | weekly/monthly challenger |
| ML | offline/weekly-monthly research only |

---

## 35. Minimum data requirements

Proposed operational gates to validate during backtesting:

| Model | Minimum | Preferred |
|---|---:|---:|
| RV / EWMA | 60–120 obs | 250+ |
| HAR/HAR-L | 500 | 750–1,250+ |
| GARCH/GJR | 500 | 750+ |
| Markov switching | 1,000 | 1,250+ |
| ML | 1,250+ | multiple regimes / much larger sample |

If the gate is not met:

> `INSUFFICIENT DATA`

Do not silently shorten the history until the model returns a number.

---

## 36. Structural breaks and 0DTE

The growth of same-day SPX options is a real market-structure change and should be monitored as a possible structural break. However, available evidence is not unidirectional: Cboe research argues observed 0DTE market-maker gamma hedging is small relative to SPX liquidity, while academic work has debated both volatility-amplifying and volatility-dampening channels.

### Recommendation

Do **not** add a 0DTE feature to v1 because:

- robust free historical positioning data are not available at the required quality;
- evidence on causal volatility impact is mixed;
- it would materially increase data/microstructure complexity.

Instead:

- monitor model drift after major option-market structural changes;
- allow rolling windows to reduce dependence on obsolete regimes.

---

## 37. Volatility clustering and asymmetry

The production architecture must capture two stylized facts:

### Volatility clustering

High-volatility periods tend to follow high-volatility periods, and low-volatility periods tend to persist.

Captured by:

- EWMA;
- GARCH;
- HAR persistence across horizons.

### Asymmetry / leverage

For equities, negative returns often generate stronger subsequent volatility than positive returns of similar magnitude.

Captured by:

- GJR-GARCH;
- EGARCH;
- HAR leverage term.

Recommended: HAR leverage term as production core; GJR as challenger.

---

## 38. Jumps

Jump decomposition using bipower variation or high-frequency realized measures can improve some volatility models, but reliable implementation generally requires intraday data.

**Decision:** document for future research, NO-GO for v1.

A simple large-return dummy may be used as a lightweight shock indicator, but it should not be called a formal jump-variation estimator.

---

## 39. Cross-market contagion

Potential lagged signals:

- U.S. equity volatility → European equity volatility;
- rates volatility → Nasdaq/growth volatility;
- oil volatility → energy-sector volatility;
- China/EM volatility → industrial metals and EM.

### Recommendation

Phase 2 only.

Before introducing VAR-style systems, test simple lagged cross-market features against the same HAR baseline. Retain only features that improve OOS loss without creating a fragile high-dimensional model.

---

## 40. Forecast versus risk signal

The module must preserve this distinction:

### Forecast

> Expected future realized volatility.

Example:

`20D expected realized vol = 18.7%`

### Risk signal

> Conditions that make a volatility shock more plausible/severe.

Example:

`Stress risk = ELEVATED`

The application should not force them into a single opaque score.

A market can have:

- moderate point forecast;
- unusually wide forecast interval;
- elevated stress-tail risk.

That distinction is analytically useful.

---

## 41. Proposed mobile UI

### Section 1 — Global Volatility Regime

```text
GLOBAL VOLATILITY
Current          ELEVATED
1W outlook       RISING
1M outlook       ELEVATED
3M outlook       ELEVATED
Confidence       MEDIUM
```

Do not show numeric stress probability until calibrated.

### Section 2 — Volatility Risk Map

Compact rows for all tracked markets.

### Section 3 — Equity Forecasts

S&P 500 / Nasdaq 100 / Russell 2000 / DAX / Euro Stoxx 50 / FTSE / Nikkei / CSI 300 / EM.

### Section 4 — Rates / Bonds Volatility

IEF/TLT realized/forecast volatility labeled as rate-price-volatility proxies.

### Section 5 — Commodity Volatility

Gold, oil, copper.

### Section 6 — FX Volatility

EUR/USD, USD/JPY.

### Section 7 — Implied vs Realized

Only where legally/reliably available.

### Section 8 — Volatility Term Structure

VIX9D / VIX / VIX3M.

### Section 9 — Forecast Drivers

Supporting and offsetting factors.

### Section 10 — Forecast Track Record

Auditable model quality.

### Section 11 — Data Quality

Coverage, freshness, source state, fallback.

---

## 42. Charts

Recommended charts:

1. **Realized vs forecast volatility** — historical forecast track record.
2. **Realized vs implied volatility** — SPX only where data rights permit.
3. **VIX term structure** — 9D / 30D / 3M.
4. **Regime history** — percentile regime over time.
5. **Forecast interval chart** — central forecast plus 80% band.

Every chart must explicitly state:

- forecast horizon;
- observation date;
- target period;
- source;
- whether data are live/cached/stale.

---

## 43. Recommended production output

Example:

```text
S&P 500 VOLATILITY

Current RV20          15.4%
1W forecast           17.1%
1M forecast           19.3%
3M forecast           18.0%
1M 80% interval       15.9–24.6%

Regime                ELEVATED
Direction             RISING
Confidence            MEDIUM

Implied 30D           21.8%
Implied-realized gap  +6.4 pp
Term structure        FLATTENING

Why rising
+ HAR persistence increased
+ negative-return shock
+ short-end implied vol strengthened

Offsetting
− cross-asset stress not yet broad
```

If a field is not available or not licensed, omit it rather than inventing a replacement.

---

## 44. Feature importance / attribution

For linear/HAR models:

- standardized component contributions;
- forecast with/without feature;
- component-level contribution to change versus previous forecast.

For the ensemble:

- each component forecast;
- current ensemble weight;
- change in production forecast attributable to each component.

For future ML:

- SHAP may be used in diagnostics;
- user-facing text should remain concise and causal-neutral.

---

## 45. Failure modes

### Model failures

- convergence failure;
- non-stationary/invalid GARCH parameters;
- insufficient history;
- forecast outside plausible range;
- ensemble-weight instability;
- regime model collapse to one state.

### Data failures

- stale Cboe value;
- single-point Yahoo series;
- market holiday/calendar mismatch;
- FX 24h calendar mismatch;
- China ticker/source failure;
- ICE/FRED licensing/history limitations.

### Product failures

- interpreting volatility as direction;
- showing false precision;
- showing uncalibrated “probabilities”;
- double counting Early Warning/Global Risk;
- calling ETF rates volatility “MOVE”.

Each failure should degrade to a simpler validated model rather than crash the entire module.

---

## 46. Implementation roadmap

### Phase 0 — Benchmark harness

Before UI implementation:

- build reproducible walk-forward engine;
- establish RV persistence and EWMA baselines;
- implement QLIKE, MAE, RMSE, DM tests;
- store forecast history and realized outcomes.

### Phase 1 — Minimum viable production model

- close-to-close future RV targets;
- 5D / 20D / 60D;
- HAR-L;
- EWMA;
- S&P horizon-matched VIX inputs if licensing/use is cleared;
- empirical forecast intervals;
- percentile regimes;
- forecast track record;
- model drift detection;
- global risk map.

### Phase 1b — OHLC research

- preserve O/H/L/C in market-series schema without breaking existing consumers;
- compare Yang-Zhang/range estimators with close-to-close target;
- switch only on demonstrated OOS improvement.

### Phase 2 — Challengers

- GJR-GARCH;
- Markov-switching HAR;
- event proximity;
- breadth/correlation incremental tests;
- optional VVIX;
- selected 60D macro/financial-condition predictors.

### Phase 3 — Advanced research

- Elastic Net feature selection;
- XGBoost only where robustly superior;
- cross-market lag features;
- calibrated stress probabilities;
- crypto-specific model if required.

### Explicitly deferred

- LSTM/Transformer production model;
- high-frequency jump variation;
- 0DTE positioning model;
- unlicensed MOVE integration;
- fixed arbitrary ensemble weights.

---

## 47. GO / NO-GO decision table

| Feature | Decision | Reason | Primary data/source | Confidence |
|---|---|---|---|---|
| Close-to-close future RV | **KEEP / GO** | Available, consistent, auditable baseline | existing daily market data | HIGH |
| Yang-Zhang | **CONDITIONAL** | Strong OHLC estimator, but must beat baseline OOS | daily OHLC | HIGH on methodology / MEDIUM on app gain |
| Parkinson/Garman-Klass | **RESEARCH** | Useful OHLC challengers | daily OHLC | MEDIUM |
| EWMA | **KEEP / GO** | Robust lightweight baseline/fallback | returns | HIGH |
| HAR-RV / log-HAR | **KEEP / GO** | Parsimonious multi-horizon persistence model | realized-vol history | HIGH |
| HAR leverage term | **KEEP / GO for equities** | Captures asymmetric shock response | returns + RV | HIGH |
| GARCH(1,1) | **KEEP as benchmark** | Strong canonical challenger | returns | HIGH |
| GJR-GARCH | **KEEP as challenger** | Equity leverage/asymmetry | returns | HIGH |
| EGARCH | **REJECT v1** | Redundant complexity unless it proves OOS gain | returns | MEDIUM-HIGH |
| VIX | **KEEP conditionally** | Strong 30D forward-looking SPX signal | Cboe | HIGH methodology / licensing review required |
| VIX9D | **KEEP conditionally** | Useful short-horizon implied input | Cboe | HIGH methodology / licensing review required |
| VIX3M | **KEEP conditionally** | Better horizon match for 60D | Cboe | HIGH methodology / licensing review required |
| VVIX | **CONDITIONAL** | Useful vol-of-vol context; incremental forecast gain unproven for app | Cboe | MEDIUM |
| Implied-realized gap | **KEEP** | Useful explainability | implied + realized | HIGH |
| Formal variance risk premium | **PHASE 2** | Must be defined in variance space | options/implied + expected variance | MEDIUM-HIGH |
| VIX term structure | **KEEP** | Short-horizon stress/regime information | Cboe | HIGH |
| MOVE | **REJECT v1 absent license** | Proprietary ICE index | ICE | HIGH |
| IEF/TLT rates-vol proxy | **KEEP** | Practical transparent alternative; must be labeled proxy | market prices | HIGH |
| HY/IG OAS | **CONDITIONAL context** | Economically useful but rights/history restrictions | ICE/FRED | HIGH signal / LOW-MEDIUM production portability |
| HYG/LQD price proxy | **CONDITIONAL** | Market-based fallback, not same as OAS | market prices | MEDIUM |
| Breadth | **CONDITIONAL** | Potential incremental fragility signal | existing app breadth | MEDIUM |
| Cross-asset correlation | **KEEP as context/global regime** | Valuable stress breadth; avoid double count | existing correlation engine | HIGH |
| Early Warning composite | **CONTEXT ONLY v1** | Circularity/double-count risk | existing app | HIGH |
| Global Risk composite | **CONTEXT ONLY v1** | Same circularity issue | existing app | HIGH |
| Slow macro variables | **PHASE 2 / 60D only** | Weak short-horizon timeliness | official/FRED/ALFRED | MEDIUM |
| Event calendar | **PHASE 2 GO** | Evidence of event-linked volatility, useful mainly 5D | official calendars | MEDIUM-HIGH |
| Markov-switching HAR | **PHASE 2 challenger** | Promising short horizon; more complex | RV history | MEDIUM-HIGH |
| ARFIMA | **RESEARCH challenger** | Strong monthly performance in recent Fed comparison | RV history | MEDIUM-HIGH |
| Elastic Net | **PHASE 2** | Useful regularized feature selection | extended features | MEDIUM |
| Random Forest | **NO-GO v1** | No clear need over simpler models | extended features | MEDIUM |
| XGBoost | **NO-GO v1 / research** | Can help some markets, not systematic | extended features | MEDIUM |
| LSTM/Transformer | **REJECT v1** | Data/compute/explainability cost, no systematic dominance | large histories | HIGH |
| Numeric stress probability | **CONDITIONAL** | Only after Brier/reliability calibration | forecast distribution | HIGH |
| Qualitative stress state | **KEEP** | Can be robust before probabilities are calibrated | regime percentile | HIGH |
| Forecast intervals | **KEEP / mandatory** | Prevent false precision | forecast errors | HIGH |
| Forecast track record | **KEEP / mandatory** | Auditable model skill | stored forecasts/outcomes | HIGH |
| Model drift detection | **KEEP / mandatory** | Protects against structural change | track record | HIGH |
| 0DTE positioning feature | **REJECT v1** | Mixed evidence and data-access complexity | options microstructure | HIGH |
| Intraday jump-RV | **REJECT v1** | Requires costly high-frequency data | intraday market data | HIGH |

---

## 48. Final model recommendation

### Production candidate to benchmark first

For each market `m` and horizon `h ∈ {5,20,60}`:

```text
1. Compute current volatility state from daily returns.
2. Estimate a direct log-HAR forecast.
3. Add leverage term where asset-class evidence supports it.
4. Compute EWMA forecast.
5. Compute GARCH/GJR challenger forecast.
6. If a legal/reliable horizon-matched implied-vol series exists, add it.
7. Combine only models that have positive rolling OOS value.
8. Set combination weights from trailing OOS QLIKE, not hardcoded constants.
9. Build 80% forecast interval from rolling forecast errors.
10. Map point forecast into instrument-specific historical percentile regime.
11. Display numeric stress probability only after calibration passes.
12. Record forecast so future realized outcome can audit it.
```

### Default hierarchy if data fail

```text
Full validated ensemble
      ↓
HAR-L + EWMA
      ↓
EWMA + RV persistence
      ↓
RV persistence only
      ↓
INSUFFICIENT DATA
```

### Answer to the main research question

> **What is the simplest model architecture that materially improves volatility forecasting over naive realized-volatility and implied-volatility benchmarks?**

The best candidate to test first is:

> **A horizon-specific log-HAR model with a leverage term, combined adaptively with EWMA persistence and, for markets where it is reliably/licensably available, horizon-matched implied volatility.**

This architecture is preferred because it offers the strongest balance of:

- out-of-sample plausibility;
- robustness;
- explainability;
- mobile computational cost;
- maintainability;
- graceful fallback;
- compatibility with the existing application architecture.

**No fixed ensemble weights should be approved until the application-specific walk-forward benchmark has been run.**

---

## 49. Sources reviewed

Primary/authoritative and academic sources used in the research include:

1. **Cboe — VIX FAQ**, definition and 30-day expected volatility methodology: https://www.cboe.com/tradable_products/vix/faqs
2. **Cboe — VIX Historical Data**, VIX and selected volatility-index historical series: https://www.cboe.com/tradable_products/vix/vix_historical_data
3. **Cboe — Global Indices Feed**: https://www.cboe.com/data/global-indices-feed
4. **Cboe — U.S. Market Data Policies, effective July 1 2026**, distribution/licensing conditions: https://cdn.cboe.com/resources/membership/Market_Data_Policies_july2026.pdf
5. **Cboe DataShop — Main Channel EOD**, proprietary/redistribution notice: https://datashop.cboe.com/main-channel-end-of-day-summary
6. **Fulvio Corsi (2009), “A Simple Approximate Long-Memory Model of Realized Volatility,” Journal of Financial Econometrics**, DOI 10.1093/jjfinec/nbp001.
7. **Yang & Zhang (2000), “Drift-Independent Volatility Estimation Based on High, Low, Open, and Close Prices,” Journal of Business**, DOI 10.1086/209650.
8. **Hansen & Lunde (2005), “A forecast comparison of volatility models: does anything beat a GARCH(1,1)?”, Journal of Applied Econometrics**, DOI 10.1002/jae.800.
9. **Andrew Patton (2011), “Volatility forecast comparison using imperfect volatility proxies,” Journal of Econometrics**, DOI 10.1016/j.jeconom.2010.03.034.
10. **Diebold & Mariano (1995), “Comparing Predictive Accuracy,” Journal of Business & Economic Statistics**, DOI 10.1080/07350015.1995.10524599.
11. **Federal Reserve FEDS 2025-061r1 (rev. Sep 2026), “Linear and Nonlinear Econometric Models versus Machine-Learning Models: Evidence from Realized-Volatility Forecasting”**, DOI 10.17016/FEDS.2025.061r1.
12. **Bekaert & Hoerova, “The VIX, the Variance Premium and Stock Market Volatility,” NBER w18995 / Journal of Econometrics**: https://www.nber.org/papers/w18995
13. **ICE Developer — MOVE Index**: https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-move-index
14. **ICE Index Platform Terms**: https://indices.ice.com/termsAndDisclaimers
15. **FRED — ICE BofA US High Yield OAS**, series `BAMLH0A0HYM2`, including copyright/history notice: https://fred.stlouisfed.org/series/BAMLH0A0HYM2
16. **Federal Reserve (May 2026), “The Effect of the Federal Reserve on the Stock Market: Magnitudes, Channels and Shocks”**: https://www.federalreserve.gov/econres/feds/the-effect-of-the-federal-reserve-on-the-stock-market-magnitudes-channels-and-shocks.htm
17. **Federal Reserve, “Pre-Announcement Effects, News, and Volatility: Monetary Policy and the Stock Market”**: https://www.federalreserve.gov/econres/feds/pre-announcement-effects-news-and-volatility-monetary-policy-and-the-stock-market.htm
18. **Federal Reserve Bank of New York (2026), “Intraday Price Pressure and Order Flow Around U.S. Treasury Auctions”**: https://www.newyorkfed.org/research/staff_reports/sr1188
19. **Cboe (2025), “0DTEs Decoded: Positioning, Trends, and Market Impact”**: https://www.cboe.com/insights/posts/0-dt-es-decoded-positioning-trends-and-market-impact
20. **BIS, macroeconomic announcements and implied swaption volatility**: https://www.bis.org/publications/macroeconomic-announcements-and-implied-volatilities-swaption-markets

---

## 50. Research status

**Research:** COMPLETE  
**Code changes:** NONE  
**APK generated:** NO  
**Existing application models modified:** NO  
**Recommended next step:** build the walk-forward validation harness and produce empirical model rankings before implementation of the Volatility Forecast tab.
