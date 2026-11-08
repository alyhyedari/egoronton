# EGOR World 0.4.41-integrated.1 — complete local review package

This is the complete static site plus the `/play/` game, not a deployed release. The six existing pages and their local assets are retained. An independent homepage door follows the welcome section and precedes `idea-workshop`.

Current verification: `QA-INTEGRATED-fa.md`. Unit/progression/asset checks passed after the English entry update, but the latest browser rerun remains incomplete due to screenshot and element-visibility timeouts. Earlier successful browser results are retained as historical evidence, not certification of the latest copy changes. Earlier versioned reports are historical, not fresh QA of this build.

## Preview
From this directory run:

```sh
python3 -m http.server 18854 --bind 127.0.0.1
```

Open http://127.0.0.1:18854/ or http://127.0.0.1:18854/play/ . Use HTTP rather than opening HTML files directly. This binds only to loopback. Existing market/provider and external-link behavior is retained; serving locally does not itself block outbound browser requests. Automated browser QA intercepts non-local requests.

## Pages
- `index.html`: homepage and community/sticker sections
- `trading-desk.html`: customizable synthetic demonstration chart
- `market.html`: separate TonAPI market report and interactive room
- `egor-zhgun.html`: artist context
- `roadmap-notes.html`: roadmap notes
- `portrait-studio.html`: portrait studio
- `play/index.html`: first-person neighborhood, progression, tutorial, settings and garage/driving prototype

## Included improvements
Paper/night theme readability, navigation refinements, explicit night surfaces in sticker stories and Stay connected, keyboard focus indicators, and the configurable Trading Desk with indicators, drawing tools, saved settings and CSV/PNG export. Original image assets and attribution are preserved.

## Data and privacy
Trading Desk candles and quote selection are synthetic demonstrations, NOT real market prices, live EGOR/GRAM candles or executable quotes. A verified market/data source is still required before enabling real chart data. Trading Desk is noindex and does not connect a wallet.

The separate market page requests TonAPI reports automatically when visible, with stop controls. Browser receipt time is not provider observation time; freshness and current external availability are not certified. Requests share connection information with that provider. Historical files under `data/` are audit material, not a quote fallback. Holder distribution percentages remain unpublished because of unresolved snapshot inconsistencies.

On non-local HTTPS hosting, existing monitoring code may request Vercel platform endpoints unless disabled by privacy settings. Hosting configuration must be reviewed before deployment; this package does not recreate or certify production settings.

## Verification and delivery
See `QA-INTEGRATED-fa.md` and `qa/integrated/` for current final local checks. Game screenshots/results are in `qa/startup/`, `qa/focused/` and `qa/gameplay/`. Earlier QA reports describe earlier builds, not additional coverage of this release. `SHA256SUMS.txt` lists all packaged-file hashes except itself. Verify with `sha256sum -c SHA256SUMS.txt`; verify the asset manifest with `python3 update_asset_manifest.py --check`.

No deployment, external submission or social publication has been performed. Real devices, Telegram WebView, Safari and Firefox remain untested. Artwork licensing and attribution clearance remain unverified. Azure 01 is an original unofficial vehicle prototype, not an endorsed branded asset. The existing interactive room retains approximate physics and reconstructed animated line limbs; original source images are unchanged.

## Reproducing QA
Unit checks: `node --test tests/vehicle.test.mjs` and `node qa-0441/test-progression.mjs`.
Browser scripts: `tests/integrated-entry.cjs`, `tests/startup-browser.cjs`, `tests/focused-browser.cjs`, `tests/gameplay-browser.cjs`. Run sequentially with `BASE_URL=http://127.0.0.1:18854` while the local server is running. These scripts were run in the supplied Linux Chromium/Playwright harness; its browser and Node dependencies are not bundled. Inspect their browser/module paths before running elsewhere (some support `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH`; gameplay retains harness-specific paths). Mobile checks are viewport/touch emulation, not physical-device certification. Some interaction/progression checks use assisted positions, not end-to-end navigation.
