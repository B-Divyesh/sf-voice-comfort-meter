# Adversarial first-read review 2 — FAIL

**Product:** Voice Comfort Meter

**Live URL:** https://voice-comfort-meter.sociobot.in

**Reviewed:** 2026-08-29 UTC

**Candidate reviewed:** `def5279c6e833ab1763d87ddca79c01d6c5639bc`

## Verdict

**FAIL.** The landing page is clear, the sandbox is isolated, and every declared claim command passes. The mobile demo still fails the required one-click proof: after the sample action, neither sample take is in the first 390×844 viewport. The sample comparison also says one take has less room noise while both visible room-noise marks say “low.” Two copy defects remain. There are four findings: two blocking and two minor.

## Cold first read

Fresh Chromium contexts opened the production home page at 390×844 and 1440×900 with no prior storage. Before scrolling, both screens answered all three questions:

| Question | First-read answer from the visible text |
| --- | --- |
| What does it do? | It compares two voice takes privately. |
| For whom? | “For podcasters, singers, and speakers choosing between two recording setups.” |
| What should I click first? | **Try it with sample data**, followed by “Hear two spoken takes right away.” |

The 390px page had no horizontal overflow and no console or page errors. This gate passes.

## Findings

### F-2-1 — BLOCKING — The one-click mobile demo hides all sample results below the first screen

**Exact location / quote:** After pressing **Try it with sample data** at 390×844, the first demo screen shows “Record two short voice takes,” “Try a different setup,” a disabled **Record take 2** control, and “Two takes are ready to compare.” Neither **Desk distance** nor **One hand closer** is visible.

**Evidence:** The first sample card begins at `y=954.47px` in an `844px` viewport; both sample cards have zero intersection with the first viewport. At 1440×900, both cards are visible. The current `@claim:demo-comparison` test checks that two cards exist in the DOM but never checks that a result is in the mobile viewport.

**Why this loses a first-time visitor:** The required first screen after the one-click action does not show the product being used with sample data. It instead foregrounds an unavailable recording action. A phone visitor has to infer that useful output exists and scroll to find it.

**Concrete fix:** On the demo route at 390px, place the two sample cards and their comparison before the recorder panel, or compact the banner and introduction so at least one complete sample result is visible without scrolling. Do not lead with a disabled recording control. Extend `@claim:demo-comparison` to use a 390×844 viewport and assert that a sample card plus a Level or Room noise result is in the viewport immediately after the landing-page click.

### F-2-2 — BLOCKING — The demo’s visible room-noise marks do not support its conclusion

**Exact location / quote:** **Desk distance** says “Room noise — low.” **One hand closer** also says “Room noise — low.” The comparison below them says “Take 2 has less room noise.”

**Why this is misleading:** A visitor cannot derive the comparison from the marks the product shows. The conclusion depends on hidden numeric values (`0.31` and `0.18` in source) while the visible values collapse both to the same label. This weakens the core demo and makes the room-noise guidance look arbitrary.

**Concrete fix:** Make the displayed marks explain the conclusion. For example, use sample data that truthfully produces “noticeable” versus “low,” display a small ordered scale/value, or say “Both are low; Take 2 measured lower” and expose the difference. Update `@claim:comparison-marks` to assert the exact visible values and that the comparison sentence follows from them, rather than only checking that two labels and a conclusion exist.

### F-2-3 — Minor — “Start for real” does not name the result of the action

**Exact location / quote:** Demo banner button and README: **Start for real**.

**Why this is unclear:** “Real” does not say whether the action keeps the samples, opens the microphone, returns home, or deletes demo changes. The actual action discards the demo namespace and returns to the real recorder.

**Concrete fix:** Rename the button and README reference to **Discard demo and record**. Keep the banner’s discard warning.

### F-2-4 — Minor — The README explains the sandbox with storage jargon

**Exact location / quote:** README: “Two bundled spoken WAV clips of the same line are isolated in the `demo:takes` IndexedDB key.” and “The real recorder uses a separate `real:takes` key.”

**Why this is unclear:** A person trying the product must translate implementation terms before learning the useful guarantee: samples cannot replace their recordings. The key names belong in `.factory/demo.md`, not the first-use README explanation.

**Concrete fix:** Replace both sentences with: “The demo keeps its two bundled spoken clips separate from your recordings. Leaving the demo deletes demo changes but keeps your recordings.”

## Copy audit

Counts use whitespace-delimited words; hyphenated terms count as one word and punctuation-only marks do not. Repeated header/footer text is listed once with its repeated location. No copy unit exceeds 22 words and no banned marketing adjective appears.

### Landing page

