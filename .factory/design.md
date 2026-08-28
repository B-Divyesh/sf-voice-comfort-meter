# Voice Comfort Meter visual thesis

## Direction — blueprint drafting sheet

This is a friendly recording check, not an audio editor. The interface borrows from a well-used studio drafting sheet: navy paper, pale construction lines, warm tape markers, and measured waveform marks. It makes the unfamiliar voice feel inspectable without making the person feel judged.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#071B32` | deep blueprint background |
| `--sheet` | `#0D3153` | raised drafting surface |
| `--paper` | `#F7F1E3` | primary text and paper panels |
| `--cyan` | `#75E6ED` | guides, links, focus rings |
| `--orange` | `#FFB347` | record action and tape markers |
| `--lime` | `#C9EF85` | ready / balanced readings |
| `--rose` | `#FF8C9B` | caution / destructive action |
| `--muted` | `#B7C9D7` | secondary text |

The product is intentionally single-mode. The dark sheet supports a bright recording environment and keeps waveforms clear. Body type uses the local system UI stack for clear, fast reading. Display labels use a monospace stack for measured, drafted character. Spacing is an 8px scale, with 20–28px padded paper panels and 56px controls.

## Interaction and motion

Thin cyan guides provide hierarchy. Controls are squared with clipped corners, like paper tabs. During recording, the waveform grows from the microphone source and the record dot pulses once every 1.4 seconds. Results are revealed by drawing a guide line over 220ms. With reduced motion, all changes are immediate and the record dot is steady.

## Original artwork

The hero uses a generated editorial illustration of a tabletop microphone, headphones, drafting paper, and an abstract waveform grid. It is deliberately text-free; all essential language stays in HTML. Prompt, model and provenance are recorded below after generation. The product also uses hand-authored SVG icons and canvas waveforms.

**Prompt sheet:** blue blueprint drafting sheet, tabletop recording setup, one simple microphone and headphones, pale cyan technical grid, warm orange tape markers, paper texture, editorial illustration, no people, no brand marks, no text, no watermark. Wide composition, dark navy ground, useful negative space.

**Provenance:** Generated with the factory image deployment via `/opt/fleet/lib/gen-image.sh` on 2026-08-28. Original product artwork; no third-party asset license required. Optimised WebP is shipped in `public/art/`.
