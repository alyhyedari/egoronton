# EGOR World 0.4.11 — local review

Not deployed. Serve this directory over HTTP and open market.html.

## Changes
- Automatic TonAPI requests while the reports section and tab are visible. One-minute endpoint cooldown, rate-limit backoff, stop controls, no other provider. Existing token identity checks and receipt timestamps retained. Time previews never alter market data.
- Autonomous, clock-based home vignettes: breakfast, design, learning, work, cooking, games, reading and rest. Schedule changes approximately every 90 seconds; time preview spans ±168 hours.
- Three movable props with pointer, tap and keyboard controls. EGOR notices, complains playfully after repeated interference and resets their positions after about 7 seconds of visible, unpaused life.
- Local-only room positions, visit count and time offset; clear-memory control; storage failures do not prevent use. No wallet, device access or real threats.
- Original character artwork unchanged. Activities reuse existing poses with captions, not bespoke animated cooking or gaming sequences. Prop reset is an illustrated interaction, not an animated physical walk-and-carry action.

## Verification and limits
- JavaScript syntax checks passed.
- Real Chromium headless browser: 375px and 1440px screenshots; mobile overflow, three props, time preview, notice and return interaction, automatic-refresh checkbox checked.
- Browser tests do not verify actual TonAPI responses, historical coverage or real mobile hardware. No claim of comprehensive regression coverage.
- Reduced motion disables animation without stopping autonomous text routines. Pause life stops routine progression and prop reactions. Background tabs pause work.
- No new artwork generated; body/legs assets are byte-identical to 0.4.10.
