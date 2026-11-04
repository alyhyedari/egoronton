# EGOR World 0.4.14 — prototype review

The new activity director has syntax validation only. Browser, accessibility and visual acceptance checks must be repeated. The notes below describe inherited 0.4.13 behavior and tests, not tests of 0.4.14.

## Historical 0.4.13 review

Not deployed. Serve this directory over HTTP and open `market.html`.

## Changes
- Added TV/channel, mirror smudge/clean, mood and fictional screen-knock interactions.
- Pretend cracks can be disabled, dismissed with Escape, or expire; reduced motion suppresses them. No sound or scroll lock.
- Tidy up restores the room. Original static artwork retained; animated SVG limbs are reconstructed, not pixel-identical to the reference.
- Removed saved-holder snapshot UI, fixed count, evidence details, anchor and metadata references. Historical data files remain archival only and were not updated.
- TonAPI reports remain separate; Tonviewer is only a contract inspection link.

## Executed checks for this version
Chromium at 320, 375 and 1440 CSS pixels: no horizontal overflow, no snapshot UI, valid local section anchors, TV toggling, mirror smudge/clean, knock/crack, Escape dismissal and tidy reset passed. Reduced-motion suppression of cracks passed. No runtime exceptions captured. Mobile screenshot visually reviewed.

Results: `QA-0.4.13.json`. External requests blocked during QA: live TonAPI availability and freshness were not tested. Physical phone, pointer dragging, full routine choreography, pause/resume and screen-reader testing were not repeated for this version. Prior-version results are not presented as new checks.
