# Handoff — Voice Comfort Meter repair

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

## Known limitations

Level and room-noise marks remain simple recording cues, not calibrated measurements. Browser recording codecs vary; supported recordings are converted to WAV during export.
