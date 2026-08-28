import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function idbKeys(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('voice-comfort-meter');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const request = db.transaction('takes').objectStore('takes').getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return keys.map(String).sort();
  });
}

async function recordShortTake(page: import('@playwright/test').Page) {
  await page.context().grantPermissions(['microphone'], { origin: 'http://127.0.0.1:4173' });
  await page.getByRole('button', { name: /Record take 1/ }).click();
  await expect(page.getByRole('button', { name: /Stop recording/ })).toBeVisible();
  await page.getByRole('button', { name: /Stop recording/ }).click();
  await expect(page.locator('.take-card')).toHaveCount(1);
}

test('@claim:demo-comparison Shows two sample takes right away', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.take-card')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Look for the setup you prefer' })).toBeVisible();
});

test('@claim:privacy-local Audio stays on this device', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Export WAV' }).first().click();
  const origin = new URL(page.url()).origin;
  expect(requests.every(request => new URL(request.url).origin === origin)).toBeTruthy();
  expect(requests.every(request => ['GET', 'HEAD'].includes(request.method))).toBeTruthy();
});

test('@claim:wav-export Exports a take as WAV', async ({ page }) => {
  await page.goto('/demo');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export WAV' }).first().click();
  expect((await download).suggestedFilename()).toMatch(/\.wav$/);
});

test('@claim:offline-reload Use it after the first visit', async ({ page, context }) => {
  // Make the claim test a true first visit even when another test used this
  // browser process: an older worker must never supply this test's shell.
  await page.goto('/');
  await page.evaluate(async () => {
    await Promise.all((await navigator.serviceWorker.getRegistrations()).map(registration => registration.unregister()));
    await Promise.all((await caches.keys()).map(key => caches.delete(key)));
    indexedDB.deleteDatabase('voice-comfort-meter');
  });
  await page.reload();
  await page.goto('/demo/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.reload();
  await expect(page.locator('.take-card')).toHaveCount(2);
  await page.waitForFunction(async () => Boolean(await caches.match('/demo/')));
  await context.setOffline(true);
  await page.reload();
  expect(page.url()).toMatch(/\/demo\/?$/);
  await expect(page.locator('.take-card')).toHaveCount(2);
});

test('@claim:no-account-payment Try the sample without an account or payment', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.locator('.take-card')).toHaveCount(2);
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(page.getByText(/sign in|payment|checkout/i)).toHaveCount(0);
});

test('@claim:microphone-on-record Microphone is requested only after Record', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    const media = navigator.mediaDevices;
    Object.defineProperty(window, '__micCalls', { get: () => calls });
    media.getUserMedia = () => {
      calls += 1;
      return Promise.reject(new DOMException('blocked for test', 'NotAllowedError'));
    };
  });
  await page.goto('/');
  expect(await page.evaluate(() => (window as unknown as { __micCalls: number }).__micCalls)).toBe(0);
  await page.getByRole('button', { name: /Record take 1/ }).click();
  await expect(page.getByText('Microphone access was blocked.')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __micCalls: number }).__micCalls)).toBe(1);
});

test('@claim:take-limit A take stops at 15 seconds', async ({ page }) => {
  test.setTimeout(35000);
  await page.goto('/');
  await page.context().grantPermissions(['microphone'], { origin: 'http://127.0.0.1:4173' });
  await page.getByRole('button', { name: /Record take 1/ }).click();
  await expect(page.getByRole('button', { name: /Stop recording/ })).toBeVisible();
  await expect(page.locator('.take-card')).toHaveCount(1, { timeout: 22000 });
  await expect(page.locator('.metrics dd').nth(2)).toHaveText('15.0s');
});

test('@claim:recordings-until-delete Recordings remain after export until deleted', async ({ page }) => {
  await page.goto('/');
  await recordShortTake(page);
  await page.reload();
  await expect(page.locator('.take-card')).toHaveCount(1);
  await page.getByRole('button', { name: /Delete Take 1/ }).click();
  await expect(page.locator('.take-card')).toHaveCount(0);
});

test('@claim:separate-storage Demo and real takes use separate storage namespaces', async ({ page }) => {
  await page.goto('/demo');
  expect(await idbKeys(page)).toEqual(['demo:takes']);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await recordShortTake(page);
  expect(await idbKeys(page)).toEqual(['demo:takes', 'real:takes']);
});

test('keyboard path reaches recording control', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByText('Skip to content')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('desktop and mobile routes have no serious or critical axe findings', async ({ page }) => {
  for (const path of ['/', '/demo/', '/privacy', '/terms']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? '')).map(violation => violation.id)).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/');
  const mobile = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(mobile.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? '')).map(violation => violation.id)).toEqual([]);
});

test('mobile controls meet the 44px touch-target baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  for (const button of [
    page.getByRole('button', { name: 'Reset demo' }),
    page.getByRole('button', { name: 'Start for real' }),
    page.getByRole('button', { name: /Delete Desk distance/ }),
    page.getByRole('button', { name: 'Play take' }).first(),
    page.getByRole('button', { name: 'Export WAV' }).first()
  ]) {
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('production artifact ships deployment config, static routes, hashes, and update policy', async () => {
  const root = join(process.cwd(), 'dist');
  const config = JSON.parse(await readFile(join(root, 'staticwebapp.config.json'), 'utf8'));
  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  for (const route of ['demo', 'privacy', 'terms']) await expect(readFile(join(root, route, 'index.html'))).resolves.toBeTruthy();
  const assets = await readdir(join(root, 'assets'));
  expect(assets.some(asset => /^app-[\w-]+\.js$/.test(asset))).toBeTruthy();
  expect(assets.some(asset => /^app-[\w-]+\.css$/.test(asset))).toBeTruthy();
  const worker = await readFile(join(root, 'sw.js'), 'utf8');
  expect(worker).not.toContain('__BUILD_ID__');
  expect(worker).toContain("'skip-waiting'");
});
