import * as THREE from 'three';
import { mesh, rbox, plain, rng, hdri, jitter, shadowLight } from '../lib.js';
import { glow, beam, point, candle, coffin, coffinLid, trestle, sashWindow, phone, softTex } from '../props.js';
import { person } from '../cast.js';

/** Alan Sloan's cottage on the Brough: the room where the coffin lies. Shared by the vigil and the note. */
async function cottage({ renderer, M }) {
  const scene = new THREE.Scene();
  const { env } = await hdri(renderer, 'moonless_golf_1k.hdr');
  scene.environment = env; scene.environmentIntensity = 0.25;
  scene.background = new THREE.Color('#020304');
  scene.fog = new THREE.FogExp2('#06070a', 0.03);
  const W = 2.7, D = 2.1, Hc = 2.45, T = 0.45;

  // floor: flagstones, a worn rug
  scene.add(mesh(new THREE.PlaneGeometry(W * 2, D * 2).rotateX(-Math.PI / 2), M.flags, { cast: false }));
  const rug = new THREE.PlaneGeometry(2.4, 1.5, 24, 16).rotateX(-Math.PI / 2); jitter(rug, 0.004, 12, 2);
  scene.add(mesh(rug, M.rug, { pos: [-0.25, 0.008, 0.25], tile: 2.4, cast: false }));

  // walls: back (z=-D) with a deep window, left (x=-W) with the hearth, right (x=W) with the door
  const wall = (w, h, d, x, y, z) => scene.add(mesh(rbox(w, h, d, 0.02), M.plaster, { pos: [x, y, z] }));
  const winX = 0.95, winW = 0.82, winY0 = 0.95, winY1 = 1.8;
  wall(winX - winW / 2 + W, Hc, T, (-W + winX - winW / 2) / 2, Hc / 2, -D - T / 2);
  wall(W - (winX + winW / 2), Hc, T, (winX + winW / 2 + W) / 2, Hc / 2, -D - T / 2);
  wall(winW, winY0, T, winX, winY0 / 2, -D - T / 2);
  wall(winW, Hc - winY1, T, winX, (Hc + winY1) / 2, -D - T / 2);
  wall(T, Hc, D * 2 + T * 2, -W - T / 2, Hc / 2, 0);
  wall(T, Hc, D * 2 + T * 2, W + T / 2, Hc / 2, 0);
  wall(W * 2, Hc, T, 0, Hc / 2, D + T / 2);
  // window: sash, sill, the night outside
  const sash = sashWindow(M, winW, winY1 - winY0, { glass: '#0a1018' }); sash.position.set(winX, (winY0 + winY1) / 2, -D - T + 0.08); scene.add(sash);
  scene.add(mesh(rbox(winW + 0.12, 0.05, T + 0.06, 0.015), M.boards, { pos: [winX, winY0 - 0.02, -D - T / 2 + 0.03] }));
  const night = new THREE.Mesh(new THREE.PlaneGeometry(winW * 3, (winY1 - winY0) * 3), new THREE.MeshBasicMaterial({ color: new THREE.Color('#1a2433').multiplyScalar(0.9), fog: false }));
  night.position.set(winX, (winY0 + winY1) / 2, -D - T - 0.6); scene.add(night);
  glow(scene, '#cfdcf0', 0.9, [winX + 0.15, 1.55, -D - T - 0.5], 0.5); // the lighthouse beam passing the glass
  // ceiling boards and beams
  scene.add(mesh(new THREE.PlaneGeometry(W * 2, D * 2).rotateX(Math.PI / 2), M.boards, { pos: [0, Hc, 0], cast: false }));
  for (let x = -W + 0.55; x < W; x += 1.05) scene.add(mesh(rbox(0.16, 0.18, D * 2, 0.02), M.pew, { pos: [x, Hc - 0.09, 0], tile: 1.2 }));
  // skirting boards
  scene.add(mesh(rbox(W * 2, 0.14, 0.03, 0.006), M.boards, { pos: [0, 0.07, -D + 0.015] }));
  scene.add(mesh(rbox(0.03, 0.14, D * 2, 0.006), M.boards, { pos: [W - 0.015, 0.07, 0] }));

  // hearth on the left wall: stone surround, timber mantel, a peat fire
  const hx = -W + 0.2, hz = -0.35;
  const surround = rbox(0.42, 1.25, 1.5, 0.03, 3);
  scene.add(mesh(surround, M.stonewall, { pos: [hx, 0.625, hz], tile: 2.0 }));
  scene.add(mesh(rbox(0.5, 0.08, 1.7, 0.015), M.pew, { pos: [hx + 0.05, 1.29, hz], tile: 1.4 }));
  scene.add(mesh(rbox(0.36, 0.62, 0.78, 0.02), plain('#0a0807', { rough: 1 }), { pos: [hx + 0.04, 0.31, hz], keepUV: true }));
  // the peat: dark bricks with ember cracks
  const r = rng(4);
  const ember = new THREE.MeshStandardMaterial({ color: '#2a1a12', emissive: new THREE.Color('#ff5a18'), emissiveIntensity: 1.4, roughness: 0.9 });
  for (let i = 0; i < 9; i++) {
    const b = new THREE.Mesh(jitter(new THREE.BoxGeometry(0.14, 0.06, 0.09, 4, 2, 3), 0.008, 30, i), i % 3 === 0 ? ember : plain('#1c120c', { rough: 1, emissive: '#ff4010', emissiveIntensity: 0.35 }));
    b.position.set(hx + 0.12 + (i % 2) * 0.05, 0.05 + Math.floor(i / 4) * 0.05, hz - 0.25 + (i % 4) * 0.16); b.rotation.set(r() * 0.4, r() * 1.5, r() * 0.3); scene.add(b);
  }
  glow(scene, '#ff7a30', 0.9, [hx + 0.25, 0.15, hz], 0.8);
  point(scene, '#ff9550', 2.2, 7, [hx + 0.42, 0.42, hz], true, { size: 1024 });
  // mantel clock (still ticking: nobody stopped it), photographs, a china dog
  const clock = new THREE.Group(); clock.position.set(hx + 0.08, 1.33, hz + 0.45); scene.add(clock);
  clock.add(mesh(rbox(0.13, 0.26, 0.2, 0.02), M.coffinwood, { pos: [0, 0.13, 0], tile: 0.4 }));
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.06, 32), plain('#d8d0b8', { rough: 0.4 })); face.rotation.y = Math.PI / 2; face.position.set(0.066, 0.16, 0); clock.add(face);
  for (const [a, l] of [[0.3, 0.04], [2.1, 0.05]]) { const hand = new THREE.Mesh(new THREE.BoxGeometry(0.002, l, 0.004), plain('#111')); hand.position.set(0.068, 0.16 + Math.cos(a) * l / 2, Math.sin(a) * l / 2); hand.rotation.x = -a; clock.add(hand); }
  for (const [z, h] of [[-0.5, 0.17], [-0.2, 0.13]]) {
    const ph = new THREE.Group(); ph.position.set(hx + 0.08, 1.33, hz + z); ph.rotation.z = 0.12; scene.add(ph);
    ph.add(mesh(rbox(0.02, h, h * 0.78, 0.004), M.brass, { pos: [0, h / 2, 0], keepUV: true }));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.62, h * 0.8), plain('#5a5040', { rough: 0.3 })); pic.rotation.y = Math.PI / 2; pic.position.set(0.011, h / 2, 0); ph.add(pic);
  }

  // the mirror on the back wall (uncovered when it should be covered)
  const mx = -1.3, my = 1.45, mz = -D;
  scene.add(mesh(rbox(0.62, 0.82, 0.04, 0.01), M.coffinwood, { pos: [mx, my, mz + 0.02], tile: 0.6 }));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.72), new THREE.MeshStandardMaterial({ color: '#8a9094', metalness: 1, roughness: 0.08 }));
  glass.position.set(mx, my, mz + 0.045); scene.add(glass);
  // a pale shape in it where nobody is standing
  const smear = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.42), new THREE.MeshBasicMaterial({ map: softTex(), color: new THREE.Color('#9aa8b0').multiplyScalar(0.35), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  smear.position.set(mx - 0.1, my - 0.02, mz + 0.05); scene.add(smear);

  // the door on the right, ajar onto black
  scene.add(mesh(rbox(0.08, 2.05, 0.06, 0.01), M.paint_frame_white, { pos: [W - 0.04, 1.02, 1.67] }));
  scene.add(mesh(rbox(0.08, 2.05, 0.06, 0.01), M.paint_frame_white, { pos: [W - 0.04, 1.02, 0.73] }));
  scene.add(mesh(rbox(0.08, 0.06, 1.0, 0.01), M.paint_frame_white, { pos: [W - 0.04, 2.05, 1.2] }));
  scene.add(mesh(new THREE.PlaneGeometry(0.88, 2.0).rotateY(-Math.PI / 2), plain('#000000'), { pos: [W + 0.1, 1.0, 1.2], cast: false }));
  const leaf = new THREE.Group(); leaf.position.set(W - 0.05, 0, 0.75); leaf.rotation.y = -0.55; scene.add(leaf);
  leaf.add(mesh(rbox(0.05, 1.98, 0.86, 0.01), M.paint_door_green, { pos: [0, 0.99, 0.43] }));
  for (const y of [0.55, 1.45]) leaf.add(mesh(rbox(0.012, 0.6, 0.6, 0.01), M.paint_door_green, { pos: [0.03, y, 0.43] }));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), M.brass); knob.position.set(0.05, 1.0, 0.78); leaf.add(knob);

  // the coffin on two trestles, lid against the back wall
  const cx = -0.15, cz = 0.1, cy = 0.66;
  const cf = coffin(M); cf.position.set(cx, cy, cz); scene.add(cf);
  scene.add(trestle(M, [cx - 0.55, 0, cz])); scene.add(trestle(M, [cx + 0.5, 0, cz]));
  const lid = coffinLid(M); lid.rotation.set(0, 0, Math.PI / 2 - 0.1); lid.position.set(1.95, 0.98, -D + 0.08); scene.add(lid);
  // Alan, laid out under a sheet, head towards the candle
  const alanTilt = new THREE.Group(); alanTilt.position.set(cx - 0.02, cy + 0.165, cz); alanTilt.rotation.y = -Math.PI / 2; scene.add(alanTilt);
  const alan = await person('alan', M); alan.rotation.x = -Math.PI / 2; alan.position.set(0, 0, 0.88); alan.scale.setScalar(0.98); alanTilt.add(alan);
  const pillow = new THREE.Mesh(jitter(new THREE.BoxGeometry(0.34, 0.08, 0.26, 8, 3, 6), 0.012, 9, 3), M.linen); pillow.position.set(cx + 0.78, cy + 0.08, cz); scene.add(pillow);

  // the candle at his head, on a stool; the plate of salt beside it, not on his breast where it belongs
  const stool = new THREE.Group(); stool.position.set(1.15, 0, cz); scene.add(stool);
  stool.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32), M.pew, { pos: [0, 0.62, 0], tile: 0.5 }));
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const l = mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.64, 12), M.pew, { tile: 0.5 }); l.position.set(Math.cos(a) * 0.13, 0.31, Math.sin(a) * 0.13); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); stool.add(l); }
  const holder = new THREE.LatheGeometry([[0, 0], [0.06, 0], [0.065, 0.008], [0.02, 0.015], [0.018, 0.04], [0.03, 0.045], [0, 0.046]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
  stool.add(mesh(holder, M.brass, { pos: [0, 0.645, 0], keepUV: true }));
  candle(stool, M, [0, 0.69, 0], 0.2, { intensity: 2.0, distance: 6, shadow: true, halo: 0.45 });
  const plate = new THREE.LatheGeometry([[0, 0], [0.09, 0], [0.1, 0.012], [0.095, 0.014], [0.07, 0.006], [0, 0.006]].map(([x, y]) => new THREE.Vector2(x, y)), 32);
  stool.add(mesh(plate, plain('#e8e6dc', { rough: 0.25 }), { pos: [0.08, 0.645, 0.09], keepUV: true }));
  const salt = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.035, 24), plain('#f2f2ee', { rough: 0.9 })); salt.position.set(0.08, 0.668, 0.09); stool.add(salt);

  // side table under the window: whisky, a glass, his reading glasses
  const table = new THREE.Group(); table.position.set(0.25, 0, -1.6); scene.add(table);
  table.add(mesh(rbox(0.55, 0.035, 0.42, 0.01), M.pew, { pos: [0, 0.6, 0], tile: 0.8 }));
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) table.add(mesh(rbox(0.035, 0.6, 0.035, 0.006), M.pew, { pos: [a * 0.23, 0.3, b * 0.17], tile: 0.8 }));
  const bottle = new THREE.LatheGeometry([[0, 0], [0.042, 0], [0.044, 0.005], [0.044, 0.18], [0.03, 0.22], [0.014, 0.24], [0.014, 0.3], [0, 0.3]].map(([x, y]) => new THREE.Vector2(x, y)), 32);
  table.add(mesh(bottle, new THREE.MeshStandardMaterial({ color: '#1e3018', roughness: 0.05, metalness: 0.2, emissive: '#050a04' }), { pos: [-0.12, 0.62, 0], keepUV: true }));
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.0445, 0.0445, 0.07, 32, 1, true, -0.6, 1.2), plain('#c8b88a', { rough: 0.6 })); label.position.set(-0.12, 0.72, 0); table.add(label);
  const tumbler = new THREE.LatheGeometry([[0, 0], [0.032, 0], [0.036, 0.08], [0.033, 0.08], [0.029, 0.006], [0, 0.006]].map(([x, y]) => new THREE.Vector2(x, y)), 32);
  table.add(mesh(tumbler, new THREE.MeshStandardMaterial({ color: '#c8c8c0', roughness: 0.02, metalness: 0.6, transparent: true, opacity: 0.5 }), { pos: [0.1, 0.62, 0.05], keepUV: true }));
  const dram = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 24), plain('#8a4a10', { rough: 0.05, emissive: '#2a1004', emissiveIntensity: 0.6 })); dram.position.set(0.1, 0.64, 0.05); table.add(dram);

  // bookshelf in the far corner
  const shelf = new THREE.Group(); shelf.position.set(2.15, 0, -D + 0.22); scene.add(shelf);
  shelf.add(mesh(rbox(0.9, 1.9, 0.04, 0.005), M.pew, { pos: [0, 0.95, -0.15], tile: 1 }));
  for (const sx of [-1, 1]) shelf.add(mesh(rbox(0.035, 1.9, 0.34, 0.006), M.pew, { pos: [sx * 0.43, 0.95, 0], tile: 1 }));
  const bookCols = ['#5a2a22', '#2a3a4a', '#4a4a2a', '#6a5a40', '#2a2a2a', '#3a2a3a', '#7a6a50'];
  for (let s = 0; s < 4; s++) {
    shelf.add(mesh(rbox(0.86, 0.03, 0.32, 0.005), M.pew, { pos: [0, 0.1 + s * 0.45, 0], tile: 1 }));
    let x = -0.4;
    while (x < 0.38) {
      const bw = 0.025 + r() * 0.035, bh = 0.2 + r() * 0.14, lean = x > 0.25 ? 0.25 : 0;
      const bk = mesh(rbox(bw, bh, 0.2 + r() * 0.05, 0.004), plain(bookCols[Math.floor(r() * bookCols.length)], { rough: 0.7 }), { keepUV: true });
      bk.position.set(x + bw / 2, 0.115 + s * 0.45 + bh / 2, 0.02); bk.rotation.z = -lean; shelf.add(bk);
      x += bw + 0.003;
    }
  }

  // moonlight through the window, cold, throwing the sash shadow across the floor
  const moon = shadowLight(new THREE.DirectionalLight('#9fb6dc', 1.4), 2048, 4, { radius: 3 });
  moon.position.set(winX + 1.4, 4.4, -D - 3.6); moon.target.position.set(winX - 0.3, 0, -0.4);
  scene.add(moon); scene.add(moon.target);
  scene.add(new THREE.HemisphereLight('#2a3446', '#1a120c', 0.35));
  return { scene, consts: { W, D, Hc, hx, hz, winX, mx, my, mz, cx, cz } };
}

