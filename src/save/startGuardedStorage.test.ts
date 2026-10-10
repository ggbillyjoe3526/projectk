import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '../testSupport/memoryStorage';

/**
 * startGuardedStorage keeps a module singleton, so each test loads fresh copies of the modules (vi.resetModules) and
 * stubs the browser's localStorage.
 */
async function modules() {
  vi.resetModules();
  const guarded = await import('./guardedStorage');
  const settings = await import('../settings/storage');
  return { guarded, settings };
}

describe('the visit\'s guarded storage', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());
  // Test files share a worker's modules (when run with isolate: false): the copies this file started must not reach the next.
  afterAll(() => vi.resetModules());

  it('browserStorage is plain localStorage before the save system starts, the guarded storage after', async () => {
    const local = new MemoryStorage();
    vi.stubGlobal('localStorage', local);
    const { guarded, settings } = await modules();
    expect(guarded.guardedStorage()).toBeNull();
    expect(settings.browserStorage()).toBe(local);
    const g = guarded.startGuardedStorage();
    expect(guarded.guardedStorage()).toBe(g);
    expect(settings.browserStorage()).toBe(g);
    // One per visit.
    expect(guarded.startGuardedStorage()).toBe(g);
    // What the stores write through browserStorage lands in localStorage and is noticed; the probe key is gone.
    const heard: string[] = [];
    g.onWrite((k) => heard.push(k));
    settings.browserStorage()!.setItem('outbound.progress', '{}');
    expect(local.getItem('outbound.progress')).toBe('{}');
    expect(heard).toEqual(['outbound.progress']);
    expect(local.getItem('outbound.probe')).toBeNull();
    expect(g.keeping).toBe(true);
  });

  it('with localStorage blocked outright, it starts over memory: still a storage, marked blocked', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    try {
      const { guarded, settings } = await modules();
      const g = guarded.startGuardedStorage();
      expect(g.blocked).toBe(true);
      expect(g.keeping).toBe(false);
      const store = settings.browserStorage()!;
      expect(store).toBe(g);
      store.setItem('outbound.notes', 'r');
      expect(store.getItem('outbound.notes')).toBe('r');
    } finally {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('a localStorage that reads but refuses writes is found at start-up and kept in memory', async () => {
    const local = new MemoryStorage();
    local.setItem('outbound.settings', 'saved');
    local.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
    vi.stubGlobal('localStorage', local);
    const { guarded } = await modules();
    const g = guarded.startGuardedStorage();
    expect(g.blocked).toBe(true);
    expect(g.keeping).toBe(false);
    expect(g.getItem('outbound.settings')).toBe('saved');
    g.setItem('outbound.settings', 'newer');
    expect(g.getItem('outbound.settings')).toBe('newer');
    expect(local.getItem('outbound.settings')).toBe('saved');
  });

  it('moves keys written under the first working title to the new prefix once, keeping any newer key', async () => {
    const local = new MemoryStorage();
    local.setItem('projectk.settings', 'old settings');
    local.setItem('projectk.save.meta', 'old meta');
    local.setItem('outbound.save.meta', 'newer meta');
    local.setItem('elsewhere.thing', 'kept');
    vi.stubGlobal('localStorage', local);
    const { guarded } = await modules();
    const g = guarded.startGuardedStorage();
    expect(g.getItem('outbound.settings')).toBe('old settings');
    expect(g.getItem('outbound.save.meta')).toBe('newer meta');
    expect(local.getItem('projectk.settings')).toBeNull();
    expect(local.getItem('projectk.save.meta')).toBeNull();
    expect(local.getItem('elsewhere.thing')).toBe('kept');
  });

  it('a move the browser refuses part-way leaves the rest for the next visit', async () => {
    const local = new MemoryStorage();
    local.setItem('projectk.a', '1');
    local.setItem('projectk.b', '2');
    const setItem = local.setItem.bind(local);
    let moves = 0;
    local.setItem = (key: string, value: string) => {
      if (key.startsWith('outbound.') && key !== 'outbound.probe' && ++moves > 1) throw new DOMException('full', 'QuotaExceededError');
      setItem(key, value);
    };
    vi.stubGlobal('localStorage', local);
    const { guarded } = await modules();
    guarded.startGuardedStorage();
    const moved = ['a', 'b'].filter((k) => local.getItem(`outbound.${k}`) !== null);
    const left = ['a', 'b'].filter((k) => local.getItem(`projectk.${k}`) !== null);
    expect(moved).toHaveLength(1);
    expect(left).toHaveLength(1);
    expect(moved[0]).not.toBe(left[0]);
  });
});
