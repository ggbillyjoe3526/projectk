import { describe, expect, it } from 'vitest';
import { DEFAULT_BINDINGS, REBINDABLE } from '../config/controls';
import { bindable, describeKeys, KEY_BINDINGS_KEY, KeyBindings, type KeyValueStore, keyLabel, mouseButtonCode } from './keyBindings';

class MemoryStore implements KeyValueStore {
  readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('KeyBindings', () => {
  it('starts with the defaults: WASD and the arrows move, the mouse buttons attack and deflect', () => {
    const b = new KeyBindings(null);
    expect(b.codes('forward')).toEqual(['KeyW', 'ArrowUp']);
    expect(b.actionOf('KeyW')).toBe('forward');
    expect(b.actionOf('ArrowUp')).toBe('forward');
    expect(b.primary('attack')).toBe('Mouse0');
    expect(b.primary('deflect')).toBe('Mouse2');
    expect(b.primary('listen')).toBe('KeyF');
    expect(b.actionOf('KeyP')).toBeUndefined();
  });

  it('lists every action but the debug keys for rebinding', () => {
    const listed = new Set(REBINDABLE.map((r) => r.action));
    for (const action of Object.keys(DEFAULT_BINDINGS)) expect(listed.has(action as never), action).toBe(action !== 'debugOverlay');
  });

  it('lets attack and deflect move to a key or a side button', () => {
    const b = new KeyBindings(null);
    expect(b.rebind('interact', 'Mouse3')).toBe(true);
    expect(b.actionOf('Mouse3')).toBe('interact');
    // Deflect takes attack's main button: they swap.
    expect(b.rebind('deflect', 'Mouse0')).toBe(true);
    expect(b.primary('attack')).toBe('Mouse2');
    expect(b.rebind('attack', 'KeyJ')).toBe(true);
    expect(b.label('attack')).toBe('J');
  });

  it('rebinding the main key keeps the second one', () => {
    const b = new KeyBindings(null);
    expect(b.rebind('forward', 'KeyI')).toBe(true);
    expect(b.codes('forward')).toEqual(['KeyI', 'ArrowUp']);
    expect(b.actionOf('KeyW')).toBeUndefined();
    expect(b.actionOf('ArrowUp')).toBe('forward');
  });

  it("binds a second key in slot 1, and an action's own second key swaps places with its main key", () => {
    const b = new KeyBindings(null);
    expect(b.rebind('interact', 'KeyT', 1)).toBe(true);
    expect(b.codes('interact')).toEqual(['KeyE', 'KeyT']);
    expect(b.rebind('interact', 'KeyT', 0)).toBe(true);
    expect(b.codes('interact')).toEqual(['KeyT', 'KeyE']);
    expect(b.rebind('interact', 'KeyY', 2)).toBe(false); // two slots only
  });

  it("a second key taken from another action's only key leaves that action unbound, unless it is essential", () => {
    const b = new KeyBindings(null);
    expect(b.rebind('step', 'KeyQ', 1)).toBe(true);
    expect(b.codes('step')).toEqual(['Space', 'KeyQ']);
    expect(b.codes('swapOffHand')).toEqual([]);
    // Attack is essential: taking its only button into a second slot would strand it.
    expect(b.strands('deflect', 'Mouse0', 1)).toBe('attack');
    expect(b.rebind('deflect', 'Mouse0', 1)).toBe(false);
    expect(b.primary('attack')).toBe('Mouse0');
    // Into the main slot it is a swap, which strands nothing.
    expect(b.strands('deflect', 'Mouse0', 0)).toBeNull();
  });

  it('clears a key with unbind; the second key moves up; an essential action keeps its last key', () => {
    const store = new MemoryStore();
    const b = new KeyBindings(store);
    expect(b.unbind('forward', 0)).toBe(true);
    expect(b.codes('forward')).toEqual(['ArrowUp']);
    expect(b.unbind('forward', 0)).toBe(false); // the last key of Move forward
    expect(b.unbind('step', 0)).toBe(true);
    expect(b.codes('step')).toEqual([]);
    expect(b.unbind('step', 0)).toBe(false); // nothing to clear
    expect(b.unbind('debugOverlay', 0)).toBe(false);
    const again = new KeyBindings(store);
    expect(again.codes('step')).toEqual([]);
    expect(again.codes('forward')).toEqual(['ArrowUp']);
  });

  it('names the main key for on-screen hints, following a rebind', () => {
    const b = new KeyBindings(null);
    expect(b.label('interact')).toBe('E');
    expect(b.label('attack')).toBe('Left mouse');
    b.rebind('interact', 'KeyX');
    expect(b.label('interact')).toBe('X');
  });

  it("swaps keys when the new key is another action's main key", () => {
    const b = new KeyBindings(null);
    b.rebind('interact', 'KeyF');
    expect(b.codes('interact')).toEqual(['KeyF']);
    expect(b.codes('listen')).toEqual(['KeyE']);
  });

  it("taking another action's extra key just removes it there", () => {
    const b = new KeyBindings(null);
    b.rebind('step', 'ArrowUp');
    expect(b.codes('step')).toEqual(['ArrowUp']);
    expect(b.codes('forward')).toEqual(['KeyW']);
    expect(b.actionOf('Space')).toBeUndefined();
  });

  it('refuses keys that cannot be bound', () => {
    const b = new KeyBindings(null);
    expect(b.rebind('step', 'Escape')).toBe(false);
    expect(b.primary('step')).toBe('Space');
    expect(b.rebind('interact', '')).toBe(false);
    expect(b.rebind('interact', 'Unidentified')).toBe(false);
    expect(b.codes('interact')).toEqual(['KeyE']);
  });

  it('keeps the debug keys reserved: they never swap onto a player key', () => {
    const b = new KeyBindings(null);
    expect(b.rebind('step', 'Backquote')).toBe(false);
    expect(b.rebind('interact', 'F3')).toBe(false);
    expect(b.codes('step')).toEqual(['Space']);
    expect(b.codes('debugOverlay')).toEqual(['Backquote', 'F3']);
    expect(b.rebind('debugOverlay', 'KeyP')).toBe(false);
  });

  it('saves changes and loads them in a new session', () => {
    const store = new MemoryStore();
    const a = new KeyBindings(store);
    a.rebind('forward', 'KeyI');
    const b = new KeyBindings(store);
    expect(b.primary('forward')).toBe('KeyI');
    expect(b.codes('forward')).toEqual(['KeyI', 'ArrowUp']); // the second key stays
  });

  it('resets to the defaults and notifies listeners', () => {
    const store = new MemoryStore();
    const b = new KeyBindings(store);
    let notified = 0;
    b.onChange(() => notified++);
    b.rebind('step', 'KeyJ');
    b.reset();
    expect(notified).toBe(2);
    expect(b.primary('step')).toBe('Space');
    expect(new KeyBindings(store).primary('step')).toBe('Space');
  });

  it('ignores corrupt or invalid saved data', () => {
    const store = new MemoryStore();
    store.setItem(KEY_BINDINGS_KEY, '{not json');
    expect(new KeyBindings(store).primary('step')).toBe('Space');
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify({ step: ['Escape'], interact: [3], nonsense: ['KeyX'] }));
    const b = new KeyBindings(store);
    expect(b.primary('step')).toBe('Space');
    expect(b.primary('interact')).toBe('KeyE');
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify({ interact: [''], step: ['Unidentified'] }));
    const c = new KeyBindings(store);
    expect(c.codes('interact')).toEqual(['KeyE']);
    expect(c.codes('step')).toEqual(['Space']);
  });

