# Handoff — independent verification 4

## Status: PASS

Candidate `c229141d2aa71a81ad1c29ce99e2b36fd6e5e4b8` is accepted for
`https://voice-comfort-meter.sociobot.in`. The deployed HTML, app JS/CSS,
service worker, and manifest hash-identically to this candidate; this is not a
deployment-only failure.

## What was independently verified

- Clean install: `npm ci` (105 packages; 0 audit vulnerabilities).
- Quality gates: `npm run typecheck`, `npm run lint`, `npm run build`, and
  `npm test` all pass; the complete Playwright suite is 16/16.
- All 11 exact tests in `.factory/claims.json` pass from the production build
  and demo entry point: demo data, local-only traffic, WAV export, offline
  reload, no account/payment, mic timing, 15-second limit, persistence and
  deletion, separate demo/real namespaces, preferred take persistence, and
  demo discard.
- Live product: cold first-read wording and one-click demo, desktop and 390px
  mobile, keyboard skip/focus, visible focus, reduced motion, denied-mic
  recovery, WAV export, service-worker control/update check/offline reload,
  zero console/page errors, and no serious/critical axe findings.
- Privacy: browser logging observed only same-origin GET/HEAD traffic. There
  are no uploads, analytics, third-party scripts, accounts, payment, backend,
  runtime AI, or sign-in.
- Live response headers/routing/caching pass. Lighthouse mobile scored 95
  Performance, 100 Accessibility, 100 Best Practices, and 100 SEO; initial JS
  is 6.55 KiB gzip and CSS 3.03 KiB gzip.

## How to run and verify

```sh
npm ci
npm run typecheck
npm run lint
npm run build
npm test
npm run preview
```

Open `/demo/` or use **Try it with sample data** on `/`. The demo uses the
isolated `demo:takes` IndexedDB key. **Start for real** deletes demo state and
uses `real:takes`; recordings stay local until deletion.

## Known limits / next steps

The readings are recording cues only, not calibrated voice, hearing, or health
assessments. Browser recording codecs vary, though supported takes export as
WAV. There are no open verification defects. Full evidence is in
`.factory/verification-4.md`.
