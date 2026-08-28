# Handoff — Voice Comfort Meter

## What shipped

- A local-first, two-take voice recorder with a 15-second limit, playback, local deletion, and WAV export.
- Simple waveform, level, and room-noise comparison language. It explicitly avoids voice-quality, hearing, and health judgments.
- `/demo` provides two realistic sample WAV takes in the isolated `demo:takes` IndexedDB namespace. Real recordings use `real:takes`.
- A hand-written PWA manifest and service worker cache the shell, the original blueprint recording illustration, and sample demo flow for use after the first visit.
- `/privacy`, `/terms`, a styled 404 destination, metadata, sitemap, robots, CSP/security headers, responsive mobile layout, and keyboard focus behavior.

## Run and verify

```sh
npm install
npm test
npm run build
```

`npm test` passed on 2026-08-28: 5/5 Playwright tests. The tests cover the demo comparison, same-origin-only demo traffic, WAV download, cached offline shell, and skip-link keyboard route. `npm run build` passed and creates `dist/index.html`.

Lighthouse (mobile simulation) on 2026-08-28 scored 99 Performance and 100 Accessibility. Browser smoke check at 390px passed: one h1, main landmark, `lang="en"`, expected title, and no console errors. Production JS is 13.99 KB (5.66 KB gzip); CSS is 8.68 KB (2.81 KB gzip); hero WebP is 70 KB. The generated social card is 1200×630 and 62 KB.

## Known gap

The level and room-noise marks are deliberately simple recording cues, not calibrated measurements. The browser chooses the recording codec; the app converts supported recordings to WAV at export time.

## Next step

Deploy `dist/` as the static artifact. No environment variables or external services are needed.