| Location / exact copy | Words | Flag |
| --- | ---: | --- |
| Skip link — “Skip to content” | 3 | — |
| Wordmark — “Voice Comfort Meter” | 3 | — |
| Navigation — “Demo” | 1 | — |
| Navigation and section label — “How it works” | 3 | — |
| Navigation and footer — “Privacy” | 1 | — |
| h1 — “Compare two voice takes privately” | 5 | — |
| Audience — “For podcasters, singers, and speakers choosing between two recording setups.” | 10 | — |
| Primary action — “Try it with sample data” | 5 | — |
| Action result — “Hear two spoken takes right away.” | 6 | — |
| Fact heading — “Private” | 1 | — |
| Fact — “Audio stays on this device.” | 5 | — |
| Fact heading — “Offline ready” | 2 | — |
| Fact — “Use it after the first visit.” | 6 | — |
| Fact heading — “Free” | 1 | — |
| Fact — “No account or payment.” | 4 | — |
| Hero alt — “A microphone and headphones drawn on a blue recording blueprint.” | 10 | — |
| Hero caption — “Original illustration generated for Voice Comfort Meter.” | 7 | — |
| Section label — “Record and compare takes” | 4 | — |
| h2 — “Record a quick comparison” | 4 | — |
| Panel label — “Record a take” | 3 | — |
| h2 — “Start with a short line” | 5 | — |
| Prompt — “Say: ‘I can hear myself clearly in this room.’” | 9 | — |
| Checkbox — “I changed my distance or room.” | 6 | — |
| Record action — “Record take 1 up to 15 seconds” | 7 | — |
| Status — “Your microphone is only requested when you record.” | 8 | — |
| Empty state — “Your takes will appear here.” | 5 | — |
| Empty-state instruction — “Record a first take, then make one small change.” | 9 | — |
| h2 — “Make one small change at a time” | 7 | — |
| Step — “Record a baseline.” | 3 | — |
| Step detail — “Say the same short line for up to 15 seconds.” | 10 | — |
| Step — “Change one setup detail.” | 4 | — |
| Step detail — “Move closer, lower gain, or quiet the room.” | 8 | — |
| Step — “Compare the marks.” | 3 | — |
| Step detail — “Keep the take that feels more comfortable.” | 7 | — |
| h2 — “What these readings do not say” | 6 | — |
| Boundary — “They describe this recording setup.” | 5 | — |
| Boundary — “They do not judge your voice or assess hearing or health.” | 11 | — |
| Footer — “Private voice-take comparison.” | 3 | — |
| Footer — “Terms” | 1 | — |
| Footer — “Built by Param Factory · v1.0.2” | 5 | — |

### README

| Location / exact copy | Words | Flag |
| --- | ---: | --- |
| h1 — “Voice Comfort Meter” | 3 | — |
| “Compare two private voice takes and see simple recording guidance.” | 10 | — |
| “For podcasters, singers, and speakers choosing between two recording setups.” | 10 | — |
| “No audio is uploaded.” | 4 | — |
| “Recordings stay in this browser until you delete them.” | 9 | — |
| “This is recording guidance, not a voice-quality, hearing, or health assessment.” | 11 | — |
| h2 — “Try the sample” | 3 | — |
| “Open `/demo` or run the app and choose Try it with sample data.” | 13 | — |
| “Two bundled spoken WAV clips of the same line are isolated in the `demo:takes` IndexedDB key.” | 16 | F-2-4: jargon |
| “Start for real discards that demo state.” | 7 | F-2-3: vague action; F-2-4: implementation framing |
| “The real recorder uses a separate `real:takes` key.” | 8 | F-2-4: jargon |
| h2 — “Run locally” | 2 | — |
| `npm install` | 2 | — |
| `npm run dev` | 3 | — |
| h2 — “Test and build” | 3 | — |
| `npm test` | 2 | — |
| `npm run typecheck` | 3 | — |
| `npm run lint` | 3 | — |
| `npm run build # creates ./dist with index.html at its root` | 10 | — |
| “Deploy `dist/` as a static site.” | 6 | — |
| “The included service worker enables the cached app shell offline after the first visit.” | 14 | — |
| h2 — “Privacy and terms” | 3 | — |
| “See `/privacy` and `/terms` in the app.” | 7 | — |
| “This project is released under the MIT license.” | 8 | — |

All other inspected buttons name their result: **Try it with sample data**, **Record take 1**, **Play take**, **Export WAV**, **Keep the quieter take**, **Delete all takes**, **Reset demo**, **Reload update**, and **Go to the recorder**.

## Demo and sandbox checks

