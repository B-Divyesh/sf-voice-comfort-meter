# Handoff — Polish 1

## Status: PASS

Repair commits `1d2c1b6`, `b4c5be9`, and `77a0375` repaired the reviewed candidate. Production was deployed through the Static Web Apps work-order target `sf-voice-comfort-meter` from the final clean-clone `dist/`.

## What changed

- The demo now ships two local spoken WAV fixtures, precaches them, copies their bytes into `demo:takes`, and uses those bytes for Play and Export. The sine-wave fallback is removed.
- `/?demo=1` now resolves directly into the isolated demo screen with its persistent banner, Reset demo, and Start for real controls.
- Landing/README audience copy, functional labels, footer copy, 404 wording, route metadata, and social metadata were corrected.
- `claims.json` now has 13 observable claims, including bundled sample playback and level/room-noise marks. The service-worker test setup is deterministic in a clean checkout.

## Exact verification evidence

- Final clean clone `/tmp/voice-comfort-accepted-clean.YwafP3`: `npm ci` (105 packages, 0 vulnerabilities), every exact `.factory/claims.json` command (13/13), `npm test` (19/19), `npm run typecheck`, `npm run lint`, and `npm run build` passed.
- Build: 17.73 KiB JS / 6.80 KiB gzip and 9.73 KiB CSS / 3.06 KiB gzip. `dist/` was produced.
- Accessibility: the 19-test suite includes axe checks across all routes and mobile. `/opt/fleet/lib/verify-url.sh https://voice-comfort-meter.sociobot.in/?demo=1` passed with no errors, one h1, main, `lang=en`, and no missing alts or unnamed buttons. Evidence: [live verify JSON](/work/repo/.factory/qa-artifacts/polish-1-live/verify.json).
- Lighthouse mobile rerun on the final clean-clone production artifact: performance 93, accessibility 100, best practices 100, SEO 100. Evidence: [report](/work/repo/.factory/qa-artifacts/polish-1-local/lighthouse-demo-mobile-rerun.json).
- Live cold checks after deployment: `/`, `/demo/`, `/privacy/`, and `/terms/` returned 200; unknown route returned 404. `/demo/desk-distance.wav` returned 200. Live `/?demo=1` had two cards, Level/Room noise marks, banner/reset/exit controls, zero console errors, and two decodable RIFF/WAVE clips (2.964 s and 2.916 s). A service-worker-controlled offline reload retained both cards.
- Live screenshots: [landing mobile](/work/repo/.factory/qa-artifacts/polish-1-live/live-home-mobile.png), [demo mobile](/work/repo/.factory/qa-artifacts/polish-1-live/screenshot-mobile.png), [404](/work/repo/.factory/qa-artifacts/polish-1-live/live-404-desktop.png).

## Run locally

    npm ci
    npm test
    npm run typecheck
    npm run lint
    npm run build
    npm run preview

Open `/demo` or `/?demo=1`. The demo uses `demo:takes`; Start for real deletes it before returning home. Real recordings use `real:takes`.

## Known gaps

None. The two shipped demo clips are offline-generated spoken fixtures, not a voice-quality, hearing, or health assessment.
