# EGOR source comparison — read-only research

Captured 2026-11-04 around 09:37 UTC. Exact receipt times, request URLs and HTTP response headers are in `*-headers.json`; bodies in `*.json`. Receipt time is not the provider's underlying market observation time. No site files, release packages or deployments changed.

## Identity

DexScreener and GeckoTerminal returned HTTP 200 and the exact same case-sensitive pool address `EQCPXfpc_WZg2zLocLIN0-YyJuSwe6V8GPsPcElX23j1CHYF` and EGOR token address `EQAO_tYpLbPq-GOXegYTYtFaQ0tMkxLBxzYF8cUCGGWAj_aA`. Both identify DeDust (GeckoTerminal: dedust-v2). Do not lowercase TON addresses when making API requests.

## Reported values (snapshot, not live)

| Field | DexScreener | GeckoTerminal |
|---|---:|---:|
| EGOR USD price | 0.00004525 | 0.0000453343407396128 |
| Pool liquidity / reserve USD | 8722.41 | 8655.765 |
| 24h USD volume | 351.28 | 350.8476696377 |
| FDV USD | 45258 | 45334.34074 |
| Market cap USD | 45258 | null |
| Quote token label | Gram / GRAM | Toncoin / TON |

Quote token address is identical despite conflicting display labels. Do not infer a separate jetton or pool from names alone. Values are not synchronized and liquidity fields may have provider-specific definitions. No cause of differences verified. Do not average sources or silently substitute FDV for market cap.

## TonAPI

HTTP 200. Metadata reports EGOR ZHGUN / EGOR, decimals 9, raw total supply 1000000000000000000 (= 1,000,000,000 tokens), mintable false and holders_count 296. This is a provider-reported address count captured at request time, not people and not a reconciliation of the older 297-address snapshot. No holder pages fetched this time. Whitelist status is not a security assurance. Prior balance/supply discrepancy remains unresolved; do not publish distribution percentages.

## DeDust direct

Attempted GET `https://api.dedust.io/v2/pools/EQCPXfpc_WZg2zLocLIN0-YyJuSwe6V8GPsPcElX23j1CHYF` returned HTTP 404. This endpoint attempt does not establish that the pool is absent or DeDust unavailable. Correct documented API route still needs verification. No direct DeDust market values verified.

## Integration recommendation (not implemented)

- Keep market requests opt-in; use one primary source and an explicitly labeled fallback, never hidden source blending.
- Label receipt time separately from provider observation time (unknown here), show stale/error state, and allow manual refresh.
- Use TonAPI for token metadata and attributed holder-address counts, not independent pool-price corroboration.
- Keep chart loading opt-in; these JSON fetches do not verify embedded-chart availability.
- CORS headers were observed from server-side requests only; actual browser, caching, timeout, rate-limit and failure-state tests remain necessary.
- Preserve existing release archive unchanged until integration and testing are explicitly undertaken.
