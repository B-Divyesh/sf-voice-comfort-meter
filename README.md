# Voice Comfort Meter

Compare two private voice takes and see simple recording guidance. For podcasters, singers, and speakers choosing between two recording setups.

No audio is uploaded. Recordings stay in this browser until you delete them. This is recording guidance, not a voice-quality, hearing, or health assessment.

## Try the sample

Open `/demo` or run the app and choose **Try it with sample data**. The demo keeps its two bundled spoken clips separate from your recordings. **Discard demo and record** deletes demo changes but keeps your recordings.

## Run locally

```sh
npm install
npm run dev
```

## Test and build

```sh
npm test
npm run typecheck
npm run lint
npm run build # creates ./dist with index.html at its root
```

Deploy `dist/` as a static site. The included service worker enables the cached app shell offline after the first visit.

## Privacy and terms

See `/privacy` and `/terms` in the app. This project is released under the MIT license.
