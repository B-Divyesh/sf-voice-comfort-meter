import { chromium } from '@playwright/test';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = await mkdtemp(join(tmpdir(), 'voice-comfort-meter-update-'));
await cp('dist', directory, { recursive: true });
const server = spawn('python3', ['-m', 'http.server', '4188', '--bind', '127.0.0.1', '--directory', directory], { stdio: 'ignore' });

try {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch('http://127.0.0.1:4188/')).ok) break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4188/demo/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.reload();
  await page.locator('.take-card').first().waitFor();

  const initialHidden = await page.locator('#update-toast').isHidden();
  const workerPath = join(directory, 'sw.js');
  const initialWorker = await readFile(workerPath, 'utf8');
  await new Promise(resolve => setTimeout(resolve, 1100));
  await writeFile(workerPath, initialWorker.replace(/const VERSION = '([^']+)'/, "const VERSION = '$1-probe'"));
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting));
  await page.locator('#update-toast').waitFor({ state: 'visible' });
  await Promise.all([
    page.waitForEvent('framenavigated', frame => frame === page.mainFrame()),
    page.getByRole('button', { name: 'Reload update' }).click()
  ]);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('.take-card').first().waitFor();

  const result = {
    initialHidden,
    waitingPromptVisible: true,
    updatedWorkerActive: await page.evaluate(async () => !((await navigator.serviceWorker.getRegistration())?.waiting)),
    retainedCards: await page.locator('.take-card').count()
  };
  console.log(JSON.stringify(result));
  await browser.close();
  if (!result.initialHidden || !result.updatedWorkerActive || result.retainedCards !== 2) process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
}
