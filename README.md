# $EGOR — A little blue. A lot of character.

A static, English-language website. No build tools, dependencies, or wallet connection. Optional Vercel monitoring is included.

## Preview

From this directory:

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. Deploy the contents of this directory to any static host with HTTPS. Keep `assets/`, `fonts.css`, `motion.css`, `character.css`, `motion.js`, `character.js`, `token-dock.css`, `token-dock.js`, `idle.css`, `idle.js`, `water.css`, `water.js`, `wake.css`, `wake.js`, and `vercel-monitoring.js` alongside `index.html`. All runtime files and fonts are included; no npm install is required.

## Deploy to Vercel

Extract the ZIP and upload this folder to a Git repository, including `vercel.json` and all assets. Import the repository in Vercel; choose **Other** as the framework, leave the build command unset, and use this directory as the project root/output. No Node dependencies or build step are needed. The included `vercel.json` supplies static headers and caching rules. If this folder is nested in your repository, select it as the Root Directory.

Optional Analytics and Speed Insights require activation in your Vercel dashboard and may depend on your plan. Deployment and domain connection require your account; they are not performed by this ZIP. After attaching the final domain, complete the domain-dependent SEO steps below.

## Analytics setup and verification

This is a plain HTML/CSS/JavaScript site, **not Next.js**. Do not install React or add the Next.js `<Analytics />` component. `index.html` already loads `vercel-monitoring.js`, which loads the Vercel Web Analytics and Speed Insights endpoints asynchronously, once per page. No npm package or build step is needed.

1. In the Vercel project, enable **Web Analytics**. Enable **Speed Insights** separately if you want performance metrics; check your plan before enabling paid features.
2. Deploy this updated directory with framework preset **Other**. Ensure `index.html` and `vercel-monitoring.js` are in the deployed output.
3. Visit the deployed HTTPS site, then check the Analytics dashboard after about 30 seconds; reporting can take longer.
4. In browser DevTools → Network, check that `/_vercel/insights/script.js` loads successfully and that page-view requests to `/_vercel/insights/` succeed. The separate Speed Insights script is `/_vercel/speed-insights/script.js`.
5. If there is no data, check the correct project, domain, dashboard date filters, feature activation, and redeployment. A 404 on the script endpoint usually calls for checking Vercel feature activation and hosting configuration. Ad/content blockers can prevent collection.

Privacy and expected behavior:
- HTTPS only; localhost, Do Not Track (`1`), and Global Privacy Control are intentionally excluded. Use a separate testing profile without these settings to verify collection; do not override visitors' choices.
- Page URLs are stripped of query strings and fragments before sending. Monitoring script requests use an origin-only referrer policy.
- This is one HTML page: scrolling and `#section` navigation are not separate page views. No fake section views, click events, wallet identifiers, or trading events are added.
- Blocked or unavailable monitoring must not prevent site rendering or interactions. Other static hosts do not automatically serve Vercel's monitoring endpoints.
- Local tests verify integration logic, not live ingestion. Dashboard activation, billing, deployment, and production collection still require your Vercel account.

## Design and motion

- Cyan paper, self-hosted type, original supplied character layers.
- Four custom character poses, an interactive mood board, a seated farewell, and a character-led purchase guide.
- Editorial headings without decorative terminal periods or long dashes; normal punctuation remains in explanatory prose.
- First-visit intro tracks three essential images and font readiness (not simulated percentages). Skip button, Escape, keyboard navigation, a 2.2-second asset timeout, and a 3.5-second fail-open safeguard. Repeat visits in the same tab skip it.
- At the hero, only the raised arm waves; the original face and hair remain unchanged. Every character stays in its own section: no travel between sections, climbing, or jumping.
- `idle.js` layers the supplied artwork for subtle head tilts, nods, and guide-arm gestures with varied timing. Standing and seated characters wave continuously and gently while visible. The mood selector rebuilds the local layers without moving the illustration.
- Failed pose loading, disabled JavaScript, and reduced motion preserve static illustrations. Decorative layers are hidden from assistive technology and cannot intercept clicks.
- Reveal-on-scroll, staggered steps, a seamless ticker, section navigation indicators, and scroll progress.
- No pointer-driven art-card tilt.
- `water.js` / `water.css` add a mouse-only fluid-ink interaction: nearby text and independent decorations yield to pointer passes, exchange local collision impulses, and spring back. Buttons, links, character artwork, EGOR names, and contract surfaces stay fixed. The simulation sleeps after settling; touch/coarse pointers and reduced-motion settings use static content. Text selection and printing reveal the original text.
- `wake.js` / `wake.css` add soft, rounded, fading ripples only when a fine mouse pointer crosses empty space. Scroll-generated margin trails and touch trails are removed. Wheel input and scrolling immediately clear the effect; the outer 40px edges stay clear. Text, artwork and controls are masked out. No touch handlers, scroll interception, blur or WebGL. At most eight ripples, a 30fps drawing cap, a 1.2-million-pixel bitmap budget and cached geometry bound the work; rendering sleeps after 900ms without new ripples. Touch devices and reduced-motion users get a hidden 1px bitmap. Selection, dialogs, printing, hidden tabs and Pause motion suppress the effect.
- Offscreen loops pause. Animations pause when the tab is hidden. No perpetual JavaScript animation loop.
- Device reduced-motion preferences respected; the manual motion setting persists locally.
- Native purchase-information dialog and FAQ, keyboard focus styles, skip navigation, no-JavaScript fallback.

