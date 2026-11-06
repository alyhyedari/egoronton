# Screenshot contrast follow-up — local only

Changed `themes.css`: removed incorrect dark-ink override from sticker stories and final CTA; assigned explicit night foreground/background tokens, opaque sticker cards, cyan accents and visible keyboard focus outlines. Paper theme unchanged. Artwork and attribution unchanged. No deployment performed.

Validation: Playwright Chromium headless, widths 320, 375, 760, 1440, paper/night themes. Axe color-contrast checks on `.sticker-stories` and `#community`: no violations in all 16 section/theme/width combinations. No document horizontal overflow. Mobile night screenshots visually reviewed. Screenshots also captured at desktop width.

Evidence: `/mnt/data/contrast-qa/results.json`, screenshots in that directory; repeatable test `/mnt/data/test-contrast-followup.cjs` (local server port 8934).

Scope: these two sections in their default states only, not a whole-site accessibility certification. Safari, Firefox, real devices and exhaustive interactive states not tested.
