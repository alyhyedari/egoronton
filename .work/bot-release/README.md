# EGOR companion website release

Date: 2026-11-24

Public bot: @egorverseai

The website and Python bot remain separate deployments. This release adds public navigation and a bot welcome route, not Telegram authentication, game-save synchronization or a public administrative API.

## Website files to publish

- index.html
- bot-section.css
- bot-links.mjs
- bot-config.json
- bot/index.html
- bot/bot.css
- assets/egor-community-host.jpg
- sitemap.xml

Keep the site's existing fonts, styles and assets in place. The PNG illustration is a retained source; the pages use the smaller JPEG. Do not upload `.work`, the Python bot, `.env`, databases or owner reports as website assets.

## Bot changes

In the separate D:\telegram project: bot.py, menus.py, website_bridge.py, env.example, test_website_bridge.py and SETUP-fa.md.

The new /website and /start website route passes existing identity, admission and private-access checks. Guests receive public website buttons. The configured owner also receives a management link; existing command authorization still controls access.

portalCode is intentionally empty until the owner creates a real portal. Until then community links retain the existing public channel destination. The website_bridge.py CLI can export the public portal configuration without reading the token or database. It writes only the requested bot-config.json file.

## Checks

- 187 bot offline tests passed, including guest/owner separation and blocked or restricted users
- 8 JavaScript assertions passed for default links, portal links and invalid configuration
- HTML IDs, local asset references and UTF-8 checks passed
- 7 local HTTP routes returned 200
- Browser navigation repeatedly timed out; visual desktop/mobile verification remains outstanding
- No live Telegram polling, messages, portal publication or deployment performed

## Owner handoff

Read D:\telegram\SETUP-fa.md for launch, permissions, model setup, portal publication, backups and manual live checks. Actual Telegram credentials, group ownership and channel permissions must be checked by the owner during activation. Generative chat requires a separately hosted model; group-management tools do not.

Image mode: built-in generation using an existing EGOR character reference. See image-prompt.md for the creative brief and asset paths.
