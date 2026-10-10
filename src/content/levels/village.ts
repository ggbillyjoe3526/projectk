import type { Wall } from '../../sim/world/types';
import type { LevelArea } from '../level';
import { SHORE } from './brough';

/**
 * The village: one street running east from the shore, houses along both sides, the shop (the one building open),
 * and the lane that climbs north to the kirkyard. The east end is closed by a gate to the rest of the island.
 * Metres; +x is east, +z is south.
 */

export const STREET = { minX: 40, maxX: 92, minZ: -5, maxZ: 5, top: SHORE.top } as const;
export const SHOP = { minX: 50, maxX: 60, minZ: 5, maxZ: 13.3, wall: 0.3, door: [54, 55.6] } as const;
export const LANE = { minX: 62, maxX: 66, minZ: -12, maxZ: -5 } as const;
/** The height of the kirkyard, on its mound, where the lane arrives. */
export const KIRKYARD_TOP = 4.4;

const top = STREET.top;
const HOUSE_HEIGHT = 3.4;
const house = (minX: number, maxX: number, minZ: number, maxZ: number): Wall => ({ minX, maxX, minZ, maxZ, height: HOUSE_HEIGHT, kind: 'house', base: top });
const dyke = (minX: number, maxX: number, minZ: number, maxZ: number): Wall => ({ minX, maxX, minZ, maxZ, height: 1.2, kind: 'dyke', base: top });

function shopWalls(): Wall[] {
  const s = SHOP;
  const t = s.wall;
  const wall = (minX: number, maxX: number, minZ: number, maxZ: number): Wall => ({ minX, maxX, minZ, maxZ, height: HOUSE_HEIGHT, kind: 'house', base: top });
  return [
    wall(s.minX, s.minX + t, s.minZ, s.maxZ),
    wall(s.maxX - t, s.maxX, s.minZ, s.maxZ),
    wall(s.minX, s.maxX, s.maxZ - t, s.maxZ),
    // The shop front, with its door onto the street.
    wall(s.minX + t, s.door[0], s.minZ, s.minZ + t),
    wall(s.door[1], s.maxX - t, s.minZ, s.minZ + t),
    // The counter.
    { minX: 52, maxX: 57, minZ: 9.5, maxZ: 10.3, height: 1.0, kind: 'stone' },
  ];
}

const SODIUM = 0xffa347;
const lamp = (x: number, z: number) => [
  { kind: 'block', box: { minX: x - 0.08, maxX: x + 0.08, minZ: z - 0.08, maxZ: z + 0.08 }, bottom: top, top: top + 4.6, material: 'stone' },
  { kind: 'light', x, y: top + 4.5, z, color: SODIUM, intensity: 9, distance: 13, decay: 1.4 },
] as const;

export const VILLAGE_AREA: LevelArea = {
  ground: [
    { ...STREET, kind: 'road', height: top },
    { minX: SHOP.minX + SHOP.wall, maxX: SHOP.maxX - SHOP.wall, minZ: SHOP.minZ, maxZ: SHOP.maxZ - SHOP.wall, kind: 'flagstone', height: top },
    // The lane climbs from the street to the kirkyard on its mound.
    { ...LANE, kind: 'road', height: { axis: 'z', from: KIRKYARD_TOP, to: top } },
  ],
  walls: [
    // Where the shore meets the village: dykes either side of the street.
    dyke(SHORE.maxX, SHORE.maxX + 0.6, -12, STREET.minZ),
    dyke(SHORE.maxX, SHORE.maxX + 0.6, STREET.maxZ, SHORE.maxZ),
    // The north side of the street, with the lane between the second and third houses.
    house(40.6, 52.5, -12, STREET.minZ),
    house(52.5, LANE.minX, -12, STREET.minZ),
    house(LANE.maxX, 78, -12, STREET.minZ),
    dyke(78, STREET.maxX, STREET.minZ - 0.6, STREET.minZ),
    // The south side, with the shop.
    house(40.6, SHOP.minX, STREET.maxZ, 11),
    ...shopWalls(),
    house(SHOP.maxX, 72, STREET.maxZ, 11),
    house(72, 84, STREET.maxZ, 11),
    dyke(84, STREET.maxX, STREET.maxZ, STREET.maxZ + 0.6),
    // The gate to the rest of the island, shut for now.
    { minX: STREET.maxX, maxX: STREET.maxX + 0.6, minZ: STREET.minZ, maxZ: STREET.maxZ, height: 1.6, kind: 'gate', base: top },
  ],
  interiors: [{ minX: SHOP.minX, maxX: SHOP.maxX, minZ: SHOP.minZ + SHOP.wall, maxZ: SHOP.maxZ }],
  cameras: [
    {
      id: 'shop',
      indoors: true,
      bounds: { minX: SHOP.minX, maxX: SHOP.maxX, minZ: SHOP.minZ, maxZ: SHOP.maxZ },
      rig: { type: 'fixed', position: [50.8, top + 5.5, 5.8] },
      fov: 62,
      lookOffset: [0, 0.6, 0],
    },
    {
      // From the street, looking up the lane to the lychgate.
      id: 'lane',
      bounds: LANE,
      rig: { type: 'fixed', position: [64, top + 6.8, 1.5] },
      fov: 50,
      lookOffset: [0, 0.8, -2],
    },
    {
      // Over the south side's eaves, looking steeply down the street so the houses on that side stay out of shot.
      id: 'street',
      bounds: STREET,
      rig: { type: 'rail', from: [37, top + 9, 6], to: [89, top + 9, 6], lead: 0 },
      fov: 50,
      lookOffset: [1.5, 0.4, -1.5],
    },
  ],
  dead: [
    { x: 58, z: 1.5, facing: -Math.PI / 2 },
    { x: 82, z: -2, facing: -Math.PI / 2 },
  ],
  dressing: [
    // The island beyond the walls: moorland, then rising ground to the east and north.
    { kind: 'block', box: { minX: SHORE.maxX + 0.6, maxX: 130, minZ: -70, maxZ: 70 }, bottom: -2.5, top: top - 0.05, material: 'moor' },
    { kind: 'block', box: { minX: 96, maxX: 160, minZ: -70, maxZ: 70 }, bottom: -2.5, top: top + 6, material: 'cliff' },
    { kind: 'block', box: { minX: 40, maxX: 96, minZ: -80, maxZ: -40 }, bottom: -2.5, top: top + 4, material: 'cliff' },
    ...lamp(50, -4.2),
    ...lamp(76, 4.2),
  ],
};
