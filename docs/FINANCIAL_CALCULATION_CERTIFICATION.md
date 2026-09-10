# Financial Calculation Certification

Certification engines:

- **FinanceCore v1.1.0**
- **FinancialModelCore v1.0.0**
- **LegacyCalculationCore v1.0.0**
- **RiskCreditCore v1.0.0**
- **WorkstationCalculationCore v1.0.0**
- **WorkstationLedgerCore v1.0.0**
- **SimulationBacktestCore v1.0.0**

Certification status: **PASS — COMPLETE MODULAR CALCULATION CERTIFICATION SLICE**

This document records formula conventions, validation, permanent regressions, production routing, build verification, browser evidence, and limitations. Source code alone is not considered certified: the claim requires deterministic tests, source/ownership gates, generated-artifact verification, and production-runtime evidence.

## Core conventions

- Internal rates are decimals (`5% = 0.05`).
- Valid zeroes are data, not missing values.
- Missing/invalid results return `null`, structured errors, or an explicit unavailable state rather than fabricated zeroes/defaults.
- JavaScript numeric precision is retained internally; display rounding belongs to presentation.
- Bond YTM is annual nominal yield and periodic yield is `YTM / frequency`.
- XIRR uses a 365-day year basis.
- Price-history recovery is expressed in observations unless timestamps are explicitly used.
- Risk/backtest annualization requires a periods/year basis. Certified routed paths infer cadence from timestamps where supported rather than silently assuming 252.
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

`StressTestEngine.run` is routed through `LegacyCalculationCore.stressRun`; `PortfolioEngine.build` / `stress` use validated finite non-negative inputs and zero-safe volatility semantics; and `ValuationMatrixV2` uses corrected comparable fair-price conversion, residual-income per-share conversion, finite-value filtering, and explicit driver denominators.

## Certified RiskCreditCore

`RiskCreditCore v1.0.0` is independently tested and mapped into production for high-risk market-risk and credit calculations.

Certified paths include interpolated historical VaR and fractional-tail Expected Shortfall; arbitrary valid-confidence parametric VaR; safe Monte-Carlo VaR/ES terminal-value conversion; timestamp-cadence inference and annualized risk statistics; Altman Z/Z-prime validation; rating-PD interpolation without out-of-range extrapolation; credit curves; bounded/convergence-checked Merton structural credit modeling with actual distance-to-default diagnostics; and zero/missing-safe ECL boundaries.

## Certified WorkstationCalculationCore

`WorkstationCalculationCore v1.0.0` promotes the final workstation calculation families that were previously embedded in the monolith/runtime surface. Explicitly routed and tested paths include:

- similarity standardization, similarity score and normalized weights;
- data-quality scoring, preference scoring and peer-data coverage;
- factor exposure and performance attribution;
- portfolio risk contribution;
- equal-weight, minimum-variance, maximum-Sharpe and risk-parity optimizer calculations;
- FX conversion used by the routed workstation boundary;
- time-weighted and money-weighted return helpers, annualization, capture ratios, performance risk and period returns;
- the explicitly promoted segment-forecast and SOTP calculation paths covered by the workstation regression/runtime/browser gates.

The certified behavior emphasizes denominator validation, finite-input validation, legitimate-zero preservation, deterministic ownership, and explicit treatment of unavailable calculations instead of hidden truthy defaults.

## Certified WorkstationLedgerCore

`WorkstationLedgerCore v1.0.0` owns the explicitly routed workstation transaction/portfolio-ledger calculations. Certified routes cover dividend amount handling, ledger reconstruction, position base value, market-value summary, cash summary and position unrealized P&L. Zero amounts remain valid where financially meaningful; malformed/missing values are not silently converted into synthetic ledger values.

## Certified SimulationBacktestCore

`SimulationBacktestCore v1.0.0` owns the final Monte Carlo and backtest calculation routes.

### Monte Carlo

`MonteCarlo.run` is routed through `SimulationBacktestCore.monteCarloRun`. The certified path:

- preserves explicit zero expected return and zero volatility;
- rejects non-positive/invalid initial capital rather than replacing it with a hidden default;
- validates simulation and step counts plus deterministic seed inputs;
- uses seeded geometric-Brownian-motion simulation for reproducible certification tests;
- produces exact deterministic behavior for zero-volatility cases subject to the configured drift/target assumptions.

### Backtesting

`BacktestEngine.run` is routed through `SimulationBacktestCore.backtestRun`. The certified path:

