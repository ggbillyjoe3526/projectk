import type { CameraZone } from './authoredCamera';

/** Hand-placed cameras for the M0 greybox (see sim/world/broughGreybox.ts). */
export const BROUGH_ZONES: readonly CameraZone[] = [
  {
    id: 'cottage',
    bounds: { minX: -28, maxX: -20, minZ: -3, maxZ: 3 },
    rig: { type: 'fixed', position: [-27.5, 8.0, -2.6] },
    fov: 62,
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
];
