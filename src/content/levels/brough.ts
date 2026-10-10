import type { Prop, Wall } from '../../sim/world/types';
import type { LevelArea } from '../level';

/**
 * The Brough (the tidal islet with the father's cottage and the lighthouse), the causeway, and the shore of the main
 * island, in greybox. Metres; +x is east, +z is south.
 */

export const ISLET = { minX: -34, maxX: -12, minZ: -12, maxZ: 12, top: 3.2 } as const;
export const CAUSEWAY = { minX: -12, maxX: 12, halfWidth: 1.5, top: 0.15, rampLength: 7 } as const;
export const SHORE = { minX: 12, maxX: 40, minZ: -16, maxZ: 16, top: 3.2 } as const;
export const CHANNEL_FLOOR = -2.5;

export const COTTAGE = { minX: -28, maxX: -20, minZ: -3, maxZ: 3, wall: 0.3, height: 2.6, door: 0.8 } as const;

/** Where the cottage's furniture stands: each blocks the way, and the cottage set draws it. */
const FURNITURE = {
  hearth: { minX: -27.9, maxX: -26.1, minZ: -3, maxZ: -2.55 },
  table: { minX: -25.2, maxX: -23.8, minZ: -1.2, maxZ: 0.2 },
  dresser: { minX: -25.4, maxX: -23.8, minZ: 2.4, maxZ: 3 },
  bier: { minX: -27.7, maxX: -25.7, minZ: 1.6, maxZ: 2.4 },
  shelf: { minX: -28, maxX: -27.68, minZ: -1.0, maxZ: -0.1 },
} as const;

function cottageWalls(): Wall[] {
  const c = COTTAGE;
  const t = c.wall;
  const kind = 'cottage' as const;
  return [
    { minX: c.minX - t, maxX: c.maxX + t, minZ: c.minZ - t, maxZ: c.minZ, height: c.height, kind },
    { minX: c.minX - t, maxX: c.maxX + t, minZ: c.maxZ, maxZ: c.maxZ + t, height: c.height, kind },
    { minX: c.minX - t, maxX: c.minX, minZ: c.minZ, maxZ: c.maxZ, height: c.height, kind },
    // East wall, with the door facing the causeway.
    { minX: c.maxX, maxX: c.maxX + t, minZ: c.minZ, maxZ: -c.door, height: c.height, kind },
    { minX: c.maxX, maxX: c.maxX + t, minZ: c.door, maxZ: c.maxZ, height: c.height, kind },
  ];
}

const WALLS: Wall[] = [
  ...cottageWalls(),
  { minX: -31.2, maxX: -28.8, minZ: -9.2, maxZ: -6.8, height: 9, kind: 'lighthouse' },
  { minX: 17.6, maxX: 18.4, minZ: -4.25, maxZ: -3.75, height: 3.2, kind: 'standingStone' },
  { minX: 22, maxX: 23.4, minZ: 5, maxZ: 6.2, height: 1.1, kind: 'boulder' },
  { minX: 15, maxX: 16, minZ: 7.5, maxZ: 8.3, height: 0.8, kind: 'boulder' },
  { minX: 26, maxX: 26.6, minZ: -16, maxZ: -5, height: 1.2, kind: 'dyke' },
  { minX: 26, maxX: 26.6, minZ: -2, maxZ: 16, height: 1.2, kind: 'dyke' },
  // The cottage's furniture, drawn by its set (render/sets/cottage.ts).
  ...Object.values(FURNITURE).map((f) => ({ ...f, height: 1, kind: 'furniture' as const })),
];

const PROPS: Prop[] = [
  { kind: 'puddle', x: -11.2, z: 0.4, size: 0.9 },
  { kind: 'puddle', x: 13.5, z: -1.2, size: 1.1 },
  { kind: 'puddle', x: 17.2, z: -2.8, size: 0.7 },
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ kind: 'pebble' as const, x: 16.6 + (i % 4) * 0.45, z: -2.6 + Math.floor(i / 4) * 0.4, size: 0.12 })),
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ kind: 'pebble' as const, x: -12.6 + (i % 3) * 0.4, z: 1.0 + Math.floor(i / 3) * 0.35, size: 0.1 })),
];

const RAMP_WEST = CAUSEWAY.minX + CAUSEWAY.rampLength;
const RAMP_EAST = CAUSEWAY.maxX - CAUSEWAY.rampLength;
const causeway = { minZ: -CAUSEWAY.halfWidth, maxZ: CAUSEWAY.halfWidth, kind: 'causeway' } as const;

