# Handoff — adversarial first-read review 1

## Status: FAIL

This reviewer made documentation-only changes: .factory/review-1.md records the full independent review. No product source, dependencies, or deployment configuration was changed.

## What was verified

- Fresh local clone: npm ci, every exact declared claim command, npm test (16/16), npm run typecheck, npm run lint, and npm run build passed.
- Fresh live desktop and 390px contexts clearly state the job, audience, and Try it with sample data action; the one-click sandbox, reset, isolated storage/discard path, heading focus, back navigation, offline reload, live request log, routing, headers, metadata, link crawl, and mobile targets pass.
- Every finding in the four earlier verification reports was rechecked against live behavior and code; the previous defects remain fixed.

## Blocking gap and next steps

The sample cards look plausible but their playable/exported audio is generated single-frequency sine tones, not realistic spoken voice takes. This fails the one-click demo requirement for a voice-comparison product. Ship two original, offline bundled spoken WAV samples in the demo namespace and test that those assets are what Play/Export use. Then address the four minor copy/claim findings listed in review-1.md and rerun this review from a clean clone.

## How to reproduce

    npm ci
    npm test
    npm run typecheck
    npm run lint
    npm run build
    npm run preview

Open /demo/, press Play take, and inspect src/main.ts sampleWav() to confirm the current generated-tone behavior. The review report includes the claim commands and live verification scope.
