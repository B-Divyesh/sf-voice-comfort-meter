import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const base = 'https://voice-comfort-meter.sociobot.in';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
const requests = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('request', request => requests.push({ url: request.url(), method: request.method() }));

await page.goto(`${base}/demo/`, { waitUntil: 'networkidle' });
await page.locator('.take-card').first().waitFor();
const initial = await page.evaluate(() => ({
  title: document.title,
  h1: document.querySelectorAll('h1').length,
  canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
  cards: document.querySelectorAll('.take-card').length,
  bars: [...document.querySelectorAll('.wave rect')].map(bar => bar.getBoundingClientRect().height),
  toastHidden: document.querySelector('#update-toast')?.hasAttribute('hidden') && getComputedStyle(document.querySelector('#update-toast')).display === 'none',
  width: document.documentElement.scrollWidth,
  smallTargets: [...document.querySelectorAll('a,button,input')].filter(element => {
    const box = element.getBoundingClientRect();
    return box.width && box.height && (box.width < 44 || box.height < 44);
  }).map(element => element.getAttribute('aria-label') || element.textContent?.trim())
}));

await page.getByRole('button', { name: 'Keep the quieter take' }).click();
await page.reload();
await page.locator('.take-card.is-preferred').waitFor();
const preferred = (await page.locator('.take-card.is-preferred').innerText()).includes('One hand closer');
await page.getByRole('button', { name: 'Start for real' }).click();
await page.waitForFunction(() => document.querySelector('h1') === document.activeElement);
const focusedHeading = await page.getByRole('heading', { level: 1 }).evaluate(element => element === document.activeElement);
const keysAfterExit = await page.evaluate(async () => {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open('voice-comfort-meter');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const keys = await new Promise((resolve, reject) => {
    const request = database.transaction('takes').objectStore('takes').getAllKeys();
    request.onsuccess = () => resolve(request.result.map(String));
    request.onerror = () => reject(request.error);
  });
  database.close();
  return keys;
});

await page.goto(`${base}/demo/`);
await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
await page.reload();
await context.setOffline(true);
await page.reload();
const offlineCards = await page.locator('.take-card').count();

const report = {
  initial,
  errors,
  preferred,
  focusedHeading,
  keysAfterExit,
  offlineCards,
  requestOrigins: [...new Set(requests.map(request => new URL(request.url).origin))],
  requestMethods: [...new Set(requests.map(request => request.method))]
};
await writeFile('.factory/qa-artifacts/repair-live-check.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();

if (errors.length || initial.title !== 'Demo — Voice Comfort Meter' || initial.h1 !== 1 || initial.canonical !== `${base}/demo/` || initial.cards !== 2 || initial.bars.some(height => height <= 0) || !initial.toastHidden || initial.width > 390 || initial.smallTargets.length || !preferred || !focusedHeading || keysAfterExit.includes('demo:takes') || offlineCards !== 2 || report.requestOrigins.some(origin => origin !== base) || report.requestMethods.some(method => !['GET', 'HEAD'].includes(method))) process.exitCode = 1;
