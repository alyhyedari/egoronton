# Somewhere Outside — local 0.4.36 review

Not a production release. Nothing deployed or pushed. Base 0.4.35 is untouched.

## Open locally
From this directory run `python -m http.server 8000`, then open http://localhost:8000/market.html and choose the new doorway below the room, or open http://localhost:8000/play/ directly. ES modules require HTTP; do not double-click the HTML file.

## Changes
- Added a keyboard-accessible doorway below the existing room, without editing its art.
- Standalone PlayCanvas 2.8.2 neighborhood, geometric temporary traveler, collision boundaries, keyboard and pointer movement, running, three lights, connecting blue threads and a return-home ending.
- Light activation adds a brief ground pulse; ambient light grows with progress. Optional floating particles stop under reduced motion.
- Pause, continue exploring, restart confirmation, optional synthesized sound, reduced-motion camera, context-loss notice, WebGL startup fallback.
- Fixed incompatible scene fog assignment and interaction blocked by button focus.
- No wallet, payments, rewards, user accounts, chat, or saved progress.

## Automated coverage
Headless Chromium 1243, SwiftShader/software WebGL, widths 320 / 375 / 1440, height 900.
- Engine starts, keyboard movement, three lights, repeat activation does not increase count, pause stops movement, home ending and continue exploring.
- Game has no horizontal overflow or uncaught page errors in these runs.
- WebGL unavailable: explanatory text and disabled entry.
- Room doorway navigates to game at all three sizes. Pointer-held directional button moves player (mouse pointer in touch-enabled browser context, NOT physical-device touch testing).
- Gameplay traversal accelerated through engine update ticks with keyboard inputs. This is functional QA, not performance measurement.

Results: `qa-0.4.36/`. Screenshots are software-rendered review captures.

## Remaining / limitations
- Temporary primitive art is NOT final EGOR artwork and is not artist-endorsed. Existing site credits retained; permission for game use remains unconfirmed.
- Buildings can obscure the traveler from the current camera angle: next camera iteration needs occluder handling.
- No real mobile hardware, Safari, Firefox, screen-reader, audio-output or sustained performance testing. No claim of complete accessibility.
- Context-loss recovery requires reload; context-loss behavior is not covered by this automated run.
- Original production release metadata/cache manifests are intentionally retained from the base. This package is for local review, not deployment. Review cache/version metadata before any future approved release.
- Trading Desk and live providers were not changed or revalidated. No SEO gains claimed.

Third-party engine: PlayCanvas 2.8.2, MIT; license included in play/vendor/LICENSE.
