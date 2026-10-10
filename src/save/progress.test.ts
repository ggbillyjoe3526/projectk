import { describe, expect, it } from 'vitest';
import { createEncounter } from '../sim/combat/encounter';
import { PROGRESS_KEY, parseSavedGame, readSavedGame, type SavedGame, writeSavedGame } from './progress';

const memory = () => {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), map };
};

const spawns = [{ x: 1, z: 1, facing: 0 }, { x: 2, z: 2, facing: 0 }];
const game = (): SavedGame => ({
  progress: { swordTaken: true, read: ['note'], opened: ['gate'] },
  checkpoint: { encounter: createEncounter(3, 'sword', spawns), player: { x: 1, y: 2, z: 3, facing: 0, listening: false, depth: 0 }, tideClock: 99 },
});

describe('the saved game', () => {
  it('round-trips through the browser store', () => {
    const store = memory();
    writeSavedGame(store, 'layoutA', game());
    expect(readSavedGame(store, 'layoutA', 2)).toEqual(game());
  });

  it('keeps the progress but drops the checkpoint when the level has changed', () => {
    const store = memory();
    writeSavedGame(store, 'layoutA', game());
    expect(readSavedGame(store, 'layoutB', 2)).toEqual({ progress: game().progress, checkpoint: null });
    expect(readSavedGame(store, 'layoutA', 3)?.checkpoint).toBeNull();
  });

  it('reads nothing from junk, and a damaged checkpoint as none', () => {
    for (const raw of [null, 5, 'x', [], { version: 2, progress: {} }, { version: 1 }]) expect(parseSavedGame(raw, 'a', 2)).toBeNull();
    const damaged = JSON.parse(JSON.stringify({ version: 1, layout: 'a', ...game() }));
    damaged.checkpoint.player.x = 'east';
    expect(parseSavedGame(damaged, 'a', 2)).toEqual({ progress: game().progress, checkpoint: null });
    const odd = { version: 1, layout: 'a', progress: { swordTaken: 'yes', read: ['a', 3], opened: 'gate' }, checkpoint: null };
    expect(parseSavedGame(odd, 'a', 2)).toEqual({ progress: { swordTaken: false, read: ['a'], opened: [] }, checkpoint: null });
    const store = memory();
    store.setItem(PROGRESS_KEY, '{not json');
    expect(readSavedGame(store, 'a', 2)).toBeNull();
  });

  it('never overwrites a newer build’s save, and keeps fields it doesn’t know', () => {
    const store = memory();
    store.setItem(PROGRESS_KEY, JSON.stringify({ version: 2, future: true }));
    writeSavedGame(store, 'a', game());
    expect(JSON.parse(store.getItem(PROGRESS_KEY)!)).toEqual({ version: 2, future: true });
    store.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, laterField: 'kept' }));
    writeSavedGame(store, 'a', game());
    expect(JSON.parse(store.getItem(PROGRESS_KEY)!).laterField).toBe('kept');
  });
});
