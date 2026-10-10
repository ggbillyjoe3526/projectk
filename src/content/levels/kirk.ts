import type { Wall } from '../../sim/world/types';
import type { LevelArea } from '../level';
import { SHORE } from './brough';
import { KIRKYARD_TOP, LANE } from './village';

/**
 * The kirkyard on its mound north of the village, and the kirk, built over the howe. The old sword lies on the slab
 * before the altar. The vestry off the kirk's north-east corner is a refuge. A locked back gate on the west side looks
 * down steps to the shore: the shortcut home, once it's opened from inside. Metres; +x is east, +z is south.
 */

export const KIRKYARD = { minX: 46, maxX: 76, minZ: -36, maxZ: -12 } as const;
export const KIRK = { minX: 54, maxX: 70, minZ: -35.4, maxZ: -23.4, wall: 0.6, height: 5, door: [60.8, 63.2] } as const;
export const VESTRY = { minX: 66.4, maxX: KIRK.maxX - KIRK.wall, minZ: KIRK.minZ + KIRK.wall, maxZ: -29.8, door: [-31.2, -29.8] } as const;
const BACK_GATE = { minZ: -16, maxZ: -12.6 } as const;
/** The slab where they opened the howe, and where the sword lies. */
export const SLAB = { minX: 61, maxX: 63, minZ: -33.8, maxZ: -32.6, height: 0.45 } as const;

const top = KIRKYARD_TOP;
const dyke = (minX: number, maxX: number, minZ: number, maxZ: number): Wall => ({ minX, maxX, minZ, maxZ, height: 1.4, kind: 'dyke' });
const kirkWall = (minX: number, maxX: number, minZ: number, maxZ: number): Wall => ({ minX, maxX, minZ, maxZ, height: KIRK.height, kind: 'kirk' });
const pew = (minX: number, maxX: number, z: number): Wall => ({ minX, maxX, minZ: z, maxZ: z + 0.4, height: 0.5, kind: 'pew' });
const stone = (x: number, z: number): Wall => ({ minX: x - 0.35, maxX: x + 0.35, minZ: z - 0.09, maxZ: z + 0.09, height: 0.9, kind: 'gravestone' });

function kirkWalls(): Wall[] {
  const k = KIRK;
  const t = k.wall;
  const v = VESTRY;
  return [
    kirkWall(k.minX, k.maxX, k.minZ, k.minZ + t),
    kirkWall(k.minX, k.minX + t, k.minZ + t, k.maxZ),
    kirkWall(k.maxX - t, k.maxX, k.minZ + t, k.maxZ),
    kirkWall(k.minX + t, k.door[0], k.maxZ - t, k.maxZ),
    kirkWall(k.door[1], k.maxX - t, k.maxZ - t, k.maxZ),
    // The vestry, partitioned off with a door on its west side.
    { minX: v.minX - 0.4, maxX: v.minX, minZ: v.minZ, maxZ: v.door[0], height: 3, kind: 'kirk' },
    { minX: v.minX - 0.4, maxX: v.maxX, minZ: v.maxZ, maxZ: v.maxZ + 0.4, height: 3, kind: 'kirk' },
    { ...SLAB, kind: 'stone' },
    // Pews either side of the aisle that leads to the slab.
    ...[-31, -29, -27].flatMap((z) => [pew(56, 60.4, z), pew(63.6, 65.8, z)]),
  ];
}

export const KIRK_AREA: LevelArea = {
  ground: [
    { minX: KIRK.minX + KIRK.wall, maxX: KIRK.maxX - KIRK.wall, minZ: KIRK.minZ + KIRK.wall, maxZ: KIRK.maxZ - KIRK.wall, kind: 'flagstone', height: top },
    { ...KIRKYARD, kind: 'grass', height: top },
    // Steps down from the back gate to the shore.
    { minX: SHORE.maxX, maxX: KIRKYARD.minX, minZ: BACK_GATE.minZ, maxZ: -12, kind: 'road', height: { axis: 'x', from: SHORE.top, to: top } },
  ],
  walls: [
    // The kirkyard dyke, open to the lane at the lychgate, with the locked back gate on the west.
    dyke(KIRKYARD.minX, LANE.minX, -12.6, KIRKYARD.maxZ),
    dyke(LANE.maxX, KIRKYARD.maxX, -12.6, KIRKYARD.maxZ),
    dyke(KIRKYARD.minX, KIRKYARD.minX + 0.6, KIRKYARD.minZ, BACK_GATE.minZ),
    { minX: KIRKYARD.minX, maxX: KIRKYARD.minX + 0.6, minZ: BACK_GATE.minZ, maxZ: BACK_GATE.maxZ, height: 1.6, kind: 'gate' },
    dyke(KIRKYARD.minX, KIRKYARD.maxX, KIRKYARD.minZ, KIRKYARD.minZ + 0.6),
    dyke(KIRKYARD.maxX - 0.6, KIRKYARD.maxX, KIRKYARD.minZ + 0.6, -12.6),
    ...kirkWalls(),
    // The war memorial by the lychgate.
    { minX: 67, maxX: 68.6, minZ: -16, maxZ: -14.8, height: 2.4, kind: 'stone' },
    ...[[49, -20], [51, -20], [49, -24], [51, -24], [49, -28], [51, -28], [50, -32], [72.5, -22], [72.5, -26], [72.5, -30], [72.5, -33], [56, -18], [58, -18], [57, -15], [71, -19]].map(([x, z]) => stone(x!, z!)),
  ],
  interiors: [
    { minX: KIRK.minX, maxX: KIRK.maxX, minZ: KIRK.minZ, maxZ: KIRK.maxZ },
    { minX: VESTRY.minX, maxX: VESTRY.maxX, minZ: VESTRY.minZ, maxZ: VESTRY.maxZ, refuge: true },
  ],
  cameras: [
    {
      id: 'vestry',
      indoors: true,
      bounds: { minX: VESTRY.minX, maxX: VESTRY.maxX, minZ: VESTRY.minZ, maxZ: VESTRY.maxZ },
      rig: { type: 'fixed', position: [VESTRY.minX + 0.4, top + 4.5, VESTRY.maxZ - 0.3] },
      fov: 66,
      lookOffset: [0, 0.4, 0],
    },
    {
      id: 'kirk',
      indoors: true,
      bounds: { minX: KIRK.minX, maxX: KIRK.maxX, minZ: KIRK.minZ, maxZ: KIRK.maxZ },
      rig: { type: 'fixed', position: [68.8, top + 6.5, -24.6] },
      fov: 64,
      lookOffset: [0, 0.6, 0],
    },
    {
      id: 'kirkyard',
      bounds: { minX: SHORE.maxX, maxX: KIRKYARD.maxX, minZ: KIRKYARD.minZ, maxZ: KIRKYARD.maxZ },
      rig: { type: 'crane', offset: [0, 9, 9], min: [44, 12, -32], max: [76, 20, -4] },
      fov: 50,
      lookOffset: [0, 0.4, -1],
    },
  ],
  dead: [
    { x: 52, z: -26, facing: 0 },
    { x: 72, z: -17, facing: Math.PI },
    { x: 58, z: -25, facing: 0 },
  ],
};
