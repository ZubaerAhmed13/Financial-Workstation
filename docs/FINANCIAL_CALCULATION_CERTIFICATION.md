# Financial Calculation Certification

Certification engines:

- **FinanceCore v1.1.0**
- **FinancialModelCore v1.0.0**

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
- The certified three-statement model treats detailed COGS, SG&A and R&D assumptions as the modeled cost drivers. The separate EBITDA-margin series is a target/diagnostic and its variance from the statement-derived margin is disclosed.

## Certified FinanceCore calculations

The following independently tested FinanceCore primitives remain certified: mean, median, variance, standard deviation, covariance, correlation, simple/log return, CAGR, TWR, NPV, IRR, XNPV/XIRR, annualized volatility, beta, maximum drawdown, recovery period, SMA, EMA, MACD, RSI, bond price, Macaulay duration, modified duration, convexity, YTM, DV01, CAPM, WACC, FCFF DCF, Gordon DDM, multi-stage DDM, residual income, comparable-multiple summary, portfolio return, portfolio variance, core accounting ratios, CSV header mapping and large-number scaling.

Production-routed FinanceCore paths include `LoanEngine`, the selected `CalcEngine` risk/technical functions, `CsvParser`, selected `BondEngine` methods, `CapmWacc`, `ValuationEngine`, `FinancialRatios`, formatting and compatible legacy `FINANCE` methods.

## Certified three-statement model

`FinancialModelCore v1.0.0` is independently testable and replaces the production calculation methods behind `FinancialModelEngine` while preserving legacy rendering helpers.

Its certified behavior includes:

- per-year revenue growth is actually compounded;
- explicit zero growth and zero tax values are preserved;
- detailed COGS/SG&A/R&D assumptions drive EBITDA and statement-derived EBITDA margin;
- target-margin variance is calculated and surfaced as a caution when material;
- DSO/DIO/DPO working-capital calculations use the configured COGS, not a hidden fixed ratio;
- each debt row represents a simultaneous debt instrument;
- debt interest is aggregated across instruments and a valid 0% rate stays 0%;
- principal repayment reduces both debt and financing cash flow and cannot amortize an instrument below zero;
- current-ratio covenants use actual current liabilities and are not calculated with an invented denominator when current liabilities are zero;
- a balanced opening balance sheet remains reconciled through the forecast;
- an opening imbalance is carried/disclosed rather than silently erased by a cash balancing plug.

The build also hardens the financial-model form boundary so an explicit 0% debt rate and zero-valued covenant inputs reach the calculation engine unchanged. The UI label is changed from `EBITDA margin %` to `EBITDA margin target %` to match the certified calculation semantics.

## Permanent regression controls

The original eight controls remain mandatory and passing:

- `REG-BOND-001` — modified duration uses `Dmac / (1 + YTM/m)`;
- `REG-DD-001` — recovery targets the pre-drawdown peak;
- `REG-MACD-001` — MACD histogram is populated and equals line minus signal;
- `REG-FMT-001` — 10,000 formats as 10K;
- `REG-CSV-001` — column index zero remains valid;
- `REG-STAT-001` — even median averages the two center values;
- `REG-RSI-001` — a no-loss series produces RSI 100;
- `REG-DCF-001` — perpetual-growth DCF rejects `g >= WACC`.

The expanded pass adds 15 model controls:

- `FM-REG-001` revenue growth compounds;
- `FM-REG-002` zero growth is preserved;
- `FM-REG-003` default detailed costs reconcile to the default target margin;
- `FM-REG-004` output margin is derived from the detailed statement;
- `FM-REG-005` 0% debt rate remains zero;
- `FM-REG-006` multiple debt rows aggregate as simultaneous instruments;
- `FM-REG-007` principal repayment reaches debt and cash;
- `FM-REG-008` working capital uses configured COGS;
- `FM-REG-009` 0% tax remains zero;
- `FM-REG-010` zero current liabilities do not create an artificial covenant denominator;
- `FM-REG-011` current ratio uses actual current liabilities;
- `FM-REG-012` an opening balance-sheet difference is not hidden with a cash plug;
- `FM-REG-013` a balanced opening balance sheet stays reconciled;
- `FM-REG-014` debt cannot amortize below zero;
- `FM-REG-015` default filling preserves valid zero inputs and legacy mutable-object compatibility.

