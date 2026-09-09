# Financial Test Report

## Final status

**PASS — CERTIFIED CALCULATION SCOPE**

The hardened calculation core, its mapped production runtime paths, the generated single-file application, and the automated Chromium workstation smoke pass all pass the repository certification gates.

### Final verified evidence

- Certification workflow run: **34413815597**
- Source commit tested: `c196b2718f50b3965a9f398c99157fa22fdbdff0`
- Generated evidence / deployable artifact commit: `5e65d8828c2d4fc5cb64a5f5c3a53fe8eca0aa7a`
- FinanceCore: **v1.1.0**
- Certified source-structure gate: **21/21 passed**
- Automated Node tests: **123/123 passed**
- Permanent named regressions: **8/8 represented and passing**
- Production artifact verification: **21/21 passed**
- Generated standalone HTML size: **1,014,152 bytes**
- Chromium workstation smoke: **PASS**
- Views opened: **42/42**
- Tabs activated: **59**
- Browser page errors: **0**
- Browser console errors: **0**
- Unexpected external network requests: **0**
- Browser runtime calculation checks: **8/8 passed** (`median`, `npv`, `irr`, `duration`, `recovery`, `macd`, `rsi`, `dcf`)

## What is production-routed through the certified core

The runtime installer maps the independently tested `FinanceCore` into the workstation's production calculation paths for:

- `LoanEngine.npv` and `LoanEngine.irr`
- drawdown/recovery, SMA, EMA, MACD and RSI in `CalcEngine`
- CSV header detection and price-series import
- bond modified duration, price sensitivity and DV01
- CAPM/WACC
- DCF, DDM, residual income and comparables
- core financial ratios with zero-preserving missing-data semantics
- large-number formatting
- compatible legacy `FINANCE` methods where present

The build also hardens two browser defects discovered by the new smoke test: SVG attribute creation now uses `setAttribute` rather than `Object.assign` on getter-only SVG properties, and correlation-heatmap color interpolation now keeps `lerp` in the correct scope.

## Required regression verification

| Regression | Required behavior | Result |
|---|---|---|
| `REG-BOND-001` | Modified duration uses `Dmac / (1 + YTM/m)` | PASS |
| `REG-DD-001` | Recovery targets the prior peak, not the trough | PASS |
| `REG-MACD-001` | Histogram is populated and equals MACD − signal | PASS |
| `REG-FMT-001` | 10,000 scales to 10K | PASS |
| `REG-CSV-001` | Column index 0 remains valid | PASS |
| `REG-STAT-001` | Even median averages the two center values | PASS |
| `REG-RSI-001` | No-loss RSI is finite and equals 100 | PASS |
| `REG-DCF-001` | Perpetual-growth DCF rejects `g >= WACC` | PASS |

Independent semiannual bond known-answer fixture: face 1,000; annual coupon cash 50; YTM 6%; maturity 10 years; frequency 2 → price `925.6126256977221`, Macaulay duration `7.894997340182341`, modified duration `7.665045961342078`.

## CI gates executed

```text
npm ci --ignore-scripts --no-audit --no-fund
node -c src/finance/engine.js
node -c src/runtime/install.js
node -c scripts/build.js
node -c scripts/verify-build.js
node -c scripts/static-audit.js
node -c scripts/contextual-audit.js
node -c scripts/certified-core-audit.js
node -c tests/browser-smoke.js
node scripts/certified-core-audit.js
npm test
npm run build
node scripts/static-audit.js dist/index.html
node scripts/contextual-audit.js dist/index.html --write=docs/STATIC_AUDIT_FINDINGS.md
node scripts/verify-build.js
node tests/browser-smoke.js dist/index.html --write=docs/BROWSER_SMOKE_REPORT.json
npm run build:root
```

Node test result:

```text
1..123
# tests 123
# pass 123
# fail 0
```

Certified source gate result:

```text
positiveChecks: 15
bannedPatternChecks: 6
total: 21
failed: 0
status: PASS
```

## Static-audit inventory and certification boundary

The deployable legacy monolith still contains broad regex patterns that warrant contextual attention. The generated `STATIC_AUDIT_FINDINGS.md` inventories **all 422 matches**, supplies source line/owner/fingerprint/disposition metadata, and leaves **0 unclassified**. Of those, 218 are conservatively categorized as calculation-sensitive or algorithmic-review leads.

Those counts are **review leads, not 422 confirmed defects**. They include legitimate defaults, object/DOM guards, presentation rounding, numeric sentinels and legacy implementations that are superseded by the certified runtime. The strict certification claim therefore applies to the extracted `FinanceCore` and the production paths explicitly routed to it and tested in Node + Chromium. Unmapped legacy analytical helpers are not silently promoted to certified status merely because they appear in the same single-file artifact.

This boundary is deliberate: it is stronger and more auditable than claiming every heuristic regex hit in a ~1 MB legacy file has institutional-grade validation.

## Browser smoke evidence

`docs/BROWSER_SMOKE_REPORT.json` records:

```text
status: PASS
viewsVisited: 42 / 42
tabsActivated: 59
pageErrors: 0
consoleErrors: 0
externalNetworkRequests: 0
runtimeChecks: 8 / 8 true
```

The browser pass is an application-wide navigation/runtime smoke test, not a proof of every possible user-entered dataset, file import, print path, storage quota condition, or every combination of advanced model assumptions. Those remaining model/product limitations are documented in `KNOWN_LIMITATIONS.md`.

## Certification conclusion

**PASS — CERTIFIED CALCULATION SCOPE.**

The requested critical regressions are fixed and protected, independently testable source now exists, production uses the certified implementations for the mapped calculation paths, the standalone build is deterministic and verified, all CI gates pass, and the application opens across all discovered views/tabs in headless Chromium without browser errors or external runtime requests.
