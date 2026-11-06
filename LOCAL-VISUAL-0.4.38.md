# 0.4.38 — Blue Hour neighborhood / local visual review

Separate local copy of 0.4.37. No live deployment or GitHub changes. Site and Trading Desk inherited unchanged. Parent release manifests are not migrated; not a production release.

Original code-generated scenery: four named two-storey destinations, framed lit windows, striped awnings, planter boxes, roof/chimney details, distant skyline, clock tower, moon/cloud silhouettes, lantern-lined lane, paving seams, pencil basin and planted beds. New basin, lanterns and beds have collision bounds. First-person FOV reduced from 72 to 68; paper grain softened and captions given a contrasting panel. No external art added or artist endorsement implied.

Run python -m http.server 8000 from this directory, then open /play/.

Validation: headless Chromium/SwiftShader at 320x740, 375x812, 844x390, 1440x900 passed loading, forward movement, pause, lights via injected positions, ending/continue, overflow and JS-error checks. Mobile screenshot inspected during refinement. Full navigated mission route, additional-browser/device checks, real multitouch, accessibility, audio output and sustained GPU performance are not verified. Additional scenery increases render cost; profile on actual phones before release. Earlier QA folders belong to earlier builds.
