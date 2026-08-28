# Independent verification 2 — FAIL

**Candidate:** `2bd6bb115e6b51f0007d785e2416ae4240d05070`
**Live URL:** https://voice-comfort-meter.sociobot.in
**Verified:** 2026-08-28 UTC from the supplied clean clone

## Release decision

**FAIL.** An exact declared claim test fails in a clean detached checkout. The
candidate is deployed, but its live Content Security Policy also blocks the core
waveform visualization and emits console errors. The preferred-take action does
not retain or show a preference, and the demo saves user changes despite saying
that nothing is saved. These are shipped product defects, not a deployment-only
mismatch.

## Mandatory first gates

### Declared claims

`.factory/claims.json` exists, parses, and contains nine claims. A literal first
attempt before dependency installation could not start Playwright because the
checkout had no `node_modules`. I then created a detached, clean worktree at the
exact candidate, ran `npm ci`, and ran every exact command independently from a
fresh Playwright context. Eight passed; `take-limit` failed:

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-comparison` | `npm test -- --grep @claim:demo-comparison` | PASS — 1 test, 7.9s |
| `privacy-local` | `npm test -- --grep @claim:privacy-local` | PASS — 1 test, 7.5s |
| `wav-export` | `npm test -- --grep @claim:wav-export` | PASS — 1 test, 7.5s |
| `offline-reload` | `npm test -- --grep @claim:offline-reload` | PASS — 1 test, 8.1s |
| `no-account-payment` | `npm test -- --grep @claim:no-account-payment` | PASS — 1 test, 7.6s |
| `microphone-on-record` | `npm test -- --grep @claim:microphone-on-record` | PASS — 1 test, 7.5s |
| `take-limit` | `npm test -- --grep @claim:take-limit` | **FAIL** — expected `15.0s`, received `14.9s` |
| `recordings-until-delete` | `npm test -- --grep @claim:recordings-until-delete` | PASS — 1 test, 8.1s |
| `separate-storage` | `npm test -- --grep @claim:separate-storage` | PASS — 1 test, 7.9s |

Raw clean-worktree output:
[clean-claim-results.txt](qa-artifacts/clean-claim-results.txt). An earlier run in
the supplied worktree happened to pass the same timing assertion, confirming that
the claim is nondeterministic rather than consistently implemented.

The live banner “Demo — sample data, nothing is saved” is an additional,
visitor-reliant claim. It has no claim entry proving that demo changes are
discarded, and it is false in the live behavior described under P1 below.

### Cold first-read

**PASS.** At 1365×768, a cold live visit says:

- what it does: “Compare two voice takes privately”;
- for whom: “For speakers and singers who want calmer, clearer recording choices”;
- what to click: **Try it with sample data**, beside “See two example takes right away.”

The action is on the first screen and opens the two-take demo in one click. See
[live-cold-desktop.png](qa-artifacts/live-cold-desktop.png).

## Clean install, test, and build

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 23 packages; 0 vulnerabilities |
| `npm test` | **FAIL — 12/13**; `take-limit` expected `15.0s`, received `14.8s` |
| Type check | PASS — `tsc -b` runs in the production build |
| Lint | Not available — no lint script is present |
| `npm run build` | PASS — exact `tsc -b && vite build`; `dist/` produced |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |

Clean-worktree outputs: [clean-npm-test.txt](qa-artifacts/clean-npm-test.txt) and
[clean-npm-build.txt](qa-artifacts/clean-npm-build.txt).

The production artifact is small: JS is 14,870 B / 5,960 B gzip, CSS is
9,005 B / 2,880 B gzip, and the hero WebP is 71,590 B. A cold live landing load
transferred 81,375 B across JS, CSS, and the hero image. This is within the
200 KB JS, 50 KB CSS, 120 KB font, and 300 KB hero budgets.

## End-to-end product evidence

- A fake-microphone live flow recorded two takes, displayed the comparison,
  disabled further recording at two takes, and exported a non-empty `take-1.wav`
  file with valid `RIFF` and `WAVE` signatures.
- The live 15-second boundary stopped automatically after about 15.8 seconds and
  displayed `15.0s`, but the clean local claim runs displayed `14.9s` and `14.8s`.
- A denied microphone produced: “Microphone access was blocked. Allow it in
  your browser, then press Record again.”
- Canceling **Delete all takes** retained both cards; confirming removed both.
- A live offline reload of `/demo/` returned 200 from the service worker and
  restored two cards from cache/IndexedDB.
- A local two-release service-worker exercise installed a changed cache version,
  exposed the update toast while the new worker waited, and **Reload update**
  activated it, removed the old cache, reloaded, and retained both demo cards.
- Reduced-motion emulation changed the recording dot animation to `none`.

The reproducible browser probe and its retained output are
[live-qa.mjs](qa-artifacts/live-qa.mjs) and
[live-qa.json](qa-artifacts/live-qa.json).

## Privacy, network, and deployment

During the complete live recording/export/delete flow, every outgoing request
was a same-origin `GET` or `HEAD`; there were no third-party requests, analytics,
or audio uploads. Static inspection found no runtime API, analytics, Azure/OpenAI
key, or external script/font. This is a static PWA with no server-side product or
unlock endpoints, so a 429 allowance test is not applicable. It has no sign-in,
so the Entra tenant check is also not applicable.

Live HTTP checks pass for CSP delivery, HSTS, `Referrer-Policy`,
`X-Content-Type-Options`, manifest MIME type, immutable one-year caching for
hashed assets, `no-store` for the service worker, and a real 404 response. Raw
headers are in [live-http.txt](qa-artifacts/live-http.txt).

The deployment matches the candidate build byte for byte:

| Artifact | SHA-256 (local and live) |
| --- | --- |
| `index.html` | `49016de7d7c8ffe115d766850a2f21cf3a75fe24771c189659ff9fa654a91026` |
| `assets/app-BaPZcWr1.js` | `f85908b8eec73deb6a5c91899735384fd5e2d45e1ef83cb62f6022b1e3a9888a` |
| `assets/app-C0OZSqwG.css` | `72088db8edc35539c85022af85e5f3c517ae7c3ecb893d4b352f25a75af51814` |
| `sw.js` | `30c9d1752a4fc19563443bf00d3c0aa6a18423651679fd8de79512fcb39656c5` |
| `manifest.webmanifest` | `7b810772686cdd367e225f710ae35cfc34174d6b128b8b9b3efcf91b76e4d086` |

## Accessibility, mobile, and performance

- `verify-url.sh` passed: title, `lang=en`, one h1, main landmark, alt text,
  button names, and no errors on the empty landing state.
- Playwright axe-core 4.11.4 found zero violations on `/`, `/demo/`, `/privacy`,
  and `/terms` at desktop size and zero at 390×844. The requested axe CLI was
  also attempted, but its Selenium launcher could not find a Chrome binary;
  the same axe engine ran successfully through the pinned Playwright browser.
- Keyboard order reaches the skip link, header links, sample action, checkbox,
  recorder, and footer links. Every tested focus state had a visible 3px cyan
  outline. The skip link moves focus to `main`.
- At 390px, document width equals viewport width and the recorder stacks cleanly.
  The repaired demo/action buttons are at least 44px, but several other targets
  remain too short as listed below.
- Lighthouse 12.8.2 mobile on `/`: performance 91, accessibility 100, best
  practices 100, SEO 100; LCP 1.4s, TBT 370ms, CLS 0.
- Lighthouse mobile on `/demo/`: performance 86, accessibility 100, best
  practices 93, SEO 92; LCP 1.2s, TBT 550ms, CLS 0. The console/CSP and invalid
  canonical audits failed.

Raw Lighthouse reports:
[landing](qa-artifacts/lighthouse-home-mobile.json) and
[demo](qa-artifacts/lighthouse-mobile.json).

## Defects

### P1 — required `take-limit` claim and full test suite fail

The exact clean-worktree claim command failed: expected `15.0s`, received
`14.9s`. A following full `npm test` run failed the same assertion at `14.8s`
(12 passed, 1 failed). Duration is calculated from the number of
`requestAnimationFrame` samples divided by 60, not from elapsed time, so the
result changes with scheduling. This directly triggers the acceptance rule that
any failing claim test blocks release.

### P1 — CSP suppresses every waveform and floods the console

The response correctly sends `style-src 'self'`, but `wave()` emits a dynamic
`style="height:…px"` attribute for every bar. Chromium blocks those attributes.
On a fresh live `/demo/` load, 40 CSP errors were emitted, all 40 bars had a
computed and rendered height of `0px`, and both waveform panels were blank.
Each retained two-real-take run emitted more than 100 CSP errors. This breaks the brief’s core
waveform comparison, violates the “no console errors” definition of done, and
fails the explicit requirement that deployed CSP match what the page loads.

Visual evidence: [live-demo-desktop.png](qa-artifacts/live-demo-desktop.png) and
[live-demo-mobile.png](qa-artifacts/live-demo-mobile.png).

### P1 — “Keep the quieter take” does not keep or mark anything

Clicking the primary comparison action only changes transient status text to
“Preferred take marked.” Neither card gains text, state, class, or an accessible
selected marker. Reloading immediately restores “Two takes are ready to compare”
with neither card preferred. This is a false success message in the core
compare-and-choose workflow.

### P1 — demo persistence contradicts “nothing is saved”

The live banner promises “Demo — sample data, nothing is saved,” but the demo is
written to the persistent `demo:takes` IndexedDB key. Deleting **Desk distance**,
choosing **Start for real**, and returning to Demo left only **One hand closer**;
the user’s demo mutation survived exit. This violates the demo-sandbox contract
that leaving demo discards demo data (or explicitly offers to keep it) and is an
unlisted false claim under the claims contract. Real takes remained isolated,
so this is not cross-namespace data leakage.

### P2 — navigation and route accessibility are incomplete

- **How it works** is `href="#how"` on every route. `/demo`, `/privacy`,
  `/terms`, and the 404 page have no `#how`, so the header link is dead there.
