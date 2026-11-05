# EGOR World 0.4.31 — local review

Not deployed. No external service changed.

## Changes
- Character-first centered mobile welcome using the existing, unmodified seated Egor artwork.
- Mobile image preload; no new animation or forced loading delay.
- Concise H1: “Meet Egor. Your little blue escape.”
- Direct portrait-studio link and clearer interactive-room accessible title.
- Existing llms.txt retained. Production availability was not checked in this release.

## Verification
- Chromium hero checks at 320, 375, 760, 768 and 1440px passed: no horizontal overflow, one H1, loaded artwork, mobile artwork above fold.
- 375×667 entry checks with normal and reduced motion passed after automatic greeting exit: image loaded and above fold; H1 spacing correct; 0 missing alt attributes; 39 same-origin links; 0 broken fragment targets; direct portrait link present.
- Visually reviewed the 375px mobile screenshot.
- Room regression suite run against local 0.4.31 at port 8766: 45 logged interaction checks passed; process exited successfully. External requests blocked.
- Asset manifest verified: 182 assets. Artwork unchanged.

These are automated Chromium tests, not physical-device/cross-browser certification, a new Lighthouse score, or proof of production behavior. Alt-attribute presence is not a complete accessibility audit.
