# Trade pagination follow-up (local only)

- Numbered pages, first/previous/next/last navigation, 10/25/50 rows per page, visible record range and page count.
- Filtering or changing page size returns to page 1. Boundary controls disabled; empty results have no active navigation.
- Automatic refresh does not replace the inspected sample while on pages 2+. Latest successful response is held pending; returning to page 1 or choosing the update button applies it. Pending data are not a historical archive.
- Paging is client-side over up to 100 validated provider records. No undocumented historical pagination or unlimited history implied. Navigating pages makes no API requests.
- Colored Buy/Sell text labels and actual TON amounts retained. No GRAM conversion.

## Verification
Node syntax passed. Headless Chromium at 320/375/1440: automatic load, page 2 range, final partial page, disabled final Next, 25-row selection, filter reset, no extra network calls on page navigation, no page-level horizontal overflow and no JS page errors. Paging tests used 56 generated test records derived from captured provider response structure; these are test-only and are not included in the website. Existing six-record fixture and HTTP 429 tests also passed. No live-browser provider connectivity verified. Pending-update timer lifecycle not exhaustively tested; Safari/Firefox/physical devices untested. Not accessibility certification.

Production and GitHub untouched.