  it('falls back to the defaults when saved data would leave an action without a key', () => {
    const store = new MemoryStore();
    // A cleared action stays cleared, but an essential one never loads with no key.
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify({ step: [], forward: [] }));
    expect(new KeyBindings(store).codes('step')).toEqual([]);
    expect(new KeyBindings(store).codes('forward')).toEqual(['KeyW', 'ArrowUp']);
    // Forward and Listen both saved on F: one would end up with none, so the whole set goes back to the defaults.
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify({ forward: ['KeyF'], listen: ['KeyF'] }));
    const b = new KeyBindings(store);
    expect(b.codes('forward')).toEqual(['KeyW', 'ArrowUp']);
    expect(b.codes('listen')).toEqual(['KeyF']);
  });

  it("keeps the player's own keys when a newly added action's default clashes with one (the new action stays unbound)", () => {
    const store = new MemoryStore();
    // Saved before Phone existed, with Tab on Interact.
    const before: Record<string, readonly string[]> = { ...DEFAULT_BINDINGS, interact: ['Tab'] };
    delete before.phone;
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify(before));
    const b = new KeyBindings(store);
    expect(b.codes('interact')).toEqual(['Tab']);
    expect(b.codes('phone')).toEqual([]);
    expect(b.primary('phone')).toBe('');
    // The player can give it a key afterwards.
    expect(b.rebind('phone', 'KeyP')).toBe(true);
    expect(b.codes('phone')).toEqual(['KeyP']);
    expect(b.codes('interact')).toEqual(['Tab']);
  });

  it('gives a set saved before an action existed that action\'s default when nothing else took it', () => {
    const before: Record<string, readonly string[]> = { ...DEFAULT_BINDINGS };
    delete before.phone;
    const store = new MemoryStore();
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify(before));
    expect(new KeyBindings(store).codes('phone')).toEqual(['Tab']);
  });

  it('gives reserved debug keys priority over saves that used them', () => {
    const store = new MemoryStore();
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify({ step: ['Backquote', 'KeyJ'] }));
    const b = new KeyBindings(store);
    expect(b.codes('debugOverlay')).toEqual(['Backquote', 'F3']);
    expect(b.codes('step')).toEqual(['KeyJ']);
  });

  it('never leaves one key on two actions after loading', () => {
    const store = new MemoryStore();
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify({ step: ['KeyW'] }));
    const b = new KeyBindings(store);
    const owners = (Object.keys(DEFAULT_BINDINGS) as (keyof typeof DEFAULT_BINDINGS)[]).filter((a) => b.codes(a).includes('KeyW'));
    expect(owners).toHaveLength(1);
  });

  it('keeps actions it does not know when it saves (a newer build\'s, or a loaded save\'s)', () => {
    const store = new MemoryStore();
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify({ futureAction: ['KeyK'] }));
    new KeyBindings(store).rebind('step', 'KeyJ');
    expect(JSON.parse(store.getItem(KEY_BINDINGS_KEY)!)).toMatchObject({ futureAction: ['KeyK'], step: ['KeyJ'] });
  });

  it('survives storage that throws', () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    const b = new KeyBindings(broken);
    expect(b.rebind('step', 'KeyJ')).toBe(true);
    expect(b.primary('step')).toBe('KeyJ');
  });
});

