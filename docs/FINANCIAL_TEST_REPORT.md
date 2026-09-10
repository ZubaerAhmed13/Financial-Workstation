# Financial Test Report

## Final status

**PASS — EXPANDED CERTIFIED CALCULATION SCOPE**

The independently tested calculation cores, explicitly mapped production paths, generated standalone workstation, desktop cross-browser passes, and mobile responsive pass satisfy the repository certification gates for the current boundary.

## Verified evidence

- Risk/credit expansion workflow run: **34472841478**
- Generated evidence/deployable branch commit: `6d0a2199344d6cbdfb5e19657f78ece84c74833d`
- FinanceCore: **v1.1.0**
- FinancialModelCore: **v1.0.0**
- LegacyCalculationCore: **v1.0.0**
- RiskCreditCore: **v1.0.0**
- Certified source gate: **84/84 passed** (60 positive structure/routing controls + 24 banned-pattern absence controls)
- Automated Node tests: **202/202 passed, 0 failed**
- Original named regressions: **8/8 passing**
- Three-statement regressions: **15/15 passing**
- Legacy hardening regressions: **14/14 passing**
- Risk/credit regressions: **22/22 passing**
- Production artifact verification: **65/65 passed**
- Generated standalone HTML: **1,055,772 bytes**
- Contextual static audit: **435/435 leads enumerated/classified, 0 unclassified**
- Calculation-sensitive / algorithmic-review leads: **226**. These are review leads, not confirmed defects.

## Browser evidence

The same generated standalone artifact passes all four CI targets:

| Target | Views | Tabs | Page errors | Console errors | External requests | Runtime checks | Layout |
|---|---:|---:|---:|---:|---:|---:|---|
| Chromium desktop | 42/42 | 59 | 0 | 0 | 0 | 17/17 | no body overflow |
| Firefox desktop | 42/42 | 59 | 0 | 0 | 0 | 17/17 | no body overflow |
| WebKit desktop | 42/42 | 59 | 0 | 0 | 0 | 17/17 | no body overflow |
| Chromium mobile 390×844 | 42/42 | 59 | 0 | 0 | 0 | 17/17 | no body overflow; menu visible and opens |

The browser-level runtime assertions cover median, NPV, IRR, modified duration, recovery, MACD, RSI, DCF rejection, the three-statement model, XIRR, ECL, stress testing, portfolio analysis, the multi-method valuation matrix, risk/VaR calculations, credit curves/Altman, and Merton diagnostics.

## Newly closed risk/credit defects

This pass fixes and permanently tests these production problems:

- **Parametric VaR confidence handling:** arbitrary valid confidence levels use an inverse-normal quantile instead of silently falling back to 95% when the input is not exactly 99%.
- **Historical VaR / Expected Shortfall:** empirical quantiles are interpolated and ES handles fractional lower-tail mass rather than relying on a brittle integer cutoff.
- **Monte Carlo VaR/ES denominators:** non-positive current value is rejected instead of dividing by zero.
- **Imported-history annualization:** periods/year are inferred from timestamp cadence (daily, weekly, monthly, quarterly, semiannual, annual). When timestamps are insufficient, the legacy 252 fallback is explicitly marked rather than silently assumed.
- **Sharpe/Sortino scale:** the hardened risk summary annualizes periodic risk-adjusted returns consistently with periods/year.
- **Altman validation:** zero numerators remain valid financial data; missing/zero required denominators return unavailable rather than fabricated ratios.
- **Credit PD interpolation:** intermediate horizons use their actual horizon weight; for example BBB 7-year cumulative PD is linearly interpolated to `0.064` between 5-year `0.04` and 10-year `0.10`, rather than using a midpoint that corresponds to 7.5 years.
- **Credit-curve extrapolation:** horizons outside the configured table are not silently extrapolated.
- **Merton structural model:** inputs are validated, asset value is solved by bounded bisection, volatility iteration must meet explicit residual tolerances, and PD is returned only after convergence.
- **Merton diagnostics:** actual distance-to-default is propagated; the report no longer overwrites it with literal zero.
- **ECL missing data:** legitimate zero PD/EAD is preserved and missing EAD remains missing; the UI/runtime no longer manufactures an exposure of 1,000,000.

