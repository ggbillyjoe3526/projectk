import { Mesh, MeshPhongNodeMaterial, PlaneGeometry } from 'three/webgpu';
import { positionLocal, sin, time, vec3 } from 'three/tsl';
import { applyPs1Snap } from './retro/ps1Snap';

/** The sea. Its height is the tide level; a gentle swell moves the surface. */
export function createSea(): Mesh {
  const geometry = new PlaneGeometry(260, 260, 80, 80);
  geometry.rotateX(-Math.PI / 2);
  const material = new MeshPhongNodeMaterial({ color: 0x203b46, specular: 0x5d7684, shininess: 36, transparent: true, opacity: 0.9 });
  const p = positionLocal;
  const swell = sin(p.x.mul(0.35).add(time.mul(0.9))).mul(0.06).add(sin(p.z.mul(0.27).sub(time.mul(0.7))).mul(0.05));
  material.positionNode = vec3(p.x, p.y.add(swell), p.z);
  applyPs1Snap(material);
  const sea = new Mesh(geometry, material);
  sea.receiveShadow = true;
  sea.name = 'sea';
  return sea;
}
