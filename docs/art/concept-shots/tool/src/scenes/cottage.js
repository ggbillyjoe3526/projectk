import * as THREE from 'three';
import { T, mat, texMat, emissive, box, wbox, cyl, plane, glow, beam, point, spot, human, pose, place, phone } from '../lib.js';

/** Alan Sloan's cottage on the Brough: the room where the coffin lies. Shared by the vigil and the note. */
function cottage({ notebookInHand = false } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050608');
  scene.fog = new THREE.FogExp2('#07080b', 0.05);
  const W = 2.7, D = 2.1, Hc = 2.45;

  // floor + rug
  const floor = plane(W * 2, D * 2, texMat(T.flags([1, 1], '#57534a')), scene, 1.3); floor.rotation.x = -Math.PI / 2;
  const rug = plane(2.6, 1.5, texMat(T.knit([3, 2], '#4a3a2c', '#6a5236')), scene); rug.rotation.x = -Math.PI / 2; rug.position.set(-0.2, 0.005, 0.2);

  // walls: back (z=-D) with a deep window, left (x=-W) with the hearth, right (x=W) with the door
  const wallM = texMat(T.harl([1, 1], '#b4b2aa'));
  const stoneM = texMat(T.stone([1, 1]));
  const winX = 0.95, winW = 0.8, winY0 = 1.0, winY1 = 1.75;
  wbox(winX - winW / 2 + W, Hc, 0.5, wallM, (-W + winX - winW / 2) / 2, Hc / 2, -D - 0.25, scene, 1.2);
  wbox(W - (winX + winW / 2), Hc, 0.5, wallM, (winX + winW / 2 + W) / 2, Hc / 2, -D - 0.25, scene, 1.2);
  wbox(winW, winY0, 0.5, wallM, winX, winY0 / 2, -D - 0.25, scene, 1.2);
  wbox(winW, Hc - winY1, 0.5, wallM, winX, (Hc + winY1) / 2, -D - 0.25, scene, 1.2);
  // window: frame, glazing bars, sill, the night outside
  const frameM = mat('#d8d4c6');
  box(winW, 0.05, 0.06, frameM, winX, (winY0 + winY1) / 2, -D - 0.4, scene);
  box(0.04, winY1 - winY0, 0.06, frameM, winX, (winY0 + winY1) / 2, -D - 0.4, scene);
  box(winW + 0.1, 0.05, 0.3, mat('#6a5a48'), winX, winY0 - 0.02, -D - 0.1, scene);
  const night = plane(winW, winY1 - winY0, emissive('#1f2c3c', 1), scene); night.position.set(winX, (winY0 + winY1) / 2, -D - 0.48);
  glow('#e8eef5', 0.7, scene, winX + 0.2, 1.6, -D - 0.47, 0.8); // the lighthouse beam passing
  wbox(0.5, Hc, D * 2, wallM, -W - 0.25, Hc / 2, 0, scene, 1.2);
  wbox(0.5, Hc, D * 2, wallM, W + 0.25, Hc / 2, 0, scene, 1.2);
  // ceiling + beams
  const ceil = plane(W * 2, D * 2, texMat(T.planks([3, 3], '#3a2c22', 'c')), scene); ceil.rotation.x = Math.PI / 2; ceil.position.y = Hc;
  for (let x = -W + 0.6; x < 1.5; x += 1.1) box(0.14, 0.16, D * 2, mat('#2c2118'), x, Hc - 0.08, 0, scene);
  // skirting
  box(W * 2, 0.12, 0.03, mat('#3e3026'), 0, 0.06, -D + 0.015, scene);

  // hearth on the left wall: stone surround, iron range, peat glow
  const hx = -W + 0.2, hz = -0.35;
  wbox(0.4, 1.25, 1.5, stoneM, hx, 0.625, hz, scene, 0.9);
  box(0.48, 0.07, 1.65, mat('#3b2b1f'), hx + 0.04, 1.28, hz, scene); // mantel
  const opening = box(0.42, 0.62, 0.8, mat('#0c0a09'), hx + 0.01, 0.31, hz, scene);
  for (let i = 0; i < 6; i++) box(0.16, 0.08, 0.12, emissive(i % 2 ? '#ff7a2a' : '#ffb04a', 1.6 + (i % 3) * 0.5), hx + 0.12 + (i % 2) * 0.04, 0.08 + Math.floor(i / 3) * 0.06, hz - 0.25 + (i % 3) * 0.22, scene);
  glow('#ff8a3a', 1.2, scene, hx + 0.3, 0.25, hz, 1.1);
  const fire = point('#ffa45a', 8, 8, scene, hx + 0.45, 0.45, hz, true);
  // clock on the mantel (still ticking: nobody stopped it)
  const clock = box(0.12, 0.26, 0.2, mat('#4a3020'), hx + 0.06, 1.45, hz + 0.45, scene);
  const face = plane(0.14, 0.14, mat('#d9d2bc'), scene); face.rotation.y = Math.PI / 2; face.position.set(hx + 0.125, 1.5, hz + 0.45);
  // photo frames, a dram glass
  box(0.04, 0.16, 0.12, mat('#2a2018'), hx + 0.06, 1.39, hz - 0.5, scene);
  box(0.04, 0.12, 0.1, mat('#6a5a40'), hx + 0.06, 1.37, hz - 0.2, scene);

  // the mirror on the back wall (uncovered)
  const mx = -1.3, my = 1.45, mz = -D + 0.02;
  box(0.62, 0.82, 0.04, mat('#3a2a1a'), mx, my, mz, scene);
  const glass = plane(0.52, 0.72, new THREE.MeshBasicMaterial({ color: '#2a3238' }), scene); glass.position.set(mx, my, mz + 0.025);
  // what the glass holds: a sliver of candlelight and a pale smear where a face would be
  glow('#ffbe6a', 0.3, scene, mx + 0.12, my - 0.15, mz + 0.04, 0.8);
  box(0.06, 0.6, 0.004, new THREE.MeshBasicMaterial({ color: '#56626a' }), mx - 0.18, my, mz + 0.03, scene).rotation.z = 0.25;

  // the door on the right, ajar onto black
  box(0.06, 2.0, 0.9, mat('#2e3a34'), W - 0.04, 1.0, 1.2, scene).rotation.y = 0;
  const doorLeaf = box(0.05, 1.95, 0.82, mat('#3c4a42'), W - 0.42, 0.98, 0.82, scene); doorLeaf.rotation.y = -1.05;

  // coffin on two trestles, lid against the wall
  const coffin = new THREE.Group(); coffin.position.set(-0.15, 0.62, 0.1); scene.add(coffin);
  const outline = new THREE.Shape();
  outline.moveTo(-0.95, -0.17); outline.lineTo(0.45, -0.29); outline.lineTo(0.95, -0.21); outline.lineTo(0.95, 0.21); outline.lineTo(0.45, 0.29); outline.lineTo(-0.95, 0.17); outline.closePath();
  const geo = new THREE.ExtrudeGeometry(outline, { depth: 0.36, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const shell = new THREE.Mesh(geo, mat('#5a3424')); shell.castShadow = true; shell.receiveShadow = true; coffin.add(shell);
  const inner = outline.clone();
  const lining = new THREE.Mesh(new THREE.ShapeGeometry(inner), mat('#cfc8b8')); lining.rotation.x = -Math.PI / 2; lining.scale.set(0.93, 0.86, 1); lining.position.y = 0.34; lining.receiveShadow = true; coffin.add(lining);
  // Alan: a sheet to the chest, the face grey, the plate of salt that should be on his breast (left on the side)
  const sheetM = mat('#d9d4c8');
  box(1.35, 0.06, 0.4, sheetM, -0.2, 0.33, 0, coffin);
  box(0.55, 0.08, 0.36, sheetM, 0.25, 0.38, 0, coffin).rotation.x = 0.0; // chest
  box(0.5, 0.05, 0.3, sheetM, -0.35, 0.37, 0, coffin);
  box(0.1, 0.09, 0.22, sheetM, -0.82, 0.38, 0, coffin); // feet
  const hd = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), mat('#a8aaa0')); hd.scale.set(1, 0.85, 0.9); hd.position.set(0.7, 0.39, 0); hd.castShadow = true; coffin.add(hd);
  box(0.04, 0.05, 0.03, mat('#9c9c94'), 0.7, 0.47, 0, coffin); // nose
  const hairM = mat('#9a988e'); const hr = new THREE.Mesh(new THREE.IcosahedronGeometry(0.115, 1), hairM); hr.scale.set(0.9, 0.7, 0.95); hr.position.set(0.76, 0.38, 0); coffin.add(hr);
  for (const s of [-0.04, 0.04]) box(0.03, 0.012, 0.03, mat('#3a3a36'), 0.66, 0.465, s, coffin); // closed eyes
  const pil = box(0.22, 0.06, 0.34, mat('#e6e0d2'), 0.76, 0.33, 0, coffin);
  for (const s of [-0.12, 0.12]) box(0.07, 0.02, 0.03, mat('#b8a060'), 0.1, 0.18, s * 2.4, coffin); // handles
  for (const tx of [-0.55, 0.45]) {
    const tr = new THREE.Group(); tr.position.set(-0.15 + tx, 0, 0.1); scene.add(tr);
    for (const s of [-1, 1]) { const l = box(0.05, 0.66, 0.05, mat('#4a3626'), 0, 0.3, s * 0.22, tr); l.rotation.x = s * 0.2; }
    box(0.08, 0.05, 0.56, mat('#4a3626'), 0, 0.6, 0, tr);
  }
  const lid = new THREE.Mesh(new THREE.ExtrudeGeometry(outline, { depth: 0.06, bevelEnabled: false }), mat('#5a3424'));
  lid.rotation.set(0, 0, Math.PI / 2 - 0.12); lid.position.set(1.75, 0.98, -D + 0.12); lid.castShadow = true; scene.add(lid);
  box(0.05, 0.2, 0.012, mat('#b8a060'), 1.72, 1.05, -D + 0.19, scene);

  // the candle at his head, on a stool
  const stool = new THREE.Group(); stool.position.set(1.15, 0, 0.1); scene.add(stool);
  cyl(0.2, 0.2, 0.05, 8, mat('#4a3626'), stool, 0, 0.62, 0);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const l = cyl(0.025, 0.025, 0.62, 4, mat('#3a2a1e'), stool, Math.cos(a) * 0.13, 0.31, Math.sin(a) * 0.13); }
  cyl(0.04, 0.05, 0.03, 8, mat('#8a7a50'), stool, 0, 0.66, 0);
  cyl(0.025, 0.025, 0.2, 6, mat('#e8e2d0'), stool, 0, 0.77, 0);
  box(0.016, 0.04, 0.016, emissive('#ffd28a', 3), 0, 0.89, 0, stool);
  glow('#ffc070', 0.55, stool, 0, 0.9, 0, 1.2);
  point('#ffbe6a', 2.2, 4.5, stool, 0, 0.95, 0, true);
  // the plate of salt, on the stool beside it
  cyl(0.09, 0.07, 0.015, 10, mat('#d8d8d0'), stool, 0.1, 0.655, 0.08);
  cyl(0.05, 0.07, 0.03, 8, mat('#f2f2ec'), stool, 0.1, 0.67, 0.08);

  // side table, whisky, the armchair
  const table = new THREE.Group(); table.position.set(0.6, 0, -1.45); scene.add(table);
  box(0.5, 0.04, 0.4, mat('#4a3626'), 0, 0.55, 0, table);
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.04, 0.55, 0.04, mat('#3a2a1e'), a * 0.21, 0.275, b * 0.16, table);
  cyl(0.04, 0.045, 0.24, 6, mat('#2e4a2a', { emissive: new THREE.Color('#0a1408') }), table, -0.1, 0.69, 0);
  cyl(0.018, 0.018, 0.06, 5, mat('#2e4a2a'), table, -0.1, 0.84, 0);
  cyl(0.035, 0.03, 0.07, 6, mat('#a89470'), table, 0.12, 0.6, 0.05);

  // bookshelf and a box bed in the far corner, shadowed
  const shelf = new THREE.Group(); shelf.position.set(2.2, 0, -D + 0.25); scene.add(shelf);
  box(0.9, 1.9, 0.35, mat('#3a2c20'), 0, 0.95, 0, shelf);
  const r = (n) => (Math.sin(n * 12.9898) * 43758.5453) % 1;
  for (let s = 0; s < 4; s++) for (let b = 0; b < 9; b++) {
    const hgt = 0.2 + Math.abs(r(s * 9 + b)) * 0.12;
    box(0.07, hgt, 0.22, mat(['#5a2a22', '#2a3a4a', '#4a4a2a', '#6a5a40', '#2a2a2a'][(s + b) % 5]), -0.36 + b * 0.09, 0.15 + s * 0.45 + hgt / 2, 0.08, shelf);
  }

  scene.add(new THREE.HemisphereLight('#3c4658', '#2a1a10', 0.9));
  // moonlight through the window, cold, throwing the window shape across the floor
  const moon = new THREE.DirectionalLight('#9fb4d6', 0.9);
  moon.position.set(winX + 1.2, 4.2, -D - 3.5); moon.target.position.set(winX - 0.2, 0, -0.2);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.left = -4; moon.shadow.camera.right = 4; moon.shadow.camera.top = 4; moon.shadow.camera.bottom = -4; moon.shadow.bias = -0.002;
  scene.add(moon); scene.add(moon.target);
  beam('#9fb4d6', new THREE.Vector3(winX + 0.25, 1.75, -D - 0.3), new THREE.Vector3(winX - 0.25, 0.1, -0.7), 0.55, 0.03, scene);

  return { scene, consts: { W, D, Hc, hx, hz, winX, mx, my, mz } };
}

