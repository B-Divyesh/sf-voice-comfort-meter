# Demo sandbox

Open `/demo` (or `/?demo=1`) to load two fixed, local sample voice takes. The banner says **Demo — sample data, nothing is saved**. **Reset demo** replaces only the `demo:takes` IndexedDB value. **Start for real** leaves the demo route; real takes use the separate `real:takes` value.

The sample takes are generated WAV tones in the browser, so they are available after the app shell is cached. No demo action requests microphone access or sends a request outside this site.
