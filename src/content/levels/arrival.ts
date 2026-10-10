import { composeLevel, type LevelArea, type LevelDef } from '../level';
import { BROUGH_AREA, CHANNEL_FLOOR } from './brough';
import { FERRY, FERRY_AREA } from './ferry';
import { KIRK, KIRK_AREA } from './kirk';
import { PIER, PIER_AREA } from './pier';
import { SHOP, VILLAGE_AREA } from './village';

/**
 * The island as chapter 1 (The Crossing) has it, the night William arrives: the same places as the slice's map, with
 * nobody dead in the street, nothing to take, and the father lying at home, plus the ferry William arrives on. It's
 * near midnight and the island is shut: the kirk and the shop are locked (doors with ids, drawn shut); the inn is
 * open (the chapter takes its door away). The chapter's own things (people to talk to, things to look at, the vigil's
 * customs) are in content/crossing.
 */

/** The doors locked the night William arrives. */
export const KIRK_DOOR = 'kirk-door';
export const SHOP_DOOR = 'shop-door';
const SHUT: LevelArea = {
  ground: [],
  cameras: [],
  walls: [
    { id: KIRK_DOOR, minX: KIRK.door[0], maxX: KIRK.door[1], minZ: KIRK.maxZ - KIRK.wall, maxZ: KIRK.maxZ, height: 3.2, kind: 'gate' },
    { id: SHOP_DOOR, minX: SHOP.door[0], maxX: SHOP.door[1], minZ: SHOP.minZ, maxZ: SHOP.minZ + SHOP.wall, height: 2.3, kind: 'gate' },
  ],
};

/** An area as it is the evening before: no dead, none of the slice's things, its cottage dressed for the vigil. */
function evening(area: LevelArea): LevelArea {
  return {
    ...area,
    things: [],
    dead: [],
    dressing: (area.dressing ?? []).map((d) => (d.kind === 'cottage' ? { ...d, vigil: true } : d)),
  };
}

const ISLAND_AREAS = [evening(BROUGH_AREA), evening(VILLAGE_AREA), evening(KIRK_AREA), PIER_AREA, SHUT];

/** Where William stands as the chapter begins: at the ferry's stern, looking forward. */
export const ARRIVAL_SPAWN = { x: (FERRY.deck.minX + FERRY.deck.maxX) / 2, z: 40, facing: Math.PI } as const;

/** Where a game saved before its first checkpoint, or one whose checkpoint no longer fits the map, picks up: the pier. */
export const PIER_HEAD = { x: (PIER.minX + PIER.maxX) / 2, z: 30, facing: Math.PI } as const;

export const ARRIVAL: LevelDef = composeLevel({ id: 'arrival', channelFloor: CHANNEL_FLOOR, spawn: ARRIVAL_SPAWN }, [FERRY_AREA, ...ISLAND_AREAS]);

/** The island alone, from the pier (for checking that every place can be walked to once the ferry is in). */
export const ARRIVAL_ISLAND: LevelDef = composeLevel({ id: 'arrival-island', channelFloor: CHANNEL_FLOOR, spawn: PIER_HEAD }, ISLAND_AREAS);
