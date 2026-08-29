import './style.css';

type Take = { id: string; name: string; blob: Blob; waveform: number[]; loudness: number; noise: number; duration: number; created: number; preferred?: boolean };
type Route = '/' | '/demo' | '/privacy' | '/terms' | '/404';
type PageMeta = { title: string; description: string; canonical: string };
const app = document.querySelector<HTMLDivElement>('#app')!;
const STORE = 'voice-comfort-meter';
const demo = () => location.pathname.replace(/\/$/, '') === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
let takes: Take[] = [];
let stream: MediaStream | null = null;
let recorder: MediaRecorder | null = null;
let analyser: AnalyserNode | null = null;
let audioCtx: AudioContext | null = null;
let recordingTimer = 0;
const savedScroll = new Map<string, number>();
let refreshingForUpdate = false;
let demoSeededInMemory = false;
let demoLoadError = '';
const DEMO_AUDIO = [
  { id: 'sample-1', name: 'Desk distance', path: '/demo/desk-distance.wav', waveform: [.12,.25,.48,.35,.65,.42,.25,.7,.42,.58,.22,.44,.72,.31,.56,.2,.35,.63,.3,.48], loudness: .42, noise: .31, duration: 3 },
  { id: 'sample-2', name: 'One hand closer', path: '/demo/one-hand-closer.wav', waveform: [.13,.4,.55,.62,.78,.46,.4,.8,.6,.73,.34,.54,.81,.44,.67,.32,.52,.76,.42,.66], loudness: .72, noise: .18, duration: 3 }
] as const;

