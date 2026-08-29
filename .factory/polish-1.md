# Polish 1 — review repair evidence

**Reviewed release:** `c229141d2aa71a81ad1c29ce99e2b36fd6e5e4b8`  
**Repair commits:** `1d2c1b6`, `b4c5be9`, `77a0375`  
**Deployed URL:** https://voice-comfort-meter.sociobot.in

## Review 1 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Replaced browser-created sine tones with two bundled, precached spoken PCM WAV assets. Demo seeding copies their actual bytes into `demo:takes`; Play and Export use that stored blob. | `@claim:bundled-spoken-samples`; live `/?demo=1` check found both RIFF/WAVE files (2.964 s and 2.916 s); [live demo](/work/repo/.factory/qa-artifacts/polish-1-live/screenshot-mobile.png). |
| F-1-2 | Used the exact audience sentence on landing and README: “For podcasters, singers, and speakers choosing between two recording setups.” | Cold live landing check; [390px landing](/work/repo/.factory/qa-artifacts/polish-1-live/live-home-mobile.png). |
| F-1-3 | Removed “A small recording check”; changed labels to “Record and compare takes” and “Record a take”; changed footer to “Private voice-take comparison.” | `.factory/copy-audit.md`; live landing and demo screenshots. |
| F-1-4 | Changed the 404 heading to “Page not found” and kept the recorder recovery link. | Live `/does-not-exist` returned HTTP 404; [404 screenshot](/work/repo/.factory/qa-artifacts/polish-1-live/live-404-desktop.png). |
| F-1-5 | Added `comparison-marks` to claims inventory and a dedicated observable test for both labels and comparison guidance. | `npm test -- --grep @claim:comparison-marks` passed from the clean clone; live demo exposes two Level and two Room noise marks. |

## Earlier verification findings

| Finding | Current repair / retained fix | Evidence |
| --- | --- | --- |
| verification P1 — security, manifest, real 404 | Kept deployment headers, manifest MIME, generated static routes, and response 404 override; confirmed after redeploy. | Live `/does-not-exist` = 404; CSP includes `frame-ancestors 'self'`; `X-Frame-Options: SAMEORIGIN`. |
| verification P1 — incomplete claims | Expanded inventory to 13 claims, including bundled spoken samples and comparison marks. | Every exact command in `.factory/claims.json` passed from `/tmp/voice-comfort-accepted-clean.YwafP3`; 13/13. |
| verification P2 — mobile targets | Retained 44px controls and stacked mobile layout. | `mobile controls meet the 44px touch-target baseline`; [live mobile demo](/work/repo/.factory/qa-artifacts/polish-1-live/screenshot-mobile.png). |
| verification P2 — PWA caching/update | Kept versioned shell, worker update path, and immutable hashed assets; added both sample WAV files to the precache shell. | `@claim:offline-reload` and production-artifact test pass; live offline reload retained two cards. |
| verification-2 P1 — take-limit suite failure | Retained monotonic 15.0-second recording boundary. | `@claim:take-limit` passed from clean clone. |
| verification-2 P1 — CSP waveforms/console | Retained SVG waveform approach compatible with strict CSP. | `@claim:demo-comparison`; live verifier reports zero console errors. |
| verification-2 P1 — preferred take persistence | Retained local preferred marker persistence. | `@claim:preferred-take` passed. |
| verification-2 P1 — demo exit persistence | Retained delete-on-exit boundary and reset path. | `@claim:demo-discard` passed; live banner has Reset demo and Start for real. |
| verification-2 P2 — routes, focus, canonicals | Retained real static routes and focus restoration; added route-specific description and OG/Twitter metadata. | `cross-route anchors, focus, canonicals, update state, and deletion are correct`; live `/demo/`, `/privacy/`, `/terms/` title/canonical checks. |
| verification-2 P2 — mobile targets | Retained responsive stacking and target sizing. | `mobile controls meet the 44px touch-target baseline` passed. |
| verification-2 P2 — demo performance | Preserved small JS and measured the repaired artifact again. | Build JS 6.80 KiB gzip; Lighthouse mobile rerun: performance 93, accessibility 100, best practices 100, SEO 100 in `polish-1-local/lighthouse-demo-mobile-rerun.json`. |
| verification-2 P2 — update toast | Retained hidden-until-waiting behavior. | Cross-route/update regression test passed. |
| verification-2 P2 — one-take deletion | Retained specific browser confirmation. | Cross-route/deletion regression test passed. |
| verification-3 P1 — flaky storage claim | Made the production server test isolated to its own checkout and made service-worker activation ordering deterministic in the offline claim. | Final fresh-clone full suite 19/19; `@claim:separate-storage` and `@claim:offline-reload` pass. |
| verification-3 P2 — clickjacking | Retained `frame-ancestors 'self'` response header and `SAMEORIGIN`. | Live header check after deployment. |
| verification-4 — no open defects | Rechecked all listed PASS criteria after the new sample/copy/metadata changes. | Clean clone suite, live cold check, and deployment byte-name check all completed. |

## Final evidence

- Fresh clone: `npm ci`, all 13 exact claim commands, `npm test` (19/19), `npm run typecheck`, `npm run lint`, and `npm run build` passed.
- Accessibility: Playwright axe test covers desktop and 390px `/`, `/demo/`, `/privacy/`, and `/terms/`; live `verify-url.sh` reports title, `lang=en`, one h1, main, alts, named controls, and zero console/page errors.
- Live cold check: `/?demo=1` showed the banner, Reset demo, Start for real, two sample cards, comparison guidance, and local WAV signatures. A service-worker-controlled offline reload retained both cards with no errors.
