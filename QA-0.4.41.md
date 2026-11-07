# EGOR World 0.4.41 — local prototype QA

## Result
PASS: the configured Chromium browser suite completed with 14 passing checks and exit code 0. Progression unit checks and JavaScript module syntax checks also passed. This is a local functional-test result, not production approval or certification across browsers/devices.

## Coverage
- Desktop touch controls hidden; English W and Persian-layout physical KeyW movement.
- Pause freezes movement; notebook opens/closes; locked projects and palette selection.
- Three introductory lights and ending/stay action.
- All five places, nine discoveries and eight linked projects; completion summary.
- Reload preserves progress and palette; safe return; reset cancellation and confirmed reset.
- No uncaught page errors or HTTP responses >=400 in the desktop scenario.
- Touch-first emulation at 320×568, 375×812 and 812×375 CSS pixels: entry, notebook overflow, controls and joystick pointer movement.
- Blocked storage displays the visit-only saving warning.
- Unit checks: malformed saved state, unknown/duplicate discovery IDs, complete restoration, invalid prerequisite cascades, locked prerequisites.

## Fix and test-harness changes
- Guarded the optional `matches` method on keyboard-event targets in `play/world.mjs`, avoiding a runtime exception when a target is not an Element.
- Reset's browser test now waits explicitly for navigation alongside the click, then waits for the entry control to become ready. It still asserts the saved state was removed.
- Software rendering needed state-based readiness waits, up to 180 seconds for desktop operations. The successful run used deviceScaleFactor 0.5 to reduce rendering cost; screenshot pixel dimensions are therefore half the CSS viewport dimensions.

## Important limits
- Place/discovery progression used programmatic player positioning followed by real keyboard/UI interactions. This validates interaction and state logic, NOT end-to-end walking/navigation, collision-free paths or discovery usability.
- Mobile checks used Chromium touch-first emulation and mouse-driven pointer input on the joystick, not real fingers or hardware. Safari, Firefox, real Android/iOS, Telegram WebViews, multitouch and sustained performance remain unverified.
- Desktop coverage is not exhaustive for every key, mouse-look, sound, sensitivity or reduced-motion behavior. Reduced motion was requested by the test browser, not comprehensively audited.
- No claim of hours of tested gameplay or production readiness.
- Progress remains browser-local under `egor-neighborhood-0441`. Clearing browser data erases it. No account or cloud synchronization exists.
- No Telegram integration has been implemented. Production was not deployed or edited in this work; the inherited `release.json` remains 0.4.35 deliberately.
- New neighborhood visuals are procedural. This full local snapshot includes inherited site assets; their presence does not establish redistribution or third-party artwork permissions.

## Evidence and rerun
See `qa-0441/browser-results.json`, `browser-run.log`, screenshots, and `progression-results.txt`.

From the extracted project folder:

```sh
python3 -m http.server 8845 --bind 127.0.0.1
# In another terminal:
node qa-0441/test-progression.mjs
# Install playwright-core in your test environment, then set Chromium's path:
CHROMIUM_PATH=/path/to/chromium node qa-0441/test-browser.cjs
```

The browser test expects `http://127.0.0.1:8845/play/`. `PLAYWRIGHT_MODULE` can point to an installed playwright-core module. Its contexts are isolated and reset only their own test saves.
