# EGOR World 0.4.28 — local review

Not deployed. Production and 0.4.27 were not modified.

## Changes
- TV moved to the upper-left wall bay above the shelf, separate from EGOR's normal central standing area. Its width is 23% on mobile and desktop.
- Decorative actor and speech bubble do not intercept pointer input.
- Physics visibility observes the whole room so using controls below the stage does not cancel replacement scenes.
- Object release preserves actor position; sleeping suppresses sorting and replacement scenes; shelf damage uses deterministic movement.

## Executed verification
- Chromium: 48/48 checks across 320px mobile, 375px mobile with reduced motion, and 1440px desktop. Includes a geometric assertion that TV is clear of the standing actor and above the shelf, touch/click TV toggles, keyboard controls, Escape, scene preservation, sleep fixture, dragging and permissions.
- No uncaught JavaScript errors. External requests blocked in the test harness. Service workers blocked.
- 8 mocked life checks and 10 mocked position checks passed; these are not browser QA.
- 182 asset hashes verified. Manifest regenerated; assets unchanged.
- Browser evidence: `qa-0.4.28/browser-results.json` and viewport PNGs.

## Scope and limits
Tests are automated Chromium interactions, not physical-device or cross-browser certification. Sleep uses an explicitly injected fixture. TV separation assertion covers the normal standing layout, not every frame of every scene. Screenshots are rendering evidence, not additional interaction tests. External market service behavior is not validated. Existing earlier QA documents describe earlier builds only.

Run locally with `python -m http.server 8765 --bind 127.0.0.1`, then open `/market.html`. Browser tests require Playwright Core and Chromium (paths configurable in test-browser.cjs).
