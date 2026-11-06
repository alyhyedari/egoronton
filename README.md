# EGOR World 0.4.35 — complete local review package

This is a static site, not a deployed release. All six pages and their local assets are included.

## Preview
From this directory run:

```sh
python -m http.server 8000
```

Open http://localhost:8000/ . Use HTTP rather than opening HTML files directly.

## Pages
- `index.html`: homepage and community/sticker sections
- `trading-desk.html`: customizable synthetic demonstration chart
- `market.html`: separate TonAPI market report and interactive room
- `egor-zhgun.html`: artist context
- `roadmap-notes.html`: roadmap notes
- `portrait-studio.html`: portrait studio

## Included improvements
Paper/night theme readability, navigation refinements, explicit night surfaces in sticker stories and Stay connected, keyboard focus indicators, and the configurable Trading Desk with indicators, drawing tools, saved settings and CSV/PNG export. Original image assets and attribution are preserved.

## Data and privacy
Trading Desk candles and quote selection are synthetic demonstrations, NOT real market prices, live EGOR/GRAM candles or executable quotes. A verified market/data source is still required before enabling real chart data. Trading Desk is noindex and does not connect a wallet.

The separate market page requests TonAPI reports automatically when visible, with stop controls. Browser receipt time is not provider observation time; freshness and current external availability are not certified. Requests share connection information with that provider. Historical files under `data/` are audit material, not a quote fallback. Holder distribution percentages remain unpublished because of unresolved snapshot inconsistencies.

On non-local HTTPS hosting, existing monitoring code may request Vercel platform endpoints unless disabled by privacy settings. Hosting configuration must be reviewed before deployment; this package does not recreate or certify production settings.

## Verification and delivery
See `QA-0.4.35.md` and `qa-0.4.35/` for final local checks and screenshots. Earlier QA reports describe earlier builds, not additional coverage of this release. `SHA256SUMS.txt` lists packaged-file hashes except itself. Verify original artwork hashes with `python update_asset_manifest.py --check`.

No deployment, external submission or social publication has been performed. Real devices, Safari and Firefox remain untested. The interactive room is a prototype with approximate physics and reconstructed animated line limbs; original source images are unchanged.
