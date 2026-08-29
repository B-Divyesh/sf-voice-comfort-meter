import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://voice-comfort-meter.sociobot.in';
const artifact = '.factory/qa-artifacts/polish-2/live-check.json';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const consoleErrors = [];
const requests = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => consoleErrors.push(String(error)));
page.on('request', request => requests.push({ url: request.url(), method: request.method() }));

await page.goto(`${base}/`, { waitUntil: 'networkidle' });
const home = {
  title: await page.title(),
  headline: await page.getByRole('heading', { level: 1 }).textContent(),
  audience: await page.locator('.lede').textContent()
};
await page.getByRole('button', { name: 'Try it with sample data' }).click();
await page.locator('#app[data-demo-ready="true"]').waitFor();
const desk = page.locator('.take-card').filter({ has: page.getByRole('heading', { name: 'Desk distance' }) });
const closer = page.locator('.take-card').filter({ has: page.getByRole('heading', { name: 'One hand closer' }) });
const demo = {
  url: page.url(),
  title: await page.title(),
  deskBounds: await desk.boundingBox(),
  deskLevelBounds: await desk.getByText('Level', { exact: true }).boundingBox(),
  deskRoomNoiseBounds: await desk.getByText('Room noise', { exact: true }).boundingBox(),
  deskRoomNoise: await desk.locator('.metrics dd').nth(1).textContent(),
  closerRoomNoise: await closer.locator('.metrics dd').nth(1).textContent(),
  comparison: await page.locator('.comparison p:not(.section-label)').textContent(),
  discardControl: await page.getByRole('button', { name: 'Discard demo and record' }).count()
};
await page.screenshot({ path: '.factory/qa-artifacts/polish-2/live-mobile-demo.png', fullPage: false });
await page.getByRole('button', { name: 'Export WAV' }).first().click();
await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
await page.reload({ waitUntil: 'networkidle' });
await context.setOffline(true);
await page.reload();
const offline = { cards: await page.locator('.take-card').count(), url: page.url() };
await context.setOffline(false);

const routes = {};
for (const [path, expected] of [['/', 200], ['/demo/', 200], ['/privacy/', 200], ['/terms/', 200], ['/does-not-exist', 404]]) {
  const response = await fetch(`${base}${path}`);
  routes[path] = {
    status: response.status,
    expected,
    csp: response.headers.get('content-security-policy'),
    xFrameOptions: response.headers.get('x-frame-options')
  };
}

const axe = {};
for (const size of [{ name: 'desktop', width: 1366, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  await page.setViewportSize(size);
  for (const path of ['/', '/demo/', '/privacy/', '/terms/']) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    axe[`${size.name}:${path}`] = results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? '')).map(v => v.id);
  }
}

const result = {
  home,
  demo,
  offline,
  routes,
  privacyRequests: requests.map(request => ({ ...request, sameOrigin: new URL(request.url).origin === base })),
  consoleErrors,
  axe
};
await writeFile(artifact, `${JSON.stringify(result, null, 2)}\n`);
await browser.close();

if (!demo.deskBounds || demo.deskBounds.y + demo.deskBounds.height > 844 || !demo.deskRoomNoiseBounds || demo.deskRoomNoiseBounds.y + demo.deskRoomNoiseBounds.height > 844) throw new Error('Sample evidence is not fully visible in the first mobile viewport.');
if (demo.deskRoomNoise !== 'noticeable' || demo.closerRoomNoise !== 'low' || !demo.comparison?.includes('Take 2 has less room noise.')) throw new Error('Visible sample marks do not support the comparison.');
if (demo.discardControl !== 1 || offline.cards !== 2 || consoleErrors.length || Object.values(axe).some(ids => ids.length) || Object.values(routes).some(route => route.status !== route.expected) || result.privacyRequests.some(request => !request.sameOrigin || !['GET', 'HEAD'].includes(request.method))) throw new Error('Live verification failed.');
console.log(JSON.stringify(result, null, 2));
