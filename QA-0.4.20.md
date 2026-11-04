# EGOR World 0.4.20 — local QA

## Changes
- Prioritize coffee spills as independent cleaning tasks; do not repair unrelated damage while wiping a spill.
- Continue through remaining damage after cleaning.
- Preserve EGOR's current position when interrupting daily activities and moving between restoration tasks.
- Keep daily activities from starting while automatic care is pending.
- Reposition the TV to avoid the bookshelf at tested widths.

## Executed verification
Chromium via the Chrome DevTools Protocol against the locally served market.html; external HTTPS requests blocked. 17/17 assertions passed in the final run (see QA-0.4.20.json):
- Spill selected before damaged shelf.
- Spill removed while shelf still damaged.
- Shelf selected next; next task's starting horizontal position matches previous task within 1 pixel.
- Repair queue completes and final position remains in choreography mode.
- No horizontal document overflow at 320, 375, and 1440 CSS pixels.
- TV and bookshelf bounding boxes do not overlap at all three widths.
- Escape test begins an active scene; Escape stops care and leaves unfinished damage intact.
- Emulated reduced-motion preference is active; repair completes under that preference.
- No captured JavaScript runtime exceptions.

All root JavaScript files passed `node --check`. Asset manifest check verified 182 assets.

## Test corrections and limitations
The harness polls completion with bounded waits rather than assuming wall-clock duration: scene time advances only while visible and frame delta is capped. The harness waits for media-query changes to settle and scrolls the stage into view before starting the reduced-motion scenario. Changing viewport sizes or preferences can change page geometry and intentionally suspend an offscreen room.

Damage and spill fixtures were injected through the DOM; the final suite does not re-test every pointer/throw interaction from earlier releases. Position assertions measure internal horizontal coordinates and retained choreography state, not a frame-by-frame visual audit. Viewport emulation is not physical-phone testing. No other browsers, live market data, full accessibility audit, or production deployment were verified. All scenes and deliveries are fictional/offline. No online deployment was performed.
