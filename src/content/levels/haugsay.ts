import { composeLevel, type LevelDef } from '../level';
import { BROUGH_AREA, CHANNEL_FLOOR } from './brough';
import { KIRK_AREA, SLAB } from './kirk';
import { KIRKYARD_TOP, VILLAGE_AREA } from './village';

/** The island as far as the vertical slice's first stage goes: the Brough, the causeway, the shore, the village and the kirk. */
export const HAUGSAY: LevelDef = composeLevel(
  {
    id: 'haugsay',
    channelFloor: CHANNEL_FLOOR,
    spawn: { x: -24, z: 1.4, facing: Math.PI / 2 },
    places: {
      note: { x: -24.5, z: -0.5 },
      hearth: { x: -27, z: -2.2 },
      sword: { x: (SLAB.minX + SLAB.maxX) / 2, z: (SLAB.minZ + SLAB.maxZ) / 2, top: KIRKYARD_TOP + SLAB.height },
    },
  },
  [BROUGH_AREA, VILLAGE_AREA, KIRK_AREA],
);
