import { PLAYER_TUNING } from '../../config/player';
import { FLAGS, type Person } from '../../content/crossing/people';
import { BAG, COFFIN, type Spot } from '../../content/crossing/places';
import { metFlag } from './dialogue';
import type { CrossingProgress } from './progress';
import { THING_REACH } from '../things';

/**
 * What E would do where the player stands in chapter 1: the nearest person or thing in reach that's there to use, and
 * the prompt for it. Pure: what using it does is the chapter's job (game/crossing/crossingChapter.ts).
 */

export type Target = { readonly kind: 'person'; readonly person: Person } | { readonly kind: 'spot'; readonly spot: Spot };

export interface ReachState {
  readonly progress: CrossingProgress;
  readonly flags: ReadonlySet<string>;
  readonly causewayOpen: boolean;
}

/** Flag for a thing looked at once, whose second use differs (the coffin). */
export const lookedFlag = (id: string): string => `looked:${id}`;

/** Whether a thing is there to use now: the tide wait only while the causeway is shut. */
export function spotThere(spot: Spot, s: ReachState): boolean {
  return !(spot.whileShut && s.causewayOpen);
}

/** The nearest person or thing in reach that's there to use. */
export function targetHere(spots: readonly Spot[], people: readonly Person[], s: ReachState, x: number, z: number): Target | null {
  const reach = THING_REACH + PLAYER_TUNING.radius;
  let best: Target | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const person of people) {
    const d = Math.hypot(person.x - x, person.z - z);
    if (d < reach && d < bestD) (best = { kind: 'person', person }), (bestD = d);
  }
  for (const spot of spots) {
    if (!spotThere(spot, s)) continue;
    const d = Math.hypot(spot.x - x, spot.z - z);
    if (d < (spot.reach ?? reach) && d < bestD) (best = { kind: 'spot', spot }), (bestD = d);
  }
  return best;
}

export function targetPrompt(t: Target, s: ReachState): string {
  if (t.kind === 'person') return `E  Talk to ${s.flags.has(metFlag(t.person.id)) ? t.person.name : t.person.stranger}`;
  const spot = t.spot;
  if (spot.kind === 'coffin' && s.flags.has(lookedFlag(spot.id))) return COFFIN.sitPrompt;
  if (spot.kind === 'read' && s.progress.read.includes(spot.id)) return `E  Read again: ${spot.title}`;
  if (spot.kind === 'custom' && s.progress.customs.includes(spot.custom)) return spot.undoPrompt;
  if (spot.kind === 'bag' && s.flags.has(FLAGS.bagDown)) return BAG.prompt;
  return spot.prompt;
}
