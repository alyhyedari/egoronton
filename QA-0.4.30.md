# Local QA — 0.4.30

Not deployed.

## Changes
- Mobile welcome headline now includes the existing seated EGOR artwork, without modifying its source image or adding animation.
- Desktop composition and room interaction code are unchanged.
- Added llms.txt with existing page links and explicit tribute/token limitations. This is a navigation aid, not a ranking or AI-indexing guarantee.
- Updated welcome stylesheet URL and release metadata. Favicon changes from 0.4.29 retained.

## Verification
- Chromium homepage checks at 320, 375, 760, 768 and 1440px with reduced motion: no horizontal overflow, one H1, artwork loaded, mobile artwork above the fold (850px viewport).
- Visually inspected 320px and 375px screenshots.
- Existing room Chromium regression rerun: see qa-0.4.28/browser-results.json (directory name retained by the existing runner).
- 8 mocked finish/queue/costume checks and 10 mocked position checks passed separately.
- External browser requests blocked; live APIs and production behavior not verified. No physical-device or cross-browser certification, new Lighthouse score, or guarantee of improved SEO.

The inherited release.livingCorner notes refer to the earlier room release; this document covers the current changes. Original artwork files remain unchanged.
