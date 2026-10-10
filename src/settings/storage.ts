/**
 * The player's saved settings: one versioned object in the browser (`outbound.settings`), so new settings and later
 * format changes have one place to go. Key bindings keep their own key (input/keyBindings.ts). Every read and write
 * tolerates blocked storage and garbage.
 *
 * The object is parsed once per stored text, not once per setting. An object from a newer build (a higher version) is
 * neither read nor overwritten: an older build opened after a newer one keeps its changes for the session only.
 */

import { SETTINGS_WRITE_DELAY_MS, STORAGE_PREFIX } from '../config/save';
import { guardedStorage } from '../save/guardedStorage';

export const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;
export const SETTINGS_VERSION = 1;

/**
 * What each setting is called in the stored object. A field is added here as its setting is built; fields are only
 * ever added, and each is read with a fallback.
 */
export type SettingField =
  /** Settings › Graphics › Renderer (config/renderBackend.ts): 'auto', 'webgpu' or 'webgl'. From the next load. */
  | 'renderer'
  /** Settings › Graphics › Quality: a preset or 'custom' (config/render.ts QualityChoice). */
  | 'quality'
  /** The Custom rows, one per quality field: read when Quality is Custom. */
  | `graphics.${string}`
  /** Settings › Graphics: the frame-rate cap and the FPS readout (not part of a preset). */
  | 'frameRateCap'
  | 'showFps'
  /** A volume slider on Settings › Audio, by bus. */
  | `volume.${string}`;

interface StoredSettings {
  version: number;
  [field: string]: unknown;
}

/**
 * Where the game keeps what it saves: the save system's guarded storage once it has started
 * (save/guardedStorage.ts: it notices writes, keeps refused ones for the visit and can be frozen); before that, and in
 * unit tests, localStorage, or null where the browser blocks it (settings then last for the session only).
 */
export function browserStorage(): Storage | null {
  const guarded = guardedStorage();
  if (guarded) return guarded;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * The last text parsed for each storage and what it gave (null: nothing this build can read), with any changes not
 * written yet (`dirty`, saveSettingSoon) and the timer that will write them.
 */
interface ParsedSettings {
  text: string | null;
  settings: StoredSettings | null;
  newer: boolean;
  dirty: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}
const parsed = new WeakMap<Storage, ParsedSettings>();

/**
 * The stored settings as this build reads them: the object parsed (once per stored text) and migrated
 * from an older format. `newer`: the object is from a newer build, so this build neither reads nor overwrites it.
 */
function readStored(storage: Storage): ParsedSettings {
  const text = storage.getItem(SETTINGS_KEY);
  const cached = parsed.get(storage);
  if (cached && cached.text === text) return cached;
  let raw: unknown = null;
  try {
    raw = JSON.parse(text ?? 'null');
  } catch {
    // Unreadable: treated as nothing saved.
  }
  const version = raw && typeof raw === 'object' ? (raw as StoredSettings).version : undefined;
  const newer = typeof version === 'number' && version > SETTINGS_VERSION;
  const entry: ParsedSettings = { text, settings: newer ? null : migrate(raw), newer, dirty: false, timer: null };
  parsed.set(storage, entry);
  return entry;
}

/**
 * Brings a stored object to SETTINGS_VERSION; null if nothing usable is stored. One case per format change: the next
 * version adds `case 1:` turning a version 1 object into a version 2 one, and so on. Added fields need no case: a
 * reader falls back to its default for a field it doesn't find.
 */
export function migrate(raw: unknown): StoredSettings | null {
  const stored: StoredSettings | null = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as StoredSettings) : null;
  switch (stored?.version) {
    case SETTINGS_VERSION:
      return stored;
    default:
      return null;
  }
}

/**
 * The saved value of `field`, or `fallback` if nothing valid is saved (or storage is blocked). `parse` turns
 * a stored value (the object's field, or an old key's string) into a setting, or returns undefined to reject it.
 */
export function loadSetting<T>(field: SettingField, parse: (raw: unknown) => T | undefined, fallback: T, storage = browserStorage()): T {
  if (!storage) return fallback;
  try {
    const stored = readStored(storage).settings;
    if (stored && field in stored) {
      const v = parse(stored[field]);
      if (v !== undefined) return v;
    }
  } catch {
    // Storage unavailable (private mode etc.): fall back to the default.
  }
  return fallback;
}

/**
 * Saves `field` into the settings object. Non-critical.
 * Not over an object from a newer build: the change then lasts for this session only.
 */
export function saveSetting(field: SettingField, value: string | number | boolean, storage = browserStorage()): void {
  if (!storage) return;
  try {
    const read = readStored(storage);
    if (read.newer) return;
    write(storage, { ...(read.settings ?? { version: SETTINGS_VERSION }), [field]: value });
  } catch {
    // Non-critical: the setting still applies for this session.
  }
}

/**
 * Saves `field` a moment later (SETTINGS_WRITE_DELAY_MS after the last such change): a slider
 * dragged or stepped with the keys writes the settings once, not once per step. Reads see the new value at once. The
 * game writes what is waiting when the page is hidden or closed (flushSettings).
 */
export function saveSettingSoon(field: SettingField, value: string | number | boolean, storage = browserStorage()): void {
  if (!storage) return;
  try {
    const read = readStored(storage);
    if (read.newer) return;
    read.settings = { ...(read.settings ?? { version: SETTINGS_VERSION }), [field]: value };
    read.dirty = true;
    if (read.timer !== null) clearTimeout(read.timer);
    read.timer = setTimeout(() => flushSettings(storage), SETTINGS_WRITE_DELAY_MS);
  } catch {
    // Non-critical: the setting still applies for this session.
  }
}

/** Writes any changes saveSettingSoon is holding, now. */
export function flushSettings(storage = browserStorage()): void {
  const read = storage ? parsed.get(storage) : undefined;
  if (!storage || !read?.dirty || !read.settings) return;
  try {
    write(storage, read.settings);
  } catch {
    // Non-critical, as saveSetting.
  }
}

/** Writes the whole object and remembers its text. */
function write(storage: Storage, settings: StoredSettings): void {
  const old = parsed.get(storage);
  if (old?.timer) clearTimeout(old.timer);
  const text = JSON.stringify(settings);
  parsed.set(storage, { text, settings, newer: false, dirty: false, timer: null });
  storage.setItem(SETTINGS_KEY, text);
}

/** A parser for settings that are one of a fixed set of ids (the renderer, the quality preset). */
export function oneOf<T extends string>(ids: readonly T[]): (raw: unknown) => T | undefined {
  return (raw) => ids.find((id) => id === raw);
}

/** A parser for a number setting in [min, max] (a number, or a string holding one). */
export function numberIn(min: number, max: number): (raw: unknown) => number | undefined {
  return (raw) => {
    const v = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : Number.NaN;
    return Number.isFinite(v) && v >= min && v <= max ? v : undefined;
  };
}