## XIRR and ECL production hardening

The workstation's irregular-period `XIRR` object is now routed to the certified FinanceCore XNPV/XIRR implementation. This removes a legacy Newton-iteration convergence defect and ensures MWR paths calling `XIRR.xirr` use the same solver. The displayed XIRR formula is aligned to the certified 365-day convention.

`ECLV2` now validates finite PD/recovery in `[0,1]` and non-negative EAD. Missing inputs no longer silently enter arithmetic, and a legitimate EAD of zero remains zero rather than being replaced by a 1,000,000 fallback.

## Independent bond reference

Semiannual reference input: face 1,000; annual coupon cash 50; YTM 6%; maturity 10 years; frequency 2.

- Price: `925.6126256977221`
- Macaulay duration: `7.894997340182341` years
- Modified duration: `7.665045961342078` years

## Production build hardening

The deterministic build embeds FinanceCore, FinancialModelCore and the runtime installer into the portable single-file workstation and also performs narrowly scoped compatibility repairs:

- modified-duration UI passes coupon frequency;
- recovery output is labeled in observations;
- unrelated Cloudflare challenge payload is removed from the offline artifact;
- unsafe SVG property assignment is replaced with `setAttribute`;
- correlation-heatmap interpolation owns its `lerp` helper;
- the three-statement model form preserves explicit zero debt/covenant inputs;
- EBITDA margin is labeled as a target rather than misrepresented as a statement output.

The generated artifact is verified for all of these properties and for preservation of core workstation modules and initialization.

## Verification stack

Expanded certification evidence for workflow run **34457038782**:

- certified source gate: **41/41 PASS**;
- Node unit/regression/known-answer/runtime tests: **147/147 PASS**;
- production artifact verification: **34/34 PASS**;
- standalone generated HTML: **1,026,174 bytes**;
- static/contextual audit: **425/425 leads enumerated and classified, 0 unclassified**;
- Chromium desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 11/11 runtime checks**;
- Firefox desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 11/11 runtime checks**;
- WebKit desktop: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 11/11 runtime checks**;
- Chromium mobile 390×844: **42/42 views, 59 tabs, 0 page errors, 0 console errors, 0 external requests, 11/11 runtime checks**, with no document-level horizontal overflow and a functioning mobile menu/sidebar.

Browser runtime checks cover median, NPV, IRR, modified duration, recovery, MACD, RSI, DCF rejection, the certified three-statement model, XIRR and ECL.

## Certification boundary

The generated application remains a large legacy single-file product and contains analytical helpers outside the certified mapping. `STATIC_AUDIT_FINDINGS.md` deliberately over-matches truthy guards, `|| 0`, rounding, parser conversions and numeric sentinels. Its **220 calculation-sensitive / algorithmic-review entries are review leads, not 220 proven defects**.

The certification claim is therefore intentionally precise: **FinanceCore, FinancialModelCore, and the production paths explicitly mapped/tested through them are certified; XIRR and ECL are additionally certified at their production runtime boundary. Other legacy analytical helpers remain outside the certification boundary unless separately tested and promoted.** Cross-browser application smoke proves broad runtime compatibility, not every mathematical combination of every legacy helper.

## Final certification status

**PASS — EXPANDED CERTIFIED CALCULATION SCOPE.**

Repository-level commands and evidence are recorded in `FINANCIAL_TEST_REPORT.md`; remaining product/model limitations are documented in `KNOWN_LIMITATIONS.md`.