export const BROUGH_AREA: LevelArea = {
  ground: [
    { ...ISLET, kind: 'islet', height: ISLET.top },
    { ...SHORE, kind: 'shore', height: SHORE.top },
    // The causeway: ramps down off the islet, a long low spine the tide covers, and a ramp up onto the shore.
    { ...causeway, minX: CAUSEWAY.minX, maxX: RAMP_WEST, height: { axis: 'x', from: ISLET.top, to: CAUSEWAY.top } },
    { ...causeway, minX: RAMP_WEST, maxX: RAMP_EAST, height: CAUSEWAY.top },
    { ...causeway, minX: RAMP_EAST, maxX: CAUSEWAY.maxX, height: { axis: 'x', from: CAUSEWAY.top, to: SHORE.top } },
  ],
  walls: WALLS,
  props: PROPS,
  listeningPosts: [
    { x: 18, z: -4, radius: 1.6 },
    { x: -12.4, z: 1.2, radius: 1.2 },
  ],
  interiors: [{ minX: COTTAGE.minX, maxX: COTTAGE.maxX, minZ: COTTAGE.minZ, maxZ: COTTAGE.maxZ, refuge: true, power: true }],
  cameras: [
    {
      id: 'cottage',
      indoors: true,
      bounds: { minX: -28, maxX: -20, minZ: -3, maxZ: 3 },
      // In the doorway's corner, under the beams, looking across the room to the hearth.
      rig: { type: 'fixed', position: [-20.4, ISLET.top + 2.25, 2.6] },
      fov: 60,
      lookOffset: [0, 0.6, 0],
    },
    {
      id: 'brough',
      bounds: { minX: -34, maxX: -12, minZ: -12, maxZ: 12 },
      rig: { type: 'crane', offset: [3, 8.5, 10], min: [-40, 9, -6], max: [-14, 16, 18] },
      fov: 50,
      lookOffset: [1.5, 0.4, -0.5],
    },
    {
      id: 'causeway',
      bounds: { minX: -12, maxX: 12, minZ: -3, maxZ: 3 },
      rig: { type: 'rail', from: [-15, 6.5, 10], to: [9, 6.5, 10], lead: -0.04 },
      fov: 48,
      lookOffset: [1.5, 0.3, 0],
    },
    {
      id: 'shore',
      bounds: { minX: 12, maxX: 40, minZ: -16, maxZ: 16 },
      rig: { type: 'crane', offset: [-5, 8.5, 10], min: [8, 9, -8], max: [36, 18, 24] },
      fov: 50,
      lookOffset: [0.5, 0.4, -0.8],
    },
  ],
  things: [
    { id: 'hearth', kind: 'hearth', x: -27, z: -2.0 },
    // Only thought of once the dead have been seen.
    { id: 'kitchen-knife', kind: 'knife', x: -24.6, z: 1.9, after: 'sawDead', nudge: 'The kitchen knife. It’s in the dresser drawer.' },
    // Only looked for once the knife has failed.
    {
      id: 'fathers-notebook',
      kind: 'document',
      x: -24.5,
      z: -0.5,
      after: 'sawRise',
      nudge: 'Your father wrote everything down. His notebook’s on the table.',
      title: 'Your father’s notebook',
      lines: [
        'From your father’s notebook, the last page written:',
        'The knife won’t do it. Nothing will that wasn’t in the ground with them.',
        'Iron from the howe. Nothing else will lay them.',
        'When one goes down on its knees, say the words over it, and it stays down for good.',
        'The old blade is in the kirk, on the slab where they opened the howe. Go at low water.',
      ],
    },
    // Pinned by the door.
    { id: 'tide-table', kind: 'tideTable', x: -20.6, z: -1.8 },
  ],
  dead: [
    { x: 18, z: 7, facing: -Math.PI / 2 },
    { x: 23, z: -9, facing: -Math.PI / 2 },
    { x: 31, z: 5, facing: -Math.PI / 2 },
  ],
  dressing: [
    // The cottage, inside and out, in the round 3 look.
    {
      kind: 'cottage',
      room: COTTAGE,
      floor: ISLET.top,
      height: COTTAGE.height,
      wall: COTTAGE.wall,
      door: COTTAGE.door,
      ...FURNITURE,
      notebook: 'fathers-notebook',
    },
    { kind: 'beam', x: -30, y: ISLET.top + 8.6, z: -8 },
  ],
};