export async function vigil(ctx) {
  const { scene, consts } = await cottage(ctx);
  const { M } = ctx;
  // William, sitting the night in his father's chair, bent over, elbows on knees
  const chair = new THREE.Group(); chair.position.set(-0.05, 0, -1.05); chair.rotation.y = 0.15; scene.add(chair);
  chair.add(mesh(rbox(0.66, 0.36, 0.62, 0.06, 3), M.tweed, { pos: [0, 0.24, 0], tile: 0.5 }));
  chair.add(mesh(rbox(0.66, 0.62, 0.16, 0.06, 3), M.tweed, { pos: [0, 0.68, -0.25], tile: 0.5 }));
  for (const s of [-1, 1]) chair.add(mesh(rbox(0.13, 0.3, 0.62, 0.05, 3), M.tweed, { pos: [s * 0.3, 0.52, 0], tile: 0.5 }));
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) chair.add(mesh(new THREE.CylinderGeometry(0.02, 0.016, 0.07, 10), M.pew, { pos: [a * 0.28, 0.035, b * 0.26], tile: 0.3 }));
  const w = await person('w_vigil', M); w.position.set(0, -0.02, 0.06); chair.add(w);

  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.05, 40);
  camera.position.set(1.55, 2.15, 2.0);
  camera.lookAt(-0.45, 0.55, -0.85);
  return {
    scene, camera, look: { exposure: 0.95, aoRadius: 0.4 },
    ui: {
      caption: ['The Brough', 'The vigil  -  02:47'],
      prompts: [{ pos: [consts.mx, consts.my + 0.05, consts.mz + 0.1], key: 'E', label: '' }, { pos: [consts.hx + 0.1, 1.55, consts.hz + 0.45], key: 'E', label: '' }],
    },
  };
}

