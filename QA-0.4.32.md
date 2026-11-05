# EGOR World 0.4.32 — local review build

## Changes
- Clear independent-community wording, direct room/sticker/drawing links, explicit portrait-studio entry and PNG-saving reminder.
- Focusable main skip target, 44px navigation targets, bounded mobile menu; outside-click, focus-leave and breakpoint closing.
- Fixed broken market report fragment and homepage release metadata; aligned release.json and market footer.
- Corrected room image roles and activity-label contrast. Original artwork unchanged.

## Recorded validation
- Navigation: local headless Chromium, reduced motion, widths 320/375/760/1440. No horizontal overflow, missing image alt attributes, broken same-page anchors or uncaught JS errors. Menu opening, Escape/focus return and outside click passed. See navigation-audit.json.
- Room regression: 48/48 checks across mobile 320, mobile 375 reduced motion and desktop 1440, including uncaught-error checks. TV, radio, mirror, cup drag/keyboard controls, pause/time preview, reset, replacement scenes and keyboard focus passed. Sleep behavior uses an explicit fixture, not natural overnight observation. See qa-0.4.32/browser-results.json.
- Accessibility: axe-core WCAG 2/2.1 A/AA tagged checks on five initial page states at widths 375/1440: no detected violations. Incomplete checks require manual review. See accessibility-audit.json.
- Static metadata/link audit: five content pages have titles, descriptions and canonicals; no missing alt attributes or broken local links/fragments detected. See static-audit.json.
- Asset manifest verified: 182 assets, version 2159c45bb8c3c959.

## Limits
All browser checks were local with external requests blocked. No live market service or external URL validation. No real-device, cross-browser or full manual accessibility certification. Portrait export and every scene/state are not covered by this run. Lighthouse tooling installation failed: no Performance/Accessibility/Best Practices/SEO scores are claimed. 90+ remains a target, not a verified result.

No deployment or external submission performed. The project ZIP is for local review, not proof of production readiness. Historical QA files describe earlier versions only.
