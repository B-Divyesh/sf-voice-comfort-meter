# Handoff — Adversarial review 2

## Status: FAIL

Reviewed production and candidate `def5279c6e833ab1763d87ddca79c01d6c5639bc` without modifying product code. The complete report is `.factory/review-2.md`.

## Findings

- BLOCKING: at 390×844, neither sample card is in the first viewport after **Try it with sample data**; the first card starts at about 954px.
- BLOCKING: both sample cards display “Room noise — low,” while the comparison says Take 2 has less room noise.
- Minor: **Start for real** does not name its result.
- Minor: the README explains demo isolation with `IndexedDB` key jargon.

## Verification performed

- Opened the live home page cold at 390×844 and 1440×900.
- Exercised demo entry, sample deletion, Reset, WAV export, preference, Start for real, seeded real-data isolation, service-worker offline reload, and same-origin request logging.
- Crawled live routes and links; checked titles, h1/main/lang, descriptions, canonicals, OG metadata, icons, HTTP status, focus after navigation/back, viewport overflow, 44px targets, reduced motion, waveform rendering, and update-toast state.
- Ran Playwright axe on `/`, `/demo/`, `/privacy/`, `/terms/`, and a missing route at desktop and mobile; zero violations were reported.
- Used `/opt/fleet/lib/verify-url.sh` on live `/` and `/demo/`; both passed.
- From a clean clone: `npm ci`, `npm run build`, all 13 exact claim commands, full `npm test` (19/19), `npm run typecheck`, `npm run lint`, and a final `npm run build` all passed.

## Next steps

Repair F-2-1 through F-2-4 in `.factory/review-2.md`, add the two specified demo assertions, deploy through the factory workflow, and rerun the full adversarial checklist against production.

## Repository state

Only `.factory/review-2.md` and `.factory/handoff.md` were intentionally changed by this review. Pre-existing modifications under `graphify-out/` were left untouched.
