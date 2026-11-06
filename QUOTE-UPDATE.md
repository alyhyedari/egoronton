# Trading Desk quote-currency update — 0.4.35

Local review only; no deployment or GitHub changes.

- Network is explicitly TON, separate from base asset EGOR and quote currency.
- Quotes: GRAM, USD, USDT, EUR, GBP. Removed TON as a separate quote choice; previously stored TON preferences fall back to GRAM. Existing drawing slots are not migrated between different synthetic datasets.
- Each option uses an independent deterministic synthetic dataset, not cross-rates, available trading pairs, or market prices.
- Gram naming reference: https://ton.org/ (official search result identifies Gram as the native coin, previously Toncoin).
- Chromium: five quotes at widths 320, 375, 1440; finite displayed prices, 20 table rows, matching pair titles, no horizontal overflow or page errors; GBP preference survives reload. Results: qa-0.4.35/quote-results.json.
- JavaScript syntax check passed. Not exhaustive interaction or accessibility testing; other browsers untested.

This package includes the prior shared header update. Version remains 0.4.35.
