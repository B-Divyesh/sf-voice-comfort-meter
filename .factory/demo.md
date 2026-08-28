# Demo sandbox

Open `/demo` (or `/?demo=1`) to load two fixed, local sample voice takes. The banner says **Demo — sample changes are discarded**. During the demo, its state uses only the `demo:takes` IndexedDB value so offline reload works. **Reset demo** replaces that value with the original samples. **Start for real** deletes `demo:takes` before leaving the demo route. Real takes use the separate `real:takes` value and are never changed by demo actions.

The sample takes are generated WAV tones in the browser, so they are available after the app shell is cached. No demo action requests microphone access or sends a request outside this site.
