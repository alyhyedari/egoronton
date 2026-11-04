# EGOR World 0.4.18 — local prototype

- Added staged pretend repairs, drawing-to-object restoration and fictional parcel delivery.
- Stop scene and Escape cancel choreography. Reduced motion finishes without travel animation.
- Leaving the viewport cancels the scene; no purchasing, browser lock or store request is performed by restoration.js.
- Delivery parcel is layered in front of the courier and interpolated during handover.

## Executed QA
- 33 headless Chromium checks passed: overflow at 320/375/1440px; start, restore and cleanup for each of three scenes at each width; Escape; reduced-motion completion; JavaScript errors.
- Three additional real-time desktop scene completions passed, with no JavaScript errors. Initial fixed 20-second repair check timed out; polling up to 40 seconds completed successfully. Animation time depends on rendered frames.
- Desktop screenshots inspected for repair and delivery.
- JavaScript syntax and assets-only SHA-256 manifest verified before packaging.

## Limits
No physical-device, cross-browser or live market verification. External HTTPS blocked during browser QA. Scene-state checks use the exposed local test API and are not comprehensive end-to-end gesture tests. Artwork and interaction remain prototype quality. No online deployment performed.

Run locally from this directory with `python3 -m http.server 8000`, then open http://localhost:8000/market.html.