const WILLIAM = { coat: '#24272b', coatLen: 'long', shirt: '#d4d0c4', tie: '#101012', trousers: '#1c1d20', skin: '#c49a80', hair: '#2a221c', beard: null };

export function vigil() {
  const { scene, consts } = cottage();
  // William, sitting the night in his father's chair, bent over, elbows on knees
  const chair = new THREE.Group(); chair.position.set(-0.05, 0, -1.05); chair.rotation.y = 0.15; scene.add(chair);
  const chairM = mat('#5a3a2a');
  box(0.62, 0.42, 0.6, chairM, 0, 0.21, 0, chair);
  box(0.62, 0.55, 0.14, chairM, 0, 0.7, -0.26, chair);
  box(0.12, 0.25, 0.6, chairM, -0.31, 0.5, 0, chair); box(0.12, 0.25, 0.6, chairM, 0.31, 0.5, 0, chair);
  const w = human(WILLIAM);
  place(w, chair, 0, 0, 0.06, 0);
  w.userData.j.hips.position.y = 0.5;
  pose(w, {
    spine: [0.55, 0.15, 0], neck: [0.1, 0.2, 0], head: [0.2, 0.45, 0],
    lHip: [-1.5, 0, 0.12], lKnee: [1.45, 0, 0], rHip: [-1.5, 0, -0.12], rKnee: [1.45, 0, 0],
    lSh: [-0.55, 0, 0.15], lEl: [-1.7, 0, 0], rSh: [-0.6, 0, -0.15], rEl: [-1.8, 0, 0],
  });

  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 40);
  camera.position.set(1.7, 2.2, 2.05);
  camera.lookAt(-0.25, 0.45, -0.8);
  return {
    scene, camera, exposure: 1.35,
    ui: {
      caption: ['The Brough', 'The vigil  -  02:47'],
      prompts: [{ pos: [consts.mx, consts.my + 0.05, consts.mz + 0.1], key: 'E', label: '' }, { pos: [consts.hx + 0.1, 1.55, consts.hz + 0.45], key: 'E', label: '' }],
    },
  };
}

export function note() {
  const { scene } = cottage();
  // William at the window, the notebook open in his hands, phone torch on it
  const w = human(WILLIAM);
  place(w, scene, 0.9, 0, -1.25, Math.PI);
  pose(w, { neck: [0.3, 0, 0], head: [0.45, 0, 0], lSh: [-0.75, 0, 0.1], lEl: [-1.1, 0, 0], rSh: [-0.7, 0, -0.1], rEl: [-1.15, 0, 0] });
  const book = box(0.3, 0.02, 0.21, mat('#d6ccb2'), 0, 0, 0); scene.add(book);
  book.position.set(0.9, 1.08, -1.62); book.rotation.x = 0.6;
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 40);
  camera.position.set(2.0, 2.25, 1.2);
  camera.lookAt(0.4, 0.8, -1.3);
  return {
    scene, camera, exposure: 0.9,
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
