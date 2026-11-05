# EGOR World 0.4.29 — favicon update

Local package only; no deployment or Search Console action performed.

## Changes
- Preserved the original EGOR icon artwork.
- Added a stable root `/favicon.png` (144 × 144 pixels).
- Regenerated `/favicon.ico` with 16, 32, 48 and 64 pixel entries.
- Standardized icon declarations across all HTML documents with a head element; retained the 180 pixel Apple touch icon.
- Updated release.json to 0.4.29. Application behavior and asset artwork were not changed.

## Verification
- All 182 asset hashes verified with update_asset_manifest.py --check.
- 8 mocked finish/queue/costume checks passed.
- 10 mocked position checks passed.
- HTML icon references, PNG dimensions and ICO entries checked locally.
- robots.txt allows crawling.
- Prior 0.4.28 Chromium results describe the base release, not a new browser run for 0.4.29.

## Deployment follow-up
Deploy the complete package only when approved. Check that the production homepage and both root favicon files return HTTP 200 without authentication, redirects to HTML, or crawler blocks. Hosting configuration and live crawler access have not been verified by this local test. The previous package already contained favicon declarations; the exact reason for Google's placeholder is unconfirmed.

After deployment, inspect https://www.egorverse.xyz/ in Google Search Console and request indexing if available. Google controls recrawl timing and whether a favicon is displayed; this package cannot guarantee immediate appearance. Keep favicon URLs stable. Confirm the apex domain redirects consistently to the chosen www canonical domain in the hosting dashboard.
