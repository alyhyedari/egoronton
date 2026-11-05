# Additional local audit — 0.4.32

- Fixed homepage broken market fragment; it now targets the holder report within #reports.
- Updated homepage release metadata and market footer to 0.4.32.
- Fixed generated room image semantics and activity-label contrast without changing artwork.
- Chromium + axe-core WCAG 2 A/AA and WCAG 2.1 A/AA tagged rules: five pages at 375px and 1440px, reduced motion, 900px viewport height. No detected violations in these ten initial-page states. External requests blocked. See accessibility-audit.json; incomplete checks still require manual review.
- Static audit: five content pages have titles, descriptions and canonical URLs; no missing image alt attributes or broken local hyperlinks/fragments detected. This does not verify external URLs or guarantee meaningful alt text.
- Asset manifest verified: 182 unchanged assets, version 2159c45bb8c3c959.
- No Lighthouse scores available: tooling installation failed. No claim of 90+ scores, full WCAG conformance, or completed motion/interaction regression.
- Not deployed. Final packaging remains pending.
