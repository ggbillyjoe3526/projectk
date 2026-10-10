import * as THREE from 'three';
import { softTex, T, rng, mat, texMat, emissive, box, wbox, cyl, plane, glow, beam, point, spot, rain, human, pose, place, sword, phone } from '../lib.js';

export function skyDome(scene, top, horizon, below = horizon) {
  const g = new THREE.SphereGeometry(80, 16, 12);
  const cols = []; const p = g.attributes.position;
  const ct = new THREE.Color(top), ch = new THREE.Color(horizon), cb = new THREE.Color(below);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 80;
    const c = y >= 0 ? ch.clone().lerp(ct, Math.pow(y, 0.6)) : ch.clone().lerp(cb, Math.min(1, -y * 4));
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  scene.add(m);
  return m;
}

function signTexture(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 128, 16);
  g.fillStyle = fg; g.font = 'bold 11px monospace'; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.fillText(text, 64, 9);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A harled, slate-roofed house with its front on z = 0 of its group. */
function house(parent, x, w, h, colour, lit, seed, isShop = false) {
  const g = new THREE.Group(); g.position.set(x, 0, -2.6); parent.add(g);
  const r = rng(seed);
  const d = 6;
  wbox(w, h, d, texMat(T.harl([1, 1], colour)), 0, h / 2, -d / 2, g, 1.4);
  // roof: two slate slopes
  const pitch = 0.75, half = d / 2 + 0.25, len = half / Math.cos(pitch);
  for (const s of [-1, 1]) {
    const roof = wbox(w + 0.3, 0.12, len, texMat(T.slate([1, 1])), 0, h + Math.sin(pitch) * len / 2, -d / 2 + s * (half - Math.cos(pitch) * len / 2), g, 0.9);
    roof.rotation.x = s * pitch;
  }
  // chimney stacks on the gables
  for (const s of [-1, 1]) {
    wbox(0.6, 1.1, 0.8, texMat(T.harl([1, 1], colour)), s * (w / 2 - 0.3), h + Math.tan(pitch) * half + 0.1, -d / 2, g, 1);
    cyl(0.08, 0.08, 0.3, 6, mat('#6a4a3a'), g, s * (w / 2 - 0.3), h + Math.tan(pitch) * half + 0.8, -d / 2);
  }
  const frame = mat('#d6d2c6');
  const win = (wx, wy, on, ww = 0.8, wh = 1.0) => {
    box(ww + 0.12, wh + 0.12, 0.06, frame, wx, wy, 0.0, g);
    const pane = box(ww, wh, 0.05, on ? emissive(on, 0.55) : mat('#151a20'), wx, wy, 0.02, g);
    box(0.04, wh, 0.07, frame, wx, wy, 0.03, g); box(ww, 0.04, 0.07, frame, wx, wy, 0.03, g);
    box(ww + 0.2, 0.06, 0.16, mat('#8a8478'), wx, wy - wh / 2 - 0.08, 0.06, g);
    if (on) glow(on, 1.0, g, wx, wy, 0.2, 0.35);
  };
  if (isShop) {
    // shop front: wide lit window, painted fascia, door under rowan and red thread
    wbox(w, 0.5, 0.15, mat('#27384a'), 0, 2.85, 0.08, g);
    const sign = plane(w * 0.7, 0.3, new THREE.MeshLambertMaterial({ map: signTexture('HAUGSAY STORES', '#27384a', '#e8dcb8') }), g); sign.position.set(0, 2.85, 0.17);
    box(2.0, 1.5, 0.05, emissive('#e8c890', 0.8), -0.9, 1.45, 0.02, g);
    for (let i = 0; i < 6; i++) box(0.2 + r() * 0.2, 0.3 + r() * 0.2, 0.05, mat(['#6a4a3a', '#3a5a6a', '#8a7a4a', '#5a3a3a'][i % 4]), -1.7 + i * 0.32, 1.05, 0.05, g);
    box(2.1, 0.08, 0.2, frame, -0.9, 0.66, 0.06, g);
    glow('#ffd8a0', 2.4, g, -0.9, 1.4, 0.4, 0.35);
    // door with glazing, lit from inside
    box(0.95, 2.15, 0.06, mat('#27384a'), 0.75, 1.08, 0.02, g);
    box(0.6, 0.9, 0.07, emissive('#d8b880', 0.55), 0.75, 1.5, 0.03, g);
    // rowan sprig and red thread over the door
    box(0.6, 0.012, 0.012, emissive('#a01818', 0.9), 0.75, 2.27, 0.12, g);
    for (let i = 0; i < 5; i++) box(0.05, 0.05, 0.05, emissive('#c0281c', 0.8), 0.6 + i * 0.07, 2.2 - (i % 2) * 0.04, 0.13, g);
    for (let i = 0; i < 4; i++) { const lf = box(0.14, 0.03, 0.05, mat('#3a5a2a'), 0.55 + i * 0.12, 2.26, 0.12, g); lf.rotation.z = (i % 2 ? 0.5 : -0.5); }
    // the salt line on the step
    box(0.95, 0.12, 0.35, mat('#8a8478'), 0.75, 0.06, 0.2, g);
    box(0.85, 0.012, 0.03, mat('#f0f0ea'), 0.75, 0.125, 0.3, g);
    win(-1.0, 4.0, lit ? '#e0b070' : null); win(1.0, 4.0, null);
  } else {
    win(-w / 4, 1.5, lit && r() < 0.6 ? '#e0a860' : null); win(-w / 4, 4.0, null);
    win(w / 4, 4.0, lit && r() < 0.4 ? '#d8a058' : null);
    box(0.95, 2.1, 0.06, mat(['#4a2a2a', '#2a3a2a', '#2a2a3a'][seed % 3]), w / 4, 1.05, 0.02, g);
    box(1.0, 0.1, 0.4, mat('#8a8478'), w / 4, 0.05, 0.2, g);
  }
  return g;
}

