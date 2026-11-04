# 0.4.27 work in progress

## Implemented so far
- Refresh the room clock and period while room physics owns the scene, without replacing its activity image or text.
- Time controls no longer replace the activity image during a physics-owned or active day scene.
- Emit `room-time-change` after time controls change the preview offset. No consumer is implemented yet.

## Checks performed
- `node --check living.js`: passed.
- `node test-position.cjs`: 10 mocked checks passed.
- `node test-life.cjs`: 8 mocked checks passed.
- These existing mocked checks are not targeted clock tests or browser QA.

## Homepage closing-section cleanup
- Replaced the large Community illustration, decorative cards and repeated copy with one heading, a short invitation and two native social links.
- Removed duplicate social links, World and Doodle desk links from the footer; retained token details, FAQ, privacy, artist credit and the full risk/attribution disclaimer.
- Added wrapping/stacking link layout, 44–48px minimum link heights and visible keyboard focus. No new animation or JavaScript.
- Static HTML checks passed: unique IDs, resolved ARIA references, exactly two closing social links, preserved disclaimer.
- `python update_asset_manifest.py --check`: verified 182 asset hashes.
- Browser QA not performed: no browser executable found and Python Playwright is unavailable. Mobile layout and keyboard behavior remain visually/uninteractively unverified.

## Copy restriction and archive
- Added `closing-copy.js` and scoped CSS to prevent ordinary selection, copy, context menus and dragging in Community/footer only. Links and contract-copy controls elsewhere are unchanged.
- This is not content protection: HTML source, screenshots and disabled JavaScript remain possible bypasses.
- `node --check closing-copy.js`: passed; seven mocked copy-guard checks passed. These are not browser QA.
- Full working-project ZIP supplied on request; not a production-ready release. No deployment performed.

## Pending
Interrupted repair recovery, window repair regression, time-change consumers, TV-facing gameplay, bedtime and impact-only wake behavior, targeted clock tests, desktop/mobile browser QA, and release metadata/asset manifest regeneration.

This directory remains a work in progress; the supplied archive is not browser-verified or release-ready.
