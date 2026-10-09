import { afterEach, describe, expect, it, vi } from 'vitest';
import { RENDERER_IDS } from '../config/renderBackend';
import { SETTINGS_WRITE_DELAY_MS } from '../config/save';
import { flushSettings, loadSetting, numberIn, oneOf, saveSetting, saveSettingSoon, SETTINGS_KEY, SETTINGS_VERSION } from './storage';

/** A Storage backed by a Map (only the calls the settings use); `writes` counts the writes. */
function memoryStorage(initial: Record<string, string> = {}): Storage & { writes: number } {
  const m = new Map(Object.entries(initial));
  return {
    writes: 0,
    getItem: (k: string) => m.get(k) ?? null,
    setItem(k: string, v: string) {
      this.writes++;
      m.set(k, String(v));
    },
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

const renderer = oneOf(RENDERER_IDS);
const volume = numberIn(0, 1);

describe('settings store', () => {
  it('falls back to the default when nothing (or nothing valid) is saved, or storage is blocked', () => {
    expect(loadSetting('renderer', renderer, 'auto', memoryStorage())).toBe('auto');
    expect(loadSetting('renderer', renderer, 'auto', memoryStorage({ [SETTINGS_KEY]: '{oops' }))).toBe('auto');
    expect(loadSetting('renderer', renderer, 'auto', memoryStorage({ [SETTINGS_KEY]: JSON.stringify({ version: 1, renderer: 'vulkan' }) }))).toBe('auto');
    // An object without a version, or from a future format version, is not read as this one.
    expect(loadSetting('renderer', renderer, 'auto', memoryStorage({ [SETTINGS_KEY]: JSON.stringify({ renderer: 'webgl' }) }))).toBe('auto');
    expect(loadSetting('renderer', renderer, 'auto', memoryStorage({ [SETTINGS_KEY]: JSON.stringify({ version: 2, renderer: 'webgl' }) }))).toBe('auto');
    expect(loadSetting('renderer', renderer, 'auto', null)).toBe('auto');
    const throwing = { getItem: () => { throw new Error('blocked'); } } as unknown as Storage;
    expect(loadSetting('renderer', renderer, 'auto', throwing)).toBe('auto');
    expect(() => saveSetting('renderer', 'webgl', throwing)).not.toThrow();
  });

  it('saves into one versioned object and reads it back', () => {
    const s = memoryStorage();
    saveSetting('renderer', 'webgl', s);
    saveSetting('volume.master', 0.5, s);
    expect(SETTINGS_VERSION).toBe(1);
    expect(JSON.parse(s.getItem(SETTINGS_KEY)!)).toEqual({ version: 1, renderer: 'webgl', 'volume.master': 0.5 });
    expect(loadSetting('renderer', renderer, 'auto', s)).toBe('webgl');
    expect(loadSetting('volume.master', volume, 1, s)).toBe(0.5);
  });

  it('keeps fields it does not know (a newer build\'s additions) when it saves', () => {
    const s = memoryStorage({ [SETTINGS_KEY]: JSON.stringify({ version: 1, 'graphics.dither': 'off' }) });
    saveSetting('showFps', true, s);
    expect(JSON.parse(s.getItem(SETTINGS_KEY)!)).toEqual({ version: 1, 'graphics.dither': 'off', showFps: true });
  });

  it('rejects numbers out of range and junk', () => {
    expect(volume(9)).toBeUndefined();
    expect(volume('')).toBeUndefined();
    expect(volume('abc')).toBeUndefined();
    expect(volume(null)).toBeUndefined();
    expect(volume('0.5')).toBe(0.5);
  });

  it('never overwrites settings saved by a newer build: changes last for the session', () => {
    const newer = JSON.stringify({ version: 2, renderer: { pick: 'webgl' } });
    const s = memoryStorage({ [SETTINGS_KEY]: newer });
    expect(loadSetting('renderer', renderer, 'auto', s)).toBe('auto');
    saveSetting('renderer', 'webgl', s);
    expect(s.getItem(SETTINGS_KEY)).toBe(newer);
  });

  it('parses the stored object once for many reads, and again only when its text changes', () => {
    const s = memoryStorage({ [SETTINGS_KEY]: JSON.stringify({ version: 1, renderer: 'webgl' }) });
    const parse = vi.spyOn(JSON, 'parse');
    for (let i = 0; i < 20; i++) loadSetting('renderer', renderer, 'auto', s);
    expect(parse).toHaveBeenCalledTimes(1);
    s.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, renderer: 'webgpu' }));
    expect(loadSetting('renderer', renderer, 'auto', s)).toBe('webgpu');
    expect(parse).toHaveBeenCalledTimes(2);
    parse.mockRestore();
  });
});

describe('settings written once a slider settles', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('holds a run of slider steps and writes once, while reads see each step at once', () => {
    vi.useFakeTimers();
    const s = memoryStorage();
    for (let i = 1; i <= 10; i++) {
      saveSettingSoon('volume.master', i / 10, s);
      vi.advanceTimersByTime(SETTINGS_WRITE_DELAY_MS / 4);
    }
    expect(s.writes).toBe(0);
    expect(loadSetting('volume.master', volume, 0, s)).toBe(1);
    vi.advanceTimersByTime(SETTINGS_WRITE_DELAY_MS);
    expect(s.writes).toBe(1);
    expect(JSON.parse(s.getItem(SETTINGS_KEY)!)).toEqual({ version: 1, 'volume.master': 1 });
  });

  it('writes what is waiting at once when flushed (the page hidden or closed), and a direct save takes it along', () => {
    vi.useFakeTimers();
    const s = memoryStorage();
    saveSettingSoon('volume.music', 0.3, s);
    flushSettings(s);
    expect(s.writes).toBe(1);
    expect(JSON.parse(s.getItem(SETTINGS_KEY)!)['volume.music']).toBe(0.3);
    saveSettingSoon('volume.music', 0.4, s);
    saveSetting('renderer', 'webgl', s);
    expect(JSON.parse(s.getItem(SETTINGS_KEY)!)).toEqual({ version: 1, 'volume.music': 0.4, renderer: 'webgl' });
    vi.advanceTimersByTime(SETTINGS_WRITE_DELAY_MS * 2);
    expect(s.writes).toBe(2); // nothing left waiting
  });
});
