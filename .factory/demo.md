# Demo sandbox

Open `/demo` (or `/?demo=1`) to load two fixed, local spoken sample voice takes. The banner says **Demo — sample changes are discarded**. During the demo, its state uses only the `demo:takes` IndexedDB value so offline reload works. **Reset demo** replaces that value with the original samples. **Discard demo and record** deletes `demo:takes` before leaving the demo route. Real takes use the separate `real:takes` value and are never changed by demo actions.

The demo ships `/demo/desk-distance.wav` and `/demo/one-hand-closer.wav`: two original, offline-generated spoken WAV clips of “I can hear myself clearly in this room.” They are intentionally rendered as a quieter desk-distance fixture and a clearer close fixture. The service worker precaches both files, then demo seeding copies their bytes into `demo:takes`; Play and Export use those stored bytes. No demo action requests microphone access or sends a request outside this site.
