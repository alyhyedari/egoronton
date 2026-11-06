# 0.4.33 local QA — fixed authored theme

- All six content pages load fonts.css, whose root now declares `color-scheme: only light !important`, opting out of browser auto-darkening where supported. Intentionally dark artwork/sections retain their authored styles.
- Removed Trading Desk theme toggle, handler and dark palette.
- Playwright Chromium: light/dark emulation produced identical computed foreground/background/color-scheme values on sampled html/body/main/header/section/button/input/select nodes across six pages at 375 and 1440 px (12 cases). See theme-tests.json and ../test-theme-0433.cjs.
- Desk regression rerun at 320/375/760/1440: drawing, undo/redo, reload persistence, intervals, indicators, zoom, keyboard and PNG export passed; no page errors, failed HTTP responses or horizontal overflow detected. See desk-tests.json.
- JavaScript syntax check passed.
- Not tested on the reported physical phone; third-party forced-dark extensions and OS color inversion can override author intent. Accessibility forced-colors settings are intentionally not disabled.
- No deployment. Accessibility audit, release metadata/manifest refresh and final packaging remain pending.
