# Financial Test Report

## Current status

**Local extracted-engine verification: PASS**

- Total automated Node tests: **121**
- Passed: **121**
- Failed: **0**
- Permanent named regressions: **8/8 represented**
- Runtime compatibility regressions: **8/8 passed**
- Known-answer tests: included for statistics, returns, NPV/IRR/XIRR, bonds, CAPM/WACC, DCF and DDM
- Property/invariant tests: included for bond yield/price direction, DCF sensitivities, portfolio identities, drawdown and constant-series behavior
- Edge cases: zero/missing semantics, short series, warm-up periods, invalid MACD periods, zero-loss/gain RSI, invalid DCF denominators, zero capital, zero ratio denominators, nonfinite formatting

## Commands executed locally

```text
npm test
```

Result:

```text
1..121
# tests 121
# pass 121
# fail 0
```

## Required bug verification

| Bug | Verification | Result |
|---|---|---|
| Modified duration | Face 1000, coupon 5%, YTM 6%, 10y, m=2 → expected 7.665045961342078 | PASS in certified core/runtime |
| Recovery period | 100→90→70→80→95→100 recovers at final 100, 3 observations after trough | PASS |
| MACD histogram | every available histogram value equals MACD − signal | PASS |
| K formatter | 10,000 pre-scales to 10 + K | PASS |
| CSV index zero | Date first column maps to index 0 and imports | PASS |
| Median | [1,2,3,4] → 2.5 | PASS |
| RSI | strictly rising no-loss series → 100, finite | PASS |
| DCF | terminal growth = WACC → invalid | PASS |

## Production build verification

GitHub-branch build/CI: **PENDING AT DOCUMENT CREATION**. The CI workflow must run `npm ci`, syntax checks, all tests, build the generated single-file artifact, static audit, and production-artifact verification. This document must be updated after the branch run is inspected.

## Certification rule

Do not interpret the local PASS above as a final product certification. Final status remains PARTIAL until the repository branch’s generated `index.html` and CI run pass and any unexecuted browser smoke checks are explicitly marked.