export async function note(ctx) {
  const { scene } = await cottage(ctx);
  const { M } = ctx;
  // William at the window, the notebook open in his hands, phone torch on it
  const w = await person('w_note', M); w.position.set(0.95, 0, -1.2); w.rotation.y = Math.PI; scene.add(w);
  const book = new THREE.Group(); book.position.set(0.95, 1.1, -1.55); book.rotation.x = -0.9; scene.add(book);
  for (const s of [-1, 1]) { const pg = mesh(rbox(0.15, 0.21, 0.012, 0.003), plain('#d8ceb4', { rough: 0.9 }), { keepUV: true }); pg.position.x = s * 0.075; pg.rotation.y = s * 0.12; book.add(pg); }
  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.05, 40);
  camera.position.set(1.75, 1.95, 0.55);
  camera.lookAt(0.55, 0.95, -1.5);
  return {
    scene, camera, look: { exposure: 1.0 },
    ui: {
      dim: 0.5,
      note: {
        title: "Alan's notebook",
        where: 'Found by the window',
        date: '14th Nov.',
        lines: [
          'Salt on the breast. The glass turned to the wall. Stop the clock at the hour, and open the window so they can find their way out.',
          'Keep the light till morning. If the light goes out, they don\'t go out the window. They come back in by the door.',
          'Knife won\'t do it. Tried, the winter Kenny Flett went in the water. They get back up.',
        ],
        underline: 'Iron from the howe. Nothing else will lay them.',
        prompts: ['[A/D] Page', '[P] Photograph', '[Esc] Put down'],
      },
    },
  };
}
