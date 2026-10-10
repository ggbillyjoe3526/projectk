import * as THREE from 'three';
import { T, rng, mat, texMat, emissive, box, wbox, cyl, plane, glow, beam, point, rain, human, pose, place } from '../lib.js';
import { skyDome } from './village.js';

/** The crossing: the forward deck of a small island ferry, Haugsay ahead under a winter sky. */
export function ferry() {
  const scene = new THREE.Scene();
  skyDome(scene, '#3a4452', '#b8a890', '#5a6670');
  scene.fog = new THREE.FogExp2('#8a8e90', 0.0065);
  const r = rng(9);

  // the sea, with whitecaps
  const sea = plane(400, 400, texMat(T.water([1, 1]), new THREE.Color(1.6, 1.7, 1.8), { emissive: new THREE.Color('#1e2a32') }), scene, 5); sea.rotation.x = -Math.PI / 2; sea.position.y = -3.2;
  for (let i = 0; i < 70; i++) {
    const c = plane(0.4 + r() * 1.0, 0.12 + r() * 0.12, emissive('#b8bcb8', 0.4), scene);
    c.rotation.x = -Math.PI / 2; c.position.set((r() - 0.5) * 120, -3.15, -r() * 120 + 6);
  }
  // Haugsay ahead: low green hills, dark cliffs, the Brough and its lighthouse off the near point
  const land = (x, z, sx, sy, sz, col) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat(col)); m.scale.set(sx, sy, sz); m.position.set(x, -3.2, z); m.receiveShadow = true; scene.add(m); return m; };
  land(-30, -95, 60, 14, 22, '#4a5640'); land(25, -110, 70, 18, 26, '#46523e'); land(-75, -120, 50, 22, 20, '#525c48');
  land(5, -80, 30, 7, 12, '#56603f');
  for (let i = 0; i < 14; i++) box(4 + r() * 6, 6 + r() * 4, 3, mat('#3a3a38'), -45 + i * 6, -1.5, -72 - r() * 3, scene);
  // the Brough: a small islet with the white tower and the cottage
  land(-14, -58, 7, 2.6, 5, '#4e5a44');
  cyl(0.7, 0.9, 7, 8, mat('#e8e6de'), scene, -14.5, 1.6, -58.5);
  cyl(0.8, 0.8, 0.9, 8, mat('#2a2a2a'), scene, -14.5, 5.5, -58.5);
  box(0.9, 0.5, 0.9, emissive('#fff4d0', 2.5), -14.5, 5.4, -58.5, scene);
  glow('#fff0c8', 5, scene, -14.5, 5.4, -58.2, 0.9);
  beam('#fff4d8', new THREE.Vector3(-14.5, 5.4, -58.5), new THREE.Vector3(10, 4.0, -40), 4.0, 0.06, scene);
  box(3, 1.6, 2, mat('#cfcac0'), -11.8, -0.3, -57.5, scene); box(3.2, 0.9, 2.2, mat('#3a3e42'), -11.8, 0.9, -57.5, scene);
  // the village along the shore, a few lights already on
  for (let i = 0; i < 12; i++) {
    const hx = 2 + i * 2.6, hz = -78 + (i % 3);
    box(2.2, 1.6, 1.6, mat(['#c8c2b4', '#b8bcb6', '#ccc2ae'][i % 3]), hx, -1.6, hz, scene);
    box(2.3, 0.6, 1.7, mat('#3a3e42'), hx, -0.5, hz, scene);
    if (i % 3 === 0) glow('#ffb860', 0.8, scene, hx, -1.4, hz + 0.9, 0.9);
  }
  // gulls
  for (let i = 0; i < 7; i++) {
    const gx = -6 + r() * 14, gy = 4 + r() * 5, gz = -12 - r() * 18;
    for (const s of [-1, 1]) { const wng = box(0.35, 0.02, 0.08, emissive('#e8e8e4', 0.6), gx + s * 0.15, gy, gz); wng.rotation.z = s * 0.35; scene.add(wng); }
  }

  // the ferry's forward deck: painted steel, bulwarks, rails, the car-deck bow door below
  const deckM = texMat(T.paint([1, 1], '#4e6a5a', 0.15, 'deck'));
  const whiteM = texMat(T.paint([1, 1], '#d9d6cc', 0.45, 'hull'));
  const deck = new THREE.Group(); scene.add(deck);
  // deck shape: tapering to the bow
  const shape = new THREE.Shape();
  shape.moveTo(-4.2, 6); shape.lineTo(-4.2, -2); shape.lineTo(-2.6, -7.5); shape.lineTo(0, -9.5); shape.lineTo(2.6, -7.5); shape.lineTo(4.2, -2); shape.lineTo(4.2, 6); shape.closePath();
  const dg = new THREE.ShapeGeometry(shape); dg.rotateX(Math.PI / 2);
  const uv = dg.attributes.uv; const pos = dg.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 1.4, pos.getZ(i) / 1.4);
  const dm = new THREE.Mesh(dg, deckM); dm.receiveShadow = true; deck.add(dm);
  // hull sides below the deck edge
  const pts = [[-4.2, 6], [-4.2, -2], [-2.6, -7.5], [0, -9.5], [2.6, -7.5], [4.2, -2], [4.2, 6]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(z1 - z0, x1 - x0);
    const bw = wbox(len, 1.0, 0.12, whiteM, (x0 + x1) / 2, 0.5, (z0 + z1) / 2, deck, 1); bw.rotation.y = -ang;
    const hull = wbox(len, 3.2, 0.2, mat('#1e2a36'), (x0 + x1) / 2, -1.7, (z0 + z1) / 2, deck, 1); hull.rotation.y = -ang;
    // rail on top of the bulwark
    const rail = cyl(0.04, 0.04, len, 5, mat('#c8c4b8'), deck, (x0 + x1) / 2, 1.25, (z0 + z1) / 2); rail.rotation.set(0, -ang, Math.PI / 2);
    for (let k = 0; k <= Math.floor(len / 1.2); k++) { const t = k / Math.max(1, Math.floor(len / 1.2)); cyl(0.025, 0.025, 0.25, 4, mat('#c8c4b8'), deck, x0 + (x1 - x0) * t, 1.1, z0 + (z1 - z0) * t); }
  }
  // superstructure front, behind the camera's shoulder: windows, a door, the wheelhouse above
  wbox(8.4, 2.6, 0.3, whiteM, 0, 1.3, 6, deck, 1);
  for (let x = -3.3; x <= 3.3; x += 1.1) box(0.8, 0.7, 0.05, emissive('#3a4650', 1), x, 1.9, 5.84, deck);
  box(0.9, 1.9, 0.06, mat('#9aa0a0'), 2.6, 0.95, 5.83, deck);
  // deck kit: winch, bollards, liferaft canisters, a lifebuoy, coiled rope, the anchor chain
  box(1.4, 0.8, 0.9, mat('#2e4a3a'), 0, 0.4, -6.2, deck); cyl(0.35, 0.35, 1.6, 8, mat('#3a3a38'), deck, 0, 0.75, -6.2).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) { cyl(0.18, 0.2, 0.5, 8, mat('#2a2a2a'), deck, s * 2.6, 0.25, -4.6); cyl(0.18, 0.2, 0.5, 8, mat('#2a2a2a'), deck, s * 3.3, 0.25, 2.5); }
  for (let i = 0; i < 3; i++) { const lr = cyl(0.32, 0.32, 1.3, 8, mat('#e8e4da'), deck, -3.4, 0.55 + 0, 3.6 - i * 0.9); lr.rotation.x = Math.PI / 2; box(0.7, 0.12, 0.7, mat('#5a5a5a'), -3.4, 0.12, 3.6 - i * 0.9, deck); }
  const buoy = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 6, 10), mat('#d86a1e')); buoy.position.set(3.95, 0.75, 1.2); buoy.rotation.y = Math.PI / 2; buoy.castShadow = true; deck.add(buoy);
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.06, 5, 10), mat('#a89a7a')); rope.rotation.x = Math.PI / 2; rope.position.set(2.6, 0.06, -3.6); deck.add(rope);
  // a bench and a cigarette bin by the door
  box(1.8, 0.08, 0.45, mat('#6a5a48'), 0.6, 0.45, 5.4, deck); box(1.8, 0.45, 0.06, mat('#6a5a48'), 0.6, 0.7, 5.62, deck);
  for (const s of [-1, 1]) box(0.06, 0.45, 0.4, mat('#4a4a4a'), 0.6 + s * 0.8, 0.22, 5.4, deck);

  // William at the bow rail, holdall at his feet, looking at the island
  const w = human({ coat: '#24272b', coatLen: 'long', shirt: '#d4d0c4', tie: null, trousers: '#1c1d20', skin: '#c49a80', hair: '#2a221c' });
  place(w, deck, -0.6, 0, -6.9, Math.PI + 0.25);
  pose(w, { spine: [0.15, 0, 0], head: [-0.05, 0.25, 0], lSh: [-0.75, 0, 0.25], lEl: [-0.5, 0, 0], rSh: [-0.75, 0, -0.25], rEl: [-0.5, 0, 0] });
  const bag = box(0.55, 0.3, 0.28, mat('#2a2e34'), -0.1, 0.15, -6.3, deck); bag.rotation.y = 0.4;
  // another passenger, a woman in a hi-vis tabard (crew), by the winch, watching him rather than the island
  const crew = human({ coat: '#2a3440', coatLen: 'short', shirt: null, trousers: '#2a2c30', skin: '#c8a48c', hair: '#6a4a3a', hairStyle: 'long', hivis: '#d86a1e', scale: 0.95 });
  place(crew, deck, 2.3, 0, -2.6, -2.3);
  pose(crew, { head: [0.05, -0.1, 0], lSh: [0, 0, 0.1], rSh: [-0.2, 0, -0.1], rEl: [-1.2, 0, 0] });

  // light: a low winter sun behind cloud off to the right, cold sky fill
  const sun = new THREE.DirectionalLight('#f0d8b0', 2.2);
  sun.position.set(30, 10, -30); sun.target.position.set(0, 0, -2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, far: 80 }); sun.shadow.bias = -0.001;
  scene.add(sun); scene.add(sun.target);
  glow('#ffe0b0', 30, scene, 60, 8, -70, 0.35);
  scene.add(new THREE.HemisphereLight('#9aa6b4', '#3a4048', 1.5));
  // spray coming over the bow
  rain(scene, new THREE.Vector3(0, 2, -8), new THREE.Vector3(10, 4, 4), 110, new THREE.Vector3(0.1, -0.4, 1), 0.18, 0xd8e0e4, 0.35, 12);

  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 400);
  camera.position.set(2.7, 3.7, -1.2);
  camera.lookAt(-1.4, 1.2, -16.0);
  return { scene, camera, exposure: 1.05, ui: { caption: ['MV Selkie', 'The crossing  -  15:12'] } };
}
