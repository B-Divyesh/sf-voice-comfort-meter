# Adversarial first-read review 1 — FAIL

**Product:** Voice Comfort Meter  
**Live URL:** https://voice-comfort-meter.sociobot.in  
**Reviewed:** 2026-08-28 UTC  
**Candidate reviewed:** 49c817bf20623a5e6d6622130c4281ac662ca23f

## Verdict

**FAIL.** The site is clear at first read and its technical demo sandbox works, but the one-click demo does not contain realistic voice takes. Its purported samples are synthetic single-frequency tones. A person evaluating a voice-take comparison tool cannot hear the core job demonstrated honestly. This is a blocking demo-sandbox failure. Four smaller copy and claim-inventory findings also remain.

## Cold first read

Fresh, signed-out Chromium contexts were opened at 390×844 and 1440×900 before scrolling. Both showed the headline, audience sentence, action, and three facts with no console errors.

| Question | What a first-time visitor can answer from the first screen |
| --- | --- |
| What does it do? | It compares two voice takes privately and shows level and room-noise cues. |
| For whom? | The hero says “For speakers and singers who want calmer, clearer recording choices.” |
| What should I click first? | **Try it with sample data**; its adjacent instruction says “See two example takes right away.” |

This gate passes. The mobile action is visible at y=487–539, so it is still on the initial 844px screen. The blueprint visual system is distinct and supports the product rather than resembling a generic SaaS template.

## Findings

### F-1-1 — BLOCKING — Demo samples are tones, not realistic voice takes

**Location / quote:** /demo/ immediately shows **Desk distance** and **One hand closer** as the two sample takes. README line 9 calls them “The two sample WAV takes”.

**Evidence:** the shipped implementation creates demo audio in sampleWav() from a single sine frequency (188 Hz or 215 Hz), with amplitude gating. The empty demo blobs are replaced with that generated tone only when Play or Export is pressed. They are not recordings of a person saying the shown prompt.

**Why this fails a first-time visitor:** this product asks someone to compare voice recordings. A steady beep cannot demonstrate whether the displayed level/room-noise guidance is useful for speech, or let a visitor compare two real recording setups. The visible cards are plausible, but the playable sample is not realistic sample data. The demo-sandbox contract requires an opinionated, realistic sample and the first screen after the action must show the product being used.

**Concrete fix:** ship two short, original, offline-precached spoken WAV files of the displayed line, recorded in visibly different setups (for example desk distance and one hand closer). Store them only under demo:takes, retain the existing Reset/Start-for-real boundary, and revise README line 9 to name the actual sample clips. Add a demo regression test that opens both bundled sample audio assets, verifies their duration and WAV signatures, and asserts that Play uses those shipped assets rather than synthesising a tone.

### F-1-2 — Minor — The audience changes between the hero and README

**Location / quote:** hero: “For speakers and singers who want calmer, clearer recording choices.” README line 3: “It is for podcasters, singers, and speakers who want a calmer way to choose a recording setup.”

**Why this is unclear:** a podcaster reading the first screen is not named, then finds out in the README that the product is apparently also for them. The two phrasings also use vague outcome language (“calmer, clearer”).

**Concrete fix:** use this sentence in both places: “For podcasters, singers, and speakers choosing between two recording setups.”

### F-1-3 — Minor — Several landing labels are mood labels, not useful headings

**Location / quote:** “A small recording check”, “Live workbench”, “Your turn”, and the footer “Private feedback for your next take.”

**Why this is unclear:** these labels do not name the content or next task when read out of context. “Workbench” and “Your turn” especially make a visitor infer the purpose instead of stating it.

**Concrete fix:** delete “A small recording check”; change “Live workbench” to “Record and compare takes”; change “Your turn” to “Record a take”; change the footer line to “Private voice-take comparison.”

### F-1-4 — Minor — The designed 404 uses a metaphor as its heading

**Location / quote:** unknown-route page h1: “This sheet is not on the board.”

**Why this is unclear:** it communicates the visual theme but not the error in plain words. A screen-reader heading list should state that the requested page was not found.

**Concrete fix:** change the heading to “Page not found” and retain “Go to the recorder” as the recovery action.

### F-1-5 — Minor — A visible product claim has no dedicated claims entry

**Location / quote:** /demo/ and the product screen say: “Compare simple level and room-noise marks before you keep one.”

**Why this is a claim-inventory gap:** it promises the two specific comparison outputs. demo-comparison only declares “Shows two sample voice takes right away”; it does not establish that both named marks are rendered. The claims contract requires each visitor-reliant claim to have an entry and observable test.