function db() { return new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open(STORE, 1); r.onupgradeneeded = () => r.result.createObjectStore('takes'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }
const key = () => demo() ? 'demo:takes' : 'real:takes';
async function load() { const d = await db(); takes = await new Promise<Take[]>((resolve, reject) => { const r = d.transaction('takes').objectStore('takes').get(key()); r.onsuccess = () => resolve(r.result || []); r.onerror = () => reject(r.error); }); d.close(); }
async function save() { const d = await db(); await new Promise<void>((resolve, reject) => { const r = d.transaction('takes', 'readwrite').objectStore('takes').put(takes, key()); r.onsuccess = () => resolve(); r.onerror = () => reject(r.error); }); d.close(); }
async function removeStored(storageKey: string) { const d = await db(); await new Promise<void>((resolve, reject) => { const r = d.transaction('takes', 'readwrite').objectStore('takes').delete(storageKey); r.onsuccess = () => resolve(); r.onerror = () => reject(r.error); }); d.close(); }
async function clear() { takes = []; await save(); render(); }
function esc(s: string) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!)); }
function route(): Route { if (demo()) return '/demo'; const p = location.pathname.replace(/\/$/, '') || '/'; return (['/','/demo','/privacy','/terms','/404'] as string[]).includes(p) ? p as Route : '/404'; }
function meta(route: Route): PageMeta {
  const domain = 'https://voice-comfort-meter.sociobot.in';
  const pages: Record<Route, PageMeta> = {
    '/': { title: 'Voice Comfort Meter — Compare private voice takes', description: 'Compare two voice takes privately and see simple recording guidance.', canonical: `${domain}/` },
    '/demo': { title: 'Demo — Voice Comfort Meter', description: 'Try two local sample voice takes without saving anything to your recordings.', canonical: `${domain}/demo/` },
    '/privacy': { title: 'Privacy — Voice Comfort Meter', description: 'Learn how Voice Comfort Meter keeps your recordings in your browser.', canonical: `${domain}/privacy/` },
    '/terms': { title: 'Terms — Voice Comfort Meter', description: 'Read the limits and terms for Voice Comfort Meter recording guidance.', canonical: `${domain}/terms/` },
    '/404': { title: 'Page not found — Voice Comfort Meter', description: 'The requested Voice Comfort Meter page was not found.', canonical: `${domain}/404/` }
  };
  return pages[route];
}
function navigate(path: string) { const target = new URL(path, location.href); savedScroll.set(location.pathname, scrollY); if(target.pathname.replace(/\/$/, '')==='/demo'){demoSeededInMemory=false;demoLoadError='';} history.pushState({}, '', `${target.pathname}${target.search}${target.hash}`); render(true, target.hash); }
function layout(content: string) { return `<a class="skip" href="#main">Skip to content</a><header><a class="wordmark" href="/" data-link><span>◉</span> Voice Comfort Meter</a><nav aria-label="Main navigation"><a href="/demo/" data-link>Demo</a><a href="/#how" data-link>How it works</a><a href="/privacy/" data-link>Privacy</a></nav></header><div class="route-note" aria-live="polite"></div><main id="main" tabindex="-1">${content}</main><footer><span>Private voice-take comparison.</span><span><a href="/privacy/" data-link>Privacy</a><a href="/terms/" data-link>Terms</a></span><span>Built by Param Factory · v1.0.2</span></footer><aside class="update-toast" id="update-toast" hidden aria-live="polite"><span>An update is ready.</span><button class="text-btn" type="button" data-update>Reload update</button></aside>`; }
function demoBanner() { return demo() ? `<aside class="demo-banner" aria-label="Demo mode"><b>Demo — sample changes are discarded</b><span><button class="text-btn" data-reset-demo>Reset demo</button><button class="text-btn" data-real>Discard demo and record</button></span></aside>` : ''; }
function facts() { return `<ul class="facts"><li><b>Private</b><span>Audio stays on this device.</span></li><li><b>Offline ready</b><span>Use it after the first visit.</span></li><li><b>Free</b><span>No account or payment.</span></li></ul>`; }
function landing() { return layout(`${demoBanner()}<section class="hero"><div class="hero-copy"><h1>Compare two voice takes privately</h1><p class="lede">For podcasters, singers, and speakers choosing between two recording setups.</p><div class="hero-actions"><button class="primary" data-demo>Try it with sample data</button><span>Hear two spoken takes right away.</span></div>${facts()}</div><figure><img src="/art/blueprint-hero.webp" width="1200" height="800" fetchpriority="high" alt="A microphone and headphones drawn on a blue recording blueprint." /><figcaption>Original illustration generated for Voice Comfort Meter.</figcaption></figure></section><section class="workbench landing-bench" aria-labelledby="bench-heading"><div class="section-label">Record and compare takes</div><h2 id="bench-heading">Record a quick comparison</h2>${workbench()}</section><section id="how" class="how" aria-labelledby="how-heading" tabindex="-1"><p class="eyebrow">How it works</p><h2 id="how-heading">Make one small change at a time</h2><ol><li><b>Record a baseline.</b><span>Say the same short line for up to 15 seconds.</span></li><li><b>Change one setup detail.</b><span>Move closer, lower gain, or quiet the room.</span></li><li><b>Compare the marks.</b><span>Keep the take that feels more comfortable.</span></li></ol></section><section class="boundaries" aria-labelledby="limits-heading"><h2 id="limits-heading">What these readings do not say</h2><p>They describe this recording setup. They do not judge your voice or assess hearing or health.</p></section>`); }
function wave(values: number[], label: string) { const shown = values.slice(0, 74); const width = Math.max(1, shown.length) * 5; const bars = shown.map((n, i) => { const height=Math.max(4, Math.round(n*68)); return `<rect x="${i*5}" y="${(72-height)/2}" width="3" height="${height}" rx="1" />`; }).join(''); return `<div class="wave" role="img" aria-label="${esc(label)} waveform"><svg viewBox="0 0 ${width} 72" preserveAspectRatio="none" aria-hidden="true" focusable="false">${bars}</svg></div>`; }
function status(t: Take) { const loud = t.loudness > .68 ? 'strong' : t.loudness < .28 ? 'soft' : 'steady'; const room = t.noise > .25 ? 'noticeable' : 'low'; return `<dl class="metrics"><div><dt>Level</dt><dd>${loud}</dd></div><div><dt>Room noise</dt><dd>${room}</dd></div><div><dt>Length</dt><dd>${t.duration.toFixed(1)}s</dd></div></dl>`; }
function takeCard(t: Take, index: number) { return `<article class="take-card${t.preferred ? ' is-preferred' : ''}"${t.preferred ? ' aria-label="Preferred take" tabindex="-1"' : ''}><div class="take-top"><span class="tag">TAKE ${index + 1}</span>${t.preferred ? '<span class="preferred-mark">Preferred</span>' : ''}<button class="icon-btn" data-delete="${t.id}" aria-label="Delete ${esc(t.name)}">×</button></div><h3>${esc(t.name)}</h3>${wave(t.waveform, `${t.name} sound shape`)}${status(t)}<div class="take-actions"><button data-play="${t.id}">Play take</button><button data-wav="${t.id}">Export WAV</button></div></article>`; }
function recorderPanel() { const next = takes.length < 2 ? takes.length + 1 : 2; return `<section class="record-panel" aria-labelledby="record-heading"><p class="section-label">Record a take</p><h2 id="record-heading">${takes.length ? 'Try a different setup' : 'Start with a short line'}</h2><p class="prompt">Say: “I can hear myself clearly in this room.”</p><label class="check"><input type="checkbox" id="distance" /> I changed my distance or room.</label><button class="record-btn" data-record ${takes.length >= 2 ? 'disabled' : ''}><span></span> Record take ${next} <small>up to 15 seconds</small></button><p class="record-status" aria-live="polite">${takes.length >= 2 ? 'Two takes are ready to compare.' : 'Your microphone is only requested when you record.'}</p>${takes.length ? `<button class="text-btn" data-clear>Delete all takes</button>` : ''}</section>`; }
function takesPanel(label='Your takes') { return `<section class="takes" aria-label="${label}">${takes.length ? takes.map(takeCard).join('') : `<div class="empty"><b>Your takes will appear here.</b><span>Record a first take, then make one small change.</span></div>`}</section>`; }
function workbench() { return `<div class="bench-grid">${recorderPanel()}${takesPanel()}</div>${takes.length === 2 ? comparison() : ''}`; }
function demoWorkbench() { return `<div class="demo-results">${takesPanel('Sample takes')}${takes.length === 2 ? comparison() : ''}</div>${recorderPanel()}`; }
function comparison() { const [a,b] = takes; const quietest = a.noise <= b.noise ? a : b; const closer = b.loudness > a.loudness + .1 ? 'Take 2 has a stronger level.' : a.loudness > b.loudness + .1 ? 'Take 1 has a stronger level.' : 'Both takes have a similar level.'; const quieter = b.noise < a.noise ? 'Take 2 has less room noise.' : b.noise > a.noise ? 'Take 1 has less room noise.' : 'Both takes have similar room noise.'; const kept = quietest.preferred; return `<section class="comparison" aria-labelledby="compare-heading"><p class="section-label">Comparison note</p><h2 id="compare-heading">Look for the setup you prefer</h2><p>${closer} ${quieter} Pick the one that feels easiest to hear.</p><button class="primary" data-keep="${quietest.id}"${kept ? ' disabled' : ''}>${kept ? 'Quieter take kept' : 'Keep the quieter take'}</button></section>`; }
function appPage() { return layout(`${demoBanner()}<section class="app-intro"><p class="eyebrow">Local recorder</p><h1>Record two short voice takes</h1><p>Compare simple level and room-noise marks before you keep one.</p>${demoLoadError ? `<p class="load-error" role="alert">${esc(demoLoadError)}</p>` : ''}</section><section class="workbench demo-workbench">${demoWorkbench()}</section><section class="guidance"><h2>Three setup prompts</h2><ul><li>Keep your mouth about a hand’s width from the microphone.</li><li>Record the same line for each take.</li><li>Change one thing before the second take.</li></ul></section>`); }
function infoPage(kind: 'privacy' | 'terms') { const privacy = kind === 'privacy'; const body = privacy ? `<h1>Your voice stays on your device</h1><p>Voice Comfort Meter stores recordings in this browser only. It does not upload audio or use analytics.</p><h2>What is stored</h2><p>Your recording files and the simple marks shown beside them stay in this browser. Delete a take or clear browser site data to remove them.</p><h2>Permissions</h2><p>The app asks for microphone permission only after you press Record. You can change that permission in your browser.</p>` : `<h1>Use this recording guide responsibly</h1><p>Voice Comfort Meter gives simple recording guidance. It does not assess voice quality, hearing, or health.</p><h2>Your recordings</h2><p>Your recordings stay in this browser until you delete them.</p><h2>No warranty</h2><p>This free tool is provided as-is. Check your equipment and recording environment before important work.</p>`; return layout(`<article class="legal">${body}</article>`); }
function notFound() { return layout(`<section class="not-found"><p class="eyebrow">404 error</p><h1>Page not found</h1><p>The page you requested is not available.</p><a class="primary link-button" href="/" data-link>Go to the recorder</a></section>`); }
async function render(focusHeading=false, hash='', restoreScroll?:number) {
  // A direct /demo visit has no browser event that means IndexedDB seeding is
  // finished. Publish a real readiness boundary only after the sample write
  // and the matching render have both completed; this is also useful to any
  // embedding smoke test without exposing storage implementation details.
  const renderingDemo = demo();
  if (renderingDemo) {
    app.dataset.demoReady = 'loading';
    app.setAttribute('aria-busy', 'true');
  } else {
    delete app.dataset.demoReady;
    app.removeAttribute('aria-busy');
  }
  const inMemory=takes;
  try { await load(); if(demo() && demoSeededInMemory && takes.length===0 && inMemory.length)takes=inMemory; } catch { if(!demoSeededInMemory)takes=[]; }
  if (demo() && takes.length === 0 && !demoSeededInMemory && !demoLoadError) { await seedDemo(focusHeading, hash, restoreScroll); return; }
  const r = route();
  const pageMeta = meta(r);
  document.title = pageMeta.title;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', pageMeta.canonical);
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', pageMeta.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', pageMeta.title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', pageMeta.description);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', pageMeta.title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', pageMeta.description);
  app.innerHTML = r === '/' ? landing() : r === '/demo' ? appPage() : r === '/privacy' || r === '/terms' ? infoPage(r.slice(1) as 'privacy'|'terms') : notFound();
  if (renderingDemo && demo()) {
    app.dataset.demoReady = 'true';
    app.removeAttribute('aria-busy');
  }
  const heading=document.querySelector<HTMLElement>('h1')!;
  heading.tabIndex=-1;
  document.querySelector('.route-note')!.textContent = heading.textContent || '';
  wire();
  requestAnimationFrame(() => { if(focusHeading)heading.focus({preventScroll:true}); if(hash){document.querySelector<HTMLElement>(hash)?.scrollIntoView();}else if(restoreScroll!==undefined){scrollTo(0,restoreScroll);}else if(focusHeading){scrollTo(0,0);} });
}
function makeWav(data: Float32Array, rate: number) { const b=new ArrayBuffer(44+data.length*2), v=new DataView(b); const text=(o:number,s:string)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0))); text(0,'RIFF');v.setUint32(4,36+data.length*2,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,data.length*2,true);data.forEach((x,i)=>v.setInt16(44+i*2,Math.max(-1,Math.min(1,x))*0x7fff,true));return new Blob([b],{type:'audio/wav'}); }
async function seedDemo(focusHeading=false, hash='', restoreScroll?:number) {
  // Keep the sample in memory until its transaction has settled. This makes the
  // demo useful even if the browser temporarily rejects an IndexedDB write, and
  // prevents an empty shell while a persisted sample is being restored offline.
  demoSeededInMemory = true;
  demoLoadError = '';
  try {
    takes = await Promise.all(DEMO_AUDIO.map(async sample => {
      const response = await fetch(sample.path, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Could not load ${sample.path}`);
      return { ...sample, waveform: [...sample.waveform], blob: await response.blob(), created: Date.now() };
    }));
  } catch {
    demoSeededInMemory = false;
    demoLoadError = 'The sample audio could not load. Reload while online, then try the demo again.';
    takes = [];
    await render(focusHeading, hash, restoreScroll);
    return;
  }
  try {
    await save();
  } catch {
    // The next successful visit will retry saving; do not hide the shipped
    // sample data because storage is temporarily unavailable.
  }
  await render(focusHeading, hash, restoreScroll);
}
async function startRecord(button: HTMLButtonElement) { if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { statusText('Recording is not supported here. Try a current browser with microphone access.'); return; } try { stream=await navigator.mediaDevices.getUserMedia({audio:true}); audioCtx=new AudioContext(); const source=audioCtx.createMediaStreamSource(stream); analyser=audioCtx.createAnalyser(); analyser.fftSize=512; source.connect(analyser); const chunks:Blob[]=[]; recorder=new MediaRecorder(stream); const samples:number[]=[]; const startedAt=performance.now(); let stoppedAtLimit=false; const tick=()=>{if(!recorder || recorder.state!=='recording'||!analyser)return;const d=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(d);let sum=0;d.forEach(x=>sum+=(x-128)**2);samples.push(Math.min(1,Math.sqrt(sum/d.length)/40));requestAnimationFrame(tick);}; const stopAtLimit=()=>{const remaining=15000-(performance.now()-startedAt);if(remaining>0){recordingTimer=window.setTimeout(stopAtLimit,remaining);return;}stoppedAtLimit=true;if(recorder?.state==='recording')recorder.stop();}; recorder.ondataavailable=e=>chunks.push(e.data); recorder.onstop=async()=>{ const elapsed=(performance.now()-startedAt)/1000; const duration=stoppedAtLimit?15:Math.min(15,Math.max(.1,elapsed)); const mean=samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length); const noise=samples.slice(0,Math.min(20,samples.length)).reduce((a,b)=>a+b,0)/Math.max(1,Math.min(20,samples.length)); takes.push({id:crypto.randomUUID(),name:`Take ${takes.length+1}`,blob:new Blob(chunks,{type:recorder?.mimeType||'audio/webm'}),waveform:(samples.length?samples:[.1,.2,.3]).filter((_,i)=>i%Math.max(1,Math.floor(samples.length/62))===0),loudness:mean,noise,duration,created:Date.now()}); stream?.getTracks().forEach(t=>t.stop());audioCtx?.close();stream=null;recorder=null;clearTimeout(recordingTimer);await save();render();}; recorder.start(); button.classList.add('is-recording');button.innerHTML='<span></span> Stop recording <small>15 seconds maximum</small>';button.onclick=()=>{if(recorder?.state==='recording')recorder.stop();}; statusText('Recording now. Press Stop when you finish.'); requestAnimationFrame(tick); recordingTimer=window.setTimeout(stopAtLimit,15000); } catch(e) { const denied=(e as DOMException).name==='NotAllowedError'; statusText(denied?'Microphone access was blocked. Allow it in your browser, then press Record again.':'The microphone could not start. Check that another app is not using it, then try again.'); } }
function statusText(msg:string){const s=document.querySelector<HTMLElement>('.record-status');if(s)s.textContent=msg;}
function download(blob:Blob,name:string){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),200);}
async function takeAudio(t:Take){return t.blob;}
async function toWav(blob:Blob){if(blob.type==='audio/wav')return blob;const ac=new AudioContext();try{const buf=await ac.decodeAudioData(await blob.arrayBuffer());const mono=new Float32Array(buf.length);for(let c=0;c<buf.numberOfChannels;c++){const d=buf.getChannelData(c);d.forEach((v,i)=>mono[i]+=v/buf.numberOfChannels);}return makeWav(mono,buf.sampleRate);}finally{ac.close();}}
async function leaveDemo(){await removeStored('demo:takes');demoSeededInMemory=false;takes=[];navigate('/');}
function wire() { document.querySelector<HTMLAnchorElement>('.skip')?.addEventListener('click',e=>{e.preventDefault();document.querySelector<HTMLElement>('#main')?.focus();}); document.querySelectorAll<HTMLAnchorElement>('[data-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigate(a.getAttribute('href')!);})); document.querySelector('[data-demo]')?.addEventListener('click',()=>navigate('/demo/')); document.querySelector('[data-real]')?.addEventListener('click',leaveDemo); document.querySelector('[data-reset-demo]')?.addEventListener('click',()=>seedDemo()); document.querySelector<HTMLButtonElement>('[data-record]')?.addEventListener('click',e=>startRecord(e.currentTarget as HTMLButtonElement)); document.querySelector('[data-clear]')?.addEventListener('click',()=>{if(confirm('Delete both takes from this browser?'))clear();}); document.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach(b=>b.addEventListener('click',async()=>{const t=takes.find(item=>item.id===b.dataset.delete);if(!t||!confirm(`Delete ${t.name} from this browser?`))return;takes=takes.filter(item=>item.id!==t.id);await save();render();}));document.querySelectorAll<HTMLButtonElement>('[data-play]').forEach(b=>b.addEventListener('click',async()=>{const t=takes.find(x=>x.id===b.dataset.play);if(t){const a=new Audio(URL.createObjectURL(await takeAudio(t)));await a.play();}}));document.querySelectorAll<HTMLButtonElement>('[data-wav]').forEach(b=>b.addEventListener('click',async()=>{const t=takes.find(x=>x.id===b.dataset.wav);if(t){b.disabled=true;b.textContent='Preparing WAV…';try{download(await toWav(await takeAudio(t)),`${t.name.toLowerCase().replaceAll(' ','-')}.wav`);}catch{statusText('This take could not be converted. Try recording it again.');}finally{b.disabled=false;b.textContent='Export WAV';}}}));document.querySelector<HTMLButtonElement>('[data-keep]')?.addEventListener('click',async e=>{const id=(e.currentTarget as HTMLButtonElement).dataset.keep;takes=takes.map(t=>({...t,preferred:t.id===id}));await save();await render();document.querySelector<HTMLElement>('.is-preferred')?.focus();}); document.querySelector<HTMLButtonElement>('[data-update]')?.addEventListener('click',()=>navigator.serviceWorker.getRegistration().then(registration=>{refreshingForUpdate=true;registration?.waiting?.postMessage('skip-waiting');})); }
window.addEventListener('popstate',()=>render(true,location.hash,savedScroll.get(location.pathname))); window.addEventListener('online',()=>statusText('You are back online.')); window.addEventListener('offline',()=>statusText('Offline: your saved takes are still here.'));
function showUpdate(registration: ServiceWorkerRegistration) { const waiting=registration.waiting; const toast=document.querySelector<HTMLElement>('#update-toast'); if (!waiting || !toast) return; toast.hidden=false; }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').then(registration=>{ showUpdate(registration); registration.addEventListener('updatefound',()=>{ const worker=registration.installing; worker?.addEventListener('statechange',()=>{if(worker.state==='installed' && navigator.serviceWorker.controller)window.setTimeout(()=>showUpdate(registration));});}); navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshingForUpdate)location.reload();}); }).catch(()=>{});
render();
