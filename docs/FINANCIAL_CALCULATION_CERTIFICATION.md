# Financial Calculation Certification

Certification engine: **FinanceCore v1.1.0**

Certification status: **PASS — CERTIFIED CALCULATION SCOPE**

This document records formula conventions, validation, tests, tolerances, production routing and limitations. A formula is not considered certified merely because source code exists; certification requires deterministic tests, source-level gates, successful production build verification and production-runtime evidence.

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
| NPV | Σ CFt/(1+r)^t | r > -100% | -1000,+1100 @10% | 1e-10 — VERIFIED CORE + RUNTIME |
| IRR | root of NPV(r)=0 using bracketed solve | positive and negative flows required | -1000,+1100 | 1e-8 — VERIFIED CORE + RUNTIME |
| XIRR | dated XNPV root, 365-day year convention | valid dates; mixed-sign flows | one-year fixture | 1e-8 — VERIFIED CORE |
| Annualized volatility | σperiod × √periods/year | explicit periods/year | monthly/daily invariant | 1e-9 — VERIFIED CORE |
| Beta | Cov(asset, benchmark)/Var(benchmark) | non-zero benchmark variance | scaled-return identity | 1e-9 — VERIFIED CORE |
| Maximum drawdown | current/runningPeak - 1 | positive NAV/price values | increasing, decreasing, repeated peak | exact/1e-9 — VERIFIED CORE + RUNTIME |
| Recovery period | first post-trough value ≥ pre-drawdown high-water mark | valid trough index | 100→90→70→80→95→100 | exact — VERIFIED CORE + RUNTIME |
| SMA | rolling arithmetic mean | positive integer period | warm-up fixture | 1e-9 — VERIFIED CORE + RUNTIME |
| EMA | SMA seed then α=2/(n+1) | positive integer period | warm-up fixture | 1e-9 — VERIFIED CORE + RUNTIME |
| MACD | EMAfast - EMAslow; signal=EMA(MACD); hist=MACD-signal | fast < slow; explicit null warm-up | constant/increasing/decreasing/custom | 1e-12 identity — VERIFIED CORE + RUNTIME |
| RSI | Wilder smoothing | positive integer period; zero-loss/gain guards | rising=100, falling=0, flat=50 | exact — VERIFIED CORE + RUNTIME |
| Bond price | PV of coupons + principal using y/m | y/m > -1 | zero/annual/semiannual/quarterly/par/premium/discount | 1e-8 — VERIFIED CORE |
| Macaulay duration | PV-weighted cash-flow time in years | valid bond | independent semiannual fixture | 1e-10 — VERIFIED CORE |
| Modified duration | Dmac/(1+YTM/m) | frequency > 0 | REG-BOND-001 | 1e-10 — VERIFIED CORE + RUNTIME |
| Convexity | ΣCF·t(t+1)/(1+y)^(t+2) / (P·m²) | valid bond | positive-convexity fixture | sanity + finite — VERIFIED CORE |
| YTM | yield solving certified bond price | positive price/face | round-trip price/yield | 1e-8 — VERIFIED CORE |
| DV01 | central 1 bp price difference | valid bond | positive vanilla-bond DV01 | sanity — VERIFIED CORE + RUNTIME |
| CAPM | Rf + β·ERP | finite inputs | 3%,1.2,5.5% → 9.6% | 1e-9 — VERIFIED CORE + RUNTIME |
| WACC | E/V·Ke + D/V·Kd·(1-T) + P/V·Kp | non-negative capital, total > 0, tax 0..1 | known-answer weights | 1e-9 — VERIFIED CORE + RUNTIME |
| FCFF DCF | EBIT(1-T)+D&A-CapEx-ΔNWC; annual discounting | WACC > 0; g < WACC for perpetuity; shares > 0 | independent reference + directional properties | 1e-10 — VERIFIED CORE + RUNTIME |
| DDM Gordon | D1/(Ke-g) | Ke > g | known answer + monotonic properties | 1e-9 — VERIFIED CORE + RUNTIME |
| Multi-stage DDM | stage dividends + discounted terminal | Ke > terminal g | denominator guard | deterministic — VERIFIED CORE + RUNTIME |
| Residual income | NI - beginning BV·Ke | valid book value, Ke > terminal growth | beginning-BV charge fixture | deterministic — VERIFIED CORE + RUNTIME |
| Comparables summary | positive comparable sample; arithmetic mean + correct median | non-empty positive peer sample | even median fixture | exact — VERIFIED CORE + RUNTIME |
| Portfolio return | Σwi·ri | weights sum to 1 | two-asset fixture | 1e-9 — VERIFIED CORE |
| Portfolio variance | wᵀΣw | square covariance matrix | two-asset + single-asset invariant | 1e-9 — VERIFIED CORE |
| Core accounting ratios | explicit safe division; zero preservation | denominator-specific null handling | zero-value and DuPont component fixtures | deterministic — VERIFIED CORE + RUNTIME |
| CSV header mapping | explicit `null` index checks | recognized headers | Date first/middle/last; Close first | exact — VERIFIED CORE + RUNTIME |
| Large-number scale | T/B/M/K with pre-scaling | finite values | 10,000→10K, ± values, transitions | exact — VERIFIED CORE + RUNTIME |

`VERIFIED CORE + RUNTIME` means the implementation is independently tested in `FinanceCore` and is also mapped into the workstation production path. `VERIFIED CORE` alone means the extracted function is certified as a reusable calculation primitive but the current legacy UI may not directly expose that exact primitive.

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

## Production integration

The runtime installer maps the certified engine into the existing workstation without discarding its product surface. Production-routed paths include `LoanEngine` NPV/IRR, `CalcEngine` drawdown/recovery and technical indicators, `CsvParser`, bond duration/sensitivity/DV01, `CapmWacc`, `ValuationEngine`, `FinancialRatios`, large-number formatting and compatible legacy `FINANCE` functions.

The deterministic build also performs narrowly scoped compatibility hardening required by browser verification:

- passes coupon frequency into the modified-duration UI call site;
- labels price-history recovery in observations;
- removes the unrelated Cloudflare challenge payload from the offline artifact;
- replaces the unsafe SVG `Object.assign` factory with attribute-safe `setAttribute` handling;
- repairs correlation-heatmap interpolation scope.

## Verification stack

Final certification evidence for workflow run **34413815597**:

- certified source-structure gate: **21/21 PASS**;
- Node unit/regression/known-answer/runtime tests: **123/123 PASS**;
- deployable artifact verification: **21/21 PASS**;
- contextual static-audit inventory: **422/422 leads enumerated/classified, 0 unclassified**;
- Chromium application smoke: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 unexpected external network requests**;
- browser calculation assertions: **median, NPV, IRR, duration, recovery, MACD, RSI and DCF all PASS**.

## Certification boundary

The generated single-file application still contains substantial legacy code. The static audit deliberately over-matches constructs such as `|| 0`, truthy guards, `Math.round`, `Infinity` sentinels and parser conversions. `STATIC_AUDIT_FINDINGS.md` inventories and context-classifies these leads, but a regex classification is not proof that every unmapped legacy analytical helper is institutionally validated.

Accordingly, the certification claim is intentionally precise: **FinanceCore and the production calculation paths explicitly mapped to it are certified; unmapped legacy analytical helpers remain outside that certification boundary unless separately tested and promoted.** Product/model limitations remain documented in `KNOWN_LIMITATIONS.md`.

## Final certification status

**PASS — CERTIFIED CALCULATION SCOPE.**

Repository-level evidence and commands are recorded in `FINANCIAL_TEST_REPORT.md`.
