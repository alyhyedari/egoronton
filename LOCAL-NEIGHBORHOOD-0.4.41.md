# Local neighborhood prototype — 0.4.41

This is a separate local prototype, NOT a production release. Read `QA-0.4.41.md` for tested scope and limitations. Older README/release files describe the inherited site, not this prototype's QA status.

## Run
Extract the ZIP, open a terminal inside `egor-world-0.4.41`, and run:

```sh
python3 -m http.server 8845 --bind 127.0.0.1
```

Open http://127.0.0.1:8845/play/ (do not double-click the HTML file).

## Play
- WASD (physical keys work with Persian keyboard layout), arrows, Shift to run.
- Drag to look, E to interact, J for notebook, Escape to pause/close.
- Touch-first devices show a movement joystick and action controls.
- Follow the introductory lights, then explore five places, find nine discoveries and complete eight linked projects. The notebook shows prerequisites and directions; choose blue, sunset or sage.
- Progress saves only in this browser/origin. Clearing browser data or changing browser, device, hostname or port will remove or separate access to that save. Storage-blocked sessions cannot retain progress.

## Telegram — next phase, not implemented
Use a separate HTTPS staging deployment before touching production. Add Mini App viewport/safe-area, theme, lifecycle and Back Button handling; test in actual Android/iOS/Desktop Telegram clients. For identity and cloud saves, send Telegram initData to a backend and validate it server-side, including freshness, before issuing a session. Do not trust client-supplied user IDs. Keep the bot token only in server-side secret storage; never in frontend JavaScript or downloadable ZIPs.

Define authenticated save APIs, schema versioning, conflict handling, local-save import with consent, backups/deletion and rate limiting before enabling cloud progress. A local save is not trustworthy proof for valuable rewards. No payments or wallet connection are included in this prototype.

Before a live Telegram build, resolve artwork permissions and audit performance on real devices. This ZIP is a local development snapshot, not deployment instructions or a permissions grant.
