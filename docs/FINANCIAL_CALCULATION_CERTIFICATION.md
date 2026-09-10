# Financial Calculation Certification

Certification engines:

- **FinanceCore v1.1.0**
- **FinancialModelCore v1.0.0**
- **LegacyCalculationCore v1.0.0**

Certification status: **PASS — EXPANDED CERTIFIED CALCULATION SCOPE**

This document records formula conventions, validation, permanent regression controls, production routing, build verification, browser evidence and limitations. Source code alone is not considered certified; the claim requires deterministic tests, source-level gates, successful production-artifact verification and production-runtime evidence.

## Core conventions

- Internal rates are decimals: 5% = `0.05`.
- Valid zeroes are data, not missing values.
- Missing or invalid results use `null` or structured invalid/error output instead of fabricated zeroes.
- Financial calculations retain JavaScript numeric precision; display rounding belongs to presentation.
- Drawdown recovery is measured in observations unless timestamps are explicitly supplied.
- Bond YTM is annual nominal yield and periodic yield is `YTM / frequency`.
- XIRR uses a 365-day year basis.
- The certified three-statement model treats detailed COGS, SG&A and R&D assumptions as modeled cost drivers. The separate EBITDA-margin series is a target/diagnostic.
- Certified legacy-hardening paths use explicit finite/presence checks rather than truthiness for financial zero values.

## Certified FinanceCore calculations

The independently tested FinanceCore primitives remain certified: mean, median, variance, standard deviation, covariance, correlation, simple/log return, CAGR, TWR, NPV, IRR, XNPV/XIRR, annualized volatility, beta, maximum drawdown, recovery period, SMA, EMA, MACD, RSI, bond price, Macaulay duration, modified duration, convexity, YTM, DV01, CAPM, WACC, FCFF DCF, Gordon DDM, multi-stage DDM, residual income, comparable-multiple summary, portfolio return, portfolio variance, core accounting ratios, CSV header mapping and large-number scaling.

Production-routed FinanceCore paths include `LoanEngine`, selected `CalcEngine` risk/technical functions, `CsvParser`, selected `BondEngine` methods, `CapmWacc`, `ValuationEngine`, `FinancialRatios`, formatting and compatible legacy `FINANCE` methods.

## Certified three-statement model

`FinancialModelCore v1.0.0` independently replaces the production calculation methods behind `FinancialModelEngine` while preserving legacy rendering helpers.

Certified behavior includes compounded per-year revenue growth; explicit zero growth/tax preservation; detailed COGS/SG&A/R&D EBITDA mechanics; target-margin diagnostics; configured-COGS working capital; simultaneous debt instruments; aggregated interest; zero-rate preservation; principal repayment coupling to debt and cash; non-negative debt balances; actual current-liability covenant denominators; and explicit opening balance-sheet reconciliation rather than a hidden cash plug.

The build also preserves explicit 0% debt rates and zero-valued covenant inputs at the form boundary. The UI labels EBITDA margin as a target to match calculation semantics.

## Certified legacy calculation hardening

`LegacyCalculationCore v1.0.0` promotes selected high-risk legacy calculations into independently testable pure functions while retaining their existing workstation presentation layer.

### StressTestEngine

`StressTestEngine.run` is routed through `LegacyCalculationCore.stressRun`.

Certified behavior includes:

- `revenue` is accepted when `revenue0` is absent;
- explicit zero tax, growth, margin and other valid zero assumptions are preserved;
- zero base PD is preserved rather than converted to 5%;
- invalid zero share count is rejected rather than silently defaulted to one;
- no-shock scenarios reproduce the certified base DCF;
- downside is not divided by a fabricated denominator when base per-share value is zero;
- scenario calculations continue to use the certified FinanceCore DCF.

### PortfolioEngine

`PortfolioEngine.build` and `PortfolioEngine.stress` are routed through `LegacyCalculationCore`.

Certified behavior includes:

- finite, non-negative weights, expected returns and volatilities are required;
- zero total portfolio weight is rejected before normalization;
- explicit zero volatility remains zero;
- missing volatility/expected return is not silently manufactured by the UI boundary;
- pairwise variance uses normalized weights and the hardened path's stated correlation;
- zero-volatility bond stress does not receive a hidden 5% volatility fallback;
- zero-volatility portfolios report Sharpe as unavailable rather than divide by zero.

### ValuationMatrixV2

`ValuationMatrixV2.build` and the calculation behind `ValuationMatrixV2.driversHTML` are routed through `LegacyCalculationCore`.

Certified behavior includes:

- the comparable relative multiple is converted to implied fair price as `current price / relative multiple` instead of returning current price by construction;
- residual-income total equity value is divided by diluted shares before comparison with per-share market price;
- valuation ranges only use finite method values;
- driver sensitivity uses explicit base assumptions and a real non-zero DCF base-value denominator rather than truthy defaults or `baseVal || 1`.

## Permanent regression controls

The original eight controls remain mandatory and passing:

- `REG-BOND-001` modified duration uses `Dmac / (1 + YTM/m)`;
- `REG-DD-001` recovery targets the pre-drawdown peak;
- `REG-MACD-001` MACD histogram is populated and equals line minus signal;
- `REG-FMT-001` 10,000 formats as 10K;
- `REG-CSV-001` column index zero remains valid;
- `REG-STAT-001` even median averages the two center values;
- `REG-RSI-001` a no-loss series produces RSI 100;
- `REG-DCF-001` perpetual-growth DCF rejects `g >= WACC`.

The 15 `FM-REG-*` three-statement controls remain mandatory and passing. They cover growth compounding, zero preservation, statement-derived EBITDA, simultaneous debt instruments, repayment/cash coupling, configured-COGS working capital, covenant denominators, opening reconciliation and debt bounds.

The current pass adds 14 `LC-REG-*` controls:

- `LC-REG-001` stress accepts `revenue` without `revenue0`;
- `LC-REG-002` zero tax is preserved;
- `LC-REG-003` zero growth and zero EBITDA margin are preserved;
- `LC-REG-004` zero base PD is preserved;
- `LC-REG-005` zero scenario shocks reproduce base DCF;
- `LC-REG-006` zero share count is rejected;
- `LC-REG-007` zero total portfolio weight is rejected;
- `LC-REG-008` zero volatility is preserved;
- `LC-REG-009` missing volatility is rejected;
- `LC-REG-010` negative weights are rejected;
- `LC-REG-011` portfolio variance uses normalized weights and stated correlation;
- `LC-REG-012` zero-volatility bond stress remains zero-volatility;
- `LC-REG-013` comparable relative multiple produces implied fair price;
- `LC-REG-014` residual-income total value is converted to per-share value.

## XIRR and ECL production hardening

The workstation's irregular-period `XIRR` object remains routed to the certified FinanceCore XNPV/XIRR implementation using the documented 365-day convention.

`ECLV2` validates finite PD/recovery in `[0,1]` and non-negative EAD. Missing inputs do not silently enter arithmetic, and a legitimate EAD of zero remains zero.

## Independent bond reference

Semiannual reference input: face 1,000; annual coupon cash 50; YTM 6%; maturity 10 years; frequency 2.

- Price: `925.6126256977221`
- Macaulay duration: `7.894997340182341` years
- Modified duration: `7.665045961342078` years

## Production build hardening

The deterministic build embeds FinanceCore, FinancialModelCore, LegacyCalculationCore and the runtime installer into the portable single-file workstation. It also retains narrow compatibility repairs for bond frequency, recovery units, the offline Cloudflare payload removal, safe SVG attributes, heatmap interpolation scope, zero-preserving model fields and the EBITDA-target label.

The current pass additionally hardens the portfolio form boundary so missing expected-return/volatility metrics are not invented and invalid portfolio data receives visible validation feedback.

## Verification stack

Expanded certification evidence for workflow run **34465608904**:

- source commit tested: `4fb8ccc8f1a5bbecdf367319e4b691c1ee83f0ff`;
- generated evidence / deployable commit: `0ab5418da7ea3773278504446d7dab45a83f67de`;
- certified source gate: **60/60 PASS**;
- Node unit/regression/known-answer/runtime tests: **169/169 PASS**;
- production artifact verification: **45/45 PASS**;
- standalone generated HTML: **1,038,299 bytes** as reported by the build;
- static/contextual audit: **428/428 leads enumerated and classified, 0 unclassified**;
- calculation-sensitive / algorithmic-review leads: **221**;
- Chromium desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 14/14 runtime checks**;
- Firefox desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 14/14 runtime checks**;
- WebKit desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 14/14 runtime checks**;
- Chromium mobile 390×844: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 14/14 runtime checks**, with no document-level horizontal overflow and a functioning mobile menu/sidebar.

Browser runtime checks cover median, NPV, IRR, modified duration, recovery, MACD, RSI, DCF rejection, the certified three-statement model, XIRR, ECL, stress testing, portfolio analysis and the multi-method valuation matrix.

## Certification boundary

The generated application remains a large legacy single-file product with analytical helpers outside the certified mapping. `STATIC_AUDIT_FINDINGS.md` deliberately over-matches truthy guards, `|| 0`, rounding, parser conversions and numeric sentinels. Its **221 calculation-sensitive / algorithmic-review entries are review leads, not 221 proven defects**.

The certification claim is intentionally precise: **FinanceCore, FinancialModelCore, LegacyCalculationCore, and the production calculation paths explicitly mapped/tested through them are certified; XIRR and ECL are additionally certified at their production runtime boundary. Other legacy analytical helpers remain outside the certification boundary unless separately tested and promoted.** Cross-browser application smoke proves broad runtime compatibility, not every mathematical combination of every legacy helper.

## Final certification status

**PASS — EXPANDED CERTIFIED CALCULATION SCOPE.**

Repository-level commands and evidence are recorded in `FINANCIAL_TEST_REPORT.md`; remaining product/model limitations are documented in `KNOWN_LIMITATIONS.md`.