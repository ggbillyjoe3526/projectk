import type { GroundKind, Prop, Wall, WorldDef } from './types';

/**
 * M0 greybox: the Brough (tidal islet with the cottage and lighthouse), the
 * causeway, and the edge of the main island. Metres; +x is east, +z is south.
 */

export const ISLET = { minX: -34, maxX: -12, minZ: -12, maxZ: 12, top: 3.2 } as const;
export const CAUSEWAY = { minX: -12, maxX: 12, halfWidth: 1.5, top: 0.15, rampLength: 7 } as const;
export const SHORE = { minX: 12, maxX: 40, minZ: -16, maxZ: 16, top: 3.2 } as const;
export const CHANNEL_FLOOR = -2.5;

const COTTAGE = { minX: -28, maxX: -20, minZ: -3, maxZ: 3, wall: 0.3, height: 2.6, door: 0.8 } as const;

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
  // A table and the bier in the cottage (low, still solid).
  { minX: -25.2, maxX: -23.8, minZ: -1.2, maxZ: 0.2, height: 0.8, kind: 'stone' },
  { minX: -27.6, maxX: -26.2, minZ: 1.2, maxZ: 2.6, height: 0.9, kind: 'stone' },
];

const PROPS: Prop[] = [
  { kind: 'puddle', x: -11.2, z: 0.4, size: 0.9 },
  { kind: 'puddle', x: 13.5, z: -1.2, size: 1.1 },
  { kind: 'puddle', x: 17.2, z: -2.8, size: 0.7 },
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ kind: 'pebble' as const, x: 16.6 + (i % 4) * 0.45, z: -2.6 + Math.floor(i / 4) * 0.4, size: 0.12 })),
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ kind: 'pebble' as const, x: -12.6 + (i % 3) * 0.4, z: 1.0 + Math.floor(i / 3) * 0.35, size: 0.1 })),
];

function groundAt(x: number, z: number): { height: number; kind: GroundKind } {
  if (x >= ISLET.minX && x < ISLET.maxX && z >= ISLET.minZ && z <= ISLET.maxZ) return { height: ISLET.top, kind: 'islet' };
  if (x >= SHORE.minX && x <= SHORE.maxX && z >= SHORE.minZ && z <= SHORE.maxZ) return { height: SHORE.top, kind: 'shore' };
  if (x >= CAUSEWAY.minX && x < CAUSEWAY.maxX && Math.abs(z) <= CAUSEWAY.halfWidth) {
    const r = CAUSEWAY.rampLength;
    let h: number = CAUSEWAY.top;
    if (x < CAUSEWAY.minX + r) h = lerp(ISLET.top, CAUSEWAY.top, (x - CAUSEWAY.minX) / r);
    else if (x > CAUSEWAY.maxX - r) h = lerp(CAUSEWAY.top, SHORE.top, (x - (CAUSEWAY.maxX - r)) / r);
    return { height: h, kind: 'causeway' };
  }
  return { height: CHANNEL_FLOOR, kind: 'channel' };
}

function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, k));
}

export const broughGreybox: WorldDef = {
  walls: WALLS,
  props: PROPS,
  groundAt,
  listeningPosts: [
    { x: 18, z: -4, radius: 1.6 },
    { x: -12.4, z: 1.2, radius: 1.2 },
  ],
  spawn: { x: -24, z: 1.4, facing: Math.PI / 2 },
};

export const COTTAGE_BOUNDS = COTTAGE;
