# Handoff — independent verification 2

## Current release status: FAIL

Candidate `2bd6bb115e6b51f0007d785e2416ae4240d05070` was independently verified on
2026-08-28 at https://voice-comfort-meter.sociobot.in. The live HTML, JS, CSS,
service worker, and manifest are byte-for-byte identical to the candidate build,
so the result is not a stale-deployment failure.

Release blockers found in the shipped product:

- The exact clean-checkout `@claim:take-limit` command failed with `14.9s`
  instead of `15.0s`; the following full suite failed at `14.8s` (12/13 passed).
  Duration is derived from animation-frame count and is scheduling-dependent.
- The strict live CSP blocks every dynamic waveform height. A fresh demo emits
  40 CSP errors and renders 0/40 bars above 0px, leaving both waveform panels
  blank. Each retained two-recording flow emitted more than 100 CSP errors.
- **Keep the quieter take** only displays “Preferred take marked”; it does not
  mark, save, or restore a preferred take.
- The demo says “nothing is saved,” but demo mutations persist in the
  `demo:takes` IndexedDB key after **Start for real** and after returning to Demo.
  This claim is also absent from `.factory/claims.json` as a persistence claim.

Additional P2 findings: the header’s **How it works** link is dead outside the
home route; SPA route changes do not focus the new h1; all routes use the home
canonical; several header/footer mobile targets are below 44px; and the live
demo’s Lighthouse mobile performance score was 86. The update toast is also
always visually rendered even when `hidden` and no worker is waiting, so it
shows a false status and overlays recorder content on mobile. Individual take
deletion is immediate and has neither confirmation nor undo.

Passing evidence: eight of nine exact claim commands passed after `npm ci`;
`npm run build` passed; live recording, valid WAV export, permission recovery,
delete cancellation/confirmation, offline reload, and service-worker update
activation worked. Request logging found only same-origin GET/HEAD requests and
no audio upload. Axe found zero violations. Full evidence, hashes, headers,
severity, and retest scope are in `.factory/verification-2.md`.

Run the automated checks with:

```sh
npm ci
npm test
npm run build
```

Do not release this candidate until the P1 defects are repaired and independently
retested.

# Prior repair handoff

## Offline reload follow-up repair

The controller-reported `@claim:offline-reload` failure was reproduced before
this repair: after `context.setOffline(true)` and a reload of `/demo/`, zero
`.take-card` records rendered. The worker had precached the HTML, JS, and CSS,
but the static host's `Vary` response metadata made the worker's ordinary cache
lookup miss the JS and CSS module requests offline (`net::ERR_FAILED`).

- `public/sw.js` now matches the self-contained, same-origin precached shell by
  URL with `ignoreVary: true`; a host-added `Vary` header can no longer hide a
  precached script or stylesheet.
- Demo seeding now retains its shipped records in memory if a transient
  IndexedDB write fails, instead of allowing an empty demo shell.
- The offline claim regression waits for IndexedDB deletion to complete,
  verifies the persisted `demo:takes` key before going offline, reloads
  offline, and verifies both the two visible cards and that key again.

Verification on 2026-08-28 from a fresh `npm ci`:

- `npm test -- --grep @claim:offline-reload` passed five consecutive fresh
  build/browser runs.
- Every command in `.factory/claims.json` passed from the demo entry point.
- `npm test` passed: **13/13 Playwright tests**.
- `npm run build` passed and produced `dist/`; app JS is 14.87 KB (5.96 KB
  gzip), CSS is 9.01 KB (2.88 KB gzip).
- The browser suite covers desktop, 390px mobile/touch targets, keyboard skip
  link, axe WCAG 2/2.1/2.2 A/AA checks (zero serious or critical findings),
  privacy request logging, fake-microphone recording, explicit offline reload,
  update policy, and production artifact configuration.

Repair commit: `cc999ccbec051bab19713295294cd0b400d5324b` (pushed to `main`).
The repaired `dist/` artifact was deployed to the existing Static Web Apps
production target on 2026-08-28. Live verification after deployment:

