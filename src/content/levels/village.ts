import type { Wall } from '../../sim/world/types';
import type { LevelArea } from '../level';
import { SHORE } from './brough';

/**
 * The village: the island's high street, running east from the shore, with buildings along both sides (the post office,
 * the heritage centre, the Skerry Inn, the surgery, the shop, the bakery, the hall), and the lane that climbs north to
 * the kirkyard. The shop and the inn have rooms you can go into; the inn's door is shut except when it's open for
 * business (chapter 1 opens it). The east end is closed by a gate to the rest of the island.
 * Metres; +x is east, +z is south.
 */

export const STREET = { minX: 40, maxX: 92, minZ: -5, maxZ: 5, top: SHORE.top } as const;
export const SHOP = { minX: 50, maxX: 60, minZ: 5, maxZ: 13.3, wall: 0.3, door: [54, 55.6] } as const;
export const LANE = { minX: 62, maxX: 66, minZ: -12, maxZ: -5 } as const;
/** The Skerry Inn, on the north side east of the lane: one long room with the bar, the fire and the stair. */
export const INN = { minX: 66, maxX: 78, minZ: -12, maxZ: -5, wall: 0.3, height: 4.4, door: [68, 69.6] } as const;
/** The inn's front door: a wall with an id, shut unless the inn is open. */
export const INN_DOOR = 'inn-door';
/** The bar counter, and where whoever keeps the inn stands behind it. */
export const INN_BAR = { minX: 70.5, maxX: 76.2, minZ: -10.4, maxZ: -9.8 } as const;
/** The stair up to the rooms, against the east wall. */
export const INN_STAIR = { minX: 76.5, maxX: INN.maxX - INN.wall, minZ: -10.2, maxZ: -7.2 } as const;
/**
 * The high street's buildings, west to east on each side, with what their signs say (chapter 1 draws the signs).
 * `height` varies so the street isn't one wall.
 */
export const BUILDINGS = {
  postOffice: { minX: 40.6, maxX: 46.5, minZ: -12, maxZ: -5, height: 3.2 },
  fletts: { minX: 46.5, maxX: 52.5, minZ: -12, maxZ: -5, height: 3.8 },
  heritage: { minX: 52.5, maxX: 62, minZ: -12, maxZ: -5, height: 4.2 },
  garage: { minX: 78, maxX: 85, minZ: -12, maxZ: -5, height: 3 },
  taits: { minX: 85, maxX: 92, minZ: -12, maxZ: -5, height: 3.5 },
  surgery: { minX: 40.6, maxX: 50, minZ: 5, maxZ: 11, height: 3.6 },
  bakery: { minX: 60, maxX: 66, minZ: 5, maxZ: 11, height: 3.3 },
  manse: { minX: 66, maxX: 72, minZ: 5, maxZ: 11, height: 3.9 },
  crafts: { minX: 72, maxX: 78, minZ: 5, maxZ: 11, height: 3.2 },
  isbisters: { minX: 78, maxX: 84, minZ: 5, maxZ: 11, height: 3.6 },
  hall: { minX: 84, maxX: 92, minZ: 5, maxZ: 11, height: 4.6 },
} as const;
/** The height of the kirkyard, on its mound, where the lane arrives. */
export const KIRKYARD_TOP = 4.4;

const top = STREET.top;
const HOUSE_HEIGHT = 3.4;
const house = (minX: number, maxX: number, minZ: number, maxZ: number, height: number = HOUSE_HEIGHT): Wall => ({ minX, maxX, minZ, maxZ, height, kind: 'house', base: top });
const building = (b: { minX: number; maxX: number; minZ: number; maxZ: number; height: number }): Wall => house(b.minX, b.maxX, b.minZ, b.maxZ, b.height);
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

function innWalls(): Wall[] {
  const n = INN;
  const t = n.wall;
  const wall = (minX: number, maxX: number, minZ: number, maxZ: number): Wall => ({ minX, maxX, minZ, maxZ, height: n.height, kind: 'house', base: top });
  const furniture = (minX: number, maxX: number, minZ: number, maxZ: number, height: number, kind: Wall['kind']): Wall => ({ minX, maxX, minZ, maxZ, height, kind, base: top });
  return [
    wall(n.minX, n.maxX, n.minZ, n.minZ + t),
    wall(n.minX, n.minX + t, n.minZ + t, n.maxZ),
    wall(n.maxX - t, n.maxX, n.minZ + t, n.maxZ),
    // The front, onto the street, with its door.
    wall(n.minX + t, n.door[0], n.maxZ - t, n.maxZ),
    wall(n.door[1], n.maxX - t, n.maxZ - t, n.maxZ),
    { id: INN_DOOR, minX: n.door[0], maxX: n.door[1], minZ: n.maxZ - t, maxZ: n.maxZ, height: 2.3, kind: 'gate', base: top },
    // The bar, the fire against the west wall, two tables, and the stair.
    furniture(INN_BAR.minX, INN_BAR.maxX, INN_BAR.minZ, INN_BAR.maxZ, 1.05, 'stone'),
    furniture(n.minX + t, n.minX + t + 0.6, -9.8, -8.2, 1.3, 'stone'),
    furniture(68.4, 69.4, -8.2, -7.4, 0.75, 'pew'),
    furniture(73, 74, -7.4, -6.6, 0.75, 'pew'),
    furniture(INN_STAIR.minX, INN_STAIR.maxX, INN_STAIR.minZ, INN_STAIR.maxZ, 1.4, 'stone'),
  ];
}