- rejects non-positive initial capital and invalid rebalance intervals;
- prevents a signal based on the current close from earning the return that has already occurred on that same bar;
- preserves signal/index alignment after date filtering;
- applies turnover-based transaction cost/slippage deductions when turnover occurs;
- charges two-sided turnover for direct position flips;
- infers annualization cadence from timestamps rather than blindly assuming 252 observations/year;
- compares benchmark and strategy annualized performance on the same inferred basis.

## Permanent regression controls

All prior regression families remain mandatory, with the final completion slice adding workstation, ledger, simulation/backtest and production-route controls:

- **8 `REG-*`** original calculation regressions;
- **15 `FM-REG-*`** three-statement regressions;
- **14 `LC-REG-*`** legacy stress/portfolio/valuation regressions;
- **22 `RC-REG-*`** risk/credit regressions;
- **32 `WC-REG-*`** workstation calculation regressions;
- **12 `WL-REG-*`** workstation ledger regressions;
- **12 `SB-REG-*`** simulation/backtest regressions;
- **19 `WR-REG-*`** production-route/runtime regressions.

The integrated Node suite contains **277/277 passing tests**.

## Production build hardening

The deterministic build embeds the certified core family plus both runtime installers into the portable single-file workstation. Existing narrow compatibility repairs remain covered by artifact checks. The final workstation build verification additionally proves the promoted workstation/ledger/simulation cores and public production routes are embedded and that identified obsolete calculation ownership/fallback patterns are absent from the generated artifact where the gate requires absence.

## Verification stack

Full completion evidence for workflow **34497988919** (run #87):

- tested source head: `895d8a1e886784d5d920a291d77eb3a223bc27a5`;
- generated evidence/deployable branch commit: `cbdb4c9ab0f05f7e538e6465324630484114c949`;
- existing certified source gate: **84/84 PASS**;
- final workstation source/ownership gate: **62/62 PASS**;
- Node unit/regression/known-answer/runtime tests: **277/277 PASS**;
- existing artifact verification: **65/65 PASS**;
- final workstation artifact verification: **38/38 PASS**;
- standalone HTML: **1,108,820 bytes**;
- static/contextual audit: **451/451 broad leads classified, 0 unclassified**;
- calculation-sensitive/algorithmic-review leads: **231**;
- legacy calculation inventory: **36 targets / 85 occurrences**;
- Chromium desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 17/17 primary runtime checks**;
- Firefox desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 17/17 primary runtime checks**;
- WebKit desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 17/17 primary runtime checks**;
- Chromium mobile 390×844: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 17/17 primary runtime checks**, with no document-level horizontal overflow and a functioning menu/sidebar;
- separate final workstation-route suite: **15/15 checks on Chromium, Firefox, WebKit and Chromium mobile**, with zero page errors, console errors, and external requests on each target.

## Source and artifact ownership gates

The two source gates are intentionally reported separately rather than combined into a misleading single score. The **84-check gate** protects the previously certified finance/model/legacy/risk-credit surface. The **62-check workstation gate** protects final workstation calculation ownership/routing and relevant banned-pattern controls.

Likewise, the **65-check existing artifact gate** and **38-check workstation artifact gate** are independently required. Together they establish that the intended modular cores and routes survive the actual single-file production build rather than existing only in source modules.

## Static audit and certification boundary

`STATIC_AUDIT_FINDINGS.md` intentionally over-matches generic guards, numeric fallbacks, parser conversions, rounding, sentinels, and legacy implementations. The current artifact contains **451 broad review leads**, of which **231** are conservatively categorized as calculation-sensitive or algorithmic-review, with **0 unclassified**. These are an audit inventory, **not 231 proven defects**.

The certification claim is deliberately precise: **FinanceCore, FinancialModelCore, LegacyCalculationCore, RiskCreditCore, WorkstationCalculationCore, WorkstationLedgerCore, SimulationBacktestCore, and only the production calculation paths explicitly routed/tested through those cores are certified, together with documented narrow build-boundary corrections. Legacy UI, rendering, orchestration, and composition wrappers are not automatically independently algorithm-certified merely because they delegate to a certified core. Other unrouted legacy analytical helpers remain outside the formal boundary until separately tested and promoted.** Cross-browser smoke proves broad execution compatibility and the named routed checks, not every possible financial input combination.

## Final status

**PASS — COMPLETE MODULAR CALCULATION CERTIFICATION SLICE.**

Repository-level evidence is summarized in `FINANCIAL_TEST_REPORT.md`; model/product limitations are maintained in `KNOWN_LIMITATIONS.md`. Release completion additionally requires the stable exact-head branch run, PR-context run, merged `main` certification and GitHub Pages deployment to succeed on their corresponding SHAs.
