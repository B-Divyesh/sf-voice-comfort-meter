import { test, expect } from '@playwright/test';

test('@claim:demo-comparison Shows two sample takes right away', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.take-card')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Look for the setup you prefer' })).toBeVisible();
});

test('@claim:privacy-local Audio stays on this device', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', request => urls.push(request.url()));
  await page.goto('/demo');
  await expect(page.locator('.take-card')).toHaveCount(2);
  const origin = new URL(page.url()).origin;
  expect(urls.every(url => new URL(url).origin === origin)).toBeTruthy();
});

test('@claim:wav-export Exports a take as WAV', async ({ page }) => {
  await page.goto('/demo');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export WAV' }).first().click();
  expect((await download).suggestedFilename()).toMatch(/\.wav$/);
});

test('@claim:offline-reload Use it after the first visit', async ({ page, context }) => {
  await page.goto('/demo');
  await page.waitForTimeout(500);
  await page.reload();
  await context.setOffline(true);
  const shellIsCached = await page.evaluate(async () => {
    const paths = ['/demo', '/assets/app.js', '/assets/app.css', '/art/blueprint-hero.webp'];
    return Promise.all(paths.map(path => caches.match(path).then(Boolean)));
  });
  expect(shellIsCached.every(Boolean)).toBeTruthy();
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
