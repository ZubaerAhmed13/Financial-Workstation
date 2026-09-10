# Financial Test Report

## Final status

**PASS — EXPANDED CERTIFIED CALCULATION SCOPE**

The hardened calculation cores, explicitly mapped production runtime paths, generated single-file application, desktop cross-browser passes, and mobile responsive pass satisfy the repository certification gates for the current certification boundary.

## Final verified evidence

- Expanded certification workflow run: **34465608904**
- Source commit tested: `4fb8ccc8f1a5bbecdf367319e4b691c1ee83f0ff`
- Generated evidence / deployable artifact commit: `0ab5418da7ea3773278504446d7dab45a83f67de`
- FinanceCore: **v1.1.0**
- FinancialModelCore: **v1.0.0**
- LegacyCalculationCore: **v1.0.0**
- Certified source-structure gate: **60/60 passed**
- Automated Node tests: **169/169 passed**
- Original permanent named regressions: **8/8 passing**
- Three-statement model regressions: **15/15 passing**
- Legacy-calculation hardening regressions: **14/14 passing**
- Production artifact verification: **45/45 passed**
- Generated standalone HTML size reported by the build: **1,038,299 bytes**
- Contextual static audit: **428/428 leads enumerated/classified, 0 unclassified**
- Calculation-sensitive / algorithmic-review leads: **221**; these are review leads, not confirmed defects.

## Browser evidence

All four CI browser targets passed on the generated standalone artifact:

| Target | Views | Tabs | Page errors | Console errors | External requests | Runtime checks | Layout |
|---|---:|---:|---:|---:|---:|---:|---|
| Chromium desktop | 42/42 | 59 | 0 | 0 | 0 | 14/14 | no body overflow |
| Firefox desktop | 42/42 | 59 | 0 | 0 | 0 | 14/14 | no body overflow |
| WebKit desktop | 42/42 | 59 | 0 | 0 | 0 | 14/14 | no body overflow |
| Chromium mobile 390×844 | 42/42 | 59 | 0 | 0 | 0 | 14/14 | no body overflow; menu visible and opens |

The 14 browser-level runtime assertions cover `median`, NPV, IRR, modified duration, recovery, MACD, RSI, the DCF guard, the three-statement model, XIRR, ECL, stress testing, portfolio analysis, and the multi-method valuation matrix.

## Production-routed certified paths

The runtime installer maps independently tested calculation code into the production workstation for:

- `LoanEngine.npv` and `LoanEngine.irr`;
- drawdown/recovery, SMA, EMA, MACD and RSI in `CalcEngine`;
- CSV header detection and price-series import;
- bond modified duration, price sensitivity and DV01;
- CAPM/WACC;
- DCF, DDM, residual income and comparables in `ValuationEngine`;
- core financial ratios with zero-preserving missing-data semantics;
- large-number formatting;
- compatible legacy `FINANCE` methods;
- `FinancialModelEngine.defaults`, `fillDefaults` and `build` through `FinancialModelCore`;
- irregular-period `XIRR.xnpv`, `XIRR.xirr` and XIRR display calculation;
- `ECLV2.compute` and `ECLV2.eadDefault` with explicit validation and zero preservation;
- `StressTestEngine.run` through `LegacyCalculationCore`;
- `PortfolioEngine.build` and `PortfolioEngine.stress` through `LegacyCalculationCore`;
- `ValuationMatrixV2.build` and the calculation behind `ValuationMatrixV2.driversHTML` through `LegacyCalculationCore`.

Legacy rendering and presentation helpers remain intact unless a build-boundary correction is explicitly documented.

## Legacy-calculation defects closed

The current pass fixes and permanently tests the following production problems:

- **Stress revenue eligibility:** valid `revenue` is accepted when `revenue0` is absent.
- **Stress zero semantics:** explicit 0% tax, 0% growth, 0% EBITDA margin and other valid zero assumptions are preserved instead of being replaced by truthy defaults.
- **Stress PD:** an explicit zero base probability of default remains zero.
- **Stress denominator safety:** downside is not fabricated when the base valuation denominator is zero.
- **Portfolio weights:** zero total weight, negative weights, missing expected returns and missing volatility are rejected rather than producing invalid or synthetic calculations.
- **Portfolio zero volatility:** legitimate zero volatility is preserved; bond stress no longer substitutes a hidden 5% volatility.
- **Portfolio variance:** normalized weights and the stated pairwise correlation are used consistently in the hardened path.
- **Comparable valuation:** the relative company/peer multiple is converted to an implied fair price as `current price / relative multiple`, rather than simply returning current market price and forcing zero upside.
- **Residual income:** total residual-income equity value is converted to per-share value using diluted shares before comparison with per-share market price.
- **Value drivers:** sensitivity calculations use explicit base assumptions and a real non-zero DCF base-value denominator rather than truthy defaults and `baseVal || 1`.
- **Portfolio form boundary:** the UI no longer manufactures expected return `0` or volatility `20%` for missing metrics; invalid portfolios receive visible validation feedback.

