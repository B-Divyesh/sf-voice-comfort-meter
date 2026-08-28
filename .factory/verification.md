# Independent verification — FAIL

**Candidate:** `1ecfe0092be235667733013eba4a6ce569b7b025`  
**Live URL:** https://voice-comfort-meter.sociobot.in  
**Verified:** 2026-08-28 (fresh `npm ci` checkout)

## Release decision

**FAIL.** The functional product is largely sound, but required claims are missing
from `.factory/claims.json` and the deployed site is missing its required CSP and
real HTTP 404 response. These are release-blocking acceptance-contract failures.

## Mandatory first checks

### Claims, run first from the demo entry point

`npm ci` succeeded (0 vulnerabilities). Every declared command in
`.factory/claims.json` was run before other QA and passed:

| Claim | Command | Result |
| --- | --- | --- |
| `demo-comparison` | `npm test -- --grep @claim:demo-comparison` | PASS — 1 Playwright test, 7.0s |
| `privacy-local` | `npm test -- --grep @claim:privacy-local` | PASS — 1 Playwright test, 6.0s |
| `wav-export` | `npm test -- --grep @claim:wav-export` | PASS — 1 Playwright test, 6.0s |
| `offline-reload` | `npm test -- --grep @claim:offline-reload` | PASS — 1 Playwright test, 6.5s |

The file exists and parses as a non-empty array. Note that the supplied
`offline-reload` test checks cache entries after going offline, but does **not**
reload while offline. I independently performed that stronger reload check below.

### Cold first-read of the deployed landing page

On a clean desktop browser context the first screen says: “Compare two voice takes
privately,” “For speakers and singers who want calmer, clearer recording choices,”
and offers **Try it with sample data** with “See two example takes right away.”

It clearly explains what it does, who it is for, and what to click first in plain
words. The one-click action opens `/demo`, immediately shows two sample takes and
the comparison guidance, and includes the persistent “Demo — sample data, nothing
is saved” banner with Reset demo and Start for real. **PASS.**

## Build and automated checks

| Check | Result |
| --- | --- |
| `npm test` | PASS — 5/5 Playwright tests, 8.4s |
| `npm run build` | PASS — `tsc -b && vite build`; generated `dist/` |
| Production bundle | PASS — `app.js` 13,987 B / 5,662 B gzip; `app.css` 8,679 B / 2,812 B gzip (within static-PWA JS/CSS budgets) |
| Axe in Playwright | PASS — 0 serious/critical (indeed 0) WCAG 2/2.1/2.2 A/AA violations on `/`, `/demo`, `/privacy` |
| Console/page errors | PASS — none on desktop, 390px demo, local production offline reload, or fake-mic flow |

`npx @axe-core/cli@4.11.0` was also attempted as required by the accessibility
skill, but its bundled Selenium ChromeDriver exited before a session could start in
this container. The same axe-core 4.11.4 engine was injected into the preinstalled
Playwright Chromium instead; its results are the axe result above.

## Functional and runtime evidence

- **Recorder E2E:** with Chromium’s fake microphone and granted permission, two
  takes recorded, the comparison appeared, first take exported as `take-1.wav`,
  and Delete all takes returned the UI to zero cards. No errors.
- **15-second boundary:** a fake-mic recording left to stop automatically produced
  one card with `15.0s`; no Stop recording button remained.
- **Unavailable microphone:** Record produced the recovery message “The microphone
  could not start. Check that another app is not using it, then try again.” and no
  take was created.
- **Demo boundary/isolation:** Reset demo retained two sample cards; Start for real
  navigated to `/`, removed the demo banner, and showed zero real cards.
- **Offline/PWA:** after the worker controlled the page, an offline reload of
  `/demo` succeeded locally and on the live URL with two cards visible. The live
  worker was active at `/sw.js`, controlled the client, and used cache `v1`.
- **Privacy:** request logging through the complete live demo flow observed only
  `https://voice-comfort-meter.sociobot.in`; no third-party request, analytics, or
  audio upload was observed. The product has no server-side/API endpoint or sign-in,
  so rate-limit and Entra checks are not applicable.
- **Accessibility/mobile:** at 390px there was no horizontal overflow (390px
  scroll width); every checked keyboard target had the designed 3px cyan
  `:focus-visible` ring; `<html lang="en">`, title, one h1 and main landmark are
  present; reduced motion changed the record-dot animation to `none`. Desktop and
  mobile screenshots were visually reviewed.
- **Routes:** `/`, `/demo`, `/privacy`, and `/terms` each load with their expected
  title and one h1; an unknown SPA route visually renders the designed not-found
  page (but see the HTTP-status defect below).

## Candidate/live identity

The deployed assets are byte-for-byte the fresh candidate build, so this is not a
stale-deployment finding:

| Asset | SHA-256 |
| --- | --- |
| `assets/app.js` | `378b2329cc1edd863c64fc236e9c52d1896f2a049611cf24d5a04664bce93fe8` |
| `assets/app.css` | `ebb2db0abc6a8be792a254695f0889636ea7bd82d5a6ecd9a30fd5e8c02c6a84` |
| `sw.js` | `06ff16c453f3941d0be181c668110e6cb8d25aad988707297ca4adc63b8c6ae3` |

## Defects

### P1 — deployed security/HTTP configuration does not meet the contract

Fresh live response headers for `/`, `/demo`, `/privacy`, `/terms`, assets and the
service worker contain HSTS, `Referrer-Policy` and `X-Content-Type-Options`, but
**no `Content-Security-Policy` at all**. `staticwebapp.config.json` declares a CSP,
so the deployment is not applying that required configuration. In addition,
`/does-not-exist` returns **HTTP 200**, not a real HTTP 404 (although the SPA draws
the not-found screen). The manifest is served as `application/octet-stream` rather
than a manifest JSON MIME type.

This fails the required CSP/security-header and real-404 requirements. Fix the
deployment configuration/host integration, then verify the actual live headers and
unknown-route status, rather than relying only on the checked-in config.

### P1 — claim inventory is incomplete (explicit release-blocker rule)

The claims file contains only demo comparison, local audio, WAV export and offline.
The live landing page/README make additional visitor-reliant claims with no
corresponding `@claim:` entry and sandbox test, including:

- “Free — No account or payment.”
- “Your microphone is only requested when you record.”
- the numerical “up to 15 seconds” take limit.
- README: recordings remain until export or deletion, and demo/real data use
  separate storage namespaces.

The claims contract says an unlisted claim fails review until removed or tested.
Add one observable demo-entry-point test per retained claim (including an actual
offline reload in the offline claim) or remove/reword the claims, then rerun every
entry from a clean checkout.

### P2 — mobile touch targets are below the required 44px

At 390px, Reset demo and Start for real measure about 36px tall, the delete icons
36px square, and Play/Export buttons 40px tall. The contract requires 44×44 CSS px
touch targets. Increase hit areas while preserving the current visual spacing.

### P2 — PWA update/caching policy is incomplete

`sw.js` has a fixed cache version `v1`, unhashed `app.js`/`app.css`, and no visible
in-app “update available” notification. Live responses for HTML, JS, CSS and the
service worker all use only `Cache-Control: public, must-revalidate, max-age=30`;
there is no long-lived immutable cache policy for versioned assets. Version cache
names/assets, provide the update toast, and deploy correct immutable caching for
hashed static assets.

## Retest required

After fixes: run each command in `.factory/claims.json` from a clean install;
`npm test`; `npm run build`; repeat live byte identity, CSP/404/MIME/cache-header
checks, full demo request logging, actual offline reload, and 390px target
measurements.
