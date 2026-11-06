# Final local verification — 0.4.35

## Passed on this build
- Chromium headless: all six application pages, widths 320/375/760/1440/2560, paper and night themes (60 combinations).
- No uncaught page JavaScript errors, document horizontal overflow or axe WCAG 2 A/AA and WCAG 2.1 AA rule violations reported in those default states. Reduced motion used for this matrix.
- Trading Desk: widths 320/375/760/1440, both themes (8 results); quote labels, saved EMA/SMA/oscillator settings, Fibonacci drawing, quote/timeframe drawing isolation, persistence after reload, synthetic-labelled CSV export, RSI/MACD rendering and axe checks passed.
- 30 root JavaScript/module files passed `node --check`.
- Seven root HTML files (six pages plus verification file): no missing local href/src file references.
- Asset manifest: all 182 original asset hashes verified, version `2159c45bb8c3c959`.
- Version metadata updated to 0.4.35; README refreshed to describe the consolidated package.

## Evidence
`qa-0.4.35/audit.json`, `pro-results.json`, `static-checks.json`, captured desktop/mobile screenshots and repeatable test scripts. Scripts currently reference the original local workspace and port 8935; adjust paths when rerunning elsewhere.

## Limits
Automated results are not accessibility certification or exhaustive interaction testing. Firefox, Safari, physical devices, fullscreen, PNG export and all possible custom indicator/drawing combinations were not newly exercised in this final pass. Earlier reports remain historical evidence only. External API correctness/availability, exchange routes, wallet/service behavior and production deployment were not certified. Real EGOR/GRAM candles need a verified source. Trading Desk stays synthetic/demo-only. No deployment or external publication performed.
