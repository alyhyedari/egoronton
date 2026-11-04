# 0.4.23 local WIP checks

## Changes
- Market heading uses a positive mobile gap. Artwork is centered on narrow screens; its caption occupies normal flow instead of overlaying the artwork. Heading children can shrink and wrap.
- Daily scenes now rest at their destination rather than interpolating back to zero. The next scene starts at the current position.
- Reduced-motion daily scenes retain their starting position; enabling reduced motion during object choreography preserves the actor position.
- Explicit room memory reset still resets the position.

## Executed
- All root .js and .mjs files passed node --check.
- test-position.cjs: 10 mocked director checks passed, covering normal and reduced-motion positions through activity completion. These are logic tests, not rendered browser tests.
- Asset manifest check passed: 182 assets.

## Limitations
No browser rendering, keyboard, overlap, physical phone or live TonAPI test was performed for this version. Earlier QA reports apply only to their named versions. Room interactions and layout still require browser regression checks. No online deployment performed.
