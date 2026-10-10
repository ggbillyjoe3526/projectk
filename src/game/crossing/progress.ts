import { STORAGE_PREFIX } from '../../config/save';
import { CUSTOMS, type Custom } from '../../content/crossing/places';
import { overStored, storedIsNewer } from '../../save/overStored';
import type { TorchState } from '../../sim/torch';

/**
 * Chapter 1's saved game, one store in the browser (and in a save file, save/stores.ts), apart from the slice's
 * (save/progress.ts) so the two never write over each other: where the chapter has got to, what has been said, read
 * and done for good, and the checkpoint a reload returns to, taken on docking, on reaching the cottage and after
 * waiting out the tide. `layout` fingerprints the map the checkpoint was taken in, as the slice's does.
 */

export const CROSSING_KEY = `${STORAGE_PREFIX}crossing`;
export const CROSSING_VERSION = 1;

/** On the ferry; on the island (ashore, the evening); done (the vigil sat, day 1 over). */
export type Phase = 'ferry' | 'island' | 'done';

export interface CrossingProgress {
  phase: Phase;
  /** What has been said and seen (game/crossing/dialogue.ts names most of them). */
  flags: string[];
  /** Letters and notices read, by id: the phone's notes. */
  read: string[];
  /** The vigil's customs done, in the order they were done. */
  customs: Custom[];
  /** Tonight's tablet: taken, skipped, or not yet decided. */
  pill: 'taken' | 'skipped' | null;
  /** Texts received, by id, oldest first. */
  messages: string[];
}

export interface CrossingCheckpoint {
  readonly x: number;
  readonly z: number;
  readonly facing: number;
  readonly tideClock: number;
  readonly torch: TorchState;
}

export interface SavedCrossing {
  progress: CrossingProgress;
  checkpoint: CrossingCheckpoint | null;
}

interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function freshCrossing(): CrossingProgress {
  return { phase: 'ferry', flags: [], read: [], customs: [], pill: null, messages: [] };
}

/** The saved chapter, or null when there is none this build can use. Never throws. */
export function readCrossing(store: Store | null, layout: string): SavedCrossing | null {
  if (!store) return null;
  try {
    return parseCrossing(JSON.parse(store.getItem(CROSSING_KEY) ?? 'null'), layout);
  } catch {
    return null;
  }
}

export function parseCrossing(raw: unknown, layout: string): SavedCrossing | null {
  if (!isObject(raw) || raw.version !== CROSSING_VERSION || !isObject(raw.progress)) return null;
  const p = raw.progress;
  const phase: Phase = p.phase === 'island' || p.phase === 'done' ? p.phase : 'ferry';
  const progress: CrossingProgress = {
    phase,
    flags: strings(p.flags),
    read: strings(p.read),
    customs: strings(p.customs).filter((c): c is Custom => (CUSTOMS as readonly string[]).includes(c)),
    pill: p.pill === 'taken' || p.pill === 'skipped' ? p.pill : null,
    messages: strings(p.messages),
  };
  const c = raw.checkpoint;
  const ok = isObject(c) && [c.x, c.z, c.facing, c.tideClock].every(finite) && isObject(c.torch) && typeof c.torch.on === 'boolean' && finite(c.torch.charge);
  const checkpoint = raw.layout === layout && ok ? (c as unknown as CrossingCheckpoint) : null;
  return { progress, checkpoint };
}

/** Write the chapter; nothing when a newer build's save is there. */
export function writeCrossing(store: Store | null, layout: string, game: SavedCrossing): void {
  if (!store || storedIsNewer(store, CROSSING_KEY, CROSSING_VERSION)) return;
  const fresh = { version: CROSSING_VERSION, layout, progress: game.progress, checkpoint: game.checkpoint };
  try {
    store.setItem(CROSSING_KEY, JSON.stringify(overStored(store, CROSSING_KEY, fresh)));
  } catch {
    // Storage full or refused: the game plays on, unsaved.
  }
}

/** Forget the chapter (starting over). */
export function clearCrossing(store: Store | null): void {
  try {
    store?.removeItem?.(CROSSING_KEY);
  } catch {
    // Refused: a later write replaces it anyway.
  }
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
