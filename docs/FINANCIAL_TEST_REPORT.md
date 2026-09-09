# Financial Test Report

## Current status

**Automated finance and production-build verification: PASS**

- Certification workflow run: **34412012155**
- Source commit tested: `78fb885ce2041d942a46773492f788271a3427b7`
- Generated-artifact commit: `78f73487c8231d12216bc567e785f0f45adf5e25`
- Total automated Node tests: **121**
- Passed: **121**
- Failed: **0**
- Permanent named regressions: **8/8 represented**
- Runtime compatibility regressions: **8/8 passed**
- Production artifact checks: **17/17 passed**
- Generated standalone HTML size: **1,013,568 bytes**
- Modified-duration UI call-site patches applied by build: **1**

Known-answer tests cover statistics, returns, NPV/IRR/XIRR, bonds, CAPM/WACC, DCF and DDM. Property/invariant tests cover bond yield/price direction, DCF sensitivities, portfolio identities, drawdown and constant-series behavior. Edge cases include zero/missing semantics, short series, warm-up periods, invalid MACD periods, zero-loss/gain RSI, invalid DCF denominators, zero capital, zero ratio denominators and nonfinite formatting.

## Commands executed by GitHub Actions

```text
npm ci --ignore-scripts --no-audit --no-fund
node -c src/finance/engine.js
node -c src/runtime/install.js
node -c scripts/build.js
node -c scripts/verify-build.js
node -c scripts/static-audit.js
npm test
npm run build
node scripts/static-audit.js dist/index.html
node scripts/verify-build.js
npm run build:root
```

Test result:

```text
1..121
# tests 121
# pass 121
# fail 0
```

Build result:

```text
output: dist/index.html
bytes: 1013568
durationPatches: 1
rootUpdated: true (deployable-root generation step)
```

Artifact verification: **17 checks passed**, including single-file size, one embedded certification runtime, FinanceCore presence, runtime installer presence, bond-frequency call-site correction, recovery observation labeling, preserved DOMContentLoaded initialization, removal of the Cloudflare challenge payload, no localhost runtime reference, and preservation of core navigation/DCF/bond/CSV modules.

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

## Static financial-danger scan

The generated monolith still contains legacy patterns requiring contextual review. Counts from the successful CI run are audit leads, not automatic defects:

```text
truthy-value checks: 134
fallback-to-zero coercions: 25
generic OR zero: 174
toFixed usage: 20
Math.round usage: 52
parseFloat usage: 0
parseInt usage: 3
Infinity literals: 13
NaN literals: 1
```

The certified runtime corrects the confirmed production calculation paths covered by the automated suite, but the specification's request to contextually audit every legacy occurrence above is **NOT YET VERIFIED COMPLETE**.

## Remaining verification

- Full contextual disposition of every static-audit lead: **NOT VERIFIED COMPLETE**.
- Final interactive browser smoke pass across every major workstation screen: **NOT VERIFIED** in this tool environment.
- Institutional settlement/day-count precision remains outside scope as documented in `KNOWN_LIMITATIONS.md`.

## Final certification status

**⚠️ PARTIAL — REMAINING ITEMS**

The critical corrected calculations and generated production build pass automated verification. A full certification PASS is intentionally withheld until the remaining legacy static-audit leads are contextually reviewed and the final interactive browser smoke checklist is executed.
