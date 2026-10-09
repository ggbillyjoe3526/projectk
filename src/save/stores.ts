import { KEY_BINDINGS_KEY } from '../input/keyBindings';
import { SETTINGS_KEY, SETTINGS_VERSION } from '../settings/storage';

/**
 * The stores a save holds, each one key in the browser that its own module reads and writes as the game runs.
 * `version`: the format the store's own module writes now (0: it carries none). A store added later (the game's
 * progress) joins this list; a save without it simply leaves it at its defaults.
 */
export const SAVE_STORES = [
  { id: 'settings', key: SETTINGS_KEY, version: SETTINGS_VERSION },
  { id: 'keyBindings', key: KEY_BINDINGS_KEY, version: 0 },
] as const;

export type StoreId = (typeof SAVE_STORES)[number]['id'];

/** Each store's stored value (parsed), or null when it has nothing saved (its defaults). */
export type StoreData = Partial<Record<StoreId, unknown>>;