const SODIUM = 0xffa347;
const HEARTH = 0xff9a4a;
const lamp = (x: number, z: number) => [
  { kind: 'block', box: { minX: x - 0.08, maxX: x + 0.08, minZ: z - 0.08, maxZ: z + 0.08 }, bottom: top, top: top + 4.6, material: 'stone' },
  { kind: 'light', x, y: top + 4.5, z, color: SODIUM, intensity: 9, distance: 13, decay: 1.4 },
] as const;

export const VILLAGE_AREA: LevelArea = {
  ground: [
    { ...STREET, kind: 'road', height: top },
    { minX: SHOP.minX + SHOP.wall, maxX: SHOP.maxX - SHOP.wall, minZ: SHOP.minZ, maxZ: SHOP.maxZ - SHOP.wall, kind: 'flagstone', height: top },
    { minX: INN.minX + INN.wall, maxX: INN.maxX - INN.wall, minZ: INN.minZ + INN.wall, maxZ: INN.maxZ, kind: 'flagstone', height: top },
    // The lane climbs from the street to the kirkyard on its mound.
    { ...LANE, kind: 'road', height: { axis: 'z', from: KIRKYARD_TOP, to: top } },
  ],
  walls: [
    // Where the shore meets the village: dykes either side of the street.
    dyke(SHORE.maxX, SHORE.maxX + 0.6, -12, STREET.minZ),
    dyke(SHORE.maxX, SHORE.maxX + 0.6, STREET.maxZ, SHORE.maxZ),
    // The north side of the street, with the lane up to the kirk between the heritage centre and the inn.
    building(BUILDINGS.postOffice),
    building(BUILDINGS.fletts),
    building(BUILDINGS.heritage),
    ...innWalls(),
    building(BUILDINGS.garage),
    building(BUILDINGS.taits),
    // The south side, with the shop.
    building(BUILDINGS.surgery),
    ...shopWalls(),
    building(BUILDINGS.bakery),
    building(BUILDINGS.manse),
    building(BUILDINGS.crafts),
    building(BUILDINGS.isbisters),
    building(BUILDINGS.hall),
    // The gate to the rest of the island, shut for now.
    { minX: STREET.maxX, maxX: STREET.maxX + 0.6, minZ: STREET.minZ, maxZ: STREET.maxZ, height: 1.6, kind: 'gate', base: top },
  ],
  interiors: [
    { minX: SHOP.minX, maxX: SHOP.maxX, minZ: SHOP.minZ + SHOP.wall, maxZ: SHOP.maxZ },
    { minX: INN.minX, maxX: INN.maxX, minZ: INN.minZ, maxZ: INN.maxZ - INN.wall },
  ],
  cameras: [
    {
      // From high over the inn's front wall, looking down into the roofless greybox room: the bar along the back, the fire and the stair.
      id: 'inn',
      indoors: true,
      bounds: { minX: INN.minX, maxX: INN.maxX, minZ: INN.minZ, maxZ: INN.maxZ },
      rig: { type: 'fixed', position: [(INN.minX + INN.maxX) / 2, top + 8.5, INN.maxZ + 1.2] },
      fov: 62,
      lookOffset: [0, 0.6, 0],
    },
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
  things: [
    {
      id: 'shop-notice',
      kind: 'document',
      x: 54.5,
      z: 9.9,
      title: 'A notice on the counter',
      lines: [
        'A notice, handwritten, propped against the till:',
        'CLOSED FRIDAY for Alan Sloan’s funeral.',
        'Service at the kirk, ten o’clock. Low water’s at nine, so come over early from the Brough side.',
        'Honesty box as usual. Back Saturday. — I.',
      ],
    },
  ],
  dead: [
    { x: 58, z: 1.5, facing: -Math.PI / 2 },
    { x: 82, z: -2, facing: -Math.PI / 2 },
  ],
  dressing: [
    // The island beyond the walls: moorland, then rising ground to the east and north. To the south it ends at the
    // shore's line, with the harbour beyond it: open water where the ferry ties up and turns.
    { kind: 'block', box: { minX: SHORE.maxX + 0.6, maxX: 130, minZ: -70, maxZ: SHORE.maxZ }, bottom: -2.5, top: top - 0.05, material: 'moor' },
    { kind: 'block', box: { minX: 96, maxX: 160, minZ: -70, maxZ: 70 }, bottom: -2.5, top: top + 6, material: 'cliff' },
    { kind: 'block', box: { minX: 40, maxX: 96, minZ: -80, maxZ: -40 }, bottom: -2.5, top: top + 4, material: 'cliff' },
    ...lamp(50, -4.2),
    ...lamp(76, 4.2),
    // Inside the inn: the fire, and a lamp over the bar.
    { kind: 'light', x: INN.minX + 1.2, y: top + 0.9, z: -9, color: HEARTH, intensity: 5, distance: 8, decay: 1.6 },
    { kind: 'light', x: 73.4, y: top + 3, z: -8.6, color: 0xffc88a, intensity: 4, distance: 9, decay: 1.5 },
  ],
};
