# EGOR World 0.4.9 — local review build

Static, wallet-free site with a standalone market report at `market.html`. Not deployed.

## Market report
- TonAPI is the only source of displayed figures. No automatic provider fallback, external chart, wallet connection or trading interface.
- The homepage links to the report; it does not load the market API module.
- Current-session opt-in is required before requests to TonAPI. Requests share connection information (including IP address) with TonAPI. No API keys are bundled.
- Optional 60-second refresh runs only while the reports section and browser tab are visible. Refreshes have a cooldown, time out, and stop after errors; retry is manual. Stop cancels pending requests.
- API responses use `cache: 'no-store'` and are not written to browser storage. The service worker handles same-origin static assets only.
- Metadata must match the configured raw token address and 9 decimals. Rates must match the same address; malformed fields become unavailable, and wholly invalid reports are rejected. Unicode minus is supported for percentage changes.
- Browser receipt time is not provider observation time or a blockchain timestamp. TonAPI freshness is unverified; these are on-demand reports, not a live feed.
- Tonviewer is an inspection link only, never a numeric data provider.

## Saved snapshot and limitations
The static holder report remains readable without JavaScript. It records 297 holder addresses, not 297 people. The saved HTTP Date header is 4 November 2026, 08:24:33 UTC; it does not establish a synchronized blockchain block.

Distribution percentages are withheld: saved balances total `1001608826275396994` base units, versus reported supply `1000000000000000000` (9 decimals). The cause is unresolved; this is not evidence of minting or fraud. Pool balances are included and other contracts are not exhaustively classified. Fresh metadata does not update the saved holder rows or resolve their discrepancy.

Historical source captures under `data/` include a DexScreener response retained as audit material; it is not used for displayed quotes or fallback. The report does not calculate liquidity, volume, circulating market capitalization, FDV, holder concentration, or a price chart.

## Preview and asset integrity
Run `python -m http.server 8000` in this directory and open http://localhost:8000/market.html.
No build tools, secrets or wallet connection are needed.

After editing files under `assets/`, run `python update_asset_manifest.py` to regenerate their SHA-256 hashes and the content-derived manifest version. Use `python update_asset_manifest.py --check` to verify it without writing. The service worker keeps its stable cache namespace and uses per-asset hashes as cache keys. HTML, CSS, application scripts and API responses are not stored by that asset cache; the manifest is not a full release-integrity inventory.

## Verification scope
Parser and browser checks must use TonAPI fixtures, not the historical multi-provider test. Mock responses can verify rendering, privacy controls and failure handling; they cannot certify real TonAPI availability, CORS behavior, data correctness or freshness. A full independent accessibility audit, all-browser regression and SEO ranking are not guaranteed.

The upstream deployment configuration and original build scripts were not recovered. Do not assume original hosting headers/settings are reproduced. Vercel's generated `_vercel` runtime scripts are excluded; existing homepage monitoring code may request those platform endpoints on non-local HTTPS hosts unless privacy settings disable it. The standalone market page does not include monitoring scripts.

Nothing in this local review build authorizes deployment, external submissions or payments.
