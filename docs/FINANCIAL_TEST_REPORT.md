# Financial Test Report

## Final status

**PASS — EXPANDED CERTIFIED CALCULATION SCOPE**

The hardened calculation cores, mapped production runtime paths, generated single-file application, desktop cross-browser passes and mobile responsive pass all satisfy the repository certification gates.

### Final verified evidence

- Expanded certification workflow run: **34457038782**
- Source commit tested: `1314dcde84e51101569bf8c8afbea6c00b4651ea`
- Generated evidence / deployable artifact commit: `ac5d83e474a76a31276dfaebe6de7c38d30cbca9`
- FinanceCore: **v1.1.0**
- FinancialModelCore: **v1.0.0**
- Certified source-structure gate: **41/41 passed**
- Automated Node tests: **147/147 passed**
- Original permanent named regressions: **8/8 passing**
- Three-statement permanent model regressions: **15/15 passing**
- Production artifact verification: **34/34 passed**
- Generated standalone HTML size: **1,026,174 bytes**
- Contextual static audit: **425/425 leads enumerated/classified, 0 unclassified**
- Calculation-sensitive / algorithmic-review leads: **220**; these are review leads, not confirmed defects.

### Browser evidence

All four CI browser targets passed on the generated standalone artifact:

| Target | Views | Tabs | Page errors | Console errors | External requests | Runtime checks | Layout |
|---|---:|---:|---:|---:|---:|---:|---|
| Chromium desktop | 42/42 | 59 | 0 | 0 | 0 | 11/11 | no body overflow |
| Firefox desktop | 42/42 | 59 | 0 | 0 | 0 | 11/11 | no body overflow |
| WebKit desktop | 42/42 | 59 | 0 | 0 | 0 | 11/11 | no body overflow |
| Chromium mobile 390×844 | 42/42 | 59 | 0 | 0 | 0 | 11/11 | no body overflow; menu visible and opens |

The 11 browser-level runtime assertions cover `median`, `npv`, `irr`, modified duration, recovery, MACD, RSI, DCF guard, the three-statement model, XIRR and ECL.

## Production-routed certified paths

The runtime installer now maps independently tested calculation code into the production workstation for:

- `LoanEngine.npv` and `LoanEngine.irr`;
- drawdown/recovery, SMA, EMA, MACD and RSI in `CalcEngine`;
- CSV header detection and price-series import;
- bond modified duration, price sensitivity and DV01;
- CAPM/WACC;
- DCF, DDM, residual income and comparables;
- core financial ratios with zero-preserving missing-data semantics;
- large-number formatting;
- compatible legacy `FINANCE` methods;
- `FinancialModelEngine.defaults`, `fillDefaults` and `build` through `FinancialModelCore`;
- irregular-period `XIRR.xnpv`, `XIRR.xirr` and XIRR display calculation;
- `ECLV2.compute` and `ECLV2.eadDefault` with explicit validation and zero preservation.

## Three-statement model regressions

The expanded pass fixes and permanently tests these model failures:

| Regression | Required behavior | Result |
|---|---|---|
| `FM-REG-001` | Revenue compounds the per-year growth assumptions | PASS |
| `FM-REG-002` | Explicit 0% growth remains 0% | PASS |
| `FM-REG-003` | Default detailed costs reconcile to the 20% EBITDA-margin target | PASS |
| `FM-REG-004` | Reported EBITDA margin is derived from the detailed income statement | PASS |
| `FM-REG-005` | Explicit 0% debt rate remains 0% | PASS |
| `FM-REG-006` | Multiple debt rows are simultaneous instruments, not forecast years | PASS |
| `FM-REG-007` | Debt principal repayment reduces ending debt and cash | PASS |
| `FM-REG-008` | Inventory/payables use configured COGS rather than a hard-coded 65% base | PASS |
| `FM-REG-009` | Explicit 0% tax rate remains 0% | PASS |
| `FM-REG-010` | Current-ratio covenant does not invent a denominator for zero current liabilities | PASS |
| `FM-REG-011` | Current-ratio covenant uses actual current liabilities | PASS |
| `FM-REG-012` | Opening balance-sheet imbalance is disclosed/carried rather than hidden with a cash plug | PASS |
| `FM-REG-013` | A balanced opening balance sheet remains reconciled through forecast | PASS |
| `FM-REG-014` | Debt amortization cannot drive an instrument below zero | PASS |
| `FM-REG-015` | Legacy-compatible default filling preserves valid zero inputs | PASS |

The production form boundary is also hardened: an entered 0% debt rate is no longer converted to 5%, zero-valued covenant inputs are not silently replaced by defaults, and the UI explicitly labels EBITDA margin as a target because detailed COGS/SG&A/R&D assumptions drive the modeled EBITDA calculation.

## Original eight regression controls

`REG-BOND-001`, `REG-DD-001`, `REG-MACD-001`, `REG-FMT-001`, `REG-CSV-001`, `REG-STAT-001`, `REG-RSI-001`, and `REG-DCF-001` remain passing.

Independent semiannual bond fixture: face 1,000; annual coupon cash 50; YTM 6%; maturity 10 years; frequency 2 → price `925.6126256977221`, Macaulay duration `7.894997340182341`, modified duration `7.665045961342078`.

## Additional runtime defects closed

- **XIRR:** the legacy Newton loop assigned the new rate before testing convergence, making its subsequent difference test zero immediately. Production XIRR/MWR now routes through the independently tested irregular-date solver using the documented 365-day basis.
- **Expected Credit Loss:** missing PD/recovery/EAD no longer silently participates in arithmetic, and a legitimate zero EAD is preserved rather than replaced by a 1,000,000 fallback.
- **Browser portability:** Chromium, Firefox and WebKit all execute the same generated offline artifact without page/console errors or external HTTP(S) requests in the application-wide smoke pass.
- **Responsive path:** the 390×844 Chromium pass confirms no document-level horizontal overflow and verifies that the mobile menu is visible and opens the sidebar.

## CI gates executed

The workflow validates syntax, the 41-check certified-source gate, all Node tests, the production build, regex/contextual audits, the 34-check artifact gate, then installs pinned Playwright 1.55.0 and exercises Chromium, Firefox, WebKit, and a mobile Chromium viewport. The certification branch finally regenerates root `index.html`, `dist/index.html`, and deterministic browser/static-audit evidence.

## Static-audit inventory and boundary

The generated `STATIC_AUDIT_FINDINGS.md` inventories **all 425 broad regex leads** and leaves **0 unclassified**. 220 are conservatively categorized as calculation-sensitive or algorithmic-review leads. These are not 220 confirmed defects: the list intentionally includes defaults, presentation rounding, guards, sentinels and legacy implementations that may be superseded by certified runtime routing.

The certification claim remains deliberately evidence-based. `FinanceCore`, `FinancialModelCore`, and the production paths explicitly mapped to them (plus the explicitly hardened/tested XIRR and ECL runtime paths) are certified. Other legacy analytical helpers are not automatically promoted merely because the generated single-file application passes navigation smoke.

## Certification conclusion

**PASS — EXPANDED CERTIFIED CALCULATION SCOPE.**

The three-statement model is no longer running the previously identified flat-revenue/debt/covenant logic, XIRR and ECL production defects are closed, the generated artifact is deterministic and verified, and the expanded application passes on Chromium, Firefox, WebKit and the mobile responsive target.