import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = process.cwd();
const [shotsArg = 'test', dirsArg = 'B', outDir = 'out'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const types = { '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, res) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); try { const d = fs.readFileSync(p); res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); } catch { res.writeHead(404); res.end(); } }).listen(+(process.env.PORT || 8125));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const shot of shotsArg.split(',')) for (const dir of dirsArg.split(',')) {
  const pg = await b.newPage(); pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(shot, dir, m.text().slice(0, 400)); }); let failed = false; pg.on('pageerror', (e) => { failed = true; console.log('ERR', e.message); });
  await pg.goto(`http://localhost:${process.env.PORT || 8125}/index.html?shot=${shot}&dir=${dir}&${process.env.Q || ''}`);
  for (let t = 0; t < 1500 && !failed && !(await pg.evaluate(() => !!window.RESULT)); t++) await new Promise((r) => setTimeout(r, 200));
  if (failed) { await pg.close(); continue; }
  const r = await pg.evaluate(() => window.RESULT);
  if (r === 'ERR') { console.log('failed', shot, dir); } else { fs.writeFileSync(`${outDir}/${shot}-${dir}.png`, Buffer.from(r.split(',')[1], 'base64')); console.log('ok', shot, dir); }
  await pg.close();
}
await b.close(); srv.close();
