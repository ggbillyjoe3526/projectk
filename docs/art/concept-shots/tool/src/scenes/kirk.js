import * as THREE from 'three';
import { T, rng, mat, texMat, emissive, box, wbox, cyl, plane, glow, beam, point, spot, human, pose, place, sword, coffin } from '../lib.js';

/** St Magnus-style island kirk at the service: the coffin is empty and the congregation has turned. */
export function kirk() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0c0e');
  scene.fog = new THREE.FogExp2('#1c2228', 0.035);
  const L = 8, Wd = 4.6, H = 6.2; // half-length (x), half-width (z), wall height
  const harl = texMat(T.harl([1, 1], '#c6c4bc'));
  const floor = plane(L * 2, Wd * 2, texMat(T.flags([1, 1], '#86837a')), scene, 1.4); floor.rotation.x = -Math.PI / 2;
  // side walls with tall round-headed windows; south wall (z=+Wd) is behind the camera but casts the light
  const winXs = [-5.5, -1.5, 2.5];
  const ww = 1.1, wy0 = 2.0, wy1 = 4.8;
  const wall = (z, glazed) => {
    let x0 = -L;
    for (const wx of winXs) {
      wbox(wx - ww / 2 - x0, H, 0.6, harl, (x0 + wx - ww / 2) / 2, H / 2, z, scene, 1.5);
      wbox(ww, wy0, 0.6, harl, wx, wy0 / 2, z, scene, 1.5);
      wbox(ww, H - wy1, 0.6, harl, wx, (H + wy1) / 2, z, scene, 1.5);
      if (glazed) {
        const pane = plane(ww, wy1 - wy0, emissive('#9aa6b0', 0.9), scene); pane.position.set(wx, (wy0 + wy1) / 2, z + 0.25); 
        for (let k = 1; k < 4; k++) box(ww, 0.03, 0.04, mat('#3a3e40'), wx, wy0 + k * (wy1 - wy0) / 4, z + 0.27, scene);
        box(0.03, wy1 - wy0, 0.04, mat('#3a3e40'), wx, (wy0 + wy1) / 2, z + 0.27, scene);
      }
      x0 = wx + ww / 2;
    }
    wbox(L - x0, H, 0.6, harl, (x0 + L) / 2, H / 2, z, scene, 1.5);
  };
  wall(-Wd - 0.3, true);
  wall(Wd + 0.3, false);
  // east wall (front) and west wall
  wbox(0.6, H, Wd * 2, harl, L + 0.3, H / 2, 0, scene, 1.5);
  wbox(0.6, H, Wd * 2, harl, -L - 0.3, H / 2, 0, scene, 1.5);
  // dark timber wainscot round the walls
  box(L * 2, 1.1, 0.06, texMat(T.planks([6, 1], '#3a2a20', 'w')), 0, 0.55, -Wd + 0.02, scene);
  box(0.06, 1.1, Wd * 2, texMat(T.planks([6, 1], '#3a2a20', 'w')), L - 0.02, 0.55, 0, scene);
  // raised chancel platform at the front
  wbox(3.4, 0.3, Wd * 2, texMat(T.planks([1, 1], '#4a3628', 'f')), L - 1.7, 0.15, 0, scene, 1);
  // box pews either side of the aisle
  const pewM = texMat(T.planks([1, 1], '#8a6a4c', 'pew'));
  for (let x = -6.5; x < 3.0; x += 1.0) for (const side of [-1, 1]) {
    const zc = side * 2.35, len = 3.3;
    box(0.08, 1.05, len, pewM, x - 0.42, 0.52, zc, scene);
    box(0.4, 0.06, len, pewM, x - 0.2, 0.45, zc, scene);
    box(0.62, 1.05, 0.06, pewM, x - 0.2, 0.52, zc - side * len / 2 + side * 0.0 + (side < 0 ? 0 : 0), scene).position.z = zc + (side > 0 ? -len / 2 : len / 2);
  }
  // pulpit with sounding board, front left
  const pulpit = new THREE.Group(); pulpit.position.set(5.6, 0, -3.3); scene.add(pulpit);
  cyl(0.75, 0.6, 1.2, 8, pewM, pulpit, 0, 1.6, 0);
  cyl(0.2, 0.3, 1.0, 6, pewM, pulpit, 0, 0.5, 0);
  cyl(0.95, 0.85, 0.12, 8, pewM, pulpit, 0, 4.4, -0.2);
  box(0.1, 2.4, 0.1, pewM, 0, 3.2, -0.7, pulpit);
  // communion table pushed back, the coffin on its trestles in front of it, lid against the wall
  box(1.8, 0.8, 0.8, mat('#3a2a20'), L - 0.9, 0.7, 1.2, scene);
  box(1.9, 0.02, 0.85, mat('#d8d2c2'), L - 0.9, 1.11, 1.2, scene);
  const cf = coffin(scene, '#4a2c1e'); cf.position.set(5.0, 0.95, 0.15); cf.rotation.y = 0.04;
  for (const tx of [4.4, 5.6]) for (const s of [-1, 1]) box(0.05, 0.65, 0.05, mat('#4a3626'), tx, 0.62, 0.15 + s * 0.2, scene);
  const lidGeo = new THREE.ExtrudeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-0.95, -0.17); s.lineTo(0.45, -0.29); s.lineTo(0.95, -0.21); s.lineTo(0.95, 0.21); s.lineTo(0.45, 0.29); s.lineTo(-0.95, 0.17); s.closePath(); return s; })(), { depth: 0.06, bevelEnabled: false });
  const lid = new THREE.Mesh(lidGeo, mat('#5a3424')); lid.rotation.set(0, Math.PI / 2, Math.PI / 2 - 0.15); lid.position.set(L - 0.2, 1.3, -1.6); lid.castShadow = true; scene.add(lid);
  // the shroud dropped on the floor beside the trestles
  for (let k = 0; k < 5; k++) { const sh = box(0.35 + k * 0.05, 0.06, 0.25, mat('#d6d0c2'), 4.05 + Math.sin(k * 2.1) * 0.2, 0.33 + (k % 2) * 0.03, 0.75 + Math.cos(k * 1.7) * 0.15, scene); sh.rotation.set(0.2 * (k % 3), k * 0.9, 0.15); }
  // the sword above, on the east wall, on two iron pins, under a little brass plate
  const sw = sword(scene); sw.scale.setScalar(1.3); sw.rotation.set(0, Math.PI / 2, Math.PI / 2); sw.position.set(L - 0.05, 3.35, 0.15 + 0.55);
  for (const z of [-0.2, 0.35]) box(0.08, 0.05, 0.05, mat('#2a2a2a'), L - 0.04, 3.3, z, scene);
  box(0.02, 0.12, 0.35, mat('#a8904a'), L - 0.02, 2.95, 0.12, scene);
  // memorial boards with the island's names
  for (const z of [-2.8, 2.9]) { box(0.06, 1.3, 1.0, mat('#2a1e16'), L - 0.03, 3.1, z, scene); box(0.065, 1.1, 0.8, mat('#3a2a1e'), L - 0.03, 3.1, z, scene); }
  // two tall candles by the coffin
  for (const z of [-0.6, 0.95]) {
    cyl(0.05, 0.1, 1.2, 6, mat('#6a5a3a'), scene, 5.9, 0.9, z);
    cyl(0.035, 0.035, 0.3, 6, mat('#e8e2d0'), scene, 5.9, 1.65, z);
    box(0.02, 0.05, 0.02, emissive('#ffd28a', 3), 5.9, 1.83, z, scene);
    glow('#ffc070', 0.5, scene, 5.9, 1.84, z, 1.1);
    point('#ffbe6a', 2.8, 5, scene, 5.9, 1.9, z, z < 0);
  }
  // cold storm daylight through the south windows, falling across the pews
  const day = new THREE.DirectionalLight('#c8d4e0', 3.2);
  day.position.set(-4, 9, 14); day.target.position.set(1, 0, -1);
  day.castShadow = true; day.shadow.mapSize.set(2048, 2048); Object.assign(day.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, far: 40 }); day.shadow.bias = -0.0015;
  scene.add(day); scene.add(day.target);
  for (const wx of winXs) beam('#c8d4e0', new THREE.Vector3(wx, 3.4, Wd), new THREE.Vector3(wx + 2.4, 0.2, -1.2), 1.1, 0.02, scene);
  scene.add(new THREE.HemisphereLight('#8a96a6', '#4a3e34', 3.6));
  const north = new THREE.DirectionalLight('#9aa8b8', 1.2); north.position.set(2, 6, -12); scene.add(north);
  // a cold slant from the high east light picking out the sword
  point('#cfe0f0', 3.5, 3, scene, L - 0.8, 3.6, 0.3);

  // William in the aisle, backing away from the empty coffin
  const w = human({ coat: '#24272b', coatLen: 'long', shirt: '#d4d0c4', tie: '#101012', trousers: '#1c1d20', skin: '#c49a80', hair: '#2a221c' });
  place(w, scene, 3.45, 0, 0.1, -Math.PI / 2 + 0.25);
  pose(w, { spine: [-0.12, 0, 0], head: [-0.05, 0.15, 0], lSh: [-0.3, 0, 0.35], lEl: [-0.4, 0, 0], rSh: [-0.25, 0, -0.35], rEl: [-0.5, 0, 0], lHip: [0.25, 0, 0], rHip: [-0.3, 0, 0], rKnee: [0.2, 0, 0] });

  // the congregation, every one of them standing, turned, eyes gone pale
  const eyes = '#d6ecff';
  const r = rng(21);
  const coats = ['#2e2e34', '#36323a', '#3a3a40', '#2a2c32', '#423a3a', '#32363c'];
  const people = [
    [1.6, -1.4, 'scarf'], [1.6, -2.4, 'short'], [1.6, -3.3, 'bald'], [0.6, -1.6, 'cap'], [0.6, -2.8, 'long'],
    [1.6, 1.5, 'short'], [1.6, 2.6, 'scarf'], [0.6, 1.8, 'bald'], [0.6, 3.0, 'short'], [-0.4, -2.0, 'short'], [-0.4, 2.2, 'long'], [-1.4, 1.2, 'scarf'], [-1.4, -1.3, 'cap'],
    [2.5, 0.65, 'short'],
  ];
  people.forEach(([x, z, hair], i) => {
    const h = human({ coat: coats[i % coats.length], coatLen: i % 3 ? 'long' : 'short', shirt: i % 2 ? '#d0ccc0' : null, tie: i % 2 ? '#111' : null, trousers: '#1a1a1e', skin: '#a8aea8', hair: ['#9a948c', '#3a3028', '#5a5048', '#1a1814', '#2a2420'][i % 5], hairStyle: hair, scarf: '#2a2a2e', capColor: '#2e2e2a', eyes, scale: 0.92 + r() * 0.14, build: 0.9 + r() * 0.25 });
    const yaw = Math.atan2(3.45 - x, 0.1 - z) + (r() - 0.5) * 0.15;
    place(h, scene, x, 0, z, yaw);
    pose(h, { head: [0.05 + r() * 0.15, 0, (r() - 0.5) * (i % 3 === 0 ? 1.0 : 0.3)], lSh: [-0.05, 0, 0.06], rSh: [-0.05, 0, -0.06], spine: [r() * 0.15, 0, 0] });
  });
  // one in the aisle already, arm out, reaching
  const reach = human({ coat: '#2e2a2a', coatLen: 'long', shirt: null, trousers: '#1a1a1e', skin: '#a8aea8', hair: '#8a847c', hairStyle: 'short', eyes, scale: 1.02 });
  place(reach, scene, 2.4, 0, -0.3, Math.PI / 2 - 0.1);
  pose(reach, { spine: [0.2, 0, 0], head: [-0.1, 0, 0.4], rSh: [-1.4, 0, -0.1], rEl: [-0.1, 0, 0], lSh: [-0.9, 0, 0.1], lEl: [-0.3, 0, 0], lHip: [-0.4, 0, 0], lKnee: [0.4, 0, 0], rHip: [0.3, 0, 0] });
  // the minister in the pulpit, head over on one side
  const min = human({ coat: '#141416', coatLen: 'long', shirt: null, collar: '#f0f0ea', trousers: '#141416', skin: '#a8aea8', hair: '#d0ccc4', hairStyle: 'bald', eyes });
  place(min, scene, 5.6, 1.2, -3.3, -0.9);
  pose(min, { head: [0.1, 0, 0.75], lSh: [-0.6, 0, 0.3], lEl: [-0.6, 0, 0], rSh: [-0.6, 0, -0.3], rEl: [-0.6, 0, 0] });

  const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 80);
  camera.position.set(0.6, 3.5, 4.0);
  camera.lookAt(3.6, 1.35, -1.0);
  return { scene, camera, exposure: 1.1, ui: { caption: ['Haugsay Kirk', 'The funeral of Alan Sloan'] } };
}
