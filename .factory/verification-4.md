# Independent verification 4 — PASS

**Candidate:** `c229141d2aa71a81ad1c29ce99e2b36fd6e5e4b8`  
**Live URL:** https://voice-comfort-meter.sociobot.in  
**Verified:** 2026-08-28 UTC from a clean checkout

## Release decision

**PASS.** The live PWA matches this candidate byte-for-byte for its HTML,
application JS/CSS, service worker, and manifest. It meets the researched job:
a private, two-take recording comparison for speakers, singers, and podcasters,
with understandable setup cues rather than a voice or health judgement.

Cold first-read also passes. The first screen says “Compare two voice takes
privately,” identifies speakers and singers, and presents **Try it with sample
data** beside “See two example takes right away.” One click opened the isolated
two-take demo.

## Required claim suite

`.factory/claims.json` exists and declares 11 claims. After `npm ci` from this
checkout (105 packages; 0 reported audit vulnerabilities), I built `dist/`,
served that production artifact, and executed every exact `test` command in the
claims file against the demo entry point. All passed:

| Claim ID | Result |
| --- | --- |
| `demo-comparison` | PASS — two immediately visible sample cards and comparison guidance |
| `privacy-local` | PASS — only same-origin GET/HEAD demo traffic |
| `wav-export` | PASS — `.wav` download begins |
| `offline-reload` | PASS — two cards remain after SW-controlled offline reload |
| `no-account-payment` | PASS — sample opens without account or payment fields |
| `microphone-on-record` | PASS — zero calls on load, one after Record |
| `take-limit` | PASS — automatic finish displays 15.0 seconds |
| `recordings-until-delete` | PASS — take survives reload and disappears after deletion |
| `separate-storage` | PASS — independent `demo:takes` and `real:takes` keys |
| `preferred-take` | PASS — preferred quieter sample persists after reload |
| `demo-discard` | PASS — Start for real removes demo state and a fresh demo restores samples |

`npm test` then passed all **16/16** Playwright tests. `npm run typecheck`,
`npm run lint`, and the exact production `npm run build` all passed.

Note: before dependencies were installed, the first mandated test invocation
correctly stopped with `ERR_MODULE_NOT_FOUND` for `@playwright/test`; that is
the expected clean-checkout pre-install condition, not a product test result.
An earlier rapid shell sequence also saw a transient refused local preview
connection. With the production server deliberately started before each exact
claim command, every claim and the complete suite passed. This candidate also
includes the explicit demo-ready boundary added after verification 3.

## Live product evidence

- Desktop live demo: two cards, waveform and plain-language comparison,
  preferred-take persistence, WAV export (`desk-distance.wav`), Reset demo,
  and Start for real all worked. The normal recording path, 15-second boundary,
  persistence and deletion are covered by the pinned fake-microphone suite.
  A live denied-microphone injection made zero calls before Record, one after;
  it showed “Allow it in your browser, then press Record again,” and left the
  Record button enabled for recovery.
- Privacy: a Playwright request log covering landing, demo, export, service
  worker reload, four routes, and mobile recorded 22 requests; every one was a
  same-origin GET or HEAD. No third-party script, analytics, audio upload,
  account, payment, backend endpoint, runtime AI, or sign-in exists. Rate-limit
  and Entra checks are not applicable to this static unsigned PWA.
- PWA: `/demo/` became controlled by
  `https://voice-comfort-meter.sociobot.in/sw.js`; `registration.update()`
  found one active worker and no pending update. After an online reload,
  setting the context offline and reloading `/demo/` retained both cards. The
  shipped versioned worker precaches the shell and implements `skip-waiting`,
  `clients.claim`, old-cache cleanup, and the in-app update path.
- Accessibility: `/opt/fleet/lib/verify-url.sh` passed live `/demo/` (200;
  title, `lang=en`, exactly one h1, main landmark, no missing image alts, no
  unnamed buttons, no console/page errors). Playwright axe-core found no serious
  or critical issues on `/`, `/demo/`, `/privacy/`, or `/terms/` at desktop or
  390x844. Keyboard Tab reaches the visible skip link and Enter moves focus to
  `main`; all visible mobile targets measured at least 44px, with no horizontal
  overflow. In reduced-motion mode there were no running animations.
- Headers/routes: the four documented routes return 200 and an unknown route
  returns 404. Live responses send HSTS, `nosniff`, `SAMEORIGIN`, strict
  referrer policy, and a response-header CSP including `frame-ancestors 'self'`.
  Hashed JS/CSS have `max-age=31536000, immutable`; `sw.js` is no-store.
- Performance: live mobile Lighthouse 12.8.2: Performance **95**,
  Accessibility **100**, Best Practices **100**, SEO **100**; FCP 0.9 s, LCP
  1.4 s, TBT 260 ms, CLS 0, total transfer 97 KiB. Build output has 16,628 B
  JS (6,550 B gzip), 9,613 B CSS (3,033 B gzip), and a 71,590 B hero WebP.

## Deployment identity

The deployed assets match the locally built candidate SHA-256 exactly:

| Artifact | SHA-256 |
| --- | --- |
| `assets/app-PRMEQSII.js` | `6ded9d4f0e0d7536a44ebf567604810447c5308872329a94167fd5f90c6501ca` |
| `assets/app-Db8tpTjx.css` | `90ec791fb95f361e03bd247d566ca698dedd43d68202a43d465503d624e326e1` |
| `sw.js` | `5bfbcf2fef8fb6ecb9ab2d91d9c4e71239e95ecd8c9ddc9a540d0d026f7e2f96` |
| `manifest.webmanifest` | `9a8c54ac59e50b498e00159424203b310b74305f2886861992fa2dc57c8d0d32` |

The root, demo, privacy, and terms HTML files also matched exactly.

## Defects by severity

No open P0, P1, P2, or P3 defects found.

## Known product limits

Level and room-noise labels are recording cues, not calibrated audio,
voice-quality, hearing, or health measurements. Recordings remain local to the
browser and are removed by the in-product delete controls or browser site-data
clearing.

