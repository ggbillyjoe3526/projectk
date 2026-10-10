import * as THREE from 'three';
import { DIRECTIONS, createPipeline } from './post.js';
import { SNAP } from './lib.js';
import { drawUI } from './ui.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const dirKey = params.get('dir') || 'A';
const dir = DIRECTIONS[dirKey];

const SHOTS = {
  ferry: () => import('./scenes/ferry.js').then((m) => m.ferry()),
  vigil: () => import('./scenes/cottage.js').then((m) => m.vigil()),
  note: () => import('./scenes/cottage.js').then((m) => m.note()),
  kirk: () => import('./scenes/kirk.js').then((m) => m.kirk()),
  dialogue: () => import('./scenes/village.js').then((m) => m.dialogue()),
  combat: () => import('./scenes/village.js').then((m) => m.combat()),
};

async function run() {
  await document.fonts.ready;
  SNAP.value.set(dir.snap[0], dir.snap[1]);
  const { scene, camera, ui, exposure = 1, fogBase } = await SHOTS[shot]();
  if (scene.fog && scene.fog.isFogExp2) scene.fog.density *= dir.fogMul;
  camera.aspect = 16 / 9; camera.updateProjectionMatrix();

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(dir.w, dir.h, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  const pipe = createPipeline(renderer, dir);
  pipe.render(scene, camera, exposure);

  // Compose: world at internal res, upscaled with hard pixels, then UI at its own lo-fi res.
  const OUT_W = 1920, OUT_H = 1080;
  const out = document.createElement('canvas'); out.width = OUT_W; out.height = OUT_H;
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(renderer.domElement, 0, 0, OUT_W, OUT_H);
  if (ui) {
    const [uw, uh] = dir.ui;
    const uc = document.createElement('canvas'); uc.width = uw; uc.height = uh;
    const ug = uc.getContext('2d');
    // Dim the world behind full-screen UI first (reading), at output res.
    if (ui.dim) { g.fillStyle = `rgba(0,0,0,${ui.dim})`; g.fillRect(0, 0, OUT_W, OUT_H); }
    drawUI(ug, uw, uh, ui, dirKey, camera);
    g.drawImage(uc, 0, 0, OUT_W, OUT_H);
  }
  window.RESULT = out.toDataURL('image/png');
}

run().catch((e) => { console.error(e.stack || e); window.RESULT = 'ERR'; });
