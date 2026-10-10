// Smoke test of the production build on the WebGL2 path: serve dist/, open the game in headless Chromium with a
// software GPU, start it, and check that it runs a new game without an error. Run `npm run build` first.
import { chromium } from 'playwright';
import { preview } from 'vite';

const server = await preview({ preview: { port: 4317, strictPort: true }, logLevel: 'warn' });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const problems = [];
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  await page.goto('http://localhost:4317/?forceWebGL&seed=1');
  await page.waitForSelector('.start-gate', { timeout: 30000 });
  await page.mouse.click(480, 270);
  // The opening line is said on the first tick of a new game, so the simulation is running.
  await page.waitForFunction(() => document.querySelector('.hud-caption')?.textContent?.includes('The morning after the vigil'), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await page.$('.crash-screen')) problems.push(`crash screen: ${await page.textContent('.crash-screen')}`);
  const drawn = await page.evaluate(() => {
    const canvas = document.querySelector('#app canvas');
    return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0;
  });
  if (!drawn) problems.push('no canvas drawn');
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
console.log('Smoke test passed: a new game runs on the WebGL2 path.');
