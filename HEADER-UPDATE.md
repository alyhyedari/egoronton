# Header navigation update — 0.4.35

This package supersedes the original 0.4.35 ZIP for header navigation only. No deployment or GitHub push was performed.

- Shared English directory with 19 destinations on all six main pages.
- Three groups: Play & create, Explore the world, Project & community.
- Native disclosure, visible keyboard focus, Escape/outside-click dismissal, responsive scrollable panel and night palette.
- Directory is progressively added with JavaScript; existing page navigation remains when JavaScript is disabled.
- Trading Desk remains explicitly a synthetic demo. Artwork is unchanged.

QA: Chromium at 320, 375 and 1440px on six pages: directory opens, contains 19 links, closes on Escape and causes no document horizontal overflow. All directory file/fragment targets were checked locally. This focused check does not rerun or extend the full historical QA report and is not accessibility certification. Firefox, Safari and physical devices were not tested.

GitHub update: extract ZIP and copy its contents into the existing site's root, retaining your repository configuration. Review the diff before committing. If the repository auto-deploys, committing may publish the changes.
