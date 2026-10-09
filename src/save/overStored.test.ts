import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../testSupport/memoryStorage';
import { KEY_BINDINGS_KEY, KeyBindings } from '../input/keyBindings';
import { SETTINGS_KEY, saveSetting } from '../settings/storage';
import { overStored } from './overStored';
import { GuardedStorage } from './guardedStorage';
import { parseSaveText, saveFileText, SAVE_FORMAT } from './saveFile';
import { SaveManager } from './saveManager';

/** What a build doesn't recognise is kept on load and on the next save. */
describe('overStored: unknown fields survive a store\'s next save', () => {
  it('lays the fresh fields over what is stored, and keeps the rest', () => {
    const s = new MemoryStorage();
    s.setItem('k', JSON.stringify({ a: 1, later: { x: [1, 2] } }));
    expect(overStored(s, 'k', { a: 2, b: 3 })).toEqual({ a: 2, b: 3, later: { x: [1, 2] } });
  });

  it('is just the fresh fields when nothing, junk or a non-object is stored', () => {
    const s = new MemoryStorage();
    expect(overStored(s, 'k', { a: 1 })).toEqual({ a: 1 });
    s.setItem('k', 'not json');
    expect(overStored(s, 'k', { a: 1 })).toEqual({ a: 1 });
    s.setItem('k', '[1,2]');
    expect(overStored(s, 'k', { a: 1 })).toEqual({ a: 1 });
    s.setItem('k', '5');
    expect(overStored(s, 'k', { a: 1 })).toEqual({ a: 1 });
    expect(overStored({ getItem: () => { throw new Error('blocked'); } }, 'k', { a: 1 })).toEqual({ a: 1 });
  });

  it('key bindings keep an action a newer build added', () => {
    const s = new MemoryStorage();
    s.setItem(KEY_BINDINGS_KEY, JSON.stringify({ hoverboard: ['KeyH'] }));
    const b = new KeyBindings(s);
    expect(b.rebind('phone', 'KeyX')).toBe(true);
    const saved = JSON.parse(s.getItem(KEY_BINDINGS_KEY)!);
    expect(saved.hoverboard).toEqual(['KeyH']);
    expect(saved.phone).toEqual(['KeyX']);
  });

  it('settings keep a field they do not know', () => {
    const s = new MemoryStorage();
    s.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, frameRateCap: 30, laterField: 'kept' }));
    saveSetting('frameRateCap', 60, s);
    expect(JSON.parse(s.getItem(SETTINGS_KEY)!)).toEqual({ version: 1, frameRateCap: 60, laterField: 'kept' });
  });

  it('a field carried in by a save file stays after the loaded save is played and saved again', () => {
    // A file written by a newer build: an unknown field in the settings and an unknown action in the key bindings.
    const file = saveFileText({
      format: SAVE_FORMAT,
      build: 'v9',
      savedAt: '2026-10-09T10:00:00.000Z',
      stores: { settings: { version: 1, showFps: false, futureField: 'kept' }, keyBindings: { hoverboard: ['KeyH'] } },
    });
    const parsed = parseSaveText(file);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    // Loaded into the browser, then the next visit plays and saves.
    const backing = new MemoryStorage();
    const manager = new SaveManager({ storage: new GuardedStorage(backing), build: 'b', reload: () => undefined });
    manager.replace(parsed.save, 'load');
    const next = new GuardedStorage(backing);
    saveSetting('showFps', true, next);
    new KeyBindings(next).rebind('phone', 'KeyX');
    expect(JSON.parse(backing.getItem(SETTINGS_KEY)!)).toMatchObject({ showFps: true, futureField: 'kept' });
    expect(JSON.parse(backing.getItem(KEY_BINDINGS_KEY)!)).toMatchObject({ hoverboard: ['KeyH'], phone: ['KeyX'] });
  });
});
