import { DEFAULT_TIDE } from './tide';

/** How the player moves (sim/player.ts). Distances in metres, speeds in metres a second. */
export const PLAYER_TUNING = {
  radius: 0.35,
  walkSpeed: 3.0,
  wadeSpeedFactor: 0.55,
  wadeDepth: 0.25,
  /** Same limit the tide uses to decide whether the causeway is passable. */
  maxWadeDepth: DEFAULT_TIDE.maxWadeDepth,
  maxStepUp: 0.6,
} as const;
