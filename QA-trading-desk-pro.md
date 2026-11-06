# Trading Desk Pro — local review QA

Scope: local EGOR World 0.4.34 only; no deployment or external changes.

## Passed
- Headless Chromium, viewport widths 320, 375, 760, 1440 px.
- Paper and night themes: no document horizontal overflow; no uncaught JavaScript errors.
- axe WCAG 2 A/AA and 2.1 AA automated checks: zero reported violations in eight width/theme combinations. Canvas drawing accessibility is not proven by axe.
- Base EGOR remains fixed across GRAM/USD/TON; deterministic GRAM summary restored after switching.
- Candles/line, intervals, EMA/volume controls, zoom, keyboard navigation, trend draw, undo/redo, reload persistence, PNG download.
- EMA/SMA period and enabled state persistence; RSI/MACD pane switching; Fibonacci drawing and persistence; drawings isolated by quote and interval.
- CSV downloads: synthetic disclaimer, pair information, header and 720 hourly records.
- Known-value unit checks: EMA, SMA, constant/rising/falling RSI and constant-series MACD.
- Original 182 asset hashes verified: 2159c45bb8c3c959.

## Evidence
- `desk-tests.json`: basic regression results.
- `pro-results.json`: feature/a11y results.
- Desktop and mobile screenshots for both themes and RSI/MACD.
- Scripts: `test-desk-pro.cjs`, `test-desk-pro-features.cjs`.

## Limits
Not a certification, production release or exhaustive test. Physical touch devices, Safari, Firefox, fullscreen behavior, every drawing tool, all custom color combinations, blocked/full storage and full six-page site regression were not tested in this pass. Screenshot review sampled mobile night/MACD and desktop paper/RSI. Data remains synthetic; no live market connection.
