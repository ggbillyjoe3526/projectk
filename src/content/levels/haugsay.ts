import { composeLevel, type LevelDef } from '../level';
import { BROUGH_AREA, CHANNEL_FLOOR } from './brough';
import { KIRK_AREA } from './kirk';
import { VILLAGE_AREA } from './village';

/** The island as far as the vertical slice's first stage goes: the Brough, the causeway, the shore, the village and the kirk. */
export const HAUGSAY: LevelDef = composeLevel(
  {
    id: 'haugsay',
    channelFloor: CHANNEL_FLOOR,
    spawn: { x: -24, z: 1.4, facing: Math.PI / 2 },
  },
  [BROUGH_AREA, VILLAGE_AREA, KIRK_AREA],
);