To see the intro again, clear the `egor-visited` sessionStorage key or open a fresh tab/session. It intentionally does not appear with reduced motion enabled.

## Trading details

The project-supplied contract is displayed with a Copy CA button:

`EQAO_tYpLbPq-GOXegYTYtFaQ0tMkxLBxzYF8cUCGGWAj_aA`

Direct Swap on DeDust links open this Gram → EGOR pair in a new tab. TON is the network; Gram (GRAM) is its native currency according to https://ton.org. The supplied URL keeps the technical `TON` asset identifier unchanged:

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

## Search visibility

The page includes an entity-specific title and description, Open Graph and Twitter text metadata, crawl directives, and WebSite JSON-LD. Visible FAQs distinguish Gram, TON, and EGOR without implying artist endorsement. No ranking or rich-result appearance is guaranteed, especially for the ambiguous query “egor”.

After choosing the final HTTPS domain:
1. Add its absolute homepage URL as `link rel="canonical"`, `og:url`, and the WebSite JSON-LD `url`.
2. Add absolute `og:image` and `twitter:image` URLs for an approved share image, with alt text.
3. Create `sitemap.xml` listing the canonical homepage (not section fragments); add its absolute URL to `robots.txt`.
4. Redirect alternate domains to the canonical host. Keep preview deployments out of search with deployment-specific noindex headers; do not noindex production.
5. Verify ownership in Google Search Console and Bing Webmaster Tools, submit the sitemap, and inspect the live URL. Measure real search queries and Core Web Vitals before making performance claims.
6. Earn relevant, legitimate community links and publish useful original material. Avoid keyword stuffing, purchased link schemes, or claims of official artist affiliation.

Canonical, sitemap, and social image URLs are intentionally not fabricated while the final domain is unknown.

## QA

The revised ripple effect passed headless Chromium checks for desktop mouse rendering, clean side margins, immediate scroll cancellation, sleep, motion toggle, reduced motion, selection, dialogs, printing and hidden-tab suppression. Emulated touch tests at 320/375/390/768/1024/1440px confirmed native scrolling without trails, a 1px inactive canvas and no horizontal overflow; a real dispatched touch tap opened the mobile menu. Idle-character and fluid-ink regression tests also passed. No physical-device performance benchmark is claimed.

JavaScript syntax, CSS parsing, local asset references, unique IDs, and internal anchors were checked in the build environment. The floating dock was additionally tested in headless Chromium at 320, 375, 768, and 1440px: bottom/top/return positioning, exact address passed to the clipboard API (mocked), no horizontal page overflow, and reduced-motion behavior passed. A mobile screenshot was reviewed. Broader Chromium QA also passed at six widths: dialogs/Escape, mobile menu, mood selection, privacy FAQ, motion persistence, intro/repeat/asset failure, clipboard fallback, reduced motion, and no-JavaScript rendering. The final idle animation passed checks at 320/375/390/768/1024/1440px: stationary character boxes, no horizontal overflow, local gestures, mood updates, motion pause/resume, offscreen pause, hidden-tab pause styling, and reduced-motion switching, with no runtime exceptions. The fluid-pointer update also passed headless Chromium checks with a fine mouse pointer: text displacement, EGOR and protected-surface exclusions, return to rest and animation sleep, manual motion toggling, reduced-motion switching, and overflow checks at six widths, without runtime exceptions. A desktop screenshot was reviewed. These are emulated browser tests, not physical iPhone/Android/Safari certification; native clipboard permissions and actual trading remain outside these checks.

Check 320, 375, 390, 768, 1024, and 1440px viewports; keyboard navigation; dialog open/close and Escape; menu; fresh/repeat visits; offline asset failures; reduced motion; motion toggle persistence; no-JavaScript mode; and touch versus mouse interactions. Run Lighthouse on the deployed HTTPS site. No unmeasured performance score is claimed.
