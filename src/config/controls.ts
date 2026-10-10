/**
 * Keyboard and mouse actions and their default keys (concept v0.6 section 7: keyboard and mouse only). Keys are
 * KeyboardEvent.code values; mouse buttons are `Mouse<n>` (MouseEvent.button) and the wheel's two directions are
 * WHEEL_CODES, so any action can sit on a key, a mouse button or a wheel notch (input/keyBindings.ts).
 */
export const DEFAULT_BINDINGS = {
  /** Walk toward the pointer. There is no strafing or walking back: the mouse steers (William, 2026-10-10). */
  forward: ['KeyW', 'ArrowUp'],
  attack: ['Mouse0'],
  /** Right click. (Left Shift deflected too until sprint took it.) */
  deflect: ['Mouse2'],
  /**
   * Tap while walking: sprint on until tapped again or the player stops, spending stamina (William, 2026-10-10: a
   * toggle, input/sprintToggle.ts). Left Shift only: on Left Alt, letting go opened the browser's menu on Windows,
   * which swallowed the release of W and left the player walking.
   */
  sprint: ['ShiftLeft'],
  /** The quick step back, away from the pointer. */
  step: ['Space'],
  /** Hold: kneel, palm on stone, and listen to the island. */
  listen: ['KeyF'],
  /** Swap the off-hand item. */
  swapOffHand: ['KeyQ'],
  interact: ['KeyE'],
  /** The phone: notes, photos, map, tide times, messages. Also the menu. */
  phone: ['Tab'],
  /** Pause (Escape pauses too, but can't be bound: in fullscreen the browser takes it). */
  pause: ['KeyP'],
  /** F11 is the browser's own and would leave the page's fullscreen; F10 is free once the game takes it. */
  fullscreen: ['F10'],
  debugOverlay: ['Backquote', 'F3'],
  /** Development: run island time faster (×1, ×4, ×16, ×64, then back to ×1) to watch a whole tide. */
  debugTimeScale: ['BracketRight'],
  /** The deflect timing readout (early, late, perfect, in milliseconds), on by default in the prototype. */
  debugFightReadout: ['F4'],
} as const satisfies Record<string, readonly string[]>;

export type Action = keyof typeof DEFAULT_BINDINGS;

/** Actions players can rebind, in the order the settings list them, with their labels. The debug keys (`debug…`) are not listed. */
export const REBINDABLE: readonly { action: Action; label: string }[] = [
  { action: 'forward', label: 'Walk' },
  { action: 'attack', label: 'Attack' },
  { action: 'deflect', label: 'Deflect' },
  { action: 'sprint', label: 'Sprint (toggle)' },
  { action: 'step', label: 'Step back' },
  { action: 'listen', label: 'Listen (hold)' },
  { action: 'swapOffHand', label: 'Swap off-hand item' },
  { action: 'interact', label: 'Interact' },
  { action: 'phone', label: 'Phone' },
  { action: 'pause', label: 'Pause' },
  { action: 'fullscreen', label: 'Fullscreen' },
];

/**
 * Default keys that moved when a later action took them: bindings saved before `added` existed, with `action` still on
 * its `old` keys, give `action` its new default instead, so `added` gets its default key rather than none (the player
 * never chose `old`; input/keyBindings.ts). Saved sets that have `added` are left as they are.
 */
export const MOVED_DEFAULTS: readonly { action: Action; old: readonly string[]; added: Action }[] = [
  // Sprint took Left Shift from deflect (2026-10-10).
  { action: 'deflect', old: ['Mouse2', 'ShiftLeft'], added: 'sprint' },
];

/**
 * Keys that can't be bound: Escape pauses (the browser releases the pointer), Meta/OS keys, and keys the browser can't
 * name (`Unidentified`: unmapped media or Fn keys), which would never match again. An empty code is refused too.
 */
export const UNBINDABLE_KEYS: ReadonlySet<string> = new Set(['Escape', 'MetaLeft', 'MetaRight', 'ContextMenu', 'Unidentified']);

/**
 * The browser's own keys, which can't be bound either: F5 reloads the page, F11 and F12 (fullscreen, developer tools)
 * are taken by the browser before the page sees them, and the rest navigate or capture the screen.
 */
export const BROWSER_KEYS: ReadonlySet<string> = new Set(['F5', 'F11', 'F12', 'BrowserBack', 'BrowserForward', 'BrowserRefresh', 'PrintScreen', 'Pause']);

/** The mouse wheel as two binding codes: one notch up or down is a press and release of its code (a tap). */
export const WHEEL_CODES = { up: 'WheelUp', down: 'WheelDown' } as const;

/** How many keys each action can have: a main key and a second one. */
export const KEY_SLOTS = 2;

/**
 * Actions the game can't be played without: their last key can't be cleared, and another action can't take it from
 * them when they would be left with none.
 */
export const ESSENTIAL_ACTIONS: ReadonlySet<Action> = new Set<Action>(['forward', 'attack', 'deflect']);

/**
 * Keys whose browser default is blocked while playing, whether bound or not (input/keyboard.ts): scrolling, the find
 * bar, the menu bar, and Tab moving keyboard focus off the game to the page's buttons.
 */
export const PREVENT_DEFAULT_KEYS: ReadonlySet<string> = new Set(['Space', 'F3', 'F4', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'AltLeft', 'AltRight', 'Tab']);
