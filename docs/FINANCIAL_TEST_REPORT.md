# Financial Test Report

## Final status

**PASS — COMPLETE MODULAR CALCULATION CERTIFICATION SLICE**

The independently tested calculation cores, explicitly mapped production paths, generated standalone workstation, desktop cross-browser passes, mobile responsive pass, and final workstation-route browser suite satisfy the repository certification gates for the current documented boundary.

## Verified evidence

- Full completion workflow run: **34497988919** (run #87)
- Tested source head: `895d8a1e886784d5d920a291d77eb3a223bc27a5`
- Generated evidence/deployable branch commit: `cbdb4c9ab0f05f7e538e6465324630484114c949`
- FinanceCore: **v1.1.0**
- FinancialModelCore: **v1.0.0**
- LegacyCalculationCore: **v1.0.0**
- RiskCreditCore: **v1.0.0**
- WorkstationCalculationCore: **v1.0.0**
- WorkstationLedgerCore: **v1.0.0**
- SimulationBacktestCore: **v1.0.0**
- Certified source gate: **84/84 passed** (60 positive structure/routing controls + 24 banned-pattern absence controls)
- Final workstation source/ownership gate: **62/62 passed** (52 positive controls + 10 banned-pattern controls)
- Automated Node tests: **277/277 passed, 0 failed**
- Production artifact verification: **65/65 passed**
- Final workstation artifact verification: **38/38 passed**
- Generated standalone HTML: **1,108,820 bytes**
- Contextual static audit: **451/451 broad leads enumerated/classified, 0 unclassified**
- Calculation-sensitive / algorithmic-review leads: **231**. These are review leads, not confirmed defects.
- Legacy calculation inventory: **36 targets / 85 occurrences**

## Permanent regression coverage

The integrated suite retains all previous regression families and adds the final modularization controls:

- **8 `REG-*`** original regressions;
- **15 `FM-REG-*`** three-statement regressions;
- **14 `LC-REG-*`** legacy stress/portfolio/valuation regressions;
- **22 `RC-REG-*`** risk/credit regressions;
- **32 `WC-REG-*`** workstation calculation regressions;
- **12 `WL-REG-*`** workstation ledger regressions;
- **12 `SB-REG-*`** simulation/backtest regressions;
- **19 `WR-REG-*`** workstation production-routing regressions.

The simulation/backtest regressions specifically certify zero-preserving Monte Carlo inputs, non-positive initial-capital rejection, deterministic seeded simulation, simulation/step validation, exact zero-volatility target behavior, backtest capital/rebalance validation, no current-bar lookahead, turnover/slippage costs, two-sided flip costs, filtered-signal alignment, timestamp-based cadence inference, and benchmark active-return annualization on the same basis.

## Browser evidence

The same generated standalone artifact passes all four primary browser-smoke targets:

| Target | Views | Tabs | Page errors | Console errors | External requests | Runtime checks | Layout |
|---|---:|---:|---:|---:|---:|---:|---|
| Chromium desktop | 42/42 | 59 | 0 | 0 | 0 | 17/17 | no body overflow |
| Firefox desktop | 42/42 | 59 | 0 | 0 | 0 | 17/17 | no body overflow |
| WebKit desktop | 42/42 | 59 | 0 | 0 | 0 | 17/17 | no body overflow |
| Chromium mobile 390×844 | 42/42 | 59 | 0 | 0 | 0 | 17/17 | no body overflow; menu visible and opens |

The primary runtime assertions cover median, NPV, IRR, modified duration, recovery, MACD, RSI, DCF rejection, the three-statement model, XIRR, ECL, stress testing, portfolio analysis, the multi-method valuation matrix, risk/VaR calculations, credit curves/Altman, and Merton diagnostics.

A separate final workstation-route browser suite also passes **15/15 checks on every one of the four targets**, with zero page errors, zero console errors, and zero external HTTP(S) requests. Those checks cover core versions, data-quality scoring, peer zero-coverage semantics, attribution, risk contribution, optimizer behavior, withdrawals, dividends, performance calculations, segment forecasting, SOTP, Monte Carlo, backtesting, backtest cadence, and production-route ownership.

## Final modular calculation promotions

### Workstation calculations

`WorkstationCalculationCore v1.0.0` owns the promoted calculation paths behind similarity/scoring, data quality, peer coverage, factor exposure, performance attribution, risk contribution, portfolio optimizers, FX conversion, TWR/MWR/annualization, capture ratios, performance risk, period returns, segment forecasting and SOTP-related calculations that are explicitly routed and regression-tested.

### Workstation ledger

`WorkstationLedgerCore v1.0.0` owns the promoted transaction/portfolio-ledger calculations explicitly routed through the workstation runtime, including dividend amounts, ledger reconstruction, position base value, market-value summary, cash summary and position unrealized P&L. Valid zeroes are preserved and malformed financial inputs are not silently converted into fabricated amounts.

### Monte Carlo

`MonteCarlo.run` is routed through `SimulationBacktestCore.monteCarloRun`. The certified path validates configuration, preserves legitimate zero expected return and zero volatility, rejects non-positive initial capital, uses deterministic seeded GBM for reproducible regression evidence, and avoids truthy fallbacks that would manufacture assumptions.

### Backtesting

`BacktestEngine.run` is routed through `SimulationBacktestCore.backtestRun`. The certified path prevents current-close signals from earning the already-completed same-bar return, retains original signal alignment when date filters are applied, deducts turnover-based transaction costs/slippage when turnover occurs, charges two-sided turnover on direct position flips, validates initial capital and rebalance intervals, and infers annualization cadence from timestamps rather than blindly applying 252 periods/year.

## Production-routed certified paths

The runtime installers now route tested calculation code into production for the previously certified finance/model/legacy/risk-credit paths plus the final workstation slice. This includes:

- `LoanEngine.npv` / `LoanEngine.irr`, selected `CalcEngine` functions, CSV import, bond analytics, CAPM/WACC, valuation, financial ratios, model engine, XIRR and ECL;
- stress, portfolio construction/stress and multi-method valuation via `LegacyCalculationCore`;
- VaR/ES, cadence-aware risk, Altman, rating PD/credit curves and Merton via `RiskCreditCore`;
- `SimilarityEngine`, `DataQualityEngine.score`, `ScoringEngine.score`, `PeerSimilarity.score`, factor exposure, attribution, risk contribution and portfolio optimizers via `WorkstationCalculationCore`;
- routed workstation ledger/value/cash/unrealized calculations via `WorkstationLedgerCore`;
- workstation performance helpers explicitly installed through `WorkstationCalculationCore`;
- `MonteCarlo.run` and `BacktestEngine.run` via `SimulationBacktestCore`.

Legacy rendering, UI, orchestration, and composition helpers remain intact unless a narrow build-boundary correction is explicitly verified.

## CI gates

The completion workflow validates source syntax; the **84-check certified-core gate**; the **62-check workstation ownership/source gate**; all **277 Node tests**; the deterministic single-file production build; regex/contextual audits; the **65-check existing artifact gate**; the **38-check final workstation artifact gate**; pinned Playwright **1.55.0** browser smoke across Chromium, Firefox, WebKit and Chromium mobile; and the separate 15-check final workstation-route suite across those same four targets. Certification branches regenerate deterministic evidence only when generated evidence actually changes.

## Static-audit inventory and certification boundary

`STATIC_AUDIT_FINDINGS.md` inventories **451 broad regex leads** with **0 unclassified**. **231** are conservatively categorized as calculation-sensitive or algorithmic-review. This deliberately over-matches defaults, guards, parser behavior, rounding, sentinels, and legacy implementations that may already be superseded by certified runtime routing; it is not a list of 231 proven bugs.

The certification claim is deliberately precise: **FinanceCore, FinancialModelCore, LegacyCalculationCore, RiskCreditCore, WorkstationCalculationCore, WorkstationLedgerCore, SimulationBacktestCore, and only the production calculation paths explicitly routed and tested through those cores are certified, together with documented narrow build-boundary corrections. Legacy UI/rendering/orchestration/composition wrappers are not automatically independently algorithm-certified merely because they call a certified core. Other unrouted legacy analytical helpers remain outside the formal boundary until separately tested and promoted.** Browser smoke verifies application/runtime compatibility and the named production routes; it does not prove every mathematical combination of every input.

## Conclusion

**PASS — COMPLETE MODULAR CALCULATION CERTIFICATION SLICE.**

The identified high-risk calculation routes in this phase, including the final Monte Carlo and backtest paths, are now independently testable, permanently regression-controlled, routed into the generated offline workstation, and exercised through public production APIs across Chromium, Firefox, WebKit and the mobile responsive target. Final release status still depends on the exact-head branch/PR/main CI and Pages checks recorded by the release chain.