- `https://voice-comfort-meter.sociobot.in/assets/app-BaPZcWr1.js` is byte-for-
  byte equal to `dist/assets/app-BaPZcWr1.js` (SHA-256
  `f85908b8eec73deb6a5c91899735384fd5e2d45e1ef83cb62f6022b1e3a9888a`) and
  returns `Cache-Control: public, max-age=31536000, immutable`.
- `/` returns 200 with the configured CSP; `/manifest.webmanifest` is
  `application/manifest+json`; `/sw.js` is no-store; and `/does-not-exist`
  returns a real HTTP 404.
- In a fresh live Chromium context, `/demo/` loaded its two cards, reloaded
  while offline with those two cards still visible, and emitted no page errors.
  At 390px, the Demo page had its route title, exactly one h1, a main landmark,
  and 390px document scroll width.

## Release repair

Repaired the release blockers reported against candidate `1ecfe0092be235667733013eba4a6ce569b7b025`:

- Static Web Apps configuration is now emitted in `dist/staticwebapp.config.json`, with CSP, security headers, manifest MIME type, immutable hashed-asset caching, a non-cached service worker, and a real 404 response override.
- Known app routes are emitted as real static documents (`/demo/`, `/privacy/`, `/terms/`). There is no SPA navigation fallback, so unknown paths reach the host 404 override instead of returning HTTP 200.
- JS/CSS filenames are content-hashed. The generated worker uses a matching versioned cache, only reads its own cache (never a prior release cache), provides offline navigation fallback, and supports a visible update prompt that activates the waiting worker on explicit reload.
- Every verifier-identified visitor claim is now in `.factory/claims.json` with a unique executable regression test. The offline claim now performs an actual offline reload.
- At 390px, Reset demo, Start for real, delete, Play, and Export controls measure at least 44×44 CSS px.
- The landing action now seeds demo data even when entered from the landing page. `/demo/` is handled as demo mode as well as `/demo`.

## Verify locally

```sh
npm ci
npm test
npm run build
```

`npm test` passed on 2026-08-28: **13/13 Playwright tests**. It includes all ten claims; fake-microphone recording, 15-second automatic stop, persistence/deletion, IndexedDB namespace isolation, desktop and 390px checks, keyboard skip-link coverage, actual offline reload, production-artifact configuration checks, and axe-core WCAG 2/2.1/2.2 A/AA scans on `/`, `/demo/`, `/privacy`, and `/terms` (zero serious/critical findings).

`npm run build` passed on 2026-08-28 and writes `dist/index.html`, route documents, `staticwebapp.config.json`, hashed JS/CSS, manifest, and the generated service worker. Current build output is 14.87 KB JS (5.96 KB gzip) and 9.01 KB CSS (2.88 KB gzip).

## Deploy

Deploy the generated `dist/` directory as the existing static Static Web Apps artifact. No secrets or runtime services are required. After deployment, verify live CSP, `application/manifest+json`, immutable `/assets/*` headers, and an HTTP 404 at an unknown route; these settings are now part of the emitted artifact rather than only the source tree.

Deployed production on 2026-08-28 with Azure Static Web Apps CLI from the verified `dist/` artifact. Repair code commit: `a1e34476b1cfce3f7f67718c2f19dfec8b5fc9d9`. Live verification at `https://voice-comfort-meter.sociobot.in` recorded:

- `/` returns `200` with the expected CSP and `Last-Modified: 19:46:51 GMT`.
- `/manifest.webmanifest` returns `application/manifest+json`.
- `/assets/app-Bjyq4PuW.js` returns `Cache-Control: public, max-age=31536000, immutable`.
- `/does-not-exist` returns real `404` while serving the designed app not-found document.
- `/demo/` returns `200` with the same CSP.
- Live Chromium smoke passed at 1280px and 390px: `/demo/` has the Demo title, one h1, main landmark, two sample cards, no page errors, and no horizontal overflow.

## Known limitations

Level and room-noise marks remain simple recording cues, not calibrated measurements. Browser recording codecs vary; supported recordings are converted to WAV during export.