describe('bindable', () => {
  it('takes named keys and mouse buttons, not Escape, OS keys or a key the browser could not name', () => {
    expect(bindable('KeyT')).toBe(true);
    expect(bindable('Mouse3')).toBe(true);
    for (const code of ['', 'Unidentified', 'Escape', 'MetaLeft', 'ContextMenu']) expect(bindable(code)).toBe(false);
  });

  it("refuses the browser's own keys: reload, fullscreen, developer tools, navigation", () => {
    for (const code of ['F5', 'F11', 'F12', 'BrowserBack', 'BrowserForward', 'BrowserRefresh', 'PrintScreen', 'Pause']) expect(bindable(code)).toBe(false);
    expect(bindable('F10')).toBe(true);
    expect(bindable('WheelUp')).toBe(true);
    expect(new KeyBindings(null).rebind('interact', 'F5')).toBe(false);
  });

  it('drops a saved binding on a key that is no longer bindable, keeping the default', () => {
    const store = new MemoryStore();
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify({ interact: ['F5'] }));
    expect(new KeyBindings(store).codes('interact')).toEqual(['KeyE']);
  });

  it('gives an essential action its default back when its saved key is refused and another action holds that default', () => {
    const store = new MemoryStore();
    store.setItem(KEY_BINDINGS_KEY, JSON.stringify({ attack: ['F5'], step: ['Mouse0'], interact: ['KeyT'] }));
    const keys = new KeyBindings(store);
    expect(keys.codes('attack')).toEqual(['Mouse0']);
    expect(keys.codes('step')).toEqual([]); // shown as "—" until the player picks a key
    expect(keys.codes('interact')).toEqual(['KeyT']); // the rest of their bindings kept
  });
});

