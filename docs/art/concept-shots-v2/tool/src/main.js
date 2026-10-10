import * as THREE from 'three';
import { createPipeline } from './post.js';
import { drawUI } from './ui.js';
import { materials, setAniso } from './lib.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const variant = params.get('dir') || 'B'; // B = normal, M = low Resolve (monochrome, red kept)

const SHOTS = {
  test: () => import('./scenes/test.js').then((m) => m.test),
  head: () => import('./scenes/headtest.js').then((m) => m.headtest),
  lineup: () => import('./scenes/lineup.js').then((m) => m.lineup),
  testface: () => import('./scenes/test.js').then((m) => m.testface),
  ferry: () => import('./scenes/ferry.js').then((m) => m.ferry),
  vigil: () => import('./scenes/cottage.js').then((m) => m.vigil),
  note: () => import('./scenes/cottage.js').then((m) => m.note),
  kirk: () => import('./scenes/kirk.js').then((m) => m.kirk),
  dialogue: () => import('./scenes/village.js').then((m) => m.dialogue),
  combat: () => import('./scenes/village.js').then((m) => m.combat),
};

async function run() {
  await document.fonts.ready;
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  setAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  const M = await materials();
  const build = await SHOTS[shot]();
  const { scene, camera, ui, look = {} } = await build({ renderer, M, mono: variant === 'M' });
  const L = { ...look, mono: variant === 'M' ? 1 : 0 };
  renderer.setSize(L.w || 1280, L.h || 720, false);
  camera.aspect = 16 / 9; camera.updateProjectionMatrix();
  const pipe = createPipeline(renderer, scene, camera, L);
  pipe.render();

  const OUT_W = 1920, OUT_H = 1080;
  const out = document.createElement('canvas'); out.width = OUT_W; out.height = OUT_H;
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(renderer.domElement, 0, 0, OUT_W, OUT_H);
  if (ui) {
    const uc = document.createElement('canvas'); uc.width = 960; uc.height = 540;
    const ug = uc.getContext('2d');
    if (ui.dim) { g.fillStyle = `rgba(0,0,0,${ui.dim})`; g.fillRect(0, 0, OUT_W, OUT_H); }
    drawUI(ug, 960, 540, ui, variant === 'M' ? 'C' : 'B', camera);
    g.imageSmoothingEnabled = false;
    g.drawImage(uc, 0, 0, OUT_W, OUT_H);
  }
  window.RESULT = out.toDataURL('image/png');
}

run().catch((e) => { console.error(e.stack || e); window.RESULT = 'ERR'; });
