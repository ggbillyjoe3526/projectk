import { BoxGeometry, Group, Mesh, MeshStandardNodeMaterial, type Object3D, PointLight, type Scene } from 'three/webgpu';
import { KIRKYARD_TOP, STREET } from '../../content/levels/village';
import { applyPs1Snap } from '../retro/ps1Snap';

/**
 * The small strange things of chapter 1's evening, and what the island has ready for tomorrow: a line of salt across a
 * doorstep, rowan and red thread over another door, the inn shut with its card in the lit window, the grave dug by the
 * kirkyard wall, Morag's bench at the top of the pier, and William's bag, set down inside his father's door.
 */

function mat(color: number, roughness = 0.85, emissive = 0, emissiveIntensity = 1): MeshStandardNodeMaterial {
  return applyPs1Snap(new MeshStandardNodeMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity })) as MeshStandardNodeMaterial;
}

export interface ArrivalSet {
  /** The bag inside the cottage door, shown once William has brought it. */
  readonly bag: Object3D;
}

export function buildArrival(scene: Scene): ArrivalSet {
  const group = new Group();
  const put = (m: MeshStandardNodeMaterial, minX: number, maxX: number, y0: number, y1: number, minZ: number, maxZ: number, cast = false): Mesh => {
    const mesh = new Mesh(new BoxGeometry(maxX - minX, y1 - y0, maxZ - minZ), m);
    mesh.position.set((minX + maxX) / 2, (y0 + y1) / 2, (minZ + maxZ) / 2);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const top = STREET.top;
  const door = mat(0x2a2422, 0.7);
  const frame = mat(0x9a948a, 0.8);

  // A house door on the north side of the street, a line of salt across its step.
  put(frame, 46.35, 47.65, top, top + 2.15, STREET.minZ - 0.06, STREET.minZ);
  put(door, 46.5, 47.5, top, top + 2.0, STREET.minZ - 0.02, STREET.minZ + 0.02);
  put(mat(0x6a6660), 46.4, 47.6, top, top + 0.12, STREET.minZ, STREET.minZ + 0.35);
  put(mat(0xf0eee8, 0.95), 46.45, 47.55, top + 0.12, top + 0.135, STREET.minZ + 0.12, STREET.minZ + 0.2);

  // A door on the south side, rowan and red thread over it.
  put(frame, 44.85, 46.15, top, top + 2.15, STREET.maxZ, STREET.maxZ + 0.06);
  put(door, 45.0, 46.0, top, top + 2.0, STREET.maxZ - 0.02, STREET.maxZ + 0.02);
  put(mat(0x2e4a26), 45.1, 45.9, top + 2.2, top + 2.32, STREET.maxZ - 0.12, STREET.maxZ - 0.02);
  for (const x of [45.25, 45.5, 45.72]) put(mat(0xa8201a, 0.6), x - 0.04, x + 0.04, top + 2.12, top + 2.2, STREET.maxZ - 0.1, STREET.maxZ - 0.04);
  put(mat(0xb01c18, 0.6), 45.48, 45.52, top + 2.0, top + 2.22, STREET.maxZ - 0.07, STREET.maxZ - 0.05);

  // The inn: its door, a board over it, and a window lit behind the card.
  put(frame, 70.85, 72.15, top, top + 2.15, STREET.minZ - 0.06, STREET.minZ);
  put(door, 71.0, 72.0, top, top + 2.0, STREET.minZ - 0.02, STREET.minZ + 0.02);
  put(mat(0x3a2a1a, 0.7), 70.4, 72.6, top + 2.35, top + 2.85, STREET.minZ - 0.02, STREET.minZ + 0.06);
  put(mat(0x2a2214, 0.3, 0xffb860, 1.2), 72.6, 74.2, top + 0.9, top + 1.9, STREET.minZ - 0.02, STREET.minZ + 0.02);
  put(mat(0xe8e2d0, 0.9), 73.2, 73.6, top + 1.1, top + 1.4, STREET.minZ + 0.02, STREET.minZ + 0.03);
  const innLight = new PointLight(0xffb060, 3, 7, 1.6);
  innLight.position.set(73.4, top + 1.4, STREET.minZ + 0.8);
  group.add(innLight);

  // The grave by the kirkyard wall: the spoil heaped beside it, a tarpaulin weighted with stones over the hole.
  const k = KIRKYARD_TOP;
  put(mat(0x3a2e22, 1), 52.2, 54.2, k, k + 0.45, -17.6, -16.9, true);
  put(mat(0x24332c, 0.6), 52.3, 54.1, k + 0.01, k + 0.04, -16.8, -15.9);
  for (const [x, z] of [[52.4, -16.7], [54.0, -16.7], [52.4, -16.0], [54.0, -16.0]] as const) put(mat(0x5a5a54), x - 0.1, x + 0.1, k, k + 0.12, z - 0.08, z + 0.08, true);

  // Morag's bench at the top of the pier.
  const wood = mat(0x4a3a2a, 0.9);
  put(wood, 29.7, 31.3, top + 0.42, top + 0.48, 14.85, 15.3, true);
  put(wood, 29.7, 31.3, top + 0.48, top + 0.9, 15.25, 15.3, true);
  for (const x of [29.85, 31.15]) put(wood, x - 0.04, x + 0.04, top, top + 0.42, 14.9, 15.25);

  // William's bag, set down inside his father's door.
  const bag = put(mat(0x2a3440, 0.9), -21.0, -20.45, top, top + 0.3, 2.2, 2.6, true);
  bag.visible = false;

  scene.add(group);
  return { bag };
}
