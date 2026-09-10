# Financial Calculation Certification

Certification engines:

- **FinanceCore v1.1.0**
- **FinancialModelCore v1.0.0**
- **LegacyCalculationCore v1.0.0**
- **RiskCreditCore v1.0.0**

Certification status: **PASS — EXPANDED CERTIFIED CALCULATION SCOPE**

This document records formula conventions, validation, permanent regressions, production routing, build verification, browser evidence, and limitations. Source code alone is not considered certified: the claim requires deterministic tests, source gates, generated-artifact verification, and production-runtime evidence.

## Core conventions

- Internal rates are decimals (`5% = 0.05`).
- Valid zeroes are data, not missing values.
- Missing/invalid results return `null` or structured error output instead of fabricated zeroes.
- JavaScript numeric precision is retained internally; display rounding belongs to presentation.
- Bond YTM is annual nominal yield and periodic yield is `YTM / frequency`.
- XIRR uses a 365-day year basis.
- Price-history recovery is expressed in observations unless timestamps are explicitly used.
- Risk annualization requires a periods/year basis. The certified production path infers cadence from timestamps when possible and explicitly marks the 252 fallback when cadence cannot be inferred.
- The three-statement model uses detailed COGS/SG&A/R&D assumptions as modeled cost drivers; its EBITDA-margin series is a target/diagnostic.
- Certified hardening paths use finite/presence checks rather than truthiness for financial zeroes.

## Certified FinanceCore

FinanceCore remains certified for statistical primitives; returns/CAGR/TWR; NPV/IRR/XNPV/XIRR; drawdown/recovery; SMA/EMA/MACD/RSI; bond price/duration/convexity/YTM/DV01; CAPM/WACC; DCF/DDM/residual income/comparable summaries; portfolio primitives; core financial ratios; CSV mapping; and number scaling.

Production routes include `LoanEngine`, selected `CalcEngine` functions, `CsvParser`, selected `BondEngine` methods, `CapmWacc`, `ValuationEngine`, `FinancialRatios`, formatting, and compatible legacy `FINANCE` methods.

## Certified FinancialModelCore

`FinancialModelCore v1.0.0` replaces the production calculation methods behind `FinancialModelEngine` while retaining legacy presentation helpers.

Certified behavior includes compounded revenue growth; zero growth/tax preservation; detailed statement-derived EBITDA; target-margin diagnostics; configured-COGS working capital; simultaneous debt instruments; aggregated interest; zero-rate preservation; principal repayment coupling to debt/cash; non-negative debt balances; actual current-liability covenant denominators; and explicit opening balance-sheet reconciliation instead of a hidden cash plug.

## Certified LegacyCalculationCore

`LegacyCalculationCore v1.0.0` promotes selected high-risk monolith calculations into independently testable pure functions.

### Stress testing

`StressTestEngine.run` is routed through `LegacyCalculationCore.stressRun`. The route accepts `revenue` when `revenue0` is absent, preserves valid zero assumptions and zero PD, rejects invalid zero share count, reproduces base DCF under a no-shock scenario, and avoids fabricated downside denominators.

### Portfolio

`PortfolioEngine.build` / `stress` require finite non-negative weights, returns, and volatility; reject zero total weight; preserve zero volatility; use normalized weights with the stated pairwise correlation; and do not inject hidden volatility into bond stress.

### Multi-method valuation

`ValuationMatrixV2` uses `current price / relative multiple` for comparable fair value, converts residual-income total equity value to per-share value, excludes non-finite method values, and uses explicit DCF base assumptions/denominators in value-driver sensitivity.

## Certified RiskCreditCore

`RiskCreditCore v1.0.0` is independently tested and mapped into production for high-risk market-risk and credit calculations.

### VaR and Expected Shortfall

- Historical VaR uses an interpolated empirical quantile.
- Expected Shortfall averages the lower tail, including fractional tail mass where sample size does not make the tail count an integer.
- Parametric VaR uses an inverse-normal approximation for any valid confidence in `(0,1)` rather than a 95/99-only branch.
- Monte Carlo VaR/ES converts terminal values to returns only when current value is finite and positive.
- Missing/invalid risk inputs return unavailable rather than a fabricated result.

### Frequency-aware risk statistics

