import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { mesh, rbox, plain, rng, hdri, jitter, shadowLight } from '../lib.js';
import { glow, beam, point, spot, holdall, bollard, rain, sashWindow, sword, phone, softTex } from '../props.js';
import { person } from '../cast.js';
import { skyDome } from './ferry.js';

function signTexture(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 128);
  g.fillStyle = fg; g.font = 'bold 76px Georgia, serif'; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.fillText(text, 512, 68);
  // weathering
  const r = rng(5);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '20,24,28' : '200,190,170'},${(r() * 0.25).toFixed(2)})`; g.fillRect(r() * 1024, r() * 128, 1 + r() * 6, 1 + r() * 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/** A harled, slate-roofed house with its front on z = 0 of its group. */
function house(parent, M, x, w, h, lit, seed, isShop = false) {
  const g = new THREE.Group(); g.position.set(x, 0, -2.6); parent.add(g);
  const r = rng(seed);
  const d = 6;
  const harl = M.harl;
  g.add(mesh(rbox(w, h, d, 0.04), harl, { pos: [0, h / 2, -d / 2], tile: 2.2 }));
  // roof: two slate slopes with a ridge
  const pitch = 0.75, half = d / 2 + 0.3, len = half / Math.cos(pitch);
  for (const s of [-1, 1]) g.add(mesh(rbox(w + 0.3, 0.1, len, 0.02), M.slate, { pos: [0, h + Math.sin(pitch) * len / 2, -d / 2 + s * (half - Math.cos(pitch) * len / 2)], rot: [s * pitch, 0, 0], tile: 1.4 }));
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, w + 0.3, 12), M.concrete, { pos: [0, h + Math.tan(pitch) * half + 0.04, -d / 2], rot: [0, 0, Math.PI / 2], tile: 1 }));
  // chimney stacks on the gables, with pots
  for (const s of [-1, 1]) {
    g.add(mesh(rbox(0.65, 1.2, 0.85, 0.03), harl, { pos: [s * (w / 2 - 0.32), h + Math.tan(pitch) * half + 0.15, -d / 2], tile: 2.2 }));
    for (const dz of [-0.18, 0.18]) g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.35, 16), plain('#7a4a3a', { rough: 0.8 }), { pos: [s * (w / 2 - 0.32), h + Math.tan(pitch) * half + 0.9, -d / 2 + dz], keepUV: true }));
  }
  const win = (wx, wy, on, ww = 0.8, wh = 1.05) => {
    // the window sits in a deep reveal with a stone sill and painted margins
    g.add(mesh(rbox(ww + 0.22, wh + 0.22, 0.04, 0.01), M.concrete, { pos: [wx, wy, 0.0], tile: 1 }));
    const sw = sashWindow(M, ww, wh, on ? { lit: on, litI: 1.1 } : { glass: '#0c1014' }); sw.position.set(wx, wy, -0.12); g.add(sw);
    g.add(mesh(rbox(ww + 0.25, 0.07, 0.2, 0.01), M.concrete, { pos: [wx, wy - wh / 2 - 0.1, 0.06], tile: 1 }));
    if (on) {
      // curtains half drawn
      for (const s of [-1, 1]) g.add(mesh(rbox(ww * 0.28, wh * 0.95, 0.02, 0.005), plain(['#6a3a2a', '#3a4a3a', '#7a6a4a'][seed % 3], { rough: 0.9, emissive: on, emissiveIntensity: 0.12 }), { pos: [wx + s * ww * 0.36, wy, -0.2], keepUV: true }));
      point(g, on, 0.8, 4, [wx, wy, 0.6]);
    }
  };
  if (isShop) {
    // shop front: painted fascia and sign, wide lit window, door under rowan and red thread
    g.add(mesh(rbox(w - 0.2, 0.55, 0.16, 0.02), M.paint_shopfront, { pos: [0, 2.85, 0.08], tile: 1.5 }));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.72, 0.36), new THREE.MeshStandardMaterial({ map: signTexture('HAUGSAY STORES', '#26364a', '#e6d8b0'), roughness: 0.6 }));
    sign.position.set(0, 2.85, 0.165); g.add(sign);
    g.add(mesh(rbox(2.1, 1.6, 0.12, 0.02), M.paint_shopfront, { pos: [-0.9, 1.45, 0.02], tile: 1.5 }));
    g.add(mesh(new THREE.PlaneGeometry(1.9, 1.4), new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#d8b078'), emissiveIntensity: 0.38, roughness: 0.1 }), { pos: [-0.9, 1.45, 0.085], keepUV: true }));
    const r2 = rng(3);
    for (let i = 0; i < 9; i++) g.add(mesh(rbox(0.14 + r2() * 0.15, 0.2 + r2() * 0.25, 0.08, 0.01), plain(['#6a4a3a', '#3a5a6a', '#8a7a4a', '#5a3a3a', '#d8d0b8'][i % 5], { rough: 0.6 }), { pos: [-1.75 + i * 0.2, 0.85 + (r2() * 0.1), 0.12], keepUV: true }));
    for (let i = 0; i < 7; i++) g.add(mesh(rbox(0.1 + r2() * 0.1, 0.12 + r2() * 0.18, 0.06, 0.01), plain(['#3a2a20', '#2a3a4a', '#6a5a3a'][i % 3], { rough: 0.6 }), { pos: [-1.7 + i * 0.26, 1.55 + r2() * 0.05, 0.11], keepUV: true }));
    g.add(mesh(rbox(1.9, 0.02, 0.12, 0.005), M.boards, { pos: [-0.9, 1.45, 0.11], tile: 1 }));
    g.add(mesh(rbox(2.2, 0.1, 0.25, 0.01), M.paint_shopfront, { pos: [-0.9, 0.6, 0.08], tile: 1.5 }));
    glow(g, '#ffd8a0', 2.0, [-0.9, 1.4, 0.4], 0.25);
    point(g, '#ffcf90', 3.5, 6, [-0.9, 1.6, 0.9], true, { size: 1024 });
    // door with glazing, lit from inside
    g.add(mesh(rbox(0.98, 2.18, 0.08, 0.015), M.paint_shopfront, { pos: [0.75, 1.09, 0.02], tile: 1.5 }));
    g.add(mesh(new THREE.PlaneGeometry(0.62, 0.92), new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#d8b880'), emissiveIntensity: 0.6 }), { pos: [0.75, 1.5, 0.065], keepUV: true }));
    // rowan sprig and red thread over the door
    const thread = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.42, 2.3, 0.14), new THREE.Vector3(0.75, 2.24, 0.16), new THREE.Vector3(1.08, 2.3, 0.14)]), 20, 0.005, 6), plain('#a01010', { rough: 0.6 }));
    g.add(thread);
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), plain('#b81c10', { rough: 0.3 })); b.position.set(0.6 + (i % 3) * 0.05 + Math.floor(i / 3) * 0.08, 2.18 - (i % 2) * 0.03, 0.17); g.add(b); }
    for (let i = 0; i < 7; i++) { const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.018), plain('#3a5a2a', { side: THREE.DoubleSide })); lf.position.set(0.52 + i * 0.07, 2.25 + Math.sin(i) * 0.03, 0.17); lf.rotation.z = (i % 2 ? 0.6 : -0.5); g.add(lf); }
    // the salt line on the step
    g.add(mesh(rbox(1.0, 0.13, 0.38, 0.02), M.concrete, { pos: [0.75, 0.065, 0.2], tile: 1 }));
    const salt = new THREE.Mesh(jitter(new THREE.BoxGeometry(0.9, 0.012, 0.035, 30, 1, 2), 0.003, 80, 2), plain('#f4f4f0', { rough: 0.95 })); salt.position.set(0.75, 0.136, 0.3); g.add(salt);
    win(-1.0, 4.0, lit ? '#e0b070' : null); win(1.0, 4.0, null);
  } else {
    const doorX = w / 4;
    win(-w / 4, 1.5, lit && r() < 0.6 ? '#e0a860' : null); win(-w / 4, 4.0, null);
    win(doorX, 4.0, lit && r() < 0.4 ? '#d8a058' : null);
    const doorM = [M.paint_door_blue, M.paint_door_green, M.paint_shopfront][seed % 3];
    g.add(mesh(rbox(0.98, 2.12, 0.08, 0.015), doorM, { pos: [doorX, 1.06, -0.02], tile: 1.2 }));
    for (const y of [0.55, 1.5]) g.add(mesh(rbox(0.7, 0.75, 0.02, 0.01), doorM, { pos: [doorX, y, 0.03], tile: 1.2 }));
    g.add(mesh(rbox(1.05, 0.12, 0.42, 0.02), M.concrete, { pos: [doorX, 0.06, 0.2], tile: 1 }));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), M.brass); knob.position.set(doorX + 0.36, 1.05, 0.06); g.add(knob);
  }
  // a rone pipe down the corner
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, h, 12), M.iron, { pos: [w / 2 - 0.1, h / 2, 0.06], tile: 0.5 }));
  return g;
}

function streetlight(parent, M, x, z, on = true, shadow = true) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const prof = [[0, 0], [0.13, 0], [0.13, 0.5], [0.09, 0.6], [0.07, 5.9], [0, 5.9]].map(([a, b]) => new THREE.Vector2(a, b));
  g.add(mesh(new THREE.LatheGeometry(prof, 16), M.iron, { tile: 0.6 }));
  const arm = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 5.8, 0), new THREE.Vector3(0, 6.1, 0.3), new THREE.Vector3(0, 6.05, 0.8)]), 16, 0.04, 8);
  g.add(mesh(arm, M.iron, { tile: 0.6 }));
  g.add(mesh(rbox(0.26, 0.12, 0.5, 0.04), M.iron, { pos: [0, 6.0, 0.85], tile: 0.6 }));
  if (!on) return g;
  g.add(mesh(rbox(0.2, 0.03, 0.4, 0.01), new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#ffae58'), emissiveIntensity: 8 }), { pos: [0, 5.93, 0.85], keepUV: true, cast: false }));
  glow(g, '#ff9a3a', 2.6, [0, 5.88, 0.85], 0.5);
  spot(g, '#ff9a48', 70, 16, 0.95, new THREE.Vector3(0, 5.85, 0.85), new THREE.Vector3(0, 0, 1.4), shadow, { size: 2048, penumbra: 0.7 });
  return g;
}

async function village({ renderer, M, night }) {
  const scene = new THREE.Scene();
  const { env } = await hdri(renderer, night ? 'moonless_golf_1k.hdr' : 'venice_sunset_1k.hdr');
  scene.environment = env; scene.environmentIntensity = night ? 0.12 : 0.35;
  if (night) {
    skyDome(scene, { top: '#04060a', hor: '#121820', cloud: '#0c1016', sun: '#000000', bright: 1 });
    scene.fog = new THREE.FogExp2('#0e1218', 0.055);
  } else {
    skyDome(scene, { sunDir: new THREE.Vector3(-0.8, 0.02, -0.4), top: '#2a3444', hor: '#8a8486', cloud: '#4a4e58', sun: '#ffb880', bright: 1 });
    scene.fog = new THREE.FogExp2('#4e5560', 0.032);
  }
  // ground: pavement, kerb, road, harbour wall, water
  scene.add(mesh(new THREE.PlaneGeometry(44, 1.8).rotateX(-Math.PI / 2), M.flags, { pos: [0, 0.12, -1.7], cast: false }));
  scene.add(mesh(rbox(44, 0.13, 0.18, 0.03), M.concrete, { pos: [0, 0.065, -0.78], tile: 1.2 }));
  const road = mesh(new THREE.PlaneGeometry(44, 5.6).rotateX(-Math.PI / 2), M.tarmac, { pos: [0, 0, 2.0], cast: false });
  if (night) { road.material = M.tarmac.clone(); road.material.onBeforeCompile = M.tarmac.onBeforeCompile; road.material.roughness = 0.75; road.material.envMapIntensity = 2.0; }
  scene.add(road);
  // white line, faded
  for (let x = -20; x < 20; x += 2.4) scene.add(mesh(new THREE.PlaneGeometry(1.2, 0.1).rotateX(-Math.PI / 2), plain('#a8a498', { rough: 0.7 }), { pos: [x, 0.004, 2.1], keepUV: true, cast: false }));
  scene.add(mesh(rbox(44, 1.0, 0.6, 0.04), M.stonewall, { pos: [0, 0.5, 5.1], tile: 1.8 }));
  scene.add(mesh(rbox(44, 0.12, 0.7, 0.03), M.concrete, { pos: [0, 1.06, 5.1], tile: 1.5 }));
  const tl = new THREE.TextureLoader();
  const wn = await tl.loadAsync('assets/waternormals.jpg'); wn.wrapS = wn.wrapT = THREE.RepeatWrapping;
  const water = new Water(new THREE.PlaneGeometry(400, 400), { textureWidth: 512, textureHeight: 512, waterNormals: wn, sunDirection: new THREE.Vector3(-0.5, 0.3, -0.5).normalize(), sunColor: night ? 0x302820 : 0x8a6a50, waterColor: 0x0a1418, distortionScale: 2.5, fog: true });
  water.rotation.x = -Math.PI / 2; water.position.set(0, -1.3, 40); water.material.uniforms.size.value = 5; scene.add(water);
  // the pier, running out past the wall
  scene.add(mesh(rbox(3.2, 1.3, 22, 0.05), M.stonewall, { pos: [9, -0.55, 16], tile: 1.8 }));
  for (let z = 6; z < 26; z += 3) scene.add(bollard(M, [7.65, 0.1, z]));
  // houses along the front
  let x = -19; let i = 0;
  const shopX = 0.2;
  for (const w of [5.5, 5, 6, 4.6, 5.4, 5, 6, 5]) {
    const isShop = Math.abs(x + w / 2 - shopX) < 2.0;
    house(scene, M, isShop ? shopX : x + w / 2, w, isShop ? 5.2 : 5.4 - (i % 2) * 0.4, true, 11 + i, isShop);
    x += w; i++;
  }
  // street furniture: wheelie bins, fish boxes and creels by the wall, the car
  for (const bx of [-4.2, -3.55, 3.4]) {
    const bin = new THREE.Group(); bin.position.set(bx, 0.12, -1.25); bin.rotation.y = (bx * 7) % 0.3; scene.add(bin);
    const bm = plain(bx > 0 ? '#22382a' : '#2a2e32', { rough: 0.5 });
    bin.add(mesh(rbox(0.58, 1.0, 0.7, 0.04), bm, { pos: [0, 0.5, 0], keepUV: true }));
    bin.add(mesh(rbox(0.62, 0.06, 0.76, 0.02), bm, { pos: [0, 1.03, 0.0], keepUV: true }));
    for (const s of [-1, 1]) bin.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), plain('#111'), { pos: [s * 0.25, 0.09, -0.36], rot: [0, 0, Math.PI / 2], keepUV: true }));
  }
  const rr = rng(77);
  for (let k = 0; k < 8; k++) scene.add(mesh(rbox(0.78, 0.4, 0.55, 0.03), plain(k % 3 ? '#2a3e56' : '#5a6a7a', { rough: 0.45 }), { pos: [-8.2 + (k % 4) * 0.8 + rr() * 0.05, 0.2 + Math.floor(k / 4) * 0.41, 4.45], rot: [0, (rr() - 0.5) * 0.1, 0], keepUV: true }));
  for (let k = 0; k < 4; k++) {
    const cr = new THREE.Group(); cr.position.set(5 + k * 0.75, 0, 4.4); cr.rotation.y = rr() * 0.4; scene.add(cr);
    const half = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16, 1, false, 0, Math.PI); half.rotateZ(Math.PI / 2);
    cr.add(mesh(half, new THREE.MeshStandardMaterial({ color: '#2a3a2a', roughness: 0.8, wireframe: true }), { pos: [0, 0.02, 0], keepUV: true }));
    cr.add(mesh(rbox(0.82, 0.03, 0.62, 0.01), M.boards, { pos: [0, 0.015, 0], tile: 1 }));
  }
  const car = new THREE.Group(); car.position.set(-6.5, 0, 0.35); scene.add(car);
  const paint = new THREE.MeshPhysicalMaterial({ color: '#2e3c46', roughness: 0.45, metalness: 0.6, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  car.add(mesh(rbox(3.9, 0.72, 1.7, 0.18, 4), paint, { pos: [0, 0.62, 0], keepUV: true }));
  car.add(mesh(rbox(2.2, 0.6, 1.5, 0.2, 4), paint, { pos: [-0.25, 1.18, 0], keepUV: true }));
  car.add(mesh(rbox(2.0, 0.44, 1.53, 0.12, 3), new THREE.MeshStandardMaterial({ color: '#0a0e12', roughness: 0.05, metalness: 0.9, emissive: new THREE.Color(night ? '#3a3020' : '#000'), emissiveIntensity: 0.4 }), { pos: [-0.25, 1.2, 0], keepUV: true }));
  for (const [a, b] of [[-1.25, 0.8], [1.25, 0.8], [-1.25, -0.8], [1.25, -0.8]]) {
    car.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 24), plain('#141414', { rough: 0.85 }), { pos: [a, 0.32, b], rot: [Math.PI / 2, 0, 0], keepUV: true }));
    car.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.23, 16), M.iron, { pos: [a, 0.32, b], rot: [Math.PI / 2, 0, 0], tile: 0.3 }));
  }
  for (const s of [-1, 1]) car.add(mesh(rbox(0.05, 0.12, 0.3, 0.02), new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color(night ? '#5a0a08' : '#2a0a08'), emissiveIntensity: 2 }), { pos: [-1.95, 0.75, s * 0.6], keepUV: true }));
  // the boat in the harbour, nobody aboard
  const boat = new THREE.Group(); boat.position.set(-3, -1.3, 9.5); boat.rotation.y = 0.2; scene.add(boat);
  const hull = new THREE.CylinderGeometry(1.2, 0.8, 7, 16, 1, false, 0, Math.PI); hull.rotateX(Math.PI / 2); hull.rotateZ(Math.PI); hull.scale(1, 0.9, 1);
  boat.add(mesh(hull, M.paint_door_blue, { pos: [0, 0.9, 0], tile: 2 }));
  boat.add(mesh(rbox(1.6, 1.3, 1.8, 0.06), M.shipwhite, { pos: [0, 1.55, 1.2], tile: 2 }));
  boat.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 4, 8), M.iron, { pos: [0, 3, -0.5], tile: 0.5 }));
  scene.add(new THREE.HemisphereLight(night ? '#1e2838' : '#7a86a0', night ? '#080604' : '#3a3028', night ? 0.25 : 0.7));
  return { scene, shopX };
}

export async function dialogue(ctx) {
  const { M } = ctx;
  const { scene, shopX } = await village({ ...ctx, night: false });
  // dusk: the sun already gone behind the hill, a cold sky light, sodium lights just come on
  const dusk = shadowLight(new THREE.DirectionalLight('#9aa4ba', 0.8), 2048, 12);
  dusk.position.set(-10, 14, 18); dusk.target.position.set(0, 0, 0); scene.add(dusk); scene.add(dusk.target);
  streetlight(scene, M, -3.2, -1.2, true, false); streetlight(scene, M, 6.2, -1.2, true, false);
  point(scene, '#ffa860', 5, 9, [shopX + 3.0, 3.2, 1.8]); // sodium spill from across the road

  // Morag, the old neighbour, on the shop step; William with his holdall
  const morag = await person('morag', M); morag.position.set(shopX + 0.75, 0.13, -2.15); morag.rotation.y = 0.92; scene.add(morag);
  const bag = morag.userData.joint('rHand', [0.0, -0.09, 0.0]);
  const bm = new THREE.BoxGeometry(0.26, 0.3, 0.13, 6, 6, 3); jitter(bm, 0.008, 20, 3);
  bag.add(mesh(bm, plain('#cfcabb', { rough: 0.7 }), { pos: [0, -0.2, 0], keepUV: true }));
  for (const s of [-1, 1]) bag.add(mesh(new THREE.TorusGeometry(0.05, 0.006, 6, 12, Math.PI), plain('#cfcabb'), { pos: [s * 0.03, -0.05, 0], rot: [0, Math.PI / 2, 0], keepUV: true }));
  const w = await person('w_dialogue', M); w.position.set(shopX + 2.05, 0.0, -1.0); w.rotation.y = -2.25; scene.add(w);
  scene.add(holdall(M, [shopX + 2.35, 0.0, -0.55], -0.6));
  // the islander across the road who has stopped to listen to the ground
  const listener = await person('listener', M); listener.position.set(-4.5, 0, 3.9); listener.rotation.y = 0.4; scene.add(listener);

  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 1200);
  camera.position.set(shopX + 3.45, 1.78, -0.45);
  camera.lookAt(shopX + 0.8, 1.42, -2.1);
  return {
    scene, camera, look: { exposure: 1.1 },
    ui: {
      dialogue: {
        name: 'Morag Rendall',
        text: "You'll be Alan's boy. You've his walk. Service is at ten, and low water's at nine, so don't you be late crossing back. The Brough doesn't wait on anybody.",
        options: ['How did he die?', 'Why is there salt on your step?', 'I should get to the house.'],
      },
      phoneToast: ['Mum  -  1 bar', 'Did you get there ok? x'],
    },
  };
}

export async function combat(ctx) {
  const { M } = ctx;
  const { scene } = await village({ ...ctx, night: true });
  streetlight(scene, M, 0.1, -1.2, true, true); streetlight(scene, M, 9.2, -1.2, true, false); streetlight(scene, M, -12, -1.2, true, false);
  rain(scene, new THREE.Vector3(0, 3, 1.5), new THREE.Vector3(22, 7, 12), 2600, new THREE.Vector3(0.3, -1, 0.15), 0.28, 0x9aa6b0, 0.28);
  // puddles: dark mirrors holding the sodium light
  const pud = (x, z, sx, sz) => {
    const g = new THREE.CircleGeometry(1, 40); g.rotateX(-Math.PI / 2); g.scale(sx, 1, sz); jitter(g, 0.0, 1, 1);
    scene.add(mesh(g, new THREE.MeshStandardMaterial({ color: '#05070a', roughness: 0.03, metalness: 0.9 }), { pos: [x, 0.006, z], keepUV: true, cast: false }));
  };
  pud(-0.4, 1.2, 1.3, 0.5); pud(1.8, 2.5, 0.8, 0.35); pud(-2.4, 2.9, 0.9, 0.3); pud(3.6, 1.0, 0.6, 0.3);

  // William: sword up in a deflect, phone torch held out in the off hand
  const w = await person('w_combat', M); w.position.set(0.9, 0, 1.4); w.rotation.y = -Math.PI / 2 - 0.15; scene.add(w);
  const sj = w.userData.joint('rHand', [0.018, -0.088, 0.0]);
  const sw = sword(M); sw.rotation.x = -Math.PI / 2; sj.add(sw);
  const pj = w.userData.joint('lHand', [-0.02, -0.09, 0.02]);
  const ph = phone(); ph.rotation.set(Math.PI / 2, 0, Math.PI / 2); pj.add(ph);
  scene.updateMatrixWorld(true);
  const hand = new THREE.Vector3(); pj.getWorldPosition(hand);
  spot(scene, '#e6eeff', 16, 14, 0.42, hand.clone().add(new THREE.Vector3(-0.08, 0, 0)), new THREE.Vector3(-4, -0.2, 0.5), true, { size: 2048, penumbra: 0.35 });
  beam(scene, '#dfe8ff', hand.clone().add(new THREE.Vector3(-0.08, 0, 0)), new THREE.Vector3(-4.2, 0.4, 0.6), 0.03, 1.1, 0.06);
  glow(scene, '#e8f0ff', 0.28, [hand.x - 0.08, hand.y, hand.z], 1.2);
  point(scene, '#8aa8d0', 3, 4, [2.4, 2.4, 0.2]); // cold rim from the shop side so he reads against the dark

  // the Unburied: islanders the dead have taken
  const fisher = await person('fisher', M); fisher.position.set(-0.75, 0, 1.25); fisher.rotation.y = Math.PI / 2 + 0.05; scene.add(fisher);
  const gj = fisher.userData.joint('rHand', [-0.018, -0.088, 0]);
  const gaff = new THREE.Group(); gaff.rotation.x = Math.PI / 2; gj.add(gaff);
  gaff.add(mesh(new THREE.CylinderGeometry(0.018, 0.02, 1.5, 10), M.pew, { pos: [0, 0.35, 0], tile: 0.6 }));
  const hook = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.08, 0), new THREE.Vector3(0, 1.22, 0), new THREE.Vector3(0.1, 1.27, 0), new THREE.Vector3(0.15, 1.18, 0)]), 16, 0.01, 8);
  gaff.add(mesh(hook, M.iron, { tile: 0.3 }));
  // contact: the deflect, sparks
  scene.updateMatrixWorld(true);
  const tip = new THREE.Vector3(0, 0.75, 0); sw.localToWorld(tip);
  const ghook = new THREE.Vector3(0, 1.0, 0); gaff.localToWorld(ghook);
  const contact = tip.clone().lerp(ghook, 0.5);
  glow(scene, '#fff2c8', 0.5, contact.toArray(), 1.4);
  glow(scene, '#ffd890', 1.6, contact.toArray(), 0.35);
  const r = rng(5);
  const sparkM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd8a0').multiplyScalar(6) });
  for (let i = 0; i < 26; i++) {
    const d = new THREE.Vector3(r() - 0.6, r() - 0.25, r() - 0.5).normalize();
    const len = 0.04 + r() * 0.12;
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, len, 4), sparkM);
    s.position.copy(contact).addScaledVector(d, 0.08 + r() * 0.45); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); scene.add(s);
  }
  point(scene, '#ffe0a0', 1.5, 2.5, contact.toArray());

  // a second one in hi-vis, shambling in
  const hv = await person('hivis', M); hv.position.set(-2.9, 0, -0.1); hv.rotation.y = 1.2; scene.add(hv);
  // a third, broken and kneeling, cold light seeping out of it
  const kn = await person('kneel', M); kn.position.set(-2.9, 0, 2.3); kn.rotation.y = 0.9; scene.add(kn);
  point(scene, '#a8d0ff', 2.0, 3, [-2.7, 0.9, 2.5]);
  glow(scene, '#bfe0ff', 0.9, [-2.75, 0.85, 2.45], 0.6);
  // blood on the road: William is hurt
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.025 + r() * 0.06, 12).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#7a0a08', roughness: 0.15 }));
    b.position.set(-0.1 + i * 0.07 + r() * 0.08, 0.007 + i * 0.0002, 1.25 + r() * 0.4); b.scale.set(1, 1, 0.6 + r()); b.receiveShadow = true; scene.add(b);
  }
  // far off: a woman under the last light, standing very still
  const watcher = await person('watcher', M); watcher.position.set(-12.6, 0.12, -1.4); watcher.rotation.y = 1.2; scene.add(watcher);

  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 1200);
  camera.position.set(0.7, 2.1, 4.7);
  camera.lookAt(-0.35, 1.25, 1.1);
  return { scene, camera, look: { exposure: 1.2 }, ui: { hud: { health: 0.58, resolve: 3, item: 'PHONE TORCH  41%' } } };
}
