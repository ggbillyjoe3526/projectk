import * as THREE from 'three';
import { rng } from './lib.js';

const ACCENT = { A: '#e0a85a', B: '#d9b77a', C: '#c8c8c4' };
const TEXT = { A: '#e9e2d0', B: '#ece5d3', C: '#e4e6e2' };

/** Text with hard pixel edges: draw anti-aliased, then threshold the alpha. */
function crisp(g, W, H, draw) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  draw(x);
  const img = x.getImageData(0, 0, W, H); const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 100 ? 255 : 0;
  x.putImageData(img, 0, 0);
  g.drawImage(c, 0, 0);
}

function wrap(g, text, maxW) {
  const out = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

function project(camera, W, H, p) {
  const v = new THREE.Vector3(...p).project(camera);
  return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H];
}

export function drawUI(g, W, H, ui, dir, camera) {
  const s = W / 960; // scale factor relative to the 960×540 layout
  const accent = ACCENT[dir], text = TEXT[dir];
  const px = (n) => Math.round(n * s);
  const font = (size, fam = 'VT323') => `${px(size)}px "${fam}"`;

  if (ui.prompts) for (const p of ui.prompts) {
    const [x, y] = project(camera, W, H, p.pos);
    crisp(g, W, H, (c) => {
      c.strokeStyle = text; c.lineWidth = Math.max(1, px(1.5));
      c.beginPath(); c.moveTo(x, y - px(7)); c.lineTo(x + px(7), y); c.lineTo(x, y + px(7)); c.lineTo(x - px(7), y); c.closePath(); c.stroke();
      c.fillStyle = text; c.font = font(18); c.textBaseline = 'middle';
      if (p.key) { c.fillText(p.key, x - c.measureText(p.key).width / 2, y + px(1)); }
      if (p.label) { c.font = font(17); c.fillText(p.label, x + px(13), y + px(1)); }
    });
  }

  if (ui.caption) {
    crisp(g, W, H, (c) => {
      c.font = font(16, 'Silkscreen'); c.fillStyle = accent; c.textBaseline = 'alphabetic';
      c.fillText(ui.caption[0], px(34), H - px(52));
      c.font = font(22); c.fillStyle = text;
      c.fillText(ui.caption[1], px(34), H - px(30));
    });
  }

  if (ui.phoneToast) {
    // a text arriving on the phone (only at places with signal)
    const bx = W - px(300), by = px(28), bw = px(270), bh = px(64);
    g.fillStyle = 'rgba(8,10,14,0.82)'; g.fillRect(bx, by, bw, bh);
    g.fillStyle = dir === 'C' ? '#9aa' : '#6f8fb8'; g.fillRect(bx, by, px(3), bh);
    crisp(g, W, H, (c) => {
      c.font = font(14, 'Silkscreen'); c.fillStyle = dir === 'C' ? '#bbb' : '#9db8d8'; c.fillText(ui.phoneToast[0], bx + px(14), by + px(22));
      c.font = font(20); c.fillStyle = text; c.fillText(ui.phoneToast[1], bx + px(14), by + px(46));
    });
  }

  if (ui.dialogue) {
    const d = ui.dialogue;
    const bx = px(150), bw = W - px(300), by = H - px(150), bh = px(118);
    g.fillStyle = 'rgba(6,6,8,0.84)'; g.fillRect(bx, by, bw, bh);
    g.strokeStyle = 'rgba(220,210,190,0.35)'; g.lineWidth = Math.max(1, px(1)); g.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    crisp(g, W, H, (c) => {
      c.font = font(16, 'Silkscreen'); c.fillStyle = accent; c.fillText(d.name.toUpperCase(), bx + px(22), by + px(26));
      c.font = font(25); c.fillStyle = text;
      wrap(c, d.text, bw - px(44)).forEach((l, i) => c.fillText(l, bx + px(22), by + px(54) + i * px(24)));
    });
    if (d.options) {
      const ox = bx + bw - px(270), oy = by - px(18) - d.options.length * px(26);
      g.fillStyle = 'rgba(6,6,8,0.78)'; g.fillRect(ox, oy - px(6), px(270), d.options.length * px(26) + px(10));
      crisp(g, W, H, (c) => {
        c.font = font(22);
        d.options.forEach((o, i) => { c.fillStyle = i === 0 ? text : 'rgba(200,195,180,0.75)'; c.fillText((i === 0 ? '> ' : '  ') + o, ox + px(12), oy + px(16) + i * px(26)); });
      });
    }
  }

  if (ui.note) {
    // drawn to its own layer so the haar direction can grade the paper like the world, in one pass
    const layer = document.createElement('canvas'); layer.width = W; layer.height = H;
    drawNote(layer.getContext('2d'), W, H, ui.note, px, font, text, accent);
    if (dir === 'C') g.filter = 'grayscale(1) contrast(1.1)';
    g.drawImage(layer, 0, 0); g.filter = 'none';
  }

  if (ui.hud) {
    const h = ui.hud;
    // Health (pale) and Resolve (segmented, cold) — the optional HUD; off by default in the concept.
    const x = px(34), y = H - px(58);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x - px(4), y - px(4), px(208), px(30));
    g.fillStyle = dir === 'C' ? '#d8d8d8' : '#d9cdb4'; g.fillRect(x, y, px(200) * h.health, px(5));
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + px(200) * h.health, y, px(200) * (1 - h.health), px(5));
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i < h.resolve ? (dir === 'C' ? '#f2f2f2' : '#a9c8de') : 'rgba(255,255,255,0.12)';
      g.fillRect(x + i * px(25), y + px(12), px(21), px(9));
    }
    crisp(g, W, H, (c) => {
      c.font = font(14, 'Silkscreen'); c.fillStyle = text;
      c.fillText(h.item, x, y - px(12));
    });
  }
}

