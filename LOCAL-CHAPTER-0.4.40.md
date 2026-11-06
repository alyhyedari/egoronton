# Local prototype 0.4.40 — The Unfinished Street

Separate local review build; not deployed. Existing production release metadata is retained because this is not a production release.

Start: `python3 -m http.server 8080` in this folder, then open http://localhost:8080/play/ . ES modules require HTTP, not file://.

A furnished starting room leads to an ink-outline street. Three connected acts grow a planter, illuminate a window, and place a second cup on a bench. Completing them fills the unfinished buildings with colour and reveals a golden arch. Return to the room for the ending, then continue exploring.

Controls: physical WASD (including Persian layout), drag mouse to look, arrows forward/back and turn, Shift run, E interact, Escape pause. Touch joystick/look/run retained. Reduced motion and sound controls retained. Progress lasts for the visit.

QA: Syntax checks passed. Chromium/SwiftShader tested at 320x740, 375x812, 844x390, 1440x900: load, movement, pause, interaction state via position injection, ending/continue, no horizontal overflow, no page errors. A separate 640x480 keyboard-only route test passed through the doorway, all three objects, and return, without position injection; physical KeyW with Persian key text also passed. Screenshot reviewed at desktop size. Tests do not establish performance on real mobile hardware or usability on every laptop.

This remains procedural prototype art, not a finished commercial game. No new third-party art or character replicas.