## LegacyCalculationCore permanent controls

The current pass adds 14 mandatory controls:

| Regression | Required behavior | Result |
|---|---|---|
| `LC-REG-001` | Stress accepts `revenue` when `revenue0` is absent | PASS |
| `LC-REG-002` | Explicit zero tax is preserved | PASS |
| `LC-REG-003` | Explicit zero growth and zero EBITDA margin are preserved | PASS |
| `LC-REG-004` | Explicit zero base PD is preserved | PASS |
| `LC-REG-005` | Zero stress shocks reproduce the base DCF value | PASS |
| `LC-REG-006` | Zero share count is rejected rather than defaulted to one | PASS |
| `LC-REG-007` | Zero total portfolio weight is rejected | PASS |
| `LC-REG-008` | Explicit zero portfolio volatility is preserved | PASS |
| `LC-REG-009` | Missing volatility is rejected rather than invented | PASS |
| `LC-REG-010` | Negative portfolio weights are rejected | PASS |
| `LC-REG-011` | Portfolio variance uses normalized weights and stated correlation | PASS |
| `LC-REG-012` | Bond stress does not replace zero volatility with 5% | PASS |
| `LC-REG-013` | Comparable relative multiple is converted into fair price | PASS |
| `LC-REG-014` | Residual-income total equity value is converted to per-share value | PASS |

## Three-statement model regressions

The 15 `FM-REG-*` controls from the prior certification remain mandatory and passing. They cover forecast growth, zero-value preservation, detailed EBITDA mechanics, simultaneous debt instruments, debt/cash coupling, configured-COGS working capital, covenant denominators, balance-sheet reconciliation and debt-amortization bounds.

The production form boundary continues to preserve an entered 0% debt rate and zero-valued covenant inputs, and the UI explicitly labels EBITDA margin as a target because detailed COGS/SG&A/R&D assumptions drive modeled EBITDA.

## Original regression controls

`REG-BOND-001`, `REG-DD-001`, `REG-MACD-001`, `REG-FMT-001`, `REG-CSV-001`, `REG-STAT-001`, `REG-RSI-001`, and `REG-DCF-001` remain passing.

Independent semiannual bond fixture: face 1,000; annual coupon cash 50; YTM 6%; maturity 10 years; frequency 2 → price `925.6126256977221`, Macaulay duration `7.894997340182341`, modified duration `7.665045961342078`.

## Additional hardened runtime paths retained

- **XIRR:** production XIRR/MWR routes through the independently tested irregular-date solver using the documented 365-day basis.
- **Expected Credit Loss:** missing PD/recovery/EAD cannot silently participate in arithmetic, and legitimate zero EAD remains zero.
- **Browser portability:** Chromium, Firefox and WebKit execute the same generated offline artifact without page/console errors or external HTTP(S) requests in the application-wide smoke pass.
- **Responsive path:** the 390×844 Chromium pass confirms no document-level horizontal overflow and verifies that the mobile menu is visible and opens the sidebar.

## CI gates executed

The workflow validates syntax, the **60-check certified-source gate**, all **169 Node tests**, the production build, regex/contextual audits, the **45-check artifact gate**, then installs pinned Playwright **1.55.0** and exercises Chromium, Firefox, WebKit, and a mobile Chromium viewport. The certification branch finally regenerates root `index.html`, `dist/index.html`, and deterministic browser/static-audit evidence.

## Static-audit inventory and boundary

`STATIC_AUDIT_FINDINGS.md` inventories **all 428 broad regex leads** and leaves **0 unclassified**. **221** are conservatively categorized as calculation-sensitive or algorithmic-review leads. These are not 221 confirmed defects: the list intentionally includes defaults, presentation rounding, guards, sentinels, parser behavior and legacy implementations that may be superseded by certified runtime routing.

The certification claim remains deliberately evidence-based. `FinanceCore`, `FinancialModelCore`, `LegacyCalculationCore`, and the production calculation paths explicitly mapped and tested through them are certified, together with the explicitly hardened XIRR/ECL runtime boundaries. Other legacy analytical helpers are not automatically promoted merely because the generated single-file application passes navigation smoke.

## Certification conclusion

**PASS — EXPANDED CERTIFIED CALCULATION SCOPE.**

The high-risk stress, portfolio and multi-method valuation defects identified in the legacy monolith are now routed through independently testable calculation code with permanent regression controls, and the generated application passes the complete certification stack across Chromium, Firefox, WebKit and the mobile responsive target.