## Production-routed certified paths

The runtime installer now routes tested calculation code into production for:

- `LoanEngine.npv` / `LoanEngine.irr`;
- selected `CalcEngine` return/risk/technical calculations, including cadence inference and annualized risk summary;
- CSV price-series import and header detection;
- bond modified duration, price sensitivity and DV01;
- CAPM/WACC;
- DCF, DDM, residual income and comparables;
- core financial ratios and large-number formatting;
- `FinancialModelEngine.defaults`, `fillDefaults` and `build`;
- irregular-date XNPV/XIRR;
- validated ECL;
- stress testing, portfolio construction/stress and multi-method valuation through `LegacyCalculationCore`;
- historical/parametric/Monte-Carlo VaR and Expected Shortfall through `RiskCreditCore`;
- Altman Z/Z-prime, rating PD interpolation, credit curves, Merton and Merton diagnostics through `RiskCreditCore`.

Legacy rendering/presentation helpers remain intact unless a narrow build-boundary correction is explicitly verified.

## Permanent regression controls

The prior **8 `REG-*`**, **15 `FM-REG-*`**, and **14 `LC-REG-*`** controls remain mandatory and passing.

The current pass adds **22 `RC-REG-*`** controls covering:

- arbitrary-confidence inverse-normal VaR;
- interpolated empirical VaR and fractional-tail ES;
- Monte Carlo denominator validation and zero terminal value handling;
- daily/weekly/monthly cadence inference;
- annualized Sharpe and zero-volatility semantics;
- Altman zero/missing denominator behavior;
- correct in-range PD interpolation and no out-of-range extrapolation;
- zero-preserving expected loss and invalid probability validation;
- Merton convergence, debt sensitivity, horizon validation, residual tolerances and actual distance-to-default propagation.

## Retained model/runtime hardening

The previous releases remain certified: three-statement growth/debt/cash/working-capital/reconciliation mechanics; zero-preserving debt/covenant form boundaries; XIRR using a 365-day basis; stress zero semantics; portfolio validation and variance/stress handling; comparable fair-price conversion; residual-income per-share conversion; and value-driver denominator safety.

## CI gates

The workflow validates source syntax, the **84-check source gate**, all **202 Node tests**, the production single-file build, regex/contextual audits, the **65-check artifact gate**, then installs pinned Playwright **1.55.0** and exercises Chromium, Firefox, WebKit, and Chromium mobile. Certification branches regenerate the root artifact and deterministic browser/static-audit evidence.

## Static-audit inventory and certification boundary

`STATIC_AUDIT_FINDINGS.md` inventories **435 broad regex leads** with **0 unclassified**. **226** are conservatively categorized as calculation-sensitive or algorithmic-review. This deliberately over-matches defaults, guards, parser behavior, rounding, sentinels, and legacy implementations that may be superseded by certified runtime routing; it is not a list of 226 proven bugs.

The certification claim is precise: **FinanceCore, FinancialModelCore, LegacyCalculationCore, RiskCreditCore, and the production paths explicitly mapped and tested through them are certified, together with the narrow build-boundary corrections documented above. Other legacy analytical helpers remain outside the formal boundary until separately tested and promoted.** Broad browser smoke proves application/runtime compatibility, not every mathematical combination of every helper.

## Conclusion

**PASS — EXPANDED CERTIFIED CALCULATION SCOPE.**

The high-risk risk/credit/frequency defects identified in this pass are now routed through independently testable code with permanent regressions and verified in the generated offline workstation across Chromium, Firefox, WebKit and the mobile responsive target.
