# Local first-person study — 0.4.37

Local review only. No deployment or GitHub changes. Copied from 0.4.36; prior versions preserved. Trading Desk implementation unchanged.

Run `python -m http.server 8000` here and visit http://localhost:8000/market.html (doorway) or /play/ directly. Do not open ES modules with file://.

Implemented: first-person camera without head bob, accelerated camera-relative movement and collision, left analog stick plus independent right drag, arrow-key turning, keyboard movement, run toggle, sensitivity slider, reduced-motion bypass, skippable 3.8-second arrival, portrait and short-landscape control layouts. Procedural paper grain, ink seams, open doorway, pencil landmark and bunting. No new third-party game art. Geometry remains temporary; no artist endorsement or game-art license implied. Existing site credits retained.

QA: headless Chromium with SwiftShader at 320x740, 375x812, 844x390 and 1440x900 passed load, forward movement, pause, three-light state (using injected player positions, not full route traversal), ending/continue, no horizontal overflow and no JS errors. Synthetic independent pointer events passed movement/cancel reset; skipped entrance tested. These are not real-device multitouch, GPU performance or complete visual/accessibility tests. Camera now occupies the player's viewpoint, removing third-person avatar occlusion, but world collision coverage still needs playtesting.

Remaining: bespoke licensed EGOR assets/host, stronger art direction, fully continuous room-to-world transition (current room still navigates to play), control-size setting, real phones/Safari/Firefox, full mission route traversal, audio-output and sustained-performance testing. Not production-ready. Parent release/asset manifests remain inherited; no release metadata migration or deployment packaging validation is claimed.
