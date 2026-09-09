# Known Limitations

These limitations are intentionally explicit. They are not silently presented as institutional-grade precision.

1. **Bond settlement conventions:** the current workstation bond workflow is period-based. It does not yet provide full settlement-date clean/dirty pricing, accrued-interest schedules, ex-coupon handling, business-day calendars, or selectable Actual/Actual, 30/360, Actual/360, etc. day-count conventions.
2. **Bond optionality:** option-adjusted spread, callable/putable bond trees, key-rate duration and full term-structure bootstrapping are outside the certified core in this pass.
3. **Residual income:** the compatibility wrapper uses a simplified clean-surplus/retention convention because the existing UI does not expose a full dividend/payout/book-value forecast. The formula engine is explicit, but model realism depends on user inputs.
4. **Frequency inference:** some legacy UI risk views still describe imported price histories as daily and use 252 periods/year. The certified core requires an explicit annualization frequency, but not every legacy screen has yet been redesigned to ask for frequency. This remains visible rather than silently relabeled.
5. **Recovery unit:** the current price-history UI reports recovery in observations. Calendar-day recovery is available in the certified core when timestamps are supplied, but the legacy card does not yet render both measures.
6. **Market data:** the workstation remains offline-first and does not provide a live institutional market-data feed. Imported/user-entered data quality directly affects results.
7. **IRR multiple roots:** the certified IRR returns a bracketed root where one is found. Non-conventional cash flows can have multiple economically valid roots; users should inspect sign changes and use NPV profiles for such cases.
8. **XIRR day basis:** XIRR uses a 365-day year convention in the certified core.
9. **VaR / Expected Shortfall:** results remain model- and sample-dependent. Parametric, historical and Monte Carlo methods can disagree materially.
10. **Accounting framework comparability:** the application contains IFRS/US-GAAP awareness and an accounting-quality layer, but it does not replace an accounting-policy review of issuer filings.
11. **Specialized accounting scores:** this pass hardens the shared ratio layer and zero/missing semantics. Specialized scoring frameworks retain their own model-specific caveats and source definitions unless explicitly routed through the certified core.
12. **JavaScript numeric model:** calculations use IEEE-754 double precision. This is appropriate for the workstation’s analytical use but not a decimal-ledger/accounting-posting engine.
13. **Browser smoke scope:** automated Chromium certification is now executed and PASS across all 42 discovered views and 59 tabs, with zero page errors, zero console errors and zero unexpected network requests. This is a broad application smoke test, not exhaustive proof of every possible input combination, import file, storage-quota state, print/export path, browser engine or device.
14. **Legacy monolith scope:** every current static-audit regex lead in the deployable monolith is inventoried and context-classified, but broad regex matches are not equivalent to defects. Certification applies strictly to `FinanceCore` and the production paths explicitly mapped to it. Unmapped legacy analytical helpers remain outside the certified boundary unless separately tested and promoted.
15. **Browser coverage:** CI currently certifies the standalone artifact in pinned Chromium/Playwright. Firefox, WebKit/Safari and mobile-browser parity are not part of this certification pass.
