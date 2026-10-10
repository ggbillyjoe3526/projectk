import type { WeaponId } from '../config/combat';
import type { Beat } from '../content/level';
import type { CombatEvent } from '../sim/combat/encounter';
import type { Progress } from './things';

/**
 * The opening's pacing beats (stage 1, story beats 6 to 9), with no cutscenes: what the fight shows the player moves
 * the story on, and a line on screen says so. The first trip over is with the torch alone; seeing the dead sends the
 * player back for the knife; watching one the knife cut down get up again sends them to their father's notebook,
 * which sends them to the sword in the kirk. Pure: the slice records the beats and says the lines.
 */

/** What is said as each beat happens. */
export const BEAT_LINES: Readonly<Record<Beat, string>> = {
  sawDead: 'You’ve nothing to fight them with. Get back to the cottage.',
  sawRise: 'It’s getting up again.',
  swordHome: '',
};

/** The beats this tick's fight events bring about, not yet in `progress`. */
export function beatsFrom(events: readonly CombatEvent[], weapon: WeaponId, progress: Progress): Beat[] {
  const beats: Beat[] = [];
  const add = (beat: Beat): void => {
    if (!progress.beats.includes(beat) && !beats.includes(beat)) beats.push(beat);
  };
  for (const e of events) {
    if (e.kind === 'enemyNotice') add('sawDead');
    if (e.kind === 'enemyRise' && weapon === 'knife') add('sawRise');
  }
  return beats;
}

/** The blade in the player's hand, as the progress has it. */
export function weaponFor(progress: Progress): WeaponId {
  return progress.swordTaken ? 'sword' : progress.knifeTaken ? 'knife' : 'none';
}

/** The page shown when the sword is brought home: the end of what stage 1 builds. */
export const END_LINES: readonly string[] = [
  'You set the sword down by the hearth. Iron from the howe, and it does what the knife couldn’t.',
  'This is as far as “Low water” goes: the end of the opening.',
  'The dead you laid to rest stay at rest. The others are still out there, at every low water, if you want to go back across.',
];
