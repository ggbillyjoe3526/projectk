import * as THREE from 'three';
import { character, personMats, hdri, shadowLight, mesh, rbox, plain, pbr } from '../lib.js';

export const testface = (c) => test(c, true);
export async function test({ renderer, M }, face) {
  const scene = new THREE.Scene();
  const { env, bg } = await hdri(renderer, 'quarry_01_1k.hdr');
  scene.environment = env; scene.background = bg; scene.environmentIntensity = 0.6; scene.backgroundIntensity = 0.6;
  scene.add(mesh(new THREE.PlaneGeometry(8, 8).rotateX(-Math.PI / 2), M.flags));
  scene.add(mesh(rbox(3, 2.4, 0.4, 0.03), M.harl, { pos: [0, 1.2, -1.5] }));
  const P = await personMats({ skin: '#e4bba2', hair: '#2b2420' });
  const hair = await pbr('hair', { color: '#3a2c22' });
  const w = await character('test_william', { ...P, coat: M.wool_charcoal, shirt: M.shirt, tie: M.wool_black, trousers: M.trouser_dark, shoes: M.leather }, { head: { hair, skin: '#f2dcd0' } });
  scene.add(w);
  const sun = shadowLight(new THREE.DirectionalLight('#ffe2c0', 3.0), 2048, 3);
  sun.position.set(2, 4, 3); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 100);
  camera.position.set(0.9, 1.5, 2.6); camera.lookAt(0, 1.15, 0);
  if (face) { camera.position.set(0.3, 1.62, 0.95); camera.lookAt(0, 1.5, 0); }
  return { scene, camera };
}
