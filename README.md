# $EGOR — A little blue. A lot of character.

A static, English-language website. No build tools, dependencies, analytics, or wallet connection.

## Preview

From this directory:

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. Deploy the contents of this directory to any static host with HTTPS. Keep `assets/`, `fonts.css`, `motion.css`, `character.css`, `motion.js`, `character.js`, `token-dock.css`, and `token-dock.js` alongside `index.html`. All runtime files and fonts are included; no npm install is required.

## Design and motion

- Cyan paper, self-hosted type, original supplied character layers.
- Four custom character poses, an interactive mood board, a seated farewell, and a character-led purchase guide.
- Editorial headings without decorative terminal periods or long dashes; normal punctuation remains in explanatory prose.
- First-visit intro tracks three essential images and font readiness (not simulated percentages). Skip button, Escape, keyboard navigation, a 2.2-second asset timeout, and a 3.5-second fail-open safeguard. Repeat visits in the same tab skip it.
- The character's raised arm is its only moving part; face, body, neck, and hair stay fixed.
- Reveal-on-scroll, staggered steps, a seamless ticker, section navigation indicators, and scroll progress.
- Subtle art-card tilt only for fine pointers; no pointer effects on touch devices.
- Offscreen loops pause. Animations pause when the tab is hidden. No perpetual JavaScript animation loop.
- Device reduced-motion preferences respected; the manual motion setting persists locally.
- Native purchase-information dialog and FAQ, keyboard focus styles, skip navigation, no-JavaScript fallback.

To see the intro again, clear the `egor-visited` sessionStorage key or open a fresh tab/session. It intentionally does not appear with reduced motion enabled.

## Trading details

The project-supplied contract is displayed with a Copy CA button:

`EQAO_tYpLbPq-GOXegYTYtFaQ0tMkxLBxzYF8cUCGGWAj_aA`

Direct Swap on DeDust links open this TON → EGOR pair in a new tab:

https://dedust.io/swap/TON/EQAO_tYpLbPq-GOXegYTYtFaQ0tMkxLBxzYF8cUCGGWAj_aA

Get EGOR buttons open an information dialog containing the same link. Transactions are reviewed and signed on DeDust and in the user's wallet, never on this site. Clipboard access requires browser permission; if unavailable, the address is selected for manual copying.

Contract authenticity, liquidity, supply, and fee routing have not been independently verified. Before promoting trading:

1. Independently verify the TON contract, metadata, and supply.
2. Verify the claimed 3% fee, applicable transactions, and recipient. Fee routing does not establish artist endorsement.
3. Verify available liquidity, minimum received, price impact, and network fees on DeDust.
4. Confirm artwork rights and project claims.

The public `window.EGOR_CONFIG` in `index.html` contains the supplied values. When changing them, also update the static address and both direct swap links. The code checks address format and exact DeDust URL matching, not contract authenticity. Never include private keys, credentials, or recovery phrases.

The page presents the supplied 1 billion supply and project-stated 3% creator fee with verification caveats and risk disclosures. It does not claim an official artist partnership or guaranteed returns.

## Floating contract dock

The full address stays visible in a fixed bottom dock with exactly two actions: Copy and Swap. After scrolling past the hero, the same dock moves to the top; scrolling back restores its bottom position. A subtle periodic nudge draws attention at the top and pauses on hover/focus, with the site's motion toggle, or when the tab is hidden. Reduced-motion users get no animation. Mobile layouts wrap the complete address rather than truncating it. The Swap link is the exact project-supplied DeDust URL above. Copy uses Clipboard API with a local-preview fallback and accessible feedback. Without JavaScript the address remains selectable and Swap remains usable.

## QA

JavaScript syntax, CSS parsing, local asset references, unique IDs, and internal anchors were checked in the build environment. The floating dock was additionally tested in headless Chromium at 320, 375, 768, and 1440px: bottom/top/return positioning, exact address passed to the clipboard API (mocked), no horizontal page overflow, and reduced-motion behavior passed. A mobile screenshot was reviewed. Full-site interaction QA, native clipboard permissions, and actual trading remain outside these checks.

Check 320, 375, 390, 768, 1024, and 1440px viewports; keyboard navigation; dialog open/close and Escape; menu; fresh/repeat visits; offline asset failures; reduced motion; motion toggle persistence; no-JavaScript mode; and touch versus mouse interactions. Run Lighthouse on the deployed HTTPS site. No unmeasured performance score is claimed.