**Concrete fix:** add a comparison-marks claim and a demo-entry Playwright test that asserts both sample cards visibly expose **Level** and **Room noise** and that the comparison guidance is present. Alternatively, remove the sentence and avoid promising those outputs.

## Copy audit

Word counts use words as rendered (commands and paths count as words). No landing or README item exceeds the 22-word cap. Repeated navigation/footer text is listed once with its repeated occurrence noted. Flags refer to the findings above; unflagged text is concrete enough for its location.

### Landing page

| Location / text | Words | Flag |
| --- | ---: | --- |
| Skip to content | 3 | — |
| Voice Comfort Meter | 3 | — |
| Demo | 1 | — |
| How it works (navigation and section label) | 3 | — |
| Privacy (navigation and footer) | 1 | — |
| A small recording check | 4 | F-1-3 |
| Compare two voice takes privately | 5 | — |
| For speakers and singers who want calmer, clearer recording choices. | 10 | F-1-2 |
| Try it with sample data | 5 | — |
| See two example takes right away. | 6 | — |
| Private | 1 | — |
| Audio stays on this device. | 5 | — |
| Offline ready | 2 | — |
| Use it after the first visit. | 6 | — |
| Free | 1 | — |
| No account or payment. | 4 | — |
| Original illustration generated for Voice Comfort Meter. | 7 | — |
| Live workbench | 2 | F-1-3 |
| Record a quick comparison | 4 | — |
| Your turn | 2 | F-1-3 |
| Start with a short line | 5 | — |
| Say: “I can hear myself clearly in this room.” | 9 | — |
| I changed my distance or room. | 6 | — |
| Record take 1 | 3 | — |
| up to 15 seconds | 4 | — |
| Your microphone is only requested when you record. | 8 | — |
| Your takes will appear here. | 5 | — |
| Record a first take, then make one small change. | 9 | — |
| Make one small change at a time | 7 | — |
| Record a baseline. | 3 | — |
| Say the same short line for up to 15 seconds. | 10 | — |
| Change one setup detail. | 4 | — |
| Move closer, lower gain, or quiet the room. | 8 | — |
| Compare the marks. | 3 | — |
| Keep the take that feels more comfortable. | 7 | — |
| What these readings do not say | 6 | — |
| They describe this recording setup. | 5 | — |
| They do not judge your voice or assess hearing or health. | 11 | — |
| Private feedback for your next take. | 6 | F-1-3 |
| Terms | 1 | — |
| Built by Param Factory · v1.0.1 | 7 | — |
| An update is ready. (hidden unless an update waits) | 4 | — |
| Reload update | 2 | — |

### README

| Line / text | Words | Flag |
| --- | ---: | --- |
| Voice Comfort Meter | 3 | — |
| Compare two private voice takes and see simple recording guidance. | 10 | — |
| It is for podcasters, singers, and speakers who want a calmer way to choose a recording setup. | 17 | F-1-2 |
| No audio is uploaded. | 4 | — |
| Recordings stay in this browser until you delete them. | 9 | — |
| This is recording guidance, not a voice-quality, hearing, or health assessment. | 11 | — |
| Try the sample | 3 | — |
| Open /demo or run the app and choose Try it with sample data. | 13 | — |
| The two sample WAV takes are isolated in the demo:takes IndexedDB key. | 13 | F-1-1 |
| Start for real discards that demo state. | 7 | — |
| The real recorder uses a separate real:takes key. | 9 | — |
| Run locally | 2 | — |
| npm install | 2 | — |
| npm run dev | 3 | — |
| Test and build | 3 | — |
| npm test | 2 | — |
| npm run typecheck | 3 | — |
| npm run lint | 3 | — |
| npm run build # creates ./dist with index.html at its root | 11 | — |
| Deploy dist/ as a static site. | 6 | — |
| The included service worker enables the cached app shell offline after the first visit. | 14 | — |
| Privacy and terms | 3 | — |
| See /privacy and /terms in the app. | 7 | — |
| This project is released under the MIT license. | 8 | — |

## Demo, privacy, and claims checks

The mechanical demo boundary is otherwise sound:

- The first click opens /demo/ with two cards and comparison guidance already visible. The persistent banner reads “Demo — sample changes are discarded” and provides **Reset demo** and **Start for real**.
- Deleting a sample reduced the card count from 2 to 1; **Reset demo** restored 2; **Start for real** removed the demo key, showed zero real takes, and moved focus to the home h1. Back navigation restored the demo route and its heading focus.
- Offline after a controlled first visit reloaded /demo/ with both cards and no errors.
- The live request log for landing, demo, export, route changes, and the offline flow contained only same-origin GET requests. There were no analytics, uploads, or third-party requests.