The production imported-history path calls `RiskCreditCore.inferPeriodsPerYear` using price timestamps. It distinguishes daily, weekly, monthly, quarterly, semiannual, and annual cadence from median timestamp spacing. The annualized risk summary consistently applies that frequency to return, volatility, Sharpe and Sortino. When timestamps do not support inference, the legacy 252 fallback is retained only as an explicitly tagged fallback.

### Altman models

Altman Z and Z-prime preserve legitimate zero numerators while requiring finite, non-zero denominators where division is required. Missing/invalid ratio inputs return unavailable rather than silently coercing data.

### Rating PD and credit curves

The configured cumulative-PD table is treated as an illustrative model input. Exact configured horizons are returned directly; intermediate horizons are linearly interpolated using their true relative horizon position. No extrapolation is performed outside the configured range. Example: BBB 7-year cumulative PD is `0.064` between 5-year `0.04` and 10-year `0.10`.

### Merton structural credit model

The certified Merton path validates positive finite equity, debt, volatility, and horizon inputs; solves asset value with bounded bisection; iterates asset volatility; checks both equity-value and volatility residuals; and reports PD only when convergence tolerances are met. Merton diagnostics propagate the actual solved distance-to-default rather than a hard-coded zero.

### ECL boundary

Expected loss validates PD and recovery in `[0,1]` and non-negative EAD. Valid zero PD/EAD remains zero. Missing EAD remains missing; production no longer manufactures an EAD of 1,000,000.

## Permanent regression controls

All prior controls remain mandatory:

- **8 `REG-*`** controls for bond duration, drawdown recovery, MACD, formatting, CSV index zero, median, RSI, and DCF terminal-growth validation;
- **15 `FM-REG-*`** controls for the three-statement model;
- **14 `LC-REG-*`** controls for stress, portfolio, comparable valuation, residual-income per-share conversion, and related zero/denominator semantics.

This pass adds **22 `RC-REG-*`** controls for arbitrary-confidence VaR, historical VaR/ES, Monte Carlo denominator safety, cadence inference, annualized Sharpe, zero-volatility semantics, Altman validation, PD interpolation/no extrapolation, expected-loss zero/invalid handling, and Merton convergence/sensitivity/diagnostics.

## Production build hardening

The deterministic build embeds all four cores plus the runtime installer into the portable single-file workstation. It retains narrow compatibility repairs for bond frequency, recovery units, offline Cloudflare removal, SVG attributes, heatmap interpolation scope, model zero semantics, portfolio input validation, and the EBITDA-target label.

This pass additionally refuses the build unless it can verify:

- timestamp-aware risk annualization metadata is installed and the old hard-coded 252 block is absent;
- zero/missing-safe ECL boundaries are installed and the synthetic 1,000,000 exposure fallback is absent;
- the report propagates actual Merton distance-to-default and the old hard-coded zero path is absent.

## Verification stack

Risk/credit expansion evidence for workflow **34472841478**:

- generated evidence/deployable branch commit: `6d0a2199344d6cbdfb5e19657f78ece84c74833d`;
- source gate: **84/84 PASS**;
- Node unit/regression/known-answer/runtime tests: **202/202 PASS**;
- artifact verification: **65/65 PASS**;
- standalone HTML: **1,055,772 bytes**;
- static/contextual audit: **435/435 leads classified, 0 unclassified**;
- calculation-sensitive/algorithmic-review leads: **226**;
- Chromium desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 17/17 runtime checks**;
- Firefox desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 17/17 runtime checks**;
- WebKit desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 17/17 runtime checks**;
- Chromium mobile 390×844: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 17/17 runtime checks**, with no document-level horizontal overflow and a functioning menu/sidebar.

## Certification boundary

`STATIC_AUDIT_FINDINGS.md` intentionally over-matches generic guards, numeric fallbacks, parser conversions, rounding, sentinels, and legacy implementations. The **226 calculation-sensitive/algorithmic-review entries are review leads, not 226 proven defects**.

The certification claim is deliberately precise: **FinanceCore, FinancialModelCore, LegacyCalculationCore, RiskCreditCore, and the production paths explicitly routed/tested through them are certified, together with documented build-boundary corrections. Other legacy analytical helpers remain outside the formal boundary until separately tested and promoted.** Cross-browser smoke verifies broad execution compatibility, not every possible financial input combination.

## Final status

**PASS — EXPANDED CERTIFIED CALCULATION SCOPE.**

Repository-level evidence is summarized in `FINANCIAL_TEST_REPORT.md`; model/product limitations are maintained in `KNOWN_LIMITATIONS.md`.
