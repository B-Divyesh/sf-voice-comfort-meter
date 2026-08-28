# Handoff — release-blocking QA repair 3

## Status

All findings in independent verifier commit `1879eb35023ddbe9f26a7751e1b21d0b23980db6` against candidate `2bd6bb115e6b51f0007d785e2416ae4240d05070` are repaired and covered. The artifact remains a static, local-first PWA built to `dist/`.

## Reproduction

After `npm ci`, the unchanged timing claim was run three times concurrently. Two runs failed exactly as reported: the displayed duration was `14.9s` instead of `15.0s`. The old implementation divided animation-frame sample count by 60, so scheduler load changed the recorded duration.

The report also mapped directly to source behavior: waveform bars used CSP-blocked `style` attributes; the preference action only changed transient status copy; Start for real retained `demo:takes`; non-home routes linked to a missing local `#how`; h1 elements were not focusable; static route HTML used the home canonical; `[hidden]` lost to `.update-toast { display:flex }`; several links and the checkbox were shorter than 44px; and individual deletion had no confirmation.

## Repairs

- Recording duration uses `performance.now()`. The automatic stop checks the monotonic deadline and records exactly `15.0s`, independent of animation-frame frequency.
- Waveforms use CSP-safe SVG `rect` geometry. A strict response-CSP regression asserts every bar has non-zero rendered height and that the console stays clean.
- Keep the quieter take writes one `preferred` flag to IndexedDB, renders a visible and accessible Preferred marker, disables the completed action, and restores that state after reload.
- Start for real deletes `demo:takes` before navigation. Returning to Demo restores both original samples. The banner now accurately says sample changes are discarded.
- New registered claims cover persistent preference and demo discard. All 11 claim entries have one matching `@claim:` test.
- Header anchors now use `/#how`. SPA navigation focuses the route h1, preserves back/forward scroll, scrolls the requested home section, and updates the canonical. Built `/demo/`, `/privacy/`, `/terms/`, and `404.html` carry route-specific canonical/title markup before JavaScript runs.
- Every visible anchor, button, and checkbox is at least 44×44px at 390px. The automated test measures every visible interactive target, not a selected subset.
- `[hidden]` always removes the update toast. A two-release service-worker probe verifies the toast is initially absent, appears only with a waiting worker, activates on Reload update, and retains both demo cards.
- Individual take deletion now names the take and requires confirmation. Cancel retains the recording; confirmation deletion remains covered.
- Demo samples defer WAV synthesis until Play or Export, and below-fold guidance uses rendering containment. This removed the demo’s blocking-time regression.
- Added explicit TypeScript and ESLint scripts.

## Clean verification — 2026-08-28 UTC

From a clean `npm ci` (105 packages, zero vulnerabilities):

- Every exact command in `.factory/claims.json`: **11/11 passed independently**. Evidence: `qa-artifacts/repair-claims.txt`.
- `npm test`: **16/16 passed**. This includes fake-microphone recording, deterministic auto-stop, valid WAV download, storage persistence/isolation/discard, CSP waveform rendering, console checks, real offline reload, desktop/390px routes, keyboard/focus, all touch targets, route canonicals/anchors, delete cancel/confirm, update visibility, production policy, and axe-core scans. Evidence: `qa-artifacts/repair-npm-test.txt`.
- `npm run typecheck`: passed. `npm run lint`: passed. `npm audit --omit=dev`: zero vulnerabilities.
- `npm run build`: passed and produced `dist/`. Final app JS is 16,416 bytes (6,491 gzip); CSS is 9,613 bytes (3,033 gzip).
- `/opt/fleet/lib/verify-url.sh` passed with the correct title, `lang=en`, one h1, main landmark, alt text, named buttons, and zero console errors. Evidence: `qa-artifacts/repair-verify-url.txt`.
- Playwright axe-core 4.11.4 found no serious or critical findings on `/`, `/demo/`, `/privacy/`, and `/terms/`, including 390×844. The standalone axe CLI was attempted; its bundled ChromeDriver 152 cannot start the supplied Chromium 145. The same axe engine passed through pinned Playwright 1.58.2.
- Lighthouse 12.8.2 mobile on `/demo/`: performance **100**, accessibility **100**, best practices **100**, SEO **100**; LCP **1.2s**, TBT **20ms**, CLS **0**. Evidence: `qa-artifacts/lighthouse-repair-demo-mobile.json`.
- The retained two-release update probe returned `{"initialHidden":true,"waitingPromptVisible":true,"updatedWorkerActive":true,"retainedCards":2}`. Evidence: `qa-artifacts/repair-update-check.mjs` and `.txt`.
- Privacy request logging during demo/export allows only same-origin GET/HEAD traffic. No audio upload, analytics, external script/font, runtime AI call, account, backend, or payment flow exists. Response-rate and Entra identity checks are not applicable to this static, unsigned product.

## Run locally

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

## Deployment and live identity

Repair commit `2e39f9bbbd13e41c7f8df61df0b9b5949b9079a4` was pushed to `origin/main`. Its `dist/` artifact was deployed with `/opt/fleet/lib/deploy-static.sh voice-comfort-meter dist`; Azure deployment `6e5de0de-013d-44c8-8e67-61ba729840da` succeeded at the existing Static Web App and custom domain.

Post-deploy evidence:

- `/` and `/demo/` return 200 with the strict CSP, HSTS, `Referrer-Policy`, and `X-Content-Type-Options`; `/does-not-exist` returns a real HTTP 404.
- The manifest returns `application/manifest+json`; `/sw.js` is `no-cache, no-store`; the hashed JS is `public, max-age=31536000, immutable`.
- Live and local SHA-256 values are byte-identical: `index.html` `333492f0…c4ef`; JS `37ecb594…9cc4`; CSS `90ec791f…6e1`; service worker `b5e4cd8d…abc8`; manifest `0a2f7973…e19`.
- The live 390px probe found two cards, 40 non-zero waveform bars, zero console/page errors, no small touch targets, correct Demo canonical/title, hidden update toast, a restored preferred take, focused h1 after Start for real, no `demo:takes` key after exit, and two cards after an offline reload. All recorded requests were same-origin GETs.
- The live URL verifier passed `/demo/` at desktop and 390px with one h1, `lang=en`, main landmark, named buttons, and zero console errors.

Evidence: `qa-artifacts/repair-live-http.txt`, `repair-live-identity.txt`, `repair-live-check.mjs`, `repair-live-check.json`, and `repair-live-verify/`.

## Known limitations

Level and room-noise marks remain recording cues, not calibrated measurements. Browser recording codecs vary; supported recordings are converted to WAV during export. No release-blocking gap is known.
