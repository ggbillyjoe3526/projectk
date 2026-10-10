/**
 * The save system's numbers: everything the game keeps saves in the browser, under one key prefix; a save file can be
 * downloaded and loaded back. Format and migrations: `save/saveFile.ts`.
 */

/** Every key the game writes in browser storage starts with this, so the guarded storage can tell its own writes apart. */
export const STORAGE_PREFIX = 'outbound.';

/**
 * The prefix the game's keys had under its first working title. A browser that still holds keys under it has them
 * moved across once, at start-up (save/guardedStorage.ts), so settings, bindings and the save carry over.
 */
export const LEGACY_STORAGE_PREFIX = 'projectk.';

/** The save layer's own keys in the browser, beside the stores it bundles (save/stores.ts). */
export const SAVE_KEYS = {
  /** Which save format last wrote this browser's save, when it last saved and when it was last downloaded. */
  meta: `${STORAGE_PREFIX}save.meta`,
  /** The daily restore points (newest first). */
  restorePoints: `${STORAGE_PREFIX}save.restore`,
  /** The save as it was before the last load, restore or delete (Undo). */
  undo: `${STORAGE_PREFIX}save.undo`,
} as const;

/** What a save file says it is (`game`), so a stray JSON file is told apart. */
export const SAVE_GAME_ID = 'Project Outbound';

/** What save files written under the game's first working title say, still read as this game's. */
export const LEGACY_SAVE_GAME_IDS: readonly string[] = ['ProjectK'];

/** Restore points kept, one per day the game is opened. */
export const RESTORE_POINTS = 3;

/** A file bigger than this (bytes) is refused before it is read. */
export const SAVE_FILE_MAX_BYTES = 2 * 1024 * 1024;

/** The downloaded file's name, for a date ("project-outbound-save-2026-10-09.json"). */
export const SAVE_FILE_PREFIX = 'project-outbound-save-';

/**
 * The tab lock: the Web Lock's name, the channel's, the session key a tab sets as Play here reloads it (so the reloaded
 * tab waits its turn for the lock), how long a new tab listens for an open one before it takes the save where there are
 * no Web Locks (ms), and how long Play here waits for the playing tab to let go (and the reloaded tab for the lock).
 */
export const TAB_LOCK = {
  lockName: `${STORAGE_PREFIX}save`,
  channel: `${STORAGE_PREFIX}tabs`,
  tookSaveKey: `${STORAGE_PREFIX}tookSave`,
  answerWaitMs: 300,
  releaseWaitMs: 600,
} as const;

/** How long (ms) a download link stays alive after the click: Firefox reads it after the click returns. */
export const DOWNLOAD_URL_LIFETIME_MS = 10_000;

/** A run of setting changes (a slider dragged) is written once, this long (ms) after the last (settings/storage.ts). */
export const SETTINGS_WRITE_DELAY_MS = 400;
