import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const base = 'https://voice-comfort-meter.sociobot.in';
const browser = await chromium.launch({ headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const report = {};

const context = await browser.newContext({ viewport: { width: 1365, height: 768 } });
const page = await context.newPage();
page.setDefaultNavigationTimeout(60000);
const requests = [];
const errors = [];
page.on('request', r => requests.push({ method: r.method(), url: r.url(), type: r.resourceType() }));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('pageerror', e => errors.push(`page: ${e.message}`));
const homeResponse = await page.goto(base, { waitUntil: 'networkidle' });
report.home = {
  status: homeResponse.status(),
  title: await page.title(),
  lang: await page.locator('html').getAttribute('lang'),
  h1: await page.locator('h1').allTextContents(),
  mains: await page.locator('main').count(),
  canonical: await page.locator('link[rel=canonical]').getAttribute('href'),
  viewportMeta: await page.locator('meta[name=viewport]').getAttribute('content'),
};
await page.getByRole('button', { name: 'Try it with sample data' }).click();
await page.waitForURL(/\/demo\/?$/);
await page.locator('.take-card').nth(1).waitFor();
report.demoEntry = {
  cards: await page.locator('.take-card').count(),
  banner: await page.getByText('Demo — sample data, nothing is saved').isVisible(),
  title: await page.title(),
};
report.demoStorageBefore = await page.evaluate(async () => {
  const db = await new Promise((resolve, reject) => { const r = indexedDB.open('voice-comfort-meter'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  const rows = await new Promise((resolve, reject) => { const r = db.transaction('takes').objectStore('takes').getAllKeys(); r.onsuccess = () => resolve(r.result.map(String)); r.onerror = () => reject(r.error); });
  db.close(); return rows;
});
await page.getByRole('button', { name: /Delete Desk distance/ }).click();
await page.getByRole('button', { name: 'Start for real' }).click();
await page.waitForURL(base + '/');
await page.getByRole('heading', { name: 'Compare two voice takes privately' }).waitFor();
report.routeFocus = await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id, text: document.activeElement?.textContent?.trim().slice(0, 80) }));
await page.getByRole('link', { name: 'Demo' }).click();
await page.waitForURL(/\/demo$/);
await page.getByRole('heading', { name: 'Record two short voice takes' }).waitFor();
report.demoAfterExitAndReturn = {
  cards: await page.locator('.take-card').count(),
  names: await page.locator('.take-card h3').allTextContents(),
  persistedUserAction: (await page.locator('.take-card').count()) === 1,
};
const howLink = page.getByRole('link', { name: 'How it works' });
await howLink.click();
report.demoHowLink = { url: page.url(), targetCount: await page.locator('#how').count() };
await page.getByRole('button', { name: 'Reset demo' }).click();

await page.emulateMedia({ reducedMotion: 'reduce' });
report.reducedMotion = await page.locator('.record-btn span').evaluate(el => ({ animationName: getComputedStyle(el).animationName, animationDuration: getComputedStyle(el).animationDuration }));
report.axe = {};
for (const path of ['/', '/demo/', '/privacy', '/terms']) {
  await page.goto(base + path);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  report.axe[path] = result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base + '/demo/', { waitUntil: 'networkidle' });
const mobileControls = await page.locator('a,button,input').evaluateAll(els => els.filter(el => {
  const s = getComputedStyle(el), r = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0;
}).map(el => { const r = el.getBoundingClientRect(); return { text: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('type') || '').trim().replace(/\s+/g, ' ').slice(0, 80), width: +r.width.toFixed(1), height: +r.height.toFixed(1) }; }));
report.mobile = {
  width: await page.evaluate(() => ({ inner: innerWidth, scroll: document.documentElement.scrollWidth })),
  bodyFont: await page.locator('body').evaluate(el => getComputedStyle(el).fontSize),
  updateState: await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); const t = document.querySelector('#update-toast'); const box = t.getBoundingClientRect(); return { hiddenAttribute: t.hidden, rendered: getComputedStyle(t).display !== 'none' && box.width > 0 && box.height > 0, waiting: Boolean(r?.waiting), active: r?.active?.state, controlled: Boolean(navigator.serviceWorker.controller) }; }),
  controlsBelow44: mobileControls.filter(c => c.width < 44 || c.height < 44),
  controls: mobileControls,
};
await page.screenshot({ path: '.factory/qa-artifacts/live-demo-mobile.png', fullPage: true });
await page.waitForTimeout(1500);
report.mobile.updateStateAfterDelay = await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); const t = document.querySelector('#update-toast'); const box = t.getBoundingClientRect(); return { hiddenAttribute: t.hidden, rendered: getComputedStyle(t).display !== 'none' && box.width > 0 && box.height > 0, waiting: Boolean(r?.waiting), active: r?.active?.state, controlled: Boolean(navigator.serviceWorker.controller) }; });

