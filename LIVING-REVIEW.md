# EGOR World 0.4.12 — local review

Not deployed. Serve this directory over HTTP and open `market.html`.

## Changes
- Object-return choreography: notice, approach, reach/bend, lift, carry, lower, release, then return to the resting position. Multiple displaced props are handled sequentially.
- Original head/torso and foot image fragments with reconstructed SVG line limbs during choreography. Source artwork is unchanged; animated limbs are not pixel-identical to the original drawing.
- Feet step with the legs; the shadow follows lateral travel. Object coordinates follow the hand during transport.
- SVG book, cup and gamepad replace platform-dependent glyphs. Pointer/tap and arrow-key controls retained.
- Pause/resume and visibility suspension retained. Reduced-motion users receive an immediate prop return after the notice delay, without travel animation.
- Existing local-only room memory and time preview retained. Clear memory cancels active choreography and restores object positions.
- Existing automatic TonAPI-only reports retained; no provider fallback or new market snapshot. Time previews affect routines, not market data.

## Verification
- Chromium at 320, 375 and 1440 CSS pixels: no page overflow; keyboard prop movement; pause stability; completed return.
- Reduced-motion return, time preview and memory clearing passed. No runtime exceptions captured in that run.
- Mobile and desktop screenshots visually reviewed, including desktop carrying pose.
- External network requests were blocked in browser QA. Actual TonAPI responses, availability and freshness were not verified in this release.
- Source JavaScript syntax, asset manifest and ZIP contents checked separately during packaging.

## Limits
- A lightweight 2D rig, not a physics simulation or frame-by-frame character animation. Contact and limb shapes remain approximate, particularly at narrow scene edges.
- Existing cooking, gaming and other routines remain illustrated vignettes with captions; this release does not add bespoke animations for each activity.
- No physical-phone test, comprehensive accessibility audit or all-browser regression is claimed.
- No online deployment or external submission performed.
