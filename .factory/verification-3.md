# Independent verification 3 — FAIL

**Candidate:** `42f2ce3790630a44d30170f4fd364272879ec81c`  
**Live URL:** https://voice-comfort-meter.sociobot.in  
**Verified:** 2026-08-28 UTC, from the supplied clean checkout

## Release decision

**FAIL.** The deployed static artifact is the candidate and works in the
browser, but the required clean full test suite is nondeterministic and fails a
declared claim test. A release cannot pass while `npm test` is unreliable.

## Required first gates

`.factory/claims.json` exists and contains 11 declared claims. After `npm ci`,
each listed claim command was invoked through the product's Playwright demo
entry point. An aggregate fresh run (`npm test -- --grep @claim`) passed all
**11/11** in 29.7 s. Isolated reruns of `@claim:offline-reload` and three
runs of `@claim:separate-storage` also passed.

That is not sufficient for acceptance: a clean `npm test` run failed
`@claim:separate-storage` (15 passed, 1 failed). The test opened `/demo` and
immediately found the IndexedDB `takes` store empty when it required
`["demo:takes"]` at `tests/app.spec.ts:169`. The demo seeding/render path is
asynchronous, so the suite has an order/timing race. An earlier full-suite run
also ended failed with `@claim:offline-reload`. The exact full-suite failure is
release-blocking under both the quality gate and the claims contract.

Cold live first-read: **PASS.** The first screen plainly says “Compare two
voice takes privately,” names “speakers and singers,” and presents the one-click
**Try it with sample data** action beside “See two example takes right away.”
It opens two sample take cards.

## Test results

| Check | Result / evidence |
| --- | --- |
| `npm ci` | PASS — 105 packages installed; 0 audit vulnerabilities |
| Every `.factory/claims.json` command | PASS in isolated/aggregate execution — 11 tagged claims |
| `npm test` | **FAIL — 15/16**; required `@claim:separate-storage` failed at `app.spec.ts:169` because `demo:takes` was not yet written |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS; `dist/` produced |
| Bundle budget | PASS — JS 16,419 B (6,490 B gzip), CSS 9,613 B (3,033 B gzip), hero 71,590 B |
| Live Lighthouse mobile `/demo/` | PASS — Performance 99, Accessibility 100; FCP/LCP 1.0 s, TBT 120 ms, CLS 0 |

## Product, privacy, PWA, and accessibility evidence

- Demo loads two visible cards and waveforms, allows a preferred quieter take,
  persists that mark after reload, and has an explicit **Start for real** path.
- The service worker controlled the live page; online reload followed by an
  offline `/demo/` reload retained two cards and the preferred mark. Its update
  check found an active controller and no waiting update. The shipped worker
  implements `skip-waiting` and cache-version cleanup.
- Live request logging through landing, demo, export, reload, and offline flow
  recorded only same-origin `GET` requests. There were no third-party scripts,
  analytics, audio uploads, account, payment, backend, or runtime AI calls.
  Rate-limit and Entra checks are not applicable to this static unsigned PWA.
- Desktop and 390×844 mobile had no console/page errors, no horizontal overflow,
  visible 3 px cyan keyboard focus, working skip-to-main keyboard path, and
  reduced-motion recording animation `none`.
- Playwright axe-core 4.11.4 reported no serious or critical findings on live
  `/`, `/demo/`, `/privacy/`, or `/terms/` at desktop and mobile. The standalone
  `@axe-core/cli` could not be used until pointed at the preinstalled Chromium:
  its default Selenium launcher found no system Chrome; the same axe engine did
  run through the pinned Playwright browser.
- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200; an unknown route returns
  a real 404. Titles, canonicals, one h1, `lang=en`, `main`, alt text, privacy,
  and terms all checked out. Hashed assets are one-year immutable; `sw.js` is
  no-cache/no-store; the manifest has its correct MIME type.

## Deployment identity

The live build is the tested candidate, not a deployment-only failure:

| Artifact | Local and live SHA-256 |
| --- | --- |
| `assets/app-C2zGi0G9.js` | `37ecb5946bca889fec2b343f1aaf45a5f59b031aca25901660e37ef905629cc4` |
| `assets/app-Db8tpTjx.css` | `90ec791fb95f361e03bd247d566ca698dedd43d68202a43d465503d624e326e1` |
| `sw.js` | `b5e4cd8d240c002e53999477aba593cc580cd49ddc0003c9f19cc2214bc2abc8` |

## Defects

### P1 — full suite and declared storage claim are flaky

`@claim:separate-storage` fails in a clean normal `npm test` run because it
reads IndexedDB before asynchronous demo seeding completes. The same product
may pass the isolated command, so this is nondeterministic rather than a
one-off machine error. It violates the requirement that all tests pass and
makes the storage-separation claim untrustworthy as an automated release gate.

### P2 — clickjacking protection is absent

Live response CSP is otherwise strict, but it has no `frame-ancestors`
directive and there is no `X-Frame-Options` header. The site-structure contract
requires `frame-ancestors` as a response header. Add an appropriate policy (for
example `frame-ancestors 'self'`) and regression-check the delivered header.

## Required retest

Make demo seeding deterministic before the UI/claim test can observe the demo
state, then run every exact claims command and repeated clean `npm test` runs
until stable. Add the response-header fix and rerun the live header, PWA,
privacy, mobile, keyboard, axe, and bundle checks.