function streetlight(scene, x, z, on = true, shadow = true) {
  cyl(0.06, 0.08, 6, 6, mat('#3a3e40'), scene, x, 3, z);
  box(0.9, 0.08, 0.1, mat('#3a3e40'), x, 6.0, z + 0.35).rotation.y = Math.PI / 2;
  box(0.25, 0.1, 0.45, mat('#2a2c2e'), x, 5.95, z + 0.75);
  if (!on) return;
  box(0.18, 0.04, 0.35, emissive('#ffb060', 3), x, 5.89, z + 0.75);
  glow('#ff9a3a', 2.2, scene, x, 5.8, z + 0.75, 0.9);
  spot('#ff9a40', 42, 14, 0.85, scene, new THREE.Vector3(x, 5.8, z + 0.75), new THREE.Vector3(x, 0, z + 1.4), shadow);
}

function village({ night }) {
  const scene = new THREE.Scene();
  if (night) {
    skyDome(scene, '#05070c', '#141a22');
    scene.fog = new THREE.FogExp2('#0d1116', 0.045);
  } else {
    skyDome(scene, '#2a3442', '#7a7a80', '#4a5058');
    scene.fog = new THREE.FogExp2('#4a525c', 0.03);
  }
  // ground: pavement, kerb, road, harbour wall, water
  const pave = plane(40, 1.8, texMat(T.flags([1, 1], '#5e5c56')), scene, 1.6); pave.rotation.x = -Math.PI / 2; pave.position.set(0, 0.1, -1.7);
  box(40, 0.12, 0.15, mat('#77746c'), 0, 0.06, -0.78);
  const road = plane(40, 5.6, texMat(T.tarmac([1, 1])), scene, 1.2); road.rotation.x = -Math.PI / 2; road.position.set(0, 0, 2.0);
  // white line + double yellows faded
  for (let x = -18; x < 18; x += 2.4) box(1.2, 0.01, 0.1, mat('#b8b4a6'), x, 0.005, 2.1, scene);
  wbox(40, 1.0, 0.6, texMat(T.stone([1, 1], 1)), 0, 0.5, 5.1, scene, 1.0);
  const sea = plane(120, 70, texMat(T.water([1, 1])), scene, 4); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -1.3, 40);
  // the pier, running out past the wall
  wbox(3.2, 1.2, 22, texMat(T.stone([1, 1], 1)), 9, -0.6, 16, scene, 1.2);
  for (let z = 6; z < 26; z += 3) cyl(0.15, 0.18, 0.5, 6, mat('#2a2a28'), scene, 7.6, 0.25, z);
  // houses along the front
  const cols = ['#b8b2a4', '#a8aca6', '#c4b8a2', '#9ea4a4', '#b4aa98'];
  let x = -19;
  let i = 0;
  const shopX = 0.2;
  for (const w of [5.5, 5, 6, 4.6, 5.4, 5, 6]) {
    const isShop = Math.abs(x + w / 2 - shopX) < 2.0;
    house(scene, isShop ? shopX : x + w / 2, w, isShop ? 5.2 : 5.4 - (i % 2) * 0.4, cols[i % cols.length], true, 11 + i, isShop);
    x += w; i++;
  }
  // street furniture: bins, a bench, creels and fish boxes by the wall, the car with its light on
  for (const bx of [-4.2, -3.6, 3.4]) { box(0.6, 1.05, 0.7, mat(bx > 0 ? '#2a4a2a' : '#3a3e40'), bx, 0.62, -1.2); box(0.64, 0.06, 0.74, mat('#2a2e30'), bx, 1.16, -1.2); }
  for (let k = 0; k < 7; k++) box(0.75, 0.42, 0.55, mat(k % 3 ? '#2a3a4a' : '#3a5068'), -8 + (k % 4) * 0.8, 0.21 + Math.floor(k / 4) * 0.43, 4.45);
  for (let k = 0; k < 4; k++) { const c = box(0.6, 0.45, 0.9, mat('#3a3a2e'), 5 + k * 0.7, 0.23, 4.4); c.material.wireframe = false; }
  const car = new THREE.Group(); car.position.set(-6.5, 0, 0.35); scene.add(car);
  box(3.8, 0.75, 1.65, mat('#3a4650'), 0, 0.6, 0, car);
  box(0.9, 0.2, 1.6, mat('#3a4650'), 1.4, 1.05, 0, car).rotation.z = -0.15;
  box(2.1, 0.55, 1.5, mat('#2e3a42'), -0.3, 1.25, 0, car);
  box(2.0, 0.42, 1.52, emissive(night ? '#8a7c5c' : '#2a3036', night ? 0.3 : 1), -0.3, 1.27, 0, car);
  if (night) point('#ffe6b0', 1.2, 3, car, -0.3, 1.3, 0);
  for (const [a, b] of [[-1.2, 0.8], [1.2, 0.8], [-1.2, -0.8], [1.2, -0.8]]) { const wh = cyl(0.33, 0.33, 0.22, 8, mat('#151515'), car, a, 0.33, b); wh.rotation.x = Math.PI / 2; }
  // the boat in the harbour, nobody aboard, engine still warm
  const boat = new THREE.Group(); boat.position.set(-3, -1.2, 9); boat.rotation.y = 0.2; scene.add(boat);
  box(2.4, 1.0, 7, mat('#2a4a6a'), 0, 0.4, 0, boat); box(1.6, 1.2, 1.8, mat('#d8d4c8'), 0, 1.5, 1.2, boat); cyl(0.05, 0.05, 4, 4, mat('#888'), boat, 0, 3, 0);
  scene.add(new THREE.HemisphereLight(night ? '#28344a' : '#8a96a8', night ? '#0a0806' : '#3a342c', night ? 0.6 : 1.3));
  return { scene, shopX };
}

