import { causewayOpenFraction, nextTides } from '../sim/tide';
import { islandTime } from '../sim/islandClock';
import { DEFAULT_TIDE, ISLAND_CLOCK } from '../config/tide';
import { PLAYER_TUNING } from '../config/player';
import type { Beat, Thing } from '../content/level';
import { inBox } from '../sim/world/ground';

/**
 * The things the player can use with E (content/level.ts `Thing`): which one is in reach, what the prompt says, and
 * the words a document or the tide table shows. Pure: what using one does to the game is the slice's job.
 */

/** How far from a thing's point the player can use it (beyond their own radius). */
export const THING_REACH = 1.6;

/** How near a thing the player comes before its nudge is said. */
export const NUDGE_REACH = 4;

/** What has changed for good: kept through death and saved at once, unlike the checkpoint. */
export interface Progress {
  knifeTaken: boolean;
  swordTaken: boolean;
  /** The story's beats so far, in the order they happened. */
  beats: Beat[];
  /** Documents read, by id. */
  read: string[];
  /** Gates opened, by the wall each opened. */
  opened: string[];
}

export function freshProgress(): Progress {
  return { knifeTaken: false, swordTaken: false, beats: [], read: [], opened: [] };
}

/** Whether a thing is there to use: its beat has come, and it isn't a blade already taken or a gate already open. */
export function thingThere(t: Thing, progress: Progress): boolean {
  if (t.after && !progress.beats.includes(t.after)) return false;
  if (t.kind === 'knife') return !progress.knifeTaken;
  if (t.kind === 'sword') return !progress.swordTaken;
  if (t.kind === 'gate') return !progress.opened.includes(t.wall);
  return true;
}

/** The nearest thing in reach that is there to use. */
export function thingHere(things: readonly Thing[], progress: Progress, x: number, z: number): Thing | null {
  let best: Thing | null = null;
  let bestD = THING_REACH + PLAYER_TUNING.radius;
  for (const t of things) {
    if (!thingThere(t, progress)) continue;
    const d = Math.hypot(t.x - x, t.z - z);
    if (d < bestD) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

/**
 * A thing near the player with a nudge to say: there, not yet used (a document unread), and not nudged already
 * (`nudged`, the ids said this visit).
 */
export function nudgeHere(things: readonly Thing[], progress: Progress, nudged: ReadonlySet<string>, x: number, z: number): Thing | null {
  for (const t of things) {
    if (!t.nudge || nudged.has(t.id) || !thingThere(t, progress)) continue;
    if (t.kind === 'document' && progress.read.includes(t.id)) continue;
    if (Math.hypot(t.x - x, t.z - z) < NUDGE_REACH) return t;
  }
  return null;
}

/** Whether the player stands where the gate opens from. */
export function onGateSide(t: Extract<Thing, { kind: 'gate' }>, x: number, z: number): boolean {
  return inBox(t.side, x, z);
}

/** The prompt for a thing in reach. */
export function thingPrompt(t: Thing, progress: Progress, x: number, z: number): string {
  switch (t.kind) {
    case 'hearth':
      return 'E  Rest by the hearth';
    case 'refuge':
      return 'E  Wait out the tide';
    case 'document':
      return progress.read.includes(t.id) ? `E  Read again: ${t.title}` : `E  Read: ${t.title}`;
    case 'tideTable':
      return 'E  Read the tide table';
    case 'knife':
      return 'E  Take the kitchen knife';
    case 'sword':
      return 'E  Take the sword';
    case 'gate':
      return onGateSide(t, x, z) ? 'E  Lift the bar and open the gate' : 'Barred from the other side';
  }
}

/** What the tide table by the cottage door says, at this tide clock: the time now and the next four tides. */
export function tideTableLines(tideClock: number): string[] {
  const cycleHours = (24 * DEFAULT_TIDE.cycleSeconds) / ISLAND_CLOCK.daySeconds;
  const hours = Math.round(causewayOpenFraction(DEFAULT_TIDE) * cycleHours * 2) / 2;
  return [
    `Tide times for Haugsay, printed from the forecast. The kitchen clock says ${islandTime(tideClock)}.`,
    ...nextTides(tideClock, 4).map((tide) => `${tide.kind === 'low' ? 'Low water' : 'High water'}  ${islandTime(tide.at)}`),
    `In your father’s hand, along the bottom: “Causeway about ${hours} hours either side of low water. Less in a wind. Listen to the stones.”`,
  ];
}