describe('describeKeys', () => {
  it('lists every key, showing a Left+Right modifier pair as one', () => {
    expect(describeKeys(['KeyW', 'ArrowUp'])).toBe('W / ↑');
    expect(describeKeys(['ShiftLeft', 'ShiftRight'])).toBe('Shift');
    expect(describeKeys(['ShiftRight', 'ShiftLeft'])).toBe('Shift');
    expect(describeKeys(['AltLeft', 'ShiftRight'])).toBe('Left Alt / Right Shift');
    expect(describeKeys(['ControlLeft', 'ControlRight', 'KeyX'])).toBe('Ctrl / X');
  });
});

describe('keyLabel', () => {
  it('gives readable key names', () => {
    expect(keyLabel('KeyW')).toBe('W');
    expect(keyLabel('Digit1')).toBe('1');
    expect(keyLabel('ShiftLeft')).toBe('Left Shift');
    expect(keyLabel('ControlRight')).toBe('Right Ctrl');
    expect(keyLabel('AltLeft')).toBe('Left Alt');
    expect(keyLabel('ArrowUp')).toBe('↑');
    expect(keyLabel('')).toBe('—');
    expect(keyLabel(mouseButtonCode(0))).toBe('Left mouse');
    expect(keyLabel(mouseButtonCode(2))).toBe('Right mouse');
    expect(keyLabel(mouseButtonCode(3))).toBe('Mouse 4');
    expect(keyLabel(mouseButtonCode(4))).toBe('Mouse 5');
    expect(keyLabel('Mouse7')).toBe('Mouse 8');
    expect(keyLabel('WheelUp')).toBe('Wheel up');
    expect(keyLabel('WheelDown')).toBe('Wheel down');
  });

  it("names a key by what the player's layout prints on it, keeping digits, arrows and named keys", () => {
    const azerty = new Map([
      ['KeyW', 'z'],
      ['KeyA', 'q'],
      ['KeyZ', 'w'],
      ['Digit1', '&'],
      ['BracketRight', '$'],
    ]);
    expect(keyLabel('KeyW', azerty)).toBe('Z');
    expect(keyLabel('KeyZ', azerty)).toBe('W');
    expect(keyLabel('BracketRight', azerty)).toBe('$');
    expect(keyLabel('Digit1', azerty)).toBe('1');
    expect(keyLabel('KeyR', azerty)).toBe('R'); // not in the map: by code
    expect(keyLabel('ShiftLeft', azerty)).toBe('Left Shift');
    expect(keyLabel('KeyW')).toBe('W'); // no layout (Firefox): US names
    expect(describeKeys(['KeyW', 'ArrowUp'], azerty)).toBe('Z / ↑');
  });

  it('follows a layout set on the bindings, telling listeners so hints rename', () => {
    const b = new KeyBindings(null);
    let changes = 0;
    b.onChange(() => changes++);
    expect(b.hasLayout).toBe(false);
    b.setLayout(new Map([['KeyQ', 'a']]));
    expect(b.label('swapOffHand')).toBe('A');
    expect(b.keyName('KeyQ')).toBe('A');
    expect(b.hasLayout).toBe(true);
    b.setLayout(new Map([['KeyQ', 'a']])); // the same layout read again: no change
    expect(changes).toBe(1);
  });
});
