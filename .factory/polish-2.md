# Polish 2 — cumulative review repair evidence

**Reviewed candidate:** `def5279c6e833ab1763d87ddca79c01d6c5639bc`  
**Product repair commit:** `b759e54ecea94c54a72a1ca7fe65a3105a6b1016`  
**Live URL:** https://voice-comfort-meter.sociobot.in

## Review 2 findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-2-1 | Demo now renders the two sample cards and their comparison before the recording panel. The 390px first viewport has the Desk distance card and both Level and Room noise marks; the disabled recording action is below the sample evidence. | `@claim:demo-comparison` (clean clone); [390px local demo](/work/repo/.factory/qa-artifacts/polish-2/local-mobile-demo.png); live cold `/demo/` check recorded below. |
| F-2-2 | The Desk distance fixture now visibly reads **Room noise: noticeable** and One hand closer reads **low**. The conclusion therefore follows from the displayed marks: “Take 2 has less room noise.” | `@claim:comparison-marks` (clean clone); [390px local demo](/work/repo/.factory/qa-artifacts/polish-2/local-mobile-demo.png); live `/demo/` check recorded below. |
| F-2-3 | Renamed the banner action and documentation to **Discard demo and record**. It deletes demo changes, returns to the real recorder, and does not change real recordings. | `@claim:demo-discard` (clean clone); live `/demo/` check recorded below. |
| F-2-4 | Replaced the README’s IndexedDB key explanation with the useful guarantee: demo clips remain separate, and leaving the demo deletes only demo changes. Implementation-key detail remains only in `.factory/demo.md`. | README review; `@claim:demo-discard` (clean clone). |

## Earlier findings retained and rechecked

| Finding | Change retained | Evidence |
| --- | --- | --- |
| F-1-1 | Bundled original spoken WAV clips are precached, seeded into `demo:takes`, and used for playback/export. | `@claim:bundled-spoken-samples` (clean clone); live `/demo/` check recorded below. |
| F-1-2 | Landing and README use the same podcasters, singers, and speakers audience sentence. | `.factory/copy-audit.md`; live `/` cold check recorded below. |
| F-1-3 | Useful headings remain: Record and compare takes, Record a take, and Private voice-take comparison. | `.factory/copy-audit.md`; live `/` check recorded below. |
| F-1-4 | The real 404 has h1 **Page not found** and a recorder recovery link. | Full route test; live missing-route check recorded below. |
| F-1-5 | The comparison marks are a listed claim with an observable semantic test. | `@claim:comparison-marks` (clean clone). |
| verification P1 — security/HTTP | Static route files, real 404 override, manifest MIME, CSP response header, and `X-Frame-Options` remain in the built artifact. | `production artifact ships deployment config, static routes, hashes, and update policy`; live headers/routes check recorded below. |
| verification P1 — claims | The inventory has 13 claims, each with exactly one tagged Playwright test. | All 13 exact commands from `.factory/claims.json` passed in a clean clone. |
| verification P2 — mobile targets | Controls retain 44px minimum targets with no 390px overflow. | `mobile controls meet the 44px touch-target baseline`; live mobile check recorded below. |
| verification P2 — PWA policy | Versioned precache, offline reload, immutable hashed assets, and update path remain. | `@claim:offline-reload`; production-artifact test; live offline check recorded below. |
| verification-2 P1 — take limit | The recorder stops at exactly 15.0 seconds. | `@claim:take-limit` (clean clone). |
| verification-2 P1 — CSP waveforms | SVG waveforms render under strict CSP without console errors. | `@claim:demo-comparison`; axe/full suite. |
| verification-2 P1 — preferred take | The quieter choice remains visibly marked after reload. | `@claim:preferred-take` (clean clone). |
| verification-2 P1 — demo persistence | Demo reset/exit stays isolated from real recordings. | `@claim:separate-storage`, `@claim:demo-discard` (clean clone). |
| verification-2 P2 — routing/accessibility | Route titles, canonicals, focus restoration, and back/anchor behavior remain covered. | `cross-route anchors, focus, canonicals, update state, and deletion are correct`; live route check recorded below. |
| verification-2 P2 — target size | All visible mobile controls stay at least 44×44px. | `mobile controls meet the 44px touch-target baseline`. |
| verification-2 P2 — performance | Product JavaScript is 6.86 KiB gzip and CSS is 3.12 KiB gzip. | clean-clone `npm run build`. |
| verification-2 P2 — update toast | The update toast stays hidden unless a worker is waiting. | `cross-route anchors, focus, canonicals, update state, and deletion are correct`. |
| verification-2 P2 — deletion | Individual deletion has a specific browser confirmation. | `cross-route anchors, focus, canonicals, update state, and deletion are correct`. |
| verification-3 P1 — storage race | Demo readiness is published only after seeding; direct demo storage test is stable. | `@claim:separate-storage` and full 19-test suite (clean clone). |
| verification-3 P2 — clickjacking | CSP `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` remain configured. | production-artifact test; live headers check recorded below. |
| verification-4 | Its no-defect result was rechecked through the full suite and all declared claims. | clean clone results below. |

## Clean-clone verification

Fresh clone: `/tmp/voice-comfort-clean.k2yImr` at `b759e54`. After `npm ci`, `npm run build` passed and produced `dist/`. Every exact test command in `.factory/claims.json` passed (13/13): `demo-comparison`, `bundled-spoken-samples`, `comparison-marks`, `privacy-local`, `wav-export`, `offline-reload`, `no-account-payment`, `microphone-on-record`, `take-limit`, `recordings-until-delete`, `separate-storage`, `preferred-take`, and `demo-discard`.

The full `npm test` suite passed (19/19). `npm run typecheck` and `npm run lint` passed. The full suite includes desktop/mobile axe checks for `/`, `/demo/`, `/privacy/`, and `/terms`, offline reload, request privacy, routes/focus, delete confirmation, and touch-target coverage.

## Post-deploy live check

After push/deploy, a cold browser check must confirm `/`, `/demo/`, `/privacy/`, `/terms/`, and a missing route; the 390×844 demo evidence; headers; offline reload; request privacy; and `/opt/fleet/lib/verify-url.sh`. Exact live evidence is added to the handoff after that check.
