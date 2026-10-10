import { describe, expect, it } from 'vitest';
import { clearCrossing, CROSSING_KEY, CROSSING_VERSION, freshCrossing, parseCrossing, readCrossing, writeCrossing } from './progress';

function memory(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  };
}

const checkpoint = { x: 1, z: 2, facing: 0.5, tideClock: -300, torch: { on: true, charge: 0.8 } };

describe('the crossing save', () => {
  it('reads back what it wrote', () => {
    const store = memory();
    const progress = { ...freshCrossing(), phase: 'island' as const, flags: ['met:morag'], customs: ['salt' as const], pill: 'taken' as const };
    writeCrossing(store, 'abc', { progress, checkpoint });
    expect(readCrossing(store, 'abc')).toEqual({ progress, checkpoint });
  });

  it('drops a checkpoint taken on another map, keeping the progress', () => {
    const store = memory();
    writeCrossing(store, 'old', { progress: { ...freshCrossing(), phase: 'island' }, checkpoint });
    expect(readCrossing(store, 'new')).toMatchObject({ progress: { phase: 'island' }, checkpoint: null });
  });

  it('cleans what it doesn’t know, and refuses another version', () => {
    const raw = { version: CROSSING_VERSION, layout: 'a', progress: { phase: 'sailing', flags: ['x', 3], customs: ['salt', 'dance'], pill: 'maybe' }, checkpoint: { x: 'no' } };
    expect(parseCrossing(raw, 'a')).toEqual({ progress: { ...freshCrossing(), flags: ['x'], customs: ['salt'] }, checkpoint: null });
    expect(parseCrossing({ ...raw, version: CROSSING_VERSION + 1 }, 'a')).toBeNull();
  });

  it('leaves a newer build’s save alone, and forgets on starting over', () => {
    const store = memory();
    store.setItem(CROSSING_KEY, JSON.stringify({ version: CROSSING_VERSION + 1 }));
    writeCrossing(store, 'a', { progress: freshCrossing(), checkpoint: null });
    expect(JSON.parse(store.getItem(CROSSING_KEY)!).version).toBe(CROSSING_VERSION + 1);
    clearCrossing(store);
    expect(readCrossing(store, 'a')).toBeNull();
  });
});
