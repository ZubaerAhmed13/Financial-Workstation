# Financial Workstation — Baseline Inventory

Baseline branch: `main`
Baseline commit: `1b6a612cd4cdbbbf246f9e465681b8c827b268ee`
Baseline primary artifact: `index.html` (983,714 bytes at inspection)
Observed app version: 3.14.3

## Repository shape before certification

The repository is deployment-first: almost all application HTML, CSS, state, engines, views, diagnostics, imports and feature extensions live in one hand-maintained `index.html`. There was no repository-level `package.json`, modular finance source tree, automated Node test suite, certification documentation, or GitHub Actions finance gate in the inspected baseline tree.

## Major existing product areas preserved

- Dashboard and navigation shell
- Stock/company analysis
- Historical price CSV/XLSX import
- Technical indicators and charting
- DCF, DDM, residual-income and comparable valuation
- CAPM/WACC
- Bond pricing, YTM, duration, convexity and sensitivity
- Loan/project NPV/IRR and amortization
- Company ratios and credit models
- Risk, drawdown, VaR/ES and Monte Carlo tooling
- Scenarios, stress testing and breakpoints
- Financial modelling / forecasts
- Case database / similarity workflows
- Accounting-quality framework
- Portfolio and workspace features
- Reports, snapshots, audit trail, storage migration, warning center and diagnostics

## Confirmed baseline defects

| ID | Area | Baseline behavior | Financial consequence |
|---|---|---|---|
| REG-BOND-001 | Bond modified duration | `macDur / (1 + ytm)` | Wrong sensitivity for frequency > 1 |
| REG-DD-001 | Drawdown recovery | scans from trough and compares to trough | Frequently reports 0 instead of recovery to prior peak |
| REG-MACD-001 | MACD | histogram array is empty/unpopulated in one production engine | Indicator output incomplete/misleading |
| REG-FMT-001 | Large-number format | thousands append `K` without first dividing by 1,000 | e.g. 10,000 can render as 10,000K |
| REG-CSV-001 | CSV mapping | header detection uses falsy index checks | index 0 can be mistaken for “not found” |
| REG-STAT-001 | Median | middle element selected for every sample size | even-sized samples are biased upward |
| REG-RSI-001 | RSI | zero-loss branch used an arbitrary RS=100 shortcut in one engine | no-loss series is not exactly the conventional 100 |
| REG-DCF-001 | DCF | one DCF path already guards WACC <= g; certification requires the guard consistently across all production paths | risk of invalid perpetual-growth outputs if another path bypasses it |

## Additional baseline risks found

1. `FinancialRatios.compute()` uses expressions such as `f.revenue || null`, `f.cash || null`, and `f.debt || null`. Valid zero values are therefore silently converted to missing data.
2. Several model/default paths use `value || default`, which can similarly replace valid zero assumptions.
3. Recovery UI labels an observation count with `d`, even though the implementation does not calculate calendar days.
4. A Cloudflare challenge script was physically present at the end of the committed single-file artifact, despite the application describing itself as offline-only.
5. The app contains a large number of in-browser self-tests, but they are not a repository-level CI gate and cannot independently certify the production formulas.

## Baseline architecture decision

The existing UI and workflow are retained. Certification introduces a pure finance core under `src/`, a runtime compatibility installer, deterministic build tooling, Node tests, CI, and documentation. The generated single-file HTML remains the deployable product.
