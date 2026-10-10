import type { Wall } from '../../sim/world/types';
import type { LevelArea } from '../level';
import { SHORE } from './brough';

/**
 * The pier, running south from the shore into the sound: where the ferry ties up, alongside its east edge, and where
 * William first sets foot on Haugsay. Bollards along the east edge, a lamp at the end, the timetable board at the root.
 * Metres; +x is east, +z is south.
 */

export const PIER = { minX: 29.5, maxX: 33, minZ: SHORE.maxZ, maxZ: 40, top: SHORE.top } as const;

const top = PIER.top;
const bollard = (z: number): Wall => ({ minX: PIER.maxX - 0.55, maxX: PIER.maxX - 0.2, minZ: z - 0.18, maxZ: z + 0.18, height: 0.55, kind: 'stone' });

export const PIER_AREA: LevelArea = {
  ground: [{ ...PIER, kind: 'road', height: top }],
  walls: [
    ...[20, 27, 38].map(bollard),
    // The timetable board at the pier's root.
    { minX: PIER.minX + 0.1, maxX: PIER.minX + 0.3, minZ: 17.2, maxZ: 18.6, height: 1.8, kind: 'stone' },
  ],
  cameras: [
    {
      // From over the water south-west of the pier, looking up it to the shore.
      id: 'pier',
      bounds: { minX: PIER.minX, maxX: PIER.maxX, minZ: PIER.minZ, maxZ: PIER.maxZ },
      rig: { type: 'crane', offset: [-6, 8, 9], min: [20, 10, 22], max: [30, 16, 48] },
      fov: 50,
      lookOffset: [0.5, 0.4, -1.5],
    },
  ],
  dressing: [
    // Kerbs along both edges, pale against the dark water.
    { kind: 'block', box: { minX: PIER.minX, maxX: PIER.minX + 0.25, minZ: PIER.minZ, maxZ: PIER.maxZ }, bottom: top, top: top + 0.12, material: 'stone' },
    { kind: 'block', box: { minX: PIER.maxX - 0.25, maxX: PIER.maxX, minZ: PIER.minZ, maxZ: PIER.maxZ }, bottom: top, top: top + 0.12, material: 'stone' },
    { kind: 'block', box: { minX: PIER.minX - 0.1, maxX: PIER.minX + 0.08, minZ: PIER.maxZ - 0.9, maxZ: PIER.maxZ - 0.72 }, bottom: top, top: top + 4.4, material: 'stone' },
    { kind: 'light', x: PIER.minX + 0.4, y: top + 4.3, z: PIER.maxZ - 0.8, color: 0xffa347, intensity: 8, distance: 12, decay: 1.4 },
  ],
};
