# Financial Calculation Certification

Certification engine: **FinanceCore v1.1.0**

This document records formula conventions, validation, tests, tolerances and limitations. A formula is not considered certified merely because source code exists; certification requires deterministic tests and a successful production build.

## Conventions

- Internal rates are decimals: 5% = `0.05`.
- Financial calculations retain JavaScript numeric precision; rounding belongs to presentation.
- Missing/invalid results use `null` or a structured `{error, status:"invalid"}` response rather than fabricated zeroes.
- Zero is treated as data, not as missing.
- Drawdown recovery is measured in observations by default; calendar-day recovery is calculated only when timestamps are supplied.
- Bond YTM is annual nominal yield; periodic yield is `YTM / frequency`.
- Coupon input in the certified bond core is annual coupon cash amount, matching the existing application’s bond UI bridge.

## Certified calculations

| Module | Formula / convention | Validation | Representative tests | Tolerance / status |
|---|---|---|---|---|
| Mean | Σx/n | finite numeric array | known answer | 1e-9 — VERIFIED CORE |
| Median | sorted middle; even = average of two middle values | finite numeric array; non-mutating | 1,2,3,4 → 2.5 | exact — VERIFIED CORE |
| Variance / SD | sample or population via explicit ddof | n > ddof | known-answer fixtures | 1e-9 — VERIFIED CORE |
| Covariance / Correlation | matched arrays; sample covariance | equal length; non-zero SD for correlation | perfect-correlation fixture | 1e-9 — VERIFIED CORE |
| Simple return | Ending/Beginning - 1 | beginning ≠ 0 | 100→125 | 1e-9 — VERIFIED CORE |
| Log return | ln(Ending/Beginning) | positive endpoints | e-ratio fixture | 1e-9 — VERIFIED CORE |
| CAGR | (Ending/Beginning)^(1/years)-1 | positive beginning, years > 0 | 100→121 in 2 years | 1e-9 — VERIFIED CORE |
| TWR | Π(1+r)-1 | finite subperiod returns | +10%, -10% | 1e-9 — VERIFIED CORE |
| NPV | Σ CFt/(1+r)^t | r > -100% | -1000,+1100 @10% | 1e-10 — VERIFIED CORE |
| IRR | root of NPV(r)=0 using bracketed solve | positive and negative flows required | -1000,+1100 | 1e-8 — VERIFIED CORE |
| XIRR | dated XNPV root, 365-day year convention | valid dates; mixed-sign flows | one-year fixture | 1e-8 — VERIFIED CORE |
| Annualized volatility | σperiod × √periods/year | explicit periods/year | monthly/daily invariant | 1e-9 — VERIFIED CORE |
| Beta | Cov(asset, benchmark)/Var(benchmark) | non-zero benchmark variance | scaled-return identity | 1e-9 — VERIFIED CORE |
| Maximum drawdown | current/runningPeak - 1 | positive NAV/price values | increasing, decreasing, repeated peak | exact/1e-9 — VERIFIED CORE |
| Recovery period | first post-trough value ≥ pre-drawdown high-water mark | valid trough index | 100→90→70→80→95→100 | exact — VERIFIED CORE |
| SMA | rolling arithmetic mean | positive integer period | warm-up fixture | 1e-9 — VERIFIED CORE |
| EMA | SMA seed then α=2/(n+1) | positive integer period | warm-up fixture | 1e-9 — VERIFIED CORE |
| MACD | EMAfast - EMAslow; signal=EMA(MACD); hist=MACD-signal | fast < slow; explicit null warm-up | constant/increasing/decreasing/custom | 1e-12 identity — VERIFIED CORE |
| RSI | Wilder smoothing | positive integer period; zero-loss/gain guards | rising=100, falling=0, flat=50 | exact — VERIFIED CORE |
| Bond price | PV of coupons + principal using y/m | y/m > -1 | zero/annual/semiannual/quarterly/par/premium/discount | 1e-8 — VERIFIED CORE |
| Macaulay duration | PV-weighted cash-flow time in years | valid bond | independent semiannual fixture | 1e-10 — VERIFIED CORE |
| Modified duration | Dmac/(1+YTM/m) | frequency > 0 | REG-BOND-001 | 1e-10 — VERIFIED CORE |
| Convexity | ΣCF·t(t+1)/(1+y)^(t+2) / (P·m²) | valid bond | positive-convexity fixture | sanity + finite — VERIFIED CORE |
| YTM | yield solving certified bond price | positive price/face | round-trip price/yield | 1e-8 — VERIFIED CORE |
| DV01 | central 1 bp price difference | valid bond | positive vanilla-bond DV01 | sanity — VERIFIED CORE |
| CAPM | Rf + β·ERP | finite inputs | 3%,1.2,5.5% → 9.6% | 1e-9 — VERIFIED CORE |
| WACC | E/V·Ke + D/V·Kd·(1-T) + P/V·Kp | non-negative capital, total > 0, tax 0..1 | known-answer weights | 1e-9 — VERIFIED CORE |
| FCFF DCF | EBIT(1-T)+D&A-CapEx-ΔNWC; annual discounting | WACC > 0; g < WACC for perpetuity; shares > 0 | independent reference + directional properties | 1e-10 — VERIFIED CORE |
| DDM Gordon | D1/(Ke-g) | Ke > g | known answer + monotonic properties | 1e-9 — VERIFIED CORE |
| Multi-stage DDM | stage dividends + discounted terminal | Ke > terminal g | denominator guard | deterministic — VERIFIED CORE |
| Residual income | NI - beginning BV·Ke | valid book value, Ke > terminal growth | beginning-BV charge fixture | deterministic — VERIFIED CORE |
| Comparables summary | positive comparable sample; arithmetic mean + correct median | non-empty positive peer sample | even median fixture | exact — VERIFIED CORE |
| Portfolio return | Σwi·ri | weights sum to 1 | two-asset fixture | 1e-9 — VERIFIED CORE |
| Portfolio variance | wᵀΣw | square covariance matrix | two-asset + single-asset invariant | 1e-9 — VERIFIED CORE |
| Core accounting ratios | explicit safe division; `??`-style zero preservation | denominator-specific null handling | zero-value and DuPont component fixtures | deterministic — VERIFIED CORE |
| CSV header mapping | explicit `null` index checks | recognized headers | Date first/middle/last; Close first | exact — VERIFIED CORE |
| Large-number scale | T/B/M/K with pre-scaling | finite values | 10,000→10K, ± values, transitions | exact — VERIFIED CORE |

