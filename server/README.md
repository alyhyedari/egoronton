# EGORVERSE account service

Status: implemented and locally tested with synthetic signed fixtures. **Not connected to a live Telegram bot or public server.** The project owner has confirmed neither is ready. No bot token has been requested in chat, generated or embedded in frontend files.

## Local run

From the project root:

```powershell
python server/app.py
```

Open `http://localhost:18856/play/`. The server binds only to `127.0.0.1`. Without configuration, `/api/config` returns `configured: false`; the game says Telegram is not configured and device saving continues. Plain static hosting still runs the local game, but cannot provide account persistence.

## Configure a real deployment

1. Create/manage your bot in Telegram's official BotFather and configure its Main Mini App or menu button to open the game's HTTPS `/play/` URL. Use a Mini App launch that supplies authenticated `initData`.
2. Deploy this server behind an HTTPS reverse proxy on the same origin as the game. Keep the Python process bound to loopback. This standard-library service is a small deployment foundation, not a horizontally scaled MMO backend.
3. Set `TELEGRAM_BOT_TOKEN` in the server's secret/environment configuration, never in the browser, repository, logs or a public `.env` file. Set `EGOR_PUBLIC_ORIGIN` to the exact origin, such as `https://game.example.com`, without `/play/`. `PORT` is optional (default 18856).
4. Keep `.work/server/accounts.sqlite3` on persistent storage. Back up SQLite using its backup API or a consistent offline backup; do not copy only the main file while WAL writes are active. A disposable filesystem loses cloud saves.
5. Open the deployed Mini App in Telegram. Check signature authentication, account sync, reopening on the same and another device, offline recovery, revision conflict handling and logout with a real test account before inviting players.

Public deployment, DNS/TLS, bot registration and token configuration have not been performed. Configure traffic limits, request timeouts, database retention/backups and monitoring at the reverse proxy for a public release. Rate limits in this small server are process-local; proxy deployments need appropriate per-client controls. Do not expose the project through a generic static server that publishes private files.

## Data and identity

The frontend loads Telegram's official SDK when connecting (or when it detects a Telegram launch hint). Only signed `initData` is sent for login. The server derives the HMAC key using `WebAppData`, compares the hash in constant time, rejects duplicate fields, and checks the authentication timestamp (one-hour lifetime, 30-second clock tolerance). Account identity always comes from the verified payload, never a client-supplied save owner.

A random bearer session lasts 24 hours. Only its hash is stored in SQLite. The frontend keeps the session in same-tab `sessionStorage` for reload continuity, clears it on disconnect, and never writes the bot token. New Telegram visits authenticate again. The verified ID keys the account's save; a display name is returned to the browser but is not needed in the database. Guest saves remain local and account linking never silently overwrites a different existing account world.

New empty devices can restore the account world automatically. If device and account saves differ, the player chooses which world to keep. Connected devices upload every 15 seconds and when backgrounded, but browser termination/network loss can interrupt the last request. Local snapshots run every two seconds; manual **Save to account** confirms success in the menu. Cloud sync is not a guarantee that an offline or abruptly killed session has reached the server.

`PUT /api/save` uses a revision check inside a SQLite transaction. Stale writes return 409 rather than overwriting another device's progress. Reconnect to choose the correct world after a conflict. Saves are game state, not authoritative financial balances or proof of earned rewards. Never attach token payouts to this client-authoritative save format.

## API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/config` | GET | Public configured/unconfigured flag |
| `/api/auth` | POST | Validate Telegram initData and issue a session |
| `/api/save` | GET | Read only the authenticated account's save/revision |
| `/api/save` | PUT | Save with the expected revision |
| `/api/logout` | POST | Revoke this session |

Mutating requests require the exact configured Origin. Account requests use `Authorization: Bearer ...`. Bodies are limited to 128 KiB. Private directories, database files, source files and directory listings are not served. No CORS wildcard is enabled.

## Tests

```powershell
python -m unittest server.test_app -v
node --test play/tests/core.test.mjs play/tests/climate.test.mjs play/tests/routes.test.mjs
```

Six server tests cover authentic/tampered/expired/future payloads, duplicate fields, account isolation, durable saves, stale revision rejection, session revocation, HTTP authentication/origin checks and private-file protection. Fixtures use an explicitly fake token and temporary databases inside the project's `.work` directory.

Protocol reference: `https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app`
