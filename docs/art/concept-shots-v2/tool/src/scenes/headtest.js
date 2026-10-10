import * as THREE from 'three';
import { hdri, scanHead, pbr } from '../lib.js';

export async function headtest({ renderer }) {
  const scene = new THREE.Scene();
  const { env } = await hdri(renderer, 'quarry_01_1k.hdr');
  scene.environment = env; scene.background = new THREE.Color('#333'); scene.environmentIntensity = 0.7;
  const hair = await pbr('hair', { color: '#3a2c22' });
  const a = await scanHead({ hair }); scene.add(a);
  const b = await scanHead({ hair: await pbr('hair', { color: '#8a8580' }), warp: { width: 0.93, jaw: 0.88, nose: 0.85, brow: 0.6, len: 0.97 }, skin: '#f0d8d0', look: [0.3, 0, 1] });
  b.position.x = 0.24; b.rotation.y = -0.5; scene.add(b);
  const c = await scanHead({ pale: true, glow: '#ffd27a' }); c.position.x = -0.24; c.rotation.y = 0.5; scene.add(c);
  const sun = new THREE.DirectionalLight('#fff', 2); sun.position.set(3, 5, 8); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.01, 50);
  const close = new URLSearchParams(location.search).get('close');
  camera.position.set(0.05, 0.12, close ? 0.35 : 0.9); camera.lookAt(0, 0.1, 0);
  return { scene, camera, look: { ao: false } };
}
