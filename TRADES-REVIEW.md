# Local trades review — 0.4.35 follow-up

Not deployed. GitHub and production unchanged.

Adds trade-feed.mjs / trade-feed.css to Trading Desk. Chart remains synthetic and its quote selector does not change trades. Trade feed uses only a selected EGOR/TON DeDust pool; it is not a complete EGOR ledger. USD figures are provider estimates. No wallet access.

Automatic initial loading; auto-refresh enabled by default. Optional visible-tab/visible-section refresh every 60 seconds, two sequential API requests (pool identity then trades); five-minute backoff on HTTP 429. In-flight requests time out after 15 seconds and are cancelled when the tab is hidden. No synthetic fallback; retained responses show reception time and error/stale wording. Invalid token sides, mismatched kind, invalid hash/amount/time, and flagged anomalous rows are excluded. Pool address, base/quote token and DEX identities are checked before accepting trade data.

## Checks performed
- Follow-up: automatic initial requests (no click), Buy/Sell row classes and seven columns passed with recorded API responses at all three widths. Buy rows use green and Sell rows red with explicit text labels. Table has capped-height vertical scrolling, horizontal overflow and sticky headers. Actual TON swap amounts added; these are NOT labeled GRAM. No historical pagination is claimed.
- Node module syntax passed.
- Previously captured real API response parsed: six records, both buys and sells.
- Parser checks: wrong pool, wrong token, duplicate IDs, anomalous flag, malformed response, empty array.
- Headless Chromium with intercepted API responses: six rows; Sell filter returns two; HTTP 429 error shown; no page-level horizontal overflow at 320/375/1440; no page errors.
- Browser tests use recorded responses, not a successful live-browser API integration test. Provider CORS/availability and explorer navigation are not verified by these tests.
- Safari, Firefox, physical devices, timer lifecycle edge cases and exhaustive UI states not tested. Not accessibility certification.