const WILLIAM = { coat: '#24272b', coatLen: 'long', shirt: '#d4d0c4', tie: '#101012', trousers: '#1c1d20', skin: '#c49a80', hair: '#2a221c' };

export function dialogue() {
  const { scene, shopX } = village({ night: false });
  // dusk: the sun already gone behind the hill, a cold sky light, sodium lights just come on
  const dusk = new THREE.DirectionalLight('#b0b8c8', 0.9);
  dusk.position.set(-10, 14, 18); dusk.target.position.set(0, 0, 0); dusk.castShadow = true;
  dusk.shadow.mapSize.set(2048, 2048); Object.assign(dusk.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); dusk.shadow.bias = -0.001;
  scene.add(dusk); scene.add(dusk.target);
  streetlight(scene, -3.2, -1.2, true, false); streetlight(scene, 6.2, -1.2, true, false);
  point('#ffcf90', 6, 6, scene, shopX - 0.9, 1.6, -1.6, true);
  point('#ffa860', 7, 9, scene, shopX + 3.0, 3.2, 1.8, false); // sodium spill from across the road

  // Morag, the old neighbour, on the shop step; William with his holdall
  const morag = human({ coat: '#4a3e3a', coatLen: 'long', shirt: null, trousers: '#2e2a28', skin: '#c8a48c', hair: '#c8c4bc', hairStyle: 'scarf', scarf: '#5a4a5c', build: 0.95, scale: 0.94 });
  place(morag, scene, shopX + 0.75, 0.12, -2.05, 0.92);
  pose(morag, { spine: [0.1, 0, 0], head: [-0.05, 0.1, 0], lSh: [-0.2, 0, 0.1], lEl: [-0.5, 0, 0], rSh: [-0.6, 0.3, -0.1], rEl: [-1.4, 0, 0] });
  // a shopping bag in her right hand
  box(0.25, 0.3, 0.12, mat('#d8d4c4'), shopX + 0.62, 0.62, -1.9, scene);
  const w = human(WILLIAM);
  place(w, scene, shopX + 2.05, 0.1, -1.05, -2.25);
  pose(w, { head: [0.1, -0.15, 0], lSh: [0.05, 0, 0.08], lEl: [-0.2, 0, 0], rSh: [0.0, 0, -0.1], rEl: [-0.15, 0, 0] });
  // holdall
  const bag = box(0.55, 0.3, 0.28, mat('#2a2e34'), 0, 0, 0); scene.add(bag);
  bag.position.set(shopX + 2.25, 0.27, -0.6); bag.rotation.y = -0.6;
  // the islander across the road who has stopped to listen to the ground
  const listener = human({ coat: '#3a4a3a', coatLen: 'short', shirt: null, trousers: '#2a2c2e', skin: '#c09a80', hairStyle: 'cap', capColor: '#3a3a36', scale: 1.0 });
  place(listener, scene, -4.5, 0.0, 3.9, 0.4);
  pose(listener, { spine: [0.35, 0, 0], neck: [0.3, 0, 0], head: [0.5, 0, 0.2], lSh: [0, 0, 0.1], rSh: [0, 0, -0.1] });

  const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 200);
  camera.position.set(shopX + 3.3, 2.5, 2.2);
  camera.lookAt(shopX + 1.55, 1.2, -1.6);
  return {
    scene, camera, exposure: 1.15,
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

export function combat() {
  const { scene } = village({ night: true });
  streetlight(scene, 0.1, -1.2, true, true); streetlight(scene, 9.2, -1.2, true, false); streetlight(scene, -12, -1.2, true, false);
  rain(scene, new THREE.Vector3(0, 3, 1.5), new THREE.Vector3(22, 7, 12), 1300, new THREE.Vector3(0.3, -1, 0.15), 0.22, 0x8a96a0, 0.32);
  // puddles: dark glossy patches holding the sodium light
  const pud = (x, z, sx, sz, bright) => {
    const m = plane(sx, sz, new THREE.MeshBasicMaterial({ map: softTex(), color: new THREE.Color('#ff9a40').multiplyScalar(bright), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), scene);
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.012, z);
  };
  pud(-0.4, 1.0, 2.2, 1.0, 0.5); pud(1.6, 2.4, 1.4, 0.6, 0.25); pud(-2.2, 2.9, 1.6, 0.6, 0.2);

  // William: sword up in a deflect, phone torch held out in the off hand
  const w = human(WILLIAM);
  place(w, scene, 0.9, 0, 1.4, -Math.PI / 2 - 0.15);
  pose(w, {
    hips: [0, 0.2, 0], spine: [0.15, 0.25, 0], head: [0.05, -0.2, 0],
    lHip: [-0.5, 0, 0.1], lKnee: [0.6, 0, 0], rHip: [0.35, 0, -0.08], rKnee: [0.25, 0, 0],
    rSh: [-1.9, 0.3, -0.35], rEl: [-0.7, 0, 0], lSh: [-1.05, -0.3, 0.2], lEl: [-0.25, 0, 0],
  });
  w.userData.j.hips.position.y = 0.9;
  point('#8aa8d0', 5, 4, scene, 2.4, 2.4, 0.2); // cold rim from the shop side so he reads against the dark
  const sw = sword(w.userData.j.rHand); sw.position.y = -0.06; sw.rotation.set(-1.5, 0, 1.3);
  const ph = phone(w.userData.j.lHand); ph.position.set(0, -0.08, 0.03); ph.rotation.x = -1.2;
  scene.updateMatrixWorld(true);
  const hand = new THREE.Vector3(); w.userData.j.lHand.getWorldPosition(hand);
  spot('#dfe8ff', 45, 12, 0.4, scene, hand.clone().add(new THREE.Vector3(-0.1, 0, 0)), new THREE.Vector3(-4, -0.4, 0.4), true);
  beam('#dfe8ff', hand.clone().add(new THREE.Vector3(-0.08, 0, 0)), new THREE.Vector3(-4.2, 0.4, 0.5), 1.3, 0.05, scene);
  glow('#e8f0ff', 0.22, scene, hand.x - 0.08, hand.y, hand.z, 1.2);

  // the Unburied: islanders the dead have taken
  const eyes = '#cfe6ff';
  const fisher = human({ coat: '#8a7224', coatLen: 'long', shirt: null, trousers: '#8a7224', skin: '#a8b0aa', hair: '#3a3430', sou: '#8a7224', hairStyle: 'short', eyes, boots: '#1a1a1a', build: 1.1, scale: 1.04 });
  place(fisher, scene, -0.75, 0, 1.25, Math.PI / 2 + 0.05);
  pose(fisher, {
    spine: [0.35, 0, 0.1], neck: [-0.1, 0, 0], head: [-0.25, 0, 0.35],
    lHip: [-0.6, 0, 0], lKnee: [0.5, 0, 0], rHip: [0.4, 0, 0], rKnee: [0.4, 0, 0],
    rSh: [-2.7, 0, -0.2], rEl: [-0.5, 0, 0], lSh: [-0.9, 0, 0.3], lEl: [-0.4, 0, 0],
  });
  fisher.userData.j.hips.position.y = 0.88;
  // gaff hook coming down
  const gaff = new THREE.Group(); fisher.userData.j.rHand.add(gaff);
  cyl(0.02, 0.02, 1.4, 4, mat('#5a4a3a'), gaff, 0, -0.5, 0);
  box(0.02, 0.18, 0.02, mat('#8a8a88'), 0.06, -1.2, 0, gaff).rotation.z = 0.6;
  gaff.rotation.set(-1.2, 0, 0);
  // contact: the deflect
  scene.updateMatrixWorld(true);
  const tip = new THREE.Vector3(); sw.children[3].getWorldPosition(tip);
  const contact = tip.clone().lerp(new THREE.Vector3().setFromMatrixPosition(fisher.userData.j.rHand.matrixWorld), 0.35);
  glow('#fff2c8', 0.45, scene, contact.x, contact.y, contact.z, 1.3);
  glow('#ffd890', 0.25, scene, contact.x, contact.y, contact.z, 2.5);
  const r = rng(5);
  for (let i = 0; i < 18; i++) {
    const d = new THREE.Vector3(r() - 0.6, r() - 0.2, r() - 0.5).normalize().multiplyScalar(0.15 + r() * 0.5);
    const s = box(0.025, 0.025, 0.025, emissive('#ffe2a0', 3), contact.x + d.x, contact.y + d.y, contact.z + d.z, scene); s.castShadow = false;
  }
  point('#ffe0a0', 1.2, 2, scene, contact.x, contact.y, contact.z);

  // a second one in hi-vis, shambling in
  const hv = human({ coat: '#2a2c30', coatLen: 'none', shirt: null, trousers: '#25282c', skin: '#a6aea8', hivis: '#d8c818', hairStyle: 'bald', hair: '#6a6660', eyes, scale: 1.0 });
  place(hv, scene, -2.9, 0, -0.1, 1.2);
  pose(hv, { spine: [0.25, 0, -0.15], head: [0.4, 0, -0.5], lSh: [-0.3, 0, 0.1], lEl: [-0.2, 0, 0], rSh: [-0.7, 0, -0.1], rEl: [-0.6, 0, 0], lHip: [-0.4, 0, 0], lKnee: [0.5, 0, 0], rHip: [0.2, 0, 0] });
  // a third, broken and kneeling, cold light seeping out of it
  const kn = human({ coat: '#3e3a44', coatLen: 'long', shirt: null, trousers: '#2a2a2e', skin: '#a6aea8', hair: '#5a5048', hairStyle: 'long', eyes, scale: 0.95 });
  place(kn, scene, -2.9, 0, 2.3, 0.9);
  kn.userData.j.hips.position.y = 0.45;
  pose(kn, { spine: [0.6, 0, 0], head: [0.6, 0, 0], lHip: [-1.4, 0, 0], lKnee: [2.6, 0, 0], rHip: [-0.2, 0, 0], rKnee: [2.4, 0, 0], lSh: [0.1, 0, 0.2], rSh: [0.1, 0, -0.2] });
  scene.updateMatrixWorld(true);
  const chest = new THREE.Vector3(); kn.userData.j.spine.getWorldPosition(chest);
  glow('#bfe0ff', 0.8, scene, chest.x, chest.y + 0.25, chest.z + 0.1, 1.0);
  point('#a8d0ff', 2.5, 4, scene, chest.x, chest.y + 0.3, chest.z + 0.2);
  // blood on the road: William is hurt
  for (let i = 0; i < 9; i++) { const b = plane(0.04 + r() * 0.08, 0.04 + r() * 0.07, mat('#5a0808'), scene); b.rotation.x = -Math.PI / 2; b.position.set(1.1 + i * 0.12 + r() * 0.1, 0.013 + i * 0.0005, 1.5 + r() * 0.3); }
  // far off: a woman under the last light, standing very still
  const watcher = human({ coat: '#2a2a30', coatLen: 'long', shirt: null, skin: '#a6aea8', hair: '#1a1a1a', hairStyle: 'long', eyes, scale: 0.92 });
  place(watcher, scene, -12.6, 0.1, -1.4, 1.2);
  pose(watcher, { head: [0.0, 0, 0.4] });

  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 200);
  camera.position.set(0.7, 3.3, 5.9);
  camera.lookAt(-0.3, 1.0, 1.0);
  return {
    scene, camera, exposure: 1.25,
    ui: { hud: { health: 0.58, resolve: 3, item: 'PHONE TORCH  41%' } },
  };
}
