import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../testSupport/memoryStorage';
import { GuardedStorage } from './guardedStorage';

/** A store that refuses writes once `full` is set (a browser out of space). */
class FillingStorage extends MemoryStorage {
  full = false;
  override setItem(k: string, v: string): void {
    if (this.full) throw new DOMException('full', 'QuotaExceededError');
    super.setItem(k, v);
  }
}

describe('guarded storage', () => {
  it('passes reads and writes to the browser store and tells of each game write', () => {
    const backing = new MemoryStorage();
    const g = new GuardedStorage(backing);
    const heard: string[] = [];
    g.onWrite((k) => heard.push(k));
    g.setItem('outbound.settings', '{"version":1}');
    g.setItem('other', 'x');
    g.removeItem('outbound.settings');
    expect(backing.getItem('other')).toBe('x');
    expect(backing.getItem('outbound.settings')).toBeNull();
    expect(heard).toEqual(['outbound.settings', 'outbound.settings']);
    expect(g.keeping).toBe(true);
  });

  it('keeps a refused write in memory, says so once, and reads see it', () => {
    const backing = new FillingStorage();
    const g = new GuardedStorage(backing);
    let problems = 0;
    g.onProblem(() => problems++);
    backing.full = true;
    g.setItem('outbound.progress', 'a');
    g.setItem('outbound.progress', 'b');
    expect(g.getItem('outbound.progress')).toBe('b');
    expect(backing.getItem('outbound.progress')).toBeNull();
    expect(problems).toBe(1);
    expect(g.blocked).toBe(true);
    expect(g.keeping).toBe(false);
  });

  it('works over memory alone when the browser blocks storage', () => {
    const g = new GuardedStorage(null);
    g.setItem('outbound.notes', 'r');
    expect(g.getItem('outbound.notes')).toBe('r');
    expect(g.length).toBe(1);
    expect(g.key(0)).toBe('outbound.notes');
    expect(g.blocked).toBe(true);
    expect(g.trySet('outbound.save.meta', '{}')).toBe(false);
  });

  it('frozen, holds the game\'s writes in memory for the visit; writeThrough still reaches the browser', () => {
    const backing = new MemoryStorage();
    backing.setItem('outbound.settings', 'old');
    const g = new GuardedStorage(backing);
    g.freeze('otherTab');
    g.setItem('outbound.settings', 'new');
    expect(g.getItem('outbound.settings')).toBe('new');
    expect(backing.getItem('outbound.settings')).toBe('old');
    expect(g.trySet('outbound.save.meta', '{}')).toBe(false);
    g.writeThrough('outbound.settings', 'loaded');
    expect(backing.getItem('outbound.settings')).toBe('loaded');
    expect(g.getItem('outbound.settings')).toBe('loaded');
    // The first reason stays.
    g.freeze('reloading');
    expect(g.frozen).toBe('otherTab');
  });

  it('trySet reports a refusal without raising the saving warning', () => {
    const backing = new FillingStorage();
    const g = new GuardedStorage(backing);
    backing.full = true;
    expect(g.trySet('outbound.save.restore', '[]')).toBe(false);
    expect(g.blocked).toBe(false);
    expect(g.getItem('outbound.save.restore')).toBeNull();
  });
});
