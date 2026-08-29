# Handoff — Polish 2

## Status: repair verified locally; pending live deployment check

The product repair is commit `b759e54ecea94c54a72a1ca7fe65a3105a6b1016`. It resolves every F-2-1 through F-2-4 finding and retains the repairs for every prior review/verification finding. The complete finding-by-finding matrix is `.factory/polish-2.md`.

## What changed

- Demo sample cards and their conclusion now precede the recorder, so phone visitors see actual sample evidence immediately.
- The visible demo marks now say Desk distance: **noticeable** room noise; One hand closer: **low** room noise, which supports the conclusion.
- The demo exit control is **Discard demo and record** everywhere it is visitor-facing.
- README demo copy explains the user outcome instead of storage keys.
- The two affected claim tests now assert the mobile viewport and exact visible semantic comparison. The catalog sentence is verb-first and 53 characters.

## Local evidence

- Fresh clone `/tmp/voice-comfort-clean.k2yImr`, commit `b759e54`: `npm ci`, `npm run build`, all 13 exact `.factory/claims.json` commands, full `npm test` (19/19), `npm run typecheck`, and `npm run lint` passed.
- Built `dist/` has 17.93 KiB JS (6.86 KiB gzip) and 10.01 KiB CSS (3.12 KiB gzip).
- Full tests cover axe on desktop/mobile routes, no console errors, route titles/focus/canonicals, 44px mobile targets, PWA/offline reload, same-origin request privacy, recording errors/limit, demo isolation/reset/exit, export, and update-toast state.
- [390px mobile demo screenshot](/work/repo/.factory/qa-artifacts/polish-2/local-mobile-demo.png) shows the first sample card at y=477 and its Room noise mark at y=678 within the 844px viewport.

## Deployment / live verification

Push the committed repair to `main` to invoke the configured static deployment, then run the live cold/browser/offline/header/route checks listed in `.factory/polish-2.md`. Add the resulting live URL evidence here before final handoff.

## Repository state

Pre-existing modifications under `graphify-out/` were preserved and are not part of this repair.