## Eight permanent regression controls

- `REG-BOND-001` — semiannual modified duration
- `REG-DD-001` — recovery to prior peak, not trough
- `REG-MACD-001` — histogram populated and equal to MACD − signal
- `REG-FMT-001` — 10,000 scales to 10K
- `REG-CSV-001` — index 0 is preserved
- `REG-STAT-001` — even median averages two center values
- `REG-RSI-001` — no-loss RSI does not produce invalid output and equals 100
- `REG-DCF-001` — perpetual-growth DCF rejects g ≥ WACC

## Representative independent bond reference

Input: face 1,000; annual coupon 5% (= 50 cash/year); YTM 6%; maturity 10 years; frequency 2.

- Price: `925.6126256977221`
- Macaulay duration: `7.894997340182341` years
- Modified duration: `7.665045961342078` years

The modified-duration expected value is hard-coded in the regression fixture and was derived independently from the production function.

## DCF sensitivity guard

For perpetual growth, `terminalGrowth >= WACC` returns an invalid structured result and cannot propagate a valuation. A spread below 50 bps remains calculable but emits a CAUTION warning about extreme sensitivity.

## Production integration status

The runtime installer maps the certified engine into the existing `CalcEngine`, `CsvParser`, `BondEngine`, `CapmWacc`, `ValuationEngine`, `FinancialRatios`, and compatible legacy `FINANCE` methods. The build also patches the bond UI call site so coupon frequency is actually supplied.

Repository-level production-build and CI status are recorded in `FINANCIAL_TEST_REPORT.md` and must be PASS before the branch can be called fully certified.