const keyboardPage = await context.newPage();
await keyboardPage.goto(base + '/');
const keyboard = [];
for (let i = 0; i < 14; i++) {
  await keyboardPage.keyboard.press('Tab');
  keyboard.push(await keyboardPage.evaluate(() => { const el = document.activeElement; const s = el ? getComputedStyle(el) : null; return { tag: el?.tagName, text: (el?.getAttribute('aria-label') || el?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70), outline: s ? `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}` : '' }; }));
}
report.keyboard = keyboard;

const invalidContext = await browser.newContext();
const invalidPage = await invalidContext.newPage();
await invalidPage.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError')); });
await invalidPage.goto(base + '/');
await invalidPage.getByRole('button', { name: /Record take 1/ }).click();
report.permissionRecovery = await invalidPage.locator('.record-status').textContent();
await invalidContext.close();

const recordContext = await browser.newContext({ acceptDownloads: true });
await recordContext.grantPermissions(['microphone'], { origin: base });
const recordPage = await recordContext.newPage();
const recordErrors = [];
const recordRequests = [];
recordPage.on('console', m => { if (m.type() === 'error') recordErrors.push(`console: ${m.text()}`); });
recordPage.on('pageerror', e => recordErrors.push(`page: ${e.message}`));
recordPage.on('request', r => recordRequests.push({ method: r.method(), url: r.url() }));
await recordPage.goto(base + '/');
for (let i = 1; i <= 2; i++) {
  await recordPage.getByRole('button', { name: new RegExp(`Record take ${i}`) }).click();
  await recordPage.waitForTimeout(650);
  await recordPage.getByRole('button', { name: /Stop recording/ }).click();
  await recordPage.locator('.take-card').nth(i - 1).waitFor();
}
const downloadPromise = recordPage.waitForEvent('download');
await recordPage.getByRole('button', { name: 'Export WAV' }).first().click();
const dl = await downloadPromise;
const dlPath = await dl.path();
const wav = await readFile(dlPath);
report.realFlow = {
  cards: await recordPage.locator('.take-card').count(),
  comparison: await recordPage.getByRole('heading', { name: 'Look for the setup you prefer' }).isVisible(),
  recordDisabled: await recordPage.locator('[data-record]').isDisabled(),
  download: { name: dl.suggestedFilename(), size: wav.length, riff: wav.subarray(0, 4).toString(), wave: wav.subarray(8, 12).toString() },
};
await recordPage.getByRole('button', { name: 'Keep the quieter take' }).click();
report.keepFeedback = await recordPage.locator('.record-status').textContent();
recordPage.once('dialog', d => d.dismiss());
await recordPage.getByRole('button', { name: 'Delete all takes' }).click();
report.cancelDeleteCards = await recordPage.locator('.take-card').count();
recordPage.once('dialog', d => d.accept());
await recordPage.getByRole('button', { name: 'Delete all takes' }).click();
await recordPage.locator('.take-card').first().waitFor({ state: 'detached' });
report.afterDeleteCards = await recordPage.locator('.take-card').count();
report.privacyFlow = {
  crossOrigin: recordRequests.filter(r => new URL(r.url).origin !== base),
  nonReadMethods: recordRequests.filter(r => !['GET', 'HEAD'].includes(r.method)),
};
report.recordErrors = recordErrors;
await recordContext.close();

const offlineContext = await browser.newContext();
const offlinePage = await offlineContext.newPage();
const offlineErrors = [];
offlinePage.on('pageerror', e => offlineErrors.push(e.message));
offlinePage.on('console', m => { if (m.type() === 'error') offlineErrors.push(m.text()); });
await offlinePage.goto(base + '/demo/');
await offlinePage.waitForFunction(() => navigator.serviceWorker.controller !== null);
await offlinePage.reload();
await offlineContext.setOffline(true);
const offlineResponse = await offlinePage.reload({ waitUntil: 'domcontentloaded' });
report.offline = {
  responseStatus: offlineResponse?.status() ?? null,
  cards: await offlinePage.locator('.take-card').count(),
  title: await offlinePage.title(),
  errors: offlineErrors,
  cacheKeys: await offlinePage.evaluate(() => caches.keys()),
};
await offlineContext.close();

report.requests = { total: requests.length, crossOrigin: requests.filter(r => new URL(r.url).origin !== base), nonReadMethods: requests.filter(r => !['GET', 'HEAD'].includes(r.method)) };
report.errors = errors;
await context.close();
await browser.close();
console.log(JSON.stringify(report, null, 2));
