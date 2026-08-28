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

async function idbValue<T>(page: import('@playwright/test').Page, key: string) {
  return page.evaluate(async storedKey => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('voice-comfort-meter');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction('takes').objectStore('takes').get(storedKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
  }, key) as Promise<T>;
}

async function clearAppStorage(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    await Promise.all((await navigator.serviceWorker.getRegistrations()).map(registration => registration.unregister()));
    await Promise.all((await caches.keys()).map(key => caches.delete(key)));
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('voice-comfort-meter');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('voice-comfort-meter database deletion was blocked'));
    });
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
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/*', async route => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:"
      }
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.getByText('Demo — sample changes are discarded')).toBeVisible();
  await expect(page.locator('.take-card')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Look for the setup you prefer' })).toBeVisible();
  await expect(page.locator('.wave svg')).toHaveCount(2);
  expect(await page.locator('.wave rect').evaluateAll(rects => rects.every(rect => rect.getBoundingClientRect().height > 0))).toBeTruthy();
  expect(errors).toEqual([]);
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
  // Make this a true first visit. In particular, wait for IndexedDB deletion:
  // starting deletion without waiting can erase the newly seeded demo records
  // during the offline reload and produces a false pass/fail race.
  await page.goto('/');
  await clearAppStorage(page);
  await page.reload();
  await page.goto('/demo/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.reload();
  await expect(page.locator('.take-card')).toHaveCount(2);
  await expect.poll(() => idbKeys(page)).toEqual(['demo:takes']);
  await page.waitForFunction(async () => Boolean(await caches.match('/demo/')));
  await context.setOffline(true);
  await page.reload();
  expect(page.url()).toMatch(/\/demo\/?$/);
  await expect(page.locator('.take-card')).toHaveCount(2);
  await expect.poll(() => idbKeys(page)).toEqual(['demo:takes']);
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
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: /Delete Take 1/ }).click();
  await expect(page.locator('.take-card')).toHaveCount(0);
});

test('@claim:separate-storage Demo and real takes use separate storage namespaces', async ({ page }) => {
  await page.goto('/demo');
  // This is the regression for verifier-3's clean-suite race: direct demo
  // navigation is not ready until its sample transaction has committed.
  await expect(page.locator('#app')).toHaveAttribute('data-demo-ready', 'true');
  await expect(page.locator('.take-card')).toHaveCount(2);
  expect(await idbKeys(page)).toEqual(['demo:takes']);
  await page.goto('/');
  await recordShortTake(page);
  expect(await idbKeys(page)).toEqual(['demo:takes', 'real:takes']);
});

test('@claim:preferred-take The quieter choice persists after reload', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Keep the quieter take' }).click();
  const preferred = page.locator('.take-card.is-preferred');
  await expect(preferred).toHaveCount(1);
  await expect(preferred).toContainText('One hand closer');
  await expect(preferred).toContainText('Preferred');
  const stored = await idbValue<Array<{ id: string; preferred?: boolean }>>(page, 'demo:takes');
  expect(stored.find(take => take.preferred)?.id).toBe('sample-2');
  await page.reload();
  await expect(page.locator('.take-card.is-preferred')).toContainText('One hand closer');
  await expect(page.getByRole('button', { name: 'Quieter take kept' })).toBeDisabled();
});

test('@claim:demo-discard Demo changes are discarded on Start for real', async ({ page }) => {
  await page.goto('/demo/');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete Desk distance' }).click();
  await expect(page.locator('.take-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect(await idbKeys(page)).not.toContain('demo:takes');
  await expect(page.locator('.take-card')).toHaveCount(0);
  await page.goto('/demo/');
  await expect(page.locator('.take-card')).toHaveCount(2);
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
  const targets = page.locator('a, button, input');
  for (let index = 0; index < await targets.count(); index += 1) {
    const target = targets.nth(index);
    if (!(await target.isVisible())) continue;
    const box = await target.boundingBox();
    expect(box?.width, await target.getAttribute('aria-label') ?? await target.textContent() ?? `target ${index}`).toBeGreaterThanOrEqual(44);
    expect(box?.height, await target.getAttribute('aria-label') ?? await target.textContent() ?? `target ${index}`).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('cross-route anchors, focus, canonicals, update state, and deletion are correct', async ({ page }) => {
  for (const [path, canonical] of [['/', '/'], ['/demo/', '/demo/'], ['/privacy/', '/privacy/'], ['/terms/', '/terms/'], ['/does-not-exist', '/404/']] as const) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://voice-comfort-meter.sociobot.in${canonical}`);
    await expect(page.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/#how');
  }
  await page.goto('/privacy/');
  await page.getByRole('link', { name: 'How it works' }).click();
  await expect(page).toHaveURL(/\/#how$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('#how')).toBeInViewport();

  await page.goto('/demo/');
  await expect(page.locator('#update-toast')).toBeHidden();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Delete Desk distance' }).click();
  await expect(page.locator('.take-card')).toHaveCount(2);
});

test('production artifact ships deployment config, static routes, hashes, and update policy', async () => {
  const root = join(process.cwd(), 'dist');
  const config = JSON.parse(await readFile(join(root, 'staticwebapp.config.json'), 'utf8'));
  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'self'");
  expect(config.globalHeaders['X-Frame-Options']).toBe('SAMEORIGIN');
  for (const route of ['demo', 'privacy', 'terms']) {
    const html = await readFile(join(root, route, 'index.html'), 'utf8');
    expect(html).toContain(`https://voice-comfort-meter.sociobot.in/${route}/`);
  }
  const assets = await readdir(join(root, 'assets'));
  expect(assets.some(asset => /^app-[\w-]+\.js$/.test(asset))).toBeTruthy();
  expect(assets.some(asset => /^app-[\w-]+\.css$/.test(asset))).toBeTruthy();
  const worker = await readFile(join(root, 'sw.js'), 'utf8');
  expect(worker).not.toContain('__BUILD_ID__');
  expect(worker).toContain("'skip-waiting'");
});
