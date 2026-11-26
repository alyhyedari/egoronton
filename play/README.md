# Expedition update / November 18, 2026

Driving is retained following the user's final clarification. The cockpit now uses the explicit terrain pitch rather than extracting Euler angles from the yawed car, preventing the heading-dependent camera inversion. Pedestrian collision includes the parked vehicle footprint and a body-radius margin around existing scenery colliders. Wetness, snow and hail affect acceleration, steering and braking; changing grip no longer instantly clamps vehicle speed. Collision is conservative arcade geometry, not a guarantee against every scenery edge case.

The finite world now spans 880 x 924 metres (about 0.81 km?), with two new northern destinations and an expedition supply stop. Added 24 roaming animals (fox, deer, rabbit), 24 original adult residents including women, and 12 hostile shadow sentries. These are stylized procedural models with simple local steering and distance culling, not photorealistic AI citizens. Damage applies in Survival; Story and Free roam allow exploration without combat health loss. Defeated sentries persist and do not currently respawn.

New controls: hold Space for BHop, release and press again for one double jump, E in the air toggles parachute, R reloads, F cycles torch modes, 1/2 selects equipment. Mouse firing requires captured mouse; the Fire button also works with drag-look and touch. Touch buttons provide all expedition actions. Two fictional weapons use cooldowns, magazines, reserves, reload animations, recoil and synthesized effects. The scattergun currently uses one central hit ray with higher damage and shorter range, not a multi-pellet simulation. Surface impacts use scene bounding boxes plus terrain sampling; the latest 64 impact marks persist across saves, with approximation on curved geometry.

Read resident stories for one-time expedition credits, separate from INK and with no monetary value. Visit Expedition supplies on the map to replenish reserves and buy the UV torch for 40 credits. UV unlocks the final memory north of Shadow vault. Seven bilingual panels include fictional crypto lessons and a short factual exhibit about the Durov brothers, with Telegram FAQ named as the reference. The official FAQ was read in Chrome on November 18, 2026; it confirms the 2013 launch and the distinct Pavel/Nikolai roles. Reference: https://telegram.org/faq#q-who-are-the-people-behind-telegram

The original synthesized score now has eight-bar harmonic variation, bass pulses, arpeggios, atmospheric reverb and gradual tempo/energy changes for exploration, driving, BHop, parachute flight, rain, snow, horror and danger. It contains no commercial soundtrack. Listening quality across speakers/headphones still needs human review.

New systems save through the existing local/account save model. Telegram remains unconfigured until a bot and HTTPS deployment exist. No multiplayer or live blockchain transactions have been added. Browser reload/navigation automation can still time out; fresh preview navigation worked during this update. This is a playable prototype, not an AAA-scale finished world.

Validation: `node --test play/tests/*.test.mjs` includes the new double-jump, parachute, ammo conservation, surface intersection, save, grip and score tests. The route suite constructs actual scene colliders and checks every road centerline.

---

# EGORVERSE playable foundation

Canonical route: `/play/`. Both former survival doorways redirect here with Survival selected. This is a single-player build with device saves and an optional Telegram account backend. Multiplayer and TON wallet transactions are not implemented. Telegram is NOT activated in this workspace: the owner has no bot or public server yet.

## Play

Run `python server/app.py` from the project root, then open `http://localhost:18856/play/`. This serves the game and account API together, keeps private server/save files inaccessible, and requires no third-party Python packages. See `server/README.md` for Telegram deployment configuration.

- English is the default. EN/FA switches the main interface and two story chapters. Some older optional notebook/tutorial text and scenery signs still use English.
- Story and Free roam prevent crash injuries. Survival applies vehicle damage, ejection and recovery. Free roam hides story prompts.
- WASD moves, dragging or captured mouse looks, Shift runs, E interacts, J opens the notebook, Escape pauses. Hold Space while moving to chain BHops; on touch screens hold Jump. Space brakes while driving.
- Touch controls can be forced in Settings for hybrid devices. Left-handed placement, sensitivity and reduced motion are configurable.
- The map connects eleven stops. Travel on foot is blocked while driving, incapacitated or carrying an active delivery.
- Garage opens paint, suspension appearance and cockpit FOV settings. Stop before leaving the car. Roads now connect the garage, town, forest, rounded highlands and eastern countryside.
- Two narrative chapters have eight memories and two receiver puzzles. The northern chapter connects Cloudrest, the weather station, the listening observatory and the lakeside shelter. The pre-existing neighborhood activities, discoveries, commissions and delivery remain playable.
- Original synthesized music changes tempo and instrumentation for exploration, driving, BHop and danger. Music volume and mute are in Settings.

## Persistence

`session.mjs` owns schema version 1, IndexedDB storage and a localStorage fallback. The old `egor-neighborhood-0441`, `egor-survival-neighborhood-v1` and garage keys migrate on the same origin. Browser saves are specific to hostname and port: `localhost` and `127.0.0.1` have separate saves.

Menu offers JSON download/restore. Malformed imports are rejected before replacement. Autosave runs every two active seconds and on pause/background/exit. Restoration retains X/Y/Z, heading and pitch, the car position/orientation, cabin occupancy and look direction, health/damage, route and story state. It deliberately stops velocity; an airborne pedestrian resumes falling from the saved height rather than preserving exact jump momentum. Geometry changes can move an obstructed pedestrian to the safe home position. Route, car appearance, damage and story progress persist. No wallet or token balance is implied by INK. Weather type, clock, transition, random seed and ground wetness/snow persist too. A sudden process/device failure can lose the last two seconds locally; account sync runs every 15 seconds while connected, so cloud progress can lag or remain pending while offline.