- After **Start for real** changes routes, focus lands on `BODY`, not the new
  h1. The code calls `focus()` on a non-focusable h1 without `tabindex="-1"`.
- Every route ships the home canonical URL. Lighthouse correctly rejects the
  `/demo/` canonical because it points to non-equivalent homepage content.

### P2 — some 390px touch targets remain below 44px

The header wordmark is 24px high; Demo, How it works, and Privacy are about
22.1px high; footer Privacy and Terms links are 14px high. The visible checkbox
itself is 20px, although its associated label provides a larger click area. This
does not meet the product’s all-targets 44×44px baseline.

### P2 — the demo misses the Lighthouse performance gate

The representative `/demo/` run scored 86 rather than the required 90, with
550ms Total Blocking Time. LCP (1.2s) and CLS (0) pass. The landing page scored
91, so the issue is concentrated in the sample-data product view.

### P2 — the update toast is always rendered, even without an update

The update `<aside>` has the `hidden` attribute, but the rule
`.update-toast { display: flex; }` overrides the browser's hidden presentation. On a fresh controlled page,
the toast visibly said “An update is ready” while the registration had no waiting
worker. **Reload update** therefore had nothing to activate, and the fixed toast
overlaid recorder content at 390px. The real two-release update path itself worked.

### P2 — deleting one take is immediate and irreversible

Each card’s × control deletes the locally stored recording immediately, with no
confirmation and no undo. Because there is no cloud copy, an accidental press
permanently loses the take. The separate **Delete all takes** action does use a
specific confirmation and its cancel path works.

## Retest scope

Measure take duration from a monotonic start timestamp and make the boundary test
stable. Fix the waveform/CSP implementation without relaxing CSP to unsafe inline
styles; make preferred-take state real and persistent; make demo exit discard demo
state or change the behavior and promise together; then add regression tests that
assert visible non-zero waveform bars, zero console errors, preference state, and
demo cleanup. Retest all claims, full build/suite, live byte identity, all route
links/focus/canonicals, 390px targets, Lighthouse, live requests, update flow, and
offline reload.
