# Handoff — release-blocking QA repair 4

## Status

The release blockers in independent verifier report `verification-3.md` for
candidate `42f2ce3790630a44d30170f4fd364272879ec81c` are repaired. This remains
a static, local-first PWA whose build output is `dist/`.

## Repairs

- Demo startup now exposes `#app[data-demo-ready="true"]` only after the
  sample `demo:takes` IndexedDB transaction and the matching two-card render
  have completed. It is `pending`/`loading` while startup is in progress and
  is announced busy to assistive technology. The storage-isolation claim waits
  for this public readiness boundary, then immediately verifies the committed
  `demo:takes` key and independent `real:takes` key after a real recording.
  This directly covers the clean-suite race documented by verifier-3.
- Static Web Apps responses now send CSP `frame-ancestors 'self'` and the
  compatible `X-Frame-Options: SAMEORIGIN` response header. The production
  artifact regression checks both values.

## Verification before deployment

From a clean `npm ci` (105 packages; `npm audit --omit=dev`: zero
vulnerabilities):

- `npm run typecheck`, `npm run lint`, and `npm run build` passed. The build
  produced `dist/`; app JS is 16.63 kB (6.55 kB gzip) and CSS 9.61 kB
  (3.03 kB gzip).
- `npm test` passed **16/16**. A three-repeat full-suite stress run completed
  **48/48**. The repaired `@claim:separate-storage` command passed, including
  a 12-repeat pre-fix baseline and post-fix readiness regression.
- Every exact command listed in `.factory/claims.json` passed independently:
  all 11 claims cover demo comparison, local-only requests, WAV export,
  offline reload, no account/payment, permission timing, 15-second limit,
  persistence/deletion, separate namespaces, preferred take, and demo discard.
- Playwright axe-core checks in the suite passed with no serious or critical
  findings on desktop `/`, `/demo/`, `/privacy/`, and `/terms/`, plus 390×844
  `/demo/`. Keyboard skip-link/focus, 44px mobile targets, strict CSP waveform
  rendering, offline reload, update behavior, and privacy request assertions
  also pass in the suite.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/demo/` passed: 200,
  one h1, `lang=en`, main landmark, alt coverage, named buttons, and zero page
  errors. The standalone axe CLI was invoked with the supplied Chromium but
  its Selenium ChromeDriver exits before creating a session; the same axe
  engine passes through pinned Playwright 1.58.2. Lighthouse also cannot keep
  a tab alive against the supplied headless Chromium; the prior unchanged
  artifact measured 100 performance / 100 accessibility, and this repair adds
  only a readiness attribute and response headers.

## Deploy and live checks

Pending the repair commit and static deployment. After deployment, verify the
live custom domain for byte identity, `frame-ancestors`, `X-Frame-Options`,
PWA/offline behavior, desktop/mobile console errors, and route status.

## Known product limits

Level and room-noise labels are recording cues, not calibrated measurements.
Browser recording codecs vary; supported recordings are converted to WAV at
export. No audio, analytics, account, payment, or third-party runtime request
is used.
