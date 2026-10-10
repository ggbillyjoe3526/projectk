// Smoke test of the production build on the WebGL2 path: serve dist/, open the game in headless Chromium with a
// software GPU, start it, and check that it runs a new game (chapter 1, on the ferry) and the slice's Low water
// without an error. Run `npm run build` first.
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = await preview({ preview: { port: 4317, strictPort: true }, logLevel: 'warn' });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const problems = [];
try {
  // A new game opens chapter 1 on the ferry; ?chapter=lowwater opens the slice. Each says its opening line on the
  // first tick, so the simulation is running.
  for (const [query, opening] of [['', 'The late ferry'], ['&chapter=lowwater', 'The morning after the vigil']]) {
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    page.on('pageerror', (e) => problems.push(`page error${query}: ${e.message}`));
    await page.goto(`http://localhost:4317/?forceWebGL&seed=1${query}`);
    await page.waitForSelector('.start-gate', { timeout: 30000 });
    await page.mouse.click(480, 270);
    await page.waitForFunction((text) => document.querySelector('.hud-caption')?.textContent?.includes(text), opening, { timeout: 30000 });
    await page.waitForTimeout(1500);
    if (await page.$('.crash-screen')) problems.push(`crash screen${query}: ${await page.textContent('.crash-screen')}`);
    const drawn = await page.evaluate(() => {
      const canvas = document.querySelector('#app canvas');
      return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0;
    });
    if (!drawn) problems.push(`no canvas drawn${query}`);
    await page.close();
  }
} catch (e) {
  problems.push(String(e));
} finally {
  await browser.close();
  await new Promise((done) => server.httpServer.close(done));
}
if (problems.length) {
  console.error(`Smoke test failed:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('Smoke test passed: chapter 1 and Low water run on the WebGL2 path.');