| Check | Result |
| --- | --- |
| One click from landing | PASS — the primary action opens `/demo/` directly. |
| Sample content loaded | PASS — two 3-second spoken WAV takes, two cards, waveforms, marks, and comparison guidance load. |
| Sample results on the first mobile screen | **FAIL — F-2-1.** |
| Persistent demo banner | PASS — banner remains visible and says “Demo — sample changes are discarded,” with Reset and exit actions. |
| Reset | PASS — deleting **Desk distance** reduced the count to one; Reset restored both samples. |
| Real-data isolation | PASS — a seeded `real:takes` sentinel was absent in demo, survived demo deletion/reset, and reappeared after leaving demo. Before exit, IndexedDB contained separate `demo:takes` and `real:takes`; after exit only `real:takes` remained. |
| Offline | PASS — after service-worker control, an offline `/demo/` reload returned the two samples. |
| Request privacy | PASS — the observed landing/demo/preference/offline flow made same-origin GET requests only; no third-party request, upload, analytics call, or runtime AI call appeared. |

## Claims audit

The repository was cloned to a new `/tmp/voice-comfort-review2.*` directory at candidate `def5279`. After `npm ci` and a production build, every exact `test` command in `.factory/claims.json` was run separately. All 13 commands passed:

| Claim ID | Result |
| --- | --- |
| `demo-comparison` | PASS |
| `bundled-spoken-samples` | PASS |
| `comparison-marks` | PASS, but its assertion is insufficient; see F-2-2 |
| `privacy-local` | PASS |
| `wav-export` | PASS |
| `offline-reload` | PASS |
| `no-account-payment` | PASS |
| `microphone-on-record` | PASS |
| `take-limit` | PASS |
| `recordings-until-delete` | PASS |
| `separate-storage` | PASS |
| `preferred-take` | PASS |
| `demo-discard` | PASS |

The subsequent clean full run passed 19/19 tests. `npm run typecheck`, `npm run lint`, and `npm run build` passed; `dist/` was produced. The built application JavaScript is 17.73 KiB raw and 6.80 KiB gzip. No claim-like landing, demo, privacy, terms, or README sentence lacks a corresponding inventory entry after matching equivalent wording. F-2-2 remains because the existing comparison test does not establish that the visible marks support the visible conclusion.

## Historical finding retest

Every earlier review finding was checked in production and source. The polish and prior handoff were read as evidence, not accepted as proof.

| Earlier finding | Current result |
| --- | --- |
| F-1-1 — tones instead of spoken samples | Fixed. Both shipped files have RIFF/WAVE signatures, exceed 2.5 seconds, have different fingerprints, are stored under `demo:takes`, and supply Play/Export. The dedicated claim passed. |
| F-1-2 — inconsistent audience | Fixed. Landing and README use the same podcasters/singers/speakers sentence. |
| F-1-3 — mood labels | Fixed. “Record and compare takes,” “Record a take,” and “Private voice-take comparison” are present in production. |
| F-1-4 — metaphorical 404 | Fixed. A missing URL returns HTTP 404 and renders h1 “Page not found” with **Go to the recorder**. |
| F-1-5 — unlisted level/room-noise claim | Fixed as an inventory omission: `comparison-marks` and its tagged test now exist. The newly observed semantic mismatch is F-2-2. |

Retained repairs listed in `polish-1.md` and the prior handoff were also rechecked: the full suite is stable in this run; CSP waveforms have non-zero height and no console errors; the quieter preference survives reload; leaving demo removes demo state without altering real state; route focus and back navigation work; canonicals are route-specific; all visible 390px controls measure at least 44×44px; the update toast is hidden without a waiting worker; deletion asks for confirmation; the strict CSP includes `frame-ancestors 'self'`; and reduced-motion emulation leaves no active animations.

## Structure, accessibility, and links

- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200. A missing URL returns a designed HTTP 404.
- Each route has its required title pattern, one h1, one main landmark, `lang="en"`, a route-specific description and canonical, OG/Twitter metadata, SVG favicon, Apple touch icon, and the same header/footer.
- All unique links found across the routes resolve. The home, demo, privacy, terms, `#main`, and `#how` targets work.
- Navigating from Privacy to `/#how` focuses the home h1 and reveals the section. Back returns to Privacy and focuses its h1.
- Playwright axe found zero WCAG A/AA violations on all five checked pages at desktop and 390px. The factory URL verifier passed both `/` and `/demo/` with no errors, one h1, a main landmark, named buttons, and complete image alt text.
- The navy drafting-sheet palette, clipped controls, measured waveform treatment, original microphone art, and monospace labels match `.factory/design.md` and do not resemble a generic SaaS template.

## Missed leverage

No missing AI feature is justified. The job is deterministic local audio comparison; adding runtime AI would add cost and network disclosure without improving the brief’s core task. WAV export already exists. Cloud sync would conflict with the stated local-only privacy model, and importing arbitrary old recordings is not required for the guided same-line, one-change comparison workflow.

## What would make this perfect

Make the sample evidence the first thing visible after the mobile demo click, and make every visible mark support the comparison sentence. Then replace **Start for real** with a result-naming action and move IndexedDB key names out of the first-use README explanation. Add the mobile in-viewport assertion and semantic comparison assertion, then repeat every claim command, the full suite, the live request/offline checks, the route crawl, and the historical retest.
