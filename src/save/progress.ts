import { STORAGE_PREFIX } from '../config/save';
import type { Beat } from '../content/level';
import type { Progress } from '../game/things';
import type { Encounter } from '../sim/combat/encounter';
import type { PlayerState } from '../sim/player';
import type { TorchState } from '../sim/torch';
import { overStored, storedIsNewer } from './overStored';

/**
 * The game in progress, as one store in the browser (and in a save file, save/stores.ts): what has changed for good
 * (the sword, documents read, gates opened), written the moment it changes, and the checkpoint a death or a page load
 * returns to, written at the hearth and in a refuge.
 *
 * `layout` fingerprints the level the checkpoint was taken in. When the level has changed since (a new build moved
 * walls or the dead), the checkpoint is dropped and the player starts at the spawn, keeping their progress.
 */

export const PROGRESS_KEY = `${STORAGE_PREFIX}progress`;
export const PROGRESS_VERSION = 1;

/** Where a death or a reload returns to. */
export interface Checkpoint {
  readonly encounter: Encounter;
  readonly player: PlayerState;
  readonly tideClock: number;
  /** Absent in a checkpoint saved before the torch had a battery: a full one. */
  readonly torch?: TorchState;
}

export interface SavedGame {
  progress: Progress;
  checkpoint: Checkpoint | null;
}

interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** The saved game for this level, or null when there is none this build can use. Never throws. */
export function readSavedGame(store: Store | null, layout: string, deadCount: number): SavedGame | null {
  if (!store) return null;
  try {
    const raw: unknown = JSON.parse(store.getItem(PROGRESS_KEY) ?? 'null');
    return parseSavedGame(raw, layout, deadCount);
  } catch {
    return null;
  }
}

export function parseSavedGame(raw: unknown, layout: string, deadCount: number): SavedGame | null {
  if (!isObject(raw) || raw.version !== PROGRESS_VERSION || !isObject(raw.progress)) return null;
  const p = raw.progress;
  // A game saved before the opening's beats started with the knife in hand and the story under way.
  const beforeBeats = !('knifeTaken' in p);
  const progress: Progress = {
    knifeTaken: p.knifeTaken === true || beforeBeats,
    swordTaken: p.swordTaken === true,
    beats: beforeBeats ? ['sawDead', 'sawRise'] : strings(p.beats).filter(isBeat),
    read: strings(p.read),
    opened: strings(p.opened),
  };
  const checkpoint = raw.layout === layout && checkpointOk(raw.checkpoint, deadCount) ? (raw.checkpoint as unknown as Checkpoint) : null;
  return { progress, checkpoint };
}

/** Write the game; nothing when a newer build's save is there (this build would lose what it doesn't know). */
export function writeSavedGame(store: Store | null, layout: string, game: SavedGame): void {
  if (!store || storedIsNewer(store, PROGRESS_KEY, PROGRESS_VERSION)) return;
  const fresh = { version: PROGRESS_VERSION, layout, progress: game.progress, checkpoint: game.checkpoint };
  try {
    store.setItem(PROGRESS_KEY, JSON.stringify(overStored(store, PROGRESS_KEY, fresh)));
  } catch {
    // Storage full or refused: the game plays on, unsaved (the guarded storage reports it).
  }
}

function checkpointOk(c: unknown, deadCount: number): boolean {
  if (!isObject(c) || !finite(c.tideClock) || !isObject(c.player) || !isObject(c.encounter)) return false;
  const { player, encounter } = c;
  if (![player.x, player.y, player.z, player.facing].every(finite)) return false;
  if (!isObject(encounter.fighter) || !isObject(encounter.rng) || !Array.isArray(encounter.dead) || encounter.dead.length !== deadCount) return false;
  if (c.torch !== undefined && !(isObject(c.torch) && typeof c.torch.on === 'boolean' && finite(c.torch.charge))) return false;
  const f = encounter.fighter;
  if (![f.health, f.resolve].every(finite) || typeof f.action !== 'string') return false;
  return encounter.dead.every((u: unknown) => isObject(u) && [u.x, u.z, u.health, u.maxHealth].every(finite) && typeof u.state === 'string');
}

function isBeat(s: string): s is Beat {
  return s === 'sawDead' || s === 'sawRise' || s === 'swordHome';
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function finite(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v);
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
}
