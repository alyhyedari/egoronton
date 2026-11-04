# 0.4.19 — Automatic room care

Local prototype; not deployed.

## Changes
- After an interaction and 1.4 seconds of settled, idle room time, EGOR retrieves displaced belongings using the existing approach/reach/lift/carry/lower/release choreography.
- Physics coordinates stay synchronized with choreography; original positions come from the actual initial layout, not index-based reset constants.
- Displaced items are returned before sequential repair of damaged fixtures and spills.
- No competing physics during carrying; repair scenes and carrying are mutually exclusive.
- Stop scene and Escape cancel queued automatic care. A new interaction can request care again. Blur, hidden document, offscreen room, pause and motion-preference changes cancel pending care.
- Reduced motion restores belongings without travel animation.

## Executed verification
- Chromium real CDP mouse drag/release: object flight, automatic pickup observed, all three objects at home after completion.
- Escape during a second throw: no pending care or carrying after three seconds.
- No horizontal overflow at 320, 375, 1440 CSS pixels.
- Two damaged targets injected as fixtures; real keyboard movement triggered retrieval followed by sequential repairs in real elapsed time. Both damage classes removed; no remaining pending queue.
- Reduced-motion keyboard displacement: returned to original position, no active carry after four seconds.
- No JavaScript exceptions observed in the recorded pointer and repair runs.
- JavaScript syntax and asset-manifest validation run before packaging.

Damage fixture testing does not prove every possible collision trajectory. Physical phones, other browsers and live market data were not tested. External HTTPS blocked during main browser tests. Existing 0.4.18 QA describes that older release, not a fresh full regression of this release.

Run: `python3 -m http.server 8000`, then visit `http://localhost:8000/market.html`.