function drawNote(g, W, H, n, px, font, text, accent) {
  const pw = px(430), ph = px(470), x0 = (W - pw) / 2, y0 = px(26);
  // paper: off-white, foxed, a ring from a glass
  const r = rng(7);
  g.save();
  g.translate(x0 + pw / 2, y0 + ph / 2); g.rotate(-0.012); g.translate(-pw / 2, -ph / 2);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(px(8), px(10), pw, ph);
  g.fillStyle = '#d6ccb2'; g.fillRect(0, 0, pw, ph);
  const cell = Math.max(2, px(4));
  for (let y = 0; y < ph; y += cell) for (let x = 0; x < pw; x += cell) {
    const v = r();
    const edge = Math.min(x, y, pw - x, ph - y) < px(18) ? 0.1 : 0;
    g.fillStyle = `rgba(90,70,40,${(v * 0.08 + edge).toFixed(3)})`; g.fillRect(x, y, cell, cell);
  }
  // ruled lines + margin
  g.fillStyle = 'rgba(90,110,140,0.28)';
  for (let y = px(78); y < ph - px(20); y += px(25)) g.fillRect(px(14), y, pw - px(28), Math.max(1, px(1)));
  g.fillStyle = 'rgba(160,60,50,0.3)'; g.fillRect(px(48), 0, Math.max(1, px(1)), ph);
  // whisky ring
  g.strokeStyle = 'rgba(120,80,30,0.22)'; g.lineWidth = px(5);
  g.beginPath(); g.arc(pw - px(84), ph - px(92), px(38), 0.3, 5.6); g.stroke();
  g.fillStyle = '#2b2a3a';
  g.font = `${px(29)}px "Caveat"`;
  g.fillText(n.date, px(60), px(56));
  let y = px(98);
  g.font = `${px(27)}px "Caveat"`;
  for (const para of n.lines) {
    for (const l of wrap(g, para, pw - px(80))) { g.fillText(l, px(60), y); y += px(25); }
  }
  if (n.underline) {
    g.font = `600 ${px(30)}px "Caveat"`;
    y += px(12);
    for (const l of wrap(g, n.underline, pw - px(80))) {
      g.fillText(l, px(60), y);
      g.fillRect(px(60), y + px(6), g.measureText(l).width, Math.max(1, px(1.5)));
      y += px(30);
    }
  }
  g.restore();
  crisp(g, W, H, (c) => {
    c.font = font(16, 'Silkscreen'); c.fillStyle = accent;
    c.fillText(n.title.toUpperCase(), px(40), H - px(52));
    c.font = font(20); c.fillStyle = text;
    c.fillText(n.where, px(40), H - px(28));
    c.font = font(20); c.fillStyle = 'rgba(230,225,210,0.9)';
    const prompts = n.prompts;
    let x = W - px(40);
    for (let i = prompts.length - 1; i >= 0; i--) { const w = c.measureText(prompts[i]).width; x -= w; c.fillText(prompts[i], x, H - px(26)); x -= px(26); }
  });
}
