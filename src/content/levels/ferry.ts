import type { Box2, Wall } from '../../sim/world/types';
import type { LevelArea } from '../level';
import { PIER } from './pier';

/**
 * The ferry's deck, where chapter 1 begins. In the simulation it lies where the ferry ties up, alongside the pier, with
 * a gangway across to it: while the ferry is at sea the gangway is shut (`FERRY_GANGWAY`, a wall with an id) and the
 * ferry's set (render/sets/ferry.ts) draws the deck, and the player on it, out in the sound, closing on the island.
 * The rails, the lounge and the benches are `furniture` walls: the set draws them. Metres; +x is east, +z is south.
 */

export const FERRY = {
  deck: { minX: 35.5, maxX: 43.5, minZ: 17, maxZ: 45 },
  top: PIER.top,
  /** The lounge and wheelhouse amidships, with walkways down either side. */
  lounge: { minX: 37.2, maxX: 41.8, minZ: 21, maxZ: 31 },
  /** From the pier's east edge to the deck's west rail. */
  gangway: { minX: PIER.maxX, maxX: 35.5, minZ: 34, maxZ: 35.6 },
  rail: 0.2,
} as const;

/** The wall that shuts the gangway while the ferry isn't alongside. */
export const FERRY_GANGWAY = 'ferry-gangway';

/** The middle of the deck, which the set moves the ferry about. */
export const FERRY_CENTRE = { x: (FERRY.deck.minX + FERRY.deck.maxX) / 2, z: (FERRY.deck.minZ + FERRY.deck.maxZ) / 2 } as const;

const top = FERRY.top;
const furniture = (b: Box2, height: number, id?: string): Wall => ({ ...b, height, kind: 'furniture', base: top, ...(id ? { id } : {}) });

function rails(): Wall[] {
  const d = FERRY.deck;
  const t = FERRY.rail;
  const g = FERRY.gangway;
  return [
    furniture({ minX: d.minX, maxX: d.minX + t, minZ: d.minZ, maxZ: g.minZ }, 1.1),
    furniture({ minX: d.minX, maxX: d.minX + t, minZ: g.maxZ, maxZ: d.maxZ }, 1.1),
    furniture({ minX: d.maxX - t, maxX: d.maxX, minZ: d.minZ, maxZ: d.maxZ }, 1.1),
    furniture({ minX: d.minX, maxX: d.maxX, minZ: d.minZ, maxZ: d.minZ + t }, 1.1),
    furniture({ minX: d.minX, maxX: d.maxX, minZ: d.maxZ - t, maxZ: d.maxZ }, 1.1),
  ];
}

export const FERRY_AREA: LevelArea = {
  ground: [
    { ...FERRY.deck, kind: 'deck', height: top },
    { ...FERRY.gangway, kind: 'deck', height: top },
  ],
  walls: [
    ...rails(),
    furniture(FERRY.lounge, 2.6),
    // The bench across the stern, where the bag is.
    furniture({ minX: 38, maxX: 41, minZ: 43.4, maxZ: 44.1 }, 0.45),
    furniture({ minX: FERRY.gangway.minX + 0.2, maxX: FERRY.gangway.maxX - 0.1, minZ: FERRY.gangway.minZ, maxZ: FERRY.gangway.maxZ }, 1.1, FERRY_GANGWAY),
  ],
  cameras: [
    {
      // Over the water off the port quarter, looking forward along the deck.
      id: 'ferry',
      // Starting a little way onto the gangway, so standing at the pier's edge never picks this one.
      bounds: { minX: FERRY.gangway.minX + 0.25, maxX: FERRY.deck.maxX, minZ: FERRY.deck.minZ, maxZ: FERRY.deck.maxZ },
      rig: { type: 'crane', offset: [-7, 7.5, 8], min: [27, 10, 24], max: [40, 14, 54] },
      fov: 52,
      lookOffset: [0.5, 0.4, -1.5],
    },
  ],
};
