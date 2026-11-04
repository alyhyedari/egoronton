# EGOR World 0.4.16 — room physics prototype

New: three draggable/throwable SVG props, gravity and damped bounces, simplified object collisions, cascading shelf impacts, pretend window/mirror/TV cracks and coffee spills. Grab EGOR to elicit objections and bounded arm movement; repeated grabs trigger a nine-second fictional laptop boundary. Escape always releases and unlocks; Repair resets damage. Arrow keys move props; Shift + arrow throws. Reduced motion disables release/keyboard throwing. Pause and hidden/offscreen states freeze simulation. Facing uses a subtle directional face offset, not full profile artwork. Collision shapes are approximate; this is not a full rigid-body or ragdoll engine. Only the three loose props can be thrown; fixtures are impact targets. No permissions, audio or network are added by physics. Headless Chromium: 21 checks passed across 320/375/1440 widths on a resized page, including real pointer capture/drag, damage, repair, boundary and Escape. Physical phones and live market not tested. Not deployed.

Previous 0.4.15 routine work:

New in this prototype: eight routines with approach, settle, activity, finish and return phases; hand-attached SVG props; a progressively drawn sketch; and activity-aware interruption dialogue. Work is a short fictional studio absence, not a real-hour schedule. Routines pause offscreen and when life is paused. Headless Chromium scripted phase checks passed at 320, 375 and 1440 pixels, with reduced-motion travel disabled. External requests were blocked: live market data and physical phones were not tested. Repeated-navigation testing timed out; the successful phase run resized a single loaded page. This remains a prototype: interruptions still reset position rather than performing a complete put-down animation. No online deployment.


Static, wallet-free site with a standalone market report at `market.html`. Not deployed.

## Character and object choreography
The “At home with EGOR” section on `market.html` retains the supplied character image for routine vignettes. Object interactions use a lightweight SVG rig: original head/torso and foot image fragments, with articulated line arms and legs. EGOR approaches, bends, lifts, carries, lowers and releases each displaced prop before returning. The source artwork is unchanged, but moving limbs are reconstructed rather than pixel-identical. Reduced-motion mode returns objects without travel animation. See `LIVING-REVIEW.md` for verification and limits.

## Market report
- TonAPI is the only source of displayed figures. No automatic provider fallback, external chart, wallet connection or trading interface.
- The homepage links to the report; it does not load the market API module.
- TonAPI requests start automatically when reports are visible, with stop controls. Requests share connection information (including IP address) with TonAPI. No API keys are bundled.
- Optional 60-second refresh runs only while the reports section and browser tab are visible. Refreshes have a cooldown, time out, and stop after errors; retry is manual. Stop cancels pending requests.
- API responses use `cache: 'no-store'` and are not written to browser storage. The service worker handles same-origin static assets only.
- Metadata must match the configured raw token address and 9 decimals. Rates must match the same address; malformed fields become unavailable, and wholly invalid reports are rejected. Unicode minus is supported for percentage changes.
- Browser receipt time is not provider observation time or a blockchain timestamp. TonAPI freshness is unverified; these are on-demand reports, not a live feed.
- Tonviewer is an inspection link only, never a numeric data provider.

## Removed holder snapshot
The saved-holder card, fixed count, evidence details and related navigation were removed from `market.html`. Historical files under `data/` are retained only as audit material, not displayed figures. No snapshot was refreshed. Distribution percentages remain unpublished.

Historical source captures under `data/` include a DexScreener response retained as audit material; it is not used for displayed quotes or fallback. The report does not calculate liquidity, volume, circulating market capitalization, FDV, holder concentration, or a price chart.

## Preview and asset integrity
Run `python -m http.server 8000` in this directory and open http://localhost:8000/market.html.
No build tools, secrets or wallet connection are needed.

After editing files under `assets/`, run `python update_asset_manifest.py` to regenerate their SHA-256 hashes and the content-derived manifest version. Use `python update_asset_manifest.py --check` to verify it without writing. The service worker keeps its stable cache namespace and uses per-asset hashes as cache keys. HTML, CSS, application scripts and API responses are not stored by that asset cache; the manifest is not a full release-integrity inventory.

## Verification scope
Parser and browser checks must use TonAPI fixtures, not the historical multi-provider test. Mock responses can verify rendering, privacy controls and failure handling; they cannot certify real TonAPI availability, CORS behavior, data correctness or freshness. A full independent accessibility audit, all-browser regression and SEO ranking are not guaranteed.

The upstream deployment configuration and original build scripts were not recovered. Do not assume original hosting headers/settings are reproduced. Vercel's generated `_vercel` runtime scripts are excluded; existing homepage monitoring code may request those platform endpoints on non-local HTTPS hosts unless privacy settings disable it. The standalone market page does not include monitoring scripts.

Nothing in this local review build authorizes deployment, external submissions or payments.
