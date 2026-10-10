import * as THREE from 'three';
import { skyEnv, shadowLight, mesh } from '../lib.js';
import { person } from '../cast.js';

export async function lineup({ renderer, M }) {
  const scene = new THREE.Scene();
  const { env } = await skyEnv(renderer, 'overcast');
  scene.environment = env; scene.background = new THREE.Color('#2a2c30'); scene.environmentIntensity = 0.5;
  const ids = new URLSearchParams(location.search).get('ids').split(',');
  scene.add(mesh(new THREE.PlaneGeometry(30, 10).rotateX(-Math.PI / 2), M.flags));
  const n = ids.length;
  for (let i = 0; i < n; i++) scene.add(await person(ids[i], M, { pos: [(i - (n - 1) / 2) * 1.1, 0, 0] }));
  const sun = shadowLight(new THREE.DirectionalLight('#ffe8d0', 2.5), 2048, 8); sun.position.set(3, 6, 6); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 100);
  camera.position.set(0, 1.3, n * 1.1 * 0.95 + 0.5); camera.lookAt(0, 0.95, 0);
  return { scene, camera };
}
