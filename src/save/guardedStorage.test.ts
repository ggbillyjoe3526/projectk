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
    g.setItem('projectk.settings', '{"version":1}');
    g.setItem('other', 'x');
    g.removeItem('projectk.settings');
    expect(backing.getItem('other')).toBe('x');
    expect(backing.getItem('projectk.settings')).toBeNull();
    expect(heard).toEqual(['projectk.settings', 'projectk.settings']);
    expect(g.keeping).toBe(true);
  });

  it('keeps a refused write in memory, says so once, and reads see it', () => {
    const backing = new FillingStorage();
    const g = new GuardedStorage(backing);
    let problems = 0;
    g.onProblem(() => problems++);
    backing.full = true;
    g.setItem('projectk.progress', 'a');
    g.setItem('projectk.progress', 'b');
    expect(g.getItem('projectk.progress')).toBe('b');
    expect(backing.getItem('projectk.progress')).toBeNull();
    expect(problems).toBe(1);
    expect(g.blocked).toBe(true);
    expect(g.keeping).toBe(false);
  });

  it('works over memory alone when the browser blocks storage', () => {
    const g = new GuardedStorage(null);
    g.setItem('projectk.notes', 'r');
    expect(g.getItem('projectk.notes')).toBe('r');
    expect(g.length).toBe(1);
    expect(g.key(0)).toBe('projectk.notes');
    expect(g.blocked).toBe(true);
    expect(g.trySet('projectk.save.meta', '{}')).toBe(false);
  });

  it('frozen, holds the game\'s writes in memory for the visit; writeThrough still reaches the browser', () => {
    const backing = new MemoryStorage();
    backing.setItem('projectk.settings', 'old');
    const g = new GuardedStorage(backing);
    g.freeze('otherTab');
    g.setItem('projectk.settings', 'new');
    expect(g.getItem('projectk.settings')).toBe('new');
    expect(backing.getItem('projectk.settings')).toBe('old');
    expect(g.trySet('projectk.save.meta', '{}')).toBe(false);
    g.writeThrough('projectk.settings', 'loaded');
    expect(backing.getItem('projectk.settings')).toBe('loaded');
    expect(g.getItem('projectk.settings')).toBe('loaded');
    // The first reason stays.
    g.freeze('reloading');
    expect(g.frozen).toBe('otherTab');
  });

  it('trySet reports a refusal without raising the saving warning', () => {
    const backing = new FillingStorage();
    const g = new GuardedStorage(backing);
    backing.full = true;
    expect(g.trySet('projectk.save.restore', '[]')).toBe(false);
    expect(g.blocked).toBe(false);
    expect(g.getItem('projectk.save.restore')).toBeNull();
  });
});
