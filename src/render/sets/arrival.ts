import { BoxGeometry, Group, Mesh, MeshStandardNodeMaterial, type Object3D, PointLight, type Scene } from 'three/webgpu';
import { SPOTS } from '../../content/crossing/places';
import { KIRK } from '../../content/levels/kirk';
import { INN, KIRKYARD_TOP, STREET } from '../../content/levels/village';
import { applyPs1Snap } from '../retro/ps1Snap';

/**
 * The small strange things of chapter 1's evening, and what the island has ready for tomorrow: a line of salt across a
 * doorstep, rowan and red thread over another door, the inn's door standing open by its lit window, the boards on the
 * high street's buildings, the notice on the locked kirk door, the grave dug by the kirkyard wall, Morag's bench at the
 * top of the pier, and William's backpack: on his back, then set down inside his father's door.
 */

function mat(color: number, roughness = 0.85, emissive = 0, emissiveIntensity = 1): MeshStandardNodeMaterial {
  return applyPs1Snap(new MeshStandardNodeMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity })) as MeshStandardNodeMaterial;
}

export interface ArrivalSet {
  /** The backpack inside the cottage door, shown once William has brought it. */
  readonly bag: Object3D;
}

/** The backpack William wears, his only luggage (William, 2026-10-10), on the player figure's back. */
export function wornBackpack(player: Object3D): Object3D {
  const pack = new Group();
  const cloth = mat(0x2a3440, 0.9);
  const body = new Mesh(new BoxGeometry(0.38, 0.48, 0.18), cloth);
  body.position.set(0, 1.08, -0.33);
  body.castShadow = true;
  const pocket = new Mesh(new BoxGeometry(0.28, 0.2, 0.06), mat(0x232b35, 0.9));
  pocket.position.set(0, 0.95, -0.44);
  const flap = new Mesh(new BoxGeometry(0.39, 0.08, 0.2), mat(0x1f262f, 0.9));
  flap.position.set(0, 1.33, -0.33);
  pack.add(body, pocket, flap);
  for (const x of [-0.12, 0.12]) {
    const strap = new Mesh(new BoxGeometry(0.05, 0.04, 0.5), cloth);
    strap.position.set(x, 1.36, -0.05);
    pack.add(strap);
  }
  player.add(pack);
  return pack;
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

  // The inn: its door standing open into the light (the chapter takes the door's wall away), and a window lit behind
  // the card.
  const [d0, d1] = INN.door;
  put(frame, d0 - 0.15, d0, top, top + 2.45, INN.maxZ - 0.02, INN.maxZ + 0.06);
  put(frame, d1, d1 + 0.15, top, top + 2.45, INN.maxZ - 0.02, INN.maxZ + 0.06);
  put(frame, d0 - 0.15, d1 + 0.15, top + 2.3, top + 2.45, INN.maxZ - 0.02, INN.maxZ + 0.06);
  put(door, d0 + 0.02, d0 + 0.08, top, top + 2.25, INN.maxZ - INN.wall - 1.5, INN.maxZ - INN.wall);
  put(mat(0x2a2214, 0.3, 0xffb860, 1.2), 73.6, 75.2, top + 0.9, top + 1.9, STREET.minZ - 0.02, STREET.minZ + 0.02);
  put(mat(0xe8e2d0, 0.9), 74.2, 74.6, top + 1.1, top + 1.4, STREET.minZ + 0.02, STREET.minZ + 0.03);
  // The light falling out of the open door on to the street.
  put(mat(0x2a2214, 0.3, 0xffb860, 0.5), d0, d1, top + 0.005, top + 0.01, STREET.minZ, STREET.minZ + 1.2);
  const innLight = new PointLight(0xffb060, 3, 7, 1.6);
  innLight.position.set(74.4, top + 1.4, STREET.minZ + 0.8);
  group.add(innLight);

  // The boards on the high street's buildings, where their signs are read; a fingerpost at the foot of the kirk lane.
  const board = mat(0x2c2a26, 0.7);
  const lettering = mat(0xcfc8b4, 0.9);
  for (const spot of SPOTS) {
    if (!spot.board) continue;
    if (spot.id === 'sign-kirk-lane') {
      put(frame, spot.x - 0.06, spot.x + 0.06, top, top + 2.2, STREET.minZ - 0.36, STREET.minZ - 0.24, true);
      put(board, spot.x - 0.05, spot.x + 1.1, top + 1.85, top + 2.1, STREET.minZ - 0.33, STREET.minZ - 0.27);
      put(lettering, spot.x + 0.2, spot.x + 0.9, top + 1.94, top + 2.01, STREET.minZ - 0.345, STREET.minZ - 0.255);
      continue;
    }
    const face = spot.board === 'north' ? STREET.minZ : STREET.maxZ;
    const out = spot.board === 'north' ? 1 : -1;
    const z0 = Math.min(face, face + out * 0.08);
    const z1 = Math.max(face, face + out * 0.08);
    put(board, spot.x - 0.85, spot.x + 0.85, top + 2.5, top + 2.95, z0, z1);
    put(lettering, spot.x - 0.6, spot.x + 0.6, top + 2.66, top + 2.79, Math.min(face, face + out * 0.1), Math.max(face, face + out * 0.1));
  }

  // The notice in its plastic sleeve on the locked kirk door.
  const doorX = (KIRK.door[0] + KIRK.door[1]) / 2;
  put(mat(0xe8e6df, 0.6), doorX - 0.18, doorX + 0.18, KIRKYARD_TOP + 1.2, KIRKYARD_TOP + 1.65, KIRK.maxZ, KIRK.maxZ + 0.02);

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

  // William's backpack, set down inside his father's door.
  const bag = put(mat(0x2a3440, 0.9), -21.0, -20.45, top, top + 0.3, 2.2, 2.6, true);
  bag.visible = false;

  scene.add(group);
  return { bag };
}