## Living sky and expanded roads

The shared world bounds are now 530 by 554 world meters, about 3.7 times the former rectangular area. The world is finite, not infinitely streamed. The same bounds and height field govern walking, cars, save validation and the map.

Settings > Living sky offers Dynamic weather or a specific weather front. The 20-minute day cycle advances only during active play. Clear/cloudy fronts lead into rain, thunder, snow, hail, a distant visual tornado and clearing rainbows. Lighting and fog blend over 12 seconds. Local precipitation uses one mesh; reduced-motion/low settings lower particle counts and disable lightning flashes. Snow accumulation is a ground tint, not deep snow physics. Wet/snow-covered roads reduce maximum driving speed. Clouds cast soft projected terrain shadows, an economical approximation rather than volumetric atmospheric rendering. Precipitation stays outside a four-meter cabin exclusion radius. Thunder is locally synthesized.

The north garage exit is open directly into the countryside. Garage sides/back use corner posts instead of enclosing walls. The city connector now goes around houses and the eastern exit lamp was moved off the driving line. Route tests instantiate actual scenery builders and check every road centerline for collision; they also drive out of the garage.

## Modules

| Module | Responsibility |
| --- | --- |
| `weather-state.mjs`, `weather.mjs`, `cloud-shadows.mjs` | Deterministic fronts, day/night, precipitation and projected cloud shadows |
| `account.mjs`, `server/app.py` | Verified Telegram identity, account saves and revision conflicts |
| `northern-story.mjs` | Bilingual second chapter |
| `world.mjs` | Scene and input orchestration |
| `movement.mjs` | Renderer-independent walking, jumping and bounded BHop chains |
| `terrain.mjs` | Shared height field, roads and rounded landscape geometry |
| `vehicle-physics.mjs` | Swept vehicle collision, steering, road/off-road speed and grades |
| `drive-session.mjs`, `crash-state.mjs` | Damage, parked snapshots, checkpoints and recovery |
| `garage.mjs`, `cockpit.mjs` | Physical first-person cabin, instruments and garage |
| `session.mjs` | Validation, migration, persistence and import/export |
| `journey.mjs`, `atlas.mjs` | Story progression, puzzle and travel map |
| `language.mjs` | Reversible EN/FA interface dictionary and RTL text layout |
| `soundtrack.mjs` | Locally synthesized adaptive score with user volume control |
| `performance.mjs` | Conservative adaptive render resolution with hysteresis |
| `verse.css` | Responsive menu, walking HUD, cockpit and dialogs |

World movement and vehicle placement use the same height function. Extend `WORLD_BOUNDS`, terrain, save clamps and travel stops together when adding regions. Keep new progression logic renderer-independent and validate saved values.

Balanced graphics can lower render resolution under sustained load; explicit High/Performance settings remain under player control. Resize redraws immediately. Graphics context loss pauses gameplay and exposes recovery/reload controls. Settings includes a real WebGL recovery check. This cannot guarantee recovery from every driver/browser failure.

## Validation

Run `node --test play/tests/core.test.mjs play/tests/climate.test.mjs play/tests/routes.test.mjs` from the project root. Twenty-three tests cover save migration/import, ordered rewards, collision/frame-rate consistency, damage modes, BHop acceleration/caps/reset, terrain slopes, open driving bounds, music states, language defaults, adaptive resolution and delivery/recovery preservation.

Browser checks exercised startup, save reload, EN/FA switching, story progression through the receiver, travel to highlands, vehicle entry, touch layout and a real context-loss/restore cycle. Phone-size testing uses desktop Chrome viewport overrides, not physical iOS/Android certification. Audio scheduling/state changes were checked; the soundtrack still needs human listening and balancing across actual speakers/headphones.

Living-sky browser checks verified rain rendering, settings, cabin entry and touch driving to 273 m from the garage. A fresh navigation restored Rain and the saved occupied car/checkpoint. Repeated browser-controlled reloads still intermittently timed out; cache headers and a detached server did not conclusively resolve this. Do not claim all-device/reload stability. All eight weather visuals and the newest polish still need a complete visual pass. Six Python tests pass (`python -m unittest server.test_app -v`), covering signatures/expiry, account isolation, persistence, revision conflicts, logout, HTTP authorization and private-file protection. No real Telegram account was connected.

## Still to build

Multiplayer and authoritative server simulation; live Telegram deployment and a real-account end-to-end test; TON Connect and any actual on-chain actions; economy and shops; character wardrobes and additional playable characters; full localization of legacy optional content; weapons/enemies/combat; bicycles/motorcycles; accurate licensed/reference-derived lowrider vehicles; deeper quests and larger streamed regions.

Azure 01 is original procedural prototype geometry, not a faithful reconstruction of the linked sticker collection. The cabin uses physical geometry with a separate instrument overlay. INK currently records story memories, not a spendable or redeemable currency. Do not advertise these pending systems as live.

Original top-level game files are retained in `.work/baseline-play/`. Terminal heading-punctuation backups are in `.work/heading-backups/`. No deployment, Git commit or remote changes were made.