.factory/claims.json parses and has 11 entries. Each exact command was invoked from a fresh local clone after npm ci; all passed. The subsequent complete run passed 16/16 Playwright tests.

| Claim ID | Result |
| --- | --- |
| demo-comparison | PASS |
| privacy-local | PASS |
| wav-export | PASS |
| offline-reload | PASS |
| no-account-payment | PASS |
| microphone-on-record | PASS |
| take-limit | PASS |
| recordings-until-delete | PASS |
| separate-storage | PASS |
| preferred-take | PASS |
| demo-discard | PASS |

The remaining unlisted claim is F-1-5. F-1-1 is not disproved by the demo-comparison test because that test checks cards and visible guidance, not that the sample is a realistic spoken recording.

## History retest

No earlier .factory/review-*.md or .factory/polish-*.md files exist. I read all four earlier independent verification reports and the prior handoff. Each previous finding was checked against current live behavior and current code, rather than accepted from a “fixed” label.

| Earlier finding | Current result |
| --- | --- |
| verification.md P1: CSP, real HTTP 404, manifest MIME | Fixed: live / sends CSP with frame-ancestors 'self'; unknown route returns HTTP 404; deployment config supplies the manifest MIME. |
| verification.md P1: incomplete claim inventory | Fixed for the earlier listed privacy, account, microphone, duration, persistence, and namespace claims; 11 entries/tests now exist. F-1-5 is a newly found distinct claim gap. |
| verification.md P2: sub-44px mobile targets | Fixed: all visible a, button, and input targets on live 390px demo measured at least 44px; no horizontal overflow. |
| verification.md P2: PWA update/caching policy | Fixed in code and deployment: hashed assets, cache policy, versioned worker, waiting-worker toast, and skip-waiting path are present. |
| verification-2.md P1: 15-second test instability | Fixed in this run: exact take-limit and the full clean 16-test suite passed. The implementation records 15.0s at the limit. |
| verification-2.md P1: CSP blocked waveforms and caused console errors | Fixed: live demo renders non-zero SVG bars with no demo console/page errors under the shipped strict CSP. |
| verification-2.md P1: preferred take not persisted | Fixed: the current preference regression test passes and the live control marks the quieter take. |
| verification-2.md P1: demo mutations survived exit | Fixed: the live delete/reset/start-for-real exercise above discarded demo:takes; the demo-discard test passes. |
| verification-2.md P2: route links, route focus, and canonical URLs | Fixed: live route titles/canonicals are route-specific; How it works uses /#how; the navigation/focus regression passes. |
| verification-2.md P2: demo performance | No regression observed in this review’s functional checks; current JS is 6.55 KiB gzip. This review did not rerun a Lighthouse score. |
| verification-2.md P2: update toast visibly rendered without an update | Fixed: the full regression test verifies the toast is hidden when no worker is waiting. |
| verification-2.md P2: single-take deletion was irreversible | Fixed: current source asks for a specific browser confirmation before deleting a take; the regression test dismisses it successfully. |
| verification-3.md P1: flaky separate-storage test | Not reproduced: the exact claim and one fresh full suite pass; current code publishes a demo-ready boundary after storage/render completion. |
| verification-3.md P2: missing clickjacking protection | Fixed: current live response CSP includes frame-ancestors 'self' and X-Frame-Options: SAMEORIGIN. |
| verification-4.md: no open defects | Confirmed as far as its listed scope; this review adds the realistic-sample, copy, and inventory findings above. |

## Structure and leverage checks

- /, /demo/, /privacy/, and /terms/ returned 200; an unknown route returned 404. All live internal navigation/footer links resolved successfully.
- Every checked route had a route-specific title, one h1, main, canonical, description, language, favicon, Apple icon, OG image, and Twitter card.
- Header/footer, Privacy, Terms, skip link, 390px layout, keyboard route focus, and back navigation work. The supplied 404 has a recovery action, subject to F-1-4’s wording issue.
- The blueprint grid, drafting palette, custom wave shapes, and original art match the documented visual thesis and are visibly product-specific.
- The brief does not imply an AI step. WAV export already exists; cloud sync would conflict with the explicitly private, offline-first value proposition. No missing AI, import/export, or sync feature is found.

## What would make this perfect

Replace the synthetic demo tones with original spoken sample takes and prove that in a demo test. Then make the audience sentence consistent, remove the four vague/metaphor labels, use “Page not found” on 404, and add the missing comparison-marks claim/test. Re-run the entire clean claim suite, live request log, offline reload, mobile first-read, and link crawl after those changes.

