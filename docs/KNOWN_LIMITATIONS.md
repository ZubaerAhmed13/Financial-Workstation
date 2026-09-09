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
11. **Specialized accounting scores:** this pass hardens the shared ratio layer and zero/missing semantics. Specialized scoring frameworks should retain their own model-specific caveats and source definitions.
12. **JavaScript numeric model:** calculations use IEEE-754 double precision. This is appropriate for the workstation’s analytical use but not a decimal-ledger/accounting-posting engine.
13. **Browser smoke certification:** automated Node/CI tests and static production-artifact checks do not substitute for a final interactive browser smoke test of every screen. Any such item not actually executed is reported as NOT VERIFIED.
