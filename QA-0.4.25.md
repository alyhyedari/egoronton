# 0.4.25 — local life prototype

Based on 0.4.23; the separate 0.4.24 draft is not merged.

## Implemented
- Suggest another activity queues a request instead of stopping the current scene. The current scene finishes its existing settle / doing / finish / rest phases, then the next starts from the retained position.
- Phone-call and encouragement vignettes (fictional dialogue, no microphone or network).
- Purple mischief vignette with a procedural SVG horn, purple vector strokes, a soft room tint and Calm EGOR button. Calm advances to the existing finish phase; it does not reset position. This is a vector costume prototype, not an image-edited final character. The raster head remains unchanged.
- Escape stops the daily scene, retaining its position; a 20-second cooldown follows. Other existing controllers retain their own Escape handling.
- CSS transitions disabled with prefers-reduced-motion.

## Executed checks
- node --check: all root JS, MJS and CJS files passed.
- test-position.cjs: 10 mocked position checks passed.
- test-life.cjs: 8 mocked completion, queue cooldown, position and costume-state assertions passed.
- Asset manifest: 182 assets verified.

## Not verified / not implemented
No browser or physical-phone QA performed. No guarantee of complete cross-controller continuity: object interactions, physics reactions, time controls and memory reset can still interrupt daily scenes. No complete combat, room exit/reentry, widget destruction, cooking pipeline, dining table, bathroom or bed choreography. Purple costume is a quiet story vignette, not a battle mode. The cartoon's appearance needs rendered review. No deployment.
