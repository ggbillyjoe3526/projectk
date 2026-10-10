import * as THREE from 'three';
import { mesh, rbox, plain, rng, hdri, jitter, shadowLight } from '../lib.js';
import { glow, beam, point, candle, coffin, coffinLid, trestle, sword } from '../props.js';
import { person } from '../cast.js';

/** The island kirk at the service: the coffin is empty and the congregation has turned. */
export async function kirk({ renderer, M }) {
  const scene = new THREE.Scene();
  const { env } = await hdri(renderer, 'quarry_01_1k.hdr');
  scene.environment = env; scene.environmentIntensity = 0.12;
  scene.background = new THREE.Color('#0a0c0e');
  scene.fog = new THREE.FogExp2('#262c32', 0.04);
  const L = 8, Wd = 4.6, H = 6.2, T = 0.6;
  const r = rng(21);

  scene.add(mesh(new THREE.PlaneGeometry(L * 2, Wd * 2).rotateX(-Math.PI / 2), M.flags, { cast: false }));
  // side walls with tall round-headed windows; the south wall (z=+Wd) is behind the camera but lets the light in
  const winXs = [-5.5, -1.5, 2.5];
  const ww = 1.1, wy0 = 2.0, wy1 = 4.8;
  const wall = (z, glazed) => {
    let x0 = -L;
    for (const wx of winXs) {
      scene.add(mesh(rbox(wx - ww / 2 - x0, H, T, 0.03), M.plaster, { pos: [(x0 + wx - ww / 2) / 2, H / 2, z] }));
      scene.add(mesh(rbox(ww, wy0, T, 0.03), M.plaster, { pos: [wx, wy0 / 2, z] }));
      scene.add(mesh(rbox(ww, H - wy1, T, 0.03), M.plaster, { pos: [wx, (H + wy1) / 2, z] }));
      if (glazed) {
        const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww, wy1 - wy0), new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#aab4bc'), emissiveIntensity: 1.6 }));
        pane.position.set(wx, (wy0 + wy1) / 2, z - Math.sign(z) * 0.1); pane.rotation.y = z > 0 ? Math.PI : 0; scene.add(pane);
        for (let k = 0; k <= 12; k++) scene.add(mesh(rbox(ww, 0.018, 0.02, 0.005), M.iron, { pos: [wx, wy0 + k * (wy1 - wy0) / 12, z - Math.sign(z) * 0.11], keepUV: true }));
        for (const dx of [-ww / 4, 0, ww / 4]) scene.add(mesh(rbox(0.018, wy1 - wy0, 0.02, 0.005), M.iron, { pos: [wx + dx, (wy0 + wy1) / 2, z - Math.sign(z) * 0.11], keepUV: true }));
      }
      x0 = wx + ww / 2;
    }
    scene.add(mesh(rbox(L - x0, H, T, 0.03), M.plaster, { pos: [(x0 + L) / 2, H / 2, z] }));
  };
  wall(-Wd - T / 2, true);
  wall(Wd + T / 2, false);
  scene.add(mesh(rbox(T, H, Wd * 2 + T * 2, 0.03), M.plaster, { pos: [L + T / 2, H / 2, 0] }));
  scene.add(mesh(rbox(T, H, Wd * 2 + T * 2, 0.03), M.plaster, { pos: [-L - T / 2, H / 2, 0] }));
  // dark timber wainscot
  scene.add(mesh(rbox(L * 2, 1.1, 0.05, 0.01), M.pew, { pos: [0, 0.55, -Wd + 0.025], tile: 1.6 }));
  scene.add(mesh(rbox(0.05, 1.1, Wd * 2, 0.01), M.pew, { pos: [L - 0.025, 0.55, 0], tile: 1.6 }));
  for (let x = -L + 0.4; x < L; x += 0.8) scene.add(mesh(rbox(0.04, 1.1, 0.07, 0.01), M.pew, { pos: [x, 0.55, -Wd + 0.05], tile: 1.6 }));
  // raised chancel platform
  scene.add(mesh(rbox(3.4, 0.3, Wd * 2, 0.02), M.boards, { pos: [L - 1.7, 0.15, 0], tile: 1.6 }));
  // box pews either side of the aisle
  for (let x = -6.5; x < 3.0; x += 1.0) for (const side of [-1, 1]) {
    const zc = side * 2.35, len = 3.3;
    scene.add(mesh(rbox(0.06, 1.05, len, 0.012), M.pew, { pos: [x - 0.42, 0.525, zc], tile: 1.4 }));
    scene.add(mesh(rbox(0.09, 0.05, len, 0.015), M.pew, { pos: [x - 0.42, 1.06, zc], tile: 1.4 }));
    scene.add(mesh(rbox(0.38, 0.045, len, 0.01), M.pew, { pos: [x - 0.2, 0.45, zc], tile: 1.4 }));
    scene.add(mesh(rbox(0.06, 0.55, len, 0.01), M.pew, { pos: [x - 0.04, 0.72, zc], tile: 1.4 }));
    scene.add(mesh(rbox(0.62, 1.12, 0.06, 0.012), M.pew, { pos: [x - 0.2, 0.56, zc - side * len / 2], tile: 1.4 }));
    // hymn books on the ledge
    if (r() < 0.6) scene.add(mesh(rbox(0.11, 0.03, 0.16, 0.004), plain(['#3a1a1a', '#1a2a1a', '#2a2a2a'][Math.floor(r() * 3)], { rough: 0.7 }), { pos: [x - 0.42, 1.1, zc + (r() - 0.5) * 2], keepUV: true }));
  }
  // pulpit with a sounding board, front left
  const pulpit = new THREE.Group(); pulpit.position.set(5.6, 0, -3.3); scene.add(pulpit);
  const drum = [[0, 0], [0.62, 0], [0.62, 0.05], [0.7, 0.08], [0.72, 1.12], [0.78, 1.16], [0.78, 1.22], [0, 1.22]].map(([x, y]) => new THREE.Vector2(x, y));
  pulpit.add(mesh(new THREE.LatheGeometry(drum, 8), M.pew, { pos: [0, 1.0, 0], tile: 1.2 }));
  pulpit.add(mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.0, 8), M.pew, { pos: [0, 0.5, 0], tile: 1.2 }));
  pulpit.add(mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.14, 8), M.pew, { pos: [0, 4.4, -0.2], tile: 1.2 }));
  pulpit.add(mesh(rbox(0.12, 2.4, 0.12, 0.02), M.pew, { pos: [0, 3.2, -0.72], tile: 1.2 }));
  pulpit.add(mesh(rbox(0.5, 0.04, 0.36, 0.01), plain('#3a1a1a', { rough: 0.8 }), { pos: [0.3, 2.24, 0.45], rot: [0.35, -0.6, 0], keepUV: true }));
  // communion table pushed back, the coffin on its trestles, lid against the wall
  scene.add(mesh(rbox(1.8, 0.8, 0.8, 0.02), M.pew, { pos: [L - 0.9, 0.7, 1.2], tile: 1.2 }));
  scene.add(mesh(rbox(1.9, 0.02, 0.85, 0.005), M.linen, { pos: [L - 0.9, 1.11, 1.2], tile: 1 }));
  const cf = coffin(M); cf.position.set(5.0, 0.95, 0.15); cf.rotation.y = 0.04; scene.add(cf);
  scene.add(trestle(M, [4.45, 0.3, 0.15])); scene.add(trestle(M, [5.55, 0.3, 0.15]));
  const lid = coffinLid(M); lid.rotation.set(0, Math.PI / 2, Math.PI / 2 - 0.15); lid.position.set(L - 0.2, 1.3, -1.6); scene.add(lid);
  // the shroud dropped on the floor beside the trestles
  const sheet = new THREE.PlaneGeometry(1.5, 1.0, 30, 20); sheet.rotateX(-Math.PI / 2);
  const sp = sheet.attributes.position;
  for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), z = sp.getZ(i); sp.setY(i, Math.max(0, Math.sin(x * 7 + z * 3) * 0.04 + Math.sin(x * 13 - z * 9) * 0.02 + 0.03 * Math.exp(-((x - 0.2) ** 2 + z * z) * 6))); }
  sheet.computeVertexNormals();
  const sh = mesh(sheet, M.linen, { pos: [3.95, 0.305, 0.85], tile: 1.0 }); sh.material = M.linen.clone(); sh.material.side = THREE.DoubleSide; sh.material.color.set('#9a968c'); scene.add(sh);
  // the sword above, on the east wall, on two iron pins, under a little brass plate
  const sw = sword(M); sw.scale.setScalar(1.3); sw.rotation.set(0, Math.PI / 2, -Math.PI / 2); sw.position.set(L - 0.06, 3.35, 0.2); scene.add(sw);
  for (const z of [-0.25, 0.45]) scene.add(mesh(rbox(0.08, 0.04, 0.04, 0.01), M.iron, { pos: [L - 0.04, 3.31, z], keepUV: true }));
  scene.add(mesh(rbox(0.015, 0.12, 0.36, 0.004), M.brass, { pos: [L - 0.01, 2.95, 0.12], keepUV: true }));
  // memorial boards with the island's names
  for (const z of [-2.8, 2.9]) { scene.add(mesh(rbox(0.06, 1.3, 1.0, 0.02), M.coffinwood, { pos: [L - 0.03, 3.1, z], tile: 1 })); }
  // two tall candles by the coffin
  for (const z of [-0.6, 0.95]) {
    const prof = [[0, 0], [0.12, 0], [0.12, 0.04], [0.04, 0.08], [0.03, 1.0], [0.07, 1.04], [0.07, 1.08], [0, 1.08]].map(([x, y]) => new THREE.Vector2(x, y));
    scene.add(mesh(new THREE.LatheGeometry(prof, 20), M.brass, { pos: [5.9, 0.3, z], keepUV: true }));
    candle(scene, M, [5.9, 1.38, z], 0.32, { intensity: 3.0, distance: 7, shadow: z < 0, halo: 0.5, seed: z > 0 ? 5 : 9 });
  }
  // cold storm daylight through the north windows, falling across the pews
  const day = shadowLight(new THREE.DirectionalLight('#c8d4e0', 2.6), 2048, 12, { far: 40 });
  day.position.set(-3, 9, -14); day.target.position.set(1, 0, 1);
  scene.add(day); scene.add(day.target);
  for (const wx of winXs) beam(scene, '#c8d4e0', new THREE.Vector3(wx, 3.4, -Wd), new THREE.Vector3(wx + 1.6, 0.2, 1.4), 0.6, 1.1, 0.045);
  scene.add(new THREE.HemisphereLight('#7a8696', '#3a3028', 1.0));
  point(scene, '#cfe0f0', 2.5, 3, [L - 0.8, 3.6, 0.3]);

  // William in the aisle, backing away from the empty coffin
  const w = await person('w_kirk', M); w.position.set(3.45, 0, 0.1); w.rotation.y = -Math.PI / 2 + 0.25; scene.add(w);

  // the congregation, every one standing, turned, eyes gone pale
  const people = [
    [1.6, -1.4, 0], [1.6, -2.4, 1], [1.6, -3.3, 2], [0.6, -1.6, 3], [0.6, -2.8, 4],
    [1.6, 1.5, 5], [1.6, 2.6, 0], [0.6, 1.8, 2], [0.6, 3.0, 1], [-0.4, -2.0, 5], [-0.4, 2.2, 4], [-1.4, 1.2, 0], [-1.4, -1.3, 3],
    [2.5, 0.65, 1], [-2.4, -2.2, 2], [-2.4, 2.6, 5],
  ];
  for (const [x, z, v] of people) {
    const yaw = Math.atan2(3.45 - x, 0.1 - z) + (r() - 0.5) * 0.2;
    const p = await person(`cong${v}`, M); p.position.set(x - 0.15, 0, z); p.rotation.y = yaw; scene.add(p);
  }
  // one in the aisle already, arm out, reaching
  const reach = await person('reach', M); reach.position.set(2.4, 0, -0.3); reach.rotation.y = Math.PI / 2 - 0.1; scene.add(reach);
  // the minister in the pulpit, head over on one side
  const min = await person('minister', M); min.position.set(5.6, 1.15, -3.3); min.rotation.y = -0.9; scene.add(min);

  const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.1, 80);
  camera.position.set(0.3, 2.35, 3.4);
  camera.lookAt(4.0, 1.35, -0.9);
  return { scene, camera, look: { exposure: 1.05, aoRadius: 0.6 }, ui: { caption: ['Haugsay Kirk', 'The funeral of Alan Sloan'] } };
}
